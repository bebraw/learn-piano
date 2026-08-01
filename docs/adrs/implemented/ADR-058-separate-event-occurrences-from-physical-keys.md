# ADR-058: Separate Event Occurrences From Physical Keys

**Status:** Implemented

**Date:** 2026-08-01

## Context

The first twelve exercises used five distinct pitches, so the practice keyboard could appear to map one canonical expected event to one on-screen key. The ordered C-major chord-tone studies add C-E-G-E-C for each hand. They still contain five distinct event occurrences, but C and E each appear more than once.

Canonical event identity already preserves repeated pitches: evaluation progress, semantic note order, and staff markers distinguish occurrences by expected-event ID. Rendering a second C or E key for the later occurrence would make the on-screen piano misrepresent physical keyboard geography, while deduplicating the canonical sequence would erase musical intent and progress.

The current practice keyboard also needs to retain the familiar natural-note span around the phrase. For C-E-G-E-C that span is C-D-E-F-G, even though D and F are not expected events.

## Decision

Keep canonical event occurrences and physical keyboard controls as separate identities.

Evaluation, progress, the semantic note sequence, and the staff guide preserve all ordered expected-event IDs. The C-E-G-E-C studies therefore retain five progress positions and five staff markers. Repeated event occurrences are not merged.

The current physical keyboard projection derives the inclusive natural-note span from the exercise's lowest through highest expected pitch, sorts that span by MIDI note number, and renders one pitch-keyed control per MIDI note. Repeated expected pitches reuse the same control. Intermediate natural notes that are not part of the phrase remain visible, idle, and playable; playing one enters the normal evaluator path as a wrong-note input. The C-E-G-E-C studies consequently show C, D, E, F, and G once each.

Project evaluator progress onto each physical key with this precedence:

1. `expected` when the next expected occurrence uses that pitch.
2. `remaining` when any later occurrence of that pitch is still pending.
3. `accepted` when every occurrence of that pitch has been accepted.
4. `idle` when the pitch is in the rendered span but absent from the phrase.

Pressed state is independent of that progress state and remains keyed by MIDI note number. Tapping a control emits its pitch through the same normalized input and evaluator path as other adapters; a view never advances a particular event ID directly.

Adjacent ordered single-note events carry no simultaneity semantics. The phrase is chord-tone preparation, not a chord event, blocked-chord task, voicing exercise, or claim that the learner understands or performed harmony simultaneously.

This decision extends ADR-053's canonical expected-event identity and ADR-055's event-ID staff projection. It does not supersede either decision.

## Trigger

The paired ordered C-major chord-tone studies introduce the first current exercises with repeated pitches while retaining the existing five-event practice flow and C-position keyboard geography.

## Consequences

**Positive:**

- Canonical event order, evaluator progress, semantic fallback, and staff state remain lossless for repeated pitches.
- The on-screen keyboard continues to resemble one physical natural-note span instead of drawing duplicate piano keys for repeated events.
- Intermediate D and F controls preserve C-position geography and exercise the same deterministic wrong-note path as hardware input.
- Future repeated-pitch exercises can reuse one explicit state-projection rule.

**Negative:**

- One physical key cannot simultaneously show that an earlier occurrence was accepted and a later occurrence is pending; the documented precedence intentionally shows the actionable pending state.
- The view and client must aggregate occurrence state by MIDI note number instead of assuming event IDs and key controls are interchangeable.
- Visible idle span keys are not part of the phrase and require clear state and accessible labels to avoid implying otherwise.

**Neutral:**

- The exercise schema, evaluator classification rules, staff adapter boundary, and existing attempt identity do not change.
- Progress remains event-based even when the number of physical controls differs from the number of expected events.
- These ordered studies add no simultaneous-chord, duration, rhythm, fingering, hand-verification, or harmony-assessment semantics.

## Alternatives Considered

### Render One Key Per Expected Event

This would make five controls line up directly with five progress positions, but duplicate C and E keys would falsely present one physical piano pitch as several keys and weaken transfer to hardware geography.

### Render Only Unique Expected Pitches

Showing only C, E, and G would avoid duplicates, but it would collapse the familiar C-position span, distort the intervals visually, and remove the intermediate D and F wrong-note inputs that a physical learner can still play.

### Encode A Chord Event

A simultaneous chord model could group C, E, and G under one event, but the studies intentionally ask for C-E-G-E-C in order. Using chord data would invent simultaneity, change evaluator behavior, and misstate the learning task.

### Add A Separate Event-Button Strip

A five-button sequence strip could preserve occurrence state independently from a physical keyboard, but it would add a second input metaphor and duplicate information already retained by the staff guide, semantic sequence, progress text, and next-note cue.
