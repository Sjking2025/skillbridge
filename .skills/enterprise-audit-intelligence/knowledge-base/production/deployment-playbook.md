# Deployment Playbook — Production Knowledge Base

> **Category**: Production Readiness  
> **Mandatory Load**: Yes — load for production readiness audit category  
> **Version**: v1.0

---

## PROD-001: No Health Check Endpoints

**Confidence**: 97 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- No `/health`, `/healthz`, `/ready`, `/live` endpoints defined
- Health endpoint exists but always returns 200 regardless of DB/cache connectivity
- Kubernetes liveness/readiness probes not configured
- Load balancer has no health check configured

### Root Cause Pattern
Health checks are infrastructure concerns developers don't think about. Framework boilerplate doesn't include them.

### Risk Pattern
- Load balancer routes traffic to dead instances
- Kubernetes restarts healthy pods, ignores broken ones
- Zero visibility into degraded-but-running state
- Deployments don't detect broken rollouts

### Prevention Checklist
- [ ] `/healthz` (liveness): Is the process running? (simple ping)
- [ ] `/readyz` (readiness): Are dependencies ready? (DB, cache, queues)
- [ ] Health endpoints excluded from auth middleware
- [ ] Health endpoints excluded from rate limiting
- [ ] Kubernetes probes configured with appropriate `initialDelaySeconds`
- [ ] Load balancer health check pointing to `/healthz`

### Remediation Strategy
```javascript
// Liveness — simple, fast, no external calls
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Readiness — checks dependencies
app.get('/readyz', async (req, res) => {
  const checks = {};
  let healthy = true;

  try {
    await db.raw('SELECT 1');
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'error';
    healthy = false;
  }

  try {
    await redis.ping();
    checks.cache = 'ok';
  } catch (e) {
    checks.cache = 'degraded'; // non-critical — don't fail readiness
  }

  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});
```

```yaml
# Kubernetes probe config
livenessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /readyz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2
```

---

## PROD-002: Secrets Committed to Version Control

**Confidence**: 99 | **Stability**: Permanent | **Frequency**: Common

### Detection Logic
- `.env` files tracked by git (not in `.gitignore`)
- `git log --all -S "password"` returns results
- API keys, DB URLs, private keys in source files
- `docker-compose.yml` with hardcoded credentials in `environment:` block

### Root Cause Pattern
Development speed prioritized over hygiene. `.env` accidentally committed and never cleaned from history.

### Risk Pattern
- Credentials live in git history **forever** even after file deletion
- Public repos: immediate exploitation by credential scanners
- Private repos: internal breach vector, audit failure

### Prevention Checklist
- [ ] `.gitignore` includes `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`
- [ ] `git-secrets` pre-commit hook installed
- [ ] `truffleHog` / `gitleaks` in CI pipeline
- [ ] Rotate ALL credentials found — assume compromised
- [ ] Historical scan: `git log --all --full-history` for sensitive files

### Remediation (if found in history)
```bash
# 1. Rotate all exposed credentials IMMEDIATELY
# 2. Remove from history using git-filter-repo (not filter-branch)
pip install git-filter-repo
git filter-repo --path .env --invert-paths

# 3. Force-push all branches
git push origin --force --all

# 4. Notify all contributors to re-clone (old clones still have history)
# 5. Check GitHub/GitLab for cached versions of the file
```

---

## PROD-003: No Centralized Error Logging / Observability

**Confidence**: 95 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- `console.log` / `console.error` used for error reporting (no structured logging)
- No error tracking service (Sentry, Datadog, Rollbar, Bugsnag)
- No log aggregation (no ELK, Datadog, CloudWatch, Loki configured)
- Errors silently caught and discarded: `catch (e) { }`
- No distributed tracing for multi-service architectures

### Root Cause Pattern
Local development works with console logs. Production observability treated as "nice to have" — gets skipped under deadline pressure.

### Risk Pattern
- Production bugs invisible until users complain
- No ability to debug production issues without shell access
- MTTR (mean time to recovery) dramatically increased
- SLA violations undetected

### Prevention Checklist
- [ ] Structured JSON logging (Pino, Winston with JSON formatter)
- [ ] Error tracking service integrated (Sentry minimum)
- [ ] All unhandled rejections and exceptions captured
- [ ] Request tracing headers (X-Request-ID, X-Correlation-ID)
- [ ] Log levels respected in production (DEBUG off, ERROR/WARN on)
- [ ] Alerting configured for error rate spikes

### Remediation Strategy
```javascript
import pino from 'pino';
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Global unhandled rejection capture
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  Sentry.captureException(reason);
});

// Request middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  req.log = logger.child({ requestId: req.requestId, method: req.method, path: req.path });
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Error middleware
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  req.log?.error({ err }, 'Request error');
  res.status(err.statusCode || 500).json({ error: 'Internal server error', requestId: req.requestId });
});
```

---

## PROD-004: No Rollback Strategy in Deployment Pipeline

**Confidence**: 93 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- CI/CD pipeline deploys but has no rollback step defined
- No blue/green or canary deployment configuration
- Database migrations run before app health is verified
- `latest` tag used for Docker images (no versioned tags)
- No previous image tag recorded for emergency rollback

### Root Cause Pattern
Rollback planning happens after the first bad deploy, not before.

### Risk Pattern
- Bad deploy → downtime until hotfix is coded and deployed
- Irreversible database migrations applied before noticing app failure
- No way to quickly restore previous state

### Prevention Checklist
- [ ] All Docker images tagged with git SHA (never `latest` in production)
- [ ] Previous image tag stored and reachable in CI/CD system
- [ ] Rollback runbook documented and tested
- [ ] Database migrations: backwards-compatible by default (expand/contract pattern)
- [ ] Migration separated from deployment (run before, not during)
- [ ] Blue/green or canary deployment for zero-downtime releases
- [ ] Smoke tests run post-deploy before traffic shift

### Expand/Contract Migration Pattern
```sql
-- NEVER: Drop column in same deploy as removing code reference
-- INSTEAD:

-- Phase 1 (deploy 1): Add new column, keep old
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

-- Phase 2 (deploy 2): Migrate data, update code to use new column
UPDATE users SET email_verified_at = created_at WHERE email_verified = true;

-- Phase 3 (deploy 3): Drop old column (only after verifying no references)
ALTER TABLE users DROP COLUMN email_verified;
```
