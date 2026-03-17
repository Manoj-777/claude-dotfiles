---
name: incident-response
description: Rapid incident response workflow for production issues. Use when user says "production is down", "outage", "incident", "alert firing", "users reporting errors", "something broke in production", "emergency fix", "P1", or "site is slow". Faster and more focused than routing through spec-workflow bug fix. Still gated but expedited. Covers triage, mitigation, diagnosis, hotfix, verification, post-mortem, and follow-up. Never skips verification even under time pressure.
---

# Incident Response Workflow

A rapid response workflow for production issues. Faster than the standard bug-fix pipeline but still gated -- no fix goes to production without verification. Designed for "production is broken right now" scenarios, not for planned bug fixes (those go through spec-workflow Bug Fix Workflow).

---

## Relationship to Feature Pipeline

```
Feature pipeline (planned work):
  spec-workflow Bug Fix > testing > review > docs > git > deploy

Incident response (unplanned, urgent):
  incident-response > triage > mitigate > diagnose > hotfix > verify > post-mortem
```

incident-response is NOT a pipeline stage. It is an independent workflow triggered by production issues. It can:
- Trigger deployment-workflow for rollback
- Trigger spec-workflow Bug Fix Workflow for complex fixes that need a proper spec
- Trigger security-review if the incident is security-related
- Signal project-planning if the incident affects active feature work

When to use incident-response vs spec-workflow Bug Fix:
```
incident-response:
  - Production is broken NOW
  - Users are affected NOW
  - Error rates are elevated NOW
  - A security breach is happening NOW

spec-workflow Bug Fix:
  - A bug was found during development
  - A bug was reported but production is stable
  - A non-urgent issue needs a planned fix
```

---

## ECC Agent Delegation

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 3 (Diagnosis) | `python-reviewer` | Run diagnostic commands (mypy, ruff, bandit) on suspected code to find the root cause faster | Python projects when the issue is in application code |
| Step 3 (Diagnosis) | `loop-operator` | Monitor production metrics during diagnosis to detect if the situation is worsening | Always -- prevents tunnel vision during diagnosis |
| Step 4 (Hotfix) | `security-reviewer` | Full security audit of the hotfix if the incident is security-related | Security incidents only |

Supplementary ECC Skills (reference as needed):
- `python-patterns`: Check if the root cause is a known anti-pattern
- `python-testing`: Write targeted regression tests for the incident
- `backend-patterns`: Evaluate if the fix aligns with backend best practices
- `verification-loop`: Structured verification of the hotfix before deploying

---

## Severity Classification

Every incident is classified immediately. This determines response speed and escalation path.

```
P1 -- Critical (production down, all users affected):
  Response time: Immediate -- drop everything
  Mitigation target: < 15 minutes
  Resolution target: < 4 hours
  Escalation: All stakeholders notified immediately
  Examples: site unreachable, data corruption, security breach, all API errors

P2 -- High (production degraded, many users affected):
  Response time: Within 15 minutes
  Mitigation target: < 30 minutes
  Resolution target: < 8 hours
  Escalation: Engineering lead and affected stakeholders
  Examples: major feature broken, response times 5x normal, intermittent errors > 10%

P3 -- Medium (production impaired, some users affected):
  Response time: Within 1 hour
  Mitigation target: < 2 hours
  Resolution target: < 24 hours
  Escalation: Engineering team
  Examples: minor feature broken, specific user segment affected, error rate elevated but < 5%

P4 -- Low (production issue, minimal user impact):
  Response time: Within 4 hours
  Mitigation target: Not required
  Resolution target: < 1 week
  Escalation: None -- track and fix in normal cycle
  Examples: cosmetic issue, edge case error, performance slightly degraded for rare operations
```

P4 incidents do NOT use this workflow -- route them through spec-workflow Bug Fix Workflow instead.

---

## How to Start

When triggered:
1. **Stop all non-critical work.** If a feature pipeline is in progress, pause it. Note the pause in the pipeline state file.
2. **Gather initial information immediately:**
   - What is the symptom? (error messages, behavior, metrics)
   - When did it start? (timestamp, correlation with recent deployments or changes)
   - Who is affected? (all users, specific segment, internal only)
   - What is the current impact? (complete outage, degraded, intermittent)
3. **Classify severity** using the table above.
4. **Create incident file:** `tasks/incident-[date]-[short-description].md`

Incident file format:
```
## Incident: [Short Description]

Severity: P[1-4]
Status: ACTIVE / MITIGATED / RESOLVED / POST-MORTEM COMPLETE
Started: [timestamp]
Detected: [timestamp]
Mitigated: [timestamp]
Resolved: [timestamp]

### Timeline
- [timestamp] Incident detected: [how]
- [timestamp] Severity classified: P[X]
- [timestamp] Mitigation applied: [what]
- [timestamp] Root cause identified: [what]
- [timestamp] Hotfix deployed: [what]
- [timestamp] Incident resolved: [verification]

### Impact
- Users affected: [count or segment]
- Duration: [time]
- Data impact: [none / read-only / data loss -- quantify if applicable]

### Root Cause
[filled in Step 3]

### Fix Applied
[filled in Step 4]

### Post-Mortem
[filled in Step 6]
```

---

## Step 1: Triage

Confirm the incident is real and classify correctly:
- Check monitoring dashboards, error logs, and metrics
- Confirm the issue is not a monitoring false positive
- Confirm the scope -- is it a single service, multiple services, or full outage?
- Check if a deployment happened recently -- correlation does not equal causation, but it is the most common cause

If the incident is a false positive (monitoring issue, not a real outage):
- Document in the incident file: "False positive -- [reason]"
- Fix the monitoring issue so it does not trigger again
- Close the incident

If the incident is real: proceed to Step 2.

Update the incident file timeline with triage findings.

---

## Step 2: Immediate Mitigation

The goal is to REDUCE USER IMPACT first. Root cause investigation comes AFTER mitigation.

Mitigation options (in order of preference):

### 2a: Rollback
If a recent deployment likely caused the issue:
- Check deployment history -- what was the last deployment and when?
- If the incident started after a deployment: rollback is the fastest mitigation
- Execute rollback via deployment-workflow rollback procedure
- Verify the rollback restored service

### 2b: Feature Flag
If the issue is isolated to a specific feature:
- Disable the feature flag for the broken feature
- Verify the rest of the application is functioning
- This buys time for a proper fix without full rollback

### 2c: Scale Up / Restart
If the issue is resource exhaustion or process crash:
- Restart the affected service(s)
- Scale up if the issue is load-related
- This is a temporary fix -- the root cause still needs investigation

### 2d: Traffic Diversion
If the issue is in a specific region, service, or integration:
- Route traffic away from the broken component
- Enable maintenance mode if necessary
- Redirect to a fallback or degraded experience

### 2e: No Immediate Mitigation Possible
If none of the above apply:
- Communicate to users: acknowledge the issue, provide estimated timeline
- Continue directly to Step 3 (Diagnosis) with urgency

After mitigation:
- Confirm user impact is reduced (check error rates, user reports)
- Update the incident file: status to MITIGATED, note what was done
- Update timeline

Do NOT stop here -- mitigation is not resolution. Proceed to Step 3.

---

## Step 3: Diagnosis

**ECC delegation:** Spawn the `loop-operator` agent as a subagent to monitor production metrics during diagnosis. It will track error rates, response times, and resource usage, and alert if the situation worsens while you are investigating. This prevents tunnel vision.

Find the root cause. Do not guess -- find evidence.

### 3a: Recent Changes
- Check git log since last known good state
- Check deployment history
- Check configuration changes
- Check infrastructure changes (scaling events, certificate renewals, DNS changes)
- Check external dependency status (third-party API outages)

### 3b: Logs and Metrics
- Read application error logs for the incident timeframe
- Check for stack traces, error patterns, or new error types
- Check resource metrics (CPU, memory, disk, network)
- Check database metrics (connection count, query times, deadlocks)
- Check external API response times and error rates

### 3c: Reproduction (if safe)
- Can the issue be reproduced in staging?
- If yes: use staging for diagnosis to avoid further production impact
- If no (production-only issue): investigate production carefully, read-only operations only
- Never run experimental changes in production during an active incident

### 3d: Root Cause Identification

**ECC delegation:** For Python projects, spawn the `python-reviewer` agent as a subagent with the suspected code files. It will run diagnostic commands and identify code-level issues faster than manual inspection.

Identify:
- The exact component, file, and function where the failure occurs
- The exact condition that triggers the failure
- Why the failure was not caught by tests, review, or staging
- Whether the root cause is code, configuration, infrastructure, or external dependency

Document the root cause in the incident file.

If root cause cannot be identified within the resolution target time:
- Escalate: bring in additional engineers or domain experts
- Consider if a broader rollback or service isolation is needed
- Do not deploy speculative fixes -- only deploy fixes with known root causes

---

## Step 4: Hotfix

### 4a: Plan the Fix
- Define the minimal change needed to resolve the root cause
- The fix should be the smallest possible change -- this is not the time for refactoring
- Identify what could go wrong with the fix
- Define how to verify the fix works

### 4b: Implement the Fix
- Write the fix on a hotfix branch: `hotfix/[incident-description]`
- Write a targeted regression test that reproduces the original failure and confirms the fix
- The regression test is mandatory -- never deploy a hotfix without a test proving it works

### 4c: Verify the Fix (expedited but NOT skipped)

Even under time pressure, ALL of these gates apply:

```
Gate 1: Regression test passes
  - The test you wrote reproduces the bug and confirms the fix
  - Run the full test suite -- the hotfix must not break anything else

Gate 2: Code review (expedited)
  - Quick review focused on: does this fix the issue? Does it introduce new issues?
  - For security incidents: security-review is mandatory even for hotfixes

Gate 3: Staging verification
  - Deploy to staging first (except P1 where staging is impractical -- see below)
  - Verify the fix resolves the issue in staging
  - Verify no other functionality is broken

Gate 4: Production deployment
  - Deploy via deployment-workflow (expedited path)
  - Monitor closely during and after deployment
```

**P1 exception:** For P1 incidents where staging verification adds unacceptable delay:
- The regression test and code review gates still apply -- never skip those
- Deploy directly to production with canary/blue-green if available
- If neither is available: deploy with immediate monitoring and instant rollback readiness
- Document the staging skip in the incident file
- Verify in staging AFTER production is stable (backfill verification)

### 4d: Security Incident Hotfix

**ECC delegation:** If the incident is security-related, spawn the `security-reviewer` agent as a subagent with the hotfix code. It will verify the fix addresses the vulnerability without introducing new attack surfaces.

For security incidents:
- security-review is mandatory before deploying the hotfix -- no exceptions
- If the incident involves compromised credentials: rotate ALL affected credentials before deploying the fix
- If the incident involves data exposure: assess data impact and prepare disclosure if required
- All security incident hotfixes get full pipeline treatment after the emergency is stabilized

---

## Step 5: Verification

After the hotfix is deployed to production:

- Monitor error rates -- confirm they return to baseline
- Monitor response times -- confirm they return to normal
- Check the specific failure scenario -- confirm it no longer occurs
- Check related functionality -- confirm no regression
- Monitor for at least 30 minutes for P1/P2, 15 minutes for P3
- Check user reports -- are users confirming the issue is resolved?

If the fix does not resolve the issue:
- Rollback the hotfix immediately
- Return to Step 3 (Diagnosis) -- the root cause was not correctly identified
- Do not deploy another speculative fix -- find the actual root cause first

If the fix resolves the issue:
- Update the incident file: status to RESOLVED, note verification results
- Update timeline with resolution timestamp
- Notify stakeholders that the incident is resolved

---

## Step 6: Post-Mortem

Every P1 and P2 incident requires a post-mortem. P3 incidents get a lightweight post-mortem. P4 incidents do not require one.

Write the post-mortem in the incident file:

```
### Post-Mortem

#### What happened
[Chronological narrative of the incident -- what broke, when, how it was discovered]

#### Root cause
[Technical root cause -- specific and precise]

#### Why it was not caught earlier
- Was there a test gap? [yes/no -- what test would have caught this?]
- Was there a review gap? [yes/no -- what should the reviewer have checked?]
- Was there a monitoring gap? [yes/no -- what alert would have detected this sooner?]
- Was there a staging gap? [yes/no -- why did staging not catch this?]

#### Impact
- Duration: [from detection to resolution]
- Users affected: [count or segment]
- Data impact: [none / degraded service / data loss]
- Business impact: [revenue, reputation, compliance]

#### What went well
- [Things that worked during the response]

#### What could be improved
- [Things that slowed down detection, diagnosis, or resolution]

#### Action items
- [ ] [Specific, actionable item] -- owner: [who] -- target: [date]
- [ ] [Specific, actionable item] -- owner: [who] -- target: [date]
```

Action items typically include:
- Add the missing test that would have caught this
- Add or improve monitoring/alerting for the failure mode
- Update runbooks with this failure scenario
- Improve staging environment to catch production-only issues
- Update documentation if the incident revealed incorrect docs

---

## Step 7: Follow-Up

After the post-mortem:

### 7a: Backport and Pipeline Completion
- If the hotfix was deployed with an expedited path: run it through the full pipeline now
  - spec-workflow (create a proper fix plan and spec)
  - testing-workflow (full test suite, not just the regression test)
  - code-review + security-review (full review, not expedited)
  - documentation-workflow (update docs if the incident revealed gaps)
  - git-workflow (proper PR if the hotfix was committed directly)
- If the hotfix branch was merged to main: ensure staging is updated to match production

### 7b: Action Item Tracking
- Add all post-mortem action items to `tasks/todo.md`
- Each action item routes through the appropriate workflow:
  - Missing test > testing-workflow
  - Missing monitoring > observability-setup
  - Documentation gap > documentation-workflow
  - Code improvement > spec-workflow

### 7c: Impact on Active Feature Work
- Check `tasks/pipeline-state-*.md` for features that were paused during the incident
- Resume paused feature pipelines
- If the hotfix affects any in-progress feature: notify and assess impact
- Update `tasks/lessons.md` with the incident pattern

### 7d: Action Item Verification
- Track all post-mortem action items in `tasks/todo.md`
- Periodically check each action item's status -- has the routed workflow completed?
- For each action item routed to another workflow: check the corresponding pipeline state file, test results, or observability-plan to confirm completion
- When ALL action items are verified complete: update the incident file status to "POST-MORTEM COMPLETE"
- If action items remain open after 2 weeks (P1/P2) or 4 weeks (P3): escalate -- they are overdue
- An incident is not fully closed until all action items are resolved

### 7e: Lessons Learned
Update `tasks/lessons.md` with:
- The failure pattern (what went wrong and why)
- The detection gap (how to catch this earlier next time)
- The response pattern (what worked and what did not)

---

## Failure Handling

**Rollback fails during mitigation**
- Critical situation -- escalate immediately
- Manually identify the last known good deployment artifact
- Deploy manually if the pipeline cannot be used
- Stability first -- investigation comes after the service is restored
- Document the rollback failure as a separate post-mortem action item

**Hotfix introduces a new issue**
- Rollback the hotfix immediately
- You now have two issues: the original and the one introduced by the hotfix
- Return to Step 3 and re-diagnose with fresh eyes
- Consider if a broader rollback to an earlier known-good state is needed

**Cannot identify root cause within the resolution target**
- Escalate: bring in additional engineers, domain experts, or the original author of the affected code
- Consider if the mitigation (rollback, feature flag, etc.) is sufficient as a temporary state
- If mitigation is holding: continue diagnosis without the time pressure
- If mitigation is not holding: escalate further -- this may require infrastructure-level intervention

**Multiple simultaneous incidents**
- Classify severity of each independently
- Determine if they are related (common root cause) or independent
- If related: treat as a single incident, fix the common root cause
- If independent: assign the higher-severity incident to the primary responder, defer the lower-severity one
- Never try to fix two independent P1 incidents simultaneously in a single context

**Incident during an active deployment**
- Halt the deployment immediately
- Determine if the incident is caused by the deployment or is coincidental
- If caused by deployment: rollback the deployment, treat as a deployment failure (deployment-workflow handles this)
- If coincidental: rollback the deployment to return to a known state, then address the incident

**Incident discovered in staging (not production)**
- This is NOT an incident -- it is a bug found during testing
- Route through spec-workflow Bug Fix Workflow, not incident-response
- Do not classify as P1-P4 unless it is in production

**User reports an issue that cannot be reproduced**
- Gather detailed reproduction steps: browser, OS, network, account, exact actions
- Check if the issue is environment-specific (specific region, device, browser)
- Check server logs for the user's requests at the reported time
- If cannot reproduce after thorough investigation: document findings, ask user to report again if it recurs
- Do not deploy speculative fixes for unreproducible issues

**The fix requires a database migration**
- Database migrations during an incident are extremely risky
- If the migration is backward compatible: proceed with extreme caution, test on staging first
- If the migration is NOT backward compatible: find an alternative fix that does not require a migration
- If no alternative exists: this requires a maintenance window, not an emergency fix
- Get explicit user confirmation before any database operation during an incident

**Incident involves data loss or corruption**
- Assess the scope immediately: how much data, which users, which time period
- If backups exist: prepare for data restoration (do not restore yet -- assess first)
- Prioritize stopping further data loss over restoring lost data
- Document everything -- data incidents may have compliance implications
- Get explicit user confirmation before any data restoration operation

**Stakeholders are unavailable during a P1**
- Do not wait for stakeholders to begin mitigation and diagnosis
- Document all actions taken with timestamps
- Notify stakeholders asynchronously (email, message) even if they do not respond
- Proceed with the incident response -- delay costs more than imperfect communication

---

## Rules

- Mitigation (reduce user impact) comes before diagnosis (find root cause) -- always
- Never deploy a hotfix without a regression test proving it works
- Never skip code review for a hotfix -- expedite it, do not skip it
- Security incident hotfixes always require security-review before deployment
- P1 exception: staging verification can be deferred but must be backfilled
- Rollback is always the first mitigation option to consider
- Never deploy speculative fixes -- only fix confirmed root causes
- Every P1 and P2 incident requires a post-mortem with action items
- All post-mortem action items are tracked in `tasks/todo.md` and routed through appropriate workflows
- Paused feature pipelines must be resumed after incident resolution
- All incidents documented in `tasks/incident-[date]-[description].md`
- All patterns logged in `tasks/lessons.md`
- Never try to fix two independent incidents simultaneously in a single context
- If the hotfix was expedited: run it through the full pipeline after the emergency is stabilized
