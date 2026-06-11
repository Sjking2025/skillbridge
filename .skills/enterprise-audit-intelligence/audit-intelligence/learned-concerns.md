# Learned Concerns Registry

> **Status**: v1.0 — Seed Knowledge Base  
> **Total Concerns**: 24 (foundational)  
> **Last Updated**: System initialization  
> **Usage**: Load this file at the START of every audit. Cross-reference every finding against these entries before reporting.

---

## Index

| ID | Title | Category | Severity | Confidence | KB File | Frequency |
|----|-------|----------|----------|------------|---------|-----------|
| SEC-001 | JWT stored in localStorage without rotation | Security | High | 95 | security/token-management.md | — |
| SEC-002 | Missing RBAC on admin endpoints | Security | Critical | 97 | security/auth-vulnerabilities.md | — |
| SEC-003 | Hardcoded credentials in source code | Security | Critical | 99 | security/auth-vulnerabilities.md | — |
| SEC-004 | Missing rate limiting on auth endpoints | Security | High | 96 | security/api-security-risks.md | — |
| SEC-005 | CORS misconfiguration (wildcard origin) | Security | High | 94 | security/infra-security.md | — |
| SEC-006 | SQL/NoSQL injection via unsanitized input | Security | Critical | 99 | security/api-security-risks.md | — |
| SEC-007 | Authentication token leakage in logs | Security | Critical | 91 | security/token-management.md | — |
| SEC-008 | Missing CSRF protection on state-mutating endpoints | Security | High | 93 | security/api-security-risks.md | — |
| SEC-009 | Insecure file upload (no MIME/extension validation) | Security | High | 90 | security/api-security-risks.md | — |
| SEC-010 | SSRF via user-controlled URL parameters | Security | Critical | 88 | security/api-security-risks.md | — |
| ARCH-001 | Circular dependency between modules | Architecture | Medium | 92 | architecture/anti-patterns.md | — |
| ARCH-002 | God object / monolithic service boundary | Architecture | High | 94 | architecture/scalability-smells.md | — |
| ARCH-003 | Shared mutable state across service boundaries | Architecture | High | 90 | architecture/microservice-patterns.md | — |
| ARCH-004 | Missing graceful degradation for external dependencies | Architecture | High | 88 | architecture/scalability-smells.md | — |
| PROD-001 | No health check endpoints | Production | High | 97 | production/deployment-playbook.md | — |
| PROD-002 | Secrets committed to version control | Production | Critical | 99 | production/deployment-playbook.md | — |
| PROD-003 | No centralized error logging / observability | Production | High | 95 | production/observability.md | — |
| PROD-004 | No rollback strategy in deployment pipeline | Production | High | 93 | production/deployment-playbook.md | — |
| PERF-001 | N+1 database query pattern | Performance | High | 97 | performance/db-bottlenecks.md | — |
| PERF-002 | Missing database indexes on frequently-queried columns | Performance | High | 96 | performance/db-bottlenecks.md | — |
| DB-001 | Missing foreign key constraints | Database | Medium | 91 | database/schema-integrity.md | — |
| DB-002 | No database migration versioning | Database | High | 94 | database/schema-integrity.md | — |
| TEST-001 | No integration tests for critical user flows | Testing | High | 95 | testing/coverage-standards.md | — |
| FE-001 | Rendering raw HTML from user input (XSS vector) | Frontend | Critical | 98 | frontend/client-security.md | — |

---

## New Concerns Discovered in Audits

> Append here when the Learning Engine validates a new concern. Use the format below.

```
| [ID] | [Title] | [Category] | [Severity] | [Confidence] | [KB File] | [Frequency] |
```

---

## Archived Concerns (Deprecated/Superseded)

> Concerns moved here are no longer active but preserved for historical traceability.

*(None yet — v1.0)*

---

## Candidate Concerns (Needs More Evidence)

> Concerns seen once but not yet validated for promotion to the main registry.

*(None yet — v1.0)*
