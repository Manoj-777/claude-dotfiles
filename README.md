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
| `SETUP_GUIDE.md` | Detailed setup guide with all steps, MCP keys, and verification commands |

---

## Getting Started

Follow these steps in order on a new machine.

### Step 1 — Install prerequisites

| Tool | Install |
|------|---------|
| Node.js >= 18 | https://nodejs.org |
| Git | https://git-scm.com |
| Claude Code CLI | `npm install -g @anthropic/claude-code` |

> **Windows only (for PDF reading):** Download [poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases), extract it, and add the `bin/` folder to your PATH.

### Step 2 — Clone this repo into ~/.claude

```bash
# Option A: Fresh machine (no existing ~/.claude)
git clone https://github.com/Manoj-777/claude-dotfiles.git ~/.claude

# Option B: You already have ~/.claude — merge selectively
git clone https://github.com/Manoj-777/claude-dotfiles.git /tmp/cdotfiles
cp -r /tmp/cdotfiles/skills ~/.claude/
cp -r /tmp/cdotfiles/agents ~/.claude/
cp -r /tmp/cdotfiles/rules ~/.claude/
cp -r /tmp/cdotfiles/commands ~/.claude/
cp -r /tmp/cdotfiles/hooks ~/.claude/
cp -r /tmp/cdotfiles/mcp-configs ~/.claude/
cp /tmp/cdotfiles/CLAUDE.md ~/.claude/
cp /tmp/cdotfiles/settings.json ~/.claude/
```

### Step 3 — Install ECC (Everything Claude Code)

ECC is the source framework these dotfiles are built on. It provides the installer, test suite, and update tooling.

```bash
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
npm install

# Install with the recommended profiles (developer + security + research)
node scripts/install-apply.js --profile developer --with capability:security --with capability:research
```

Available profiles — choose what fits your workflow:

| Profile | What it installs |
|---------|-----------------|
| `core` | Skills + rules only (minimal) |
| `developer` | Core + agents + commands + hooks (recommended) |
| `security` | Security skills + security-reviewer agent |
| `research` | Deep research and retrieval skills |
| `full` | Everything |

Not sure what's included? Preview before installing:
```bash
node scripts/install-plan.js --profile developer
node scripts/install-plan.js --list-components
```

### Step 4 — Configure MCP Servers

MCP servers give Claude real tools — GitHub, browser automation, web search, databases, and more.

Create or edit `~/.claude.json` (this is separate from `~/.claude/settings.json`):

```bash
# Windows
notepad %USERPROFILE%\.claude.json

# Mac / Linux
nano ~/.claude.json
```

Paste this starter configuration and replace the placeholder tokens:

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

Where to get API keys:

| Key | Where to get it |
|-----|----------------|
| GitHub PAT | github.com > Settings > Developer Settings > Personal Access Tokens > Fine-grained |
| Exa | exa.ai > Dashboard > API Keys |
| Firecrawl | firecrawl.dev > Dashboard |
| Fal.ai | fal.ai > Dashboard > API Keys |

> Keep under 10 MCPs active at once — each consumes context window.

See `mcp-configs/mcp-servers.json` for the full list of 25+ server configs.

### Step 5 — Verify everything works

```bash
cd everything-claude-code

# Run full test suite — should show 1194 tests, 0 failures
node tests/run-all.js

# Check ECC install health
node scripts/doctor.js

# Validate all 94 skills are compliant
node scripts/ci/validate-skill-descriptions.js

# See what's installed
node scripts/list-installed.js
```

Then open Claude Code and try a slash command like `/plan` or `/tdd` to confirm skills and commands are loading.

---

## All Available MCP Servers

Full reference from `mcp-configs/mcp-servers.json`:

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

---

## Skills (94 total)

All skills comply with Anthropic's official skill guide:
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

**CLAUDE.md** — Edit to add your engineering context, workflow preferences, and project-specific rules.

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
cp -r rules/golang ~/.claude/rules/golang
```

---

## Keeping Up to Date

```bash
# Pull latest ECC updates
cd everything-claude-code
git pull && npm install
node scripts/install-apply.js --profile developer --with capability:security --with capability:research

# Backup your ~/.claude changes
cd ~/.claude
git add . && git commit -m "chore: sync $(date +%Y-%m-%d)"
git push origin main
```

---

## Based On

Built on [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) with:
- All 94 skills updated to comply with Anthropic's official skill guide
- CI validator added to the test pipeline
- Skill compliance test suite (12 assertions, 1194 total tests passing)
- Negative triggers on broad skills to prevent over-triggering
- Complete MCP server reference with 25+ servers

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for the full detailed guide.
