# Complete Claude Code Setup Guide

Everything needed to restore this exact setup on a new machine, from scratch.

---

## Prerequisites

Install these first:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18 | https://nodejs.org |
| npm | bundled with Node | — |
| Git | any | https://git-scm.com |
| Python 3 | >= 3.9 (optional, for Python hooks) | https://python.org |
| Claude Code CLI | latest | `npm install -g @anthropic/claude-code` |

**Windows only — poppler (for PDF reading):**
```powershell
# Download from https://github.com/oschwartz10612/poppler-windows/releases
# Extract to C:\Users\<you>\poppler\
# Add C:\Users\<you>\poppler\poppler-24.08.0\Library\bin to PATH
```

---

## Step 1 — Restore ~/.claude

```bash
# Option A: Clone private repo directly (full restore)
git clone https://github.com/Manoj-777/claude-dotfiles-private.git ~/.claude

# Option B: Merge into existing ~/.claude
git clone https://github.com/Manoj-777/claude-dotfiles-private.git /tmp/cdotfiles
cp -r /tmp/cdotfiles/skills ~/.claude/
cp -r /tmp/cdotfiles/agents ~/.claude/
cp -r /tmp/cdotfiles/rules ~/.claude/
cp -r /tmp/cdotfiles/commands ~/.claude/
cp -r /tmp/cdotfiles/hooks ~/.claude/
cp -r /tmp/cdotfiles/mcp-configs ~/.claude/
cp /tmp/cdotfiles/CLAUDE.md ~/.claude/
cp /tmp/cdotfiles/settings.json ~/.claude/
```

---

## Step 2 — Install ECC (Everything Claude Code)

ECC is the source repo for all skills, agents, and hooks. The ~/.claude files were installed FROM ECC.

```bash
# Clone ECC
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
npm install

# Install with developer + security + research profiles
node scripts/install-apply.js --profile developer --with capability:security --with capability:research

# Verify everything is installed
node scripts/list-installed.js
node scripts/doctor.js
```

**Available profiles:**

| Profile | What it includes |
|---------|-----------------|
| `core` | Skills + rules only (minimal) |
| `developer` | Core + agents + commands + hooks |
| `security` | Security skills + security-reviewer agent |
| `research` | Research/deep-dive skills |
| `full` | Everything |

**List all available components before installing:**
```bash
node scripts/install-plan.js --list-components
node scripts/install-plan.js --list-modules
node scripts/install-plan.js --profile developer
```

---

## Step 3 — Configure MCP Servers

MCP servers extend Claude's capabilities with real tools (GitHub, browser, search, databases).
Add them to `~/.claude.json` (not `~/.claude/settings.json`).

### Locate / Create ~/.claude.json

```bash
# Windows
notepad %USERPROFILE%\.claude.json

# Mac/Linux
nano ~/.claude.json
```

### Recommended Starter MCP Set

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
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
      "env": {
        "EXA_API_KEY": "YOUR_EXA_KEY_HERE"
      }
    }
  }
}
```

### Full MCP Reference (all available in mcp-configs/mcp-servers.json)

| Server | Purpose | Needs Token? |
|--------|---------|-------------|
| `github` | PRs, issues, repos, code search | Yes — GitHub PAT |
| `context7` | Live library/framework docs lookup | No |
| `sequential-thinking` | Chain-of-thought reasoning | No |
| `playwright` | Browser automation and testing | No |
| `exa-web-search` | Web search and research | Yes — Exa API key |
| `firecrawl` | Web scraping and crawling | Yes — Firecrawl key |
| `supabase` | Supabase database operations | Yes — project ref |
| `memory` | Persistent memory across sessions | No |
| `vercel` | Vercel deployments and projects | No (HTTP) |
| `railway` | Railway deployments | No |
| `cloudflare-docs` | Cloudflare documentation search | No (HTTP) |
| `cloudflare-workers-builds` | Workers builds | No (HTTP) |
| `cloudflare-workers-bindings` | Workers bindings | No (HTTP) |
| `cloudflare-observability` | Cloudflare logs/observability | No (HTTP) |
| `clickhouse` | ClickHouse analytics queries | No (HTTP) |
| `magic` | Magic UI components | No |
| `filesystem` | Local file operations | No |
| `fal-ai` | AI image/video/audio generation | Yes — Fal key |
| `browserbase` | Cloud browser sessions | Yes — Browserbase key |
| `browser-use` | AI browser agent | Yes — Browser-Use key |
| `confluence` | Confluence pages search/read | Yes — Confluence token |
| `token-optimizer` | Token compression (95%+ reduction) | No |
| `insaits` | AI security monitoring (local) | No |

> Keep under 10 MCPs active at once — each consumes context window.

### Where to Get API Keys

| Key | Where |
|-----|-------|
| GitHub PAT | github.com > Settings > Developer Settings > Personal Access Tokens |
| Exa | exa.ai > Dashboard > API Keys |
| Firecrawl | firecrawl.dev > Dashboard |
| Fal.ai | fal.ai > Dashboard > API Keys |
| Browserbase | browserbase.com > Dashboard |
| Browser-Use | browser-use.com > Dashboard |
| Confluence | Atlassian account > API Tokens |

---

## Step 4 — Verify settings.json

`~/.claude/settings.json` controls hooks, model, and permissions.
After cloning from this repo it is ready to use.

**Active configuration:**
- Model: `sonnet` (Claude Sonnet 4.6)
- Plugin: ECC plugin enabled
- Hooks: 3 active (Python format, git safety, session detect)

**To add bash command permissions (so Claude doesn't prompt every time):**
```json
"permissions": {
  "allow": [
    "Bash(npm run:*)",
    "Bash(python:*)",
    "Bash(node tests/:*)"
  ]
}
```

---

## Step 5 — Run Tests to Verify Everything Works

```bash
cd ~/everything-claude-code
node tests/run-all.js
```

Expected: **1194 tests, 0 failures**

**Individual health checks:**
```bash
# Validate all 94 skills are Anthropic-compliant
node scripts/ci/validate-skill-descriptions.js

# Full CI suite
node scripts/ci/validate-agents.js
node scripts/ci/validate-commands.js
node scripts/ci/validate-rules.js
node scripts/ci/validate-skills.js
node scripts/ci/validate-hooks.js

# ECC install health
node scripts/doctor.js

# List installed components
node scripts/list-installed.js
```

---

## What Is Installed

### Skills (94 total)

All skills comply with Anthropic's official skill guide:
- Trigger phrases in every description ("Use when...", "Use for...")
- YAML frontmatter with `name`, `description`, `license`, `version`, `metadata`
- Descriptions under 1024 characters
- No XML angle brackets in frontmatter
- Negative triggers on broad skills to prevent over-triggering

**By category:**

| Category | Skills |
|----------|--------|
| Python | `python-patterns`, `python-testing` |
| Go | `golang-patterns`, `golang-testing` |
| Kotlin | `kotlin-patterns`, `kotlin-testing`, `kotlin-coroutines-flows`, `kotlin-ktor-patterns`, `kotlin-exposed-patterns`, `compose-multiplatform-patterns`, `android-clean-architecture` |
| Swift | `swiftui-patterns`, `swift-concurrency-6-2`, `swift-actor-persistence`, `swift-protocol-di-testing`, `foundation-models-on-device` |
| Java/Spring | `java-coding-standards`, `springboot-patterns`, `springboot-tdd`, `springboot-verification`, `springboot-security`, `jpa-patterns` |
| Django | `django-patterns`, `django-tdd`, `django-verification`, `django-security` |
| Perl | `perl-patterns`, `perl-testing`, `perl-security` |
| C++ | `cpp-coding-standards`, `cpp-testing` |
| Backend/Infra | `backend-patterns`, `api-design`, `database-migrations`, `postgres-patterns`, `clickhouse-io`, `docker-patterns`, `deployment-patterns`, `e2e-testing`, `coding-standards` |
| Security | `security-scan`, `security-review`, `django-security`, `springboot-security`, `perl-security` |
| AI/LLM | `claude-api`, `eval-harness`, `cost-aware-llm-pipeline`, `regex-vs-llm-structured-text`, `continuous-learning`, `continuous-learning-v2`, `agent-harness-construction`, `agentic-engineering`, `ai-first-engineering`, `autonomous-loops`, `continuous-agent-loop`, `enterprise-agent-ops` |
| Workflow | `tdd-workflow`, `verification-loop`, `iterative-retrieval`, `strategic-compact`, `search-first`, `deep-research`, `blueprint`, `skill-stocktake`, `configure-ecc` |

### Agents (18)

| Agent | Purpose |
|-------|---------|
| `planner` | Implementation planning for complex features |
| `architect` | System design and architectural decisions |
| `tdd-guide` | Test-driven development enforcement |
| `code-reviewer` | Code quality review |
| `security-reviewer` | Security analysis before commits |
| `build-error-resolver` | Fix build/compile errors |
| `e2e-runner` | E2E test generation and execution |
| `refactor-cleaner` | Dead code cleanup and refactoring |
| `doc-updater` | Documentation updates |
| `python-reviewer` | Python-specific code review |
| `go-reviewer` | Go-specific code review |
| `kotlin-reviewer` | Kotlin-specific code review |
| `database-reviewer` | Database schema/query review |
| `chief-of-staff` | Orchestration and task coordination |
| `harness-optimizer` | Agent harness performance tuning |
| `loop-operator` | Continuous loop management |
| `go-build-resolver` | Go build error resolution |
| `kotlin-build-resolver` | Kotlin/Gradle build error resolution |

### Slash Commands (40+)

| Command | What it does |
|---------|-------------|
| `/tdd` | Enforce test-driven development workflow |
| `/plan` | Generate implementation plan |
| `/e2e` | Generate and run E2E tests |
| `/code-review` | Full code quality review |
| `/build-fix` | Fix build errors |
| `/verify` | Run verification loop |
| `/learn` | Extract reusable patterns from session |
| `/skill-create` | Generate new skill from git history |
| `/claw` | Start NanoClaw persistent REPL |
| `/orchestrate` | Multi-agent orchestration |
| `/sessions` | Session management |
| `/checkpoint` | Save session checkpoint |
| `/eval` | Run evaluation harness |
| `/evolve` | Analyze and improve instincts |
| `/prompt-optimize` | Optimize a prompt |
| `/quality-gate` | Run quality gate checks |
| `/refactor-clean` | Clean up dead code |
| `/update-docs` | Update documentation |
| `/test-coverage` | Check test coverage |
| `/python-review` | Python-specific review |
| `/go-review` | Go-specific review |
| `/kotlin-review` | Kotlin-specific review |

### Hooks (Active)

| Hook | Fires on | What it does |
|------|----------|-------------|
| `post-edit-python-format.sh` | After Edit/Write | Auto-formats Python files with black/ruff |
| `pre-bash-git-safety.sh` | Before Bash | Warns on destructive git operations |
| `session-start-project-detect.sh` | Session start | Detects project type and loads context |

### Rules

Located in `~/.claude/rules/`:

| Directory | Covers |
|-----------|--------|
| `common/` | Coding style, git workflow, testing, security, performance, patterns, hooks, agents |
| `typescript/` | TypeScript/JavaScript/React/Node.js specific |
| `python/` | Python specific |
| `golang/` | Go specific |
| `kotlin/` | Kotlin specific |
| `swift/` | Swift specific |
| `php/` | PHP specific |

---

## Best Practices Applied (Anthropic Skill Guide)

Work done to comply with "The Complete Guide to Building Skills for Claude":

| Practice | Details |
|----------|---------|
| Trigger phrases | Added "Use when..." / "Use for..." to all 63 skills that were missing them |
| Metadata fields | Added `license: MIT`, `version: 1.0.0`, `metadata.author` to 86 skills |
| Negative triggers | Added "Do NOT use for..." to 4 broad skills to prevent over-triggering |
| CI validator | `scripts/ci/validate-skill-descriptions.js` runs in `npm test` pipeline |
| Compliance test suite | `tests/skills/skill-compliance.test.js` — 12 assertions, all passing |
| Fixed malformed skills | Fixed `blueprint` and `prompt-optimizer` which had empty block scalar descriptions |
| Fixed missing name field | Added `name: skill-stocktake` which was missing entirely |

---

## Keeping Up to Date

```bash
# Pull latest ECC updates
cd ~/everything-claude-code
git pull
npm install
node scripts/install-apply.js --profile developer --with capability:security --with capability:research

# Commit ~/.claude changes to both repos
cd ~/.claude
git add .
git commit -m "chore: sync $(date +%Y-%m-%d)"
git push private master:main      # private repo (everything)

# Update public repo (sanitize first if settings changed)
git checkout public
git merge master
# review for any new personal paths in settings.json
git push public public:main
git checkout master
```
