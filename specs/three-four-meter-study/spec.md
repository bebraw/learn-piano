# Feature: Three-Four Broken-Chord Study

## Blueprint

### Context

The learner can already play C-major chord tones and a repeating C-E-G-E broken chord against a steady 4/4 pulse. The next hands-separate step introduces a three-beat measure without changing key position, input semantics, or the deterministic note-on evaluator. Repeating C-E-G twice and landing on the next C makes two complete three-beat groups visible while keeping the phrase small enough for focused practice.

### Current Scope

- `three-four-broken-chord-c-major-right-hand` asks for C4-E4-G4-C4-E4-G4-C4; `three-four-broken-chord-c-major-left-hand` asks for C3-E3-G3-C3-E3-G3-C3.
- Both are original schema-version-1, revision-1 beginner studies with seven distinct note occurrences at integer beat offsets 0 through 6.
- Both use `timed-ordered-notes`, 3/4 meter, a three-beat count-in, 60 BPM default within 40–100 BPM, ongoing quarter-note clicks, and an inclusive ±0.2-beat timing window.
- Each study requires only its matching steady broken-chord study for recommendation eligibility and remains freely selectable without prerequisite evidence.
- Instructions ask the learner to play C-E-G, C-E-G, then land on C; count `1 2 3, 1 2 3, 1`; and suggest `1-3-5-1-3-5-1` for the right hand or `5-3-1-5-3-1-5` for the left hand.
- Tags are `rhythm-and-coordination.three-four-meter`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, `patterns-and-technique.broken-chord-patterns`, `patterns-and-technique.chord-tone-patterns`, and `notes-and-reading.interval-recognition`. Repertoire-goal metadata remains empty.

### Architecture

- **Canonical meter:** `ExerciseTiming` supplies `beatsPerMeasure: 3`, `beatUnit: 4`, and `countInBeats: 3`. Server copy, three visible pulse indicators, controller pulse configuration, and Web Audio wrapping consume those values rather than maintaining a separate 4/4 assumption.
- **Canonical events:** Seven unique event IDs preserve both repeated C-E-G groups and the final C. Evaluation, staff progress, semantic order, and persistence retain all seven occurrences.
- **Timing:** The first accepted C establishes the fixed normalized-MIDI timestamp anchor. Six later notes are compared with it at canonical gaps of one through six quarter-note beats.
- **Audio boundary:** Web Audio accents beat 1 and cycles through three beats after the count-in. Audio scheduling never enters evaluation, so a globally shifted MIDI performance retains the same result.
- **Presentation:** Cards remain `Steady pulse` and show `3/4`; Reading Focus retains `After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.` The staff remains a pitch-order guide labelled `Pitch order · One note per beat` rather than written 3/4 notation.
- **Staff and keyboard:** Seven occurrence markers fit the existing C4-G4 treble or C3-G3 bass subset. The keyboard remains five physical C-through-G controls; D and F are idle while C, E, and G reuse occurrence-aware state.
- **Persistence and recommendation:** A completed attempt may store six assessed intervals through the existing attempt schema. Exact-current-revision completion of the matching steady broken chord makes the study eligible as a direct dependent; quality and tempo do not gate it.
- **Dependencies:** ADR-053, ADR-054, ADR-055, ADR-056, ADR-058, ADR-059, and ADR-060 define the reused canonical, timing, notation, recommendation, occurrence, focus, and pulse-meter boundaries.

### Evidence Boundary

- Completion proves only seven accepted pitches in order and six MIDI-relative timing classifications after the first accepted C.
- The first C is ungraded. Completion cannot prove that any C aligned with an audible downbeat, that later notes aligned with clicks, or that the phrase followed audible measure boundaries.
- Pulse accents and instructional grouping do not prove beat-1 emphasis, dynamics, velocity quality, 3/4 counting, meter recognition, or meter understanding.
- Integer onsets do not establish duration, release, legato, rests, silence, or articulation.
- MIDI does not verify fingering, declared hand, relaxation, harmony recognition, staff reading, consistency, readiness, or mastery.

### Anti-Patterns

- Do not hardcode another three-beat DOM or audio path; derive meter presentation from canonical timing.
- Do not infer count-in length from the meter numerator even when both are three in this pair.
- Do not turn seven equally spaced staff markers into two written measures plus a barline or time signature.
- Do not call MIDI-relative completion proof of audible downbeat, accents, grouping, or 3/4 competence.
- Do not merge repeated C, E, or G occurrences or duplicate their physical keys.

## Contract

### Definition of Done

- [ ] Both exercises validate with exact IDs, titles, instructions, seven events, offsets, hands, timing, prerequisites, tags, source, and fingerings.
- [ ] Practice HTML derives `3/4`, `Three-beat count-in`, and exactly three pulse indicators from canonical timing while existing 4/4 studies retain four.
- [ ] Web Audio cycles and accents the configured three-beat measure after the independent three-beat count-in.
- [ ] An exact 60 BPM performance accepts seven pitches and assesses six on-time MIDI-relative intervals regardless of timestamp origin.
- [ ] Staff, keyboard, Reading Focus, persistence, and recommendation preserve their documented occurrence and evidence boundaries.
- [ ] Automated tests cover canonical data, meter presentation, audio cycling, evaluation, recommendation, SSR, browser completion, and persistence.

### Regression Guardrails

- Canonical `beatsPerMeasure` remains the source for visible indicator count and running pulse wrapping; `countInBeats` remains independent.
- Existing 4/4 studies retain four indicators, their current copy, and their current evaluation.
- Exactly seven event IDs and staff markers remain distinct over five physical keys.
- The first event remains an ungraded fixed MIDI anchor and exactly six later accepted events contribute timing facts.
- Adding one constant to every MIDI timestamp cannot change timing classifications.
- Audio state, click accents, and visible meter never become evaluator or persistence evidence.

### Verification

- **Exercise tests:** Assert both canonical documents, exact sequences, offsets, timing, hands, prerequisites, metadata, and fingering copy.
- **Pulse tests:** Assert three count-in beats, running beat wrap and accents, three rendered indicators, and unchanged 4/4 behavior.
- **Evaluator tests:** Replay exact 60 BPM fixtures from two timestamp origins and assert seven accepted notes plus six on-time intervals.
- **Presentation tests:** Assert `Steady pulse · 60 BPM · 3/4`, the complete pitch-free count task, seven staff occurrences, and five keys.
- **Recommendation tests:** Assert the matching steady broken chord makes the corresponding 3/4 study the eligible direct dependent.
- **Browser tests:** Complete the right-hand study through mock input and verify six persisted intervals.

### Scenarios

**Scenario: Follow a three-beat broken-chord loop**

- Given: `three-four-broken-chord-c-major-right-hand` expects C4-E4-G4-C4-E4-G4-C4 at offsets 0 through 6
- When: those note-ons arrive one second apart at 60 BPM
- Then: seven events are accepted, six intervals are on time, and completion claims only ordered-pitch and MIDI-relative onset-gap evidence

**Scenario: Present canonical 3/4 guidance**

- Given: the selected exercise declares `beatsPerMeasure: 3`, `beatUnit: 4`, and `countInBeats: 3`
- When: the practice page renders and starts its pulse
- Then: it shows 3/4, renders three beat indicators, counts in three beats, and wraps the running accent cycle after beat 3

**Scenario: Keep count-in independent**

- Given: meter and count-in are separate canonical timing fields
- When: a future study chooses a count-in length that differs from its numerator
- Then: scheduling and copy use `countInBeats` without changing the visible running-meter cycle

**Scenario: Preserve the audio-evidence boundary**

- Given: two correct performances have identical MIDI gaps but different first-note phases relative to the audible 3/4 pulse
- When: both complete
- Then: their six timing classifications match and neither result claims audible downbeat, click, accent, measure, grouping, or meter understanding
