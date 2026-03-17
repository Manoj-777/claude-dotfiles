# Claude Dotfiles

Production-ready Claude Code configuration — 94 skills, agents, rules, hooks, and MCP configs built and refined through intensive daily use.

## What's Inside

| Folder | Contents |
|--------|----------|
| `skills/` | 94 skills covering Python, Go, Kotlin, Swift, Django, Spring Boot, Docker, Postgres, security, TDD, and more |
| `agents/` | Specialized subagents — planner, code-reviewer, tdd-guide, security-reviewer, architect, and more |
| `rules/` | Always-on coding standards, security guidelines, git workflow, testing requirements |
| `commands/` | Slash commands — `/tdd`, `/plan`, `/e2e`, `/code-review`, `/build-fix`, and more |
| `hooks/` | Trigger-based automations — session persistence, pre-commit safety, auto-format |
| `mcp-configs/` | MCP server configuration templates |
| `scripts/` | Utility scripts for hooks and setup |

## Quick Install

```bash
# Clone to ~/.claude
git clone https://github.com/Manoj-777/claude-dotfiles.git ~/.claude

# Or if you already have a ~/.claude folder, merge selectively:
git clone https://github.com/Manoj-777/claude-dotfiles.git /tmp/claude-dotfiles
cp -r /tmp/claude-dotfiles/skills ~/.claude/
cp -r /tmp/claude-dotfiles/agents ~/.claude/
cp -r /tmp/claude-dotfiles/rules ~/.claude/
cp -r /tmp/claude-dotfiles/commands ~/.claude/
cp -r /tmp/claude-dotfiles/hooks ~/.claude/
```

## Skills Highlights

All 94 skills follow [Anthropic's official skill guide](https://anthropic.com) best practices:
- Trigger phrases in every description so Claude knows when to activate them
- YAML frontmatter with `name`, `description`, `license`, `version`, `metadata`
- No XML angle brackets, descriptions under 1024 characters

Language coverage: Python · Go · Kotlin · Swift · Java · Spring Boot · Django · Perl · C++ · Android  
Domain coverage: TDD · Security · Docker · Postgres · ClickHouse · API Design · Deployment · Agents · LLM pipelines

## Customization

Edit `CLAUDE.md` to add your own engineering context and project-specific rules.  
Edit `settings.json` to configure hooks, permissions, and plugins for your setup.

## Based On

Built on top of [Everything Claude Code (ECC)](https://github.com/affaan-m/everything-claude-code) with additional fixes and Anthropic skill guide compliance applied.
