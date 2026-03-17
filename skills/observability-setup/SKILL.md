---
name: observability-setup
description: Observability and monitoring setup workflow covering SLO definition, alerting rules, structured logging, metrics collection, dashboards, health checks, and runbook creation. Use when user says "set up monitoring", "add alerts", "create dashboard", "define SLOs", "observability", "logging strategy", "health checks", or "runbook". Triggered from project-planning for initial setup, from deployment-workflow for new feature monitoring, or from incident-response post-mortem when monitoring gaps are found. Never deploys without health checks.
---

# Observability Setup Workflow

A structured workflow for setting up and maintaining observability infrastructure -- monitoring, alerting, logging, metrics, dashboards, health checks, and runbooks. Ensures production issues are detected before users report them.

---

## Relationship to Other Skills

```
project-planning > triggers observability-setup for initial monitoring infrastructure
deployment-workflow > triggers observability-setup for new feature monitoring
incident-response > triggers observability-setup for monitoring gaps found in post-mortem
maintenance-workflow > checks observability health during periodic maintenance
```

observability-setup is NOT a pipeline stage. It is an infrastructure skill triggered when monitoring needs to be created, updated, or audited.

---

## ECC Agent Delegation

| Step | ECC Agent | Purpose | When to Use |
|------|-----------|---------|-------------|
| Step 4 (Logging) | `python-reviewer` | Review logging statements for security (no PII/secrets in logs), completeness, and Python best practices | Python projects -- run after logging changes |
| Step 7 (Runbooks) | `doc-updater` | Generate runbook structure from code, extract alert conditions and response procedures | When creating runbooks from scratch for an existing system |

Supplementary ECC Skills (reference as needed):
- `backend-patterns`: Backend observability patterns (structured logging, request tracing, health endpoints)
- `docker-patterns`: Container observability (log drivers, health checks, resource monitoring)
- `deployment-patterns`: CI/CD observability (build metrics, deployment frequency, rollback rate)
- `verification-loop`: Structured verification that monitoring is working correctly

---

## How to Start

Detect context:
- Triggered from project-planning > set up initial monitoring infrastructure for the project
- Triggered from deployment-workflow > add monitoring for a new feature or service
- Triggered from incident-response post-mortem > fix monitoring gaps that caused delayed detection
- Standalone > ask what monitoring needs to be set up or updated

Before starting:
- Load project CLAUDE.md for tech stack, infrastructure, and deployment details
- Check `tasks/observability-plan.md` for existing monitoring documentation (create if it does not exist)
- Check `tasks/lessons.md` for past incidents and monitoring gaps

---

## Step 1: Assess Current State

Audit what monitoring exists today:
- Health check endpoints: do they exist? What do they check?
- Alerting: are there alerts? What triggers them? Who gets notified?
- Logging: is logging structured? What log level is used in production?
- Metrics: are application and infrastructure metrics collected?
- Dashboards: do they exist? Are they useful or just noise?
- Runbooks: do they exist for each alert?

Document the current state. Identify gaps.

If triggered from incident-response: focus on the specific monitoring gap that caused delayed detection.

Present findings. Ask: "Here is the current monitoring state and the gaps. Shall I proceed with setting up the missing pieces?"

---

## Step 2: Define SLOs (Service Level Objectives)

SLOs define what "healthy" means for the service. Without SLOs, alerts are arbitrary.

### 2a: Availability SLO
- Target: what percentage uptime is acceptable? (e.g., 99.9% = 8.7 hours downtime/year)
- Measurement: how is uptime calculated? (health check success rate, error rate threshold)
- Error budget: how much downtime is allowed before action is required?

### 2b: Latency SLO
- Target: what is the acceptable response time? (e.g., p50 < 200ms, p99 < 2s)
- Measurement: which endpoints are measured? (all API endpoints, critical paths only)
- Degradation threshold: at what point is latency "too slow" vs "outage"?

### 2c: Error Rate SLO
- Target: what percentage of requests can return errors? (e.g., < 0.1% 5xx errors)
- Measurement: which error codes count? (5xx always, 4xx selectively)
- Spike threshold: what constitutes a "spike" vs normal variance?

### 2d: Throughput SLO (if applicable)
- Target: what is the expected request rate? (e.g., 100-500 req/s normal)
- Measurement: how is throughput tracked?
- Drop threshold: at what point does a throughput drop indicate an issue?

For each SLO:
- Document the target, measurement method, and threshold
- Define what happens when the SLO is breached (alert, escalation)

Save to `tasks/observability-plan.md` under `## SLOs`.

If the user is unsure about targets: start with reasonable defaults based on the tech stack, then refine after collecting baseline data.

---

## Step 3: Alerting Rules

Every alert must have: a condition, a severity, a notification target, and a runbook.

### 3a: Define Alerts

For each SLO, create corresponding alerts:

```
Alert template:
  Name: [descriptive name]
  Condition: [metric] [operator] [threshold] for [duration]
  Severity: Critical / Warning / Info
  Notification: [who gets notified and how]
  Runbook: [link to runbook or inline steps]
  Auto-resolve: [yes/no -- does the alert clear automatically when the condition resolves?]
```

Standard alerts for a web service:
```
Health check failure:
  Condition: health endpoint returns non-200 for > 2 consecutive checks
  Severity: Critical
  Action: Immediate investigation -- service may be down

Error rate spike:
  Condition: 5xx error rate > 1% for > 5 minutes
  Severity: Critical
  Action: Check logs, identify failing endpoint, assess if rollback needed

Latency degradation:
  Condition: p99 response time > 5s for > 10 minutes
  Severity: Warning
  Action: Check database queries, external API latency, resource usage

High memory usage:
  Condition: memory usage > 85% of limit for > 10 minutes
  Severity: Warning
  Action: Check for memory leaks, consider scaling, review recent changes

High CPU usage:
  Condition: CPU usage > 80% for > 15 minutes
  Severity: Warning
  Action: Check for hot loops, scaling needs, or misconfigurations

Disk usage high:
  Condition: disk usage > 80%
  Severity: Warning
  Action: Check log rotation, clean temp files, consider volume expansion

Certificate expiry:
  Condition: SSL certificate expires in < 14 days
  Severity: Warning
  Action: Renew certificate

External dependency failure:
  Condition: external API error rate > 10% for > 5 minutes
  Severity: Warning
  Action: Check external service status, enable fallback if available
```

### 3b: Alert Fatigue Prevention

Alerts that fire too often and are ignored are worse than no alerts:
- Every alert must be actionable -- if there is nothing to do, it should not be an alert
- Consolidate related alerts -- do not fire 10 alerts for the same underlying issue
- Use severity correctly -- Critical means "wake someone up," Warning means "check during business hours"
- Set appropriate durations -- a 1-second CPU spike is not an alert, sustained 15-minute spike is
- Review alert frequency monthly during maintenance-workflow -- if an alert fires > 5 times without action, it needs tuning

### 3c: Escalation Path

Define who gets notified and when:
```
Level 1 (immediate): On-call engineer -- Critical alerts
Level 2 (15 min no response): Engineering lead -- Critical alerts
Level 3 (30 min no response): All engineering -- Critical alerts
Warning alerts: Notification channel only, no paging
Info alerts: Dashboard only, no notification
```

Save to `tasks/observability-plan.md` under `## Alerting Rules`.

---

## Step 4: Structured Logging

**ECC delegation:** After defining the logging strategy, spawn the `python-reviewer` agent as a subagent to review all logging statements in the codebase. It will check for PII/secrets in log messages, consistent log levels, and Python logging best practices.

### 4a: Logging Strategy

Define what gets logged at each level:
```
ERROR: Unexpected failures that need investigation
  - Unhandled exceptions, failed external calls, data integrity issues
  - Always include: timestamp, request ID, error type, stack trace

WARNING: Expected failures or degraded behavior
  - Rate limits hit, fallback triggered, retry needed, deprecated API used
  - Always include: timestamp, request ID, warning type, context

INFO: Significant business events
  - Request received, request completed, authentication success, deployment events
  - Always include: timestamp, request ID, endpoint, response code, latency

DEBUG: Detailed diagnostic information (disabled in production by default)
  - Function entry/exit, variable values, query plans
  - Only enable temporarily for specific investigation
```

### 4b: Logging Security Rules

These are non-negotiable:
- NEVER log passwords, tokens, API keys, or secrets
- NEVER log PII (email, phone, SSN, IP addresses) in production
- NEVER log full request/response bodies in production (may contain sensitive data)
- Sanitize all user input before logging
- If a field might be sensitive: redact it with `***` or omit it

### 4c: Structured Log Format

Use structured logging (JSON) in production:
```json
{
  "timestamp": "2026-03-17T12:00:00Z",
  "level": "ERROR",
  "message": "External API call failed",
  "request_id": "abc-123",
  "service": "digiwatch-web",
  "endpoint": "/chat",
  "external_service": "bedrock",
  "error_type": "ConnectionTimeout",
  "latency_ms": 30000
}
```

Benefits:
- Searchable and filterable
- Machine-parseable for alerting
- Consistent across all services

### 4d: Log Aggregation

Ensure logs are collected centrally:
- Application logs from all containers/instances
- Access logs from load balancer/CDN
- Error logs from infrastructure
- Retention policy: how long are logs kept? (compliance requirement)

Save to `tasks/observability-plan.md` under `## Logging Strategy`.

---

## Step 5: Metrics Collection

### 5a: Application Metrics

Essential application metrics to collect:
```
Request metrics:
  - request_count (total, by endpoint, by status code)
  - request_latency (histogram: p50, p95, p99, by endpoint)
  - error_count (by endpoint, by error type)
  - active_requests (gauge: concurrent requests in progress)

Business metrics (project-specific):
  - [key actions per minute/hour]
  - [conversion rates if applicable]
  - [queue depths if applicable]

Dependency metrics:
  - external_api_latency (by service)
  - external_api_error_rate (by service)
  - database_query_latency (by query type)
  - database_connection_pool_usage (gauge)
```

### 5b: Infrastructure Metrics

Essential infrastructure metrics:
```
Container/Host:
  - cpu_usage_percent
  - memory_usage_bytes / memory_limit_bytes
  - disk_usage_percent
  - network_io_bytes (in/out)

Load Balancer:
  - healthy_host_count
  - request_count
  - target_response_time
  - 5xx_count

Database:
  - connection_count / max_connections
  - query_latency
  - replication_lag (if applicable)
  - disk_usage
```

### 5c: Custom Metrics (project-specific)

For DigiWatch.AI or similar projects:
```
AI/LLM metrics:
  - model_invocation_count (by model: Haiku/Sonnet/Opus)
  - model_latency (by model)
  - model_error_rate (by model, by error type)
  - model_fallback_count (Sonnet->Opus fallbacks)
  - token_usage (input/output, by model)
  - tool_call_count (by tool name)

MCP metrics:
  - mcp_tool_latency (by tool)
  - mcp_tool_error_rate (by tool)
  - mcp_connection_status
```

Save to `tasks/observability-plan.md` under `## Metrics`.

---

## Step 6: Dashboards

### 6a: Overview Dashboard

The first dashboard anyone looks at during an incident:
```
Row 1: Service Health
  - Overall availability (uptime %)
  - Current error rate
  - Current p99 latency
  - Active alerts count

Row 2: Traffic
  - Request rate over time
  - Error rate over time
  - Latency distribution (p50, p95, p99) over time

Row 3: Resources
  - CPU usage over time (by service/container)
  - Memory usage over time
  - Database connection pool usage

Row 4: Dependencies
  - External API latency over time
  - External API error rate over time
```

### 6b: Service-Specific Dashboards

One dashboard per service with deeper metrics:
- All endpoints with individual latency and error rates
- Business-specific metrics
- Model/AI metrics (for AI services)

### 6c: Dashboard Principles

- Dashboards should answer "is the service healthy?" in < 10 seconds
- Use consistent time ranges across panels (default: last 1 hour, with zoom)
- Red/yellow/green thresholds should match alert thresholds
- No dashboard should have more than 4 rows -- if it needs more, split into multiple dashboards
- Every metric on a dashboard should be explainable in one sentence

Save dashboard definitions to `tasks/observability-plan.md` under `## Dashboards`.

---

## Step 7: Health Check Endpoints

### 7a: Liveness Check

Purpose: is the process running?
```
GET /health
Response: 200 OK {"status": "healthy"}
Checks: process is alive, basic response capability
Used by: container orchestrator (ECS, K8s) for restart decisions
Frequency: every 10-30 seconds
Must be: fast (< 100ms), no external dependencies, always available
```

### 7b: Readiness Check

Purpose: is the service ready to accept traffic?
```
GET /health/ready
Response: 200 OK {"status": "ready", "checks": {...}}
Checks: database connected, external dependencies reachable, config loaded
Used by: load balancer for routing decisions
Frequency: every 10-30 seconds
May be: slightly slower (< 1s), includes dependency checks
```

### 7c: Deep Health Check

Purpose: is everything working correctly?
```
GET /health/deep
Response: 200 OK {"status": "healthy", "components": {...}}
Checks: all integrations, database queries work, AI models respond, MCP server connected
Used by: monitoring system for alerting
Frequency: every 1-5 minutes
May be: slower (< 5s), full system check
Should NOT be: on the critical path for user requests
```

### 7d: Health Check Security

- Health endpoints should not expose sensitive information (versions, internal IPs, credentials)
- Liveness and readiness checks should be unauthenticated (orchestrator needs access)
- Deep health checks may require authentication if they expose component details
- Never include database query results or full error messages in health responses

---

## Step 8: Runbook Creation

**ECC delegation:** For existing systems, spawn the `doc-updater` agent as a subagent to extract alert conditions and common failure patterns from the codebase. Use its output as a starting point for runbooks.

Every alert must have a corresponding runbook. A runbook answers: "This alert fired -- what do I do?"

### Runbook Template

```markdown
# Runbook: [Alert Name]

## Alert Condition
[What triggers this alert -- metric, threshold, duration]

## Severity
[Critical / Warning / Info]

## Impact
[What users experience when this alert fires]

## Diagnosis Steps
1. [First thing to check -- the most likely cause]
2. [Second thing to check]
3. [Third thing to check]
4. [Where to look for logs and metrics]

## Resolution Steps

### If caused by [most common cause]:
1. [Step-by-step fix]
2. [How to verify the fix]

### If caused by [second most common cause]:
1. [Step-by-step fix]
2. [How to verify the fix]

### If cause is unknown:
1. [Escalation path]
2. [Who to contact]
3. [Trigger incident-response if severity is P1/P2]

## Rollback Procedure
[If applicable -- how to rollback to resolve]

## Prevention
[What would prevent this from happening again]

## History
- [Date]: [What caused this alert and how it was resolved]
```

Save runbooks to `docs/runbooks/` at the project root, one file per alert.

---

## Step 9: Verify and Complete

After setting up all monitoring components:

### 9a: Verify Alerts Work
- Trigger each alert manually (simulate the condition)
- Confirm the notification reaches the correct target
- Confirm the alert auto-resolves when the condition clears
- Document any alerts that could not be tested

### 9b: Verify Health Checks Work
- Call each health endpoint and confirm correct responses
- Simulate a dependency failure -- confirm the readiness check detects it
- Simulate a process issue -- confirm the liveness check detects it

### 9c: Verify Dashboards Are Useful
- View each dashboard with current data
- Confirm all panels display data (no "no data" panels)
- Confirm time ranges and thresholds are correct

### 9d: Document Everything
- Save the complete observability plan to `tasks/observability-plan.md`
- Update project CLAUDE.md with monitoring endpoints and tools
- Update `tasks/lessons.md` with observability patterns

---

## Failure Handling

**Monitoring tool not available or not installed**
- Identify the required tool (CloudWatch, Prometheus, Grafana, Datadog, etc.)
- If the project does not have a monitoring tool: recommend one based on the tech stack and scale
- For AWS/ECS projects: CloudWatch is the default (already available)
- Do not proceed without a monitoring tool -- monitoring is not optional

**Alert fires immediately after creation (false positive)**
- The threshold is too sensitive
- Review the baseline metrics -- what is normal for this service?
- Adjust the threshold to be above normal variance
- Add a duration requirement (must exceed threshold for X minutes, not just a single data point)

**Cannot simulate alert conditions for testing**
- Document which alerts could not be tested
- Add a "last verified" date to the runbook -- test during the next maintenance cycle
- For production-only conditions: test in staging with synthetic load

**Health check endpoint adds latency to the service**
- Liveness checks must be fast -- never add external dependency checks to liveness
- Move expensive checks to the deep health endpoint only
- Cache external dependency status with a short TTL (30-60 seconds)
- Health checks should never cause the issue they are monitoring

**Dashboard shows "no data" for some metrics**
- Verify the metric is being collected (check agent/exporter configuration)
- Verify the metric name matches between collection and dashboard
- Verify the time range is correct
- If metrics are not being collected: set up collection before creating the dashboard

**Alert fatigue -- too many non-actionable alerts**
- Review each alert that fired in the last 30 days
- If an alert fired and no action was taken: either make it actionable or demote to Info/remove it
- Consolidate related alerts into a single alert with a summary
- Increase thresholds or durations for overly sensitive alerts
- This is a recurring concern -- check during every maintenance-workflow run

**SLO targets are wrong (too strict or too loose)**
- Start with the recommended defaults
- After 30 days of baseline data: adjust to reflect actual service behavior
- Too strict (alerts firing constantly): loosen until alerts are rare but real
- Too loose (incidents detected by users, not alerts): tighten based on user impact data
- SLO targets should be reviewed quarterly during maintenance-workflow

**Runbooks become outdated**
- Every time an alert fires and the runbook is used: update it with what actually worked
- During maintenance-workflow: review runbooks for accuracy
- Add a "last verified" date to each runbook
- If a runbook has not been verified in > 6 months: flag it for review

**Monitoring infrastructure itself goes down**
- Monitor the monitor: at minimum, have a simple external ping check that does not depend on your monitoring stack
- If CloudWatch is down: use a simple external uptime service as a fallback
- Document what to do when monitoring is unavailable in a separate runbook

**Multiple services need monitoring simultaneously**
- Set up monitoring one service at a time
- Start with the most critical user-facing service
- Reuse patterns (dashboards, alert templates, runbook templates) across services
- Do not try to set up monitoring for everything at once

---

## Rules

- Every production service must have health check endpoints (liveness + readiness at minimum)
- Every alert must have a corresponding runbook
- Every SLO must have a corresponding alert
- Never log PII, secrets, or credentials -- no exceptions
- Liveness checks must be fast and must not check external dependencies
- Alerts must be actionable -- if there is no action, it is not an alert
- Alert fatigue is a monitoring failure -- address it during maintenance-workflow
- Dashboards must answer "is the service healthy?" in under 10 seconds
- Health check responses must not expose sensitive internal information
- SLO targets are reviewed quarterly and adjusted based on baseline data
- Runbooks are updated every time they are used
- Monitoring setup is verified by testing (simulate alerts, check dashboards)
- All monitoring configuration documented in `tasks/observability-plan.md`
- All patterns logged in `tasks/lessons.md`
- Monitoring gaps found in incident post-mortems are addressed immediately -- not deferred
