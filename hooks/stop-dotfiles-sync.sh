#!/usr/bin/env bash
# Auto-commit ~/.claude changes after each session response.
# Only commits if there are actual changes — never pushes (push manually).

CLAUDE_DIR="$HOME/.claude"

cd "$CLAUDE_DIR" || exit 0

# Skip if not a git repo
git rev-parse --git-dir > /dev/null 2>&1 || exit 0

# Check for any changes (staged or unstaged), excluding runtime dirs
git add \
  agents/ rules/ skills/ commands/ hooks/ mcp-configs/ scripts/ \
  CLAUDE.md README.md SETUP_GUIDE.md settings.json \
  the-security-guide.md ecc-cheatsheet.md COMPLETE_SETUP_GUIDE.md \
  new-project-setup-prompt.md plugin.json AGENTS.md \
  .cursor/ .codex/ .opencode/ \
  2>/dev/null

# Only commit if something changed
if ! git diff --cached --quiet; then
  git commit -m "auto: sync dotfiles $(date -u +%Y-%m-%dT%H:%M:%SZ)" --quiet
  echo "[dotfiles-sync] Changes committed to ~/.claude" >&2
fi
