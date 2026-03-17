#!/usr/bin/env bash
# Check for ECC updates once per week.
# Writes a timestamp file after checking — skips if checked within 7 days.

STAMP_FILE="$HOME/.claude/cache/ecc-update-check.txt"
ECC_DIR=""

# Find ECC installation
for d in \
  "$HOME/everything-claude-code" \
  "$HOME/Downloads/everything-claude-code" \
  "$HOME/dev/everything-claude-code"; do
  if [ -f "$d/package.json" ] && grep -q "ecc-universal" "$d/package.json" 2>/dev/null; then
    ECC_DIR="$d"
    break
  fi
done

[ -z "$ECC_DIR" ] && exit 0

# Skip if checked within the last 7 days
if [ -f "$STAMP_FILE" ]; then
  last=$(cat "$STAMP_FILE")
  now=$(date +%s)
  diff=$(( now - last ))
  [ "$diff" -lt 604800 ] && exit 0
fi

# Record check time
mkdir -p "$(dirname "$STAMP_FILE")"
date +%s > "$STAMP_FILE"

# Check for upstream updates
cd "$ECC_DIR" || exit 0
git fetch origin --quiet 2>/dev/null || exit 0

LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null)

if [ "$LOCAL" != "$REMOTE" ] && [ -n "$REMOTE" ]; then
  echo "" >&2
  echo "[ECC Update Available] A newer version of Everything Claude Code is available." >&2
  echo "  Run: cd $ECC_DIR && git pull && npm install" >&2
  echo "  Then: node scripts/install-apply.js --profile developer --with capability:security --with capability:research" >&2
  echo "" >&2
fi
