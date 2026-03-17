# User Profile — Manoj

> This file is maintained automatically by Claude. Updated whenever new preferences,
> patterns, or information are discovered during interactions. Do not edit manually
> unless correcting something factually wrong.

---

## Identity & Background

- **Name**: Manoj Kumar R S
- **Role**: Full-stack engineer / AI integrations specialist
- **Organization context**: Enterprise systems (ITSM, identity, access management) + modern cloud/AI
- **OS / Primary machine**: Windows 11 Enterprise (uses bash via Git Bash)
- **Experience level**: Senior — production-ready standards, no hand-holding needed

---

## Technical Stack & Preferences

**Languages (comfortable with all):**
- Python, TypeScript/JavaScript, Java, Kotlin, Go, Swift, Perl, C++

**Primary domains:**
- AI/LLM integration (Claude API, AWS Bedrock)
- Full-stack web (React, Next.js, FastAPI, Spring Boot, Django)
- Cloud infrastructure (AWS — Lambda, S3, DynamoDB, ECS)
- Enterprise automation (ITSM, ServiceNow, GitHub, Stripe)
- DevOps (Docker, Terraform, GitHub Actions)

**Preferred tools:**
- Claude Code as primary AI coding tool
- ECC (Everything Claude Code) for skills/agents/hooks setup
- MCP servers: GitHub, Context7, Playwright, Exa, sequential-thinking
- Node.js >= 18 for scripts and tooling
- npm as package manager

**Code style preferences:**
- Production-ready output — clean, reliable, maintainable, scalable
- End-to-end thinking — always considers full flow from input to data layer
- Minimal impact — changes only touch what's necessary
- No over-engineering — minimum complexity for the current task
- Immutability preferred where idiomatic

---

## Work Methodology

**How Manoj approaches problems:**
- Prefers planning before coding on any non-trivial task (3+ steps)
- Values verification — never marks tasks complete without proving they work
- Wants root causes fixed, not symptoms patched
- Autonomous execution expected — no hand-holding on bug fixes
- Asks once when unclear, then proceeds — does not go back and forth

**What Manoj expects from Claude:**
- Senior engineer standards — "would a staff engineer approve this?"
- Concise communication — short, direct responses; no fluff
- No emojis unless explicitly asked
- Fix things properly the first time — no temporary workarounds
- When corrected, update `tasks/lessons.md` immediately and don't repeat the mistake

**Decision-making style:**
- Practical over theoretical — prefers working solutions over perfect abstractions
- Incremental — iterates and improves, doesn't over-design upfront
- Evidence-based — runs tests, checks logs, verifies correctness before claiming done

---

## Communication Preferences

- **Response length**: Short and concise — get to the point
- **Format**: Markdown with tables for comparisons, code blocks for commands
- **Tone**: Professional, direct — treat as a peer engineer
- **When to ask**: Only when genuinely unclear; one question at a time
- **When NOT to ask**: For bug fixes, straightforward implementations, or tasks with clear intent

---

## Recurring Patterns Observed

- Builds a lot of automation pipelines connecting enterprise systems to cloud/AI
- Frequently works with MCP server configurations and Claude Code tooling
- Cares deeply about dotfiles / dev environment portability (has private + public backup repos)
- Prefers thorough documentation when setting up systems (README, SETUP_GUIDE)
- Reviews and improves tooling proactively — not just uses it
- Backs up everything to GitHub; keeps private and public versions of configs

---

## Current Setup (as of 2026-03-17)

- **Claude Code config**: `~/.claude/` with 94 skills, 18 agents, 40+ commands
- **ECC installed**: developer + security + research profiles
- **Active MCPs**: GitHub, Context7, Playwright, Exa, sequential-thinking (configured)
- **Private dotfiles repo**: github.com/Manoj-777/claude-dotfiles-private
- **Public dotfiles repo**: github.com/Manoj-777/claude-dotfiles
- **ECC source**: C:/Users/RSManoj/Downloads/everything-claude-code

---

## Learning History

> Patterns Claude has learned from corrections and interactions.
> Each entry: what was wrong, what was right, date observed.

- **2026-03-17**: Skills installed at `~/.claude/` level matter more than the ECC source repo — always verify the installed version, not just the source
- **2026-03-17**: Heredoc with single quotes in content fails in bash — use Write tool or python3 for file creation when content has complex quoting
- **2026-03-17**: `git checkout public` is ambiguous when a remote is also named `public` — use `git switch public --no-guess` or cherry-pick instead
- **2026-03-17**: Auto-committing to `~/.claude` git repo is valuable for dotfiles portability
- **2026-03-17**: Always scan only `git ls-files` (tracked files) when checking for leaks — filesystem scan picks up gitignored files too
