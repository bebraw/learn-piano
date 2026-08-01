# Feature: Agent Skill Baseline

## Blueprint

### Context

The template should include agent workflows that are broadly useful to its baseline without vendoring large product documentation snapshots already available from connected platform tools.

### Architecture

- **Codex skill root:** `.codex/skills/`
- **Mirrored skill root:** `.github/skills/`
- **Cloudflare knowledge and account layer:** connected Cloudflare MCP
- **Baseline Cloudflare implementation skill:** `workers-best-practices`
- **Baseline Cloudflare CLI skill:** `wrangler`
- **Specialized Cloudflare skills:** added on demand when their product is adopted

### Anti-Patterns

- Do not vendor broad Cloudflare documentation snapshots when the connected MCP supplies current retrieval.
- Do not treat the MCP as a replacement for local Wrangler development, configuration, type generation, or testing workflows.
- Do not retain product-specific skills for capabilities the template does not use.
- Do not let the `.codex/skills/` and `.github/skills/` baseline diverge.

## Contract

### Definition of Done

- [ ] The template includes `workers-best-practices` and `wrangler` in both supported skill roots.
- [ ] Broad and unused product-specific Cloudflare skill bundles are absent from both roots.
- [ ] Agent guidance routes current Cloudflare documentation, API discovery, and account operations through the connected MCP.
- [ ] Product-specific skills are introduced only with the capability that needs them.

### Regression Guardrails

- The baseline must not reintroduce `cloudflare`, `agents-sdk`, `cloudflare-email-service`, or `durable-objects` as vendored skills without an explicit architecture change.
- The Worker and Wrangler skill copies must remain available while this repository is a Cloudflare Worker starter.
- Removing a baseline skill must not remove its runtime dependency or product implementation implicitly.

### Verification

- **Skill presence:** `test -f .codex/skills/workers-best-practices/SKILL.md && test -f .codex/skills/wrangler/SKILL.md`
- **Mirror presence:** `test -f .github/skills/workers-best-practices/SKILL.md && test -f .github/skills/wrangler/SKILL.md`
- **Pruned bundles:** confirm the four removed skill directories are absent from both roots
- **Documentation check:** `npm run format:check`

### Scenarios

**Scenario: Agent needs current Cloudflare product information**

- Given: the Cloudflare MCP is connected
- When: an agent needs current documentation or API details
- Then: the agent retrieves them through the MCP instead of relying on a vendored platform snapshot

**Scenario: Agent edits Worker code**

- Given: the repository remains a Cloudflare Worker
- When: an agent authors or reviews Worker code
- Then: the agent uses `workers-best-practices`

**Scenario: Project adopts a specialized Cloudflare product**

- Given: the project adds Agents SDK, Durable Objects, or Email Service
- When: specialized implementation guidance becomes useful
- Then: the project adds only the relevant skill rather than restoring the complete Cloudflare bundle
