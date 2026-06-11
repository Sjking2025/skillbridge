# Learning Engine — How to Evolve the Knowledge Base

## Purpose

Every audit must make future audits smarter. This file defines the exact process for converting new findings into permanent, validated engineering intelligence.

Think of this as the mechanism that transforms a junior engineer's checklist into a principal engineer's pattern recognition — accumulated across hundreds of systems.

---

## When to Run the Learning Engine

Run after **every completed audit**, regardless of how routine it seemed. Even audits with no new findings confirm existing knowledge (boosting confidence scores).

---

## The Learning Pipeline

Execute this pipeline for every issue found in the audit:

### STEP 1 — Classify: Known vs Unknown

For each issue found:

1. Load `audit-intelligence/learned-concerns.md`
2. Compare the issue against every entry
3. Classify:

| Classification | Action |
|---------------|--------|
| **Known** (already in KB) | Update confidence score. Note frequency. No new entry. |
| **Variant** (similar but different trigger/context) | Create variant entry linked to parent. |
| **Unknown** (genuinely new) | Proceed to Step 2. |

### STEP 2 — Root Cause Understanding (Unknown Issues Only)

Do NOT memorize symptoms. Extract the root cause.

**Bad learning**: "JWT was leaked"

**Good learning**: "Authentication token leaked because reconnect fallback bypassed secure transport validation and debug logger captured headers without sanitization"

Ask for every unknown issue:
- Why did this happen? (architectural reason)
- What false assumption enabled it?
- Could this happen in a different context/language/framework?
- Is this a symptom of a deeper pattern?

### STEP 3 — Validate Before Storing

Never store unvalidated findings. Apply this checklist:

| Check | Question | Pass Condition |
|-------|----------|----------------|
| Technical Accuracy | Is this actually a real problem? | Yes, verifiable |
| Reproducibility | Could this happen again? | Yes, in similar systems |
| Generalizability | Does this affect more than one project? | Yes |
| Production Relevance | Does this matter at scale? | Yes |
| False Positive Risk | Could this be noise? | Low |
| Severity Justification | Is the severity score defensible? | Yes, with reasoning |

If any check fails → do not store. Mark as "Candidate — Needs More Evidence."

### STEP 4 — Pattern Extraction

Transform the specific finding into a reusable, generalized engineering concern.

Template:
```
FROM: [Project-specific symptom]
TO:   [Category] — [Generalized concern title]

Detection Logic: [How to spot this in any codebase]
Root Cause Pattern: [Why this typically happens]
Risk Pattern: [What goes wrong if ignored]
```

Example transformation:
```
FROM: "PrintFlow websocket handler logs Authorization headers on reconnect"
TO:   Security — Authentication token leakage during transport fallback or reconnection

Detection Logic: Search for reconnect/fallback handlers that invoke loggers before auth
                 token sanitization. Check WebSocket upgrade handlers, SSE reconnect logic,
                 long-poll retry paths.
Root Cause Pattern: Debug logging added during development persists to production.
                    Auth headers treated as generic metadata rather than sensitive data.
Risk Pattern: Tokens visible in log aggregation systems (Datadog, Splunk, CloudWatch).
              Exploitable by anyone with log access — internal threat vector often overlooked.
```

### STEP 5 — Store in Knowledge Base

1. Determine the correct `knowledge-base/[category]/` file
2. Append the concern using the **Standard Concern Block** format (see below)
3. Add entry to `audit-intelligence/learned-concerns.md` index
4. Update `evolution/changelog.md`

---

## Standard Concern Block Format

Every stored concern must follow this format exactly (enables deduplication and search):

```markdown
---
## [CONCERN-ID]: [Concern Title]
**Category**: Security / Architecture / Performance / DevOps / API / Database / Frontend / Testing
**Severity**: Critical / High / Medium / Low
**Confidence Score**: 0–100
**Stability**: Permanent / Likely Permanent / Evolving / Temporary
**First Seen**: [Audit reference or date]
**Frequency**: 1 (increment on each re-discovery)
**Related CVEs/References**: (if applicable)

### Detection Logic
How to identify this concern in any codebase. Be specific about:
- file patterns to grep
- code constructs to look for
- config settings to check
- log signals that indicate presence

### Root Cause Pattern
Why this happens architecturally or implementationally. Not what happened — why.

### Risk Pattern
What goes wrong if ignored. Include:
- immediate impact
- cascading failures
- business consequence at scale

### Prevention Checklist
- [ ] item 1
- [ ] item 2
- [ ] item 3

### Remediation Strategy
Step-by-step fix. Include code pattern where useful.

### False Positive Notes
When this concern does NOT apply. Common situations where this looks dangerous but isn't.

### Audit Trigger Conditions
Automatically increase inspection depth when these signals are present:
- signal 1
- signal 2
---
```

---

## Confidence Scoring Rubric

See `audit-intelligence/confidence-scoring.md` for full rubric. Quick reference:

| Score | Meaning | Action |
|-------|---------|--------|
| 90–100 | Battle-tested, multi-project confirmed | Mandatory checklist item |
| 70–89 | Validated in multiple contexts | Standard audit inclusion |
| 50–69 | Validated once, plausible generalization | Include with caveat |
| 30–49 | One-off finding, limited evidence | Track as candidate |
| 0–29 | Unvalidated / possible noise | Do not store |

---

## Deduplication Rules

Before storing any new concern:

1. Check concern title similarity (80%+ title overlap = likely duplicate)
2. Check detection logic overlap (same grep patterns = likely duplicate)
3. Check root cause pattern (same architectural cause = merge, don't duplicate)

If duplicate detected:
- Merge the richer description
- Increment the `Frequency` counter
- Boost the `Confidence Score` by 5–10 points
- Do NOT create a new entry

---

## Knowledge Base Refactoring Triggers

Trigger a refactor of a knowledge-base file when:
- File exceeds 300 lines → split by subcategory
- 3+ concerns have the same root cause → extract a "pattern family"
- A concern's confidence drops below 30 after false positive → archive it
- A concern becomes obsolete (framework patched it) → mark deprecated, don't delete

---

## Evolution Changelog Entry Format

Every time the knowledge base changes, append to `evolution/changelog.md`:

```markdown
## [vX.Y] — [Date / Audit Reference]

### Added
- [CONCERN-ID]: [Title] → [knowledge-base file]

### Updated
- [CONCERN-ID]: [Title] — confidence +N, frequency +1

### Deprecated
- [CONCERN-ID]: [Title] — reason

### Refactored
- [file] split into [file-a] and [file-b] (reason: exceeded 300 lines)
```
