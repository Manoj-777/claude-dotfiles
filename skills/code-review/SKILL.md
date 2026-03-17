---
name: code-review
description: Structured code review covering spec compliance, code quality, security, performance, and test coverage. Use when user says "review this code", "code review", "review my changes", "check this PR", or "review before merge". Triggered by spec-workflow as part of Stage 2+3 of the pipeline (runs in parallel with security-review). Never approves code with blocking issues, security violations, or missing tests.
---

# Code Review Workflow

A structured code review that checks quality, security, performance, spec compliance, and test coverage. Runs in parallel with security-review as Stage 2+3 of the pipeline. Every blocking issue must be resolved before approval.

---

## Pipeline Position

```
spec-workflow > testing-workflow > [code-review + security-review (parallel)] > documentation-workflow > git-workflow > deployment-workflow
```

Triggered by: spec-workflow (after testing-workflow passes)
Runs in parallel with: security-review
Signals back to: spec-workflow

---

## Pipeline State

On start: read `tasks/pipeline-state-[feature-name].md` to understand change size, pipeline path, and testing results.
On complete: update the state file with code review result, feedback severity, and timestamp.

---

## ECC Agent Delegation

This skill delegates to ECC agents at specific points for deeper analysis. Delegation is optional and enhances -- never replaces -- the pipeline gates.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 2 (Code Quality) | `python-reviewer` | PEP 8 compliance, type hints, FastAPI patterns, security checks (SQL injection, command injection), diagnostic commands (mypy, ruff, bandit) | Python projects -- always for Standard+ changes |
| Step 2 (Code Quality) | `code-reviewer` | General code patterns, confidence-based filtering (>80%), git diff review | Non-Python projects or as a supplement for mixed-language repos |
| Step 4 (Performance) | `database-reviewer` | SQL/schema review, query optimization, N+1 detection, index analysis | When the feature touches database queries or schema |
| Step 2 (Dead Code) | `refactor-cleaner` | Dead code detection, unused import removal, duplicate elimination | When review finds dead code, unused exports, or duplicate logic that should be cleaned up |

Agents NOT used here (and why):
- `security-reviewer`: Full security investigation belongs to security-review (runs in parallel) -- code-review only flags security issues
- `tdd-guide`: Testing concerns are handled by testing-workflow (Stage 1), not code-review

Supplementary ECC Skills (reference as needed):
- `python-patterns`: Pythonic idioms for evaluating code quality in Python projects
- `backend-patterns`: Backend architecture patterns for evaluating structural decisions
- `coding-standards`: Universal coding standards across languages

---

## How to Start

Detect context:
- Triggered from spec-workflow > review the feature implementation against spec and tests
- Standalone > ask which feature or change to review

Gather context before starting:
- Load `tasks/spec-[feature-name].md` as the source of truth
- Load `tasks/test-plan-[feature-name].md` to understand test coverage
- Load project CLAUDE.md for tech stack and coding standards

---

## Step 1: Spec Compliance Check

Compare implementation against the spec:
- Does the code do everything the spec requires?
- Does it do anything the spec does not include? (scope creep)
- Are all edge cases from the spec handled in the code?
- Does the technical approach match what was specced?

Classify each deviation:
- Blocking -- must be fixed before approval
- Non-blocking -- should be addressed, does not block merge

---

## Step 2: Code Quality Check

**ECC delegation:** For Python projects with Standard+ changes, spawn the `python-reviewer` agent as a subagent with the changed files. It will run diagnostic commands (mypy, ruff, bandit) and review for PEP 8, type hints, FastAPI patterns, and security anti-patterns. For non-Python projects, spawn the `code-reviewer` agent instead. Merge the agent's findings into the quality check below -- do not duplicate effort.

Review for quality:
- Is the code readable? Would another engineer understand it without explanation?
- Are functions and variables named clearly and consistently?
- Are functions doing one thing -- not multiple responsibilities?
- Is there duplicated logic that should be extracted?
- Is error handling present -- no silent failures?
- Are inputs validated before use?
- Are there hardcoded values that should be config or constants?
- Is the code consistent with the rest of the codebase?
- Is there dead code or unused variables?

**ECC delegation:** If dead code, unused imports, or duplicate logic is found, spawn the `refactor-cleaner` agent as a subagent to safely identify and verify all dead code in the changed files. It will run detection tools, categorize by risk (SAFE/CAREFUL/RISKY), and confirm removals via grep before recommending changes. Include its verified findings in the review summary.

Classify each issue: Blocking or Non-blocking.

---

## Step 3: Security Check

Review for security issues:
- Any hardcoded secrets, tokens, or credentials?
- User inputs sanitised -- no injection vulnerabilities?
- Auth and authorisation enforced at every entry point?
- Sensitive data encrypted and not exposed in logs or responses?
- No insecure dependencies introduced?
- Error messages safe -- do not leak internal system info?

Any security issue is automatically Blocking -- no exceptions.
If a security issue is found: flag it, complete the rest of the review to capture all issues, then signal back. security-review running in parallel will handle the full security investigation.

---

## Step 4: Performance Check

**ECC delegation:** If the feature touches database queries or schema, spawn the `database-reviewer` agent as a subagent. It will review SQL queries for optimization, detect N+1 patterns, analyze index usage, and check schema design. Merge its findings into the performance check below.

Review for performance issues:
- N+1 queries or unnecessary repeated calls?
- Synchronous operations that should be async?
- Large datasets loaded entirely into memory?
- Unclosed connections or event listeners not cleaned up?
- Expensive operations that should be cached?
- Unbounded loops or recursion risks?

Classify: Blocking (will cause problems at scale) or Non-blocking (advisory).

---

## Step 5: Test Coverage Check

Review tests:
- Do tests exist for this feature?
- Do they cover happy path, error paths, and edge cases?
- Do all tests pass?
- Are tests meaningful -- testing behaviour, not just coverage numbers?

No tests > Blocking. Tests are not optional.
Thin tests > Non-blocking, must be noted clearly.

---

## Step 6: Feedback Severity Classification

After completing all checks, classify the overall feedback severity. This determines how far the pipeline restarts if changes are required.

```
Cosmetic:
  Issues: naming, formatting, comments, style, minor readability
  Pipeline impact: fix and re-review only (no re-test needed)
  Examples: "rename this variable", "add a comment here", "reformat this block"

Logic:
  Issues: behaviour changes, algorithm corrections, missing edge case handling, refactoring
  Pipeline impact: fix, re-test, then re-review
  Examples: "this condition is wrong", "missing null check", "off-by-one error"

Security:
  Issues: any security-related finding (injection, auth bypass, exposed secrets, etc.)
  Pipeline impact: fix, full pipeline re-run from Stage 1
  Examples: "SQL injection possible", "auth not checked on this endpoint"
```

The highest severity found determines the classification. If there are both Cosmetic and Logic issues, the classification is Logic. If there is any Security issue, the classification is Security.

Record the feedback severity in the pipeline state file.

---

## Step 7: Review Summary

Produce a written review summary:

```
## Code Review -- [Feature Name]

### Blocking Issues
- [Issue] -- [file/location] -- [why it blocks]

### Non-Blocking Issues
- [Issue] -- [file/location] -- [recommendation]

### Results
- Spec compliance: Pass / Fail
- Code quality: Pass / Needs work
- Security: Pass / Issues found (security-review handles in full)
- Performance: Pass / Needs work
- Test coverage: Pass / Fail

### Feedback Severity: [Cosmetic / Logic / Security]

### Decision
APPROVED / CHANGES REQUIRED
```

---

## Step 8: Signal Back

If APPROVED:
- Update `tasks/todo.md` -- mark code review complete
- Update `tasks/pipeline-state-[feature-name].md`: "code-review: APPROVED [timestamp]"
- Update `tasks/lessons.md` with patterns worth remembering
- Signal to spec-workflow: "Code review APPROVED for [feature]. Feedback severity: N/A. Proceed to next stage."

If CHANGES REQUIRED:
- Update `tasks/pipeline-state-[feature-name].md`: "code-review: CHANGES REQUIRED, severity: [Cosmetic/Logic/Security] [timestamp]"
- Signal to spec-workflow: "Code review CHANGES REQUIRED for [feature]. Feedback severity: [Cosmetic/Logic/Security]. Issues: [list each blocking issue clearly]. Returning to spec-workflow."
- spec-workflow will determine pipeline restart point based on feedback severity

---

## Failure Handling

**Blocking issues found**
- List every blocking issue with file, location, and reason
- Signal CHANGES REQUIRED with the correct feedback severity -- do not approve with unresolved blocking issues
- After fixes are made and pipeline restarts, re-review only the changed areas unless changes are widespread

**Security issue found**
- Flag in the review summary
- Mark as Blocking
- Set feedback severity to Security
- Signal CHANGES REQUIRED back to spec-workflow
- security-review (running in parallel) will conduct the full security investigation
- Do not attempt to resolve security issues in code-review -- that is security-review's role

**Spec deviation -- code does more than spec says**
- Scope creep is Blocking
- The extra code must be removed or the spec updated and re-confirmed with the user
- Never silently accept unspecced behaviour

**Spec deviation -- code does less than spec says**
- Missing implementation is Blocking
- Identify exactly what is missing
- Signal CHANGES REQUIRED -- spec-workflow will complete the missing work

**No spec file exists**
- Flag to the user -- a review without a spec is incomplete
- Ask user to confirm intended behaviour verbally
- Document the confirmed behaviour in the review summary
- Proceed with the verbal confirmation as the spec

**Code is too large to review in one pass**
- Break into logical sections
- Review each section separately
- Produce one combined summary at the end
- Do not approve until all sections are reviewed

**Review approved but new issue found later**
- Re-open the review
- Fix the new issue
- Update the review summary
- Log in `tasks/lessons.md`

---

## Rules

- Never approve code with blocking issues
- Never approve code with no tests
- Never approve code with any security issue -- security-review handles full investigation
- Spec compliance is not optional -- every deviation must be resolved or explicitly accepted
- Always classify feedback severity -- this determines pipeline restart behaviour
- Always produce a written review summary
- Always signal back explicitly -- APPROVED or CHANGES REQUIRED with feedback severity and specific issues listed
- Log outcome in `tasks/todo.md`, `tasks/pipeline-state-[feature-name].md`, and `tasks/lessons.md`
- This skill runs in parallel with security-review -- do not wait for or depend on security-review results
