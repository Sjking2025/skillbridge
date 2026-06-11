# Anti-Patterns — Architecture Knowledge Base

> **Category**: Architecture
> **Mandatory Load**: Yes — load for architecture audit category
> **Version**: v1.0

---

## ARCH-006: Controller / Route Handler Bloat

**Confidence**: 92 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- Controller methods exceeding 80 lines
- Business logic, DB queries, HTTP handling mixed in one function
- `req.body` passed directly to database layer without transformation
- `await db.query(...)` calls inside route handlers
- Email sending, event publishing inside controllers
- Response formatting mixed with business rules

### Root Cause Pattern
MVP built fast — everything in one place. "We'll refactor later." Later never comes. Features keep landing in controllers because that's where everything already lives.

### Risk Pattern
- Any change risks breaking unrelated behaviour
- Unit testing business logic requires mocking the entire HTTP layer
- Duplicate business logic across controllers (copy-paste rules)
- New developer spends days understanding a 500-line controller

### Prevention Checklist
- [ ] Controller responsibility: validate input → call service → return response
- [ ] Business logic exclusively in service layer
- [ ] DB access exclusively in repository layer
- [ ] Controllers never exceed 40 lines
- [ ] No `await db.*` calls inside controllers

### Remediation Strategy
```javascript
// BEFORE — everything in controller
app.post('/orders', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items) return res.status(400).json({ error: 'Missing fields' });
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });
  let total = 0;
  for (const item of items) {
    const p = await db.query('SELECT * FROM products WHERE id = $1', [item.productId]);
    total += p.rows[0].price * item.quantity; // N+1 + business logic in handler
  }
  const order = await db.query(
    'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
    [userId, total]
  );
  await sendEmail(user.rows[0].email, 'Order confirmed');
  res.json(order.rows[0]);
});

// AFTER — clean three-layer architecture
// routes/orders.js
router.post('/', authenticate, validate(createOrderSchema), orderController.create);

// controllers/order.controller.js
const create = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.validated);
    res.status(201).json(order);
  } catch (err) { next(err); }
};

// services/order.service.js — business logic ONLY
const createOrder = async (userId, items) => {
  const user = await userRepository.findByIdOrThrow(userId);
  const total = await pricingService.calculateTotal(items);
  const order = await orderRepository.create({ userId, items, total });
  await notificationService.sendOrderConfirmation(user.email, order);
  return order;
};

// repositories/order.repository.js — DB access ONLY
const create = async ({ userId, items, total }) => {
  return db('orders').insert({ user_id: userId, total }).returning('*');
};
```

---

## ARCH-007: Missing Input Validation Layer

**Confidence**: 93 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- `req.body.email` used directly in business logic without schema validation
- Manual `if (!field)` checks scattered across controllers without consistency
- No Zod / Joi / Yup / Ajv schema library in dependencies
- Validation logic duplicated across create and update endpoints
- Different error response shapes per endpoint

### Root Cause Pattern
Validation feels like boilerplate. Each developer adds what they remember. No consistent layer, no consistent coverage, no consistent error format.

### Risk Pattern
- Invalid data reaches database → constraint violations exposed as 500 errors
- Type confusion → unexpected behaviour in business logic
- Duplicate fields accepted under different names at different endpoints
- SQL/NoSQL injection path if no sanitization step exists

### Remediation Strategy
```javascript
// Schema definition — reusable
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(100),
  })).min(1).max(50),
  shippingAddressId: z.string().uuid(),
  couponCode: z.string().max(20).optional(),
});

// Generic validation middleware — one function, used everywhere
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      fields: result.error.flatten().fieldErrors,
    });
  }
  req.validated = result.data; // typed, safe — controller uses this
  next();
};

// Usage — controller NEVER touches req.body directly
router.post('/orders', authenticate, validate(createOrderSchema), orderController.create);
```

---

## ARCH-008: No Centralised Error Handling Architecture

**Confidence**: 90 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Different error shapes returned per endpoint: `{error}`, `{message}`, plain strings
- Stack traces visible in API responses
- No custom error classes — everything is `new Error('...')`
- Global error middleware absent or only partially handles cases
- `catch (e) { res.status(500).json({ error: e.message }) }` — exposes internals

### Root Cause Pattern
Error handling bolted on per endpoint. No upfront design. No shared vocabulary for error types. Frontend developers get inconsistent contracts.

### Risk Pattern
- Stack traces expose internal paths and library versions to attackers
- Frontend cannot programmatically distinguish error types
- Unhandled rejections crash the Node.js process silently
- On-call engineer cannot tell whether a 500 is a programming bug or an operational error

### Remediation Strategy
```javascript
// 1. Custom error hierarchy — define once
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
export class ValidationError extends AppError {
  constructor(msg, fields) { super(msg, 400, 'VALIDATION_ERROR'); this.fields = fields; }
}
export class NotFoundError extends AppError {
  constructor(resource) { super(`${resource} not found`, 404, 'NOT_FOUND'); }
}
export class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 401, 'UNAUTHORIZED'); }
}
export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super(msg, 403, 'FORBIDDEN'); }
}
export class ConflictError extends AppError {
  constructor(msg) { super(msg, 409, 'CONFLICT'); }
}

// 2. Global error middleware — catches everything, one place
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.requestId }, 'Request failed');
  Sentry.captureException(err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.fields && { fields: err.fields }),
      requestId: req.requestId,
    });
  }

  // Unknown/programming error — hide internals
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
    requestId: req.requestId,
    // NO stack, NO err.message for unexpected errors
  });
});
```

---

## ARCH-009: Synchronous Operations Blocking Event Loop

**Confidence**: 87 | **Stability**: Permanent | **Frequency**: Medium

### Detection Logic
- `fs.readFileSync` / `fs.writeFileSync` inside request handlers
- `bcrypt.hashSync` / `crypto.pbkdf2Sync` inside request handlers
- `execSync` / `spawnSync` inside request handlers
- Large `JSON.parse` on payloads > 1MB synchronously
- CPU-intensive loops (image processing, PDF generation) inline in handlers

### Root Cause Pattern
Synchronous APIs are simpler. Node.js single-threaded nature not understood. Works in development with one concurrent user. Catastrophic at production scale.

### Risk Pattern
- `bcrypt.hashSync` at cost 12 → blocks ALL requests for ~300ms during that call
- Image processing inline → API fully unresponsive during processing
- Any sync I/O under load → cascading P99 latency spike across all endpoints

### Remediation Strategy
```javascript
// BEFORE — blocks event loop
const hash = bcrypt.hashSync(req.body.password, 12);

// AFTER — non-blocking
const hash = await bcrypt.hash(req.body.password, 12);

// For heavy CPU work (PDF, image resize) → always use a queue
app.post('/reports/generate', async (req, res) => {
  const jobId = await reportQueue.add({ ...req.validated });
  res.status(202).json({ jobId, status: 'queued' });
  // Client polls GET /reports/status/:jobId
});
```

---

## ARCH-010: Missing Architecture Documentation

**Confidence**: 80 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- No `docs/architecture.md` or equivalent
- No ADRs (Architecture Decision Records)
- No README explaining module responsibilities
- Module boundaries undefined — team disagrees about ownership
- Cross-module imports unrestricted (anything imports from anything)

### Root Cause Pattern
Architecture evolves organically. What's obvious to the founding engineer is a mystery to the fifth hire. Documentation deferred indefinitely.

### Risk Pattern
- New features added to wrong modules → accelerating the god-object problem
- Architectural drift: system evolves away from original intent silently
- Onboarding time scales badly with team size
- Boundary violations accumulate until expensive refactor is required

### ADR Template
```markdown
# ADR-001: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Accepted / Deprecated / Superseded by ADR-XXX
**Deciders**: [names or team]

## Context
[What situation made this decision necessary]

## Decision
[Exactly what was decided, and why]

## Consequences
**Positive**: [benefits gained]
**Negative**: [tradeoffs accepted]
**Risks**: [what to monitor going forward]

## Alternatives Considered
[What else was evaluated and why rejected]
```
