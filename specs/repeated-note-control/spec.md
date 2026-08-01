# Feature: Repeated-Note Control

## Blueprint

### Context

The learner needs a small bridge from ascending even-eighth motion to repeated-note patterns used across later rock, metal, and game-music pathways. The existing evaluator already distinguishes canonical event occurrences from physical keys, so the next step can introduce adjacent repeated pitches without adding duration, release, velocity, or technique inference.

### Current Scope

- `repeated-note-eighths-c-major-right-hand` asks for C4-C4-D4-D4-E4; `repeated-note-eighths-c-major-left-hand` asks for C3-C3-D3-D3-E3.
- Both studies are original schema-version-1, revision-1 beginner exercises with five distinct event occurrences at beat offsets 0, 0.5, 1, 1.5, and 2.
- Both use `timed-ordered-notes`, the existing 40–100 BPM range with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and an inclusive ±0.1-beat onset window.
- The right-hand study requires `even-eighths-c-major-right-hand`; the left-hand study requires `even-eighths-c-major-left-hand`. Prerequisites affect only advisory recommendation and never block direct selection.
- Instructions suggest separate presses and C-position fingering. Evaluation observes only ordered pitch and note-on timing; it cannot establish key release, written duration, articulation, fingering, hand use, relaxation, tension, velocity quality, or physical control.
- The pair carries repeated-note-control, repeated-note-onset, even-eighth-onset, subdivision, and hands-separate curriculum tags. Repertoire-goal metadata remains empty and no protected melody, score, audio, MIDI, or lyrics are included.

### Architecture

- **Canonical events:** Every C, D, and E occurrence has its own stable event ID. The second expected C or D is correct because next-event comparison precedes repeated-input error classification.
- **Timing:** Fractional beat offsets reuse the onset model from ADR-054 and ADR-057. The first correct C anchors MIDI-relative timing, and four later accepted events are compared with that fixed anchor.
- **Physical keys:** ADR-058 projection renders one C, D, and E control across the inclusive natural-note span. After the first C or D, the same control remains expected until its second canonical occurrence is accepted.
- **Staff guide:** Five occurrence-based markers remain visible even though only three physical keys are rendered. Equal pitches share a vertical staff position but never an event identity.
- **Recommendation:** Each study becomes an eligible direct dependent after exact-current-revision completion of its matching even-eighth prerequisite. Selection remains advisory and unrestricted.
- **Dependencies:** The feature uses the existing exercise schema, evaluator, rhythm presentation, practice session, persistence, staff projection, physical-key projection, and recommender without new dependencies or schema versions.

### Anti-Patterns

- Do not require note-off, minimum release time, velocity, or a different finger to accept the next repeated occurrence.
- Do not describe completion as proof of articulation, reattack quality, relaxation, hand use, technique, readiness, or mastery.
- Do not merge adjacent equal-pitch events in evaluation, staff progress, semantic note order, or persistence identity.
- Do not render duplicate piano keys for repeated occurrences or treat one physical key as the canonical event ID.
- Do not infer eighth-note duration from half-beat onset spacing or from the `Eighth-note grid` presentation label.

## Contract

### Definition of Done

- [ ] Both repeated-note studies validate inside the canonical library with stable IDs, unique event IDs, exact sequences, timing, prerequisites, tags, and original-source metadata.
- [ ] A canonical C-C-D-D-E performance advances five events, records zero repeated-input errors, and assesses four post-anchor onset intervals.
- [ ] After the second C, an extra C is `repeated`, does not advance to D, and does not change the timing anchor.
- [ ] Completion describes non-canonical repeated inputs as `extra repeats` so intentional C-C and D-D pairs are not presented as mistakes.
- [ ] The staff renders five occurrence markers while the keyboard renders one C, D, and E control; shared-key state follows expected-over-remaining-over-accepted precedence.
- [ ] The home, practice, no-JavaScript, and direct-link surfaces include both studies, and completed attempts use normal local persistence.
- [ ] Recommendation offers the matching repeated-note study after its one declared even-eighth prerequisite has current-revision completion evidence.
- [ ] Automated tests cover canonical data, timing, errors, projections, recommendation, server rendering, browser completion, and persistence.

### Regression Guardrails

- The second canonical C or D must remain correct even though it equals the most recently accepted pitch.
- An unrequested third repeat must remain a non-advancing pitch error with no timing classification.
- Repeated events must retain unique IDs and independent staff states while sharing one physical control.
- Timing must remain MIDI-relative and onset-only; note-off, Web Audio timestamps, duration, and velocity must not enter evaluation.
- Prerequisites must guide recommendation without locking, hiding, or disabling direct study selection.

### Verification

- **Exercise tests:** Assert both documents, IDs, sequences, offsets, timing, hands, prerequisites, tags, fingering copy, and unique event occurrences.
- **Evaluator tests:** Complete C-C-D-D-E at exact half-beat intervals and classify an extra post-pair C without moving progress or the anchor.
- **Projection tests:** Assert five staff markers, three physical controls, and shared-key expected-state transitions.
- **Recommendation tests:** Assert each matching even-eighth completion selects its repeated-note direct dependent.
- **Browser tests:** Start the timed study, play both repeated pairs through the mock input, observe occurrence and shared-key progress, complete, and verify local persistence.

### Scenarios

**Scenario: Accept the second expected C**

- Given: the first C4 occurrence is accepted and the second C4 occurrence is next
- When: another C4 note-on arrives
- Then: the second event ID is accepted as correct, the C key becomes accepted, and D4 becomes next

**Scenario: Reject an extra third C**

- Given: both C4 occurrences are accepted and D4 is next
- When: another C4 note-on arrives
- Then: it is `repeated`, D4 remains next, and the fixed timing anchor and assessed-interval count do not change

**Scenario: Reuse one physical key**

- Given: five canonical events contain adjacent C4 and D4 pairs
- When: the practice page renders and advances the first C4
- Then: it shows five staff markers over three physical controls, and the one C4 control remains the expected key for the second occurrence

**Scenario: Recommend the repeated-note study**

- Given: the matching even-eighth study has exact-current-revision completion evidence
- When: the learner finishes that prerequisite or requests another eligible study
- Then: the corresponding repeated-note study may be suggested as an advisory direct dependent while remaining freely selectable beforehand
