# Claude Dotfiles

Production-ready Claude Code configuration — 95 skills, 18 agents, 40+ commands, hooks, rules, and MCP configs built and refined through intensive daily use.

All skills fully comply with Anthropic's official skill guide best practices.

---

## What's Inside

| Folder / File | Contents |
|---------------|----------|
| `skills/` | 95 skills — Python, Go, Kotlin, Swift, Java, Django, Docker, Postgres, security, TDD, AI/LLM, and more |
| `agents/` | 18 specialized subagents — planner, code-reviewer, tdd-guide, security-reviewer, architect, and more |
| `rules/` | Always-on coding standards — security, git workflow, testing requirements, coding style |
| `commands/` | 40+ slash commands — `/tdd`, `/plan`, `/new-project`, `/e2e`, `/code-review`, and more |
| `hooks/` | 5 trigger-based automations — auto-format, git safety, project detection, dotfiles sync, ECC update check |
| `mcp-configs/` | 25+ MCP server templates + token reference guide |
| `memory/` | Living user profile (`PROFILE.md`) — auto-loaded at session start, updated across sessions |
| `CLAUDE.md` | Global instructions for Claude — workflow, lesson capture rules, coding standards |
| `SETUP_GUIDE.md` | Full setup guide with MCP keys, install steps, and verification commands |

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

Available profiles:

| Profile | What it installs |
|---------|-----------------|
| `core` | Skills + rules only (minimal) |
| `developer` | Core + agents + commands + hooks (recommended) |
| `security` | Security skills + security-reviewer agent |
| `research` | Deep research and retrieval skills |
| `full` | Everything |

Preview before installing:
```bash
node scripts/install-plan.js --profile developer
node scripts/install-plan.js --list-components
```

### Step 4 — Configure MCP Servers

MCP servers give Claude real tools — GitHub, browser automation, web search, databases, and more.
Add them to `~/.claude.json` (separate from `~/.claude/settings.json`):

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

> Keep under 10 MCPs active at once — each consumes context window.

See `mcp-configs/mcp-servers.json` for all 25+ server configs.
See `mcp-configs/mcp-tokens-reference.md` for where to get every API key and a new-machine checklist.

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

Then open Claude Code and try `/plan` or `/tdd` to confirm skills and commands are loading.

---

## All Available MCP Servers

Full reference in `mcp-configs/mcp-servers.json` | Token guide in `mcp-configs/mcp-tokens-reference.md`

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
- CI validator + compliance test suite (1194 tests, 0 failures)

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

Agents use a 3-tier model strategy: **Opus** for complex reasoning, **Sonnet** for standard work, **Haiku** for mechanical tasks.

| Agent | Model | When to use |
|-------|-------|-------------|
| `architect` | Opus | System design, technology decisions |
| `planner` | Opus | Complex features, multi-step tasks |
| `chief-of-staff` | Opus | Orchestration and coordination |
| `code-reviewer` | Sonnet | After writing code |
| `tdd-guide` | Sonnet | New features, bug fixes (write tests first) |
| `security-reviewer` | Sonnet | Before commits, auth/API code |
| `e2e-runner` | Sonnet | Critical user flows |
| `database-reviewer` | Sonnet | Schema and query review |
| `go-reviewer` | Sonnet | Go-specific review |
| `kotlin-reviewer` | Sonnet | Kotlin-specific review |
| `python-reviewer` | Sonnet | Python-specific review |
| `refactor-cleaner` | Sonnet | Dead code cleanup |
| `harness-optimizer` | Sonnet | Agent harness tuning |
| `loop-operator` | Sonnet | Continuous loop management |
| `doc-updater` | Haiku | Updating documentation |
| `build-error-resolver` | Haiku | When build or compile fails |
| `go-build-resolver` | Haiku | Go build error resolution |
| `kotlin-build-resolver` | Haiku | Kotlin/Gradle build error resolution |

---

## Slash Commands

```
/new-project      Bootstrap new project (tasks/, CLAUDE.md, lessons.md)
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

5 hooks active across the session lifecycle:

| Hook | Event | What it does |
|------|-------|-------------|
| `session-start-project-detect.sh` | SessionStart | Detects project type and loads context |
| `session-start-ecc-update-check.sh` | SessionStart | Checks for ECC updates once per week, prints reminder if behind |
| `pre-bash-git-safety.sh` | PreToolUse (Bash) | Warns on destructive git operations |
| `post-edit-python-format.sh` | PostToolUse (Edit/Write) | Auto-formats Python files |
| `stop-dotfiles-sync.sh` | Stop | Auto-commits any ~/.claude changes after each response (local only) |

---

## Self-Improvement Loop

Lessons are captured automatically and loaded on every session start:

- **Auto-captured**: corrections, mid-session fixes, self-discovered mistakes, wrong assumptions
- **Stored at**: `<project-root>/tasks/lessons.md` (project-specific)
- **Loaded on**: every `SessionStart` via the `session-start-lessons.js` hook
- **Promoted globally**: use `/promote` to push project lessons to `~/.claude/CLAUDE.md`
- **End-of-session**: run `/learn` to extract additional patterns from the full session

---

## Living User Profile

Claude maintains a living profile of you across sessions:

- **Stored at**: `~/.claude/memory/PROFILE.md`
- **Auto-loaded**: every session start via a `SessionStart` hook in `settings.json`
- **Updated by**: the `user-profile` skill — triggered when new preferences, corrections, or patterns are observed
- **Covers**: identity, tech stack, work methodology, communication preferences, recurring patterns, current setup, learning history
- **Private**: `memory/` is gitignored from the public repo — only backed up in your private dotfiles

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

ECC updates are checked automatically every week at session start. To update manually:

```bash
cd everything-claude-code
git pull && npm install
node scripts/install-apply.js --profile developer --with capability:security --with capability:research
```

Your `~/.claude` changes are auto-committed locally after each session. To push to your backup repo:
```bash
cd ~/.claude
git push origin main
```

---

## Based On

Built on [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) with:
- All 94 skills updated to comply with Anthropic's official skill guide
- 3-tier model strategy (Haiku / Sonnet / Opus) aligned across all 18 agents
- Self-improvement loop with automatic lesson capture and session-start loading
- Auto dotfiles sync hook — commits `~/.claude` changes after every session
- Weekly ECC update check at session start
- `/new-project` command to bootstrap any new project
- MCP token reference guide for new machine setup
- CI validator + compliance test suite (1194 tests, 0 failures)

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for the full detailed guide.
