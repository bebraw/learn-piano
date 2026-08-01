# ADR-060: Drive Pulse Meter From Exercise Timing

**Status:** Implemented

**Date:** 2026-08-01

## Context

The first timed exercises all use 4/4, so the server-rendered pulse surface originally emitted four fixed beat indicators and four-beat setup copy. The canonical exercise format and Web Audio pulse already carry `beatsPerMeasure`, `beatUnit`, and an independent `countInBeats`, but the visible practice surface did not fully consume those fields.

The first 3/4 studies need three visible beat positions, a three-beat count-in, and an audible accent cycle that wraps after beat 3. Adding exercise-specific branches or another meter value in the DOM would duplicate canonical timing data and make later 6/8, 5/4, or 7/4 work progressively harder to explain. At the same time, ADR-054 keeps audio guidance outside evaluated evidence, so displaying and sounding 3/4 must not become a claim that MIDI proves downbeat or measure alignment.

## Decision

Treat canonical `ExerciseTiming` as the source for every current pulse-meter presentation fact:

- `beatsPerMeasure` and `beatUnit` determine the displayed meter.
- `beatsPerMeasure` determines how many beat indicators the server renders and where the running Web Audio pulse wraps to beat 1.
- Web Audio accents beat 1 of the configured count-in or running measure.
- `countInBeats` determines count-in copy and scheduling independently; it is not inferred from `beatsPerMeasure`.
- Client enhancement collects the indicators rendered for the selected exercise instead of requiring four fixed element IDs.

Add two original hands-separate 3/4 broken-chord studies. Each uses C-E-G-C-E-G-C at integer beat offsets 0 through 6, a three-beat count-in, 60 BPM default within the existing 40–100 BPM range, and the existing ±0.2-beat steady-quarter window. Each requires only its matching steady broken-chord study.

Keep evaluation unchanged. The first accepted MIDI note remains the ungraded timing anchor, and the six later notes are classified only against MIDI-relative beat gaps. Visible meter, count-in, beat-1 accents, and click scheduling remain guidance and do not prove audible phase, downbeat placement, accent execution, measure grouping, or meter understanding.

## Trigger

The exercise library now includes its first non-4/4 studies and the practice surface must present their canonical 3/4 timing without a parallel hardcoded meter model.

## Consequences

**Positive:**

- Server HTML, client beat state, and Web Audio guidance stay aligned with one canonical timing document.
- 3/4 works through the existing evaluator, controller, persistence, and MIDI boundaries without a schema or storage migration.
- Later meters can reuse the same indicator and pulse-cycle path rather than adding meter-specific DOM contracts.

**Negative:**

- A larger future numerator may require additional responsive tuning so many indicators remain legible.
- The visible beat cycle can guide grouping that the MIDI-relative evaluator cannot verify.

**Neutral:**

- `countInBeats` may equal the meter numerator for the current studies, but it remains a separate canonical choice.
- ADR-054 and ADR-057 continue to govern the MIDI anchor, timing windows, fractional offsets, and audio-evidence boundary.
- The pitch-only staff guide still does not render time signatures, barlines, accents, or note durations.

## Alternatives Considered

### Keep Four Indicators And Change Only The Meter Label

This would preserve the old DOM but display a four-position cycle beside 3/4 copy. The contradictory guidance would be more misleading than omitting the indicators entirely.

### Add A Dedicated 3/4 Practice Component

A separate component could render three dots and custom copy, but it would duplicate the existing pulse lifecycle and make each later meter another branch. The canonical timing fields already provide the necessary input.

### Derive Count-In Length From Meter Numerator

Using `beatsPerMeasure` for both values is convenient for the current pair, but it removes the deliberate ability to provide a shorter, longer, or absent count-in. `countInBeats` remains explicit.

### Grade Notes Against The Audible Beat Cycle

This could claim downbeat and measure alignment, but normalized MIDI timestamps and Web Audio scheduling do not share a dependable clock origin. ADR-054's MIDI-only anchor remains the honest replayable boundary.
