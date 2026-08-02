# ADR-064: Curate Public-Domain Repertoire as Bounded Learning Arrangements

**Status:** Implemented

**Date:** 2026-08-02

## Context

Recognizable repertoire is an important part of the learner's motivation, but a composition, a modern edition, an arrangement, and a recording can have different rights. A composer's death long ago does not by itself authorize copying a recent piano arrangement, engraving, fingering, MIDI file, or recording. The application also currently represents ordered single-note events with optional onset timing; it cannot yet encode or assess full polyphonic scores, duration, articulation, pedal, dynamics, or physical technique.

The library needs a lawful way to launch public-domain repertoire without making source provenance informal, copying more material than the current learning task needs, or presenting a bounded MIDI exercise as a performance of the complete work.

## Decision

Curate public-domain repertoire as project-authored, bounded canonical learning arrangements:

- Verify the underlying composition against the supported jurisdiction's term guidance and identify a composer-era or otherwise public-domain score or manuscript source before encoding notes.
- Independently encode only the notes needed by the learning task. Do not import or bundle third-party notation files, MIDI files, recordings, editorial fingerings, or other modern-edition material.
- Require every `public-domain` exercise source to carry composer attribution, the original work title or catalogue identity, an explicit public-domain rights note, an HTTPS reference-score URL, and a plain-language adaptation note.
- Label the result as an excerpt, motif, ground bass, or learning arrangement rather than the complete work. Difficulty describes the included arrangement relative to this application, not an examination grade or the difficulty of the original score.
- Keep evaluation claims bounded to the canonical events. Completion can establish the encoded pitch order and any explicitly represented onset intervals, but not the complete composition, omitted voices, original key or register, duration, phrasing, articulation, dynamics, pedal, fingering, hand use, reading, interpretation, or mastery.
- Keep protected repertoire as non-launchable goal metadata unless separately licensed or supplied through a lawful user-content boundary.
- Once at least one lawful exercise carries the `repertoire` curriculum prefix, expose the existing inclusive Repertoire folio focus without changing filter persistence, recommendations, or exercise availability.

The first sampler uses three eight-note, natural-note, single-hand, untimed arrangements from Beethoven, Pachelbel, and J. S. Bach. It adds no external runtime asset, notation dependency, recording, database, or schema-version increment.

## Trigger

The learner asked for Bach and other out-of-copyright music at different skill levels, making the previously future-only Repertoire pathway launchable for the first time.

## Consequences

**Positive:**

- Recognizable music can enter the practice loop with reviewable rights and transformation provenance.
- The initial repertoire remains fully compatible with the deterministic evaluator, staff guide, local history, recommendation, and no-JavaScript surfaces.
- Source and scope remain visible to the learner instead of being buried in implementation comments.

**Negative:**

- Each new work requires source research, independent transcription, provenance metadata, and a scope review.
- Bounded learning arrangements are less complete than full scores and must repeat their exclusions clearly.
- Public-domain status may vary by jurisdiction, so a broader distribution target requires a new rights review.

**Neutral:**

- Public-domain status grants no curriculum mastery or recommendation priority.
- The application links to reference-score pages but does not depend on them at runtime.
- Existing attempts and original exercise identities remain unchanged.

## Alternatives Considered

### Bundle Public-Domain PDFs Or MIDI Files

This could provide more complete material quickly, but a file may contain separately protected engraving, arrangement, or performance work. It would also introduce assets and semantics the current evaluator does not consume.

### Adopt A Full Score Or MusicXML Model First

This would support more faithful repertoire later, but it adds polyphony, notation, import, migration, and rendering decisions far beyond the three bounded learning tasks requested now.

### Use Familiar Modern Arrangements

Modern arrangements are convenient but may remain protected even when the underlying composition is public domain. Independent project arrangements from verified public-domain sources keep the rights boundary explicit.

### Keep Repertoire As Future Goals Only

This avoids rights work but no longer fits the product need once verified public-domain material and an honest bounded representation are available.
