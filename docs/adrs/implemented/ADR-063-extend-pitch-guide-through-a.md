# ADR-063: Extend the Pitch Guide Through A

**Status:** Implemented

**Date:** 2026-08-01

## Context

ADR-055 introduced a reversible inline-SVG pitch guide bounded to the natural-note ranges used by the first C-position exercises: C4-G4 for treble and C3-G3 for bass. The first D-minor chord-tone pair asks for D-F-A-F-D in each hand. Its A4 and A3 pitches sit only one diatonic step beyond those documented maxima, remain inside the existing staff geometry, and need the same server-rendered pitch exposure and transient Reading Focus support as the rest of the current library.

Leaving the new studies on semantic-text fallback would be technically valid under ADR-055, but it would make the app's first new keyboard position lose a reading aid precisely when the learner meets a new staff pitch. Adopting a general notation engine or unbounded range at this point would still be disproportionate: the canonical model has no written duration, accidental, key-signature, voice, or score-layout semantics.

## Decision

Extend the existing natural-note pitch-guide subset by one diatonic step: treble supports C4-A4 and bass supports C3-A3.

Retain every other ADR-055 boundary. The adapter remains dependency-free, inline SVG, server rendered, occurrence based, pitch only, and replaceable. It continues to reject accidentals, mixed-hand content, both-hand events, pitches below C, and natural pitches above A. Unsupported content keeps the semantic note-order fallback.

The range extension does not change exercise schema version 1, existing exercise revisions, evaluator behavior, attempt history, or the rule that seeing a guide creates no staff-reading evidence.

## Trigger

The paired D-minor chord-tone studies introduce A4 and A3 while remaining within the existing natural-note, single-hand, pitch-only presentation model.

## Consequences

**Positive:**

- The first D-position and minor chord-tone studies retain the same staff and Reading Focus experience as existing exercises.
- A4 and A3 fit the current fixed staff view box without new ledger-line or responsive-layout behavior.
- The project gains useful new keyboard geography while preserving one canonical pitch source and no new dependency.

**Negative:**

- The project-owned adapter has a slightly broader range contract and corresponding tests and documentation to maintain.
- The explicit A ceiling remains an intentional limitation that future B, chromatic, or wider-range work must address deliberately.

**Neutral:**

- Existing C4-G4 and C3-G3 coordinates, event identities, and generated markup remain unchanged.
- This ADR extends ADR-055's range only; it neither supersedes the reversible SVG strategy nor adds complete notation semantics.
- Staff exposure remains presentational and cannot establish that the learner read or recognized A.

## Alternatives Considered

### Use The Existing Text Fallback For D Minor

ADR-055 already permits unsupported exercises to omit the SVG guide. This avoids changing the range contract, but the first new hand position would receive a visibly weaker learning surface and no Reading Focus option even though both A pitches fit the existing geometry.

### Adopt A General Notation Library

A notation library could cover wider ranges and future accidentals, but the current exercises still lack the written-duration, voice, key-signature, and score-layout data required to use such a renderer faithfully. It would add dependency and browser cost for two natural pitches.

### Remove The Upper Bound For Natural Pitches

The geometry can calculate further diatonic positions and ledger lines, but accepting an unbounded range would silently create layout and accessibility promises that have not been tested on the practice stage. Keeping A as an explicit ceiling makes the next expansion deliberate.
