# Scalability Smells — Architecture Knowledge Base

> **Category**: Architecture  
> **Mandatory Load**: Yes — load for architecture review category  
> **Version**: v1.0

---

## ARCH-002: God Object / Monolithic Service Boundary

**Confidence**: 94 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Single service/module handles auth + business logic + payments + notifications + file processing
- Files exceeding 800–1000 lines with unrelated responsibilities
- Controller files that also contain database queries, business rules, and email sending
- Single database table with 30+ columns spanning multiple concerns
- `UserService` that manages profiles, billing, auth, notifications, and admin

### Root Cause Pattern
MVP code never refactored. "We'll split it later" — later never comes. Feature additions take path of least resistance into existing large files.

### Risk Pattern
- Any change can break unrelated functionality (hidden coupling)
- Impossible to scale individual concerns independently
- Testing requires mocking the entire universe
- Team conflicts: everyone editing the same files
- Deployment of small change requires full system redeploy

### Prevention Checklist
- [ ] Single Responsibility Principle at service level
- [ ] Max 300 lines per file (soft limit — trigger refactor review)
- [ ] Each service owns exactly one domain boundary
- [ ] Dependency injection for cross-service communication
- [ ] Domain-driven design boundaries documented

### Remediation Strategy
Decompose by domain. For a monolith → modular monolith first:
```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.repository.ts
├── billing/
│   ├── billing.controller.ts
│   ├── billing.service.ts
│   └── billing.repository.ts
├── notifications/
│   └── notification.service.ts
```

---

## ARCH-004: Missing Graceful Degradation for External Dependencies

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- External API calls (Stripe, Twilio, SendGrid) with no timeout set
- No circuit breaker pattern on third-party integrations
- Payment flow fails completely if notification service is down
- No fallback when cache (Redis) is unavailable
- `await externalService.call()` with no try/catch or timeout

### Root Cause Pattern
"Happy path" development — external services assumed to always be up. Error handling added reactively after first production outage.

### Risk Pattern
- Single external service outage takes down entire application
- Cascading failures: slow dependency causes thread exhaustion → full outage
- User-facing errors for unrelated functionality

### Prevention Checklist
- [ ] Timeouts on all external HTTP calls (connect timeout + read timeout)
- [ ] Circuit breaker on high-traffic external integrations (opossum, resilience4j)
- [ ] Graceful fallback when non-critical services unavailable
- [ ] Queue + retry for async operations (email, SMS, webhooks)
- [ ] Health check excludes non-critical dependencies from liveness probe

### Remediation Strategy
```javascript
import CircuitBreaker from 'opossum';

const stripeOptions = {
  timeout: 5000,        // 5s timeout
  errorThresholdPercentage: 50, // open circuit at 50% failures
  resetTimeout: 30000,  // try again after 30s
};

const stripeBreaker = new CircuitBreaker(stripe.charges.create.bind(stripe.charges), stripeOptions);

stripeBreaker.fallback(() => {
  // Queue for retry rather than hard fail
  await paymentQueue.add({ amount, userId });
  return { queued: true, message: 'Payment queued for processing' };
});

// Non-critical services: fail open
try {
  await emailService.sendWelcome(user.email);
} catch (e) {
  logger.error('Welcome email failed — non-critical', { userId: user.id, error: e.message });
  // Do NOT throw — user registration still succeeds
}
```

---

## ARCH-001: Circular Dependency Between Modules

**Confidence**: 92 | **Stability**: Permanent | **Frequency**: Common

### Detection Logic
- Module A imports from Module B, which imports from Module A
- `madge --circular ./src` returns results
- TypeScript: `import { X } from '../moduleB'` in a file that moduleB also imports from
- Runtime errors: `Cannot access 'X' before initialization`

### Root Cause Pattern
Shared utilities split across modules that both need each other. Gradual feature additions create dependency loops that aren't caught until runtime.

### Risk Pattern
- Unpredictable initialization order
- Runtime errors in production that don't appear in dev (module loading order differences)
- Impossible to test modules in isolation

### Prevention Checklist
- [ ] `madge --circular` in CI pipeline (fail on circular deps)
- [ ] Shared utilities extracted to a dedicated `shared/` or `common/` module
- [ ] Dependency direction enforced: domain → infrastructure, never reversed
- [ ] Architecture decision record (ADR) for module boundary rules

---

## ARCH-003: Shared Mutable State Across Service Boundaries

**Confidence**: 90 | **Stability**: Permanent | **Frequency**: Medium-High

### Detection Logic
- Multiple services writing to the same database table without coordination
- Shared in-memory cache (Redis key namespace collisions between services)
- Event bus consumers modifying shared domain entities concurrently
- Global singleton objects mutated by concurrent requests

### Root Cause Pattern
Monolith decomposed hastily — services share the old monolith database. "We'll deal with data ownership later" never resolves.

### Risk Pattern
- Race conditions → data corruption
- Service A's deployment breaks Service B (schema changes)
- Impossible to scale services independently
- Distributed transaction nightmares

### Prevention Checklist
- [ ] Each service owns its data store exclusively
- [ ] Cross-service data access only via APIs, never direct DB access
- [ ] Event-driven updates for cross-service state changes
- [ ] Optimistic locking on shared entities where unavoidable

---

## ARCH-005: Missing Idempotency on Critical Operations

**Confidence**: 86 | **Stability**: Permanent | **Frequency**: High (often missed)

### Detection Logic
- Payment processing endpoint with no idempotency key
- Webhook handlers that process events without deduplication
- Retry mechanisms that can trigger duplicate charges/emails/records
- No `unique` constraint on operation IDs in database

### Root Cause Pattern
Network retries assumed not to happen. "Our payment provider handles it" — they don't always.

### Risk Pattern
- Duplicate charges on payment retry
- Duplicate order creation
- Duplicate notification sends
- Customer trust destruction

### Prevention Checklist
- [ ] Idempotency keys on all payment/order creation endpoints
- [ ] Webhook deduplication (store processed event IDs with TTL)
- [ ] Database unique constraints on business operation identifiers
- [ ] Client retry logic uses same idempotency key

### Remediation Strategy
```javascript
// Idempotency key pattern
app.post('/payments/charge', async (req, res) => {
  const { idempotencyKey, amount, userId } = req.body;

  if (!idempotencyKey) return res.status(400).json({ error: 'idempotencyKey required' });

  // Check if already processed
  const existing = await db.IdempotencyRecord.findOne({ key: idempotencyKey });
  if (existing) {
    return res.status(200).json(existing.result); // Return cached result
  }

  // Process
  const charge = await stripe.charges.create({ amount, currency: 'usd' });

  // Store result
  await db.IdempotencyRecord.create({
    key: idempotencyKey,
    result: charge,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  res.json(charge);
});
```
