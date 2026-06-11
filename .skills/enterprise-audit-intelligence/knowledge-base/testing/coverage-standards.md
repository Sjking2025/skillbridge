# Testing Coverage Standards — Knowledge Base

> **Category**: Testing  
> **Mandatory Load**: Yes — load for testing audit category  
> **Version**: v1.0

---

## TEST-001: No Integration Tests for Critical User Flows

**Confidence**: 95 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Test suite contains only unit tests (mocked everything)
- No tests that hit a real database (even test database)
- Critical flows untested: auth, payment, data submission
- Test coverage % high but unit tests mock the very layer being tested
- No Supertest / Playwright / Cypress tests in repository

### Root Cause Pattern
Unit tests are fast and easy. Integration tests require setup effort. Time pressure → "we have 80% coverage" → all mocked.

### Risk Pattern
- Integration bugs live between mocked layers
- ORM query bugs not caught (real DB behaves differently than mock)
- Middleware chain failures invisible (auth middleware tested in isolation misses interaction bugs)
- Deployment introduces regression in critical flow — discovered by users, not tests

### Prevention Checklist
- [ ] Integration tests for: auth (login/logout/refresh), registration, primary data CRUD, payment (if applicable)
- [ ] Tests use real test database (spun up in CI via Docker Compose)
- [ ] API-level tests (Supertest or equivalent) for all endpoints
- [ ] E2E tests for top 3 critical user journeys (Playwright/Cypress)
- [ ] Tests run in CI on every PR

### Remediation Strategy
```javascript
// Supertest integration test (uses real Express app, real test DB)
import request from 'supertest';
import app from '../src/app';
import db from '../src/db';

beforeAll(async () => { await db.migrate.latest(); });
afterAll(async () => { await db.destroy(); });
afterEach(async () => { await db.raw('TRUNCATE users, sessions CASCADE'); });

describe('POST /auth/login', () => {
  it('returns 200 and token for valid credentials', async () => {
    // Seed
    await db('users').insert({ email: 'test@example.com', password_hash: await bcrypt.hash('password123', 12) });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken')])
    );
  });

  it('returns 429 after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    }
    const res = await request(app).post('/auth/login').send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(429);
  });
});
```

---

## TEST-002: Missing Security Tests

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- No tests verifying auth middleware rejects unauthenticated requests
- No tests verifying RBAC blocks lower-privilege roles
- No OWASP ZAP / Semgrep / Snyk in CI pipeline
- No tests for injection vulnerabilities
- No tests for rate limiting behavior

### Root Cause Pattern
Security tests require adversarial thinking that developers don't default to. Security is treated as an audit activity, not a development activity.

### Prevention Checklist
- [ ] Every protected endpoint tested with: no auth, wrong role, expired token
- [ ] Rate limiting tested to verify it triggers at correct threshold
- [ ] Semgrep or Snyk SAST in CI pipeline
- [ ] OWASP ZAP DAST scan in staging before production
- [ ] Dependency vulnerability scanning (`npm audit`, `snyk test`) in CI

### Remediation Strategy
```javascript
// Auth enforcement tests (should be written for EVERY protected route)
describe('GET /api/admin/users', () => {
  it('returns 401 with no auth token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for user role (not admin)', async () => {
    const token = generateToken({ userId: 1, role: 'user' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 for admin role', async () => {
    const token = generateToken({ userId: 1, role: 'admin' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

---

## TEST-003: Missing Error Path Coverage

**Confidence**: 85 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Tests only cover happy path (valid inputs, successful responses)
- No tests for: invalid input, missing required fields, duplicate records, DB errors
- Error handling code paths have 0% test coverage
- Edge cases not tested: empty arrays, null values, maximum field lengths, unicode

### Root Cause Pattern
Happy path is the intuitive path to test. Edge cases require imagination and discipline.

### Risk Pattern
- Production crashes on unexpected inputs (null pointer exceptions, unhandled promise rejections)
- Error messages leak implementation details (stack traces to users)
- Duplicate submission bugs found by users, not tests

### Prevention Checklist
- [ ] Every endpoint tested with invalid/missing required fields
- [ ] Duplicate record scenarios tested (unique constraint violations)
- [ ] Boundary conditions tested (empty string, null, max length + 1)
- [ ] Error response format consistent and tested (no stack traces to client)
- [ ] Network/DB failure scenarios tested with mocked errors

### Remediation Strategy
```javascript
describe('POST /api/users', () => {
  // Happy path
  it('creates user with valid data', async () => { /* ... */ });

  // Error paths
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/users').send({ name: 'John' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.stack).toBeUndefined(); // no stack trace exposed
  });

  it('returns 409 when email already exists', async () => {
    await db('users').insert({ email: 'exists@example.com', ... });
    const res = await request(app).post('/api/users').send({ email: 'exists@example.com', ... });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/users').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});
```
