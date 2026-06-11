# Infrastructure Security — Knowledge Base

> **Category**: Security → Infrastructure  
> **Mandatory Load**: Yes — load for any project with a web-facing interface or API  
> **Version**: v1.0  
> **References**: OWASP Secure Headers Project, Mozilla Observatory, NIST 800-52

---

## SEC-005: CORS Misconfiguration (Wildcard Origin)

**Confidence**: 94 | **Stability**: Likely Permanent | **Frequency**: Very Common

### Detection Logic
- `Access-Control-Allow-Origin: *` on authenticated endpoints
- `origin: '*'` in CORS middleware config
- Dynamic origin reflection without validation: `res.setHeader('Access-Control-Allow-Origin', req.headers.origin)`
- `credentials: true` combined with wildcard origin (browser blocks but intent is dangerous)

### Root Cause Pattern
CORS errors during development fixed by "just set it to wildcard" — never revisited. Dynamic reflection added to "support all clients" without security consideration.

### Risk Pattern
- Cross-site requests from any domain can read authenticated API responses
- Combined with XSS on any site: auth bypass
- Data exfiltration from credentialed sessions

### False Positive Notes
Wildcard is acceptable for **public read-only APIs** with no authentication. Check before flagging.

### Prevention Checklist
- [ ] Explicit origin allowlist (never dynamic reflection without validation)
- [ ] Separate CORS policy for public vs. authenticated endpoints
- [ ] `credentials: true` only paired with explicit origins (never wildcard)
- [ ] Allowlist stored in environment config, not hardcoded

### Remediation Strategy
```javascript
// BEFORE (dangerous)
app.use(cors({ origin: '*' }));

// AFTER (safe)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS rejected: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## INFRA-001: Missing Security Headers

**Confidence**: 93 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- Response headers don't include `Content-Security-Policy`
- Missing `X-Content-Type-Options: nosniff`
- Missing `X-Frame-Options: DENY` (or CSP `frame-ancestors`)
- Missing `Strict-Transport-Security`
- Missing `Referrer-Policy`
- No `helmet` or equivalent middleware in Node.js apps

### Root Cause Pattern
Security headers are invisible to functionality — easy to forget. Not included in most framework boilerplate.

### Risk Pattern
- Missing CSP: XSS attacks execute without restriction
- Missing `X-Frame-Options`: clickjacking attacks
- Missing HSTS: SSL stripping attacks on first visit
- Missing `nosniff`: MIME confusion attacks

### Prevention Checklist
- [ ] `helmet()` in Express (or equivalent for other frameworks)
- [ ] CSP configured with explicit allowlists (not `unsafe-inline`)
- [ ] HSTS with `max-age=31536000; includeSubDomains; preload`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restricting unused browser features
- [ ] Run Mozilla Observatory scan before production release

### Remediation Strategy
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.yourcdn.com'],
      styleSrc: ["'self'", "'unsafe-inline'"], // remove unsafe-inline if possible
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.yourservice.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## INFRA-002: Insecure Cookie Configuration

**Confidence**: 91 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Session/auth cookies set without `httpOnly` flag
- Cookies without `Secure` flag (sent over HTTP)
- No `SameSite` attribute
- Cookie `domain` set too broadly: `domain=.example.com` exposes to all subdomains
- Long-lived session cookies without absolute expiry

### Root Cause Pattern
Cookie security flags not part of default framework behavior. Developers set cookies for functionality — security flags added as afterthought if at all.

### Risk Pattern
- No `httpOnly` → JavaScript can read cookie → XSS steals session
- No `Secure` → Cookie sent over HTTP → network interception
- No `SameSite` → CSRF attacks on cookie-authenticated endpoints

### Prevention Checklist
- [ ] All auth cookies: `httpOnly; Secure; SameSite=Strict`
- [ ] Session cookie absolute expiry (not just sliding)
- [ ] Cookie domain restricted to minimum necessary scope
- [ ] No sensitive data in non-httpOnly cookies

### Remediation Strategy
```javascript
// BEFORE (insecure)
res.cookie('sessionId', id, { maxAge: 86400000 });

// AFTER (hardened)
res.cookie('sessionId', id, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24h
  path: '/',
  // domain: 'yourdomain.com', // only if needed for subdomain sharing
});
```

---

## INFRA-003: TLS / HTTPS Not Enforced

**Confidence**: 95 | **Stability**: Permanent | **Frequency**: Medium

### Detection Logic
- HTTP traffic not redirected to HTTPS at app or server level
- No HSTS header (see INFRA-001)
- Mixed content: HTTPS page loading HTTP resources
- TLS version < 1.2 accepted
- Self-signed certificates in production

### Root Cause Pattern
HTTPS configured "at the load balancer" but termination misconfigured. HTTP→HTTPS redirect assumed to be "already handled."

### Prevention Checklist
- [ ] HTTP→HTTPS redirect at every layer (nginx, app, CDN)
- [ ] HSTS enabled with long `max-age`
- [ ] TLS 1.2 minimum, TLS 1.3 preferred
- [ ] Certificate monitoring (auto-rotation with Let's Encrypt / cert-manager)
- [ ] Mixed content audit (browser console check)

---

## INFRA-004: Secrets in Environment Variables Without Secret Manager

**Confidence**: 82 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- All secrets in `.env` files distributed to developers
- No AWS Secrets Manager / GCP Secret Manager / Vault / Doppler integration
- Secrets rotated manually (or never)
- `.env` files exist in multiple environments without access controls

### Root Cause Pattern
`.env` pattern is the default for most frameworks. Secret managers perceived as complex overhead for early-stage projects that never graduate to a proper solution.

### Risk Pattern
- `.env` files emailed, Slacked, or committed accidentally
- No audit trail for secret access
- No rotation → breach window extends indefinitely
- Insider threat: any developer can read all secrets

### Prevention Checklist
- [ ] Secrets manager for production credentials (AWS SM, GCP SM, Vault, Doppler)
- [ ] Application fetches secrets at startup, not from filesystem
- [ ] Secret rotation automated (30–90 day policy)
- [ ] `.env` only for local development, never production
- [ ] Access to production secrets audited and role-gated

### Remediation Strategy
```javascript
// AWS Secrets Manager integration
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

const getSecret = async (secretName) => {
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  return JSON.parse(response.SecretString);
};

// At app startup:
const secrets = await getSecret('prod/myapp/database');
const dbConnection = createConnection(secrets.DB_URL);
```
