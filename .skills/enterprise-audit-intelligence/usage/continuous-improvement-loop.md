# Continuous Improvement Loop — Usage Guide

> **This is how you use the skill repeatedly until your product reaches 100/100.**
> Read this before every audit session. Follow the loop exactly.

---

## The Loop — Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THE AUDIT LOOP                           │
│                                                             │
│   SESSION 1                                                 │
│   ─────────                                                 │
│   FULL DEEP AUDIT                                           │
│   Understand everything → Find all issues → Score          │
│   Write tracker → Write session report                     │
│         │                                                   │
│         ▼                                                   │
│   Developer fixes issues (using Git Safe Protocol)         │
│         │                                                   │
│         ▼                                                   │
│   SESSION 2                                                 │
│   ─────────                                                 │
│   FIX VERIFICATION AUDIT (not a new scan)                  │
│   Check ONLY previously found issues                       │
│   Fixed? → Mark resolved in tracker                        │
│   Not fixed? → Write implementation plan                   │
│         │                                                   │
│         ▼                                                   │
│   Developer fixes remaining issues                         │
│         │                                                   │
│         ▼                                                   │
│   SESSION N                                                 │
│   ─────────                                                 │
│   FIX VERIFICATION continues...                            │
│   Until ALL identified issues = RESOLVED                   │
│         │                                                   │
│         ▼                                                   │
│   ALL ISSUES RESOLVED                                       │
│         │                                                   │
│         ▼                                                   │
│   FULL RE-AUDIT (new cycle begins)                         │
│   Fresh deep scan → Find NEW bugs → New score             │
│   Score improves. Loop repeats.                            │
│         │                                                   │
│         ▼                                                   │
│   Repeat until OVERALL SCORE = 100/100                     │
└─────────────────────────────────────────────────────────────┘
```

---

## How to Know Which Session Type to Run

At the start of every session, read `.audit/tracker.md` first.

```
IF tracker.md does NOT exist:
    → This is SESSION 1. Run FULL AUDIT.

IF tracker.md exists AND has OPEN issues:
    → Run FIX VERIFICATION AUDIT.
    → Do NOT run a full re-audit yet.

IF tracker.md exists AND ALL issues are RESOLVED:
    → Run FULL RE-AUDIT (new cycle).
    → Archive old tracker. Create new tracker.
    → Score should improve from previous cycle.
```

---

## SESSION TYPE 1 — Full Audit (First Run or New Cycle)

### When to use
- Very first audit of the project
- All issues from previous cycle are resolved → starting fresh cycle

### What to do

**Step 1 — Understand the system completely**
```
Read every file. Map every folder.
Understand: language, framework, auth, data flow, infra, deployment.
Draw a mental architecture map.
Do NOT skip this step. Do NOT rush it.
```

**Step 2 — Run all 12 audit categories**
```
Refer to SKILL.md → Step 2 for the full category list.
Load relevant knowledge-base files for each category.
Cross-reference every finding against learned-concerns.md.
```

**Step 3 — Write the session report**
```
File: .audit/session-NNN.md
Contains: full findings, all issues, root causes, fixes
Format: use Issue Reporting Format from SKILL.md → Step 3
```

**Step 4 — Write/update the tracker**
```
File: .audit/tracker.md
Add every issue found as a tracker entry (format below).
Status = OPEN for all new issues.
```

**Step 5 — Score the product**
```
File: .audit/tracker.md → Scorecard section
Record scores per dimension.
Record OVERALL score.
This is the baseline for this cycle.
```

**Step 6 — Run Learning Engine**
```
Refer to audit-intelligence/learning-engine.md
Validate and store any new concern types found.
```

**Step 7 — Safe Git operations**
```
Refer to git-safe-protocol.md BEFORE any git command.
No exceptions.
```

---

## SESSION TYPE 2 — Fix Verification Audit

### When to use
- After developer says they've fixed some/all issues
- tracker.md exists with OPEN issues

### What to do

**Step 1 — Load the tracker**
```
Read .audit/tracker.md completely.
List all OPEN issues.
Do NOT look for new issues yet. Stay focused.
```

**Step 2 — For each OPEN issue, verify the fix**

Go to the exact location of each issue. Verify:

```
VERIFICATION CHECKLIST (per issue):
□ Is the root cause actually addressed? (not just the symptom)
□ Does the fix match the recommended approach?
□ Are there tests covering the fix?
□ Could the fix have introduced a regression?
□ Is the fix applied consistently everywhere (not just one place)?
```

**Step 3 — Update tracker for each issue**

```
IF fix is complete and correct:
    → Status: OPEN → RESOLVED
    → Add: Resolution notes (what was done, how verified)
    → Add: Verified date

IF fix is incomplete or wrong:
    → Status: OPEN → BLOCKED (explain why fix is insufficient)
    → Write Implementation Plan (see format below)
    → Be specific: tell developer EXACTLY what to do

IF fix introduced a regression:
    → Keep original issue OPEN
    → Add NEW issue to tracker for the regression
    → Flag: REGRESSION — needs immediate attention
```

**Step 4 — Write Implementation Plan (for stuck/wrong fixes)**

```markdown
## Implementation Plan: [ISSUE-ID] [Issue Title]

### Why the current fix is insufficient
[Exact explanation — be surgical]

### What needs to happen instead

#### Step 1: [Specific action]
[Code example if needed]

#### Step 2: [Specific action]
[Code example if needed]

#### Step 3: Verify with this test
[Exact test command or test code]

### Definition of Done
[ ] [Specific, verifiable condition 1]
[ ] [Specific, verifiable condition 2]
[ ] [Specific, verifiable condition 3]

### Estimated effort
[S / M / L — Small (< 2h) / Medium (2–8h) / Large (> 8h)]
```

**Step 5 — Score update**

Even during fix verification, update the score:
```
Recalculate each dimension score based on:
  - Issues resolved this session
  - Regressions introduced (subtract)
Record delta: "Session N: +7 points (3 issues resolved, 1 regression found)"
```

**Step 6 — Decide next step**

```
IF all issues resolved:
    → Write summary: "All [N] identified issues resolved. Ready for full re-audit."
    → Archive tracker (rename to tracker-cycle-N.md)
    → Next session = FULL RE-AUDIT

IF issues remain:
    → Write summary: "[N] resolved, [M] remaining."
    → Next session = another Fix Verification
```

---

## SESSION TYPE 3 — Full Re-Audit (New Cycle)

### When to use
- All issues from previous cycle confirmed resolved
- Starting a fresh deep scan to find next layer of issues

### What to do

**Step 1 — Archive the previous cycle**
```bash
# Rename old tracker
mv .audit/tracker.md .audit/tracker-cycle-N.md

# Create fresh tracker
touch .audit/tracker.md
```

**Step 2 — Run full audit exactly like Session Type 1**
```
Same 12 categories.
Same depth.
Same paranoia level.
Do NOT assume previous fixes made everything safe.
Previous fixes can introduce new issues.
```

**Step 3 — Compare scores**
```
Previous cycle final score: [X]
New cycle baseline score: [Y]
Delta: [Y - X] points improvement
```

**Step 4 — Note what improved, what regressed**
```markdown
## Cycle [N] → Cycle [N+1] Comparison

### Improved (score went up because)
- [Category]: [What was fixed]

### Regressed (score went down because)
- [Category]: [New issue found / fix introduced regression]

### Net delta: +[N] points
### New issues found this cycle: [N]
```

---

## The .audit/ Folder Structure

```
.audit/
│
├── tracker.md                    ← ACTIVE issue tracker (current cycle)
│
├── session-001.md                ← Full audit report (Cycle 1, Session 1)
├── session-002.md                ← Fix verification report
├── session-003.md                ← Fix verification report
├── session-004.md                ← Full re-audit report (Cycle 2, Session 1)
│
├── tracker-cycle-1.md            ← Archived tracker (Cycle 1 complete)
├── tracker-cycle-2.md            ← Archived tracker (Cycle 2 complete)
│
├── progress.md                   ← Score history across ALL cycles
│
└── git-safety.log                ← Every git operation logged by the skill
```

Add `.audit/` to version control. It IS part of your product's engineering record.

---

## tracker.md Format

This is the master document. Keep it ruthlessly up to date.

```markdown
# Audit Tracker — [Project Name]

## Current Cycle: [N]
## Cycle Started: [Date]
## Last Updated: [Date / Session]

---

## Scorecard

| Dimension            | Cycle 1 | Cycle 2 | Cycle 3 | Target |
|----------------------|---------|---------|---------|--------|
| Security             |   45    |   67    |         |  100   |
| Production Readiness |   52    |   71    |         |  100   |
| Architecture         |   60    |   75    |         |  100   |
| Code Quality         |   55    |   68    |         |  100   |
| Performance          |   70    |   80    |         |  100   |
| Database             |   48    |   65    |         |  100   |
| Testing Coverage     |   30    |   55    |         |  100   |
| DevOps / Infra       |   40    |   60    |         |  100   |
| Frontend Quality     |   65    |   72    |         |  100   |
| **OVERALL**          | **52**  | **68**  |         |**100** |

---

## Open Issues

### [ISSUE-001] Missing rate limiting on auth endpoints
**Severity**: High | **Priority**: P1 | **Category**: Security
**Found**: Session 001 | **Status**: OPEN
**Assigned**: [developer name / self]
**Implementation Plan**: [link or inline]

---

### [ISSUE-002] JWT stored in localStorage
**Severity**: High | **Priority**: P1 | **Category**: Security
**Found**: Session 001 | **Status**: BLOCKED
**Blocked reason**: Fix attempted but token still written to localStorage in mobile auth flow
**Implementation Plan**: See session-002.md → Implementation Plan: ISSUE-002

---

## Resolved Issues

### [ISSUE-003] No health check endpoints
**Severity**: High | **Priority**: P1 | **Category**: Production
**Found**: Session 001 | **Status**: RESOLVED
**Resolved**: Session 002
**How fixed**: Added /healthz and /readyz endpoints with DB + Redis checks
**Verified by**: Confirmed endpoints return correct 200/503 responses

---

## Regression Log
*(Issues introduced by fixes — must be resolved before cycle closes)*

| ID | Introduced By | Description | Status |
|----|--------------|-------------|--------|
| REG-001 | Fix for ISSUE-005 | Rate limiter blocks all requests in staging | OPEN |

---

## Cycle Summary
- Total issues this cycle: [N]
- Resolved: [N]
- Open: [N]
- Blocked: [N]
- Regressions: [N]
- Cycle status: IN PROGRESS / COMPLETE
```

---

## progress.md — The Score History

Track every session score in one place. This is your product's quality journey.

```markdown
# Product Quality Progress

## Target: 100/100 Overall

| Session | Type | Date | Security | Prod | Arch | Quality | Perf | DB | Test | DevOps | Frontend | OVERALL | Delta |
|---------|------|------|----------|------|------|---------|------|----|------|--------|----------|---------|-------|
| 001 | Full Audit | YYYY-MM-DD | 45 | 52 | 60 | 55 | 70 | 48 | 30 | 40 | 65 | **52** | — |
| 002 | Fix Verify | YYYY-MM-DD | 55 | 65 | 60 | 55 | 70 | 48 | 30 | 40 | 65 | **57** | +5 |
| 003 | Fix Verify | YYYY-MM-DD | 67 | 71 | 60 | 68 | 70 | 65 | 55 | 60 | 72 | **65** | +8 |
| 004 | Full Re-Audit | YYYY-MM-DD | 67 | 71 | 75 | 68 | 80 | 65 | 55 | 60 | 72 | **68** | +3 |

## Milestones
- [ ] 60/100 — Foundation stable
- [ ] 70/100 — Production-safe
- [ ] 80/100 — Client-deliverable
- [ ] 90/100 — Enterprise-grade
- [ ] 100/100 — Done
```
