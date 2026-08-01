# Architecture

This file stores cross-cutting rules that apply to the whole repo and to projects cloned from it.

Use this file for global constraints. Use feature specs under `specs/` for domain-specific behavior and contracts.

## Global Rules

- Keep the template lightweight, reusable, easy to clone, and easy to prune.
- Treat repo documentation as living context that should evolve with the code.
- Treat architectural decisions as explicit records, not implicit tribal knowledge.
- Treat specs and ADRs as the durable source of truth for expected behavior and architectural intent. Code, including AI-generated code, is only acceptable when it matches those documents or updates them intentionally in the same change set.
- Add or update an ADR in `docs/adrs/` whenever a change introduces or changes a lasting architectural constraint, selects between credible architectural alternatives, or replaces an earlier decision. Keep drafts in `docs/adrs/proposed/`, approved-but-not-yet-implemented decisions in `docs/adrs/accepted/`, and implemented decisions in `docs/adrs/implemented/`.
- Create or update the relevant feature spec in `specs/` in the same change set whenever feature behavior, contracts, workflows, or regression guardrails change.
- Add or update a template update pack in `.template/updates/` in the same change set whenever a reusable template maintenance change should be portable to downstream projects.
- Keep the quality gate green before considering a change ready.
- Keep workflow writes explicit. New generated output, local state, cache, archive, or tool-artifact paths should be documented in the same change that introduces them.
- Do not place executable browser code inline in Worker-rendered HTML. Client behavior should live in typed TypeScript modules before it is served to browsers.

## Piano Practice Domain

- Keep the Cloudflare Worker and server-rendered HTML as the document shell. Interactive practice behavior is progressive enhancement delivered through small, same-origin TypeScript modules compiled to browser ESM.
- Keep the interface organized as a responsive practice desk: the active exercise, score, keyboard, next-note cue, and feedback form one primary stage, while input setup, exercise selection, and history remain secondary. Centralize the visual system in `src/tailwind-input.css` without weakening the server-rendered document order or no-JavaScript meaning.
- Keep musical behavior independent from platform APIs. Practice sessions consume the platform-neutral `MidiInputPort`; only adapters may depend on Web MIDI or the native CoreMIDI bridge. The iPad wrapper must host the same web domain rather than duplicate exercises, evaluation, sessions, or persistence in Swift.
- Treat validated, versioned exercise definitions as the canonical source for rendering, evaluation, fixtures, persistence identity, the current staff projection, and future curriculum or full-notation consumers.
- Keep canonical event occurrences distinct from physical input controls. Evaluation, progress, semantic note text, and staff markers retain every expected-event ID, including repeated pitches; the current on-screen keyboard instead renders one pitch-keyed control per MIDI note across the exercise's inclusive natural-note span. Repeated occurrences reuse that control, intermediate span notes remain playable wrong-note inputs, and ordered single-note events never imply simultaneity or chord evaluation.
- Keep staff presentation behind a reversible adapter that derives the current pitch-only guide from canonical exercise events. Under ADR-063, the bounded natural-note subset is C4-A4 on treble and C3-A3 on bass; reject accidentals, mixed-hand material, and pitches outside those ranges instead of guessing or expanding implicitly. Server-render the guide with an adjacent semantic text fallback, and do not let rendered SVG coordinates, glyphs, or state become exercise data or evidence of staff-reading mastery.
- Keep reading focus learner-controlled, transient, and presentation-only. The server-rendered default remains fully guided; client enhancement may reduce visible note-name and expected-key answers only after validating a supported staff guide, while preserving accessible semantics, evaluator-driven progress, input behavior, rhythm guidance, and explicit correction. Never persist the choice or treat it as exercise identity, attempt evidence, recommendation input, or proof of staff-reading mastery.
- Keep live performance evaluation deterministic and local. The same canonical exercise and normalized MIDI sequence must always produce the same progress and feedback.
- For timed exercises, treat canonical `beatOffset` values as beat-relative onset positions, including fractional values for subdivisions. Derive expected intervals from those offsets and the attempt's fixed tempo, apply the exercise's explicit timing window, anchor evaluation to the first accepted correct note's normalized MIDI timestamp, and keep later pitch errors from moving that anchor. Drive the displayed meter, visible beat-indicator count, running Web Audio wrap and accent, and count-in copy from canonical `ExerciseTiming`; keep `countInBeats` explicit and independent from `beatsPerMeasure`. Fractional spacing adds no duration, rest, notation, or simultaneity semantics. Web Audio count-ins, beat cycles, and clicks are guidance only and must never become the evaluation clock; a quarter-note click may guide a denser subdivision that the learner performs between clicks.
- Preserve `onPulse` in persisted timing summaries and `on-pulse` in evaluator-domain classifications as compatibility names, while learner-facing copy describes the classification as “on time.”
- Keep completed-attempt history local-first behind `AttemptRepository`. Cross-library summaries must project only retained exact-current-revision records, fail neutral rather than expose partial totals, and leave the complete server-rendered library available. Storage failure must not block or redefine musical completion.
- Under ADR-062, derive per-exercise recent evidence from no more than the five newest retained exact-revision completions. Present attempts completed without pitch or order corrections, categorical correction totals, and timing totals with their contributing-attempt count without averaging tempo or timing error, claiming a score, trend, improvement, consistency, or mastery, or changing recommendation and curriculum evidence.
- Under ADR-061, keep home-folio discovery as a transient presentation over canonical exercise hand and every matching curriculum-track prefix. Server-render the complete library, default to the unrestricted view on each load, preserve multi-track membership and canonical order, and never feed filter state into attempts, history, recommendations, evaluation, URLs, or progression claims.
- Keep study recommendations deterministic, local, explainable, and advisory. Derive them from the validated canonical library, exact-current-revision retained attempts, and the current session's just-completed attempt; invalid prerequisite graphs or an initial history-read failure yield a neutral library fallback. Recommendations must never mutate evaluation, claim mastery, or restrict exercise choice.
- Keep protected repertoire names as goal and competency metadata unless lawful source material is deliberately added with explicit rights metadata.

## Tooling Baseline

- Local development and local CI target macOS as the supported host platform baseline.
- Use a connected Cloudflare MCP as the retrieval and account-operation layer for current Cloudflare product work. Keep only the `workers-best-practices` and `wrangler` skills in the template baseline; add product-specific Cloudflare skills when a project actually adopts those products.
- Node is pinned exactly through `package.json`, and npm is constrained to a compatible major there instead of an exact patch pin.
- The verification baseline is split into a fast gate and a browser gate so quick checks can return earlier without dropping full coverage.
- The repo-managed `pre-push` Git hook should run affected-file guardrails before code is pushed.
- Formatting, Oxlint correctness checks, type checking, unit tests, and end-to-end tests are part of the baseline quality gate.
- Keep incremental mutation testing in an explicit deep local gate instead of making it an unconditional baseline phase. GitHub remains responsible for the clean full mutation signal on runtime-relevant changes.
- Keep duplicated `.github/skills/` content and vendored `.codex/skills/**/references/` material outside the Prettier baseline. Continue formatting project-owned skill entry points, specs, ADRs, and documentation.
- Cache successful Prettier checks by file content under ignored `.cache/prettier` so repeated local gates avoid unchanged files without trusting timestamps.
- Keep Oxlint focused on its default correctness rules unless additional rule categories are adopted through an explicit, documented decision. Oxlint does not replace Prettier or TypeScript checking.
- Fallow codebase diagnostics use best-effort type-aware analysis for exact-symbol evidence, public-signature coupling, complexity, duplication, dependency hygiene, and cleanup evidence; they remain advisory and do not replace the baseline quality gate.
- Affected-file guardrails should scope checks to changed files when the underlying tool supports it and fall back to project-level checks only when needed.
- Remote browser and mutation jobs should skip dependency installation and execution when every changed file is in a documented non-runtime area. Unknown paths and unavailable change ranges must run the expensive gates.
- Keep Stryker at 50% concurrency for responsive local work, while the isolated GitHub mutation job may use 100% of its runner's available parallelism.
- The fast quality gate should fail when Worker/view runtime files contain inline `<script>` tags, inline event-handler attributes, or `javascript:` URLs.
- Unit coverage for `src/` code should stay high enough that the coverage gate remains green.
- Local CI should validate the same baseline checks when changes cross workflow-sensitive boundaries or when full PR or release readiness is requested.
- The canonical local CI command should emit Agent CI's structured lifecycle event stream so agents can track run, job, step, pause, and completion state without relying on animated terminal output. Agent command wrappers must pass that stream through live instead of buffering it until process exit.
- Targeted commands are useful while iterating, but `npm run quality:gate` remains the readiness baseline before proposing or landing non-documentation changes.
- Require `npm run ci:local` when a change touches GitHub Actions workflows, package metadata or dependency installation, build or container setup, browser CI setup, or when full PR or release readiness is requested. Ordinary source, test, and tooling changes do not require it when they stay outside those boundaries.
- Use `npm run quality:gate:deep` when local assertion-strength feedback is worth the additional mutation-testing cost.
- `npm run diagnostics:codebase` is useful during review and refactoring, but passing or failing it is not a readiness baseline by itself.
- Documentation-only changes should use the smallest relevant checks unless they alter executable instructions or workflow contracts.
- Browser ESM and the generated stylesheet are public build artifacts under ignored `.generated/browser/`. Source modules remain under `src/`; generated browser files are never edited by hand.
- Native iPad build products and Xcode DerivedData stay under ignored `.generated/ios/`; the reviewed native project and Swift sources remain under `ios/`.

## Capability Kits

- Put reusable partial-upgrade kits under `.capabilities/{capability-name}/`.
- Keep capability kits instructional and reviewable rather than fully automated by default.
- Each capability kit should include a README, a machine-readable manifest, any copyable files, package-manager recipes, and validation notes.
- Capability kits should preserve target-project conventions unless the kit explicitly documents a required constraint.
- Vendor third-party agent skills at a reviewed source revision, retain their license and source metadata, and adapt only where template compatibility requires it.

## Template Updates

- Put reusable maintenance update packs under `.template/updates/{update-id}/`.
- Keep update packs as reviewable plain files with metadata, a migration guide, and a focused patch.
- Use update packs for later changes to projects that already use this template or one of its capability kits.
- Do not treat update packs as source snapshots; preserve downstream project conventions and use the migration guide when the patch does not apply cleanly.

## Spec Conventions

- Put feature-level specs under `specs/{feature-domain}/spec.md`.
- Keep one spec per independently evolvable feature or domain.
- Update the relevant spec in the same change set whenever behavior, contracts, workflows, or guardrails change.
