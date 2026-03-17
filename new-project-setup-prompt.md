# Claude Code — New Project Setup Prompt

> Paste this into Claude Code as your first prompt in any new project directory.

---

Analyze this codebase and set up Claude Code for optimal project-specific performance:

1. **CLAUDE.md** — Create at project root with:
   - Project overview (what it does, current status)
   - Tech stack (languages, frameworks, cloud, databases)
   - Architecture (data flow, key design decisions, component relationships)
   - Key files table (file -> purpose, only non-obvious ones)
   - Commands (install, run locally, test, deploy — exact commands that work)
   - Configuration (where settings live, env vars, what overrides what)
   - Project-specific rules (what NOT to do is more important than what to do — anti-patterns, forbidden shortcuts, mandatory patterns)
   - Known gotchas (things that will break if missed)
   - Deployment (CI/CD, infra, environments)

2. **tasks/lessons.md** — Create at project root with:
   - Seed it with any existing gotchas or inconsistencies you discover while analyzing the codebase
   - Format: category heading + bullet points explaining the trap and the correct approach

3. **Auto-memory** — Write a MEMORY.md to the project memory directory with:
   - Project identity (one-liner + stack)
   - Key architecture patterns
   - Critical files list
   - My preferences (from global CLAUDE.md)

4. **.claudeignore** — Create at project root:
   - Archived/old code directories
   - Large reference docs that aren't needed for daily coding
   - Binary assets, build artifacts, caches

Rules for the CLAUDE.md:
- Be specific, not generic. "Port is 5000 not 8000" is useful. "Use good naming" is not.
- Focus on what's NOT obvious — things that require reading multiple files to understand
- Include actual working commands, not placeholders
- The rules section should prevent real mistakes, not repeat coding 101
