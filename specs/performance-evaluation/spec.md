# Feature: Performance Evaluation

## Blueprint

### Context

The learner needs immediate, trustworthy feedback about what was played. Pitch order and a bounded steady pulse can both be evaluated deterministically from canonical exercises and normalized note-on events. This keeps the live loop fast, testable, offline, and free of speculative AI coaching or platform-specific audio timing.

### Current Scope

- Evaluation supports canonical `untimed-ordered-notes` and `timed-ordered-notes` modes for individual notes.
- It classifies each relevant note-on as correct, repeated, out of order, or wrong.
- It advances only on the next expected pitch and completes after all five expected notes have been accepted.
- For the four steady-quarter studies—straight and step-and-skip for each hand—the first accepted correct note anchors timing and each later accepted correct note is additionally classified against its canonical beat gap with an inclusive ±0.2-beat tolerance. The even-eighth pair uses fractional offsets and a proportional ±0.1-beat window. The domain classifications remain `on-pulse`, `early`, and `late`; learner-facing copy says “on time,” “early,” or “late.”
- Pitch and order are evaluated for every exercise. Timing is evaluated only for `timed-ordered-notes`; duration, velocity quality, fingering, articulation, dynamics, and physical technique are not evaluated.
- Feedback is deterministic, brief, calm, specific about actual and expected notes, and limited to the next useful correction.

### Future Scope

- Note duration, velocity targets, rests, tuplets, syncopation, chords, hands-together coordination, adaptive tempo, hand balance, phrasing evidence, and recommendation inputs may be added only through explicit evaluation modes and updated specs.
- AI-generated coaching is outside the live evaluation loop. Any later advisory use requires a separate decision and must not replace deterministic facts.

### Architecture

- **Entry point:** A pure evaluator receives a validated canonical exercise, prior immutable evaluation state, and a normalized input event, then returns the next state plus at most one event feedback item.
- **State:** State records the canonical exercise ID and revision, index of the next expected event, accepted expected-event IDs, mutually exclusive error counts, and completion status. It does not depend on rendered elements or adapter-specific events.
- **Relevant input:** Only normalized note-on events are evaluated in this mode. Note-off events have no pitch-order effect.
- **Pitch comparison:** MIDI note number is authoritative. Channel and non-zero velocity are retained as event facts but do not change correctness in either current mode.
- **Correct:** The played pitch equals the next expected event. The evaluator accepts that event and advances exactly one position.
- **Repeated:** The played pitch equals the most recently accepted pitch while a different next event is expected. It does not advance. A repeated expected pitch in the exercise remains distinguishable because expected-event identity, not pitch deduplication, defines progress.
- **Out of order:** The played pitch matches a later, not-yet-accepted expected event but not the next one. It does not skip or accept any event.
- **Wrong:** The played pitch is neither the next expectation, the immediately preceding accepted pitch, nor a later unaccepted expected pitch. It does not advance.
- **Completion:** Accepting the final expected event completes the evaluation once. Later events return the same completed state without new classifications.
- **Timing activation:** Untimed mode never reads timestamps for scoring. Timed mode validates a selected integer BPM inside the exercise's declared range and converts canonical beat gaps, including finite fractional offsets, to milliseconds using `60_000 / BPM`.
- **Timing anchor:** The first accepted correct note records its normalized MIDI timestamp and canonical beat offset as the fixed anchor. It advances pitch progress but is not itself classified as `early`, `late`, or `on-pulse`.
- **Timing comparison:** For each later accepted correct note, observed elapsed milliseconds from the anchor are compared with the note's canonical beat gap from the anchored event. Absolute error at or below the exercise's `timingWindowBeats × millisecondsPerBeat` is internally `on-pulse`; a more negative error is early and a more positive error is late. Fractional gaps represent onset placement only, not duration, silence, notation, or simultaneity.
- **Pitch-error isolation:** Wrong, repeated, and out-of-order events never create, replace, or move the timing anchor and receive no timing classification. When the correct expected pitch arrives, its own MIDI timestamp is compared with the original anchor.
- **Timing summary:** Completed timed state exposes the selected tempo, number of assessed intervals, `onPulse`, early, and late counts, and mean absolute error in milliseconds. Those compatibility-named classification counts sum to assessed intervals; each current five-note timed study assesses four intervals regardless of pitch order or subdivision.
- **Feedback projection:** Domain feedback contains stable classifications plus actual and expected pitch or timing facts. Persisted `onPulse` and internal `on-pulse` remain compatibility names, while learner-facing copy says “on time” so a midpoint between clicks is not described as landing on an audible pulse. Copy may include note labels and signed timing error. Completion distinguishes an error-free sequence from one completed with pitch corrections and may summarize onset-timing evidence without producing a percentage grade.
- **Audio boundary:** Web Audio schedules a four-beat count-in and quarter-note click guidance outside the evaluator. For the even-eighth pair, each click marks a numbered beat and the learner places the “and” count halfway between clicks. Audio times, wall-clock receipt times, and latency estimates are never inputs to timing classification.
- **Dependencies:** The evaluator depends only on exercise-domain and normalized-MIDI types. Session, persistence, and views depend on evaluator results.

### Classification Precedence and Edge Cases

- Correct takes precedence whenever the pitch matches the next expected event, even if the same pitch also appeared earlier in the exercise.
- Repeated applies only to the immediately preceding accepted pitch. Returning to an older accepted pitch is wrong unless that pitch is also a later pending expectation.
- Out-of-order search considers only later pending expectations, so a pitch already accepted cannot be used to skip progress.
- Before any event is accepted, a non-expected pitch that appears later in the sequence is out of order; any other pitch is wrong.
- Intervening wrong, repeated, or out-of-order notes do not erase accepted progress. The learner can play the still-expected note and continue.
- Events with equal timestamps are processed in adapter delivery order. In timed mode, a later correct note at the anchor timestamp is early whenever its canonical beat gap exceeds the tolerance; untimed results remain independent of timestamp difference.
- The tolerance is inclusive and exercise-specific. At 60 BPM, an error from -200 ms through +200 ms is internally `on-pulse` for a ±0.2-beat steady-quarter study; the even-eighth pair's ±0.1-beat window spans -100 ms through +100 ms. Values outside the applicable range are early or late respectively.
- Timing error is always measured from the first accepted correct note, not from the most recently accepted note, so accumulated drift remains visible.
- A timestamp on a pitch error has no later timing effect. Pitch correction does not receive a grace-period reset or a shifted expected beat.
- An empty or unsupported exercise is rejected before evaluator construction rather than treated as instantly complete.
- Evaluation replay with the same exercise revision, selected tempo, and ordered normalized events produces the same classifications, progress, counts, and completion result.

### Feedback Rules

- Feedback identifies what happened and, for an error, what note remains expected; for example, “You played E before D. D is next.”
- A repeated-note message may summarize the repetition at completion; for example, “You repeated F once before playing G.”
- Timing feedback states the useful fact without moral judgement; for example, “D was 240 ms early. Keep the quarter-note pulse.” The first accepted note receives no timing praise or correction because it defines the anchor.
- Learner-facing feedback says “on time” for the internal `on-pulse` classification; it does not say an offbeat eighth-note onset landed “on the pulse.”
- Vague praise, punishment, percentage grades, ranks, lives, streaks, and ambiguous “almost” results are not part of this mode.
- Velocity may be shown as captured data but must not be described as proof of strength, tension, relaxation, or technical quality.
- MIDI-only evaluation must not diagnose posture, fingering, pedaling, injury risk, or whether the learner used the declared hand.

### Anti-Patterns

- Do not read key highlight state or DOM order to decide correctness.
- Do not let mock fixtures bypass the evaluator or inject precomputed success.
- Do not reset or silently skip expectations after an error unless a future evaluation mode explicitly requires it.
- Do not count note-off as a repeated or wrong note.
- Do not add hidden timing or velocity thresholds to an untimed exercise.
- Do not compare normalized MIDI timestamps with Web Audio, `Date.now()`, animation-frame, or DOM-event times.
- Do not move the fixed timing anchor after a pitch error or each newly accepted note.
- Do not promote onset subdivision into duration, velocity, rest, notation, syncopation, chord, hands-together, or adaptive-tempo evidence.
- Do not collapse all error categories into one score that loses the next useful correction.
- Do not call a remote or generative service in the live evaluation loop.
- Do not infer physical technique from MIDI evidence.

## Contract

### Definition of Done

- [ ] C4-D4-E4-F4-G4 in order advances one event at a time and completes exactly once.
- [ ] Wrong, repeated, and out-of-order classifications are mutually exclusive and follow the documented precedence.
- [ ] Errors preserve the next expectation and accepted progress.
- [ ] Note-off events and post-completion events do not mutate evaluation.
- [ ] Timed mode accepts 40–100 BPM for the current studies, defaults to 60 BPM, and assesses four post-anchor intervals against canonical beat gaps. The steady-quarter studies use inclusive ±0.2-beat tolerance; the even-eighth studies use inclusive ±0.1-beat tolerance at offsets 0, 0.5, 1, 1.5, and 2.
- [ ] The first accepted correct note establishes the only timing anchor; pitch errors neither receive timing classifications nor move it.
- [ ] Evaluation is deterministic for replayed fixtures, selected tempo, and MIDI timestamps without consulting Web Audio or wall-clock time.
- [ ] Completion feedback distinguishes an error-free sequence from a sequence completed with corrections.
- [ ] Timed completion exposes a coherent timing summary that may be persisted on the completed attempt; untimed completion has no timing summary.
- [ ] Duration and velocity quality have no effect in either current mode.
- [ ] The spec is updated in the same change set when evaluation semantics change.
- [ ] Unit tests directly cover each classification, transition, and edge case.

### Regression Guardrails

- Exactly one expected event may advance for each correct note-on.
- No error classification may advance or reorder the expected sequence.
- A repeated note must remain distinguishable from a later-note out-of-order error and an unrelated wrong note.
- Velocity-zero note-on must reach the evaluator as note-off and must not affect progress.
- Replaying a fixture must not depend on wall-clock time, random values, network access, or rendered UI state.
- Completion must be idempotent and stable after additional input.
- Feedback must retain structured facts even if presentation copy changes.
- Persisted `onPulse` and internal `on-pulse` compatibility names must remain readable while learner copy calls the classification “on time.”
- Untimed mode must not regress into implicit tempo, duration, or velocity scoring.
- Timed results must use normalized MIDI timestamp deltas from the first accepted correct note and must never compare MIDI with audible click timestamps.
- Pitch errors must preserve both accepted pitch progress and the original timing anchor.
- `onPulse`, early, and late counts must be mutually exclusive and sum to the number of assessed correct-note intervals.
- Selected tempo must remain fixed for one attempt; timing evaluation must not adapt its target from the learner's performance.
- Evaluation must remain platform-neutral across Web, mock, and native MIDI adapters.

### Verification

- **Unit tests:** Correct sequence, wrong note, immediate repeat, older accepted pitch, later-note out-of-order input, correction after every error type, repeated pitches in an exercise, note-off, velocity-zero normalization integration, equal timestamps, post-completion input, tempo-range validation, anchor establishment, quarter-note and even-eighth tolerance boundaries, fractional beat gaps, early/late classifications, and pitch-error anchor isolation.
- **Fixture replay:** Deterministic sequences assert the complete ordered pitch and timing classification log, fixed anchor, final counts, and mean absolute error rather than only a final boolean.
- **Mutation strength:** Assertions must fail if advancement, classification precedence, error counts, timing conversion, tolerance inclusivity, anchor handling, or completion idempotence are changed.
- **Coverage target:** All classification branches, state transitions, and completion-summary branches remain exercised.

### Scenarios

**Scenario: Play the sequence correctly**

- Given: C4 is next in the untimed C4-D4-E4-F4-G4 exercise
- When: the learner plays C4, D4, E4, F4, and G4 in order
- Then: each note is correct, progress advances five times, and completion says the sequence was correct

**Scenario: Play an unrelated wrong note**

- Given: D4 is next after accepted C4
- When: the learner plays B3
- Then: the event is wrong, D4 remains next, and feedback identifies B3 and expected D4

**Scenario: Repeat the previous note**

- Given: G4 is next after accepted F4
- When: the learner plays F4 again
- Then: the event is repeated, G4 remains next, and no expected event is skipped

**Scenario: Play a later note early**

- Given: D4 is next after accepted C4
- When: the learner plays E4
- Then: the event is out of order, D4 remains next, and feedback explains that E4 came before D4

**Scenario: Correct an error and continue**

- Given: D4 remains expected after an out-of-order E4
- When: the learner plays D4 followed by E4, F4, and G4
- Then: the attempt completes without erasing the earlier out-of-order observation

**Scenario: Ignore note-off**

- Given: D4 is next
- When: the evaluator receives a normalized C4 note-off
- Then: expected progress, classifications, and feedback do not change

**Scenario: Receive input after completion**

- Given: all expected events are already accepted
- When: another note-on arrives
- Then: the completed result remains unchanged and no second completion is emitted

**Scenario: Anchor a steady-quarter attempt**

- Given: the 60 BPM right-hand steady-quarter study expects C4 at beat 0 followed by D4 at beat 1
- When: C4 is accepted at MIDI timestamp 5,000 ms and D4 is accepted at 6,000 ms
- Then: C4 establishes the anchor without a timing classification and D4 has the internal `on-pulse` result with zero timing error, presented to the learner as on time

**Scenario: Keep step-and-skip timing canonical**

- Given: the 60 BPM right-hand timed step-and-skip study expects C4-E4-D4-F4-G4 at beat offsets 0–4
- When: those pitches are accepted in order at one-second MIDI intervals
- Then: C4 establishes the anchor and the four later intervals have the internal `on-pulse` result because timing follows each event's canonical beat offset rather than pitch distance

**Scenario: Evaluate even-eighth onsets between quarter clicks**

- Given: the 60 BPM right-hand even-eighth study expects C4-D4-E4-F4-G4 at offsets 0, 0.5, 1, 1.5, and 2
- When: those pitches are accepted at 500 ms intervals after C4 establishes the MIDI anchor
- Then: all four intervals have the internal `on-pulse` result and learner feedback says they were on time, while the quarter-note click remains guidance for the numbered beats

**Scenario: Include the tolerance boundary**

- Given: C4 anchored a 60 BPM attempt at 5,000 ms and E4 is the correct beat-2 event
- When: E4 is accepted at 6,800 ms or 7,200 ms
- Then: its -200 ms or +200 ms error has the internal `on-pulse` result because the ±0.2-beat window is inclusive

**Scenario: Classify outside the pulse window**

- Given: C4 anchored a 60 BPM attempt at 5,000 ms and D4 is the correct beat-1 event
- When: D4 is accepted before 5,800 ms or after 6,200 ms
- Then: D4 is early or late respectively and pitch progress still advances once

**Scenario: Keep the anchor through a pitch error**

- Given: C4 anchored a 60 BPM attempt at 5,000 ms and D4 is next
- When: the learner plays E4 before D4 at 5,900 ms and then the correct D4 at 6,000 ms
- Then: the E4 receives no timing result, the anchor remains 5,000 ms, and D4 has the internal `on-pulse` result

**Scenario: Ignore audio timing during evaluation**

- Given: Web Audio scheduled a count-in and metronome with delayed or unavailable output
- When: the same canonical exercise, selected BPM, and normalized MIDI fixture are replayed
- Then: pitch and timing classifications are identical because no audio timestamp enters the evaluator
