---
description: Bootstrap a new project with tasks/, CLAUDE.md, and .claude/ structure. Use when starting a new project from scratch to set up all the standard scaffolding.
---

# /new-project — Project Bootstrap

Scaffolds the standard project structure so every new project starts with task tracking, lesson capture, and Claude context ready to go.

## What It Creates

```
<project-root>/
├── CLAUDE.md                  # Project-specific Claude instructions
├── tasks/
│   ├── todo.md                # Task tracking
│   └── lessons.md             # Learned patterns (starts empty)
└── .claude/
    └── settings.local.json    # Project-level Claude settings (optional)
```

## Steps

1. Confirm the current working directory is the project root
2. Create `CLAUDE.md` from the template below — ask the user to fill in the project-specific sections
3. Create `tasks/todo.md` with the standard structure
4. Create `tasks/lessons.md` (empty, ready to capture learnings)
5. Ask if a `git init` is needed (skip if already a git repo)
6. Summarize what was created

## CLAUDE.md Template

```markdown
# CLAUDE.md

## Project Overview

[Brief description of what this project does and who it's for]

## Tech Stack

- **Languages**:
- **Frameworks**:
- **Cloud & Infrastructure**:
- **Databases**:
- **External Integrations**:
- **Dev Tools**:

## Architecture

[How the system fits together — key components and data flow]

## Project Structure

[Folder layout and what lives where]

## Project-Specific Rules

- [Any naming conventions, required patterns, files never to modify]

## Environment & Config

- Environment variables: [.env / AWS SSM / other]
- Never hardcode environment-specific values

## Known Gotchas

- [Hard-won lessons specific to this project]

## How to Run & Test

```bash
# Install
# Run locally
# Run tests
# Deploy
```

## Current Focus

- **Active task**:
- **In scope**:
- **Out of scope**:
- **Open questions**:
```

## tasks/todo.md Template

```markdown
# Tasks

## In Progress

- [ ]

## Up Next

- [ ]

## Done

## Notes
```

## tasks/lessons.md Template

```markdown
# Lessons Learned

Patterns and mistakes captured during this project to prevent repetition.

---
```

## Important

- Never overwrite an existing `CLAUDE.md` or `tasks/` folder — ask the user first
- After creating the files, remind the user to fill in the Tech Stack and Architecture sections in `CLAUDE.md` before starting work
