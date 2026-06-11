# Confidence Scoring Rubric

## Purpose

Every concern stored in the knowledge base must carry a **Confidence Score (0–100)**. This score determines how aggressively the concern is applied in future audits and whether it appears on the mandatory checklist.

Confidence is NOT about how severe a concern is. It's about how certain we are that the concern:
1. Is technically real (not a false alarm)
2. Generalizes beyond the specific project where it was found
3. Will reliably appear in similar systems

---

## Scoring Dimensions

Score each dimension 0–20, then sum for final score.

### Dimension 1: Technical Accuracy (0–20)
| Score | Criteria |
|-------|----------|
| 18–20 | Documented in official security advisory, CVE, RFC, or vendor docs |
| 14–17 | Validated against OWASP, CWE, or equivalent authoritative source |
| 10–13 | Manually reproduced and verified in the audit |
| 6–9 | Logically sound but not externally validated |
| 0–5 | Assumption-based, no direct evidence |

### Dimension 2: Reproducibility (0–20)
| Score | Criteria |
|-------|----------|
| 18–20 | Reproducible step-by-step with known conditions |
| 14–17 | Highly likely to reproduce in similar codebases |
| 10–13 | Plausibly reproducible; context-dependent |
| 6–9 | Uncertain; depends on rare configuration |
| 0–5 | One-off; unclear if reproducible |

### Dimension 3: Generalizability (0–20)
| Score | Criteria |
|-------|----------|
| 18–20 | Language/framework agnostic; affects any system |
| 14–17 | Affects a broad class of systems (e.g., all Node.js APIs) |
| 10–13 | Affects a specific framework or pattern |
| 6–9 | Specific to a project architecture pattern |
| 0–5 | Unique to one codebase |

### Dimension 4: Production Relevance (0–20)
| Score | Criteria |
|-------|----------|
| 18–20 | Has caused documented production incidents or breaches |
| 14–17 | Would cause clear, measurable harm at production scale |
| 10–13 | Would cause degradation under real traffic/load |
| 6–9 | Low-impact in most production scenarios |
| 0–5 | Cosmetic or negligible production impact |

### Dimension 5: False Positive Risk (0–20)
| Score | Criteria |
|-------|----------|
| 18–20 | Virtually never a false positive |
| 14–17 | False positive rate < 5% (rare edge cases) |
| 10–13 | False positive rate 5–20% (some context-dependence) |
| 6–9 | False positive rate 20–40% (needs careful qualification) |
| 0–5 | False positive rate > 40% (noisy signal) |

---

## Scoring Actions by Total Score

| Total Score | Grade | Mandatory? | Audit Action |
|------------|-------|------------|--------------|
| 90–100 | A+ | YES | Mandatory checklist item — always check |
| 80–89 | A | YES | Standard audit inclusion — always check |
| 70–79 | B | No | Include with context — check when relevant signals present |
| 60–69 | C | No | Include as advisory — flag if easy to verify |
| 50–59 | D | No | Track as candidate — note if found, don't hunt |
| 0–49 | F | No | Do not store — return to candidate pool or discard |

---

## Score Adjustment Rules

**Boost confidence by:**
- +5 → Re-discovered in a second unrelated codebase
- +10 → Re-discovered in 3+ codebases
- +5 → Linked to a public CVE or security advisory
- +5 → OWASP, CWE, or RFC citation added
- +3 → False positive noted and documented (improving precision)

**Reduce confidence by:**
- -10 → Flagged as false positive in a real audit
- -5 → Framework/library patched it (concern may be obsolete)
- -15 → Determined to be noise in 2+ audits

**Freeze concern (do not adjust) when:**
- Confidence ≥ 95 (ceiling — proven fundamental)
- Concern is formally documented in a security advisory

---

## Stability Classification

| Stability | Meaning | Example |
|-----------|---------|---------|
| **Permanent** | Will not change regardless of technology evolution | SQL injection, hardcoded secrets |
| **Likely Permanent** | Core pattern stable; implementation details evolve | JWT misuse, CORS misconfiguration |
| **Evolving** | Guidance changes as frameworks/standards evolve | CSP headers, OAuth flows |
| **Temporary** | Specific to a version or dependency | Framework-specific CVE |

Temporary concerns must include an expiry trigger (e.g., "Reassess when framework X reaches v3.0").
