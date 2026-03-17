# Claude Dotfiles

Production-ready Claude Code configuration — 94 skills, 18 agents, 40+ commands, hooks, rules, and MCP configs built and refined through intensive daily use.

All 94 skills fully comply with Anthropic's official skill guide best practices.

---

## What's Inside

| Folder | Contents |
|--------|----------|
| `skills/` | 94 skills — Python, Go, Kotlin, Swift, Java, Django, Docker, Postgres, security, TDD, AI/LLM, and more |
| `agents/` | 18 specialized subagents — planner, code-reviewer, tdd-guide, security-reviewer, architect, and more |
| `rules/` | Always-on coding standards — security, git workflow, testing requirements, coding style |
| `commands/` | 40+ slash commands — `/tdd`, `/plan`, `/e2e`, `/code-review`, `/build-fix`, and more |
| `hooks/` | Trigger-based automations — Python auto-format, git safety, session project detection |
| `mcp-configs/` | 25+ MCP server configuration templates |
| `CLAUDE.md` | Global instructions for Claude — workflow, coding standards, core principles |
| `SETUP_GUIDE.md` | Full setup guide with MCP config, install steps, and verification |

---

## Quick Install

**Prerequisites:** Node.js >= 18, Git, Claude Code CLI (`npm install -g @anthropic/claude-code`)

```bash
# Option A: Fresh machine
git clone https://github.com/Manoj-777/claude-dotfiles.git ~/.claude

# Option B: Merge into existing ~/.claude
git clone https://github.com/Manoj-777/claude-dotfiles.git /tmp/cdotfiles
cp -r /tmp/cdotfiles/skills ~/.claude/
cp -r /tmp/cdotfiles/agents ~/.claude/
cp -r /tmp/cdotfiles/rules ~/.claude/
cp -r /tmp/cdotfiles/commands ~/.claude/
cp -r /tmp/cdotfiles/hooks ~/.claude/
cp -r /tmp/cdotfiles/mcp-configs ~/.claude/
```

---

## MCP Servers Setup

MCP servers give Claude real tools — GitHub, browser, search, databases.
Add to `~/.claude.json` (separate from `~/.claude/settings.json`).

### Recommended starter set

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp", "--browser", "chrome"]
    },
    "exa-web-search": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": { "EXA_API_KEY": "YOUR_EXA_KEY_HERE" }
    }
  }
}
```

### All available MCP servers (from `mcp-configs/mcp-servers.json`)

| Server | Purpose | Token needed? |
|--------|---------|--------------|
| `github` | PRs, issues, repos, code search | Yes — GitHub PAT |
| `context7` | Live library/framework docs | No |
| `sequential-thinking` | Chain-of-thought reasoning | No |
| `playwright` | Browser automation and testing | No |
| `exa-web-search` | Web search and research | Yes — Exa API key |
| `firecrawl` | Web scraping and crawling | Yes — Firecrawl key |
| `supabase` | Supabase database operations | Yes — project ref |
| `memory` | Persistent memory across sessions | No |
| `vercel` | Vercel deployments | No (HTTP) |
| `railway` | Railway deployments | No |
| `cloudflare-docs` | Cloudflare documentation | No (HTTP) |
| `cloudflare-workers-builds` | Workers builds | No (HTTP) |
| `cloudflare-observability` | Cloudflare logs | No (HTTP) |
| `clickhouse` | ClickHouse analytics queries | No (HTTP) |
| `fal-ai` | AI image/video/audio generation | Yes — Fal key |
| `confluence` | Confluence pages search/read | Yes — Confluence token |
| `token-optimizer` | Token compression (95%+ reduction) | No |
| `magic` | Magic UI components | No |
| `filesystem` | Local file operations | No |

> Keep under 10 MCPs active at once to preserve context window.

---

## ECC Plugin (Recommended)

These dotfiles are built on [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code).
Install ECC for the full installer, test suite, and update workflow:

```bash
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
npm install

# Install with recommended profiles
node scripts/install-apply.js --profile developer --with capability:security --with capability:research

# Verify — should show 1194 tests, 0 failures
node tests/run-all.js
node scripts/doctor.js
```

**Install profiles:**

| Profile | Includes |
|---------|---------|
| `core` | Skills + rules only |
| `developer` | Core + agents + commands + hooks |
| `security` | Security skills + security-reviewer agent |
| `research` | Deep research skills |
| `full` | Everything |

---

## Skills (94 total)

All skills meet Anthropic's official requirements:
- Trigger phrases ("Use when...", "Use for...") in every description
- YAML frontmatter with `name`, `description`, `license`, `version`, `metadata`
- Descriptions under 1024 characters
- Negative triggers on broad skills to prevent over-triggering
- CI validator + compliance test suite included

| Domain | Skills |
|--------|--------|
| Python | `python-patterns`, `python-testing` |
| Go | `golang-patterns`, `golang-testing` |
| Kotlin | `kotlin-patterns`, `kotlin-testing`, `kotlin-coroutines-flows`, `kotlin-ktor-patterns`, `kotlin-exposed-patterns`, `compose-multiplatform-patterns`, `android-clean-architecture` |
| Swift | `swiftui-patterns`, `swift-concurrency-6-2`, `swift-actor-persistence`, `swift-protocol-di-testing`, `foundation-models-on-device` |
| Java/Spring | `java-coding-standards`, `springboot-patterns`, `springboot-tdd`, `springboot-verification`, `springboot-security`, `jpa-patterns` |
| Django | `django-patterns`, `django-tdd`, `django-verification`, `django-security` |
| Perl | `perl-patterns`, `perl-testing`, `perl-security` |
| C++ | `cpp-coding-standards`, `cpp-testing` |
| Databases | `postgres-patterns`, `clickhouse-io`, `database-migrations` |
| Infrastructure | `docker-patterns`, `deployment-patterns`, `api-design`, `e2e-testing`, `coding-standards` |
| Security | `security-scan`, `security-review` |
| AI/LLM | `claude-api`, `eval-harness`, `cost-aware-llm-pipeline`, `regex-vs-llm-structured-text`, `agent-harness-construction`, `agentic-engineering`, `ai-first-engineering`, `autonomous-loops`, `continuous-agent-loop`, `enterprise-agent-ops` |
| Workflow | `tdd-workflow`, `verification-loop`, `iterative-retrieval`, `strategic-compact`, `search-first`, `deep-research`, `blueprint`, `skill-stocktake` |

---

## Agents (18)

| Agent | When to use |
|-------|-------------|
| `planner` | Complex features, multi-step tasks |
| `architect` | System design, technology decisions |
| `tdd-guide` | New features, bug fixes (write tests first) |
| `code-reviewer` | After writing code |
| `security-reviewer` | Before commits, auth/API code |
| `build-error-resolver` | When build or compile fails |
| `e2e-runner` | Critical user flows |
| `refactor-cleaner` | Dead code cleanup |
| `doc-updater` | Updating documentation |
| `python-reviewer` | Python-specific review |
| `go-reviewer` | Go-specific review |
| `kotlin-reviewer` | Kotlin-specific review |
| `database-reviewer` | Schema and query review |
| `chief-of-staff` | Orchestration and coordination |

---

## Slash Commands

```
/tdd              Test-driven development workflow
/plan             Generate implementation plan
/e2e              Generate and run E2E tests
/code-review      Full code quality review
/build-fix        Fix build/compile errors
/verify           Verification loop
/learn            Extract patterns from session
/skill-create     Generate skill from git history
/claw             NanoClaw persistent REPL
/orchestrate      Multi-agent task orchestration
/sessions         Session management
/checkpoint       Save session checkpoint
/eval             Evaluation harness
/evolve           Improve instincts
/prompt-optimize  Optimize a prompt
/quality-gate     Quality gate checks
/refactor-clean   Dead code cleanup
/update-docs      Update documentation
/python-review    Python-specific review
/go-review        Go-specific review
/kotlin-review    Kotlin-specific review
```

---

## Hooks

| Hook | Fires on | What it does |
|------|----------|-------------|
| `post-edit-python-format.sh` | After Edit/Write | Auto-formats Python files |
| `pre-bash-git-safety.sh` | Before Bash | Warns on destructive git operations |
| `session-start-project-detect.sh` | Session start | Detects project context |

---

## Customization

**CLAUDE.md** — Edit to add your engineering context, workflow preferences, and project rules.

**settings.json** — Add permissions to stop Claude prompting for common commands:
```json
"permissions": {
  "allow": [
    "Bash(npm run:*)",
    "Bash(python:*)",
    "Bash(git log:*)"
  ]
}
```

**rules/** — Already includes `common/`. Add language-specific rules as needed:
```bash
cp -r rules/typescript ~/.claude/rules/typescript
cp -r rules/python ~/.claude/rules/python
```

---

## Full Setup Guide

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step instructions including:
- New machine setup from scratch
- MCP configuration with all API key sources
- ECC install profile reference
- Verification commands
- Update workflow for keeping both repos in sync
