# Microservice Patterns — Architecture Knowledge Base

> **Category**: Architecture
> **Mandatory Load**: Load when project uses multi-service architecture
> **Version**: v1.0

---

## MICRO-001: Missing Service-to-Service Authentication

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Internal service endpoints reachable without credentials
- Services identified only by IP or hostname — no cryptographic identity
- No mTLS, no service JWT, no API key for inter-service calls
- Internal endpoints have weaker validation than public endpoints
- "The internal network is safe" assumption documented or stated

### Root Cause Pattern
Internal network treated as trusted perimeter. Works fine until one service is compromised, an intern exposes a port, or a cloud misconfiguration makes internal services reachable.

### Risk Pattern
- Compromised service impersonates any other service
- Internal APIs often have elevated privileges with no auth → privilege escalation
- Lateral movement after initial breach is trivial
- Zero-trust architecture requirements (SOC2, ISO 27001) fail audit

### Prevention Checklist
- [ ] mTLS between all services (Istio, Linkerd service mesh)
- [ ] Or: short-lived JWT with service identity claims (exp: 60s)
- [ ] Internal endpoints validate caller identity, not just network origin
- [ ] Service accounts scoped to minimum required permissions
- [ ] Network policies restrict which service can call which

### Remediation Strategy
```javascript
// Calling service — generates signed service identity JWT
const serviceJwt = jwt.sign(
  {
    iss: 'order-service',      // caller identity
    aud: 'payment-service',   // intended recipient only
    sub: 'service-account',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // 60 second TTL
  },
  process.env.SERVICE_PRIVATE_KEY,
  { algorithm: 'RS256' }
);

await fetch('http://payment-service/internal/charge', {
  method: 'POST',
  headers: { 'X-Service-Token': serviceJwt, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// Receiving service — validates service identity
const validateServiceToken = (req, res, next) => {
  const token = req.headers['x-service-token'];
  if (!token) return res.status(401).json({ error: 'Service token required' });
  try {
    const payload = jwt.verify(token, process.env.SERVICE_PUBLIC_KEY, {
      algorithms: ['RS256'],
      audience: 'payment-service', // must be addressed to us specifically
    });
    req.callerService = payload.iss;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid service token' });
  }
};

router.post('/internal/charge', validateServiceToken, chargeController.process);
```

---

## MICRO-002: No Distributed Transaction Strategy

**Confidence**: 82 | **Stability**: Permanent | **Frequency**: Medium-High

### Detection Logic
- Multi-service operations with no compensation logic on failure
- `await serviceA.do()` followed by `await serviceB.do()` — no rollback if B fails
- No saga pattern, no outbox pattern, no two-phase commit
- DB updated AND external service called with no atomicity guarantee
- "If payment fails we fix it manually" — documented or stated

### Root Cause Pattern
Distributed transactions are genuinely hard. Local DB transactions don't exist across service boundaries. The problem is deferred until it causes a production incident (double charge, ghost order, etc.).

### Risk Pattern
- Payment charged, order not created → user pays for nothing
- Order created, payment not processed → revenue lost
- Duplicate operations on retry (no idempotency)
- Manual intervention required for every partial failure

### Remediation Strategy — Outbox Pattern
```javascript
// Atomically save business record + event in ONE DB transaction
// Separate publisher polls outbox and publishes (at-least-once delivery)

// In order-service — single atomic transaction
await db.transaction(async (trx) => {
  // Create the order
  const [order] = await trx('orders')
    .insert({ userId, items: JSON.stringify(items), total, status: 'PENDING' })
    .returning('*');

  // Write event to outbox IN THE SAME TRANSACTION
  // If either fails, both roll back — atomic
  await trx('outbox_events').insert({
    aggregate_id: order.id,
    aggregate_type: 'Order',
    event_type: 'ORDER_CREATED',
    payload: JSON.stringify({ orderId: order.id, userId, total, items }),
    status: 'PENDING',
    created_at: new Date(),
  });

  return order;
});

// Separate outbox publisher (runs on interval or triggered)
const publishPendingEvents = async () => {
  const events = await db('outbox_events')
    .where({ status: 'PENDING' })
    .orderBy('created_at', 'asc')
    .limit(50)
    .forUpdate()        // lock rows to prevent double-publish
    .skipLocked();      // skip already-locked rows

  for (const event of events) {
    try {
      await messageQueue.publish(event.event_type, JSON.parse(event.payload));
      await db('outbox_events').where({ id: event.id }).update({ status: 'PUBLISHED' });
    } catch (err) {
      logger.error({ eventId: event.id, err }, 'Outbox publish failed — will retry');
    }
  }
};
```

---

## MICRO-003: Chatty Services — Excessive Synchronous Calls

**Confidence**: 84 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Single user request triggers 10+ synchronous service-to-service calls
- Call chains: A → B → C → D synchronously (waterfall latency)
- Services querying each other for data they could own locally
- No caching at service boundary
- High latency on operations that "should be instant"

### Root Cause Pattern
Data boundaries drawn incorrectly. Services too granular. The result is a distributed monolith: all the complexity of microservices, none of the independence benefits.

### Risk Pattern
- P99 latency = sum of all service call latencies (each 10–50ms → easily 300ms+)
- One slow service cascades latency to all callers
- Network becomes the bottleneck, not computation
- Impossible to scale services independently when all are synchronously coupled

### Prevention Checklist
- [ ] Each service owns its core domain data — no cross-service queries for it
- [ ] Async events propagate cross-domain data (eventual consistency)
- [ ] Local read replicas or caches for frequently-needed foreign data
- [ ] If a request requires > 4 service calls → redesign data boundaries
- [ ] Batch APIs for bulk cross-service operations

---

## MICRO-004: Missing API Gateway / Single Entry Point

**Confidence**: 76 | **Stability**: Evolving | **Frequency**: Medium

### Detection Logic
- Frontend directly calls 5+ internal microservices at different origins
- CORS configured separately on every service (inconsistent, hard to manage)
- Auth implemented differently in each service
- No centralized rate limiting, logging, or tracing entry point
- Any internal service change requires frontend update

### Root Cause Pattern
Microservices split incrementally. Frontend adapts to each new service endpoint. No one owns the "what does the client face" design decision.

### Risk Pattern
- Inconsistent auth allows bypass of weaker services
- Frontend performance degrades: multiple parallel or sequential service calls per page
- Security policies (rate limiting, IP blocking) cannot be applied consistently
- Debugging cross-service requests requires correlating logs from multiple services manually

### Prevention Checklist
- [ ] API Gateway as single entry point (Kong, AWS API Gateway, nginx, Traefik)
- [ ] Or BFF (Backend For Frontend) per client type (web BFF, mobile BFF)
- [ ] Centralized auth validation at gateway
- [ ] Centralized rate limiting, logging, distributed tracing at gateway
- [ ] Internal service URLs never exposed to external clients
