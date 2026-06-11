# False Positive Patterns

## Purpose

A false positive in a security audit damages trust. Flag something that isn't a problem, and the client either wastes engineering time or — worse — starts ignoring your audits entirely.

This file captures **known noise patterns**: situations that look dangerous but typically aren't, and require verification before flagging.

---

## False Positive Categories

### 1. Authentication & Tokens

**Pattern**: Token stored in non-httpOnly cookie or localStorage  
**Looks dangerous**: Token accessible to JavaScript → XSS risk  
**When it's NOT a problem**:
- Application has a strict CSP that blocks inline scripts and untrusted origins
- Token is a short-lived access token (< 5 minutes) with no refresh
- Token is not the primary auth mechanism (secondary factor, read-only scope)

**Verification step**: Check CSP headers, token TTL, and scope before flagging.

---

**Pattern**: No token expiry in JWT payload  
**Looks dangerous**: Infinite session  
**When it's NOT a problem**:
- Server-side session invalidation is implemented (revocation list, Redis session store)
- JWT is used only for stateless operations with server-side state management elsewhere

**Verification step**: Check for server-side session/token revocation before flagging.

---

### 2. CORS Configuration

**Pattern**: `Access-Control-Allow-Origin: *` present  
**Looks dangerous**: Any origin can make requests  
**When it's NOT a problem**:
- Endpoint is a public read-only API (CDN-backed, no auth, no user data)
- Endpoint is a public health check or metrics endpoint
- Cookies are not used for auth (wildcard + credentials=true is still dangerous)

**Verification step**: Check if the endpoint requires auth. If no auth, wildcard may be acceptable.

---

### 3. Logging

**Pattern**: Request body logged at DEBUG level  
**Looks dangerous**: Sensitive data in logs  
**When it's NOT a problem**:
- DEBUG logging is disabled in production via environment flag
- Log sanitization middleware strips sensitive fields before logging

**Verification step**: Check production environment config for log level. Check for log sanitization middleware.

---

### 4. Database

**Pattern**: No foreign key constraints in NoSQL (MongoDB, DynamoDB, etc.)  
**Looks dangerous**: Orphaned data, integrity failure  
**When it's NOT a problem**:
- NoSQL databases by design don't enforce relational constraints
- Application-level integrity is enforced in the service layer
- Data is append-only / event-sourced (no deletion, no orphaning possible)

**Verification step**: For NoSQL, check application-level consistency logic before flagging missing FKs.

---

**Pattern**: No database indexes visible in schema file  
**Looks dangerous**: Slow queries at scale  
**When it's NOT a problem**:
- ORM manages indexes separately (check migration files, not just schema)
- Database is small and indexed via the primary key only (acceptable for low-volume data)
- Database is a read replica with indexes defined on the primary

**Verification step**: Check migration files, ORM config, and actual query patterns before flagging.

---

### 5. Error Handling

**Pattern**: Generic `catch (e) { console.log(e) }` pattern  
**Looks dangerous**: Silent failure, no error tracking  
**When it's NOT a problem**:
- There is a global error handler / middleware that captures all exceptions
- The `console.log` is overridden by the logging framework (e.g., Pino, Winston)

**Verification step**: Check for global error handler before flagging individual catch blocks.

---

### 6. Performance

**Pattern**: ORM `.findAll()` / `.find({})` with no pagination  
**Looks dangerous**: Full table scan, memory explosion  
**When it's NOT a problem**:
- Table is bounded in size by design (e.g., a config table with < 100 rows)
- Result is cached immediately after first load

**Verification step**: Check table size constraints and caching layer before flagging.

---

### 7. Rate Limiting

**Pattern**: No rate limiting on an API endpoint  
**Looks dangerous**: DDoS / brute force vector  
**When it's NOT a problem**:
- Rate limiting is handled upstream (API Gateway, Cloudflare, Nginx)
- Endpoint is internal-only (no public exposure, protected by VPN/network policy)

**Verification step**: Check infra layer (API Gateway config, Nginx rules) before flagging missing app-level rate limiting.

---

### 8. Secrets

**Pattern**: API key visible in frontend JavaScript bundle  
**Looks dangerous**: Credential exposure  
**When it's NOT a problem**:
- Key is a **public** API key designed for client-side use (e.g., Stripe publishable key, Firebase API key, Google Maps key)
- Key has domain restrictions configured in the provider's dashboard

**Verification step**: Check if the key is a publishable/public key vs. a secret key. Check provider docs.

---

## Anti-Pattern: Confirm Before Flagging

For any finding that matches a false positive pattern, always apply:

```
BEFORE flagging: 
  → Verify the false positive conditions do NOT apply
  → If uncertain: flag as "Verify Required" with severity reduced by one level
  → Never silently drop a finding — either flag it or document why you ruled it out
```

---

## Updating This File

When a concern is flagged in an audit but turns out to be a false positive:
1. Add the pattern here with full context
2. Reduce the confidence score of the related concern by 5–10 points
3. Note the false positive in the concern's `False Positive Notes` section
4. Update `evolution/changelog.md`
