# API Design Standards — Knowledge Base

> **Category**: API
> **Mandatory Load**: Yes — load for API audit category
> **Version**: v1.0

---

## API-001: Inconsistent Error Response Format

**Confidence**: 92 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- Some endpoints return `{ error: 'msg' }`, others `{ message: 'msg' }`, others `{ detail: 'msg' }`
- HTTP status codes inconsistent: some 400s return 200 with error in body
- Stack traces returned in production error responses
- No `requestId` or correlation ID in error responses
- Error format differs between auth errors and validation errors

### Root Cause Pattern
Each developer returns errors their own way. No shared error contract. Frontend developer has to handle 5 different error formats.

### Standard Error Contract
```typescript
// Every error response — same shape, always
interface ErrorResponse {
  error: string;          // machine-readable code: 'VALIDATION_ERROR', 'NOT_FOUND'
  message: string;        // human-readable description
  requestId: string;      // for support/debugging correlation
  fields?: {              // only present for validation errors
    [fieldName: string]: string[];
  };
}

// Examples:
// 400 Validation
{ "error": "VALIDATION_ERROR", "message": "Invalid input", "requestId": "abc-123",
  "fields": { "email": ["Invalid email format"], "quantity": ["Must be positive"] } }

// 401 Auth
{ "error": "UNAUTHORIZED", "message": "Authentication required", "requestId": "abc-124" }

// 403 Forbidden
{ "error": "FORBIDDEN", "message": "Insufficient permissions", "requestId": "abc-125" }

// 404 Not Found
{ "error": "NOT_FOUND", "message": "Order not found", "requestId": "abc-126" }

// 409 Conflict
{ "error": "CONFLICT", "message": "Email already in use", "requestId": "abc-127" }

// 429 Rate Limit
{ "error": "RATE_LIMITED", "message": "Too many requests", "requestId": "abc-128",
  "retryAfter": 60 }

// 500 Internal
{ "error": "INTERNAL_ERROR", "message": "Something went wrong", "requestId": "abc-129" }
// NOTE: Never include stack traces or internal details in 500 responses
```

---

## API-002: Missing API Versioning

**Confidence**: 86 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- No version prefix in API routes: `/api/users` instead of `/api/v1/users`
- Breaking changes deployed without version increment
- No versioning strategy documented
- Old clients break when API changes

### Root Cause Pattern
"We'll add versioning when we need it." By the time it's needed, the API has external consumers and breaking changes are costly.

### Prevention Checklist
- [ ] All routes prefixed with version: `/api/v1/...`
- [ ] Breaking changes always increment version
- [ ] Old version maintained for deprecation period (minimum 6 months)
- [ ] `Deprecation` and `Sunset` headers on deprecated endpoints
- [ ] API changelog maintained

### Remediation Strategy
```javascript
// Router versioning
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router); // new breaking changes go here

// Deprecation headers on old endpoints
v1Router.use('/users', (req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT');
  res.setHeader('Link', '</api/v2/users>; rel="successor-version"');
  next();
}, usersController);
```

---

## API-003: Missing Pagination, Filtering, and Sorting Standards

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- List endpoints return unbounded results: `GET /api/orders` → all orders
- Pagination parameters inconsistent: some use `page/limit`, others `offset/count`, others `cursor`
- No standard for filtering: `?status=active` vs `?filter[status]=active` vs `?q=active`
- Sorting not supported or inconsistent: `?sort=name` vs `?orderBy=name&direction=asc`
- Total count not returned (client can't show "Page 2 of 47")

### Standard Query Contract
```
# Pagination (cursor-based preferred for large datasets)
GET /api/v1/orders?cursor=eyJpZCI6MTAwfQ&limit=20

# Response
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "hasMore": true,
    "limit": 20
  }
}

# Filtering
GET /api/v1/orders?status=pending&userId=123&createdAfter=2024-01-01

# Sorting
GET /api/v1/orders?sort=createdAt&order=desc
# Multiple sort fields:
GET /api/v1/orders?sort=status,createdAt&order=asc,desc

# Search
GET /api/v1/products?q=laptop&category=electronics
```

```javascript
// Standardised list handler
const listOrders = async (req, res, next) => {
  try {
    const {
      cursor,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      status,
      userId,
    } = req.query;

    const maxLimit = Math.min(Number(limit), 100);
    const allowedSortFields = ['createdAt', 'total', 'status'];
    const safeSortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const safeOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

    const { data, nextCursor, hasMore } = await orderRepository.list({
      cursor,
      limit: maxLimit,
      sortField: safeSortField,
      sortOrder: safeOrder,
      filters: { status, userId },
    });

    res.json({
      data,
      pagination: { nextCursor, hasMore, limit: maxLimit },
    });
  } catch (err) { next(err); }
};
```

---

## API-004: Insecure Direct Object Reference (IDOR / BOLA)

**Confidence**: 96 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- Resource endpoints using sequential numeric IDs: `GET /api/orders/1234`
- No ownership check: does this order belong to the requesting user?
- `GET /api/users/:id` — can any authenticated user fetch any user?
- Admin endpoints accessible by regular users (see SEC-002)
- IDs predictable/enumerable (1, 2, 3...)

### Root Cause Pattern
Developer thinks authentication = authorization. "If you're logged in, you can access any resource by ID." This is horizontal privilege escalation — the most common API vulnerability.

### Risk Pattern
- User A accesses User B's private orders by guessing IDs
- Data exfiltration by enumeration
- OWASP API Security Top 10 #1 (BOLA — Broken Object Level Authorization)

### Remediation Strategy
```javascript
// BEFORE — no ownership check (IDOR vulnerability)
app.get('/api/orders/:id', authenticate, async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
  res.json(order); // returns ANY user's order to ANY authenticated user
});

// AFTER — ownership enforced
app.get('/api/orders/:id', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Ownership check — admin can see any, user can see own only
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError(); // 403, not 404 (don't confirm existence)
    }

    res.json(order);
  } catch (err) { next(err); }
});

// Use UUIDs instead of sequential IDs to prevent enumeration
// Table: id UUID DEFAULT gen_random_uuid()
// GET /api/orders/550e8400-e29b-41d4-a716-446655440000
// (cannot enumerate — 2^122 possible values)
```

---

## API-005: Missing Request/Response Logging for Debugging

**Confidence**: 85 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- No request ID generated or logged per request
- No logging of: method, path, status code, duration, userId
- Cannot reconstruct what happened for a specific request from logs
- Error logs don't include enough context to reproduce the issue

### Standard Request Logging
```javascript
// Request logging middleware — log everything needed for debugging
app.use((req, res, next) => {
  req.startTime = Date.now();
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  // Create child logger with request context
  req.log = logger.child({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id,    // available after auth middleware
    ip: req.ip,
  });

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    req.log[level]({
      statusCode: res.statusCode,
      duration,
      contentLength: res.getHeader('content-length'),
    }, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
});
```
