---
name: user-profile
description: Maintain and consult the user's living profile at ~/.claude/memory/PROFILE.md. Use when starting a session, discovering new preferences, observing recurring patterns, or when the user corrects something about how Claude understands them.
origin: custom
license: MIT
version: 1.0.0
metadata:
  author: Manoj
---

# user-profile

Maintains a living profile of the user — their identity, preferences, methodology, communication style, and learned patterns. Keeps Claude contextually aware across sessions without requiring repeated explanations.

## When to Read

- At every session start (loaded automatically via hook)
- When the user mentions a preference, tool choice, or working style
- When about to make an assumption about the user's stack or preferences
- When deciding how to communicate (verbosity, tone, format)

## When to Update

Update `~/.claude/memory/PROFILE.md` whenever any of the following are observed:

| Trigger | Section to update |
|---------|-----------------|
| User corrects a wrong assumption about their stack | Tech Stack & Preferences |
| User expresses a preference for how Claude should behave | Communication Preferences |
| A new recurring pattern is observed | Recurring Patterns Observed |
| User mentions a new tool, language, or technology they use | Tech Stack & Preferences |
| A mistake is made and fixed — and it's about misunderstanding the user | Learning History |
| User's current focus or active project changes | Current Setup |
| A new insight about how the user approaches problems | Work Methodology |

## How to Update

1. Read the current `~/.claude/memory/PROFILE.md`
2. Identify the correct section — do NOT add to the wrong section
3. Append or update the relevant entry — do not duplicate existing entries
4. Keep entries concise — one clear sentence per insight
5. Add date to Learning History entries: `- **YYYY-MM-DD**: what was learned`
6. Never remove existing entries unless they are factually wrong — mark corrections inline

## Profile Structure

```
PROFILE.md
├── Identity & Background       — who the user is
├── Technical Stack & Preferences — languages, tools, frameworks they use/prefer
├── Work Methodology            — how they approach problems and expect Claude to behave
├── Communication Preferences   — how they want responses formatted and delivered
├── Recurring Patterns Observed — behaviors and preferences seen across sessions
├── Current Setup               — active tools, repos, environment state
└── Learning History            — dated log of corrections and discovered patterns
```

## Important Rules

- Never overwrite sections — only append or update specific entries
- Never add speculative entries — only record observed, confirmed information
- Keep the profile factual — not aspirational or prescriptive
- The profile is private — only in `~/.claude/memory/` which is excluded from public repos
- If unsure whether something is worth adding — add it, it can always be trimmed later

## Example Update

If the user says "I prefer pytest over unittest":

```markdown
## Technical Stack & Preferences
...
**Testing preferences:**
- Python: pytest (not unittest)
```

If Claude assumed the user was on Mac but they corrected it to Windows:

```markdown
## Learning History
- **2026-03-17**: User is on Windows 11, not Mac — bash via Git Bash, use Windows paths when relevant
```
