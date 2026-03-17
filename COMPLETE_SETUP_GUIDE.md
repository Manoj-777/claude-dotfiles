# Claude Code — Complete Setup Guide

> Follow this guide to recreate the full Claude Code setup on any new machine.
> Last updated: 2026-03-17

---

## 1. Prerequisites

```bash
# Python 3.11+
python --version

# Node.js (for MCP servers)
node --version
npm --version

# AWS CLI (for AWS projects)
aws --version

# Git
git --version
```

---

## 2. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

---

## 3. Global CLAUDE.md (~/.claude/CLAUDE.md)

This controls Claude's behavior across ALL projects. Create it at `~/.claude/CLAUDE.md`.

Key sections to include:
- **Workflow Orchestration**: Plan first, use subagents, self-improvement loop, verify before done
- **Task Management**: Use `tasks/todo.md` and `tasks/lessons.md` at project root
- **Coding Standards**: Error handling, input validation, no hardcoded values, readability
- **Core Principles**: Simplicity first, no laziness, minimal impact, no assumptions

> See your actual file for the full content. This is the most important file — it shapes all behavior.

---

## 4. ECC Plugin (Everything Claude Code)

Adds 100+ skills, agents, and hooks.

```bash
# Install from marketplace (run inside Claude Code)
/install-plugin everything-claude-code
```

Or verify in `~/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  },
  "autoUpdatesChannel": "latest",
  "model": "opus"
}
```

### Key ECC skills for daily use

| Command | When to use | Plain English |
|---------|-------------|---------------|
| `/plan` | Before multi-step tasks | "plan this feature" |
| `/tdd` | New features or bug fixes | "let's do TDD" |
| `/python-review` | After writing code | "review my code" |
| `/security-review` | Auth, inputs, credentials | "is this secure?" |
| `/verification-loop` | Before marking work done | "verify everything" |
| `/docker-patterns` | Docker/ECS configs | "help with Docker" |
| `/deployment-patterns` | CI/CD changes | "fix the deployment" |
| `/search-first` | Before building something | "is there a library for this?" |
| `/backend-patterns` | API architecture | "best way to structure this" |
| `/simplify` | After completing changes | "clean this up" |

Auto-triggered agents (no action needed):
- `python-reviewer` — after Python code changes
- `security-reviewer` — when touching auth/input/APIs
- `build-error-resolver` — when builds fail
- `planner` — for complex feature planning

Full cheat sheet: `~/.claude/ecc-cheatsheet.md`

---

## 5. MCP Servers

These extend what Claude Code can do. Install globally (user-level).

### Context7 — Live library docs
```bash
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
```

### Playwright — Browser testing
```bash
claude mcp add playwright -s user -- npx -y @playwright/mcp@latest
```

### GitHub — PR/issue management
```bash
# Get token: https://github.com/settings/tokens (scopes: repo, read:org, read:user)
claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=<your-token> -- npx -y @modelcontextprotocol/server-github@latest
```

### AWS Docs — AWS documentation lookup
```bash
claude mcp add aws-docs -s user -- uvx awslabs.aws-documentation-mcp-server@latest
```

### SQLite — Database operations
```bash
claude mcp add sqlite -s user -- npx -y mcp-sqlite@latest
```

### Exa — AI-powered web search
```bash
# Get key: https://dashboard.exa.ai (free tier: 1000 searches/month)
claude mcp add exa -s user -e EXA_API_KEY=<your-key> -- npx -y exa-mcp-server@latest
```

### Verify all servers
```bash
claude mcp list
```

All 6 should show "Connected".

---

## 6. Hooks

### Install ruff (Python formatter/linter)
```bash
pip install ruff
```

### Create hook scripts

Create `~/.claude/hooks/` directory with these 3 files:

#### post-edit-python-format.sh
Auto-formats Python files after every edit.
```bash
#!/usr/bin/env bash
input=$(cat)
file_path=$(echo "$input" | python -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
if [[ "$file_path" == *.py ]] && [[ -f "$file_path" ]]; then
    python -m ruff format "$file_path" 2>/dev/null
    python -m ruff check --fix --quiet "$file_path" 2>/dev/null
fi
echo "$input"
```

#### pre-bash-git-safety.sh
Blocks destructive git commands.
```bash
#!/usr/bin/env bash
input=$(cat)
command=$(echo "$input" | python -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
if echo "$command" | grep -qE "git\s+push\s+.*--force|git\s+push\s+-f|git\s+reset\s+--hard|git\s+clean\s+-f|git\s+branch\s+-D"; then
    echo "WARN: Destructive git command detected: $command" >&2
    echo '{"decision":"block","reason":"Destructive git command detected. Please confirm with the user before proceeding."}'
    exit 0
fi
echo "$input"
```

#### session-start-project-detect.sh
Detects project type on session start.
```bash
#!/usr/bin/env bash
input=$(cat)
project_type=""
frameworks=""
primary=""
project_dir=$(pwd)
if ls *.py &>/dev/null || [ -f requirements.txt ] || [ -f pyproject.toml ]; then
    project_type="python"
fi
if [ -f requirements.txt ]; then
    if grep -qi "fastapi" requirements.txt 2>/dev/null; then
        frameworks="fastapi"; primary="fastapi"
    elif grep -qi "django" requirements.txt 2>/dev/null; then
        frameworks="django"; primary="django"
    elif grep -qi "flask" requirements.txt 2>/dev/null; then
        frameworks="flask"; primary="flask"
    fi
fi
if [ -n "$project_type" ]; then
    echo "Project type: {\"languages\":[\"$project_type\"],\"frameworks\":[\"$frameworks\"],\"primary\":\"$primary\",\"projectDir\":\"$project_dir\"}" >&2
fi
echo "$input"
```

### Register hooks in settings.json

Add to `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{"type": "command", "command": "bash ~/.claude/hooks/post-edit-python-format.sh"}],
        "description": "Auto-format Python files with ruff after edits"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "bash ~/.claude/hooks/pre-bash-git-safety.sh"}],
        "description": "Block destructive git commands without confirmation"
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [{"type": "command", "command": "bash ~/.claude/hooks/session-start-project-detect.sh"}],
        "description": "Detect project type and load context on session start"
      }
    ]
  }
}
```

---

## 7. Per-Project Setup

For each new project, paste this prompt into Claude Code:

> Full prompt saved at: `~/.claude/new-project-setup-prompt.md`

It creates:
- `CLAUDE.md` — project-specific rules, architecture, commands
- `tasks/lessons.md` — gotcha tracking
- Auto-memory — cross-session context
- `.claudeignore` — focus control
- `.gitignore` — proper exclusions
- `ruff.toml` — Python formatting config (for Python projects)

---

## 8. Files Summary

### Global (~/.claude/)
```
~/.claude/
├── CLAUDE.md                      # Global behavior rules
├── settings.json                  # ECC plugin, hooks, model config
├── settings.local.json            # Permission overrides
├── .claude.json                   # MCP server configs (auto-managed)
├── hooks/
│   ├── post-edit-python-format.sh # Auto-format Python on edit
│   ├── pre-bash-git-safety.sh     # Block dangerous git commands
│   └── session-start-project-detect.sh # Detect project type
├── new-project-setup-prompt.md    # Reusable setup prompt
├── ecc-cheatsheet.md              # ECC skills quick reference
├── COMPLETE_SETUP_GUIDE.md        # This file
└── projects/
    └── <project-hash>/
        └── memory/
            └── MEMORY.md          # Per-project cross-session memory
```

### Per-Project (project root)
```
<project>/
├── CLAUDE.md          # Project-specific rules + architecture
├── .claudeignore      # Files Claude should ignore
├── .gitignore         # Git exclusions
├── ruff.toml          # Python formatting config
└── tasks/
    ├── todo.md        # Current task plan
    └── lessons.md     # Gotchas and corrections
```

---

## 9. Quick Verification Checklist

After setting up on a new machine, verify:

```bash
# Claude Code installed
claude --version

# ECC plugin active
grep "everything-claude-code" ~/.claude/settings.json

# MCP servers connected
claude mcp list

# Hooks in place
ls ~/.claude/hooks/

# Ruff available
python -m ruff --version

# Global CLAUDE.md exists
cat ~/.claude/CLAUDE.md | head -5
```

---

## 10. Maintenance

- **Rotate API keys regularly**: GitHub token, Exa API key
- **Update MCP servers**: They auto-fetch `@latest` on each session
- **Update ECC**: Auto-updates via marketplace
- **Review lessons.md**: Each project accumulates learnings — review periodically
- **Update this guide**: When you add new MCP servers, hooks, or change workflow
