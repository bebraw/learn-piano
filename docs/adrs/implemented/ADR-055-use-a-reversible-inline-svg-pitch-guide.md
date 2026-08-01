# ADR-055: Use a Reversible Inline-SVG Pitch Guide

**Status:** Implemented

**Date:** 2026-08-01

## Context

The current application exposes eight short, single-hand exercises as note names and piano-key cues. Gradual staff exposure is the next useful reading step, but the canonical model does not yet define written durations, rests, accidentals, multiple voices, chords, or general score layout. A full notation engine would therefore either require speculative domain fields or invent musical meaning that the exercises do not contain.

The practice page must remain useful in server-rendered HTML before JavaScript runs. The repository also favors a small dependency surface and requires views, evaluation, and persistence to consume the same canonical exercise identity rather than a renderer-specific score model.

## Decision

Render the first staff surface through a small, replaceable presentation adapter that emits inline SVG from the current canonical exercise.

The adapter supports only the present single-hand, natural-note subset: right-hand C4-G4 on treble staff and left-hand C3-G3 on bass staff. It draws pitch positions, canonical order, clef, staff lines, and required ledger lines. Its markers have no duration, rhythm, velocity, articulation, or fingering semantics. The existing ordered note text remains the semantic and unsupported-content fallback.

Server rendering produces the complete initial guide. Typed client enhancement may project accepted, next, and remaining evaluator state onto markers identified by canonical event IDs, but the adapter neither evaluates input nor becomes a source of session truth.

Do not add a notation dependency, MusicXML pipeline, notation-specific exercise field, schema version, or exercise revision for this slice. Unsupported ranges, accidentals, mixed-hand material, chords, and multiple voices must use the text fallback instead of guessed or partial notation.

This implementation is deliberately reversible. A later full notation renderer may replace the SVG adapter after the canonical exercise model contains sufficient written-music semantics, without changing canonical exercise IDs or rewriting attempt history.

## Trigger

The first completed pitch-and-timing practice slices now need a genuine staff-position learning surface, while the available exercise semantics remain much smaller than those expected by a general score renderer.

## Consequences

**Positive:**

- All eight current exercises gain server-rendered treble or bass pitch guidance without a new runtime dependency or downloaded asset.
- The renderer remains a consumer of canonical event IDs and MIDI pitches rather than a parallel exercise model.
- Pitch geometry and live state projection can be tested deterministically with ordinary markup and DOM tools.
- The adapter boundary leaves a later notation engine free to replace the initial implementation.

**Negative:**

- The project owns a small amount of staff geometry, SVG markup, responsive styling, and accessibility testing.
- The initial renderer cannot truthfully display accidentals, written rhythm, rests, chords, mixed hands, or general repertoire notation.
- Pitch-only markers are intentionally less expressive than conventional complete notation and require nearby copy to prevent duration inference.

**Neutral:**

- Exercise schema version 1, every current exercise revision, evaluator behavior, and attempt history remain unchanged.
- Seeing a staff guide supports pitch-position exposure but does not prove staff reading or add curriculum evidence.
- Current hand-to-clef selection is a constrained adapter rule, not a universal music-domain rule.

## Alternatives Considered

### Adopt A General Notation Library Now

VexFlow, OpenSheetMusicDisplay, or a similar library could cover broader engraving, but the current exercises lack the duration, accidental, voice, and score-layout semantics needed to use that capability faithfully. Adding the dependency now would expand the build and browser surface while coupling the application to a renderer model before its requirements are known.

### Add Notation Fields To Exercise Schema Version 1

Notation-specific payloads could prescribe clefs and glyphs, but this slice can derive every truthful pitch position from existing canonical events. New fields or revisions would be speculative, risk creating a parallel score source, and could incorrectly make existing history appear unrelated to the unchanged musical tasks.

### Render The Guide With Canvas Or An External Image

Canvas and image assets can draw staff lines, but they weaken server-rendered semantics, per-event DOM state projection, responsive styling, and deterministic markup tests. They would still require an adjacent accessible text representation and offer no advantage for this small vector subset.

### Keep Note Names And Keyboard Cues Only

This preserves the smallest UI, but it leaves the learner without any bridge from keyboard geography to treble and bass staff positions despite reading being a core curriculum track.
