# Dependency Audit Reference

> **Category**: Reference  
> **Load When**: Running dependency audit category  
> **Version**: v1.0

---

## Audit Dimensions

Every dependency in a project must be evaluated across five dimensions:

| Dimension | What to Check | Tools |
|-----------|--------------|-------|
| **Vulnerabilities** | Known CVEs in installed version | `npm audit`, `snyk test`, `pip-audit` |
| **Currency** | How far behind latest stable release | `npm outdated`, `pip list --outdated` |
| **Maintenance** | Is the package actively maintained? | GitHub last commit, issue response rate |
| **Necessity** | Is this dependency actually needed? | Bundle analyzers, dead code detection |
| **License** | Is the license compatible with commercial use? | `license-checker`, `pip-licenses` |

---

## Vulnerability Severity Tiers

| CVSS Score | Severity | CI/CD Action |
|-----------|----------|-------------|
| 9.0–10.0 | Critical | Block deploy immediately |
| 7.0–8.9 | High | Block deploy within 24h |
| 4.0–6.9 | Medium | Fix within sprint |
| 0.1–3.9 | Low | Track, fix when convenient |

---

## Maintenance Red Flags

A package is **at risk** when two or more of these are true:

- Last commit > 12 months ago
- No response to open issues > 3 months
- `DEPRECATED` notice in npm/PyPI
- Single maintainer with no bus-factor protection
- Fewer than 1,000 weekly downloads (for non-niche packages)
- No security policy (`SECURITY.md`) for security-critical packages

**High-risk categories**: Auth libraries, cryptography, HTTP clients, parsing libraries, serialization

---

## Supply Chain Risk Patterns

### Typosquatting
- `lodahs` instead of `lodash`
- `expresss` instead of `express`
- Action: Verify all package names match intended library exactly

### Dependency Confusion
- Private package names that could be claimed on public registry
- Action: Use scoped packages (`@yourorg/package`) and registry allowlists

### Compromised Maintainer
- Legitimate package with new malicious version
- Action: Lock dependency versions in `package-lock.json` / `poetry.lock`. Review changelogs for major version bumps before upgrading

---

## License Risk Tiers

| License | Commercial Risk | Action |
|---------|----------------|--------|
| MIT, BSD, Apache 2.0, ISC | None | ✅ Safe |
| LGPL | Medium — dynamic linking usually OK | Review usage |
| GPL v2/v3 | High — copyleft may infect product | Legal review required |
| AGPL | Critical — network use triggers copyleft | Block unless open source |
| SSPL | Critical — broad copyleft | Block unless open source |
| Proprietary / Custom | Varies | Legal review required |
| CC-BY-NC | Non-commercial only | Block for commercial products |

---

## Unnecessary Dependency Detection

### Signals a dependency may be unnecessary
- Listed in `dependencies` but only used in tests → move to `devDependencies`
- Installed but never imported anywhere in codebase
- Functionality available natively (e.g., `is-odd` package — seriously)
- Package does one thing the codebase only calls once

### Impact of unnecessary dependencies
- Larger Docker image → slower CI, slower cold starts
- Wider attack surface (every dependency is an attack vector)
- License compliance risk from unused packages
- Version conflict potential

### Detection
```bash
# Node.js
npx depcheck

# Python
pip install pip-extra-reqs
pip-extra-reqs requirements.txt

# Bundle size analysis (frontend)
npx webpack-bundle-analyzer stats.json
npx source-map-explorer 'build/static/js/*.js'
```

---

## CI/CD Integration Checklist

```yaml
# Required dependency security checks in CI

# 1. Vulnerability scan — fail on high/critical
- run: npm audit --audit-level=high

# 2. Snyk scan (more comprehensive than npm audit)
- uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high

# 3. License compliance
- run: npx license-checker --onlyAllow 'MIT;BSD;Apache-2.0;ISC'

# 4. Outdated packages (warning, not failure)
- run: npm outdated || true  # report but don't fail

# 5. Container image dependencies
- uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

---

## Remediation Priority Matrix

| Finding | Remediation Priority | Action |
|---------|---------------------|--------|
| Critical CVE in direct dependency | P0 — immediate | Upgrade or replace package |
| Critical CVE in transitive dependency | P0 — immediate | Force resolution via overrides, or upgrade parent |
| High CVE in auth/crypto library | P0 — immediate | Treat as critical |
| High CVE in non-critical utility | P1 — within 24h | Upgrade |
| Abandoned auth/crypto package | P1 — within sprint | Find maintained alternative |
| GPL license in commercial product | P1 — legal review | Resolve before shipping |
| Medium CVE in any dependency | P2 — within sprint | Upgrade with testing |
| Outdated but no CVE | P3 — ongoing | Include in dependency update cycle |
| Dev dependency with CVE | P3 — assess | CVE must not affect production artifacts |
