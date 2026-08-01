# Feature: Offbeat Onset Study

## Blueprint

### Context

The learner has practiced a familiar C-position step-and-skip pitch order on steady quarter notes and a complete even-eighth grid. The next hands-separate rhythm step keeps that known C-E-D-F-G order while moving four later onsets onto successive “and” counts. This introduces offbeat-onset practice without inventing rests, held-note values, accents, syncopation assessment, or a second timing clock.

### Current Scope

- `offbeat-step-skip-c-major-right-hand` asks for C4-E4-D4-F4-G4; `offbeat-step-skip-c-major-left-hand` asks for C3-E3-D3-F3-G3.
- Both are original schema-version-1, revision-1 beginner exercises with five unique note events at beat offsets 0, 0.5, 1.5, 2.5, and 3.5.
- Both use `timed-ordered-notes`, the existing 40–100 BPM range with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and an inclusive ±0.1-beat onset window.
- The first C is the ungraded MIDI timing anchor. The four later accepted notes are compared with that anchor at canonical gaps of 0.5, 1.5, 2.5, and 3.5 quarter-note beats.
- Each study requires only its matching mixed-eighth-pattern study for advisory recommendation. The prerequisite never locks or hides direct selection.
- The pair carries `rhythm-and-coordination.offbeat-onsets`, `rhythm-and-coordination.subdivision`, `rhythm-and-coordination.hands-separately`, `patterns-and-technique.step-skip-coordination`, and `notes-and-reading.interval-recognition`. Repertoire-goal metadata remains empty.
- Instructions name the pitches and suggest conventional C-position fingering. Evaluation observes only ordered pitches and the four post-anchor MIDI timestamp gaps.

### Architecture

- **Canonical events:** The five events reuse the existing note-event schema and strictly increasing fractional `beatOffset` contract. No schema version, exercise event kind, attempt shape, or evaluator mode is added.
- **Timing:** The first accepted C fixes the normalized-MIDI timestamp anchor. Every later accepted correct note is assessed from that anchor; pitch errors neither move the anchor nor receive timing classifications.
- **Audio boundary:** The four-beat count-in and ongoing quarter-note clicks are guidance only. Web Audio timestamps are never compared with MIDI timestamps, so the evaluator cannot establish that the first C matched the audible downbeat or that later notes were globally between audible clicks.
- **Rhythm presentation:** Quarter-beat studies with offsets 0 followed by successive half-beat “and” positions derive the `Offbeat grid` label, pitch-free guidance to place the first note on 1 and the remaining notes on “and” counts, and the staff label `Pitch order · Downbeat then offbeat onsets`. The full `1 & 2 & 3 & 4 &` count remains visible in Reading Focus.
- **Staff and keyboard:** The existing supported treble or bass pitch guide renders five equally presentation-spaced markers. The physical keyboard renders one C, D, E, F, and G control. Neither marker spacing nor key state becomes timing evidence.
- **Recommendation:** Exact-current-revision completion of the matching mixed-pattern study makes the offbeat study eligible as a direct dependent. Completion quality, timing classifications, tempo, and input kind do not affect eligibility.
- **Dependencies:** The feature reuses the canonical exercise schema, deterministic evaluator, quarter-note pulse, practice session, attempt repository, pitch guide, physical-key projection, Reading Focus, and local recommender. ADR-054 and ADR-057 already define the relevant MIDI-anchor, audio-clock, and fractional-onset rules, so this feature adds no ADR.

### Evidence Boundary

- A completion proves that five expected pitches were accepted in order and that four later note-ons produced MIDI-relative timing classifications against the first accepted note.
- A globally phase-shifted performance can retain the same four interval classifications because the first note defines MIDI time zero. The result therefore does not prove audible downbeat alignment or that the later notes actually occurred between metronome clicks.
- Numbered beats without canonical note events are gaps between onset targets. They are not encoded rests and do not establish silence, key release, note duration, or whether a previous key remained held.
- The feature does not assess accents, articulation, velocity quality, syncopation, fingering, declared-hand use, staff reading, relaxation, consistency across attempts, or mastery.

### Anti-Patterns

- Do not call this pair a syncopation assessment, rest study, accent study, or written-rhythm reading test.
- Do not compare Web Audio scheduling with normalized MIDI timestamps or praise the first note as on time.
- Do not infer rest, silence, duration, release, holding, articulation, or accent semantics from missing numbered-beat onsets.
- Do not hide the pitch-free count guidance in Reading Focus; its pitch answers may be reduced, but the rhythm task must remain usable.
- Do not require prerequisite completion to open either study or interpret one completion as readiness or mastery.

## Contract

### Definition of Done

- [ ] Both offbeat studies validate in the canonical library with stable IDs, five unique event IDs, exact C-E-D-F-G sequences and offsets, hands, timing, matching mixed-pattern prerequisite, tags, fingering copy, and original-source metadata.
- [ ] A canonical performance accepts five notes, records no pitch errors, and assesses four post-anchor intervals against offsets 0.5, 1.5, 2.5, and 3.5.
- [ ] The home and practice surfaces label the pair `Offbeat grid`; the staff says `Pitch order · Downbeat then offbeat onsets` without drawing rhythmic notation.
- [ ] Guided practice names the exercise pitches, while Reading Focus hides those pitch answers and keeps the pitch-free `1 & 2 & 3 & 4 &` rhythm task visible.
- [ ] The practice page renders five staff markers over five physical C-position keys and reuses the existing count-in, pulse, input, completion, history, and persistence flow.
- [ ] Recommendation requires only matching mixed-pattern completion evidence and remains advisory and quality-agnostic.
- [ ] Completion and documentation state the MIDI/audio boundary and make no rest, silence, duration, release, holding, accent, articulation, velocity-quality, syncopation, fingering, hand-use, reading, relaxation, consistency, or mastery claim.
- [ ] Automated tests cover canonical data, presentation, evaluator timing, recommendation, server rendering, Reading Focus, browser completion, and persistence.

### Regression Guardrails

- The first accepted correct note remains an ungraded MIDI anchor; no audio or wall-clock timestamp may establish or alter it.
- Exactly four accepted post-anchor events contribute timing classifications, and their canonical gaps remain 0.5, 1.5, 2.5, and 3.5 beats.
- The offbeat presentation must be derived from timing metadata and offsets rather than exercise IDs or titles, while unrelated irregular timing retains the neutral fallback.
- Pitch-guide markers remain equally presentation-spaced and pitch-only; their horizontal positions must not imply the missing numbered beats or written duration.
- Reading Focus must preserve the complete pitch-free count instruction even though selected instructions, pitch labels, and ordered note text are visually suppressed.
- The matching mixed-pattern prerequisite affects recommendation only and never exercise availability.

### Verification

- **Exercise tests:** Assert both documents, IDs, pitch order, offsets, timing, hands, prerequisite, tags, source metadata, fingering copy, and unique event occurrences.
- **Evaluator tests:** Replay exact 60 BPM timestamps at the four canonical gaps; assert five accepted notes, four on-time intervals, and zero mean absolute error. Shifting the complete timestamp fixture must preserve the same interval result.
- **Presentation tests:** Assert `Offbeat grid`, the complete pitch-free count task, `Pitch order · Downbeat then offbeat onsets`, the neutral fallback for unrelated timing, and five staff and physical-key positions.
- **Recommendation tests:** Assert exact-current-revision completion of the matching mixed pattern selects the offbeat study as a direct dependent without using attempt quality.
- **Browser tests:** Enter Reading Focus, retain visible count guidance, complete one study through mock input, and verify a persisted four-interval timing summary.
- **Documentation checks:** README and the exercise, evaluation, practice, notation, reading-focus, curriculum, recommendation, and Worker specs retain the bounded onset-only language.

### Scenarios

**Scenario: Practice successive offbeats**

- Given: `offbeat-step-skip-c-major-right-hand` expects C4-E4-D4-F4-G4 at offsets 0, 0.5, 1.5, 2.5, and 3.5
- When: those notes arrive at MIDI timestamps 2,000, 2,500, 3,500, 4,500, and 5,500 ms in a 60 BPM attempt
- Then: C4 establishes the anchor, the four later intervals are on time, and completion claims only ordered pitch and MIDI-relative onset-gap evidence

**Scenario: Keep rhythm guidance in Reading Focus**

- Given: the supported offbeat study is enhanced and Reading Focus is active
- When: selected instructions, pitch labels, and note-order answers are visually suppressed
- Then: the pitch-free task still explains the first note on 1 and later notes on successive “and” counts and displays `1 & 2 & 3 & 4 &`

**Scenario: Separate MIDI timing from the audible pulse**

- Given: a learner starts the five-note MIDI pattern later than the audible beat but preserves all four canonical timestamp gaps
- When: the evaluator completes the attempt
- Then: its interval classifications match an otherwise identical phase-aligned fixture, and no result claims audible downbeat or between-click alignment

**Scenario: Treat missing numbered beats as target gaps**

- Given: no canonical event is declared on numbered beats 2, 3, or 4
- When: the exercise is rendered and evaluated
- Then: those positions remain gaps between expected note-ons rather than rests, and no silence, release, duration, holding, or accent evidence is created

**Scenario: Suggest the matching offbeat study**

- Given: `mixed-eighth-pattern-c-major-right-hand` has exact-current-revision completion evidence and the matching offbeat study is uncompleted
- When: recommendation runs after the mixed-pattern completion
- Then: it may suggest `offbeat-step-skip-c-major-right-hand` as a direct dependent while leaving both studies freely selectable and making no readiness or mastery claim
