---
name: maintenance-workflow
description: Proactive maintenance workflow covering dependency updates, security scanning, tech debt cleanup, performance baselines, and documentation freshness. Use when user says "run maintenance", "update dependencies", "tech debt", "security scan", "audit dependencies", "clean up code", or "housekeeping". NOT part of the feature pipeline -- runs independently on a schedule or on demand. Discovers issues and routes fixes through the appropriate pipeline stages. Never applies risky updates without verification.
---

# Maintenance Workflow

A proactive maintenance cycle that runs independently of the feature pipeline. Covers dependency health, security posture, tech debt, performance baselines, and documentation freshness. Discovers issues and routes fixes through the correct pipeline path. Runs on demand or on a schedule -- not triggered by feature development.

---

## Relationship to Feature Pipeline

```
Feature pipeline (runs per feature):
  project-planning > spec-workflow > testing > review > docs > git > deploy

Maintenance workflow (runs independently):
  maintenance-workflow > discovers issues > routes to appropriate pipeline stage
```

maintenance-workflow is NOT a pipeline stage. It runs outside the feature pipeline. When it discovers issues that need fixing, it routes them:
- Dependency update (breaking) > spec-workflow Bug Fix Workflow > full pipeline
- Dependency update (non-breaking) > testing-workflow > git-workflow (Small change path)
- Security CVE (Critical/High) > incident-response if in production, or spec-workflow Bug Fix Workflow
- Tech debt cleanup > spec-workflow with change size classification
- Performance regression > spec-workflow Bug Fix Workflow
- Documentation rot > documentation-workflow standalone

---

## ECC Agent Delegation

This skill delegates to ECC agents for automated scanning and cleanup. Delegation is optional and enhances -- never replaces -- manual review.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 1 (Dependencies) | `security-reviewer` | Dependency vulnerability scanning (pip-audit, safety), CVE assessment | Always -- automated scanning is faster and more thorough than manual |
| Step 3 (Tech Debt) | `refactor-cleaner` | Dead code detection, unused import removal, duplicate elimination | Always -- automated detection catches what manual review misses |
| Step 3 (Tech Debt) | `python-reviewer` | PEP 8 compliance drift, type hint coverage, linting (ruff, mypy, bandit) | Python projects -- run diagnostic commands to measure code health |

Supplementary ECC Skills (reference as needed):
- `python-patterns`: Pythonic idioms and best practices for evaluating code quality
- `python-testing`: pytest strategies for evaluating test health
- `security-scan`: Scans `.claude/` directory for secrets and misconfigurations
- `docker-patterns`: Container security best practices for evaluating Docker health

---

## How to Start

Detect context:
- Standalone (user says "run maintenance") > full maintenance cycle
- Targeted (user says "update dependencies" or "security scan") > run only the relevant step(s)
- Scheduled (periodic) > full maintenance cycle with comparison to last run

Before starting:
- Load project CLAUDE.md for tech stack, dependencies, and infrastructure context
- Check `tasks/maintenance-log.md` for previous maintenance run results (create if it does not exist)
- Check `tasks/lessons.md` for known maintenance patterns

---

## Step 1: Dependency Audit

**ECC delegation:** Spawn the `security-reviewer` agent as a subagent to run automated dependency scanning tools. It will execute pip-audit, safety check, and pip list --outdated, then assess CVE severity for each finding.

### 1a: Vulnerability Scan

Scan all dependencies for known vulnerabilities:
```bash
# Python
pip-audit                           # Check for known CVEs
safety check                        # Alternative CVE scanner
pip list --outdated --format=json   # Check for available updates
```

For each vulnerability found:
- CVE ID and severity (Critical / High / Medium / Low)
- Affected package and version
- Fixed version available?
- Is the vulnerable code path actually used in this project?

Classification:
```
Critical CVE (CVSS 9.0+):
  Action: Fix immediately. If in production, trigger incident-response.
  Route: incident-response (if production) or spec-workflow Bug Fix Workflow

High CVE (CVSS 7.0-8.9):
  Action: Fix within current maintenance cycle.
  Route: spec-workflow Bug Fix Workflow > testing > git > deploy

Medium CVE (CVSS 4.0-6.9):
  Action: Schedule fix. Track in tasks/todo.md.
  Route: spec-workflow next time the affected component is touched

Low CVE (CVSS 0.1-3.9):
  Action: Document. Fix opportunistically.
  Route: None immediate -- log in maintenance report
```

### 1b: Outdated Dependencies

For each outdated package:
- Current version vs latest version
- Is it a major, minor, or patch update?
- Changelog review: any breaking changes?

Classification:
```
Patch update (e.g., 1.2.3 -> 1.2.4):
  Risk: Low
  Action: Update and run tests

Minor update (e.g., 1.2.3 -> 1.3.0):
  Risk: Medium
  Action: Review changelog, update, run full test suite

Major update (e.g., 1.2.3 -> 2.0.0):
  Risk: High
  Action: Treat as a feature -- route through spec-workflow with a migration plan
  Do NOT batch with other updates
```

### 1c: Pinning and Lock File Health

- Are all dependencies pinned to specific versions in requirements.txt?
- Is there a lock file (pip-compile, poetry.lock)?
- Any floating versions (>=, ~=) that could introduce surprise changes?
- Any dependencies installed but not in requirements.txt?

Flag unpinned or floating dependencies as a maintenance finding.

---

## Step 2: Security Posture Scan

### 2a: Secrets Scan

Scan the entire repository for accidentally committed secrets:
```bash
# Check for common secret patterns
grep -rn "API_KEY\|SECRET\|PASSWORD\|TOKEN\|PRIVATE_KEY" --include="*.py" --include="*.env*" --include="*.yml" --include="*.json" .
# Check .env files are in .gitignore
git ls-files --cached | grep -i "\.env"
```

If any secret is found in tracked files:
- Treat as a security incident -- rotate the credential immediately
- Remove from code and git history
- Route through incident-response if the secret was ever pushed to remote

### 2b: Configuration Security

- Are all secrets loaded from environment variables, not config files?
- Is `.env` in `.gitignore`?
- Are Docker images using non-root users?
- Are ports correctly scoped (not exposing internal services)?
- Are CORS, CSP, and other security headers configured?

### 2c: Claude Config Security

**Supplementary ECC Skill:** Reference `security-scan` to audit the `.claude/` directory for misconfigurations, exposed API keys in skills, or overly permissive tool access.

### 2d: Infrastructure Security (if applicable)

- IAM roles following least privilege?
- Security groups not overly permissive?
- Encryption at rest and in transit configured?
- Logging enabled for audit trails?

---

## Step 3: Tech Debt Assessment

**ECC delegation:** Spawn the `refactor-cleaner` agent as a subagent to run dead code detection and duplicate analysis. Then spawn the `python-reviewer` agent to run diagnostic commands (ruff, mypy, bandit) and measure code health metrics.

### 3a: Dead Code and Unused Imports

- Run detection tools to find unused code, exports, and imports
- Categorize by risk: SAFE (clearly unused), CAREFUL (dynamic usage possible), RISKY (public API)
- Only recommend removal of SAFE items
- Track CAREFUL and RISKY items for manual review

### 3b: Code Quality Metrics

Measure and compare to last maintenance run:
```bash
# Linting violations
ruff check . --statistics 2>/dev/null || echo "ruff not installed"

# Type coverage
mypy . --txt-report /dev/null 2>/dev/null || echo "mypy not installed"

# Security issues
bandit -r . -f json 2>/dev/null || echo "bandit not installed"

# Complexity hotspots
radon cc . -s -n C 2>/dev/null || echo "radon not installed"

# TODO/FIXME/HACK count
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP" --include="*.py" . | wc -l
```

Track metrics:
- Linting violations (count, trend)
- Type coverage percentage (trend)
- Security findings (count by severity, trend)
- Cyclomatic complexity hotspots (functions with complexity > C)
- TODO/FIXME count (trend)

### 3c: Test Health

- Test count and pass rate
- Test execution time (getting slower?)
- Coverage percentage (trending down?)
- Flaky test count
- Tests that are skipped or disabled

### 3d: Architectural Debt

- Any components that have grown too large? (files over 500 lines, functions over 50 lines)
- Any circular dependencies?
- Any abstractions that are no longer useful?
- Any patterns that diverge from the project's stated architecture?

---

## Step 4: Performance Baseline

### 4a: Application Performance

Run baseline performance checks:
- API response times for key endpoints (compare to last baseline)
- Memory usage at idle and under light load
- CPU usage at idle and under light load
- Database query performance (slow query log)
- External API call latency

### 4b: Infrastructure Performance (if applicable)

- Container resource usage vs limits
- Disk usage trends
- Network latency between services
- Queue depths and processing times

### 4c: Regression Detection

Compare current baselines to previous maintenance run:
- Response time increased > 20%? Flag as performance regression.
- Memory usage increased > 30%? Flag as potential memory leak.
- Slow query count increased? Flag for database optimization.

If a performance regression is detected:
- Identify which recent changes likely caused it (git log since last maintenance)
- Route through spec-workflow Bug Fix Workflow with performance findings

---

## Step 5: Documentation Freshness

Check documentation is still accurate:
- README: do setup instructions still work? (spot-check, not full test)
- API docs: do they match current endpoints? (compare against code)
- Architecture docs: do they reflect current system structure?
- CHANGELOG: is it current with recent deployments?
- CLAUDE.md: does it reflect current project state?

For each stale document:
- Note what is outdated
- Route through documentation-workflow if updates are needed

---

## Step 6: Maintenance Report

Compile all findings into `tasks/maintenance-log.md`:

```
## Maintenance Run -- [Date]

### Summary
- Dependencies: [X] outdated, [Y] with CVEs
- Security: [X] findings ([Critical/High/Medium/Low] breakdown)
- Tech Debt: [X] dead code items, [Y] linting violations, [Z] TODOs
- Performance: [baseline numbers, trend vs last run]
- Documentation: [X] stale documents

### Critical Actions (must fix now)
- [item] -- [severity] -- [route: which workflow handles this]

### Scheduled Actions (fix in next cycle)
- [item] -- [severity] -- [target date or next maintenance run]

### Tracked Items (monitor, fix opportunistically)
- [item] -- [severity] -- [notes]

### Metrics Comparison
| Metric | Last Run | This Run | Trend |
|--------|----------|----------|-------|
| CVE count | X | Y | up/down/stable |
| Linting violations | X | Y | up/down/stable |
| Type coverage | X% | Y% | up/down/stable |
| TODO count | X | Y | up/down/stable |
| Test count | X | Y | up/down/stable |
| Test coverage | X% | Y% | up/down/stable |
| Avg response time | Xms | Yms | up/down/stable |

### Next Maintenance Run
- Recommended: [date -- suggest monthly for active projects, quarterly for stable]
```

Present the report. Ask: "Maintenance report ready. Shall I proceed with the critical actions?"

---

## Step 7: Execute Fixes

For each critical action, route to the appropriate workflow:

**Dependency CVE fix:**
- Update the package to the fixed version
- Run full test suite
- If tests pass: route through git-workflow (Small change)
- If tests fail: route through spec-workflow Bug Fix Workflow (the update broke something)

**Non-breaking dependency update (batch):**
- Group all patch updates together
- Update all at once
- Run full test suite
- If tests pass: single commit through git-workflow
- If tests fail: bisect to find which update broke things, fix individually

**Major dependency update:**
- Do NOT batch with other updates
- Route through spec-workflow as a Standard change (needs spec, analysis, testing)

**Dead code cleanup:**
- Apply safe removals identified by refactor-cleaner
- Run full test suite after each batch
- Route through git-workflow (Small change, Chore type)

**Security finding fix:**
- Critical/High: fix immediately, route through spec-workflow Bug Fix Workflow
- Medium: schedule for next feature cycle
- Low: track, fix opportunistically

**Performance regression fix:**
- Route through spec-workflow Bug Fix Workflow with performance data

**Documentation update:**
- Route through documentation-workflow standalone

For each fix applied:
- Mark the action as complete in `tasks/maintenance-log.md`
- Update `tasks/lessons.md` with any maintenance patterns discovered

---

## Step 8: Verify and Close

After all critical actions are executed:
- Re-run the relevant scans to confirm fixes (dependency scan, security scan)
- Confirm no new issues were introduced by the fixes
- Track routed fixes: for each issue routed to another workflow (spec-workflow, incident-response, etc.), check the corresponding pipeline state file or incident file to confirm the fix completed successfully
- If any routed fix is still in progress: note it in the maintenance report as "pending -- routed to [workflow], awaiting completion"
- Do not mark the maintenance run as fully complete until all Critical actions are verified resolved (either directly or via routed workflow completion)
- Scheduled and Tracked items may remain open -- they carry forward to the next maintenance cycle
- Update `tasks/maintenance-log.md` with final status
- Update `tasks/lessons.md` with maintenance observations

If any fix introduced a new issue:
- Do not mark the maintenance run as complete
- Route the new issue through the appropriate workflow
- Resume maintenance verification after the new issue is resolved

---

## Failure Handling

**pip-audit or safety not installed**
- Install the tool: `pip install pip-audit safety`
- If installation fails: use alternative scanning methods (manual CVE database check)
- Document the tool gap and recommend adding to project dependencies

**Dependency update breaks tests**
- Do not proceed with the update
- Bisect: update packages one at a time to find the breaking one
- For the breaking package: check changelog for migration guide
- If no migration path: pin to current version, track as tech debt, find alternative package

**Major dependency update requires code changes**
- Do not attempt inline during maintenance
- Route through spec-workflow as a Standard change with a proper spec
- The spec should include: migration plan, affected code, test plan, rollback approach

**Security scan finds a secret in git history**
- This is a security incident -- rotate the credential immediately
- Do not wait for the rest of the maintenance cycle to complete
- Route through incident-response
- After incident is resolved: resume maintenance cycle

**Performance baseline shows severe regression**
- Identify the likely cause from recent git history
- If the regression is in production: route through incident-response
- If only in development: route through spec-workflow Bug Fix Workflow

**Too much tech debt to tackle in one cycle**
- Prioritize: security > performance > dead code > style
- Fix only the top 5 highest-impact items per cycle
- Track the rest in `tasks/maintenance-log.md` for future cycles
- Never try to fix everything at once -- incremental improvement is sustainable

**Maintenance fix conflicts with an in-progress feature**
- Check `tasks/pipeline-state-*.md` for active features
- If a maintenance fix touches the same files as an in-progress feature: defer the maintenance fix
- Do not create merge conflicts with active feature work
- Note the deferral in the maintenance report

**Tool versions differ between environments**
- Always run maintenance scans in the same environment as CI/CD
- Document required tool versions in project CLAUDE.md
- If tools are not available in CI: add them to the CI configuration

**Maintenance run interrupted (context overflow, session ends)**
- Write current progress to `tasks/maintenance-log.md` with "Status: IN PROGRESS"
- Note which steps are complete and which are pending
- Next maintenance session reads the log and resumes from where it stopped
- Never restart from Step 1 if partial progress exists

---

## Scheduling

Recommended maintenance frequency:
```
Active development (multiple features per week):
  Full maintenance: Monthly
  Dependency CVE scan only: Weekly

Stable project (occasional features):
  Full maintenance: Quarterly
  Dependency CVE scan only: Monthly

Production-critical with compliance:
  Full maintenance: Monthly
  Dependency CVE scan: Weekly
  Security posture scan: Monthly
```

Track the schedule in `tasks/maintenance-log.md` under a "Schedule" section.

---

## Rules

- Never apply a dependency update without running the full test suite
- Never batch major version updates with other changes
- Never skip the security scan -- it is the highest-value step
- Critical and High CVEs are always routed for immediate fix
- Secrets found in code are always treated as compromised -- rotate immediately
- Performance regressions discovered in production route through incident-response, not maintenance
- Tech debt fixes go through git-workflow at minimum (even small cleanups need a PR)
- Always compare metrics to the previous maintenance run -- trends matter more than absolute numbers
- Never try to fix all tech debt in one cycle -- prioritize and iterate
- All findings logged in `tasks/maintenance-log.md`
- All patterns logged in `tasks/lessons.md`
- Maintenance fixes must not conflict with in-progress feature work
- If maintenance is interrupted, write progress to the log and resume next session
