#!/usr/bin/env bash
# Auto-format Python files after Claude edits them
# Runs ruff format + ruff check --fix

input=$(cat)
file_path=$(echo "$input" | python -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Only run on .py files
if [[ "$file_path" == *.py ]] && [[ -f "$file_path" ]]; then
    python -m ruff format "$file_path" 2>/dev/null
    python -m ruff check --fix --quiet "$file_path" 2>/dev/null
fi

echo "$input"
