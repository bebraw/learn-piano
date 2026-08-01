# Feature: Performance Evaluation

## Blueprint

### Context

The learner needs immediate, trustworthy feedback about what was played. For the first untimed exercise, evaluation can be deterministic and explainable: compare normalized note-on events with the canonical ordered sequence. This keeps the live loop fast, testable, offline, and free of speculative AI coaching.

### Current First-Slice Scope

- Evaluation supports the canonical `untimed-ordered-notes` mode for individual notes.
- It classifies each relevant note-on as correct, repeated, out of order, or wrong.
- It advances only on the next expected pitch and completes after all five expected notes have been accepted.
- Pitch and order are evaluated. Timing, duration, velocity quality, fingering, articulation, dynamics, and physical technique are not evaluated.
- Feedback is deterministic, brief, calm, specific about actual and expected notes, and limited to the next useful correction.

### Future Scope

- Count-in, tempo, timing windows, duration, rhythm, chords, velocity targets, hand balance, phrasing evidence, and recommendation inputs may be added through explicit evaluation modes and updated specs.
- Timing evaluation is a likely second slice only after the untimed contracts pass reliably.
- AI-generated coaching is outside the live evaluation loop. Any later advisory use requires a separate decision and must not replace deterministic facts.

### Architecture

- **Entry point:** A pure evaluator receives a validated canonical exercise, prior immutable evaluation state, and a normalized input event, then returns the next state plus at most one event feedback item.
- **State:** State records the canonical exercise ID and revision, index of the next expected event, accepted expected-event IDs, mutually exclusive error counts, and completion status. It does not depend on rendered elements or adapter-specific events.
- **Relevant input:** Only normalized note-on events are evaluated in this mode. Note-off events have no pitch-order effect.
- **Pitch comparison:** MIDI note number is authoritative. Channel and non-zero velocity are retained as event facts but do not change correctness in the first slice.
- **Correct:** The played pitch equals the next expected event. The evaluator accepts that event and advances exactly one position.
- **Repeated:** The played pitch equals the most recently accepted pitch while a different next event is expected. It does not advance. A repeated expected pitch in the exercise remains distinguishable because expected-event identity, not pitch deduplication, defines progress.
- **Out of order:** The played pitch matches a later, not-yet-accepted expected event but not the next one. It does not skip or accept any event.
- **Wrong:** The played pitch is neither the next expectation, the immediately preceding accepted pitch, nor a later unaccepted expected pitch. It does not advance.
- **Completion:** Accepting the final expected event completes the evaluation once. Later events return the same completed state without new classifications.
- **Feedback projection:** Domain feedback contains a stable classification plus actual and expected pitch facts. Learner-facing copy is deterministic and may include note labels. Completion with no errors states that the sequence was correct; completion with errors acknowledges completion and reports no more than two useful observations.
- **Dependencies:** The evaluator depends only on exercise-domain and normalized-MIDI types. Session, persistence, and views depend on evaluator results.

### Classification Precedence and Edge Cases

- Correct takes precedence whenever the pitch matches the next expected event, even if the same pitch also appeared earlier in the exercise.
- Repeated applies only to the immediately preceding accepted pitch. Returning to an older accepted pitch is wrong unless that pitch is also a later pending expectation.
- Out-of-order search considers only later pending expectations, so a pitch already accepted cannot be used to skip progress.
- Before any event is accepted, a non-expected pitch that appears later in the sequence is out of order; any other pitch is wrong.
- Intervening wrong, repeated, or out-of-order notes do not erase accepted progress. The learner can play the still-expected note and continue.
- Events with equal timestamps are processed in adapter delivery order. Timing is not inferred from their timestamp difference.
- An empty or unsupported exercise is rejected before evaluator construction rather than treated as instantly complete.
- Evaluation replay with the same exercise revision and ordered normalized events produces the same classifications, progress, counts, and completion result.

### Feedback Rules

- Feedback identifies what happened and, for an error, what note remains expected; for example, “You played E before D. D is next.”
- A repeated-note message may summarize the repetition at completion; for example, “You repeated F once before playing G.”
- Vague praise, punishment, percentage grades, ranks, lives, streaks, and ambiguous “almost” results are not part of this mode.
- Velocity may be shown as captured data but must not be described as proof of strength, tension, relaxation, or technical quality.
- MIDI-only evaluation must not diagnose posture, fingering, pedaling, injury risk, or whether the learner used the declared hand.

### Anti-Patterns

- Do not read key highlight state or DOM order to decide correctness.
- Do not let mock fixtures bypass the evaluator or inject precomputed success.
- Do not reset or silently skip expectations after an error unless a future evaluation mode explicitly requires it.
- Do not count note-off as a repeated or wrong note.
- Do not add hidden timing or velocity thresholds to an untimed exercise.
- Do not collapse all error categories into one score that loses the next useful correction.
- Do not call a remote or generative service in the live evaluation loop.
- Do not infer physical technique from MIDI evidence.

## Contract

### Definition of Done

- [ ] C4-D4-E4-F4-G4 in order advances one event at a time and completes exactly once.
- [ ] Wrong, repeated, and out-of-order classifications are mutually exclusive and follow the documented precedence.
- [ ] Errors preserve the next expectation and accepted progress.
- [ ] Note-off events and post-completion events do not mutate evaluation.
- [ ] Evaluation is deterministic for replayed fixtures and timestamps.
- [ ] Completion feedback distinguishes an error-free sequence from a sequence completed with corrections.
- [ ] Timing, duration, and velocity quality have no effect in this slice.
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
- Untimed mode must not regress into implicit tempo, duration, or velocity scoring.
- Evaluation must remain platform-neutral across Web, mock, and future native MIDI adapters.

### Verification

- **Unit tests:** Correct sequence, wrong note, immediate repeat, older accepted pitch, later-note out-of-order input, correction after every error type, repeated pitches in an exercise, note-off, velocity-zero normalization integration, equal timestamps, and post-completion input.
- **Fixture replay:** Deterministic sequences assert the complete ordered classification log and final counts, not only a final boolean.
- **Mutation strength:** Assertions must fail if advancement, classification precedence, error counts, or completion idempotence are changed.
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
