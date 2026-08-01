# Feature: Steady Broken-Chord Study

## Blueprint

### Context

The learner has already practiced C-major chord tones one note at a time and a straight quarter-note pulse. The next hands-separate pattern combines those two familiar foundations by repeating C-E-G-E on eight successive quarter-note targets. This extends phrase length and returning-pitch control without introducing a larger keyboard range, fractional subdivision, written duration, or simultaneous chord events.

### Current Scope

- `steady-quarter-broken-chord-c-major-right-hand` asks for C4-E4-G4-E4-C4-E4-G4-E4; `steady-quarter-broken-chord-c-major-left-hand` asks for C3-E3-G3-E3-C3-E3-G3-E3.
- Both studies are original schema-version-1, revision-1 beginner exercises with eight distinct event occurrences at integer beat offsets 0 through 7.
- Both use `timed-ordered-notes`, the existing 40–100 BPM range with 60 BPM default, a four-beat 4/4 count-in, ongoing quarter-note click guidance, and an inclusive ±0.2-beat timing window.
- Each study declares its matching ordered chord-tone study first and matching straight steady-quarter study second as advisory prerequisites. Prerequisites never lock or hide direct selection.
- Instructions name C-E-G-E-C-E-G-E, ask for one note on each click, count two groups of `1 2 3 4`, and suggest `1-3-5-3-1-3-5-3` for the right hand or `5-3-1-3-5-3-1-3` for the left hand. Fingering and declared-hand use remain guidance, not evaluated facts.
- The pair carries `patterns-and-technique.broken-chord-patterns`, `patterns-and-technique.chord-tone-patterns`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, and `notes-and-reading.interval-recognition`. Repertoire-goal metadata remains empty.

### Architecture

- **Canonical events:** All eight occurrences retain unique expected-event IDs. The repeated C, E, and G pitches advance by event order even though the keyboard reuses one physical control per MIDI pitch.
- **Timing:** The first accepted C establishes the fixed normalized-MIDI timestamp anchor. Seven later accepted notes are compared with that anchor at canonical gaps of one through seven quarter-note beats.
- **Audio boundary:** The Web Audio count-in and click remain learner guidance only. Audio timestamps never enter evaluation, so shifting the complete MIDI performance in time without changing its gaps produces the same classifications.
- **Presentation:** Integer offsets equal to event indexes derive `Steady pulse`, the pitch-free task `After the count-in, place one note on each beat.`, and `Pitch order · One note per beat`. The staff markers remain pitch-order presentation rather than written measures or note values.
- **Staff and keyboard:** The current C4-G4 treble or C3-G3 bass guide renders eight occurrence markers. The inclusive natural-note keyboard remains five C-through-G controls; D and F are idle, while C, E, and G follow the existing expected/remaining/accepted occurrence precedence.
- **Reading Focus:** A validated guide may suppress visible pitch answers while preserving eight staff occurrences, numeric progress, the pitch-free one-note-per-beat task, count-in, pulse state, keyboard operability, accessible semantics, and explicit error correction.
- **Persistence:** A completed attempt reuses the current attempt schema and may store a timing summary with seven assessed intervals. No storage key, envelope, schema, existing exercise revision, or migration changes.
- **Recommendation:** Exact-current-revision completion evidence for both matching prerequisites makes the pair eligible. Prerequisite order remains canonical, and performance quality, timing classifications, tempo, and input kind do not affect eligibility.
- **Dependencies:** The feature reuses the canonical exercise schema, deterministic evaluator, pulse service, attempt repository, pitch guide, physical-key projection, Reading Focus, and local recommender. ADR-053, ADR-054, ADR-055, ADR-056, and ADR-058 already define those boundaries, so no new ADR is required.

### Evidence Boundary

- Completion proves only that eight expected pitches were accepted in order and that seven later note-ons produced MIDI-relative timing classifications against the first accepted C.
- The first C is an ungraded timing anchor. A globally phase-shifted performance can receive the same result, so completion does not prove audible phase, downbeat, click, or measure alignment.
- Integer onset offsets do not establish note duration, key release, legato, rests, silence, articulation, dynamics, or velocity quality.
- MIDI does not verify the suggested fingering, declared hand, relaxation, physical control, harmony or chord recognition, staff reading, consistency across attempts, readiness, or mastery.

### Anti-Patterns

- Do not treat eight pitch markers as two measures of written notation or infer duration, barlines, legato, rests, or articulation from their equal spacing.
- Do not compare normalized MIDI timestamps with Web Audio scheduling or praise the first note as aligned with a click or downbeat.
- Do not merge repeated occurrences, duplicate physical keys, or shorten eight canonical progress positions to three expected pitches or five visible keys.
- Do not describe an ordered single-note completion as blocked-chord execution, harmony recognition, verified fingering, or verified hand technique.
- Do not require prerequisite completion to open either exercise or use attempt quality as a recommendation gate.

## Contract

### Definition of Done

- [ ] Both studies validate with stable IDs, eight unique events, exact pitches and offsets, timing, hands, prerequisite order, tags, source metadata, and fingering copy.
- [ ] An exact C-E-G-E-C-E-G-E performance advances eight occurrences, records no pitch errors, and assesses seven post-anchor intervals with the steady-quarter tolerance.
- [ ] Home and practice surfaces label the pair `Steady pulse`; the staff says `Pitch order · One note per beat` without claiming complete rhythmic notation.
- [ ] The practice page renders eight staff markers over five physical C-position controls, preserving returning-pitch occurrence state and leaving D and F idle.
- [ ] Reading Focus retains the pitch-free one-note-per-beat task, count-in, pulse, eight-step progress, accessible meaning, and normal input behavior.
- [ ] Completed attempts persist the existing optional seven-interval summary without a data migration.
- [ ] Recommendation requires both matching prerequisites in canonical order while leaving the studies freely selectable and ignoring performance quality.
- [ ] Completion and documentation make only the bounded pitch-order and MIDI-relative-gap claims.
- [ ] Automated tests cover canonical data, timing, presentation, projections, recommendation, server rendering, browser completion, and persistence.

### Regression Guardrails

- Event progress, semantic pitch order, staff state, and completion must retain all eight canonical IDs.
- The first event remains an ungraded fixed MIDI anchor; exactly seven later accepted events contribute timing classifications.
- The timing result must remain invariant when one constant is added to every accepted MIDI timestamp.
- Returning C, E, and G occurrences must reuse physical keys without losing pending occurrence state; D and F remain normal playable wrong-note inputs.
- Equal marker spacing and `Pitch order · One note per beat` must not acquire written-duration, barline, rest, legato, or measure-alignment semantics.
- Prerequisite order and canonical library order remain deterministic recommendation inputs, never access control or proof of readiness.

### Verification

- **Exercise tests:** Assert both documents, exact IDs, titles, instructions, event IDs, pitch order, offsets, hands, timing, prerequisite order, tags, source, and fingering guidance.
- **Evaluator tests:** Replay exact 60 BPM timestamps, assert eight correct events and seven on-time intervals, and repeat with a translated timestamp origin.
- **Presentation tests:** Assert `Steady pulse`, the pitch-free task, `Pitch order · One note per beat`, eight staff markers, five physical controls, and occurrence-based state.
- **Recommendation tests:** Assert either prerequisite alone is insufficient and both exact-current-revision completions make the matching study eligible as a direct dependent.
- **Browser tests:** Complete one study through mock input, observe eight-step progress, and verify a persisted seven-interval timing summary.
- **Documentation checks:** README and the exercise, evaluation, practice, notation, reading-focus, curriculum, recommendation, and Worker specs retain the exact counts and bounded evidence language.

### Scenarios

**Scenario: Complete the steady broken chord**

- Given: `steady-quarter-broken-chord-c-major-right-hand` expects C4-E4-G4-E4-C4-E4-G4-E4 at offsets 0 through 7
- When: those note-ons arrive at MIDI timestamps 2,000 through 9,000 ms in one-second steps at 60 BPM
- Then: C4 establishes the anchor, eight events are accepted, seven intervals are on time, and completion claims only ordered pitch and MIDI-relative onset-gap evidence

**Scenario: Preserve occurrence progress over shared keys**

- Given: C4, E4, and G4 recur across eight canonical events while the keyboard also shows idle D4 and F4
- When: practice progress advances through the phrase
- Then: eight staff markers retain occurrence state while one physical control per C4, E4, and G4 follows the documented aggregate precedence

**Scenario: Separate MIDI timing from audible measures**

- Given: two correct performances have identical seven MIDI timestamp gaps but start at different audible phases
- When: the evaluator completes both attempts
- Then: their timing classifications match and neither result claims downbeat, click, or measure alignment

**Scenario: Retain rhythm guidance in Reading Focus**

- Given: the supported study is enhanced and Reading Focus is active
- When: visible pitch answers are suppressed
- Then: eight staff occurrences, numeric progress, count-in, pulse state, and `After the count-in, place one note on each beat.` remain available without adding reading evidence

**Scenario: Require both recommendation foundations**

- Given: the matching ordered chord-tone and straight steady-quarter studies are the new study's prerequisites
- When: only one has exact-current-revision completion evidence
- Then: recommendation skips the steady broken chord; once both are complete it may be suggested directly, while manual selection remains available throughout
