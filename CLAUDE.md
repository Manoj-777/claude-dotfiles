## Workflow Orchestration

### 1. Plan First (Default)
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- Write detailed specs upfront before touching any code
- If something goes sideways, STOP and re-plan — don't keep pushing
- Use plan mode for verification steps, not just building

### 2. Subagent Strategy
- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY of the following, immediately update `tasks/lessons.md` at the project root:
  - User corrects Claude on something
  - A mistake is discovered and fixed mid-session (even if user didn't point it out)
  - A workaround or non-obvious fix was needed to solve a problem
  - An assumption turned out to be wrong
- Write rules that prevent the same mistake from recurring
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for the relevant project
- Run `/learn` at the end of any substantial session to extract additional patterns

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: implement the clean solution instead
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing issues without being told exactly how

---

## Task Management

> All task files live inside the **project root** under a `tasks/` folder — never at the global level.

1. **Plan First**: Write plan to `tasks/todo.md` at the project root with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` immediately after any mistake, fix, or correction — not just at the end

---

## Coding Standards

- Always include proper error handling — never let failures pass silently
- Validate inputs early, before any logic runs
- No hardcoded values — use parameters, config files, or environment variables
- Add clear comments/docstrings: purpose, inputs, outputs, dependencies
- No magic numbers or hardcoded strings — use named constants
- Prefer readability over cleverness
- Functions and modules should do one thing well
- Keep environment-specific config separate from core logic

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **No Assumptions**: If something is unclear, ask once — then proceed with the answer.
- **Think End to End**: Always consider the full flow, not just the piece in front of you.
- **Environment Agnostic**: Logic should work across environments unless explicitly scoped otherwise.

---

## My Engineering Context

- I work across the full spectrum — automation, full stack development, AI integration, cloud infrastructure, DevOps, and enterprise systems
- Projects range from backend automation pipelines to full stack web applications to AI-powered products
- I integrate AI and LLMs into real-world applications — treat AI as a first-class component, not an afterthought
- I connect enterprise platforms (ITSM, identity, access management) with modern cloud and AI services
- Projects span multiple languages, platforms, and environments — never assume the stack
- I care about production-ready output — clean, reliable, maintainable, and scalable
- Always think end to end — from user input to data layer to integrations and back
- Refer to the project-level CLAUDE.md for stack-specific context, environment details, and project-specific rules
