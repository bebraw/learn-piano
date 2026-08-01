# Feature: README Docs

## Blueprint

### Context

The README is the first surface for a learner or contributor. It must identify the current Piano Practice product, explain the thirty-exercise beginner slice and its C-major and D-minor ordered chord-tone, D-minor five-note ascent, steady broken-chord, 3/4 broken-chord, 5/4 pulse, repeated-note, mixed-pattern, and offbeat-onset evidence boundaries, pitch-only staff guide, transient reading-focus presentation, timing and platform limits, provide accurate local commands and architecture orientation, and preserve the repository's documentation contract. The committed screenshot should stay representative without adding screenshot automation to routine development or CI.

### Architecture

- **Primary document:** `README.md`
- **Committed screenshot:** `docs/screenshots/home.png`
- **Product summary:** thirty-exercise selection with transient inclusive focus/hand filters, server-rendered C4-A4 treble and C3-A3 bass pitch guides, learner-controlled transient reading focus, ordered C-E-G-E-C and D-F-A-F-D chord-tone preparation, D-E-F-G-A minor five-note preparation, derived C-G and D-A keyboard ranges, steady C-E-G-E-C-E-G-E broken-chord onsets, C-E-G-C-E-G-C broken-chord loops with 3/4 guidance, C-D-E-F-G-C pulse work with 5/4 guidance, C-C-D-D-E repeated-note onsets, C-E-D-D-F-G-E-C mixed-pattern onsets, C-E-D-F-G offbeat-onset preparation, local-first practice behavior, exact-current-revision home coverage, newest-five factual practice evidence, bounded quarter-note and fractional-position onset feedback, per-exercise persistence, input choices, and explicit limitations
- **Developer summary:** runtime, default and query-selected practice routes, source layout, generated assets, verification, and authoritative documentation locations
- **Screenshot refresh:** a manual developer action after material UI or catalog changes; screenshot capture remains outside the routine implementation and automated quality-gate loop
- **Non-goal:** no local or remote screenshot workflow in the automated build, development loop, or CI

### Anti-Patterns

- Do not describe the application as the old generic Worker stub or make readers infer the product from source files.
- Do not claim Web MIDI or direct MIDI support on platforms where the runtime does not provide it reliably.
- Do not imply that local browser history is cloud-synced, permanent, or an account-backed record.
- Do not describe recent saved-attempt evidence as complete history, a score, trend, improvement claim, consistency claim, mastery claim, or recommendation input.
- Do not claim the application can assess physical technique or replace a teacher.
- Do not describe the pitch-only staff guide as full score notation, give its markers duration semantics, or claim completion proves staff reading.
- Do not describe the D-minor chord-tone pair as proof of minor-quality recognition, harmonic understanding, blocked or simultaneous chord playing, fingering, declared-hand use, reading, physical technique, consistency, or mastery. Do not describe the D-minor five-note pair as a complete scale or proof of half-step recognition, scale construction, fingering, evenness, hand use, or technique.
- Do not describe reading focus as a saved preference, separate exercise, assessment, recommendation input, or proof of staff-reading mastery.
- Do not describe the steady broken-chord pair as proof of audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering or hand use, relaxation, harmony recognition, staff reading, consistency, or mastery.
- Do not describe the 3/4 broken-chord pair as proof of audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering or hand use, harmony recognition, staff reading, consistency, or mastery.
- Do not describe the 5/4 pulse pair as proof of audible phase, downbeat, click, measure or final-C alignment, 5/4 counting or grouping, accents or dynamics, duration, release, articulation, fingering or hand use, staff reading, physical technique, consistency, or mastery.
- Do not describe the offbeat pair as proof of audible downbeat alignment, between-click placement, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, hand use, reading, relaxation, consistency, or mastery.
- Do not point at stale commands, ports, generated paths, routes, package names, or source layout.
- Do not imply that generated code becomes authoritative merely because CI passes.
- Do not point at a missing or materially stale screenshot.
- Do not reintroduce screenshot capture into routine automation without a superseding ADR.

## Contract

### Definition of Done

- [ ] The README identifies Piano Practice as a local-first Cloudflare Worker application near the top.
- [ ] It describes all thirty right- and left-hand exercises, including the C-major and D-minor ordered chord-tone, D-minor five-note ascent, steady broken-chord, 3/4 broken-chord, 5/4 pulse, repeated-note, mixed-pattern, and offbeat pairs, the two straight and two step-and-skip steady-quarter studies, and the ascending even-eighth pair, plus direct exercise selection, progressive enhancement, exact-current-revision home coverage, input options, per-exercise history, and feedback boundaries.
- [ ] It explains that the home overview shows retained saved-study, hand, today, recent-study, and advisory recommendation facts without percentages, streaks, grades, locks, permanence, or mastery claims, and that storage failure leaves the complete library available.
- [ ] It explains that each practice page summarizes no more than the five newest retained exact-revision attempts using pitch-or-order-correction facts plus categorical timing facts with their contributing-attempt count, without averaging tempo or timing error or changing recommendations.
- [ ] It explains that enhanced home filters use every matching curriculum-track prefix plus hand, remain transient and inclusive, default to the complete folio on reload, and change no history or recommendation behavior.
- [ ] It explains that C-E-G-E-C and D-F-A-F-D each remain five ordered individual-note events, reuse their returning physical controls, and provide no simultaneous-chord, voicing, chord-quality, minor-quality, or harmony-recognition evidence; the D-minor chord-tone pair uses the derived D-A keyboard range.
- [ ] It explains that D-E-F-G-A uses five distinct event, staff, and physical-key positions over the D-A range, follows the matching D-minor chord-tone study in recommendation, and provides no complete-scale, half-step-recognition, scale-construction, fingering, evenness, hand-use, or technique evidence.
- [ ] It states the exact catalog split: fifteen studies per hand, twelve untimed and eighteen timed; the timed set contains ten steady-pulse, six regular eighth-grid, and two offbeat studies, while the latter eight retain fractional onset positions and a ±0.1-beat window. Fourteen timed studies use 4/4 with four count-in beats, the 3/4 pair uses three, and the 5/4 pair uses five.
- [ ] It explains the complete event distribution: twenty-two five-event studies, two six-event 5/4 studies, two seven-event 3/4 studies, and four eight-event studies. Of the timed set, the ten five-event studies have four assessed MIDI-relative intervals, the 5/4 pair has five, the 3/4 pair has six, and the four eight-event studies—the mixed-pattern and steady broken-chord pairs—have seven.
- [ ] It names `steady-quarter-broken-chord-c-major-right-hand` and `steady-quarter-broken-chord-c-major-left-hand` and explains that each uses C-E-G-E-C-E-G-E at offsets `0` through `7`, displays `Steady pulse` and `Pitch order · One note per beat`, and renders eight staff/event markers over five C-G physical controls.
- [ ] It explains that steady broken-chord completion proves only eight ordered pitches and seven MIDI-relative timing gaps, not audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering or declared-hand use, relaxation, harmony recognition, staff reading, consistency, or mastery.
- [ ] It names `three-four-broken-chord-c-major-right-hand` and `three-four-broken-chord-c-major-left-hand` and explains that each uses C-E-G-C-E-G-C at offsets `0` through `6`, declares 3/4 with three count-in beats, displays `Steady pulse` and `Pitch order · One note per beat`, retains the pitch-free `1 2 3, 1 2 3, 1` task, and renders seven staff/event markers over five C-G physical controls.
- [ ] It explains that 3/4 broken-chord completion proves only seven ordered pitches and six MIDI-relative whole-beat timing gaps, not audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering or declared-hand use, harmony recognition, staff reading, consistency, or mastery.
- [ ] It names `five-four-pulse-c-major-right-hand` and `five-four-pulse-c-major-left-hand` and explains that each uses C-D-E-F-G-C at offsets `0` through `5`, declares 5/4 with five count-in beats and five visible beat indicators, displays `Steady pulse` and `Pitch order · One note per beat`, retains the pitch-free `1 2 3 4 5, 1` task, and renders six staff/event markers over five C-G physical controls.
- [ ] It explains that 5/4 pulse completion proves only six ordered pitches and five MIDI-relative whole-beat timing gaps after the ungraded first C, not audible phase, downbeat, click, measure or final-C alignment, 5/4 counting or grouping, accents or dynamics, duration, release, articulation, fingering or declared-hand use, staff reading, physical technique, consistency, or mastery.
- [ ] It explains that mixed-pattern completion proves only C-E-D-D-F-G-E-C pitch order and onset placement, not duration, release, articulation, fingering, declared-hand use, relaxation, reading, consistency, rests, notation, simultaneity, or physical technique.
- [ ] It explains that offbeat completion proves only C-E-D-F-G pitch order and four later MIDI-relative timing gaps. Because the first C is ungraded and audio is not the evaluation clock, it proves no audible phase, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, declared-hand use, reading, relaxation, consistency, or mastery.
- [ ] It explains that every current exercise has a supported server-rendered C4-A4 treble or C3-A3 bass pitch guide with semantic note text, no duration semantics, and no staff-reading mastery inference.
- [ ] It explains that enhanced supported guides offer a transient reading-focus presentation, which reduces visible answers while preserving accessibility and progress, resets on navigation or reload, and contributes no attempt or reading-mastery evidence.
- [ ] It states the desktop Web MIDI dependency and explains the implemented native iPad wrapper, including its operator-owned signing and physical-device verification steps.
- [ ] Runtime, build, verification, route, and source-layout details match the repository.
- [ ] It explains how vendored ASDLC guidance relates to repo-specific architecture, specs, and ADRs.
- [ ] It references a committed screenshot that represents the current application.

### Regression Guardrails

- `README.md` must reference the existing `docs/screenshots/home.png` asset.
- A new reader must understand the current product and server-rendered/progressively enhanced model before exploring the source tree.
- The README must identify `/practice` as the canonical default and `?exercise=<id>` as direct selection, including the `404` behavior for unknown IDs.
- The twelve untimed exercises must remain distinct from the eighteen timed exercises; none may be described as percentage-scored, AI-evaluated, or cloud-backed.
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
- **Feature check:** compare exercise counts, 4/4, 3/4, and 5/4 meter guidance, steady-quarter, regular-eighth, and offbeat rhythm presentation, pitch-guide subset, reading-focus availability/lifetime/evidence boundary, recent-attempt evidence under ADR-062, timing-derived pulse behavior under ADR-060, MIDI/audio evaluator boundaries, and exclusions with the relevant living specs and implemented ADRs.

### Scenarios

**Scenario: Learner opens the README**

- Given: the repository is viewed locally or on Git hosting
- When: the learner reads the opening sections
- Then: they understand the thirty exercises available now, including the C-major and D-minor ordered but non-simultaneous chord-tone pairs, D-E-F-G-A five-note ascent pair, D-A keyboard transfer, eight-event steady broken-chord pair, seven-event 3/4 broken-chord pair, six-event 5/4 pulse pair, onset-only repeated-note pair, eight-event mixed-pattern pair, and MIDI-relative offbeat pair, how the expanded but bounded staff pitch guide, transient reading focus, timing-derived meter guidance, quarter-pulse and fractional-position onset timing, selection, input, and newest-five factual per-exercise history work, and what the application cannot assess

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
