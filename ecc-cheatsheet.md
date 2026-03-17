# ECC Skills Cheat Sheet

> You don't need to memorize these. Just describe what you want and Claude picks the right skill.

## Slash Commands (you type these)

| Command | When to use | Plain English trigger |
|---------|-------------|----------------------|
| `/plan` | Before any multi-step task | "plan this feature" |
| `/tdd` | Building new features or fixing bugs | "let's do TDD for this" |
| `/python-review` | After writing/changing code | "review my code" |
| `/security-review` | Touching auth, inputs, credentials | "is this secure?" |
| `/verification-loop` | Before marking work as done | "verify everything works" |
| `/docker-patterns` | Modifying Docker/ECS configs | "help with Docker setup" |
| `/deployment-patterns` | Changing CI/CD pipeline | "fix the deployment" |
| `/search-first` | Before building something new | "is there a library for this?" |
| `/backend-patterns` | FastAPI architecture decisions | "best way to structure this API" |
| `/api-design` | Designing REST endpoints | "design this endpoint" |
| `/python-patterns` | Pythonic idioms and best practices | "make this more Pythonic" |
| `/simplify` | After completing code changes | "clean this up" |

## Auto-triggered (Claude uses these without you asking)

These subagents activate automatically when relevant:

| Agent | Triggers when |
|-------|--------------|
| `python-reviewer` | Python code is written or modified |
| `security-reviewer` | Auth, user input, API endpoints, or secrets are touched |
| `build-error-resolver` | Build or type errors occur |
| `planner` | Complex feature or architectural change is requested |
| `code-reviewer` | Any code changes are made |

## The Simple Rule

Just say what you need in plain English. Examples:

- "review my code" → python-reviewer
- "plan this feature" → /plan
- "is this secure?" → security-reviewer
- "verify everything works" → /verification-loop
- "clean this up" → /simplify
- "add tests first" → /tdd
