# Token Management — Knowledge Base

> **Category**: Security → Auth Tokens  
> **Mandatory Load**: Yes — load for any project with user authentication  
> **Version**: v1.0  
> **References**: RFC 6749, RFC 6750, RFC 7519, OWASP Session Management Cheat Sheet

---

## SEC-001: JWT Stored in localStorage Without Rotation

*(Full entry in `auth-vulnerabilities.md` — cross-reference)*

---

## SEC-007: Authentication Token Leakage in Logs

*(Full entry in `auth-vulnerabilities.md` — cross-reference)*

---

## TOKEN-001: No Refresh Token Rotation

**Confidence**: 88 | **Stability**: Likely Permanent | **Frequency**: Very Common

### Detection Logic
- `/auth/refresh` endpoint issues new access token but reuses same refresh token
- Refresh token has no expiry (`exp` claim absent or set to years-long TTL)
- Refresh tokens not invalidated on logout
- No refresh token family tracking (replay detection absent)

### Root Cause Pattern
Stateless JWT philosophy taken too far. Developers avoid server-side state by never invalidating tokens — defeating the purpose of short-lived access tokens.

### Risk Pattern
- Stolen refresh token provides permanent access
- Logout is cosmetic — backend remains accessible
- Token replay attacks after credential theft go undetected

### Prevention Checklist
- [ ] Refresh token single-use: invalidate on use, issue new one
- [ ] Refresh token family tracking (detect replay → invalidate entire family)
- [ ] Refresh token TTL: 7–30 days (sliding window)
- [ ] Access token TTL: 5–15 minutes
- [ ] Logout invalidates refresh token server-side
- [ ] Refresh tokens stored in DB or Redis (revocation capability)

### Remediation Strategy
```javascript
// Refresh endpoint with rotation
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;

  const tokenRecord = await db.RefreshToken.findOne({ token: refreshToken });

  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    // If token already used → possible replay attack → invalidate family
    if (tokenRecord?.used) {
      await db.RefreshToken.deleteMany({ family: tokenRecord.family });
      return res.status(401).json({ error: 'Token reuse detected. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Mark old token as used
  await tokenRecord.updateOne({ used: true });

  // Issue new token pair
  const newRefreshToken = crypto.randomUUID();
  await db.RefreshToken.create({
    token: newRefreshToken,
    userId: tokenRecord.userId,
    family: tokenRecord.family,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const accessToken = jwt.sign({ userId: tokenRecord.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

  res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
  res.json({ accessToken });
});
```

---

## TOKEN-002: Weak JWT Secret / Algorithm Confusion

**Confidence**: 87 | **Stability**: Permanent | **Frequency**: Medium

### Detection Logic
- `jwt.sign(payload, 'secret')` or `jwt.sign(payload, 'changeme')`
- JWT secret shorter than 256 bits (32 characters)
- `alg: 'none'` accepted by JWT verification
- Server accepts both `HS256` and `RS256` (algorithm confusion attack vector)
- Secret stored in plaintext in `.env` and never rotated

### Root Cause Pattern
JWT libraries require a secret — developers use placeholders that never get changed. Algorithm flexibility intended for compatibility becomes an attack surface.

### Risk Pattern
- Weak secrets brute-forceable offline once JWT is captured
- `alg: none` bypass: attacker strips signature, server accepts unsigned token
- Algorithm confusion: RS256 public key used as HS256 secret → forge tokens with public key

### Prevention Checklist
- [ ] JWT secret ≥ 256 bits (32+ random bytes), generated with `crypto.randomBytes(32)`
- [ ] Explicitly specify algorithm in verification: `jwt.verify(token, secret, { algorithms: ['HS256'] })`
- [ ] Never accept `alg: none`
- [ ] Secret rotation plan documented and tested
- [ ] Use RS256/ES256 for multi-service architectures (public/private key pair)

### Remediation Strategy
```javascript
// BEFORE (weak)
jwt.verify(token, process.env.JWT_SECRET); // accepts any algorithm including none

// AFTER (hardened)
jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'], // explicit allowlist
  issuer: 'your-app-name',
  audience: 'your-app-users',
});

// Generate strong secret (run once, store in secrets manager)
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## TOKEN-003: OAuth State Parameter Missing (CSRF on OAuth Flow)

**Confidence**: 85 | **Stability**: Likely Permanent | **Frequency**: Medium

### Detection Logic
- OAuth2 authorization URL constructed without `state` parameter
- `/auth/callback` endpoint doesn't validate `state` against session
- `state` parameter present but not cryptographically random (e.g., `state=1`)

### Root Cause Pattern
OAuth tutorials omit `state` for simplicity. Developers copy examples directly into production.

### Risk Pattern
- CSRF on OAuth flow: attacker initiates OAuth, tricks victim into completing it
- Attacker's account gets linked to victim's session → account takeover

### Prevention Checklist
- [ ] Generate cryptographically random `state` per OAuth request
- [ ] Store `state` in server-side session (not cookie)
- [ ] Validate `state` matches exactly on callback before exchanging code
- [ ] `state` single-use: invalidate after successful validation

### Remediation Strategy
```javascript
// Initiate OAuth
app.get('/auth/github', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state; // server-side session only
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&state=${state}&scope=read:user`;
  res.redirect(url);
});

// Callback
app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state || state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid OAuth state — possible CSRF attack' });
  }
  delete req.session.oauthState; // single-use

  // proceed with code exchange
});
```
