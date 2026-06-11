# Safe Git Protocol for AI Agents

> **MANDATORY. Read before touching Git. No exceptions.**
>
> This protocol exists because AI agents — Claude, Gemini, GPT, any model —
> routinely destroy production security by using Git carelessly.
> Every rule here exists because an AI agent has broken it in the real world.

---

## The Cardinal Sins (Never Do These)

```
❌ NEVER run: git add .
❌ NEVER run: git add -A
❌ NEVER run: git push --force (on shared branches)
❌ NEVER run: git reset --hard (without explicit user confirmation)
❌ NEVER commit without reading git diff --staged first
❌ NEVER push without verifying the branch name
❌ NEVER create a commit if secrets scanner finds anything
❌ NEVER push .env, .env.local, .env.production, or any .env.* file
❌ NEVER ignore a .gitignore warning
❌ NEVER push directly to main or master
```

---

## Before ANY Git Operation — Run This Checklist

```
MANDATORY PRE-GIT CHECKLIST
────────────────────────────
□ Step 1: Verify .gitignore exists and is correct
□ Step 2: Scan for secrets in staged files
□ Step 3: Check current branch (never main/master)
□ Step 4: Review exactly what will be staged
□ Step 5: Stage files individually (never git add .)
□ Step 6: Review staged diff before committing
□ Step 7: Verify commit message is meaningful
□ Step 8: Log the operation to .audit/git-safety.log
```

**If ANY step fails → STOP. Fix it. Do not proceed.**

---

## Step-by-Step Safe Git Workflow

### PHASE 1 — Repository Setup (First Time Only)

Run this ONCE when first working with a repository.

#### 1A — Verify or create .gitignore

```bash
# Check if .gitignore exists
cat .gitignore
```

If it doesn't exist, or if it's missing critical entries, create/update it:

```bash
cat >> .gitignore << 'EOF'

# ============================================
# SECRETS & CREDENTIALS — NEVER COMMIT THESE
# ============================================
.env
.env.local
.env.development
.env.staging
.env.production
.env.test
.env.*
*.env

# Private keys and certificates
*.pem
*.key
*.p12
*.pfx
*.cer
*.crt
id_rsa
id_ed25519
*.ppk

# Cloud credentials
.aws/
.gcp/
credentials.json
service-account.json
*-service-account.json
gcloud-credentials.json

# Secrets managers / vaults
.vault-token
vault-token

# ============================================
# BUILD ARTIFACTS — NO BUSINESS IN GIT
# ============================================
node_modules/
dist/
build/
.next/
.nuxt/
out/
.cache/
*.min.js
*.min.css

# Python
__pycache__/
*.py[cod]
*.egg-info/
venv/
.venv/
env/
.env/

# ============================================
# LOGS — CONTAIN SENSITIVE DATA
# ============================================
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ============================================
# DATABASE FILES — NEVER COMMIT
# ============================================
*.sqlite
*.sqlite3
*.db
*.sql.dump
dump.sql

# ============================================
# IDE & OS — NOISE
# ============================================
.DS_Store
.idea/
.vscode/settings.json
*.swp
*.swo
Thumbs.db

# ============================================
# AUDIT LOGS — TRACK BUT DON'T EXPOSE
# ============================================
# Keep .audit/ folder but exclude sensitive logs
.audit/git-safety.log

EOF
```

#### 1B — Verify .gitignore is working

```bash
# This should show nothing sensitive
git check-ignore -v .env
git check-ignore -v *.pem
git check-ignore -v node_modules/

# If any of these DON'T show as ignored → fix .gitignore before proceeding
```

#### 1C — Check if anything sensitive is already tracked

```bash
# Check if .env is already being tracked (dangerous)
git ls-files | grep -E "\.env|\.pem|\.key|credentials|secret|password"

# If ANYTHING shows up → STOP. Remove from tracking first:
# git rm --cached .env
# git rm --cached -r node_modules/  (if somehow tracked)
```

#### 1D — Set up branch protection

```bash
# Never work directly on main. Create a working branch first.
git checkout -b audit/session-001

# Verify you're on the right branch
git branch --show-current
# Expected output: audit/session-001
# If output is: main OR master → STOP. Switch branches first.
```

---

### PHASE 2 — Before Every Commit

Execute this in EXACT order. Do not skip steps.

#### 2A — Run secrets scanner FIRST

```bash
# Option 1: gitleaks (preferred — install once)
gitleaks detect --source . --verbose

# Option 2: truffleHog
trufflehog filesystem . --only-verified

# Option 3: manual grep (fallback if no tool available)
grep -rn --include="*.js" --include="*.ts" --include="*.py" --include="*.env" \
  -E "(password|secret|api_key|apikey|token|private_key|aws_access|AKIA[0-9A-Z]{16})" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  .

# IF ANY SECRETS FOUND → STOP IMMEDIATELY. Do not stage. Do not commit.
# Fix the secret exposure first. Then rotate the credential.
```

#### 2B — Check current branch

```bash
git branch --show-current
```

```
IF output is "main" or "master":
    STOP. Do not commit to main directly.
    Run: git checkout -b fix/[descriptive-name]
    Then continue.

IF output is a feature/fix/audit branch:
    Continue.
```

#### 2C — See what changed (before staging anything)

```bash
# See ALL changed files
git status

# See exact content of changes
git diff
```

Read every changed file. Ask:
- Should this file be committed?
- Does it contain any secrets?
- Is it in .gitignore already?
- Is it a build artifact that shouldn't be tracked?

#### 2D — Stage files INDIVIDUALLY (never `git add .`)

```bash
# CORRECT — add specific files one by one
git add src/auth/middleware.js
git add src/api/routes/users.js
git add tests/auth.test.js

# NEVER do this:
# git add .
# git add -A
# git add *
```

If you have many files to add, list them explicitly:

```bash
# Safe way to add multiple files
git add \
  src/auth/middleware.js \
  src/api/routes.js \
  README.md
```

#### 2E — Verify EXACTLY what will be committed

```bash
# This is non-negotiable. Read every line.
git diff --staged
```

Check every line of output for:
- Any credential, key, password, token
- Any file that shouldn't be committed
- Any accidental inclusion of test data or PII
- Any `.env` file content

```bash
# Also verify the file list
git diff --staged --name-only
```

If anything looks wrong → unstage and fix:
```bash
# Unstage a specific file
git restore --staged path/to/file

# Unstage everything and start over
git restore --staged .
```

#### 2F — Write a meaningful commit message

```bash
# Format: [type]: [what changed] [why if not obvious]
# Types: feat, fix, security, refactor, test, docs, chore, audit

# Good examples:
git commit -m "security: add rate limiting to auth endpoints (prevents brute force)"
git commit -m "fix: replace localStorage token storage with httpOnly cookies"
git commit -m "audit: add health check endpoints /healthz and /readyz"
git commit -m "refactor: extract UserService from monolithic AppService"

# Bad examples (never do these):
# git commit -m "fix"
# git commit -m "changes"
# git commit -m "stuff"
# git commit -m "."
```

#### 2G — Log the operation

```bash
# Append to .audit/git-safety.log
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] COMMIT | Branch: $(git branch --show-current) | Files: $(git diff --staged --name-only | tr '\n' ',') | Message: [your commit message]" >> .audit/git-safety.log
```

---

### PHASE 3 — Before Every Push

#### 3A — Final branch verification

```bash
git branch --show-current
# Must NOT be: main, master, production, prod, release
```

#### 3B — Review commits about to be pushed

```bash
# See what commits will be pushed
git log origin/$(git branch --show-current)..HEAD --oneline

# If branch doesn't exist on remote yet:
git log HEAD --oneline -10
```

Read every commit. Verify nothing dangerous is included.

#### 3C — Check remote

```bash
# Verify you're pushing to the right remote
git remote -v
```

Confirm the URL matches the expected repository. AI agents have pushed to wrong remotes.

#### 3D — Push safely

```bash
# Safe push — sets upstream, no force
git push -u origin $(git branch --show-current)

# NEVER:
# git push --force  (on shared branches — rewrites history)
# git push origin main  (direct push to main)
```

#### 3E — Log the push

```bash
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PUSH | Branch: $(git branch --show-current) | Remote: $(git remote get-url origin)" >> .audit/git-safety.log
```

---

## Audit-Specific Git Workflow

When the skill is running audit sessions, use this branch naming convention:

```bash
# Session 1 — Full Audit (read-only, but creating .audit/ files)
git checkout -b audit/session-001-full-audit

# Session 2 — Fix verification
git checkout -b audit/session-002-fix-verification

# Fixing an issue found in audit
git checkout -b fix/ISSUE-001-rate-limiting-auth-endpoints
git checkout -b fix/ISSUE-002-jwt-localstorage-to-cookie
git checkout -b security/remove-hardcoded-credentials

# Full re-audit (new cycle)
git checkout -b audit/cycle-2-session-001-full-audit
```

---

## Emergency Procedures

### If you accidentally committed a secret

```bash
# STEP 1 — Do NOT push (if not pushed yet)
# Undo the last commit (keeps changes in working directory)
git reset HEAD~1

# Remove the secret from the file
# Fix the file properly

# STEP 2 — If already pushed
# Rotate the credential IMMEDIATELY — assume it's compromised
# Contact: your security team / cloud provider

# Remove from history (requires force push — coordinate with team)
pip install git-filter-repo
git filter-repo --path path/to/secret-file --invert-paths
git push origin --force --all

# STEP 3 — Notify all collaborators to re-clone
# Old clones still have the secret in history

# STEP 4 — Check if GitHub/GitLab cached the file
# GitHub: Settings → Secret scanning alerts
```

### If you accidentally pushed to main

```bash
# STEP 1 — Identify the bad commit
git log --oneline -5

# STEP 2 — Revert it (safe — creates new commit, preserves history)
git revert [commit-hash]
git push origin main

# STEP 3 — Protect main going forward
# GitHub: Settings → Branches → Branch protection rules
# Require PR reviews. Disable direct push.
```

### If .env was tracked and pushed

```bash
# STEP 1 — Remove from tracking (keeps file locally)
git rm --cached .env
git rm --cached .env.production
git rm --cached .env.local

# STEP 2 — Add to .gitignore
echo ".env*" >> .gitignore

# STEP 3 — Commit the removal
git add .gitignore
git commit -m "security: remove .env from tracking, update .gitignore"

# STEP 4 — Clean history (if it contained real secrets)
git filter-repo --path .env --invert-paths
git push --force

# STEP 5 — Rotate ALL credentials that were in the .env file
# Every key, password, token, connection string — rotate all of them.
# Treat them as fully compromised.
```

---

## .gitignore Verification Checklist

Run this before the very first commit on any project:

```bash
#!/bin/bash
# Save as .audit/verify-gitignore.sh and run before first commit

echo "=== .gitignore Verification ==="

DANGEROUS_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  "*.pem"
  "*.key"
  "id_rsa"
  "credentials.json"
  "service-account.json"
)

PASS=true

for file in "${DANGEROUS_FILES[@]}"; do
  result=$(git check-ignore -q "$file" 2>/dev/null; echo $?)
  if [ "$result" = "0" ]; then
    echo "✅ $file — correctly ignored"
  else
    echo "❌ $file — NOT in .gitignore — DANGER"
    PASS=false
  fi
done

# Check if node_modules would be ignored
if git check-ignore -q "node_modules/" 2>/dev/null; then
  echo "✅ node_modules/ — correctly ignored"
else
  echo "❌ node_modules/ — NOT ignored"
  PASS=false
fi

if [ "$PASS" = true ]; then
  echo ""
  echo "✅ .gitignore verification PASSED. Safe to proceed."
else
  echo ""
  echo "❌ .gitignore verification FAILED. Fix before committing."
  exit 1
fi
```

---

## git-safety.log Format

Every git operation must be logged. The log lives at `.audit/git-safety.log`.

```
[2024-01-15T10:30:00Z] SECRETS_SCAN | Result: PASS | Tool: gitleaks | Files scanned: 47
[2024-01-15T10:31:00Z] BRANCH_CHECK | Current: audit/session-001 | Safe: YES
[2024-01-15T10:32:00Z] STAGE | Files: src/auth/middleware.js, src/api/routes.js
[2024-01-15T10:33:00Z] DIFF_REVIEWED | Lines: 145 | Secrets found: 0
[2024-01-15T10:34:00Z] COMMIT | Hash: a3f9c12 | Message: security: add rate limiting to auth endpoints
[2024-01-15T10:35:00Z] PUSH | Branch: audit/session-001 | Remote: origin | Result: SUCCESS

[2024-01-15T11:00:00Z] SECRETS_SCAN | Result: FAIL | Found: API_KEY in src/config.js line 14
[2024-01-15T11:00:00Z] BLOCKED | Reason: Secret detected. Operation halted. Credential must be rotated.
```

---

## Quick Reference Card

```
SAFE GIT COMMANDS              DANGEROUS GIT COMMANDS
──────────────────             ──────────────────────
git status                     git add .
git diff                       git add -A
git diff --staged              git add *
git add [specific file]        git push --force (shared branches)
git log --oneline              git reset --hard (without confirmation)
git branch --show-current      git push origin main (direct)
git push -u origin [branch]    git commit -m "." or -m "fix"
git restore --staged [file]    git rm -rf (without reviewing)
git revert [hash]              git clean -fd (without reviewing)
```
