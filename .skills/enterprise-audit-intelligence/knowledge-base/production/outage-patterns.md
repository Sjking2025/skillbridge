# Outage Patterns & Resiliency — Production Knowledge Base

> **Category**: Production Readiness
> **Mandatory Load**: Yes — load for production readiness and chaos engineering audit
> **Version**: v1.0

---

## Outage Pattern Library

Every pattern below represents a real class of production outage.
During audit, simulate each scenario mentally against the codebase.
Ask: "If this happened right now, what would break and how badly?"

---

## OUTAGE-001: Database Connection Pool Exhaustion

**Confidence**: 93 | **Stability**: Permanent | **Frequency**: Very Common

### How it happens
Traffic spike → more concurrent requests than pool allows → requests queue → queue fills → requests time out → errors cascade → all API endpoints fail simultaneously even though DB is healthy.

### Detection Signals in Code
- Pool `max` not configured (using framework default — often 5 or 10)
- No pool timeout configured
- Long-running queries holding connections open
- No query timeout — slow query holds connection indefinitely
- Serverless functions with per-invocation connections (no pooling proxy)

### Audit Questions
```
□ What is the pool max size? Is it appropriate for expected concurrency?
□ What happens when all pool connections are in use?
□ Is there a connection acquisition timeout?
□ Are queries bounded by a timeout?
□ Are there any queries that could run indefinitely?
```

### Resilience Fix
```javascript
// Knex — explicit pool with timeouts
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,  // fail fast if pool exhausted
    idleTimeoutMillis: 600000,
    reapIntervalMillis: 1000,
  },
  // Query timeout — no query runs more than 30s
  asyncStackTraces: process.env.NODE_ENV !== 'production',
});

// Per-query timeout on critical paths
const result = await db('orders')
  .where({ userId })
  .timeout(5000, { cancel: true }); // cancel query if > 5s
```

---

## OUTAGE-002: Memory Leak → OOM Crash

**Confidence**: 89 | **Stability**: Permanent | **Frequency**: High

### How it happens
Slow memory leak (event listeners not removed, cached objects growing, closures holding references) → heap grows over hours/days → OOM kill → process restarts → if restart is slow: downtime.

### Detection Signals in Code
- `EventEmitter` listeners added but never removed
- In-memory cache with no max size or TTL (grows forever)
- `setInterval` created but never cleared
- Closures in request handlers capturing large objects
- WebSocket connections tracked in a Map with no cleanup on disconnect

### Audit Questions
```
□ Is there any in-memory storage that grows without bound?
□ Are event listeners removed when no longer needed?
□ Are intervals and timeouts cleaned up?
□ Is there a cache size limit and eviction policy?
□ Are WebSocket/SSE connection maps cleaned on disconnect?
```

### Resilience Fix
```javascript
// In-memory cache with TTL and max size
import LRU from 'lru-cache';

const cache = new LRU({
  max: 1000,              // max items
  ttl: 1000 * 60 * 5,    // 5 minute TTL
  allowStale: false,
});

// Event listener cleanup
class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  add(id, socket) {
    this.connections.set(id, socket);
    socket.on('close', () => this.remove(id)); // ALWAYS cleanup
  }

  remove(id) {
    this.connections.delete(id);
  }
}
```

---

## OUTAGE-003: Cascading Failure From External Dependency

**Confidence**: 91 | **Stability**: Permanent | **Frequency**: Very Common

### How it happens
External API (Stripe, SendGrid, Twilio, AWS S3) goes down or gets slow → requests to it queue up → Node.js thread pool / connection pool exhausted waiting → ALL requests slow down → entire app appears down even though the issue is one external service.

### Detection Signals in Code
- No timeout on external HTTP calls
- No circuit breaker on third-party integrations
- Critical path includes non-critical external calls (analytics, logging, email)
- `await stripe.charges.create(...)` with no timeout and no fallback
- App health check depends on external services being up

### Audit Questions
```
□ What external services does the app call?
□ What happens if each one is slow or unavailable?
□ Are there timeouts on all external HTTP calls?
□ Are circuit breakers implemented for high-traffic integrations?
□ Are non-critical external calls async/queued (not in the request path)?
```

### Resilience Fix
```javascript
import CircuitBreaker from 'opossum';

// Wrap any external call in a circuit breaker
const stripeBreaker = new CircuitBreaker(
  async (chargeParams) => stripe.charges.create(chargeParams),
  {
    timeout: 5000,                  // fail if > 5s
    errorThresholdPercentage: 50,   // open if > 50% fail
    resetTimeout: 30000,            // retry after 30s
    volumeThreshold: 5,             // need 5 calls before tracking %
  }
);

// Fallback — queue for retry rather than hard fail
stripeBreaker.fallback(async (chargeParams) => {
  await paymentRetryQueue.add(chargeParams, { attempts: 3, backoff: 5000 });
  return { status: 'queued', message: 'Payment queued for processing' };
});

// Non-critical paths: always async, never in request path
app.post('/orders', async (req, res) => {
  const order = await orderService.create(req.validated);
  res.status(201).json(order); // respond immediately

  // Non-critical: fire and forget with error isolation
  analyticsService.track('order.created', order).catch(err =>
    logger.warn({ err }, 'Analytics track failed — non-critical')
  );
  emailService.sendConfirmation(order).catch(err =>
    logger.warn({ err }, 'Confirmation email failed — queued for retry')
  );
});
```

---

## OUTAGE-004: Thundering Herd on Cache Expiry

**Confidence**: 82 | **Stability**: Permanent | **Frequency**: Medium

### How it happens
Popular cached item expires → 100+ concurrent requests all miss cache simultaneously → all hit DB with the same expensive query → DB overwhelmed → slow responses → more cache misses → death spiral.

### Detection Signals in Code
- Cache with fixed TTL on high-traffic keys (no jitter, no lock)
- Popular homepage/listing data cached without stampede protection
- Cache-aside pattern with no mutex on cache miss

### Resilience Fix
```javascript
// Cache with mutex — only one request populates on miss
import Mutex from 'async-mutex';

const mutex = new Mutex();
const CACHE_TTL = 300; // 5 minutes

const getPopularProducts = async () => {
  const cached = await redis.get('popular_products');
  if (cached) return JSON.parse(cached);

  // Acquire lock — only ONE request populates the cache
  const release = await mutex.acquire();
  try {
    // Double-check after acquiring lock (another request may have populated it)
    const rechecked = await redis.get('popular_products');
    if (rechecked) return JSON.parse(rechecked);

    const products = await db('products').orderBy('sales', 'desc').limit(20);

    // Add jitter to TTL to prevent synchronized expiry across instances
    const jitter = Math.floor(Math.random() * 60); // 0-60s jitter
    await redis.setex('popular_products', CACHE_TTL + jitter, JSON.stringify(products));

    return products;
  } finally {
    release();
  }
};
```

---

## OUTAGE-005: Deployment Causing Downtime

**Confidence**: 90 | **Stability**: Permanent | **Frequency**: Very Common

### How it happens
New deployment kills old processes before new ones are healthy → gap in service → 502 errors to users. Or: new code deployed but DB migration not run yet → errors on new code paths. Or: rollback needed but no rollback procedure → extended downtime.

### Detection Signals in Code and Infra
- No rolling deployment strategy (kills all old, starts all new simultaneously)
- DB migrations run at app startup (race condition between instances)
- No readiness probe (traffic sent before app is ready)
- `latest` Docker tag used (no pinned version → can't roll back)
- No deployment runbook

### Resilience Fix
```yaml
# Kubernetes rolling deployment
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # one extra pod during update
      maxUnavailable: 0    # zero pods down during update

  template:
    spec:
      containers:
        - name: api
          image: yourimage:a3f9c12  # always use git SHA, never 'latest'
          readinessProbe:
            httpGet:
              path: /readyz
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 3
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sleep", "5"]  # drain in-flight requests
```

```bash
# Deployment runbook (document this)
# 1. Run migrations separately, before deploy
kubectl exec deploy/api -- npx knex migrate:latest

# 2. Deploy with health check verification
kubectl set image deploy/api api=yourimage:$NEW_SHA
kubectl rollout status deploy/api --timeout=120s

# 3. Verify
curl https://api.yourapp.com/healthz

# 4. Rollback if needed (one command, < 30 seconds)
kubectl rollout undo deploy/api
```

---

## Resiliency Checklist — Production Readiness

```
□ All external HTTP calls have connect + read timeouts
□ Circuit breakers on all high-traffic third-party integrations
□ Non-critical work is async/queued, not in the request path
□ Cache uses jitter on TTL to prevent thundering herd
□ DB pool has explicit max and acquisition timeout
□ All queries have a timeout (no runaway queries)
□ Health check endpoints implemented (/healthz, /readyz)
□ Rolling deployment with readiness probe
□ Docker images tagged with git SHA (never 'latest')
□ DB migrations run before deploy, not during startup
□ Rollback procedure documented and tested within last 30 days
□ Alert fires within 60s of service degradation
□ Runbook exists for each known failure mode
□ On-call rotation and escalation path documented
```
