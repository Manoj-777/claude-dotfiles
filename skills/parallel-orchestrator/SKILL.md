---
name: parallel-orchestrator
description: Multi-agent parallel orchestration using dmux and git worktrees. Use when user says "run in parallel", "parallelize", "split work", "multi-agent", "dmux", "speed up the build", or "run features concurrently". Reads the project plan or feature list, identifies safe parallelization opportunities, spawns dmux panes with isolated git worktrees, monitors progress via pipeline state files, and merges results. Works with any project and any tech stack. Never parallelizes features that share files or have code dependencies.
---

# Parallel Orchestrator

A project-agnostic multi-agent orchestration skill that uses dmux (tmux pane manager) and git worktrees to run multiple features through the pipeline simultaneously. Each feature gets its own Claude Code instance in an isolated worktree. The orchestrator monitors progress and merges results.

---

## Prerequisites

Before using this skill, verify these tools are available:

```bash
# Required
tmux --version          # tmux must be installed
git --version           # git must be installed
claude --version        # Claude Code must be installed

# Required for dmux
dmux --version          # npm install -g dmux
# OR use manual tmux if dmux is not installed

# Optional but recommended
git worktree list       # git worktree support (built into git 2.5+)
```

If running on Windows: use WSL. tmux does not run natively on Windows.

If dmux is not installed: this skill falls back to manual tmux commands. dmux is a convenience wrapper, not a hard dependency.

---

## Relationship to Other Skills

```
project-planning
      ↓
parallel-orchestrator (splits features into parallel panes)
      ↓                    ↓                    ↓
   Pane 1               Pane 2               Pane 3
   spec-workflow         spec-workflow         spec-workflow
   testing              testing              testing
   review               review               review
   docs                 docs                 docs
   git-workflow         git-workflow         git-workflow
      ↓                    ↓                    ↓
parallel-orchestrator (merges branches, runs integration)
      ↓
deployment-workflow (deploys the merged result)
```

parallel-orchestrator does NOT replace any pipeline skill. Each pane runs the exact same pipeline. This skill only handles:
- Splitting work into parallel tracks
- Creating isolated environments (git worktrees)
- Spawning and monitoring panes
- Merging results and resolving conflicts
- Running integration verification after merge

---

## How to Start

Detect context:
- Triggered from project-planning after master plan is confirmed > parallelize milestone features
- Standalone with a feature list > parallelize the listed features
- User says "speed this up" or "run in parallel" > assess what can be parallelized

Before starting:
- Load project CLAUDE.md for tech stack and architecture
- Load `tasks/project-plan.md` if it exists (for feature list and dependencies)
- Verify prerequisites are installed
- Verify the current branch is clean (`git status` shows no uncommitted changes)

---

## Step 1: Parallelization Analysis

Identify which features can safely run in parallel.

### 1a: Gather Feature List

From project plan or user input, list all features to be built:
```
Feature A: [name] — [files/components involved]
Feature B: [name] — [files/components involved]
Feature C: [name] — [files/components involved]
```

### 1b: Dependency Analysis

For each pair of features, check:
- Do they modify the same files? → CANNOT parallelize
- Does one depend on the other's output? → CANNOT parallelize
- Do they touch the same database tables with schema changes? → CANNOT parallelize
- Do they modify shared configuration? → CAREFUL — may conflict
- Are they in completely different areas of the codebase? → SAFE to parallelize

Build a dependency graph:
```
Feature A (backend API) ──→ no dependency ──→ Feature B (frontend UI)
Feature C (auth service) ──→ depends on ──→ Feature A (needs API endpoints)
Feature D (notifications) ──→ no dependency ──→ Feature A, B, C
```

### 1c: Group Into Parallel Tracks

Group features into tracks that can run simultaneously:
```
Track 1: Feature A (backend API) + Feature B (frontend UI) + Feature D (notifications)
  → These share no files and have no code dependencies
  → Can all run in parallel

Track 2: Feature C (auth service)
  → Depends on Feature A — must wait until Feature A is merged
  → Runs after Track 1 completes
```

### 1d: Pane Limit

Never exceed these limits:
```
Maximum parallel panes: 5
  → Each pane is a full Claude Code session consuming API tokens
  → More than 5 panes = diminishing returns + high cost + hard to monitor

Recommended: 2-3 panes for most projects
  → Sweet spot of speed vs cost vs complexity

Minimum for parallelization: 2
  → If only 1 feature can run independently, don't use this skill — run it normally
```

Present the parallelization plan. Ask: "Here are the parallel tracks. [X] features in parallel, [Y] sequential after. Does this look right?"

---

## Step 2: Environment Setup

### 2a: Create Git Worktrees

Each parallel pane gets its own git worktree — a separate working directory with its own branch, sharing the same git history.

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create a worktree for each parallel feature
git worktree add -b feature/[feature-a-name] ../worktree-feature-a HEAD
git worktree add -b feature/[feature-b-name] ../worktree-feature-b HEAD
git worktree add -b feature/[feature-d-name] ../worktree-feature-d HEAD
```

Why worktrees instead of branches:
- Each pane edits files independently — no file conflicts during development
- Each pane has its own working directory — no `git stash` juggling
- All worktrees share the same `.git` — efficient disk usage
- Merging is just `git merge` at the end

### 2b: Verify Worktrees

```bash
git worktree list
# Should show:
# /path/to/project         main
# /path/to/worktree-feature-a  feature/feature-a-name
# /path/to/worktree-feature-b  feature/feature-b-name
# /path/to/worktree-feature-d  feature/feature-d-name
```

### 2c: Prepare Task Files

For each pane, create a task file that gives the Claude Code instance full context:

```bash
# For each worktree, create a task prompt file
# IMPORTANT: Include project CLAUDE.md content so each pane has full project context
cat > ../worktree-feature-a/.claude-task.md << 'EOF'
# Task: [Feature A Name]

## Context
- Project: [project name]
- Tech stack: [from CLAUDE.md]
- This is one of [N] features being built in parallel
- Work ONLY in this worktree — do not modify files outside this directory

## Project Configuration
[Paste the full content of the project's CLAUDE.md here — each pane is a fresh Claude Code
instance and needs project context, coding standards, architecture, and conventions.
If the project has a tasks/project-plan.md, include the relevant section for this feature.]

## Feature Description
[from project plan]

## Files in Scope
[list of files this feature should touch]

## Files NOT in Scope (being modified by other parallel features)
[list of files other panes are working on — DO NOT TOUCH]

## Instructions
Run /spec-workflow to implement this feature through the full pipeline.
When git-workflow is reached, commit to the current branch (already checked out).
Do NOT merge to main — the orchestrator will handle merging.
When complete, create a file: .claude-task-complete with a summary of what was built.
EOF
```

---

## Step 3: Spawn Panes

### 3a: Using dmux

```bash
# Start dmux session
dmux

# Press 'n' for each pane, enter the prompt:
# Pane 1: "cd ../worktree-feature-a && cat .claude-task.md && claude"
# Pane 2: "cd ../worktree-feature-b && cat .claude-task.md && claude"
# Pane 3: "cd ../worktree-feature-d && cat .claude-task.md && claude"
```

### 3b: Using Manual tmux (if dmux not installed)

```bash
# Create tmux session
tmux new-session -d -s parallel-build

# Create panes
tmux send-keys -t parallel-build "cd ../worktree-feature-a && claude" Enter
tmux split-window -h -t parallel-build
tmux send-keys -t parallel-build "cd ../worktree-feature-b && claude" Enter
tmux split-window -v -t parallel-build
tmux send-keys -t parallel-build "cd ../worktree-feature-d && claude" Enter

# Attach to monitor
tmux attach -t parallel-build
```

### 3c: Using the ECC Worktree Orchestrator (if available)

```bash
# Create plan.json
cat > parallel-plan.json << 'EOF'
{
  "sessionName": "parallel-build",
  "baseRef": "HEAD",
  "launcherCommand": "claude --task-file {task_file}",
  "workers": [
    { "name": "feature-a", "task": "Run /spec-workflow for Feature A. Full pipeline through git-workflow. Do not merge to main." },
    { "name": "feature-b", "task": "Run /spec-workflow for Feature B. Full pipeline through git-workflow. Do not merge to main." },
    { "name": "feature-d", "task": "Run /spec-workflow for Feature D. Full pipeline through git-workflow. Do not merge to main." }
  ]
}
EOF

# Execute
node scripts/orchestrate-worktrees.js parallel-plan.json --execute
```

---

## Step 4: Monitor Progress

While panes are running:

### 4a: Check Pipeline State Files

Each pane creates its own pipeline state file in its worktree:
```bash
# Check progress of each feature
cat ../worktree-feature-a/tasks/pipeline-state-feature-a.md 2>/dev/null || echo "Not started yet"
cat ../worktree-feature-b/tasks/pipeline-state-feature-b.md 2>/dev/null || echo "Not started yet"
cat ../worktree-feature-d/tasks/pipeline-state-feature-d.md 2>/dev/null || echo "Not started yet"
```

### 4b: Check Completion

```bash
# Check if each pane has completed
ls ../worktree-feature-a/.claude-task-complete 2>/dev/null && echo "Feature A: DONE" || echo "Feature A: IN PROGRESS"
ls ../worktree-feature-b/.claude-task-complete 2>/dev/null && echo "Feature B: DONE" || echo "Feature B: IN PROGRESS"
ls ../worktree-feature-d/.claude-task-complete 2>/dev/null && echo "Feature D: DONE" || echo "Feature D: IN PROGRESS"
```

### 4c: Monitor for Problems

Check every 10-15 minutes:
- Is any pane stuck? (no progress in pipeline state file)
- Is any pane in a failure loop? (repeated failures at the same stage)
- Has any pane touched files it should not have? (`git diff --name-only` in each worktree)
- Is any pane running out of context? (very long conversation)

If a pane is stuck:
- Switch to that pane (`tmux select-pane` or click in dmux)
- Read the current state
- Intervene: provide guidance, restart the pipeline stage, or kill and restart the pane

### 4d: Progress Dashboard

Maintain a simple progress file in the main project:
```
## Parallel Build Progress — [Date]

| Feature | Pane | Branch | Stage | Status |
|---------|------|--------|-------|--------|
| Feature A | 1 | feature/feature-a | code-review | in progress |
| Feature B | 2 | feature/feature-b | testing | in progress |
| Feature D | 3 | feature/feature-d | git-workflow | completing |
```

Update this as you monitor.

---

## Step 5: Merge Results

After all panes in a parallel track complete:

### 5a: Verify Each Branch

Before merging, verify each feature branch is clean:
```bash
# For each completed worktree:
cd ../worktree-feature-a
git status                    # Should be clean
git log main..HEAD --oneline  # Review commits
cat tasks/pipeline-state-*.md # Confirm pipeline completed

cd ../worktree-feature-b
# Same checks...
```

### 5b: Merge Into Main

Return to the main project directory and merge each branch:
```bash
cd /path/to/main/project
git checkout main
git pull origin main

# Merge each feature branch
git merge feature/feature-a-name --no-ff -m "feat: merge Feature A"
# If conflict → go to Conflict Resolution below

git merge feature/feature-b-name --no-ff -m "feat: merge Feature B"
# If conflict → go to Conflict Resolution below

git merge feature/feature-d-name --no-ff -m "feat: merge Feature D"
# If conflict → go to Conflict Resolution below
```

Use `--no-ff` to preserve feature branch history in the merge.

### 5c: Conflict Resolution

If a merge conflict occurs:
- Identify the conflicting files
- Determine which feature's changes should take precedence (or combine both)
- Resolve manually — understand both sides before choosing
- After resolution: run the full test suite to verify nothing is broken
- If the conflict is non-trivial: run code-review on the conflict resolution

### 5d: Clean Up Worktrees

After all merges are complete:
```bash
git worktree remove ../worktree-feature-a
git worktree remove ../worktree-feature-b
git worktree remove ../worktree-feature-d

# Delete feature branches (already merged)
git branch -d feature/feature-a-name
git branch -d feature/feature-b-name
git branch -d feature/feature-d-name
```

---

## Step 6: Integration Verification

After merging all parallel features, verify they work together:

### 6a: Run Full Test Suite
```bash
# Run all tests — not just individual feature tests
# This catches integration issues between features
python -m pytest tests/           # or project-specific test command
```

### 6b: Integration Smoke Test

If the features interact (e.g., backend API + frontend that calls it):
- Start the full application
- Test the end-to-end flow that spans multiple features
- Verify no feature broke another's functionality

### 6c: Handle Integration Failures

If tests fail after merge:
- Identify which feature combination causes the failure
- If Feature A + Feature B conflict: fix the integration issue on main
- Run the fix through testing-workflow and code-review before proceeding
- Do NOT deploy until integration tests pass

---

## Step 7: Continue Pipeline

After integration verification passes:

### 7a: If Deployment Strategy Is Per-Milestone
- All features in the milestone are now merged
- Trigger deployment-workflow for the milestone
- deployment-workflow deploys everything together

### 7b: If Deployment Strategy Is Per-Feature
- Each feature was already deployed from its pane (git-workflow + deployment-workflow ran in the pane)
- Integration verification is a post-deploy check
- If integration issues found: trigger incident-response

### 7c: If There Are More Tracks
- If Track 2 depends on Track 1 (e.g., Feature C depends on Feature A):
  - Track 1 is now merged
  - Start Track 2: create worktree, spawn pane, run pipeline
  - Repeat from Step 2 for Track 2

### 7d: Update Project Plan
- Update `tasks/project-plan.md` with completion status for all parallel features
- Update `tasks/lessons.md` with parallelization observations
- Note which features parallelized well and which caused merge conflicts

---

## Failure Handling

**Prerequisites not installed**
- tmux not found: Install via package manager (`apt install tmux`, `brew install tmux`)
- dmux not found: Install via npm (`npm install -g dmux`), or fall back to manual tmux
- WSL not available on Windows: This skill requires WSL on Windows — cannot proceed without it
- git worktree not supported: Requires git 2.5+ — upgrade git

**Pane crashes or runs out of context**
- Check the pane's pipeline state file for last known stage
- Start a new Claude Code session in the same worktree
- The pipeline state file allows resuming from the last completed stage
- Do not restart from scratch — read the state and continue

**Pane modifies files it should not have**
- Check `git diff --name-only` against the expected file scope
- If it touched shared files: its changes may conflict with other panes
- Revert the out-of-scope changes: `git checkout -- [files]`
- Restart the pane with clearer scope instructions in the task file

**Merge conflict between parallel features**
- This means the parallelization analysis missed a shared file
- Resolve the conflict manually, understanding both features' intent
- After resolution: run full test suite
- Log the shared file in `tasks/lessons.md` so future parallelization avoids it
- Run code-review on the conflict resolution

**Integration tests fail after merge**
- Identify the failing test and which features it spans
- If the issue is a missing integration point: write the integration code on main
- If the issue is a logic conflict: decide which feature's approach wins, fix the other
- Run the fix through testing-workflow before proceeding
- Do NOT deploy with failing integration tests

**One pane finishes much faster than others**
- This is normal — features vary in complexity
- The fast pane's branch is ready to merge
- You can merge it early or wait for all panes to complete
- If merging early: later panes should rebase on the updated main to detect conflicts sooner

**A feature turns out to be larger than expected and blocks its pane**
- Let the pane continue at its own pace — do not kill it
- If it's blocking the milestone: split the feature into smaller parts in the pane
- Other panes are not affected — they work independently

**Token cost is too high with many panes**
- Reduce to 2 panes instead of 3-5
- Prioritize the longest/most complex features for parallelization
- Run simpler features sequentially after the parallel panes complete

**Git worktree creation fails**
- Ensure the main branch is clean: `git stash` uncommitted changes
- Ensure no existing worktree uses the same branch name
- Check disk space — each worktree is a full copy of the working directory
- If worktrees are not practical: use separate branches in the same directory (less ideal, more conflict-prone)

**dmux session disconnects**
- tmux sessions persist in the background after disconnect
- Reattach: `tmux attach -t parallel-build`
- All panes continue running even when disconnected
- This is a feature of tmux — your work is not lost

**Two features discover they need the same new shared component**
- Stop both panes
- Build the shared component first in a dedicated pane
- Merge the shared component to main
- Restart both panes with the updated main (rebase their branches)
- Log this as a dependency that was missed in analysis

**Network failure during parallel build**
- Each pane's work is local in its git worktree — nothing is lost
- Reconnect and reattach: `tmux attach -t parallel-build`
- Each pane resumes from where it was (or can be resumed via pipeline state file)

---

## Rules

- Never parallelize features that modify the same files
- Never parallelize features with code dependencies — build dependencies first
- Maximum 5 parallel panes — more is wasteful and hard to monitor
- Each pane gets its own git worktree — never share a working directory
- Always run integration tests after merging parallel branches
- Always resolve merge conflicts manually — never auto-accept either side
- Always clean up worktrees after merging
- Monitor panes every 10-15 minutes — do not fire and forget
- If a pane is stuck, intervene — do not let it loop
- Token cost scales linearly with panes — be cost-conscious
- Log parallelization successes and failures in `tasks/lessons.md`
- The pipeline skills in each pane are unchanged — this skill only orchestrates
- Do not deploy until integration verification passes
- If worktrees are not available, fall back to branches — but expect more conflicts
