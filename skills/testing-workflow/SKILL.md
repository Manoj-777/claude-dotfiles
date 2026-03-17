---
name: testing-workflow
description: Structured testing workflow covering unit, integration, end-to-end, and performance tests. Use when user says "write tests", "add tests", "test this feature", "run tests", "test coverage", or "testing". Triggered by spec-workflow after implementation as Stage 1 of the pipeline, and by deployment-workflow as a pre-deployment verification gate. Covers test planning, writing, execution, failure analysis, performance, and coverage. Never marks a stage complete with failing or flaky tests.
---

# Testing Workflow

A gated workflow for planning, writing, and executing tests. Always triggered as Stage 1 of the pipeline after implementation. Also used as a pre-deployment gate. Every test failure must be resolved before signalling complete.

---

## Pipeline Position

```
spec-workflow > [testing-workflow] > code-review + security-review > documentation-workflow > git-workflow > deployment-workflow
```

Triggered by: spec-workflow (after implementation), deployment-workflow (pre-deployment gate)
Signals back to: spec-workflow

---

## Pipeline State

On start: read `tasks/pipeline-state-[feature-name].md` to understand change size and pipeline path.
On complete: update the state file with testing result and timestamp.

---

## ECC Agent Delegation

This skill delegates to ECC agents at specific points for deeper analysis. Delegation is optional and enhances -- never replaces -- the pipeline gates.

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 1 (Test Plan) | `tdd-guide` | TDD methodology, edge case checklist, 80%+ coverage enforcement, eval-driven testing | Standard+ features or when TDD approach is preferred |
| Step 3 (E2E Tests) | `e2e-runner` | Playwright E2E test execution, Page Object Model, flaky test management | When E2E tests are in scope and the project has a browser-based UI |

Agents NOT used here (and why):
- `python-reviewer`: Used during code-review, not testing -- avoids duplicate review work
- `build-error-resolver`: TypeScript/JS focused, not relevant for Python test failures

Supplementary ECC Skills (reference as needed):
- `python-testing`: pytest strategies, fixtures, mocking, parametrize, coverage configuration
- `verification-loop`: Structured verification system for confirming test completeness

---

## How to Start

Detect context:
- Triggered from spec-workflow > full test plan, write tests, run tests
- Triggered from deployment-workflow as pre-deployment gate > run existing test suite only (do not write new tests)
- Standalone > ask which feature or fix to test

If triggered from spec-workflow, use provided context: feature name, spec file at `tasks/spec-[feature-name].md`, and tech stack.

---

## Step 1: Test Plan

**ECC delegation:** For Standard+ features, spawn the `tdd-guide` agent as a subagent with the feature spec. It will produce a TDD-structured test plan with edge case checklist, coverage targets (80%+), and test-first scaffolding. Review and refine its output before confirming the test plan with the user.

Based on the feature spec:
- Identify what must be tested:
  - Core functionality (happy path)
  - All edge cases defined in the spec
  - All failure scenarios
  - Integration points with other components
  - Security-sensitive logic (auth, input validation, data access)
- Decide test types:
  - Unit tests -- isolated logic
  - Integration tests -- component interactions
  - E2E tests -- full user flows (only where necessary)
  - Performance tests -- if the feature has performance-sensitive paths (see Step 3b)
- Identify test data requirements

Present the test plan. Ask: "Does this cover everything?"

Save to `tasks/test-plan-[feature-name].md`.

Skip Step 1 if triggered as a deployment gate -- use existing test plan.

---

## Step 2: Write Tests

Write tests following the confirmed plan:
- Unit tests first -- fastest feedback
- Integration tests second
- E2E tests last -- only if in scope

**ECC delegation:** If E2E tests are in scope and the project has a browser-based UI, spawn the `e2e-runner` agent as a subagent. It will generate Playwright E2E tests using Page Object Model, manage flaky test detection, and execute test journeys. Review its generated tests before including them in the suite.

- Each test must have a clear name describing what it validates
- Follow arrange-act-assert structure
- Use mocks only where necessary -- prefer real implementations
- Never write tests that always pass regardless of logic

After writing, summarise: what was written and what each test covers.

Skip Step 2 if triggered as a deployment gate -- run existing tests.

---

## Step 3: Run Tests

Execute the full test suite:
- Run unit tests
- Run integration tests
- Run E2E tests if applicable
- Capture full output -- do not hide or summarise failures

If all pass > proceed to Step 3b (if applicable) or Step 4.
If any fail > go to Failure Handling immediately.

---

## Step 3b: Performance Tests (when applicable)

Run performance tests if any of the following are true:
- The feature handles concurrent requests or high-throughput paths
- The feature calls external APIs (rate limits, latency)
- The feature processes large datasets or files
- The feature is user-facing and response time matters
- The spec explicitly mentions performance requirements

What to test:
- Response time under normal load -- is it within acceptable range?
- Behaviour under concurrent requests -- does it handle parallelism correctly?
- External API rate limit handling -- does it back off gracefully?
- Memory and CPU profile -- does it leak or spike under sustained use?
- Database query performance -- are there N+1 queries or slow queries?

How to test:
- Use simple timing measurements for basic response time checks
- Use concurrent request tests (asyncio, threading, or load test tools) for throughput
- Profile memory for data-intensive operations
- Check query counts and execution times for database operations

Results:
- Document baseline performance numbers in `tasks/test-plan-[feature-name].md`
- If performance is unacceptable: flag as a test failure and go to Failure Handling
- If performance is acceptable: document numbers and proceed

Skip Step 3b if:
- Change size is Trivial or Small and no performance-sensitive paths are involved
- Triggered as a deployment gate (performance tests should have been run during development)

---

## Step 4: Coverage Check

After all tests pass:
- Check coverage for the feature -- are all critical paths tested?
- If critical paths are untested: write additional tests and re-run from Step 3
- Document final coverage in `tasks/test-plan-[feature-name].md`

Skip coverage check if triggered as a deployment gate.

---

## Step 5: Complete

- Mark testing items complete in `tasks/todo.md`
- Update `tasks/test-plan-[feature-name].md` with final results
- Update `tasks/pipeline-state-[feature-name].md`: "testing-workflow: PASSED [timestamp]"
- Update `tasks/lessons.md` with testing patterns or gotchas discovered

Signal back to spec-workflow:
- Success: "Testing complete for [feature]. Pipeline Stage 1 passed. Proceed to code-review + security-review."
- Failure (unresolved): "Testing blocked for [feature]. Reason: [X]. Returning to spec-workflow for fix."

If triggered as deployment gate:
- Success: "Deployment test gate passed. Returning to deployment-workflow."
- Failure: "Deployment test gate failed. Reason: [X]. Returning to deployment-workflow."

---

## Failure Handling

Never hide, skip, or work around a test failure.

**Single test failing**
- Is it a test bug or a code bug?
- If test bug: fix the assertion, re-run, confirm it now passes correctly, document in `tasks/lessons.md`
- If code bug: signal spec-workflow -- "Testing blocked. Code bug found: [description]. Returning to spec-workflow."
- Never mark a failing test as skipped to make the suite pass

**Multiple tests failing**
- Group by type -- are they related or independent?
- Fix the root cause first -- not symptoms one by one
- If they share a cause, one fix may resolve many
- Re-run after each fix to confirm progress
- Fix foundational failures before surface-level ones

**Regression -- tests that were passing now fail**
- Identify which change caused the regression
- Do not proceed until the regression is resolved
- If the fix requires changing feature implementation: signal spec-workflow to fix, restart from Step 3 after fix

**Test environment failure**
- Database not running, service unavailable, config missing, port conflict
- Resolve the environment issue first -- do not treat it as a code bug
- Document the missing environment requirement in the project CLAUDE.md
- Re-run after environment is fixed

**Flaky tests**
- Run the test 3 times -- if it fails at least once, treat as a real failure
- Identify root cause: race condition, timing issue, shared state, external dependency
- Fix the root cause -- do not add retries to mask the problem
- A flaky test that passes in CI but fails in prod is a production bug waiting to happen

**All tests fail after a major change**
- Stop -- do not try to fix everything at once
- Run a single simple test first to confirm the environment is working
- If environment is fine: fix the most foundational failure first
- Work up from the bottom

**Coverage drop**
- Identify new code paths that are untested
- Write targeted tests for uncovered paths
- Re-run coverage check
- Never ship with lower coverage than before the change

**Test takes too long**
- Identify slow tests
- Check for unnecessary I/O, real external service calls, or sleep statements in unit/integration tests
- Mock external dependencies in unit and integration tests -- only E2E should hit real services
- Flag to user if cannot be fixed immediately

**Performance test failure**
- Identify the bottleneck: CPU, memory, I/O, network, or database
- If database: check for N+1 queries, missing indexes, unoptimized queries
- If external API: check for missing caching, excessive calls, or lack of batching
- If memory: check for large object accumulation or missing cleanup
- Document the performance issue clearly -- include numbers (actual vs expected)
- Signal spec-workflow with specific performance findings

---

## Rules

- Never skip test planning
- Never mark tests as skipped to make a suite pass
- Never proceed with failing or flaky tests
- All test plans saved to `tasks/test-plan-[feature-name].md`
- Always update `tasks/todo.md`, `tasks/lessons.md`, and `tasks/pipeline-state-[feature-name].md`
- Always signal back explicitly -- success or failure -- with a clear reason
- If a code bug is found, signal spec-workflow -- do not fix it inline without a plan
- After any code fix, restart from Step 3 -- never partially re-run
- Performance tests are required for performance-sensitive features -- not optional
