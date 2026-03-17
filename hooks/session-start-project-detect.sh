#!/usr/bin/env bash
# Detect project type on session start and output helpful context

input=$(cat)

project_type=""
frameworks=""
primary=""
project_dir=$(pwd)

# Detect Python
if ls *.py &>/dev/null || [ -f requirements.txt ] || [ -f pyproject.toml ]; then
    project_type="python"
fi

# Detect frameworks
if [ -f requirements.txt ]; then
    if grep -qi "fastapi" requirements.txt 2>/dev/null; then
        frameworks="fastapi"
        primary="fastapi"
    elif grep -qi "django" requirements.txt 2>/dev/null; then
        frameworks="django"
        primary="django"
    elif grep -qi "flask" requirements.txt 2>/dev/null; then
        frameworks="flask"
        primary="flask"
    fi
fi

if [ -f pyproject.toml ]; then
    if grep -qi "fastapi" pyproject.toml 2>/dev/null; then
        frameworks="fastapi"
        primary="fastapi"
    fi
fi

# Output as JSON for Claude Code
if [ -n "$project_type" ]; then
    echo "Project type: {\"languages\":[\"$project_type\"],\"frameworks\":[\"$frameworks\"],\"primary\":\"$primary\",\"projectDir\":\"$project_dir\"}" >&2
fi

echo "$input"
