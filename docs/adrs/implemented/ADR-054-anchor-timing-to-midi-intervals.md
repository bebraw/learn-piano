# ADR-054: Anchor Timing to MIDI Intervals

**Status:** Implemented

**Date:** 2026-08-01

## Context

The first rhythm slice needs to evaluate whether accepted notes follow a steady quarter-note pulse while preserving the deterministic, platform-neutral evaluator established by ADR-050. The learner also needs an audible count-in and metronome, but Web Audio scheduling and normalized MIDI event timestamps do not share a dependable clock origin across browsers, native input, hardware, and audio devices. Comparing those clocks directly would mix musical performance with output latency and platform-specific clock conversion.

An absolute first-note deadline would also make audio and input latency part of the result. The slice therefore needs one timing reference that comes entirely from the performed MIDI stream and a clear boundary between audible guidance and evaluated evidence.

## Decision

Add a `timed-ordered-notes` evaluation mode for two original C-D-E-F-G steady-quarter studies, one assigned to each hand. Their canonical timing metadata defines 4/4 meter, quarter-note beat offsets `0` through `4`, a four-beat count-in, an adjustable range of 40–100 BPM, a default of 60 BPM, and a timing window of ±0.2 beat.

Pitch and order remain prerequisites for timing evaluation. The first accepted correct note establishes the attempt's timing anchor from its normalized MIDI timestamp and canonical beat offset; it receives no early, late, or on-pulse classification. Every later accepted correct note is compared with that fixed anchor. Its observed MIDI timestamp delta is compared with the canonical beat gap converted to milliseconds at the selected tempo. An error whose absolute value is at most 0.2 beat is on pulse; a larger negative error is early and a larger positive error is late.

Wrong, repeated, and out-of-order notes retain their pitch classifications but never establish, replace, or advance the timing anchor. Correcting the still-expected pitch compares its own timestamp with the original anchor and its canonical beat offset. The selected tempo remains fixed for the attempt; changing it starts a clean attempt rather than adapting the target while evidence is being collected.

Web Audio produces the four-beat count-in and ongoing quarter-note click as learner guidance only. Audio callback times, scheduled audio times, and output-latency estimates are never compared with normalized MIDI timestamps and never determine a timing classification. Timing stays replayable from the canonical exercise, selected BPM, and ordered normalized MIDI events without audio, DOM, wall-clock, or network state.

Completed attempts may persist an optional timing summary containing the selected tempo, assessed-interval count, on-pulse, early, and late counts, and mean absolute timing error in milliseconds. Untimed attempts remain valid without that summary, and older persisted records require no migration.

This slice does not evaluate note duration, velocity, articulation, rests, eighth notes, syncopation, chords, hands together, or adaptive tempo. It does not claim that MIDI verifies the declared hand, fingering, touch, or physical technique.

## Trigger

The exercise library now includes original steady-quarter studies that require a count-in, selectable tempo, deterministic timing feedback, and compatible local attempt history.

## Consequences

**Positive:**

- Timing evaluation uses one clock domain and remains identical for mock, Web MIDI, and native CoreMIDI input.
- The first accepted correct note absorbs entry and output-latency uncertainty without hiding later drift from the target pulse.
- Audible guidance can use Web Audio's scheduling strengths without coupling evaluation to audio-device latency.
- Existing untimed exercises and persisted attempts remain compatible because exercise timing and attempt summaries are mode-specific and optional.

**Negative:**

- The evaluator cannot judge whether the learner entered exactly with the audible downbeat because the first correct note defines time zero.
- Anchoring every later note to the first exposes cumulative drift but does not isolate the accuracy of each adjacent inter-onset interval.
- A ±0.2-beat window scales with tempo, so its millisecond width ranges from 300 ms at 40 BPM to 120 ms at 100 BPM.
- Changing tempo requires a restart rather than preserving an in-progress attempt.

**Neutral:**

- Four later notes in each five-note study produce four assessed timing intervals.
- Web Audio can be unavailable or delayed without changing replayed MIDI classifications; it affects guidance quality, not the evaluation contract.

## Alternatives Considered

### Compare MIDI Input Directly With Web Audio Click Times

This could grade the initial downbeat, but it requires dependable cross-clock conversion and output-latency compensation that the supported browser and native paths do not share. Platform latency would become part of the learner's result.

### Move the Timing Anchor After Every Correct Note

Adjacent-interval grading gives local feedback, but repeatedly resetting the reference can hide accumulated drift from the steady pulse. A fixed first-note anchor better matches this slice's learning goal.

### Grade Against Wall-Clock Receipt Time

Event receipt includes main-thread scheduling and bridge delivery delay. Normalized MIDI timestamps are the closer, replayable evidence and already cross the platform-neutral input boundary.

### Add Duration, Velocity, or Richer Rhythm Immediately

Those signals need distinct canonical semantics, evaluation rules, UI, and tests. Combining them with the first pulse slice would make feedback harder to explain and weaken the bounded deterministic contract.
