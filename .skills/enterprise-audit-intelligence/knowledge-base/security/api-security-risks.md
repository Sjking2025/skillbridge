# API Security Risks — Knowledge Base

> **Category**: Security → API  
> **Mandatory Load**: Yes — load for any project with an HTTP API  
> **Version**: v1.0  
> **References**: OWASP API Security Top 10 2023, OWASP Web Top 10 2021

---

## SEC-004: Missing Rate Limiting on Auth Endpoints

**Confidence**: 96 | **Stability**: Permanent | **Frequency**: Extremely Common

### Detection Logic
- `/login`, `/register`, `/forgot-password`, `/reset-password` routes with no rate limiter middleware
- No `express-rate-limit`, `fastify-rate-limit`, or equivalent in dependency list
- No upstream rate limiting in nginx.conf, API Gateway config, or Cloudflare rules

### Root Cause Pattern
Rate limiting is often "someone else's problem" — devs expect infra to handle it. Infrastructure team expects app to handle it.

### Risk Pattern
- Brute force password attacks on login
- Account enumeration via reset-password timing/response differences
- Credential stuffing automation runs unchecked
- OTP/2FA code exhaustion

### Prevention Checklist
- [ ] Login: max 5 attempts per IP per 15 minutes
- [ ] Register: max 10 per IP per hour
- [ ] Password reset: max 3 per email per hour
- [ ] Global API rate limit as baseline
- [ ] Rate limit by both IP and account identifier

### Remediation Strategy
```javascript
// Express example
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  keyGenerator: (req) => req.ip + ':' + (req.body?.email || ''),
});

app.post('/auth/login', authLimiter, loginHandler);
app.post('/auth/forgot-password', authLimiter, forgotPasswordHandler);
```

---

## SEC-006: SQL / NoSQL Injection via Unsanitized Input

**Confidence**: 99 | **Stability**: Permanent | **Frequency**: High

### Detection Logic

**SQL**: 
- String concatenation in queries: `"SELECT * FROM users WHERE id = " + req.params.id`
- Template literals in queries: `` `SELECT * FROM users WHERE email = '${email}'` ``
- Raw query methods: `.query(str)`, `.execute(str)` without parameterization

**NoSQL (MongoDB)**:
- `req.body` directly into `.find()` / `.findOne()`: `User.findOne({ email: req.body.email })`
- No schema validation on incoming query operators
- Missing `$where` / `$regex` operator filtering

### Root Cause Pattern
Junior developers treat database queries like string formatting. ORM "escape hatches" used for performance without parameterization. NoSQL's schema-less nature creates false sense of injection immunity.

### Risk Pattern
- Full database dump
- Authentication bypass: `' OR '1'='1`
- Data deletion: `'; DROP TABLE users; --`
- NoSQL: `{ "email": { "$gt": "" } }` bypasses auth

### Prevention Checklist
- [ ] 100% parameterized queries — no string concatenation in SQL
- [ ] ORM used for all database operations (last resort: prepared statements)
- [ ] Input sanitization for MongoDB operators (`$where`, `$regex`, `$ne`)
- [ ] Schema validation on all API inputs (Joi, Zod, Yup)
- [ ] Least-privilege DB user (no DROP, no GRANT)

### Remediation Strategy
```javascript
// BEFORE — SQL Injection (vulnerable)
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// AFTER — Parameterized (safe)
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// BEFORE — NoSQL Injection (vulnerable)
const user = await User.findOne({ email: req.body.email });

// AFTER — Validated (safe)
import { z } from 'zod';
const schema = z.object({ email: z.string().email() });
const { email } = schema.parse(req.body);
const user = await User.findOne({ email }); // now guaranteed to be a string
```

---

## SEC-008: Missing CSRF Protection on State-Mutating Endpoints

**Confidence**: 93 | **Stability**: Likely Permanent | **Frequency**: High

### Detection Logic
- Cookie-based session auth with no CSRF token validation
- `POST`, `PUT`, `PATCH`, `DELETE` endpoints with no CSRF middleware
- No `SameSite` cookie attribute set
- No `csurf` / equivalent middleware

### Root Cause Pattern
CSRF risk often misunderstood. "We use JWT" is a common (sometimes valid) excuse — but breaks down when JWT is in a cookie.

### Risk Pattern
- Attacker tricks authenticated user into submitting malicious form
- Account modification, money transfer, data deletion — all without user knowledge

### False Positive Notes
**If JWT is in Authorization header (not cookie)**: CSRF is NOT applicable. Authorization header requires JavaScript → CORS protects it. Only flag if auth uses cookies.

### Prevention Checklist
- [ ] `SameSite=Strict` or `SameSite=Lax` on all auth cookies (primary defense)
- [ ] CSRF token for `SameSite=Lax` (covers cross-site top-level navigation)
- [ ] Double-submit cookie pattern or synchronizer token pattern
- [ ] Verify `Origin` / `Referer` header on sensitive endpoints

---

## SEC-009: Insecure File Upload

**Confidence**: 90 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- File upload endpoints with no content-type validation
- Relying on `file.mimetype` from multipart parser (client-controlled — spoofable)
- No file extension allowlist
- Uploaded files stored in web-accessible directory
- No virus scanning integration
- Uploaded files executed directly (e.g., stored in `/public/uploads/` and served)

### Root Cause Pattern
File upload security underestimated. `file.mimetype` trusted as ground truth. Storage path chosen for convenience (web root) rather than security.

### Risk Pattern
- Malicious PHP/Python/Node files uploaded and executed as RCE
- Stored XSS via SVG upload (SVG can contain `<script>` tags)
- Path traversal via `../../../etc/passwd` in filename
- Storage exhaustion via massive file uploads

### Prevention Checklist
- [ ] Allowlist only expected extensions (`.jpg`, `.png`, `.pdf`)
- [ ] Validate MIME type server-side using `file-type` library (reads magic bytes)
- [ ] Sanitize filename — strip all path components, enforce safe characters
- [ ] Store uploads OUTSIDE web root (use S3/GCS with signed URLs for delivery)
- [ ] Set max file size limit
- [ ] For SVG: strip `<script>` tags or reject SVG entirely
- [ ] Consider virus scanning (ClamAV, cloud-based scanner) for user-uploaded content

### Remediation Strategy
```javascript
import fileType from 'file-type';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

app.post('/upload', upload.single('file'), async (req, res) => {
  const { buffer, originalname, size } = req.file;

  if (size > MAX_SIZE) return res.status(400).json({ error: 'File too large' });

  // Check actual file magic bytes (not client-supplied MIME type)
  const detected = await fileType.fromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES.includes(detected.mime)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  // Sanitize filename — generate a UUID, ignore original name entirely
  const ext = detected.ext;
  const safeFilename = `${crypto.randomUUID()}.${ext}`;

  // Store in S3 (not web root)
  await s3.putObject({ Bucket: process.env.UPLOADS_BUCKET, Key: safeFilename, Body: buffer });
});
```

---

## SEC-010: SSRF via User-Controlled URL Parameters

**Confidence**: 88 | **Stability**: Permanent | **Frequency**: Medium-High

### Detection Logic
- `fetch(req.body.url)` / `axios.get(req.query.url)` patterns
- Webhook URL configuration stored and called server-side
- Image/metadata proxy services that fetch user-supplied URLs
- PDF generation services that load URLs
- OAuth callback URLs not validated

### Root Cause Pattern
Server-side HTTP requests are necessary for many features (webhooks, proxies, integrations). URL validation is skipped as "the client knows what they want."

### Risk Pattern
- Internal metadata endpoints exposed: `http://169.254.169.254/` (AWS, GCP, Azure IMDS)
- Internal services accessible: `http://localhost:6379` (Redis), `http://localhost:5432` (Postgres)
- Cloud credentials harvested from metadata service
- Port scanning internal network

### Prevention Checklist
- [ ] URL allowlist (domain-based) for server-side HTTP requests
- [ ] Block private IP ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`
- [ ] Resolve hostname and validate resolved IP (DNS rebinding defense)
- [ ] Use dedicated SSRF-safe HTTP client library (`ssrf-req-filter` for Node)
- [ ] Webhook URLs validated at registration time, not just at call time

### Remediation Strategy
```javascript
import { isPrivateIp } from 'private-ip';
import dns from 'dns/promises';

const safeRequest = async (url) => {
  const parsed = new URL(url); // throws on invalid URL
  
  // Allowlist domains
  const ALLOWED_DOMAINS = ['api.stripe.com', 'hooks.slack.com'];
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    throw new Error('Domain not allowed');
  }

  // Resolve and validate IP (prevent DNS rebinding)
  const { address } = await dns.lookup(parsed.hostname);
  if (isPrivateIp(address)) {
    throw new Error('Private IP range not allowed');
  }

  return fetch(url);
};
```
