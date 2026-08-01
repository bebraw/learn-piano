# Feature: README Docs

## Blueprint

### Context

The README is the first surface for a learner or contributor. It must identify the current Piano Practice product, explain the sixteen-exercise beginner slice, ordered chord-tone and repeated-note evidence boundaries, pitch-only staff guide, transient reading-focus presentation, timing and platform limits, provide accurate local commands and architecture orientation, and preserve the repository's documentation contract. The committed screenshot should stay representative without adding screenshot automation to routine development or CI.

### Architecture

- **Primary document:** `README.md`
- **Committed screenshot:** `docs/screenshots/home.png`
- **Product summary:** sixteen-exercise selection, server-rendered treble and bass pitch guides, learner-controlled transient reading focus, ordered C-E-G-E-C chord-tone preparation, C-C-D-D-E repeated-note onsets, local-first practice behavior, bounded quarter-note and half-beat onset feedback, per-exercise persistence, input choices, and explicit limitations
- **Developer summary:** runtime, default and query-selected practice routes, source layout, generated assets, verification, and authoritative documentation locations
- **Screenshot refresh:** a manual developer action after material UI or catalog changes; screenshot capture remains outside the routine implementation and automated quality-gate loop
- **Non-goal:** no local or remote screenshot workflow in the automated build, development loop, or CI

### Anti-Patterns

- Do not describe the application as the old generic Worker stub or make readers infer the product from source files.
- Do not claim Web MIDI or direct MIDI support on platforms where the runtime does not provide it reliably.
- Do not imply that local browser history is cloud-synced, permanent, or an account-backed record.
- Do not claim the application can assess physical technique or replace a teacher.
- Do not describe the pitch-only staff guide as full score notation, give its markers duration semantics, or claim completion proves staff reading.
- Do not describe reading focus as a saved preference, separate exercise, assessment, recommendation input, or proof of staff-reading mastery.
- Do not point at stale commands, ports, generated paths, routes, package names, or source layout.
- Do not imply that generated code becomes authoritative merely because CI passes.
- Do not point at a missing or materially stale screenshot.
- Do not reintroduce screenshot capture into routine automation without a superseding ADR.

## Contract

### Definition of Done

- [ ] The README identifies Piano Practice as a local-first Cloudflare Worker application near the top.
- [ ] It describes all sixteen right- and left-hand exercises, including the ordered chord-tone and repeated-note pairs, the two straight and two step-and-skip steady-quarter studies, and the ascending even-eighth pair, plus direct exercise selection, progressive enhancement, input options, per-exercise history, and feedback boundaries.
- [ ] It explains that C-E-G-E-C remains five ordered individual-note events, reuses C and E physical controls, and provides no simultaneous chord, voicing, or harmony-recognition evidence.
- [ ] It explains that ascending even-eighth and repeated-note studies use fractional onset offsets, a ±0.1-beat window, and a quarter-note click that the learner subdivides, without claiming release, duration, articulation, rests, notation, simultaneity, or physical-technique evidence.
- [ ] It explains that every current exercise has a supported server-rendered treble or bass pitch guide with semantic note text, no duration semantics, and no staff-reading mastery inference.
- [ ] It explains that enhanced supported guides offer a transient reading-focus presentation, which reduces visible answers while preserving accessibility and progress, resets on navigation or reload, and contributes no attempt or reading-mastery evidence.
- [ ] It states the desktop Web MIDI dependency and explains the implemented native iPad wrapper, including its operator-owned signing and physical-device verification steps.
- [ ] Runtime, build, verification, route, and source-layout details match the repository.
- [ ] It explains how vendored ASDLC guidance relates to repo-specific architecture, specs, and ADRs.
- [ ] It references a committed screenshot that represents the current application.

### Regression Guardrails

- `README.md` must reference the existing `docs/screenshots/home.png` asset.
- A new reader must understand the current product and server-rendered/progressively enhanced model before exploring the source tree.
- The README must identify `/practice` as the canonical default and `?exercise=<id>` as direct selection, including the `404` behavior for unknown IDs.
- The eight untimed exercises must remain distinct from the eight timed exercises; none may be described as percentage-scored, AI-evaluated, or cloud-backed.
- Learner-facing timing language must say “on time” while documenting `onPulse` and `on-pulse` only as compatibility names where technical detail is relevant.
- The current pitch guide must not be described as a complete score, a duration model, or evidence that the learner read the staff.
- Reading focus must remain distinct from the fully guided server default and must not be described as persisted, assessed, or available for unsupported notation.
- Input support and iPad limitations must remain accurate when platform adapters change.
- The documented build must identify `.generated/browser/` as ignored generated output.
- Runtime pinning, macOS host scope, commands, ports, routes, and source layout must match current behavior.
- Browser setup must use the pinned `npm run playwright:install` script.
- Specs and ADRs must remain the durable source of truth over generated code.
- Screenshot refresh must remain manual unless a later ADR changes that rule.

### Verification

- **Screenshot refresh:** update `docs/screenshots/home.png` manually when the application or visible catalog changes materially; this remains an explicit developer action outside the routine build and CI loop.
- **Manual check:** inspect the image and verify that it renders from the README path.
- **Repository checks:** `git diff --check` and `npm run format:check`.
- **Behavior check:** compare documented commands, routes, and file paths with `package.json`, `wrangler.jsonc`, and the source tree.
- **Feature check:** compare exercise counts, pitch-guide subset, reading-focus availability/lifetime/evidence boundary, pulse behavior, evaluator boundaries, and exclusions with the relevant living specs and implemented ADRs.

### Scenarios

**Scenario: Learner opens the README**

- Given: the repository is viewed locally or on Git hosting
- When: the learner reads the opening sections
- Then: they understand the sixteen exercises available now, including the ordered but non-simultaneous chord-tone pair and onset-only repeated-note pair, how the staff pitch guide, transient reading focus, quarter-pulse and half-beat onset timing, selection, input, and per-exercise history work, and what the application cannot assess

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
