#!/usr/bin/env bash
# Safety check before destructive git commands
# Blocks: force push, reset --hard, clean -f, branch -D without confirmation

input=$(cat)
command=$(echo "$input" | python -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

# Check for dangerous git commands
if echo "$command" | grep -qE "git\s+push\s+.*--force|git\s+push\s+-f|git\s+reset\s+--hard|git\s+clean\s+-f|git\s+branch\s+-D"; then
    echo "WARN: Destructive git command detected: $command" >&2
    echo '{"decision":"block","reason":"Destructive git command detected. Please confirm with the user before proceeding."}'
    exit 0
fi

echo "$input"
