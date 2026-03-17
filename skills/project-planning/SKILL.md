---
name: project-planning
description: Full project planning workflow for new projects. Use when user says "new project", "start a project", "plan a project", "build an app", "create a system", "I want to build", or "let's start something new". Runs a gated multi-step process -- Vision, Tech Stack, Architecture, Epic and Feature Breakdown, Milestone Planning, Master Plan -- before handing off each feature through the full pipeline (spec > test > review > security > docs > git > deploy). Never jumps to implementation without a complete plan.
---

# Project Planning Workflow

A gated top-down planning workflow for new projects. Covers the full picture before any code is written. Each step must be completed and confirmed before moving to the next.

---

## Pipeline Transitions

This pipeline uses file-based state tracking and explicit user-driven transitions between skills.

**State file:** `tasks/pipeline-state-[feature-name].md` -- created by spec-workflow, read/updated by every skill.

**How transitions work:**
- Each skill reads the pipeline state file at start and writes to it at end
- When a skill completes, it updates the state file and tells the user: "Stage X complete. Run /[next-skill] to continue, or I can proceed automatically."
- If the user has instructed autonomous mode: the agent reads the next skill's instructions and continues in the same conversation
- If the context window is running low: the agent writes full state to the pipeline state file and tells the user to start a new conversation with /spec-workflow to resume
- The pipeline state file is the single source of truth -- if context is lost, any skill can recover by reading it

---

## ECC Agent Delegation

This skill delegates to ECC agents at specific points for deeper analysis. Delegation is optional and enhances -- never replaces -- the pipeline gates.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 3 (Architecture) | `architect` | System design, scalability analysis, trade-off evaluation, ADR generation | Always for Standard+ projects. Use as subagent to analyze existing codebase and propose architecture |
| Step 4 (Features) | `planner` | Detailed feature breakdown with file paths, dependencies, risk assessment | When features are complex (Medium/Large). Use as subagent to analyze codebase structure |
| Step 7 (Master Plan) | `harness-optimizer` | Audit and tune the agent harness configuration (hooks, evals, routing, context) for the project | Once per project at plan finalization -- ensures the pipeline runs optimally for this project's stack |
| Step 8 (Milestone Complete) | `chief-of-staff` | Draft milestone completion communications to stakeholders, triage pending responses | When stakeholders need notification of milestone status or deployment readiness |

Agents NOT used here (and why):
- `planner` for Step 1-2: Vision and tech stack are user-driven decisions, not codebase analysis
- `loop-operator`: Pipeline orchestration in Step 8 is already well-structured with explicit state files and signals

---

## How to Start

When triggered, say:
"Let's plan this project properly from the ground up. I'll take you through each step -- vision, tech stack, architecture, features, and milestones -- before we write a single line of code."

Then begin Step 1.

---

## Step 1: Project Vision

Ask the user:
- What are we building? (one paragraph description)
- What problem does it solve?
- Who is it for? (end users, internal team, enterprise clients)
- What does success look like for v1?
- Any known constraints? (timeline, budget, team size, compliance)
- What is explicitly out of scope for now?

Summarise back as a clean Project Vision statement. Get confirmation before proceeding.

Save vision to `tasks/project-plan.md` under:
```
## Project Vision
```

---

## Step 2: Tech Stack

Based on the confirmed vision:
- Suggest a tech stack that fits the requirements
- For each layer (frontend, backend, database, cloud, AI, integrations) suggest an option and explain why
- Highlight tradeoffs where relevant
- Allow the user to override any suggestion

Ask: "Does this stack work for you, or would you like to change anything?"

Once confirmed, save to `tasks/project-plan.md` under:
```
## Tech Stack
```

---

## Step 3: Architecture

**ECC delegation:** Spawn the `architect` agent as a subagent to analyze the existing codebase (if any), evaluate trade-offs, and draft the architecture proposal. The architect agent uses Opus model and specializes in scalability, modularity, and ADR generation. Review its output before presenting to the user.

Based on confirmed vision and tech stack:
- Design the high level system architecture
- Define key components and what each does
- Define how components interact and communicate
- Define data flow -- where data enters, moves, and is stored
- Identify external integrations and boundaries
- Flag any architectural risks or decisions that need to be made

Present the architecture clearly. Ask: "Does this architecture make sense? Anything to change?"

Save to `tasks/project-plan.md` under:
```
## Architecture
```

---

## Step 4: Epic and Feature Breakdown

**ECC delegation:** For complex projects, spawn the `planner` agent as a subagent to analyze the codebase and propose a detailed feature breakdown with file paths, dependencies, and risk levels. The planner agent uses Opus model and excels at phased implementation plans. Review and refine its output.

Based on confirmed architecture:
- Break the project into Epics (major areas of functionality)
- Break each Epic into Features (individual buildable units)
- For each Feature provide:
  - Feature name
  - One line description
  - Which Epic it belongs to
  - Rough complexity (Small / Medium / Large)
  - Dependencies on other features (if any)

Present the full breakdown. Ask: "Does this cover everything? Any features to add, remove, or change?"

Save to `tasks/project-plan.md` under:
```
## Epics and Features
```

---

## Step 5: Milestone Planning

Based on confirmed epics and features:
- Group features into milestones (v1, v2, v3 or Phase 1, Phase 2, Phase 3)
- Each milestone should represent a shippable, meaningful slice of the product
- v1 / Phase 1 should be the smallest useful version -- core functionality only
- Later milestones build on top

For each milestone define:
- Milestone name and goal
- Features included
- What is deliberately deferred to later milestones

Present the milestone plan. Ask: "Does this phasing make sense? Any changes?"

Save to `tasks/project-plan.md` under:
```
## Milestones
```

---

## Step 6: Deployment Strategy

Ask the user to choose a deployment strategy:

```
Deployment strategy options:
- Per-feature: deploy after each feature completes the pipeline (continuous delivery)
- Per-milestone: batch all features, deploy the milestone as a unit
- Manual: user triggers deployment when ready (pipeline stops at git-workflow)
```

Default to per-feature unless the user chooses otherwise. The chosen strategy affects how deployment-workflow is triggered.

Save to `tasks/project-plan.md` under:
```
## Deployment Strategy
[chosen strategy]
```

---

## Step 7: Master Plan Summary

**ECC delegation:** Once per project, after the master plan is confirmed, spawn the `harness-optimizer` agent as a subagent. It will audit the local agent harness configuration (hooks, evals, model routing, context management) and propose targeted improvements for this project's tech stack and pipeline. Apply its recommendations to optimize reliability and throughput for all downstream pipeline stages. This is a one-time setup step -- not repeated per feature.

Compile everything into a final master plan in `tasks/project-plan.md`:

```
## Project Vision
[confirmed vision]

## Tech Stack
[confirmed stack]

## Architecture
[confirmed architecture]

## Epics and Features
[confirmed breakdown]

## Milestones
[confirmed phases]

## Deployment Strategy
[chosen strategy]

## Implementation Order
[ordered list of features to implement, milestone by milestone]

## Feature Status
[table: feature name | status: not started / in progress / deployed]

## Change Log
[empty at start -- updated whenever scope, stack, or architecture changes]
```

Present the full master plan. Ask: "This is the complete project plan. Ready to start building?"

### 7b: Generate Project CLAUDE.md

After the master plan is confirmed, generate the project's `CLAUDE.md` at the project root. This is the file Claude Code reads on every session start -- it must contain everything needed to work on this project effectively.

Every section's content comes directly from the planning steps already completed. Do not invent content -- source it from the confirmed plan.

**Section-by-section source mapping:**

```
## Project Overview
  Source: Step 1 (Project Vision)
  Content: Rewrite the vision statement as a concise 1-2 paragraph project description.
  Include: what it does, who it is for, what problem it solves, current state (new project / existing).

## Tech Stack
  Source: Step 2 (Tech Stack)
  Content: Copy the confirmed stack as a bullet list with specific versions.
  Format: "- **Layer**: Technology version, Technology version"
  Example: "- **Backend**: Python 3.11, FastAPI, Uvicorn"
  Include every layer discussed: backend, frontend, database, AI/ML, cloud, deployment, testing tools.

## Architecture
  Source: Step 3 (Architecture)
  Content: The confirmed architecture -- component diagram (ASCII art or description),
  data flow, communication patterns, and key design decisions with WHY they were made.
  Keep the same level of detail from Step 3 -- this IS the architecture reference.

## Key Files
  Source: Step 4 (Epic and Feature Breakdown) + project scaffolding
  Content: Table of the most important 10-15 files/directories in the project.
  For NEW projects: list the files that WILL be created based on the architecture.
  Include: config files, entry points, core logic modules, API routes, models/schemas,
  test directories, deployment configs, and any project-specific scripts.
  Format: "| `path/to/file` | What this file does |"
  Update this section after Milestone 1 features are implemented -- initial paths may shift.

## Commands
  Source: Step 2 (Tech Stack) + Step 3 (Architecture) + Step 6 (Deployment Strategy)
  Content: All commands needed to work on this project -- install, run, test, build, deploy.
  For NEW projects: write the commands based on the chosen stack (e.g., pip install, npm install,
  docker-compose up, pytest). These are best-effort until the project is scaffolded -- update
  after the first feature is implemented and commands are verified.
  Format: bash code block with comments grouping related commands.

## Configuration
  Source: Step 2 (Tech Stack) + Step 3 (Architecture)
  Content: Where configuration lives, what the key settings are, and how environment
  variables override defaults. Derived from the tech stack choices (e.g., if FastAPI was chosen,
  config likely lives in a config.py or .env; if Django, in settings.py).
  Include: config file path, key settings (names only, never values), env var overrides.

## Project-Specific Rules
  Source: ALL steps (1-6) -- decisions and constraints captured during planning
  Content: Rules unique to THIS project. Not generic best practices -- those belong in
  the global CLAUDE.md. These are decisions made during planning that must be followed.
  Extract from:
  - Step 1 constraints ("must be stateless", "must support multi-region")
  - Step 2 stack decisions ("all config in config.py", "use boto3 not aws-cli")
  - Step 3 architecture decisions ("backend is stateless", "no server-side sessions")
  - Step 4 component boundaries ("tool results flow through formatter before LLM")
  Always include: "Check tasks/lessons.md at session start. Update it after any correction."

## Deployment
  Source: Step 6 (Deployment Strategy) + Step 3 (Architecture infrastructure layer)
  Content: How the project is deployed -- CI/CD pipeline, infrastructure, environments,
  key deployment files. For NEW projects, this starts as the planned deployment approach
  and is updated after deployment-workflow runs for the first time.

## Known Gotchas
  Source: Empty for new projects. Populated during development.
  Content: Counterintuitive behaviors, version conflicts, config mismatches discovered
  during implementation. Each gotcha is one line -- specific and actionable.
  This section grows over time as tasks/lessons.md captures issues.
  documentation-workflow copies relevant gotchas from tasks/lessons.md to here.
```

Rules for generating CLAUDE.md:
- Only include sections that apply to this project -- omit empty sections
- Be specific, not generic -- "Python 3.11, FastAPI, Uvicorn" not "Python web framework"
- Key Files should reference actual file paths, not placeholders -- for new projects, use planned paths and mark with "(planned)" if the file does not exist yet
- Commands are best-effort for new projects -- mark unverified commands with a comment "# verify after first feature is implemented"
- Never include real secrets, even as examples -- use placeholder names like `YOUR_API_KEY`
- This file is committed to the repo -- keep it concise but complete
- documentation-workflow updates CLAUDE.md whenever architecture, stack, or conventions change
- After each milestone, review and update Key Files, Commands, and Known Gotchas based on what was actually built

If the project already has a CLAUDE.md (existing project): read it, merge new planning context into it, and preserve any existing gotchas and rules. Do not overwrite information that was added by previous development sessions.

If the project already has a CLAUDE.md (existing project): read it, merge new planning context into it, and preserve any existing gotchas and rules.

---

## Step 8: Feature Pipeline Orchestration

Once the master plan is confirmed, implement features starting from Milestone 1.

**project-planning is the orchestrator.** It hands each feature to spec-workflow and waits for the FULL pipeline to complete. The full pipeline for each feature is:

```
spec-workflow > testing-workflow > code-review + security-review (parallel) > documentation-workflow > git-workflow > deployment-workflow > back to project-planning
```

### 8a: Parallelization Assessment (automatic, per milestone)

Before starting any milestone, automatically assess whether features can be parallelized. This runs every time -- no user prompt needed.

**Step 1: List all features in this milestone** from `tasks/project-plan.md`.

**Step 2: For each pair of features, check:**
- Do they modify the same files or components? → CANNOT parallelize
- Does one depend on the other's output or API? → CANNOT parallelize
- Do they touch the same database tables with schema changes? → CANNOT parallelize
- Do they modify shared configuration? → CAREFUL -- may conflict
- Are they in completely different areas of the codebase? → SAFE to parallelize

**Step 3: Decide the execution strategy:**

```
1 feature in milestone:
  → Sequential (no parallelization possible)

2 independent features:
  → Lightweight concurrent processing (within this conversation, see below)

3+ independent features AND WSL/tmux available:
  → Trigger parallel-orchestrator for full multi-agent execution
  → parallel-orchestrator handles worktrees, panes, monitoring, and merge

3+ features but some depend on others:
  → Split into tracks: parallel track (independent features) + sequential track (dependent features)
  → Run parallel track first via parallel-orchestrator
  → After parallel track merges, run sequential track normally

All features depend on each other:
  → Sequential processing (no parallelization possible)
```

**Step 4: Present the decision:**
- "Milestone [X] has [N] features. [Y] can run in parallel, [Z] must run sequentially after. Running parallel track first."
- If all sequential: "All features in this milestone have dependencies. Running sequentially."

If parallel-orchestrator is triggered, it takes over milestone execution. project-planning resumes when parallel-orchestrator signals completion and all branches are merged and integration-verified.

### 8b: Sequential Feature Processing

Used when features cannot be parallelized, or as the fallback when WSL/tmux is not available.

For each feature:
1. Announce: "Starting feature: [Feature Name] -- [one line description]"
2. Update feature status to "in progress" in `tasks/project-plan.md`
3. Pass the following context to spec-workflow:
   - Feature name and description
   - Relevant epic
   - Tech stack (already confirmed)
   - Architecture context (relevant components)
   - Dependencies (features already built and deployed)
   - Deployment strategy (from project plan)
4. Trigger spec-workflow and wait
5. spec-workflow orchestrates the full pipeline internally
6. Wait for one of two signals from the pipeline:
   - "Feature [name] fully deployed." > mark feature as "deployed" in `tasks/project-plan.md`, move to next feature
   - "Feature [name] pipeline blocked. Reason: [X]. Stage: [Y]." > handle via Pipeline Failure Handling below

### 8c: Lightweight Concurrent Processing (2 features, same conversation)

Used when exactly 2 features are independent and WSL/tmux is not needed.

Features can overlap when they have no code dependency on each other:
- Feature A is in code-review or later > Feature B can start spec-workflow if Feature B does not depend on Feature A's code
- Never overlap features that modify the same files or components
- Never have more than 2 features in the pipeline simultaneously
- Each feature gets its own pipeline state file

To start a concurrent feature:
1. Confirm the in-progress feature is past implementation (Stage 2 or later)
2. Confirm the new feature has no code-level dependency on the in-progress feature
3. Start the new feature with spec-workflow in a separate context

### Per-Milestone Deployment

If deployment strategy is "per-milestone":
- Each feature runs the pipeline through git-workflow (Stage 5) only
- deployment-workflow is skipped per feature
- After ALL features in the milestone are merged: trigger deployment-workflow once for the entire milestone
- Pass all feature names and specs to deployment-workflow as context

### Manual Deployment

If deployment strategy is "manual":
- Each feature runs the pipeline through git-workflow (Stage 5) only
- deployment-workflow is not triggered automatically
- Tell the user: "Feature [name] merged. Run /deployment-workflow when ready to deploy."

### Milestone Completion

After all features in a milestone reach their terminal state (deployed, merged, or ready):
- Confirm milestone completion with the user: "Milestone [X] complete. All features done. Ready to move to Milestone [X+1]?"
- Update milestone status in `tasks/project-plan.md`

**ECC delegation:** If stakeholders need notification of milestone completion, spawn the `chief-of-staff` agent as a subagent with milestone details (features deployed, version, date). It will draft structured communications, triage any pending stakeholder responses, and track follow-up items. Review drafts before sending.

Repeat for each milestone until all milestones are complete.

---

## Pipeline Failure Handling

When a signal comes back that a feature's pipeline is blocked at any stage, handle it here.

**Blocked at spec-workflow (requirements, analysis, spec, implementation)**
- Review the blocker described in the signal
- If scope needs changing: update `tasks/project-plan.md`, re-confirm, re-trigger spec-workflow
- If a dependency feature needs to be fixed first: pause this feature, fix the dependency, then resume

**Blocked at testing-workflow (tests failing)**
- The feature implementation has bugs
- Signal spec-workflow to re-enter Bug Fix Workflow for the specific failures
- After fix, the pipeline resumes from testing-workflow -- not from the beginning

**Blocked at code-review (CHANGES REQUIRED)**
- Review the specific issues returned
- Check the feedback severity in the pipeline state file:
  - Cosmetic feedback: spec-workflow addresses and resumes from code-review
  - Logic feedback: spec-workflow addresses and resumes from testing-workflow
  - Security feedback: spec-workflow addresses and resumes from testing-workflow (full re-run)

**Blocked at security-review (BLOCKED)**
- This is serious -- do not rush it
- Signal spec-workflow to fix the security issues via Bug Fix Workflow
- After fix, pipeline resumes from testing-workflow -- full re-run required after security fixes

**Blocked at documentation-workflow**
- Usually not a code blocker -- documentation issues are addressed directly
- After documentation is fixed, pipeline resumes from git-workflow

**Blocked at git-workflow (CI failure, merge conflict)**
- Assess the failure type
- If CI failure (tests/build): signal spec-workflow for a fix, resume from testing-workflow
- If merge conflict: resolve in git-workflow, then re-run code-review and security-review before merging

**Blocked at deployment-workflow (deployment failed)**
- Deployment-workflow handles rollback autonomously
- After rollback and root cause fix, pipeline resumes from testing-workflow -- full re-run before re-deploying
- Update `tasks/project-plan.md` with what happened and when

**Any blocker that affects other features in the milestone**
- Pause the entire milestone
- Assess impact on all remaining features
- Update `tasks/project-plan.md` with the impact
- Resume only after the blocker is fully resolved

---

## Handling Change Mid-Project

Change is normal. Every scenario below has a defined process. Never ignore a change -- always process it explicitly and update `tasks/project-plan.md` before continuing.

Always log every change in the `## Change Log` section of `tasks/project-plan.md` with:
```
[date/session] -- [what changed] -- [reason] -- [impact on plan]
```

---

### During Planning Phase

**Vision changes after architecture is designed**
- Return to Step 1 and update the vision
- Re-evaluate tech stack -- does it still fit?
- Redo architecture based on updated vision
- Re-evaluate all epics and features -- some may be invalid
- Re-confirm milestone plan
- Do not proceed until all downstream steps are re-confirmed

**User wants to add a feature after milestone plan is done**
- Add the feature to the correct epic in `## Epics and Features`
- Assess dependencies -- does it affect existing features?
- Slot it into the correct milestone based on priority and dependencies
- Re-confirm the milestone plan before continuing
- If it affects architecture, return to Step 3 first

**User wants to remove a feature after milestone plan is done**
- Mark the feature as removed in `## Epics and Features`
- Check if any other features depend on it -- resolve those dependencies
- Update the milestone it belonged to
- Re-confirm the affected milestone before continuing

**Tech stack needs to change after feature breakdown**
- Return to Step 2 and confirm the new stack
- Re-evaluate architecture -- does it still hold with the new stack?
- Flag any features whose implementation approach changes significantly
- Those features will need re-speccing when their turn comes
- Re-confirm everything downstream before continuing

**User wants to merge or split epics**
- Update `## Epics and Features` with the new epic structure
- Re-assign all affected features
- Re-check dependencies
- Re-confirm milestone plan before continuing

**Dependency discovered that changes architecture**
- Return to Step 3 and update architecture
- Re-evaluate affected features
- Re-confirm milestone plan before continuing

---

### During Implementation Phase

**A feature turns out much bigger than estimated**
- Pause the pipeline for that feature
- Re-scope: split into smaller features or defer part to a later milestone
- Update `tasks/project-plan.md`
- Re-confirm the current milestone plan
- Resume with the re-scoped feature from spec-workflow

**A new feature needs to be added urgently**
- Stop current work cleanly -- summarise where the pipeline is
- Add the new feature to `## Epics and Features`
- Assess priority -- current milestone or next?
- If current milestone: re-confirm milestone scope with user
- If later milestone: slot it in and continue current work
- Update `tasks/project-plan.md` before resuming

**An already deployed feature needs to change**
- Assess impact: small adjustment or significant rework?
- If small: trigger spec-workflow Bug Fix Workflow -- run the full pipeline for the fix
- If significant: re-open the spec, update it, re-confirm, run the full pipeline again
- Check if features built after it are affected -- flag and fix those too
- Update `tasks/project-plan.md` and log the change

**Tech stack needs to change mid-build**
- Flag clearly to the user -- this is a major change
- Identify all features already deployed that are affected
- Identify all features not yet started that are affected
- Deployed features: assess whether they need rework -- run full pipeline for each rework
- Unbuilt features: mark specs as invalid -- they will be re-specced when their turn comes
- Update `## Tech Stack` in `tasks/project-plan.md`
- Re-confirm the full remaining plan before continuing

**Two features conflict when integrated**
- Stop integration immediately
- Identify exactly where the conflict is
- Assess which feature needs to change -- or if architecture needs updating
- If architecture change: update Step 3, flag downstream impact on remaining features
- Trigger spec-workflow Bug Fix Workflow for conflict resolution
- Run the full pipeline for the conflict fix before continuing

**An external integration fails or becomes unavailable**
- Assess impact: which features depend on this integration?
- Identify alternative or redesign approach
- If redesign needed: re-open affected feature specs and update them, run full pipeline again
- Update `## Tech Stack` and `## Architecture` if the change is significant

**Milestone needs to be re-scoped**
- List all features in current milestone by status: not started / in progress / deployed
- With user: decide to defer, descope, or keep each undeployed feature
- Deferred features move to next milestone or a backlog section
- Update `## Milestones` in `tasks/project-plan.md`
- Re-confirm updated milestone before continuing

**User wants to skip a feature**
- Mark as deferred in `tasks/project-plan.md`
- Move to next milestone or backlog
- Continue with next feature
- When user returns to it: treat as a new feature, run full pipeline

**A bug is found in a deployed feature during a later feature's pipeline**
- Assess severity: does it block the current feature or not?
- If blocking: pause current pipeline, trigger spec-workflow Bug Fix Workflow, run full pipeline for the fix, then resume current feature
- If not blocking: log in `tasks/todo.md`, fix after current feature is deployed
- Never deploy a feature that depends on a broken deployed feature

---

### General Scenarios

**User goes silent mid-workflow and comes back later**
- When user returns, read `tasks/project-plan.md` and any active `tasks/pipeline-state-*.md` files
- Summarise exactly where the project stands:
  - Which milestone are we in?
  - Which feature is in progress and at which pipeline stage?
  - What is the next action?
- Ask: "Shall we continue from here, or do you want to review the plan first?"
- Never assume context is still fresh -- always re-orient

**User wants to completely restart the project**
- Archive current `tasks/project-plan.md` as `tasks/project-plan-archived-[session].md`
- Start fresh from Step 1
- Carry over lessons to `tasks/lessons.md` from the previous attempt

**User wants to fork the project into two directions**
- Save current plan as `tasks/project-plan-[direction-a].md`
- Create new plan as `tasks/project-plan-[direction-b].md`
- Ask user which direction to pursue first
- Only one direction is active at a time

**Conflicting requirements discovered late**
- Surface the conflict clearly -- do not silently pick one side
- Present the tradeoff to the user
- Get an explicit decision before continuing
- Update the plan and log in Change Log

---

## Rules

- Never skip a planning step
- Never start implementation without a fully confirmed master plan
- Always plan all features before implementing any
- Implementation follows milestone order -- never jump ahead
- Each feature is handed to spec-workflow individually -- never batch them
- project-planning waits for the FULL pipeline signal before marking a feature complete
- A feature is only "deployed" when deployment-workflow signals success -- not when spec-workflow finishes
- A milestone is only complete when ALL features in it reach their terminal state per the deployment strategy
- Every change must be logged in `## Change Log` before work continues
- Never silently absorb a change -- surface it, assess impact, update plan, re-confirm
- All pipeline failures return to project-planning with a clear reason and stage
- Always update `tasks/lessons.md` at the end of each milestone
- Concurrent features are allowed only when there is no code-level dependency between them
- Lightweight concurrency (same conversation): never more than 2 features simultaneously
- Full parallelism (parallel-orchestrator via dmux/worktrees): up to 5 features simultaneously
- Parallelization assessment is automatic at the start of every milestone -- no user prompt needed
- If parallel-orchestrator is triggered, it takes over milestone execution and signals back when complete
- If WSL/tmux is not available, fall back to sequential or lightweight concurrent processing
