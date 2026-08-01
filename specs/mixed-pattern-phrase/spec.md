# Feature: Mixed Eighth Pattern

## Blueprint

### Context

The learner has practiced short five-event ascents, interval patterns, ordered chord tones, even-eighth subdivision, and adjacent repeated notes. The next hands-separate step combines those familiar elements into one complete 4/4 eighth-note grid without introducing rests, syncopation, duration scoring, or a larger keyboard position.

### Current Scope

- `mixed-eighth-pattern-c-major-right-hand` asks for C4-E4-D4-D4-F4-G4-E4-C4; `mixed-eighth-pattern-c-major-left-hand` asks for C3-E3-D3-D3-F3-G3-E3-C3.
- Both studies are original schema-version-1, revision-1 beginner exercises with eight distinct event occurrences at beat offsets 0, 0.5, 1, 1.5, 2, 2.5, 3, and 3.5.
- Both use `timed-ordered-notes`, the existing 40–100 BPM range with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and an inclusive ±0.1-beat onset window.
- Each study requires both its matching repeated-note and ordered chord-tone study. Prerequisites affect only advisory recommendation and never block direct selection.
- The phrase combines steps, skips, one adjacent repeated pitch, and returning pitches on a regular eighth-note grid. Instructions suggest C-position fingering, but evaluation observes only ordered pitch and note-on timing.
- The pair carries `patterns-and-technique.mixed-patterns`, `patterns-and-technique.step-skip-coordination`, `patterns-and-technique.chord-tone-patterns`, `rhythm-and-coordination.even-eighth-note-onsets`, `rhythm-and-coordination.repeated-note-onsets`, `rhythm-and-coordination.subdivision`, and `rhythm-and-coordination.hands-separately`. Repertoire-goal metadata remains empty and no protected melody, score, audio, MIDI, or lyrics are included.

### Architecture

- **Canonical events:** All eight occurrences have stable unique event IDs. Repeated and returning pitches follow the existing expected-event precedence, so the second expected D and later E and C remain correct when they become next.
- **Timing:** The first correct C anchors MIDI-relative timing. Seven later accepted events are compared with that fixed anchor at half-beat intervals; the quarter-note Web Audio click remains guidance only.
- **Physical keys:** The existing inclusive-span projection renders one C, D, E, F, and G control. Repeated or returning occurrences reuse those controls while canonical progress remains event-based.
- **Staff guide:** Eight occurrence markers retain canonical horizontal order inside the existing supported treble or bass range. Equal horizontal spacing presents pitch order only and does not become rhythmic notation.
- **Rhythm presentation:** The regular half-beat offsets retain the existing `Eighth-note grid` and `Pitch order · Even eighth-note onsets` labels. Learner-facing count guidance spans the full `1 & 2 & 3 & 4 &` grid.
- **Recommendation:** A study becomes eligible only after exact-current-revision completion evidence exists for both matching prerequisites. If the just-completed study is either prerequisite and the other is already complete, the mixed pattern may be the direct-dependent recommendation.
- **Dependencies:** The feature reuses the current schema, evaluator, pulse, practice session, persistence, staff and keyboard projections, Reading Focus, and recommender. ADR-053, ADR-055, ADR-057, and ADR-058 already cover the relevant canonical-event, staff, fractional-onset, and repeated-control boundaries, so this feature requires no new ADR.

### Anti-Patterns

- Do not infer eighth-note duration, key release, articulation, fingering, hand use, relaxation, tension, staff reading, or consistent performance across attempts from one completion.
- Do not merge repeated or returning pitches, duplicate physical keys, or reduce eight canonical progress positions to five pitch controls.
- Do not use staff-marker spacing, Web Audio timestamps, or visible key state as timing evidence.
- Do not describe the original phrase as protected repertoire, syncopation, simultaneous chord playing, or a complete technique assessment.
- Do not require prerequisite completion to open or practice either exercise.

## Contract

### Definition of Done

- [ ] Both mixed-pattern studies validate in the canonical library with stable IDs, eight unique event IDs, exact sequences and offsets, timing, hands, prerequisites, tags, optional fingering guidance, and original-source metadata.
- [ ] A canonical C-E-D-D-F-G-E-C performance advances eight events, records no pitch errors, and assesses seven post-anchor onset intervals.
- [ ] The practice page renders eight staff markers over five physical C-position controls and preserves occurrence-based accepted, expected, and remaining state.
- [ ] The regular half-beat presentation explains the complete `1 & 2 & 3 & 4 &` grid without adding duration or score semantics.
- [ ] Home, practice, no-JavaScript, Reading Focus, direct-link, input, completion, history, and persistence behavior reuse the existing shared flow.
- [ ] Recommendation requires both matching prerequisite completions while leaving the studies freely selectable.
- [ ] Completion and documentation state the evidence boundary without implying duration, release, articulation, fingering, hand use, relaxation, reading, or consistency.
- [ ] Automated tests cover canonical data, evaluation and timing, projections, recommendation, server rendering, browser completion, and persistence.

### Regression Guardrails

- Event progress and completion must use all eight canonical IDs; physical-key deduplication must not shorten the phrase.
- The second canonical D and returning E and C must remain correct when expected, while non-canonical extra repetitions retain normal error classification.
- A correct completion must assess exactly seven intervals from one fixed MIDI anchor.
- The eighth-grid count must cover all eight onset positions rather than retain the five-event study's shorter `1 & 2 & 3` copy.
- Pitch-guide layout must remain usable at supported desktop, iPad, and narrow-phone widths without treating spacing as rhythm.
- Prerequisite order and library order must remain deterministic recommendation policy, not exercise identity or access control.

### Verification

- **Exercise tests:** Assert IDs, titles, eight-event sequences, offsets, hands, timing, prerequisites, tags, source metadata, and fingering copy for both studies.
- **Evaluator tests:** Complete the phrase at exact half-beat intervals; assert eight correct events, seven on-time intervals, fixed-anchor behavior, and correct handling of adjacent and returning pitches.
- **Presentation tests:** Assert full-grid count copy, eight occurrence markers, five physical controls, semantic sequence order, and Reading Focus compatibility.
- **Recommendation tests:** Assert that either prerequisite alone is insufficient and both exact-current-revision completions make the matching mixed pattern eligible as a direct dependent.
- **Browser tests:** Complete one mixed-pattern study through mock input, observe progress through eight events, and verify normal local persistence.
- **Documentation checks:** README and the exercise, evaluation, practice, notation, curriculum, recommendation, and Worker specs retain the bounded onset-only evidence language.

### Scenarios

**Scenario: Complete the full mixed phrase**

- Given: `mixed-eighth-pattern-c-major-right-hand` expects C4-E4-D4-D4-F4-G4-E4-C4 across one 4/4 eighth grid
- When: those eight note-ons arrive in order at exact half-beat intervals after the first C4 anchors timing
- Then: eight events are accepted, seven intervals are on time, and completion makes no duration, release, articulation, fingering, hand-use, relaxation, reading, or consistency claim

**Scenario: Preserve eight occurrences over five keys**

- Given: the phrase contains repeated D4 and returning E4 and C4 events
- When: the practice page renders and progress advances
- Then: eight staff markers retain occurrence state while one physical control per C4, D4, E4, F4, and G4 follows the documented aggregate-state precedence

**Scenario: Count a complete eighth grid**

- Given: canonical offsets run from beat 0 through beat 3.5 in half-beat steps
- When: rhythm guidance is rendered
- Then: the learner sees the `1 & 2 & 3 & 4 &` count relationship while the pitch guide remains unstemmed, equally presentation-spaced, and onset-only

**Scenario: Require both recommendation prerequisites**

- Given: the matching repeated-note and ordered chord-tone studies are the mixed pattern's two prerequisites
- When: only one has exact-current-revision completion evidence
- Then: recommendation does not select the mixed pattern; once both are complete it may be suggested directly, while direct exercise selection remains available throughout
