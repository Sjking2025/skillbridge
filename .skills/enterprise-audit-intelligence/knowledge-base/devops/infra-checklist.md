# Infrastructure Checklist — DevOps Knowledge Base

> **Category**: DevOps & Infrastructure  
> **Mandatory Load**: Yes — load for DevOps audit category  
> **Version**: v1.0

---

## DEVOPS-001: Docker Image Running as Root

**Confidence**: 91 | **Stability**: Permanent | **Frequency**: Very Common

### Detection Logic
- `Dockerfile` has no `USER` directive (defaults to root)
- `USER root` explicitly set
- Container process visible as UID 0 in `docker inspect`
- No `--user` flag in docker-compose service definition

### Root Cause Pattern
Running as root "just works" — permissions never an issue. Container isolation perceived as sufficient protection.

### Risk Pattern
- Container escape vulnerability → attacker gains root on host
- Compromised app has root-level filesystem access inside container
- Violates principle of least privilege at infrastructure level
- Fails CIS Docker Benchmark, SOC2 controls

### Prevention Checklist
- [ ] Create non-root user in Dockerfile
- [ ] Run application as non-root user (UID 1000+)
- [ ] File permissions set correctly before USER switch
- [ ] Verify with `docker run --rm yourimage whoami` → should NOT return `root`

### Remediation Strategy
```dockerfile
# BEFORE (runs as root)
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
CMD ["node", "server.js"]

# AFTER (non-root user)
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy files before switching user
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --production

COPY --chown=appuser:appgroup . .

# Switch to non-root
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## DEVOPS-002: No Resource Limits in Container Orchestration

**Confidence**: 89 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Kubernetes `Deployment` with no `resources.requests` or `resources.limits`
- Docker Compose with no `mem_limit` or `cpus` constraints
- Single pod can consume all node resources

### Root Cause Pattern
Resource limits require profiling. Unknown resource usage in dev → "we'll figure it out in production."

### Risk Pattern
- Memory leak in one pod → OOMKilled → cascading restarts across node
- CPU-hungry process starves other pods on same node
- Kubernetes can't schedule pods efficiently without resource requests
- HorizontalPodAutoscaler can't function without resource metrics

### Prevention Checklist
- [ ] All pods have `resources.requests` defined
- [ ] All pods have `resources.limits` defined
- [ ] CPU limit 2-4x CPU request (allow bursting)
- [ ] Memory limit = memory request (avoid OOM surprises)
- [ ] HPA configured based on CPU/memory metrics

### Remediation Strategy
```yaml
# Kubernetes Deployment with resource limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: yourimage:latest
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## DEVOPS-003: Missing CI/CD Security Gates

**Confidence**: 87 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- CI pipeline: only runs tests, no security scanning
- No `npm audit` / `pip audit` / `trivy` in pipeline
- Docker images pushed without vulnerability scanning
- No SAST (Semgrep, SonarQube, CodeQL)
- Secrets scanning not configured (Gitleaks, truffleHog)
- All PRs can merge without passing security checks

### Root Cause Pattern
CI configured for functional correctness only. Security scanning added as an afterthought — if at all.

### Prevention Checklist
- [ ] Dependency vulnerability scan: `npm audit --audit-level=high` fails build on high/critical
- [ ] Container image scan: Trivy or Snyk Container in CI
- [ ] SAST: Semgrep or CodeQL on every PR
- [ ] Secret scanning: Gitleaks or GitHub secret scanning
- [ ] License compliance check for dependency licenses

### Remediation Strategy
```yaml
# GitHub Actions security pipeline
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Dependency Vulnerability Scan
        run: npm audit --audit-level=high

      - name: Secret Scanning
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: SAST with Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/nodejs
            p/secrets

      - name: Container Image Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'yourimage:${{ github.sha }}'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
```

---

## DEVOPS-004: No Environment Separation

**Confidence**: 93 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Single database used for development and production
- Production credentials used locally by developers
- No staging environment (deploy straight from dev to prod)
- Feature flags absent — all changes go live immediately
- Development activity visible in production logs

### Root Cause Pattern
Staging "costs too much" / "takes too long to set up." Small team assumes they don't need it — until a developer accidentally drops a production table.

### Risk Pattern
- Development testing corrupts production data
- Missing staging means production is the first real test environment
- Hotfix deployments can't be tested before reaching users
- GDPR/compliance: developer has direct production data access

### Prevention Checklist
- [ ] Minimum three environments: development, staging, production
- [ ] Separate databases per environment (never share)
- [ ] Production credentials inaccessible to developers directly
- [ ] CI/CD enforces deploy path: dev → staging → production
- [ ] Staging environment populated with anonymized production data (not real PII)
- [ ] Feature flags for gradual rollout without environment dependency
