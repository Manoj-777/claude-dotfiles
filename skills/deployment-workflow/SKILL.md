---
name: deployment-workflow
description: End-to-end deployment workflow covering pre-deployment verification, staging promotion, production deployment, health checks, rollback testing, and gradual rollout. Use when user says "deploy", "release", "ship", "push to production", "promote to staging", or "go live". Triggered by spec-workflow as Stage 6 of the pipeline after git-workflow completes. Supports per-feature, per-milestone, and manual deployment strategies. Runs lightweight verification gates before deploying. Handles failed deployments, partial deployments, database migration failures, and rollback scenarios.
---

# Deployment Workflow

A gated deployment workflow. The final stage of the pipeline. Runs verification checks before deploying, monitors during deployment, and has a defined rollback plan for every scenario. Nothing goes to production without staging verification.

---

## Pipeline Position

```
spec-workflow > testing-workflow > code-review + security-review > documentation-workflow > git-workflow > [deployment-workflow]
```

Triggered by: spec-workflow (after git-workflow merge completes), project-planning (for per-milestone batch deployments)
Signals back to: spec-workflow (and project-planning)

---

## ECC Agent Delegation

This skill delegates to ECC agents at specific points for operational support. Delegation is optional and enhances -- never replaces -- the deployment gates.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 4-5 (Deploy + Monitor) | `loop-operator` | Safe autonomous monitoring loop with stall detection, checkpoint tracking, and escalation | During post-deployment monitoring (Step 5) to track health checks over the monitoring window |
| Step 6 (Close Out) | `chief-of-staff` | Draft deployment notifications to stakeholders, triage pending responses | When stakeholders need pre/post-deployment notifications |

Agents NOT used here (and why):
- `build-error-resolver`: Build failures are handled in git-workflow (Stage 5), not during deployment
- `harness-optimizer`: Harness tuning is a project-setup concern in project-planning, not per-deployment

Supplementary ECC Skills (reference as needed):
- `docker-patterns`: Container security, multi-stage builds, compose patterns for Docker-based deployments
- `deployment-patterns`: CI/CD pipeline patterns, health checks, rollback strategies
- `database-migrations`: Migration rollback strategies, backward compatibility checks for database changes
- `verification-loop`: Structured verification for post-deployment health checks

---

## Pipeline State

On start: read `tasks/pipeline-state-[feature-name].md` to understand change size, deployment strategy, and upstream stage results.
On complete: update the state file with deployment result and timestamp.

For per-milestone deployments: read ALL pipeline state files for features in the milestone.

---

## How to Start

Detect context:
- Triggered from spec-workflow after git merge > deploy this feature/release
- Triggered from project-planning for milestone deployment > deploy all features in the milestone
- Triggered for a hotfix > expedited path (all gates still apply)
- Standalone > ask what is being deployed and to which environment

Gather context before starting:
- What is being deployed? (feature name, release version, or milestone)
- Target environment? (staging > production, or hotfix direct to production)
- Deployment strategy? (per-feature, per-milestone, manual -- from project plan or pipeline state)
- Load project CLAUDE.md for deployment config and environment details
- What is the current version in production? (needed for rollback reference)
- Is there a rollback plan? Define one before proceeding if not

---

## Pre-Deployment Verification Gates

These are lightweight verification checks -- not full re-runs of the pipeline skills. The pipeline already ran testing, code-review, security-review, and documentation. These gates verify nothing was missed or changed since then.

### Gate 1: Test Suite Verification
- Confirm the test suite passed on the branch being deployed (check pipeline state file)
- If tests have not been run since the last code change: trigger testing-workflow in verification mode
- Signal from testing-workflow: "Deployment test gate passed" > proceed
- If failed: stop deployment, signal spec-workflow to fix, restart full pipeline from Stage 1

### Gate 2: Code and Security Review Confirmation
- Confirm code-review APPROVED signal is on record for all changes in this release (check pipeline state files)
- Confirm security-review APPROVED signal is on record
- If any change was not reviewed: trigger the respective review skill, wait for APPROVED
- If CHANGES REQUIRED or BLOCKED: stop deployment, signal spec-workflow, restart full pipeline from Stage 1
- Do not proceed to deploy if either review is missing or failed

### Gate 3: Documentation Confirmation
- Confirm documentation-workflow completed for all features in this release (check pipeline state files)
- Confirm CHANGELOG has an entry for this release (if user-visible changes)
- If documentation is incomplete: trigger documentation-workflow, wait for completion
- Then proceed

### Gate 4: Deployment Plan
- What exactly is being deployed? (feature list or release version)
- Deployment method? (CI/CD pipeline, manual, blue-green, canary)
- Rollback plan: what is the previous stable version? How is rollback executed?
- Database migrations? (if yes -- are they backward compatible? tested on staging?)
- Maintenance window required? (downtime expected?)
- Stakeholders to notify before and after?

Present plan. Ask: "Deployment plan confirmed. Shall we proceed to staging?"

All four gates must pass. Never skip a gate regardless of timeline pressure.

---

## Step 1: Rollback Verification

Before deploying forward, verify the rollback plan works:
- Confirm the previous stable version is identified and its artifact/image is available
- If database migrations are included: confirm they are backward compatible (rollback-safe)
- If migrations are NOT backward compatible: document the fix-forward strategy explicitly
- For first deployment of a new service: confirm the "rollback" is to remove/disable the service cleanly

This step ensures rollback is not just a plan on paper but a verified capability.

---

## Step 2: Deployment Strategy Execution

### Per-Feature Deployment
Deploy the single feature that just completed the pipeline.

### Per-Milestone Deployment
Deploy all features in the milestone as a batch:
- Verify ALL features in the milestone have been individually merged to main via git-workflow (check all pipeline state files for "git-workflow: merged")
- project-planning is responsible for orchestrating individual feature merges before triggering deployment-workflow
- If any feature is not yet merged: do not deploy -- signal project-planning with the incomplete feature
- Deploy the current state of main (which now contains all merged features) as a single deployment unit

### Gradual Rollout (optional, for high-risk features)

If the feature is high-risk or affects a large user base, consider gradual rollout:

```
Canary: deploy to a small percentage of traffic first (5-10%)
  - Monitor error rates and latency for 15-30 minutes
  - If stable: expand to 50%, then 100%
  - If issues: rollback canary immediately

Feature flag: deploy the code but gate the feature behind a flag
  - Enable for internal users first
  - Expand to a percentage of users
  - If stable: enable for all users
  - If issues: disable the flag (no rollback needed)

Blue-green: deploy to inactive environment, switch traffic
  - Verify inactive environment is healthy
  - Switch traffic
  - Keep old environment running for quick rollback
```

Not all deployments need gradual rollout. Use it when:
- The change affects authentication or authorisation
- The change modifies data formats or database schemas
- The change affects a large user base
- The team has low confidence in the change

---

## Step 3: Deploy to Staging

Deploy to staging first -- never deploy to production first for non-hotfixes:
- Trigger staging deployment pipeline
- Monitor deployment logs in real time
- Confirm deployment completes without errors
- Run smoke tests: verify critical paths work end to end
- Verify database migrations ran cleanly if applicable
- Verify all integrations are functioning
- Confirm environment variables are set correctly in staging

If staging deployment fails > Failure Handling: Staging Deployment Fails.

Ask: "Staging verified. Shall we promote to production?"

---

## Step 4: Deploy to Production

After staging is verified:
- Notify stakeholders if required
- Trigger production deployment pipeline (using chosen strategy: direct, canary, blue-green, or feature flag)
- Monitor deployment logs in real time -- do not walk away during deployment

If production deployment fails > Failure Handling: Production Deployment Fails.

---

## Step 5: Post-Deployment Verification

**ECC delegation:** Spawn the `loop-operator` agent as a subagent to manage the post-deployment monitoring window. It will track health check checkpoints (error rates, response times, integrations), detect stalls or anomalies, and escalate if metrics degrade across consecutive checks. It ensures the monitoring loop runs for the full window without being cut short.

After production deployment completes:
- Run smoke tests in production -- verify critical paths work
- Check error rates -- normal or elevated?
- Check response times -- normal or degraded?
- Check database -- migrations ran cleanly?
- Check integrations -- all external services responding?
- Check logs for unexpected errors or warnings
- Monitor for at least 10 minutes before declaring success

If anything is wrong > Failure Handling: Post-Deployment Issues.

Ask: "Post-deployment verification complete. Shall I close out?"

---

## Step 6: Close Out

**ECC delegation:** If stakeholders need pre/post-deployment notifications, spawn the `chief-of-staff` agent as a subagent with deployment details (feature name, version, environment, verification status). It will draft structured deployment notifications, triage any pending stakeholder responses, and track follow-up items. Review drafts before sending.

After successful verification:
- Update `tasks/project-plan.md` with deployment date and version (if exists)
- Update `tasks/todo.md` -- mark deployment tasks complete
- Update `tasks/pipeline-state-[feature-name].md`: "deployment-workflow: deployed [timestamp], version: [X]"
- Update `tasks/lessons.md` with deployment observations
- Notify stakeholders of successful deployment
- Tag the release in git if project uses version tags: `git tag v[version]`

Signal to spec-workflow: "Deployment complete for [feature]. Production verified. Pipeline Stage 6 passed. Feature fully deployed."
spec-workflow will then signal project-planning: "Feature [name] fully deployed. Returning to project-planning."

For per-milestone deployment: signal project-planning directly: "Milestone [X] deployed. All features verified in production."

---

## Failure Handling

**A pre-deployment gate fails**
- Stop immediately -- do not skip to the next gate
- Fix the issues that caused the gate to fail
- Re-run the failed gate
- Only proceed when the gate passes cleanly
- Never skip a gate for timeline reasons -- a broken production deployment costs more than a delay

**Staging deployment fails**
- Read deployment logs -- identify the exact failure point
- Common causes: missing env variable, migration error, build failure, resource limit
- Fix the root cause -- do not retry without a fix
- If migration error:
  - Check if migration partially ran -- if yes, rollback migration before retrying
  - Fix the migration script
  - Test migration on local staging data before retrying
- After fix: redeploy to staging, verify fully, then proceed to production

**Production deployment fails mid-way**
- Assess state: how much completed before failure?
- If app still serving traffic from previous version: rollback cleanly
- If app is in broken state: execute rollback immediately
- Rollback steps:
  1. Revert to previous deployment version via pipeline or manually
  2. If database migrations ran: check backward compatibility before rolling back app
  3. Verify rollback is stable
  4. Notify stakeholders
  5. Log failure fully in `tasks/lessons.md`
- After rollback: signal spec-workflow -- "Deployment failed for [feature]. Rolled back. Reason: [X]. Returning to spec-workflow for investigation."
- spec-workflow will fix and restart from Stage 1

**Database migration failure in production**
- Most dangerous failure -- do not rush
- If migration ran partially and is not backward compatible: fix forward (corrective migration) -- do not roll back app
- If migration did not run at all or is fully backward compatible: rollback app is safe
- Never manually edit production data without a tested script
- Get explicit user confirmation before any database operation in this state
- Conduct full post-mortem after resolution

**Post-deployment: error rates spike**
- Do not wait -- rollback immediately if error rate is significantly elevated
- A deployed feature that breaks users is a failed deployment regardless of pipeline success
- After rollback: investigate errors in staging with same code
- Fix root cause before re-deploying

**Post-deployment: integration breaks**
- Identify which integration is broken
- Configuration issue (wrong endpoint, expired token): fix env var or config, redeploy config if possible without full rollback
- Code issue: rollback the deployment, fix the code, run full pipeline before re-deploying
- Notify the integration owner if it is an external service issue

**Staging passes but production fails**
- Means staging and production differ in a meaningful way
- Identify the difference: env vars, data volume, network config, permissions, infrastructure
- Fix the environment drift -- do not accept it as normal
- Document the difference and resolution in `tasks/lessons.md`
- Re-deploy after environments are aligned

**Hotfix needed urgently**
- Hotfix bypasses the staging-first rule but does NOT bypass gates
- All four pre-deployment gates still apply -- run them as fast as possible
- Deploy directly to production after gates pass
- Never skip testing or security review even under time pressure
- After hotfix is stable: backport to staging and development branches

**Rollback fails**
- Critical incident -- escalate to user immediately
- Manually identify last known good deployment artifact
- Deploy manually if pipeline cannot be used
- Stability first -- investigation comes after the app is serving correctly
- After stability is restored: investigate both the original failure and the rollback failure
- Full post-mortem required

**Deployment window missed or stakeholders unavailable**
- Do not deploy without required sign-offs or outside defined window
- Reschedule
- Keep staging ready -- do not let staging and production drift more than 24 hours

**Canary deployment shows issues**
- Immediately route all traffic back to the stable version
- Do not expand the canary
- Investigate the issue using canary logs and metrics
- Fix and re-deploy through the full pipeline

**Feature flag shows issues after enabling**
- Disable the feature flag immediately
- The code stays deployed -- only the feature is toggled off
- Investigate and fix the feature code
- Re-enable after fix is verified in staging

---

## Rules

- Never deploy to production without passing all four pre-deployment gates
- Never deploy directly to production without staging verification (hotfixes still pass all gates)
- Always verify rollback capability before deploying forward
- Always have a rollback plan defined before deploying
- Always monitor production during and after deployment -- minimum 10 minutes
- Database migrations must be backward compatible unless a full maintenance window is planned
- When in doubt: rollback first, investigate second
- Never skip a gate under timeline pressure
- Consider gradual rollout (canary, feature flag, blue-green) for high-risk changes
- All deployment outcomes logged in `tasks/project-plan.md`, `tasks/pipeline-state-[feature-name].md`, and `tasks/lessons.md`
- Always signal back to spec-workflow explicitly -- complete or failed with reason
- spec-workflow signals project-planning after receiving the deployment complete signal
- For per-milestone deployments: all features must have completed through git-workflow before deployment begins
