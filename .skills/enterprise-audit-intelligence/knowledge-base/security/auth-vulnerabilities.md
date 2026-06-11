# Auth Vulnerabilities — Knowledge Base

> **Category**: Security  
> **Mandatory Load**: Yes — load before every security audit  
> **Version**: v1.0

---

## SEC-001: JWT Stored in localStorage Without Rotation

**Confidence**: 95 | **Stability**: Likely Permanent | **Frequency**: Extremely Common

### Detection Logic
- `localStorage.setItem` + `token` / `jwt` / `accessToken` in client-side code
- `localStorage.getItem('token')` in HTTP request interceptors
- No `httpOnly` cookies used for primary auth

### Root Cause Pattern
Developers choose localStorage for simplicity. JWT guides often show this pattern without emphasizing XSS risk.

### Risk Pattern
- Any XSS exploit immediately steals tokens
- Stolen tokens valid for their full TTL (often hours/days)
- No server-side revocation possible for stateless JWTs

### Prevention Checklist
- [ ] Use `httpOnly; Secure; SameSite=Strict` cookies for token storage
- [ ] Implement token rotation (short-lived access + refresh token pair)
- [ ] Access token TTL ≤ 15 minutes
- [ ] Refresh token stored in httpOnly cookie only

### Remediation Strategy
```javascript
// BEFORE (vulnerable)
localStorage.setItem('token', jwt);
axios.defaults.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

// AFTER (secure)
// Server sets: Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict
// Access token kept only in memory (React state / closure)
let accessToken = null; // in-memory only
const setToken = (token) => { accessToken = token; };
// Auto-refresh handled by axios interceptor calling /auth/refresh
```

### False Positive Notes
See `false-positive-patterns.md` — short-lived tokens (< 5 min) with restricted scope may be acceptable in localStorage for specific use cases.

---

## SEC-002: Missing RBAC on Admin Endpoints

**Confidence**: 97 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- Admin routes defined without role-check middleware
- Middleware chain: `router.post('/admin/...')` with only auth check, no role check
- Role stored in JWT but never validated server-side
- Frontend hides admin UI but backend doesn't enforce

### Root Cause Pattern
RBAC added to frontend only. Developers trust "only admins can reach this screen" — forgetting API is directly accessible.

### Risk Pattern
- Any authenticated user can call admin endpoints directly
- Horizontal + vertical privilege escalation
- Data exposure, mass deletion, privilege assignment

### Prevention Checklist
- [ ] Every route explicitly declares required roles
- [ ] Role validation happens in middleware BEFORE business logic
- [ ] Role validation is server-side — never trust client-supplied role
- [ ] Admin routes isolated to separate router with dedicated middleware chain
- [ ] E2E tests verify non-admin users receive 403 on admin endpoints

### Remediation Strategy
```javascript
// BEFORE (broken)
router.post('/admin/users/:id/promote', authMiddleware, async (req, res) => { ... });

// AFTER (secure)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.post('/admin/users/:id/promote',
  authMiddleware,
  requireRole('admin', 'superadmin'),
  async (req, res) => { ... }
);
```

---

## SEC-003: Hardcoded Credentials in Source Code

**Confidence**: 99 | **Stability**: Permanent | **Frequency**: Common

### Detection Logic
- Grep: `password`, `secret`, `apiKey`, `api_key`, `token`, `credentials` in source files
- String literals matching: `sk-`, `Bearer `, `postgres://`, `mongodb+srv://`
- `.env` files committed to git (check `.gitignore`)
- AWS access keys: `AKIA[0-9A-Z]{16}`

### Root Cause Pattern
Rapid prototyping habits that never get cleaned up. "I'll fix it before committing" — they don't.

### Risk Pattern
- Immediate credential exposure if repo is public or compromised
- Credentials live in git history even after removal
- Supply chain attacks can harvest credentials from forks

### Prevention Checklist
- [ ] `git-secrets` or `truffleHog` in CI pipeline
- [ ] `.env` in `.gitignore` — verified
- [ ] All secrets via environment variables or secret manager
- [ ] Rotate any credentials found — assume compromised

### Remediation Strategy
```bash
# Detect in CI
trufflehog git file://. --only-verified

# Rotate immediately — don't just remove from code
# History scan:
git log --all --full-history -- "*.env"
# Rewrite history if needed:
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
```

---

## SEC-007: Authentication Token Leakage in Logs

**Confidence**: 91 | **Stability**: Likely Permanent | **Frequency**: Common (often missed)

### Detection Logic
- Logger calls with `req.headers` passed directly: `logger.info(req.headers)`
- Error handlers that serialize full request objects: `logger.error({ req, err })`
- WebSocket/SSE reconnect handlers that log connection metadata
- Debug statements logging full HTTP responses including `Authorization` header

### Root Cause Pattern
Debug logging added during development never sanitized before production. Auth headers treated as generic metadata. Reconnect/fallback handlers added quickly without security review.

### Risk Pattern
- Tokens appear in centralized log systems (Datadog, Splunk, CloudWatch)
- Accessible to everyone with log access — wide internal attack surface
- Compliance violation (PCI-DSS, SOC2, GDPR if tokens tied to PII)

### Prevention Checklist
- [ ] Log sanitization middleware strips sensitive headers before logging
- [ ] `Authorization`, `Cookie`, `X-API-Key` headers never logged raw
- [ ] Structured logging schema explicitly defines allowed fields
- [ ] Security review required for all reconnect/fallback/retry handlers

### Remediation Strategy
```javascript
// BEFORE (leaking)
logger.info('Incoming request', { headers: req.headers });

// AFTER (sanitized)
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
const sanitizeHeaders = (headers) => {
  const clean = { ...headers };
  SENSITIVE_HEADERS.forEach(h => { if (clean[h]) clean[h] = '[REDACTED]'; });
  return clean;
};
logger.info('Incoming request', { headers: sanitizeHeaders(req.headers) });
```
