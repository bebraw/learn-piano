# Feature: README Docs

## Blueprint

### Context

The README is the first surface for a learner or contributor. It must identify the current Piano Practice product, explain the six-exercise beginner slice and its platform limits, provide accurate local commands and architecture orientation, and preserve the repository's documentation contract. The committed screenshot should stay representative without adding screenshot automation to routine development or CI.

### Architecture

- **Primary document:** `README.md`
- **Committed screenshot:** `docs/screenshots/home.png`
- **Product summary:** six-exercise selection, local-first practice behavior, feedback, per-exercise persistence, input choices, and explicit limitations
- **Developer summary:** runtime, default and query-selected practice routes, source layout, generated assets, verification, and authoritative documentation locations
- **Screenshot refresh:** a manual developer action after material UI changes
- **Non-goal:** no local or remote screenshot workflow in the automated build, development loop, or CI

### Anti-Patterns

- Do not describe the application as the old generic Worker stub or make readers infer the product from source files.
- Do not claim Web MIDI or direct MIDI support on platforms where the runtime does not provide it reliably.
- Do not imply that local browser history is cloud-synced, permanent, or an account-backed record.
- Do not claim the application can assess physical technique or replace a teacher.
- Do not point at stale commands, ports, generated paths, routes, package names, or source layout.
- Do not imply that generated code becomes authoritative merely because CI passes.
- Do not point at a missing or materially stale screenshot.
- Do not reintroduce screenshot capture into routine automation without a superseding ADR.

## Contract

### Definition of Done

- [ ] The README identifies Piano Practice as a local-first Cloudflare Worker application near the top.
- [ ] It describes the six untimed right- and left-hand exercises, direct exercise selection, progressive enhancement, input options, per-exercise history, and feedback boundaries.
- [ ] It states the desktop Web MIDI dependency and explains the implemented native iPad wrapper, including its operator-owned signing and physical-device verification steps.
- [ ] Runtime, build, verification, route, and source-layout details match the repository.
- [ ] It explains how vendored ASDLC guidance relates to repo-specific architecture, specs, and ADRs.
- [ ] It references a committed screenshot that represents the current application.

### Regression Guardrails

- `README.md` must reference the existing `docs/screenshots/home.png` asset.
- A new reader must understand the current product and server-rendered/progressively enhanced model before exploring the source tree.
- The README must identify `/practice` as the canonical default and `?exercise=<id>` as direct selection, including the `404` behavior for unknown IDs.
- The current exercises must not be described as timed, scored, AI-evaluated, or cloud-backed.
- Input support and iPad limitations must remain accurate when platform adapters change.
- The documented build must identify `.generated/browser/` as ignored generated output.
- Runtime pinning, macOS host scope, commands, ports, routes, and source layout must match current behavior.
- Browser setup must use the pinned `npm run playwright:install` script.
- Specs and ADRs must remain the durable source of truth over generated code.
- Screenshot refresh must remain manual unless a later ADR changes that rule.

### Verification

- **Screenshot refresh:** update `docs/screenshots/home.png` manually when the application changes materially.
- **Manual check:** inspect the image and verify that it renders from the README path.
- **Repository checks:** `git diff --check` and `npm run format:check`.
- **Behavior check:** compare documented commands, routes, and file paths with `package.json`, `wrangler.jsonc`, and the source tree.

### Scenarios

**Scenario: Learner opens the README**

- Given: the repository is viewed locally or on Git hosting
- When: the learner reads the opening sections
- Then: they understand the six exercises available now, how selection, input, and per-exercise history work, and what the application cannot assess

**Scenario: Contributor runs the application**

- Given: the current macOS development baseline
- When: the contributor follows the setup and runtime instructions
- Then: the commands, port, generated paths, and routes match the repository

**Scenario: Contributor evaluates generated changes**

- Given: a contributor or agent proposes AI-assisted code
- When: they read the documentation contract
- Then: they understand that architecture, specs, and ADRs remain authoritative and must evolve deliberately

**Scenario: Application UI changes materially**

- Given: the rendered application no longer resembles the committed screenshot
- When: the change is completed
- Then: the developer manually refreshes and inspects `docs/screenshots/home.png`
