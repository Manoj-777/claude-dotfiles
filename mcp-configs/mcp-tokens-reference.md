# MCP Tokens Reference

When setting up a new machine, use this file to know exactly which tokens to regenerate
and where to get them. Store actual token values in a password manager (1Password, Bitwarden, etc.) — never in this file.

---

## Tokens Required

| MCP Server | Token Name | Where to Generate | Notes |
|------------|-----------|-------------------|-------|
| `github` | `GITHUB_PERSONAL_ACCESS_TOKEN` | github.com > Settings > Developer Settings > Personal Access Tokens > Fine-grained | Scopes: repo, issues, pull_requests, contents |
| `exa-web-search` | `EXA_API_KEY` | exa.ai > Dashboard > API Keys | |
| `firecrawl` | `FIRECRAWL_API_KEY` | firecrawl.dev > Dashboard | |
| `fal-ai` | `FAL_KEY` | fal.ai > Dashboard > API Keys | |
| `browserbase` | `BROWSERBASE_API_KEY` | browserbase.com > Dashboard | |
| `browser-use` | `x-browser-use-api-key` (header) | browser-use.com > Dashboard | HTTP header, not env var |
| `supabase` | `--project-ref` (CLI arg) | supabase.com > Project Settings > General | Project reference ID |
| `confluence` | `CONFLUENCE_API_TOKEN` | id.atlassian.com > Security > API Tokens | Also needs CONFLUENCE_BASE_URL and CONFLUENCE_EMAIL |

## No Token Required

These MCPs work immediately with no credentials:

- `context7` — live library docs
- `sequential-thinking` — chain-of-thought reasoning
- `playwright` — browser automation
- `memory` — persistent memory
- `vercel` — Vercel deployments (HTTP)
- `railway` — Railway deployments
- `cloudflare-docs` — Cloudflare docs (HTTP)
- `cloudflare-workers-builds` — Workers builds (HTTP)
- `cloudflare-workers-bindings` — Workers bindings (HTTP)
- `cloudflare-observability` — Cloudflare logs (HTTP)
- `clickhouse` — ClickHouse analytics (HTTP)
- `magic` — Magic UI components
- `token-optimizer` — token compression

---

## ~/.claude.json Location

| OS | Path |
|----|------|
| Windows | `C:\Users\<username>\.claude.json` |
| Mac/Linux | `~/.claude.json` |

This file is NOT in the git repo — it contains your actual token values.
Recreate it on a new machine using `mcp-configs/mcp-servers.json` as the template
and this file to know which tokens to plug in.

---

## Setup Checklist (New Machine)

- [ ] GitHub PAT generated and added to `~/.claude.json`
- [ ] Exa API key added (for web search)
- [ ] Any other tokens you actively use added
- [ ] Verify MCPs load: open Claude Code and check `/mcp` or run a GitHub search
