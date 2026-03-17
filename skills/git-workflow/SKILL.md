---
name: git-workflow
description: Structured git workflow covering branching, commits, pull requests, merges, and conflict resolution. Use when user says "commit", "push", "create branch", "raise PR", "pull request", "merge", or "git". Triggered by spec-workflow as Stage 5 of the pipeline after documentation-workflow completes. Handles all git operations including conflicts, CI failures, accidentally committed secrets, and broken main branch scenarios. Never commits directly to main.
---

# Git Workflow

A structured git workflow that enforces consistent branching, commit standards, and PR practices. Triggered as Stage 5 of the pipeline. Never commits directly to main.

---

## Pipeline Position

```
spec-workflow > testing-workflow > code-review + security-review > documentation-workflow > [git-workflow] > deployment-workflow
```

Triggered by: spec-workflow (after documentation-workflow completes)
Signals back to: spec-workflow

---

## Pipeline State

On start: read `tasks/pipeline-state-[feature-name].md` to understand change size, pipeline path, and upstream stage results.
On complete: update the state file with git workflow result and timestamp.

---

## ECC Agent Delegation

This skill delegates to ECC agents for CI failure diagnosis. Delegation is optional and enhances -- never replaces -- manual investigation.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Failure Handling (CI fails) | `build-error-resolver` | CI/CD build failure diagnosis, minimal-diff fixes, dependency resolution | When CI pipeline fails on PR and the failure is a build/dependency issue (not a test failure) |

Agents NOT used here (and why):
- `python-reviewer`: CI failures are build/config issues, not code quality -- python-reviewer is used in code-review
- `code-reviewer`: Same rationale -- CI diagnosis is a different concern than code quality

---

## How to Start

Detect context:
- Triggered from spec-workflow > create branch, commit all changes (code + docs), raise PR, merge
- Standalone > ask what git action is needed

Load project CLAUDE.md for any project-specific git conventions before proceeding.

---

## Branch Naming Convention

```
feature/[short-feature-name]     > new features
fix/[short-bug-description]      > bug fixes
hotfix/[short-description]       > urgent production fixes
chore/[short-description]        > non-functional changes
refactor/[short-description]     > code restructure without behaviour change
test/[short-description]         > test-only changes
docs/[short-description]         > documentation-only changes
```

Rules:
- All lowercase, hyphens only, max 5 words
- Never commit to main or master directly

---

## Commit Message Standard

Format:
```
[type]: [short description in present tense]

[optional body -- what and why, not how]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `hotfix`, `security`

Rules:
- Present tense -- "add" not "added"
- No period at end of subject line
- Subject line max 72 characters
- Each commit represents one logical change
- Commit code and documentation changes together -- they belong in the same PR

---

## Step 1: Create Branch

- Ensure local main is up to date: `git pull origin main`
- Create branch from main: `git checkout -b [branch-name]`
- Confirm branch is created and checked out

If branch already exists (resuming):
- Check out existing branch
- Pull latest: `git pull origin [branch-name]`
- Check for conflicts with main -- if conflicts exist, go to Conflict Handling

---

## Step 2: Stage and Commit

Stage all changes for this feature -- code, tests, and documentation together:
- Confirm no secrets or debug code are staged
- Confirm no unrelated files are staged
- Write commit message following the standard above
- If the feature is large: break into atomic logical commits during implementation
- For pipeline-driven commits: one final commit covering all changes is acceptable

---

## Step 3: Pre-PR Checklist

Before raising a PR:
- [ ] All tests pass locally
- [ ] Code review completed and approved (check pipeline state file)
- [ ] Security review passed (check pipeline state file)
- [ ] Documentation updated and included in this branch (or confirmed not required)
- [ ] No merge conflicts with main
- [ ] Branch is up to date with main
- [ ] No debug code or commented-out code
- [ ] No hardcoded secrets
- [ ] CHANGELOG updated (if user-visible change)

If any item fails > resolve before raising PR.

For Trivial changes (change size from pipeline state): only verify no secrets, no conflicts, and branch is up to date.

---

## Step 4: Raise Pull Request

PR must include:

```
## What does this PR do?
[1-2 sentence summary]

## Why?
[context -- what problem does this solve]

## How was it tested?
[test approach and results]

## Checklist
- [ ] Tests pass
- [ ] Code reviewed
- [ ] Security reviewed
- [ ] Documentation updated
- [ ] No secrets in code

## Related
[link to spec file: tasks/spec-[feature-name].md]
```

Rules:
- PR title follows commit message format
- One feature or fix per PR
- Large PRs must be broken into smaller ones where possible

---

## Step 5: Merge

After PR is approved and all checks pass:
- Squash merge for feature branches (keeps main history clean)
- Merge commit for releases (preserves milestone history)
- Never force push to main
- After merge: delete the feature branch
- Pull latest main locally: `git pull origin main`
- Confirm merge is reflected locally

---

## Step 6: Signal Back

After successful merge:
- Update `tasks/todo.md` -- mark git workflow complete
- Update `tasks/pipeline-state-[feature-name].md`: "git-workflow: merged [timestamp]"
- Update `tasks/lessons.md` with any git issues encountered
- Signal to spec-workflow: "Git workflow complete for [feature]. Pipeline Stage 5 passed. Proceed to deployment-workflow."

If blocked and cannot be resolved:
- Update `tasks/pipeline-state-[feature-name].md`: "git-workflow: BLOCKED [timestamp], reason: [X]"
- Signal to spec-workflow: "Git workflow blocked for [feature]. Reason: [X]. Action needed: [Y]."

---

## Failure Handling

**Merge conflict when updating branch from main**
- Identify conflicting files: `git status`
- Open each conflicting file and resolve manually -- understand both sides before resolving
- Never blindly accept either side
- After resolving: `git add [file]` then `git commit`
- Re-run tests after conflict resolution -- conflicts can introduce subtle bugs
- After conflict resolution, signal spec-workflow to re-run code-review and security-review before merging -- conflict resolution is a code change

**Push rejected (non-fast-forward)**
- Someone else pushed to the same branch
- Pull first: `git pull origin [branch-name]`
- Resolve conflicts
- Then push again
- Never force push a shared branch

**Committed to main directly**
- If not yet pushed: `git reset HEAD~1` to undo, recommit on correct branch
- If already pushed to main: create a revert commit -- never rewrite shared history
- Log in `tasks/lessons.md`

**Accidentally committed a secret**
- This is a security incident -- rotate the secret immediately
- Remove from code
- Purge from git history (BFG or git filter-branch)
- Force push the cleaned history (coordinate with team)
- Add to `.gitignore`
- Log in `tasks/lessons.md`
- Signal spec-workflow to trigger security-review before proceeding

**Branch is stale (significantly behind main)**
- Rebase or merge main into the branch
- Resolve conflicts carefully
- Re-run all tests after rebasing
- If branch is dangerously stale: start fresh from main and cherry-pick changes

**CI/CD pipeline fails on PR**
- Read failure output carefully
- Test failure > signal spec-workflow to fix the code, restart pipeline from Stage 1 (testing)
- Build failure > **ECC delegation:** spawn the `build-error-resolver` agent as a subagent with the CI failure output. It will diagnose the build error, identify the minimal-diff fix, and suggest dependency resolutions. Apply its fix, re-push, and re-run CI. If the agent cannot resolve it, investigate manually and restart from Stage 5 (git).
- Lint failure > fix lint errors, re-push, re-run CI
- Never merge a PR with a failing CI pipeline

**PR review requests changes (human reviewer)**
- Address every comment
- For each: fix it or explain why it should not change
- After addressing all comments, re-request review
- Do not merge until all comments resolved

**Main branch broken after a merge**
- Stop all other merges immediately
- Identify which merge broke main
- Revert the breaking merge: `git revert [merge-commit-hash]`
- After main is stable, investigate root cause
- The original PR must be fixed and re-reviewed before re-merging

**Accidentally deleted a branch**
- Check git reflog: `git reflog`
- Find the last commit hash of the deleted branch
- Recreate: `git checkout -b [branch-name] [commit-hash]`
- Confirm all work is recovered

---

## Rules

- Never commit directly to main or master
- Never force push a shared branch
- Every PR must have a description
- Every PR must have passing CI before merge
- Commit messages must follow the defined format
- Secrets found in commits are always treated as compromised -- rotate immediately
- Always delete branches after merge
- Always update local main after a merge
- After conflict resolution: re-run code-review and security-review before merging
- After any CI failure that requires code changes: restart pipeline from Stage 1
- Always update `tasks/pipeline-state-[feature-name].md` with results
- Log git incidents in `tasks/lessons.md`
- Always signal back explicitly -- complete or blocked with reason
