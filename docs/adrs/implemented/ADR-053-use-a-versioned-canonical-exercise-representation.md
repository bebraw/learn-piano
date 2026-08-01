# ADR-053: Use a Versioned Canonical Exercise Representation

**Status:** Implemented

**Date:** 2026-08-01

## Context

An exercise is needed by several parts of the application: the server-rendered view, live evaluator, attempt persistence, curriculum links, tests, and a possible future notation system. Hard-coding C-D-E-F-G into a DOM component or evaluator would make those consumers disagree as soon as exercises gain chords, rhythm, fingering, dynamics, or source metadata.

Exercise definitions will evolve independently from the schema that describes them. Persisted attempts also need enough identity to remain interpretable after an exercise changes. The format must support lawful original, public-domain, licensed, or user-imported material without treating protected repertoire goals as bundled score content.

## Decision

Define one JSON-serializable, typed canonical exercise representation outside the UI and evaluator layers.

Every definition has a stable exercise identifier, an exercise revision, and a format schema version. The schema version identifies representation compatibility; the exercise revision changes when evaluation-relevant content under a stable identifier changes. Published revisions are not silently mutated in place. Persisted attempts reference the stable identifier and revision they evaluated.

The model is deliberately extensible for ordered or timed events, individual notes and chords, hand assignment, tempo and rhythm, fingering suggestions, dynamic targets, prerequisites, curriculum and repertoire-goal tags, difficulty, and source/copyright metadata. The initial six-exercise library uses only the subset required for untimed ordered note sequences.

Rendered views, evaluators, persistence records, fixtures, and future notation adapters consume the same canonical identity and definition. Platform MIDI messages, DOM references, rendered notation objects, and evaluator state are not stored in the exercise definition. External or user-imported definitions must cross an explicit runtime-validation and version-migration boundary before becoming canonical data.

## Trigger

The initial exercise library must be rendered, evaluated, tested, and recorded without copying its note sequences into each consumer.

## Consequences

**Positive:**

- All consumers share one exercise identity and source of musical intent.
- Format evolution and content revision have distinct, explicit version semantics.
- The initial simple sequences can grow toward chords, timing, curriculum, and notation without a parallel exercise model.
- Source and copyright metadata travel with material instead of living as informal UI text.

**Negative:**

- Even a five-note exercise requires schema, identity, and revision machinery.
- Schema migrations and old exercise revisions need deliberate compatibility tests as the format evolves.
- A general model must resist accumulating speculative fields with no consumer or contract.

**Neutral:**

- The canonical representation describes musical intent; it does not choose how notation is rendered.
- Repertoire goals may be metadata without containing protected notes, notation, recordings, or transcriptions.

## Alternatives Considered

### Hard-Code Each Exercise In Its UI And Evaluator

This is shortest for each individual sequence but immediately creates multiple sources of truth and makes persistence identifiers and replay fixtures fragile as the library grows.

### Use MusicXML As The Canonical Format

MusicXML has broad notation coverage, but adopting its import, validation, and semantic complexity is explicitly outside the first slice. A future importer can translate lawful input into the smaller domain model.

### Use MIDI Files As Exercise Definitions

MIDI captures performance events but does not naturally express curriculum prerequisites, hand and fingering guidance, lawful-source metadata, or the distinction between exercise intent and a particular performance.

### Adopt A Notation Library's Internal Model

This could accelerate rendering later, but it would couple evaluation and persistence to a presentation dependency that has not yet been selected.
