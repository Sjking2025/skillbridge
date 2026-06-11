# OWASP Reference — Web Top 10 (2021) + API Top 10 (2023)

> **Category**: Reference  
> **Load When**: Starting security audit — use as completeness checklist  
> **Version**: v1.0

---

## OWASP Web Application Security Top 10 (2021)

Use this as a **completeness checklist** after running primary security audit. Every item should be explicitly addressed (confirmed safe OR flagged as issue).

### A01 — Broken Access Control
**Check for**:
- Horizontal privilege escalation (accessing other users' data via IDOR)
- Vertical privilege escalation (user accessing admin functions)
- Missing RBAC enforcement (see SEC-002)
- `forceAllowance` / `skipAuth` flags in code
- CORS misconfiguration enabling cross-origin access (see SEC-005)
- Directory traversal via file paths

**Quick grep**: `skip`, `bypass`, `admin=true`, `role:`, `isAdmin`

---

### A02 — Cryptographic Failures
**Check for**:
- Sensitive data transmitted over HTTP
- Weak encryption algorithms (MD5, SHA1 for passwords, DES, RC4)
- Hardcoded cryptographic keys
- Missing TLS certificate validation
- Sensitive data in browser cache, localStorage (see SEC-001)
- Database columns storing PII in plaintext (see DB-003)

**Quick grep**: `md5`, `sha1`, `base64`, `localStorage`, `sessionStorage`

---

### A03 — Injection
**Check for**:
- SQL injection via string concatenation (see SEC-006)
- NoSQL injection via unvalidated query operators (see SEC-006)
- Command injection: `exec()`, `spawn()`, `system()` with user input
- LDAP injection in directory queries
- XPath injection in XML processing
- Template injection in server-side templates

**Quick grep**: `exec(`, `spawn(`, `eval(`, `query(`, `raw(`

---

### A04 — Insecure Design
**Check for**:
- No threat modeling documented
- Security requirements absent from design docs
- Trust boundary assumptions not documented
- Business logic flaws (e.g., applying discount codes multiple times, skipping payment steps)
- Missing rate limiting on sensitive operations (see SEC-004)
- Anti-automation measures absent

---

### A05 — Security Misconfiguration
**Check for**:
- Default credentials unchanged (admin/admin, root/root)
- Unnecessary features/ports/services enabled
- Error messages exposing stack traces or system info
- Missing security headers (see INFRA-001)
- Cloud storage buckets publicly accessible
- Debug endpoints enabled in production (`/debug`, `/console`, `/__admin`)

**Quick grep**: `debug`, `verbose`, `stack`, `NODE_ENV !== 'production'`

---

### A06 — Vulnerable and Outdated Components
**Check for**:
- `npm audit` / `pip audit` showing high/critical vulnerabilities
- Dependencies with known CVEs (`snyk test`)
- Outdated major versions of core dependencies
- Abandoned packages (last commit > 2 years, no maintainer)
- Unpinned dependency versions (`"express": "*"`)

**Tool**: `npm audit --audit-level=moderate` / `snyk test`

---

### A07 — Identification and Authentication Failures
**Check for**:
- Weak password requirements (< 8 chars, no complexity)
- Missing account lockout / brute force protection (see SEC-004)
- Insecure "remember me" implementation
- Weak session IDs (predictable, short)
- Session not invalidated on logout
- Missing MFA for admin accounts
- Password reset links with long/no expiry

---

### A08 — Software and Data Integrity Failures
**Check for**:
- npm/pip packages without integrity verification (`npm ci` vs `npm install`)
- Unsigned Docker images in production
- Deserialization of untrusted data without validation
- Automatic dependency updates without security review (Dependabot without approval gates)
- CI/CD pipeline artifacts not signed

---

### A09 — Security Logging and Monitoring Failures
**Check for**:
- No logging of auth failures (see PROD-003)
- No alerting on anomalous activity (10x normal error rate, login spikes)
- Logs lack enough context to reconstruct attacks
- Log tampering possible (logs writable by app process)
- No SIEM or log aggregation

---

### A10 — Server-Side Request Forgery (SSRF)
**Check for**:
- User-controlled URLs in server-side HTTP requests (see SEC-010)
- Webhook URL configuration without validation
- Image/file fetch from user-supplied URL
- PDF generation from user-supplied URL
- Internal service URLs reachable from app process

---

## OWASP API Security Top 10 (2023)

### API1 — Broken Object Level Authorization (BOLA / IDOR)
**Check for**:
- `GET /api/orders/:id` — does it verify order belongs to requesting user?
- `PUT /api/users/:id` — can user update other users' records?
- Sequential/predictable IDs enabling enumeration (use UUIDs)

```javascript
// MUST be in every resource endpoint
if (order.userId !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

### API2 — Broken Authentication
*(See SEC-001, SEC-002, SEC-004, token-management.md)*

---

### API3 — Broken Object Property Level Authorization
**Check for**:
- Mass assignment: `User.update(req.body)` — body may contain `role: 'admin'`
- Response returning more fields than client should see (`password_hash`, `internal_flags`)
- Patch endpoints accepting arbitrary field updates

```javascript
// BEFORE (mass assignment vulnerability)
await User.update(req.body); // attacker sends { role: 'admin' }

// AFTER (explicit allowlist)
const { name, email, bio } = req.body; // only allowed fields
await User.update({ name, email, bio });
```

---

### API4 — Unrestricted Resource Consumption
*(See SEC-004 for rate limiting, PERF-004 for pagination)*
- File upload size limits (see SEC-009)
- Query complexity limits for GraphQL

---

### API5 — Broken Function Level Authorization
*(See SEC-002 for RBAC)*
- Admin-only functions accessible to regular users
- HTTP method-level access (DELETE only for admins, GET for all)

---

### API6 — Unrestricted Access to Sensitive Business Flows
**Check for**:
- Purchasing flows bypassable (add to cart → checkout without payment validation)
- Referral/coupon codes applicable unlimited times
- OTP/verification codes with unlimited retries
- Account creation automatable at scale (no CAPTCHA, rate limiting)

---

### API7 — Server-Side Request Forgery
*(See SEC-010)*

---

### API8 — Security Misconfiguration
*(See INFRA-001, INFRA-002, INFRA-003)*
- GraphQL introspection enabled in production
- Detailed error messages in API responses
- Unnecessary HTTP methods enabled (TRACE, OPTIONS leaking info)

---

### API9 — Improper Inventory Management
**Check for**:
- Old API versions still accessible (`/api/v1/` when `/api/v3/` is current)
- Debug/test endpoints accessible in production
- Third-party API integrations not documented or monitored
- Shadow APIs (undocumented endpoints found in frontend code)

---

### API10 — Unsafe Consumption of APIs
**Check for**:
- Third-party API responses trusted without validation
- Webhooks from third parties not verified (missing signature validation)
- Third-party data rendered without sanitization (XSS via third-party content)

```javascript
// Stripe webhook signature verification (required)
const event = stripe.webhooks.constructEvent(
  req.rawBody,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```
