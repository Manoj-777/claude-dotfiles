---
name: spec-workflow
description: Structured spec-driven development workflow for new features and bug fixes. Use when user says "new feature", "build", "implement", "add feature", "bug fix", "fix issue", "something is broken", or "not working". Also triggered by project-planning for individual feature implementation. Orchestrates the full pipeline -- Requirements, Analysis, Spec, Tasks, Implementation, then hands off to testing-workflow > code-review + security-review (parallel) > documentation-workflow > git-workflow > deployment-workflow. Never skips steps or jumps to implementation.
---

# Spec Workflow

The primary implementation orchestrator. Handles feature and bug implementation, then drives the full downstream pipeline to deployment. Each step is gated -- confirmed before moving forward.

---

## Pipeline Transitions

**State file:** `tasks/pipeline-state-[feature-name].md`

This file is created at the start of every feature or bug fix and updated after every stage. Format:

```
## Pipeline State: [Feature Name]

Change size: [Trivial / Small / Standard / Critical]
Pipeline path: [which stages apply based on change size]
Deployment strategy: [per-feature / per-milestone / manual]
Current stage: [stage name]
Status: [in-progress / blocked / complete]

### Stage History
- [timestamp] spec-workflow: implementation complete
- [timestamp] testing-workflow: PASSED
- [timestamp] code-review: APPROVED (feedback: cosmetic)
- [timestamp] security-review: APPROVED
- [timestamp] documentation-workflow: complete
- [timestamp] git-workflow: merged
- [timestamp] deployment-workflow: deployed
```

**How transitions work:**
- After each stage completes, update the state file with the result
- Tell the user: "Stage [X] complete. Next: [Y]. Proceeding." (in autonomous mode) or "Stage [X] complete. Run /[next-skill] to continue." (in manual mode)
- Signals between skills are conversation-based (the orchestrating agent reads the next skill's instructions and continues). The pipeline state file is the durable backup -- if context is lost, any skill can recover by reading it.
- If context window is running low: write full state to the pipeline state file and instruct: "Context is large. Start a new conversation and run /spec-workflow -- it will resume from the pipeline state file."
- Any skill can recover state by reading `tasks/pipeline-state-[feature-name].md`

---

## Pipeline Position

spec-workflow sits at the centre of the pipeline. It does not just implement -- it orchestrates the full journey from requirements to deployment.

```
project-planning
      |
spec-workflow (classify > requirements > spec > implementation)
      |
testing-workflow
      |
code-review + security-review (parallel)
      |
documentation-workflow
      |
git-workflow
      |
deployment-workflow
      |
project-planning (feature marked deployed)
```

---

## How to Start

**Check for existing pipeline state first.** Read `tasks/pipeline-state-*.md` files. If a pipeline is in progress for this feature, resume from the recorded stage instead of starting over.

If no existing state, detect intent from the user's message:
- Feature request > run Feature Workflow
- Bug report > run Bug Fix Workflow

If unclear, ask: "Is this a new feature or a bug fix?"

If triggered from project-planning, context (feature name, description, tech stack, architecture, dependencies, deployment strategy) will already be provided. Use it -- skip redundant questions.

If this is a re-spec of a previously specced feature (due to tech stack or architecture change), archive existing `tasks/spec-[feature-name].md` as `tasks/spec-[feature-name]-archived.md` and write a clean new spec.

---

## ECC Agent Delegation

This skill delegates to ECC agents at specific points for deeper analysis. Delegation is optional and enhances -- never replaces -- the pipeline gates.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 2 (Analysis) | `architect` | Codebase analysis, affected component identification, risk assessment | Standard+ features that touch multiple components |
| Step 4 (Tasks) | `planner` | Detailed task breakdown with file paths, dependencies, phased delivery | Complex features (Large complexity) |
| Step 5 (Implementation) | `python-reviewer` | Real-time review during implementation for Python projects | Python projects -- run after completing implementation |
| Step 5 (Post-impl) | `refactor-cleaner` | Dead code cleanup, unused import removal, duplicate elimination | After implementation when the feature replaced or restructured existing code |
| Pipeline Failure Handling | `loop-operator` | Safe autonomous loop management with stall detection and escalation | When the pipeline enters a repeated failure-fix-retest cycle (2+ consecutive failures at the same stage) |

Agents NOT used here (and why):
- `build-error-resolver`: TypeScript/JS focused, not needed for Python projects

Supplementary ECC Skills (reference as needed):
- `python-patterns`: Pythonic idioms and PEP 8 best practices during implementation
- `api-design`: REST API design patterns when the feature adds new endpoints
- `backend-patterns`: Backend architecture patterns during analysis and implementation
- `strategic-compact`: Context management for long pipeline runs -- suggests compaction before overflow

---

## Change Size Classification

Before starting any workflow, classify the change. This determines which pipeline stages are required.

```
Trivial:
  Examples: typo fix, config value change, formatting, comment update
  Pipeline: git-workflow only
  No spec, no tests, no reviews, no docs

Small:
  Examples: bug fix, minor feature, single-file change with limited scope
  Pipeline: testing-workflow > code-review > git-workflow > deployment-workflow
  Spec is optional (fix plan for bugs). Security review skipped unless auth/input handling touched.

Standard:
  Examples: new feature, multi-file change, new endpoint, new integration
  Pipeline: full pipeline (all stages)

Critical:
  Examples: security fix, auth change, data migration, infrastructure change
  Pipeline: full pipeline (all stages) + expedited priority
  Security review is mandatory and thorough. No shortcuts.
```

Present the classification to the user: "I've classified this as [size]. Pipeline: [stages]. Does that look right?"

If the user overrides, use their classification. Save the classification in the pipeline state file.

---

## Feature Workflow

### Step 1: Requirements
Ask the user:
- What should this feature do? (core behaviour)
- Who is it for? (user type or system)
- What does success look like?
- Any constraints? (performance, security, compatibility)
- What is explicitly out of scope?

If triggered from project-planning, use provided context. Only ask for what is missing.

Summarise the answers back. Get confirmation before proceeding.

### Step 2: Analysis

**ECC delegation:** For Standard+ features, spawn the `architect` agent as a subagent to analyze the existing codebase, identify affected components, and assess architectural impact. Feed its findings into the analysis below.

Based on confirmed requirements:
- Identify affected components, files, and systems
- Identify risks, edge cases, and unknowns
- Identify dependencies on other features -- check if any dependency has open blocking bugs before proceeding
- Flag anything that needs a decision before building

**Threat assessment** (shift-left security):
- Does this feature introduce new attack surfaces? (new endpoints, new input fields, new integrations)
- Does it handle sensitive data? How is it stored, transmitted, and displayed?
- Auth/authz implications -- does it need new permissions or roles?
- Does it accept user input that reaches a database, shell, file system, or external API?
- If any security concern identified: document it in the spec and flag for security-review

Present findings. Ask: "Anything to add or correct before I write the spec?"

### Step 3: Spec
Write a formal spec covering:
- Feature name and one-line summary
- Problem being solved
- Proposed solution (high level)
- Scope: in and out
- Technical approach
- Edge cases and how they are handled
- Security considerations (from threat assessment -- even if none, state "No new attack surfaces identified")
- Open questions or risks

Save to `tasks/spec-[feature-name].md`.
Ask: "Does this spec look correct? Shall I generate the task plan?"

### Step 4: Tasks

**ECC delegation:** For Large features, spawn the `planner` agent as a subagent with the confirmed spec. It will produce a phased task breakdown with exact file paths, dependencies between steps, and risk levels. Review and refine its output before appending to todo.md.

Break the spec into granular checkable tasks. Append to `tasks/todo.md` under a new section. Never overwrite or delete existing content.

Format:
```
## [Feature Name]

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

Create `tasks/todo.md` if it does not exist. Append if it does.

Ask: "Task plan ready. Shall I start implementation?"

### Step 5: Implementation
- Work through tasks top to bottom
- Mark each complete as you go: `- [x]`
- Do not skip or reorder tasks without asking
- After all tasks done: summarise what was built
- Update `tasks/lessons.md` with anything learned

**ECC delegation:** For Python projects, after completing implementation, spawn the `python-reviewer` agent as a subagent to do a quick review of the implemented code. It will check PEP 8 compliance, type hints, FastAPI patterns, and run diagnostic commands (mypy, ruff, bandit). Fix any critical issues it finds before proceeding to the pipeline. This is a lightweight pre-flight check -- the full code-review happens at Stage 2+3.

**ECC delegation:** If the feature replaced or restructured existing code, spawn the `refactor-cleaner` agent as a subagent after implementation. It will detect dead code, unused imports, duplicate logic, and unused dependencies introduced by the restructuring. Apply its safe removals (verified by grep and tests) before proceeding to the pipeline. Skip this if the feature is purely additive with no code replacement.

Create the pipeline state file: `tasks/pipeline-state-[feature-name].md` with the change size, pipeline path, and mark implementation as complete.

Then proceed to the downstream pipeline -- see Pipeline Orchestration below.

---

## Bug Fix Workflow

### Step 1: Reproduce
Before touching code:
- Ask user to describe the bug in detail
- What is the expected behaviour?
- What is the actual behaviour?
- How is it reproduced? (steps, inputs, environment)
- Is it consistent or intermittent?

Confirm understanding before proceeding.

### Step 2: Root Cause Analysis
Investigate the codebase:
- Trace the execution path related to the bug
- Identify exactly where and why the failure occurs -- do not guess
- Find evidence: logs, code, tests
- Identify if this bug blocks any other features -- flag clearly if so

Present findings: "Root cause is X because Y. Confirm before I plan the fix?"

### Step 3: Fix Plan
Define the fix:
- What exactly will be changed and why
- What will NOT be changed
- Regression risk?
- How will the fix be verified?

Save to `tasks/fix-[bug-name].md`.

Append checklist to `tasks/todo.md`:
```
## Bug Fix: [Bug Name]

- [ ] Reproduce confirmed
- [ ] Root cause identified
- [ ] Fix applied
- [ ] Tests passing
- [ ] Verified fix works
```

Classify change size (see Change Size Classification above). Most bug fixes are Small or Standard.

Ask: "Fix plan confirmed. Shall I implement?"

### Step 4: Implementation
- Apply the fix as defined in the fix plan
- Do not make unrelated changes -- keep the fix minimal
- Mark checklist items complete as you go: `- [x]`

### Step 5: Verification and Pipeline
Prove the fix works:
- Reproduce the original bug scenario -- confirm it no longer occurs
- Check edge cases mentioned in analysis
- Summarise: what was broken, what was changed, how it was verified

Update `tasks/lessons.md` with root cause pattern and fix approach.

Create the pipeline state file and proceed to the downstream pipeline based on the change size classification.

If this bug was blocking another feature and was triggered from project-planning: after the full pipeline completes, signal -- "Bug [name] fully deployed. Returning to project-planning." so project-planning can resume the blocked feature.

---

## Pipeline Orchestration

After implementation (feature or bug fix), spec-workflow drives the downstream pipeline based on the change size classification. Each stage must complete and signal back before the next is triggered.

### Trivial Changes
- Skip directly to Stage 5 (git-workflow)
- No testing, review, security, or documentation required

### Small Changes
- Stage 1: testing-workflow
- Stage 2: code-review (security-review skipped unless auth/input handling is involved)
- Stage 5: git-workflow
- Stage 6: deployment-workflow (if deployment strategy is per-feature)

### Standard and Critical Changes (full pipeline)

#### Stage 1: Testing
- Trigger testing-workflow with feature context
- Wait for signal
- If "Testing complete" > proceed to Stage 2+3
- If "Testing blocked -- [reason]" > go to Pipeline Failure Handling below

#### Stage 2+3: Code Review and Security Review (parallel)
- Trigger code-review AND security-review simultaneously -- they are independent
- Wait for BOTH signals
- If both "APPROVED" > proceed to Stage 4
- If either returns issues > go to Pipeline Failure Handling below
- For Critical changes: security-review runs in thorough mode (full application context, not just feature)

#### Stage 4: Documentation
- Trigger documentation-workflow with feature spec as context
- documentation-workflow will assess whether docs are needed based on the change
- Wait for signal
- If "Documentation complete" or "Documentation not required" > proceed to Stage 5
- If blocked > resolve documentation issues directly, then proceed

#### Stage 5: Git
- Trigger git-workflow to create branch, commit, raise PR, and merge
- Wait for signal
- If "Git complete -- merged" > proceed to Stage 6
- If blocked (CI failure, conflict) > go to Pipeline Failure Handling below

#### Stage 6: Deployment
- Check deployment strategy from pipeline state file or project plan:
  - Per-feature: trigger deployment-workflow now
  - Per-milestone: skip -- update state file as "merged, awaiting milestone deployment"
  - Manual: skip -- tell user "Feature merged. Deploy when ready with /deployment-workflow"
- If triggered: wait for signal
- If "Deployment complete -- production verified" > pipeline done
- If "Deployment failed -- rolled back -- [reason]" > go to Pipeline Failure Handling below

### Pipeline Complete
After final stage:
- Update `tasks/todo.md` -- mark feature fully complete
- Update `tasks/pipeline-state-[feature-name].md` -- mark as complete
- Update `tasks/lessons.md` with any pipeline observations
- If triggered from project-planning: signal -- "Feature [name] fully deployed. Returning to project-planning."
- If standalone: summarise the full pipeline outcome to the user

---

## Pipeline Failure Handling

**ECC delegation:** If the pipeline enters a repeated failure-fix-retest cycle (2+ consecutive failures at the same stage with similar errors), spawn the `loop-operator` agent as a subagent. It will track progress checkpoints, detect stalls and retry storms, and escalate when no progress is being made across consecutive attempts. Follow its escalation guidance -- pause and reduce scope rather than continuing to loop on the same failure.

When any downstream stage fails and signals back:

**Testing blocked**
- Read the failure reason carefully
- If implementation bugs: re-open implementation, fix the specific failures, then restart from Stage 1
- If test environment issue: resolve the environment, restart from Stage 1
- Do not skip testing after a fix -- always re-run from Stage 1

**Code review: CHANGES REQUIRED**
- Read every issue listed in the signal
- Check the feedback severity classification from code-review:
  - **Cosmetic** (naming, formatting, comments): fix the issues, restart from Stage 2+3 (re-review only, no re-test needed)
  - **Logic** (behaviour affected, algorithm change): fix the issues, restart from Stage 1 (re-test before re-reviewing)
  - **Security** (any security-related feedback): fix the issues, restart from Stage 1 (full re-run required)

**Security review: BLOCKED**
- These are serious -- treat every finding as critical until assessed
- Fix all Critical and High findings via Bug Fix Workflow
- After all fixes: restart pipeline from Stage 1 -- full re-run required
- Do not skip any stage after security fixes

**Documentation blocked**
- Documentation issues rarely require code changes
- Resolve directly in documentation-workflow
- Resume from Stage 5 (git) after documentation is complete

**Git blocked (CI failure)**
- Read the CI failure output
- If test failure: fix the code, restart from Stage 1
- If build failure: fix the build issue, restart from Stage 5
- If merge conflict: resolve the conflict, restart from Stage 2+3 (re-review after conflict resolution)

**Deployment failed and rolled back**
- The fix must go through the full pipeline again
- Investigate root cause -- is it a code issue or an environment issue?
- If code issue: fix via Bug Fix Workflow, restart pipeline from Stage 1
- If environment issue: fix the environment, restart from Stage 6
- Do not re-deploy without re-running the full pipeline first (unless environment-only fix)

---

## Rules

- Never skip a step
- Never start implementation without a confirmed plan
- Always classify change size before entering the pipeline
- All spec and fix docs go in `tasks/` at the project root
- All task lists append to `tasks/todo.md` -- never overwrite
- Always create and maintain `tasks/pipeline-state-[feature-name].md`
- Always update `tasks/lessons.md` after completion
- Never proceed with a feature if a blocking bug exists in a dependency
- If re-speccing a previously specced feature, archive the old spec first
- If the user switches context mid-workflow, pause explicitly -- summarise where you stopped and update the pipeline state file -- then start the new context. Resume the paused workflow when the user returns
- The pipeline path depends on change size -- not all changes need all stages
- Trivial changes go through git-workflow only
- Small changes skip security-review and documentation-workflow (unless security-relevant)
- Code review and security review run in parallel for Standard and Critical changes
- After cosmetic review feedback: restart from review only (no re-test)
- After logic review feedback: restart from testing
- After security review feedback: restart from testing (full re-run)
- A feature is only complete when its final pipeline stage signals success
- Threat assessment is mandatory during analysis -- security concerns must be documented in the spec
