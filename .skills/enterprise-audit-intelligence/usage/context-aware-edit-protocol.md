# Context-Aware File Edit Protocol

> **MANDATORY. Every single file edit — add, remove, modify — follows this protocol.**
> No exceptions. No shortcuts. Not even for "small" changes.
>
> This protocol exists because AI agents routinely destroy working systems by:
> - Editing files without reading them fully first
> - Missing imports that the edited file depends on
> - Missing exports that other files depend on
> - Touching unrelated files and breaking their logic
> - Making isolated edits that look correct alone but break the system as a whole
> - Never verifying the edit actually connects properly to the rest of the codebase
>
> Every edit must IMPROVE the system. Every edit must STRENGTHEN logic, security,
> and resilience. No edit may collapse, isolate, or break existing working logic.

---

## The Core Law

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   BEFORE touching any file:                                     │
│   READ it. READ everything connected to it.                     │
│   UNDERSTAND the full logic flow.                               │
│   MAP every dependency in and out.                              │
│   PLAN all changes across ALL affected files.                   │
│   THEN edit. In the right order.                                │
│   VERIFY after every single change.                             │
│                                                                 │
│   If you cannot map the full dependency graph → DO NOT EDIT.   │
│   Ask for more context first.                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Pre-Edit Intelligence Gathering

Execute this BEFORE writing a single character of changed code.

### Step 1A — Read the Target File Completely

```
READ the entire file. Not a skim. Not the relevant section. THE ENTIRE FILE.

Understand:
  - What does this file DO?
  - What does it EXPORT?
  - What does it IMPORT?
  - What SIDE EFFECTS does it have?
  - What STATE does it manage?
  - What ASSUMPTIONS does it make?
  - What would BREAK if any of these changed?
```

### Step 1B — Build the Dependency Map

For every file you plan to touch, map its full dependency graph.

```
DEPENDENCY MAP TEMPLATE
────────────────────────────────────────────

File: [path/to/target-file.js]

IMPORTS (what this file depends on):
  ← [module/path]         provides: [what it gives]
  ← [module/path]         provides: [what it gives]

EXPORTS (what depends on this file):
  → [module/path]         uses: [what it takes from here]
  → [module/path]         uses: [what it takes from here]

CALLED BY (runtime callers):
  → [route/handler]       calls: [function name]
  → [middleware]          calls: [function name]

ENVIRONMENT DEPENDENCIES:
  → [ENV_VAR_NAME]        used for: [purpose]
  → [ENV_VAR_NAME]        used for: [purpose]

PACKAGE DEPENDENCIES:
  → [npm-package]         used for: [purpose]

DATABASE INTERACTIONS:
  → [table/collection]    operation: [read/write/both]

SIDE EFFECTS:
  → [describes any side effects: cache writes, logs, events emitted]

TESTS COVERING THIS FILE:
  → [test file path]      covers: [what scenarios]
```

### Step 1C — Read Every Neighbour File

Every file in the dependency map must be READ before editing.

```
For each file in IMPORTS:
  → Read it fully
  → Confirm what it actually exports (not what you assume it exports)
  → Note if your edit would require changes here

For each file in EXPORTS (callers):
  → Read it fully
  → Confirm what it actually uses from the target file
  → Note if your edit would break its usage pattern

For each test file:
  → Read it fully
  → Note what tests exist
  → Note what tests will break after your edit
  → Plan what new tests are needed
```

**If any neighbour file reveals a new dependency → map that too.**
**Keep expanding until the dependency graph is complete.**

### Step 1D — Identify the Full Change Set

Only now, after reading everything, list EVERY file that needs to change.

```
FULL CHANGE SET
────────────────────────────────────────────

Primary target:
  [file]  — [what changes and why]

Required co-changes (edit breaks without these):
  [file]  — [what must change here]
  [file]  — [what must change here]

Package changes:
  package.json  — add: [package@version]  (if new dependency needed)

Environment changes:
  .env.example  — add: [VAR_NAME=description]  (if new env var needed)

Test changes:
  [test file]  — update: [which tests change]
  [test file]  — add: [what new tests needed]

Configuration changes:
  [config file]  — [what changes]

Documentation changes:
  [doc file]  — [what needs updating]  (if architecture changes)
```

**Rule**: If you cannot list the full change set with confidence → STOP. Read more files.

---

## Phase 2 — Pre-Edit Safety Checks

Before writing any code, run these checks mentally (or literally with grep/find).

### Check 2A — Import Integrity Scan

```bash
# Find every file that imports from your target file
grep -rn "from.*target-file\|require.*target-file" src/ --include="*.js" --include="*.ts"

# Find every named export your target file provides
grep -n "export" path/to/target-file.js

# Cross-reference: does your edit remove or rename any export?
# If YES → every importer must be updated. No exceptions.
```

### Check 2B — Function/Method Signature Scan

```bash
# Find every call site for functions you are modifying
grep -rn "functionName(" src/ --include="*.js" --include="*.ts"

# If you change a function signature:
#   - adding a required parameter → ALL call sites must be updated
#   - changing return shape → ALL consumers must be updated
#   - renaming the function → ALL call sites must be updated
```

### Check 2C — Environment Variable Scan

```bash
# If your edit adds a new env var:
grep -rn "process.env.NEW_VAR_NAME" src/

# Confirm it exists in:
# - .env.example (documentation)
# - deployment configs (docker-compose.yml, k8s secrets, CI/CD)
# - README or setup docs
```

### Check 2D — Package Dependency Scan

```bash
# If your edit uses a new npm package:
cat package.json | grep "new-package-name"

# If NOT present:
npm install new-package-name
# Then verify package.json and package-lock.json updated

# If using a package that already exists — confirm the import path is correct:
node -e "require('package-name')" 2>&1
```

### Check 2E — Type/Interface Consistency (TypeScript projects)

```bash
# If modifying a type or interface:
grep -rn "InterfaceName\|TypeName" src/ --include="*.ts"

# Every usage must be compatible with the updated type.
# Run type check before committing:
npx tsc --noEmit
```

---

## Phase 3 — The Edit Execution Order

Never edit randomly. Always edit in dependency order.

```
CORRECT EDIT ORDER:
────────────────────────────────────────────

1. PACKAGES FIRST
   Install new npm packages before writing code that uses them.
   npm install → verify package.json updated

2. TYPES / INTERFACES / SCHEMAS
   Edit type definitions before the code that implements them.
   A changed interface must be updated before its implementors.

3. UTILITIES / HELPERS / SHARED MODULES
   Edit shared utilities before the files that use them.
   A changed helper must be stable before callers are updated.

4. CORE LOGIC / SERVICES
   Edit business logic after its dependencies are stable.

5. CONTROLLERS / ROUTES / HANDLERS
   Edit entry points after the services they call are updated.

6. MIDDLEWARE
   Edit middleware after the logic it wraps is updated.
   Register middleware changes in app.js/server.js LAST.

7. CONFIGURATION FILES
   Update configs, env examples, and constants alongside code changes.

8. TESTS
   Update and add tests AFTER code changes are complete.
   Tests must reflect the NEW correct behavior.

9. DOCUMENTATION
   Update README, ADRs, and architecture docs last.

NEVER:
  - Edit a caller before editing what it calls
  - Use a package before installing it
  - Reference an env var before adding it to .env.example
  - Change a function signature without updating all call sites first
```

---

## Phase 4 — During-Edit Verification

After EACH individual file edit — before moving to the next file — verify:

```
PER-FILE VERIFICATION CHECKLIST
────────────────────────────────────────────

□ IMPORTS INTACT
  Every import statement in this file resolves to something real.
  No imports reference files or exports that no longer exist.
  No imports are missing for code that was added.

□ EXPORTS INTACT
  Everything that callers expect to import from this file still exists.
  If anything was renamed → all callers already updated (or queued).
  Export shape matches what callers expect.

□ LOGIC INTACT
  The function's purpose is unchanged (unless intentionally refactored).
  No business logic was accidentally removed during the edit.
  Edge cases that existed before the edit still handled.

□ NO ACCIDENTAL EDITS
  Lines not related to the implementation plan are UNCHANGED.
  No formatting changes to unrelated code.
  No accidental removal of comments, types, or exports.

□ STRENGTHENED, NOT WEAKENED
  This edit improves the file: security, resilience, clarity, or correctness.
  No existing security measure was removed or weakened.
  No error handling was removed.
  No validation was removed.
```

---

## Phase 5 — Post-Edit Full System Verification

After ALL files in the change set have been edited, verify the entire system.

### 5A — Static Verification

```bash
# TypeScript: zero type errors
npx tsc --noEmit

# ESLint: zero lint errors in changed files
npx eslint path/to/changed/file.js path/to/other/changed/file.js

# Import resolution: no broken imports
node -e "require('./src/changed-module')" 2>&1

# Circular dependency check
npx madge --circular src/
```

### 5B — Test Verification

```bash
# Run tests related to changed files
npx jest --testPathPattern="auth|changed-module" --verbose

# Run full test suite (catch regressions)
npx jest --runInBand

# Expected: all previously passing tests still pass
# Any newly failing test = REGRESSION → must fix before proceeding
```

### 5C — Runtime Smoke Test

```bash
# Start the application
npm run dev

# Verify it starts without errors
# Hit the changed endpoints manually
# Confirm basic flows still work

# Check logs for any new warnings or errors
```

### 5D — Logic Continuity Verification

Manually trace the FULL request/response flow through all changed files:

```
LOGIC CONTINUITY TRACE
────────────────────────────────────────────

For the feature that was changed, trace:

  Request enters at: [entry point]
       ↓
  Passes through: [middleware 1] — still works? YES/NO
       ↓
  Reaches: [controller] — still works? YES/NO
       ↓
  Calls: [service] — still works? YES/NO
       ↓
  Calls: [repository/DB] — still works? YES/NO
       ↓
  Returns through: [response formatter] — still works? YES/NO
       ↓
  Response shape: [matches what frontend expects?] YES/NO

If ANY step is NO → fix before committing.
```

---

## Phase 6 — Rollback Rules

If any verification step fails after an edit:

```
ROLLBACK DECISION TREE
────────────────────────────────────────────

Verification failed on file: [file]

Can the issue be fixed in < 15 minutes?
  YES → Fix it. Re-verify. Continue.
  NO  → ROLLBACK this file's changes.
        git restore path/to/file
        Understand WHY it failed.
        Revise the implementation plan.
        Start Phase 1 again with better information.

Did the failure cascade to other files?
  YES → Rollback ALL files in the change set.
        git restore src/changed-file-1.js
        git restore src/changed-file-2.js
        The implementation plan needs redesign.

Is the system now in a broken state?
  YES → STOP ALL EDITS IMMEDIATELY.
        git stash  (preserve work)
        git status (assess damage)
        Fix the breakage to restore working state FIRST.
        Then redesign the approach.
        NEVER commit broken code.
        NEVER move to the next implementation plan item
        while the system is broken.
```

---

## The Anti-Patterns This Protocol Prevents

```
❌ BLIND EDIT
   Reading only the target file, making changes, moving on.
   → This protocol: read all neighbours before touching anything.

❌ ASSUMPTION-BASED EDITING
   "I assume this file exports X" without checking.
   → This protocol: verify every import and export explicitly.

❌ PARTIAL CHANGE SET
   Adding rate limiting to one route but not the other 4 routes
   that also need it.
   → This protocol: full change set mapped before first edit.

❌ WRONG ORDER EDITING
   Updating a controller to call a new service method before
   the service method exists.
   → This protocol: dependencies edited before dependents, always.

❌ MISSING PACKAGE
   Writing `import rateLimit from 'express-rate-limit'` without
   running npm install.
   → This protocol: packages installed in Phase 3 step 1.

❌ MISSING ENV VAR
   Adding `process.env.REDIS_URL` to code without adding it to
   .env.example and deployment configs.
   → This protocol: env vars documented as part of change set.

❌ FORGOTTEN TESTS
   Updating auth logic, not updating auth tests.
   Tests now test the old behavior and give false confidence.
   → This protocol: tests are part of the change set, always.

❌ ACCIDENTAL LOGIC REMOVAL
   During a refactor, accidentally deleting an error handler
   or validation check because it was "in the way."
   → This protocol: per-file verification after every edit.

❌ CASCADING BROKEN STATE
   Edit 1 breaks something. Continue to Edit 2 anyway.
   Edit 2 breaks something else. Continue to Edit 3.
   System is now shattered. No one knows where it went wrong.
   → This protocol: verify after every file. Stop on failure.

❌ SECURITY REGRESSION
   Adding a feature removes an auth check because the developer
   (or agent) was focused on the new feature, not the existing guard.
   → This protocol: "strengthened not weakened" check on every file.
```

---

## Implementation Plan Integration

Every implementation plan produced by this skill must include a
**Dependency Map Section** before any code changes are listed.

### Required Implementation Plan Format

```markdown
## Implementation Plan: [ISSUE-ID] — [Title]

### Step 0 — Dependency Mapping (ALWAYS FIRST)

**Primary file to change**: `src/auth/middleware.js`

**Dependency Map**:
  Imports from:
    ← `src/config/constants.js`  (JWT_SECRET, TOKEN_EXPIRY)
    ← `src/utils/logger.js`      (logger instance)
    ← `jsonwebtoken`             (jwt.verify)

  Imported by:
    → `src/routes/auth.js`       (uses: authenticate middleware)
    → `src/routes/users.js`      (uses: authenticate middleware)
    → `src/routes/orders.js`     (uses: authenticate middleware)
    → `src/routes/admin.js`      (uses: authenticate, requireAdmin)

  Tests covering this file:
    → `tests/unit/auth.middleware.test.js`
    → `tests/integration/auth.flow.test.js`

**Full Change Set** (all files that must change):
  1. `src/auth/middleware.js`          — primary change
  2. `src/config/constants.js`         — add new constant
  3. `package.json`                    — add express-rate-limit
  4. `.env.example`                    — add RATE_LIMIT_WINDOW_MS
  5. `tests/unit/auth.middleware.test.js` — update tests

**Read before editing**:
  [ ] src/auth/middleware.js       — read fully
  [ ] src/config/constants.js      — read fully
  [ ] src/routes/auth.js           — read to understand usage
  [ ] src/routes/users.js          — read to understand usage
  [ ] src/routes/orders.js         — read to understand usage
  [ ] tests/unit/auth.middleware.test.js — read fully

**Edit order**:
  1. npm install express-rate-limit
  2. src/config/constants.js       (add constants)
  3. src/auth/middleware.js        (add rate limiter)
  4. .env.example                  (document new vars)
  5. tests/unit/auth.middleware.test.js (update tests)

---

### Step 1 — [First actual code change]
[Only after Step 0 is complete]
...
```

**No implementation plan is valid without Step 0.**
**No edit begins without the dependency map complete.**

---

## Quick Reference — The 6 Phases

```
PHASE 1  Read everything first
         Target file + all neighbours + all tests

PHASE 2  Safety checks
         Imports, signatures, env vars, packages, types

PHASE 3  Edit in correct order
         Packages → Types → Utils → Logic → Routes → Tests → Docs

PHASE 4  Verify after each file
         Imports intact, exports intact, logic intact, strengthened

PHASE 5  Full system verify after all edits
         Type check, lint, tests, smoke test, logic trace

PHASE 6  Rollback rules
         Fail → fix or rollback. Never continue on broken state.
         Never commit broken code. Never move forward while broken.
```
