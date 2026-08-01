# ADR-057: Represent Subdivisions With Fractional Beat Offsets

**Status:** Implemented

**Date:** 2026-08-01

## Context

ADR-054 established a deterministic timing model for steady quarter notes: canonical beat offsets describe expected note onsets, the first accepted MIDI note anchors the attempt, and Web Audio provides guidance without becoming the evaluation clock. The next rhythm slice needs to introduce even eighth-note onsets while preserving that single-clock, platform-neutral model.

An eighth-note onset can fall halfway between quarter-note beats, but the application still has no written-duration, rest, score, or simultaneity model. Encoding the new pattern must therefore distinguish beat-relative onset placement from notation semantics. The learner also needs an audible reference that supports subdivision without turning every expected onset into an audio answer cue.

The existing `onPulse` timing-summary field is persisted across browser revisions, while the evaluator's `on-pulse` classification is consumed throughout the domain. Renaming both solely to improve learner-facing wording would require storage and domain migrations without changing the underlying evidence.

## Decision

Treat every timed event's finite `beatOffset` as its beat-relative onset position from the first canonical event. Fractional offsets represent subdivisions of that beat reference. They do not describe how long a note is held, imply a rest between events, create written notation, or make adjacent events simultaneous.

Add two original C-D-E-F-G even-eighth studies, one assigned to each hand. Their canonical offsets are `0`, `0.5`, `1`, `1.5`, and `2` quarter-note beats. Each study requires the matching straight steady-quarter study for advisory recommendation eligibility and otherwise remains freely selectable.

Continue to anchor timing to the first accepted correct note's normalized MIDI timestamp. Every later accepted note is compared with that fixed anchor and its fractional canonical beat gap at the selected tempo. Pitch errors do not move the anchor. The tempo remains 40–100 BPM with 60 BPM as the default.

Keep the audible metronome on quarter-note beats after the four-beat count-in. The learner counts and places the intervening `&` onset between clicks; Web Audio still supplies guidance only and never contributes evaluation timestamps.

Allow each timed exercise to define its own non-negative timing window in beats. The four steady-quarter studies retain ±0.2 beat. The even-eighth pair uses ±0.1 beat so the tolerance retains the same proportional half-width instead of extending 40% of a half-beat target interval to either side. At 40, 60, and 100 BPM that window is 150, 100, and 60 milliseconds respectively.

Retain `onPulse` in persisted timing summaries and `on-pulse` in evaluator-domain classifications as compatibility names. Learner-facing copy describes that classification as “on time” so an event halfway between audible clicks is not misleadingly described as landing on a pulse.

This decision adds onset-subdivision evidence only. It does not add note-duration assessment, rests, beams, full notation, articulation, velocity quality, syncopation, chords, simultaneous events, hands-together evaluation, or proof that the instructed hand or fingering was used.

## Trigger

The exercise library now includes original even-eighth studies that place accepted MIDI onsets between quarter-note clicks while reusing the canonical timed-event and local-attempt boundaries.

## Consequences

**Positive:**

- Even subdivisions reuse the deterministic evaluator, platform-neutral MIDI timestamps, and existing optional timing summary without a parallel rhythm engine or storage migration.
- Fractional offsets express the intended onset grid directly and remain replayable at every supported tempo.
- A quarter-note click asks the learner to perform the subdivision instead of audibly duplicating every expected note onset.
- Per-exercise timing windows can stay proportional to rhythmic density while remaining explicit canonical data.

**Negative:**

- The learner must internalize the midpoint between quarter-note clicks; the audio guide does not sound every eighth-note onset.
- The ±0.1-beat window is stricter in milliseconds and may expose more input jitter or natural beginner variation than the quarter-note studies.
- The first note still defines time zero, so the evaluator cannot establish whether the learner entered exactly on the audible downbeat.
- Compatibility terminology remains less musically precise inside persisted and domain data than the learner-facing “on time” wording.

**Neutral:**

- Each five-note even-eighth study still produces four assessed post-anchor intervals.
- Fractional onset spacing changes neither the exercise schema version nor the attempt-storage schema.
- The pitch-only staff guide continues to show canonical pitch order and no rhythmic values.

## Alternatives Considered

### Change The Beat Unit To Eighth Notes And Keep Integer Offsets

Using `beatUnit: 8` with offsets `0` through `4` would avoid fractions, but it would misrepresent the current 4/4 quarter-note beat and audible click reference. Fractional quarter-beat positions keep meter, tempo, click guidance, and evaluation on one shared scale.

### Sound An Eighth-Note Click For Every Expected Subdivision

An eighth-note metronome would make midpoint placement easier, but it would give an audible cue at every expected onset and reduce the learner's responsibility to subdivide the quarter pulse. It can be considered later as an optional guidance mode rather than changing this exercise's evidence contract.

### Reuse The Quarter-Note ±0.2-Beat Window

This would avoid exercise-specific tolerance data, but ±0.2 beat extends 40% of a half-beat target interval to either side. The narrower ±0.1-beat window preserves the same proportional half-width used by the quarter-note studies.

### Add Explicit Duration And Rest Events First

A richer rhythm schema could encode notation and silence directly, but these studies need only onset placement. Adding duration, rests, rendering, and new evaluator semantics would broaden the slice without improving the evidence available from the five accepted note-on events.
