# Feature: Exercise Format

## Blueprint

### Context

Exercises need one canonical representation so instructions, visual guidance, evaluation, persistence, fixtures, curriculum, and a future notation layer cannot drift into separate interpretations of the same musical task. The representation starts with a compact beginner library but must evolve deliberately toward chords, rhythm, technique, and lawfully sourced repertoire.

### Current Library Scope

- The validated library contains eight schema-version-1, revision-1 exercises:
  - `five-note-ascent-c-major-right-hand`: C4-D4-E4-F4-G4
  - `five-note-descent-c-major-right-hand`: G4-F4-E4-D4-C4
  - `five-note-ascent-c-major-left-hand`: C3-D3-E3-F3-G3
  - `five-note-descent-c-major-left-hand`: G3-F3-E3-D3-C3
  - `step-skip-c-major-right-hand`: C4-E4-D4-F4-G4
  - `step-skip-c-major-left-hand`: C3-E3-D3-F3-G3
  - `steady-quarter-c-major-right-hand`: C4-D4-E4-F4-G4 at quarter-note beat offsets 0–4
  - `steady-quarter-c-major-left-hand`: C3-D3-E3-F3-G3 at quarter-note beat offsets 0–4
- Every current exercise contains exactly five distinct pitches and remains compatible with the five-key practice view. The original six use `untimed-ordered-notes`; the two steady-quarter studies use `timed-ordered-notes`.
- The original right-hand ascent remains the default so existing links and attempt identity stay stable. The library API exposes `exerciseLibrary`, `defaultExercise`, `DEFAULT_EXERCISE_ID`, and nullable lookup by stable ID.
- Each exercise has learner-facing title and instructions, beginner difficulty, explicit hand and prerequisite metadata, curriculum tags, and source metadata identifying it as original project material.
- Titles name the assigned hand consistently. Instructions offer concise conventional C-position fingering as optional learner guidance; MIDI evaluation checks only the canonical pitch order and cannot verify which fingers were used.
- Each steady-quarter exercise requires the matching untimed ascent, belongs to the `rhythm-and-coordination.steady-quarter-notes` curriculum competency, and defines a 40–100 BPM range with 60 BPM default, 4/4 meter, quarter-note beat unit, four-beat count-in, and ±0.2-beat timing window.
- The current library has no note-duration target, velocity target, fingering assessment, notation payload, audio asset, rests, eighth notes, syncopation, chords, hands-together material, adaptive tempo, or bundled repertoire content.

### Future Scope

- Later schema versions or backward-compatible optional fields may represent chords, both-hand material, note duration, rests, subdivisions, syncopation, fingering suggestions, dynamic targets, adaptive tempo, repertoire-goal tags, and difficulty variants.
- A later notation system, imported score format, or licensed content source must adapt to this canonical domain model rather than become a parallel exercise identity system.
- MusicXML parsing, a notation framework, and copyrighted repertoire content are not part of the current library and require separate decisions or lawful input.

### Architecture

- **Canonical identity:** `id` is a stable opaque identifier for the musical learning task. `revision` is a positive integer that changes when behavior, expected events, or learning intent changes. The pair `(id, revision)` identifies the exact exercise attempted.
- **Schema identity:** `schemaVersion` is a positive integer describing the document shape. It is independent of the exercise revision.
- **Core document:** A version-1 exercise contains its identity, title, plain-language instructions, evaluation mode, ordered expected events, difficulty, hand metadata, source metadata, prerequisites, curriculum tags, and repertoire-goal tags. A timed exercise also contains exercise-level timing metadata, while each of its expected events declares a beat offset. Fields with no values use explicit empty collections or are omitted according to the typed schema; they are never inferred from rendered DOM.
- **Library boundary:** Each document is validated when constructed, and the complete library is validated again for duplicate canonical IDs before export. Selection is by stable ID rather than title or array position; unknown IDs resolve to `null` so callers can choose an explicit fallback.
- **Expected event identity:** Each expected event has an ID unique within the exercise. A version-1 event identifies an individual MIDI note and its hand. Event order in the canonical list defines pitch order. `beatOffset` is absent for untimed events and required for timed events; it measures canonical beat-unit distance from the exercise's first event rather than an audio or wall-clock timestamp.
- **Pitch convention:** MIDI note number is authoritative for machine comparison. Display labels use scientific pitch notation with middle C represented as C4/MIDI 60.
- **Evaluation mode:** Each exercise explicitly declares `untimed-ordered-notes` or `timed-ordered-notes`. Untimed mode rejects timing metadata and beat offsets. Timed mode requires `timing`, a zero beat offset on the first event, and finite, non-negative, strictly increasing offsets thereafter. Evaluators reject unsupported modes or invalid mode-specific combinations rather than guessing semantics.
- **Timing metadata:** Positive finite `defaultBpm`, `minBpm`, and `maxBpm` values define an inclusive tempo range; the evaluator accepts integer attempt tempos within it, and the current studies require 40–100 BPM with 60 BPM default. Positive integer `beatsPerMeasure: 4` and `beatUnit: 4` define 4/4, non-negative integer `countInBeats: 4` defines the guidance count-in, and non-negative finite `timingWindowBeats: 0.2` defines the inclusive early/late tolerance around each canonical beat gap.
- **Source and rights metadata:** Each exercise declares whether it is original, public domain, licensed, or user-provided, plus attribution or license information when applicable. A repertoire-goal tag is motivational metadata and never grants permission to embed the referenced composition.
- **Validation boundary:** Exercise data is validated at document construction and as a complete library before use. Renderer, evaluator, fixtures, persistence, and curriculum consume the resulting typed exercise and the same canonical ID/revision.
- **Dependencies:** Exercise documents contain domain data and no browser, MIDI-device, view, persistence, or framework objects.

### Versioning Rules

- Correcting prose without changing musical behavior may retain the exercise revision.
- Changing expected pitches, order, beat offsets, timing metadata, mode, hand assignment, prerequisite meaning, or learning objective increments the exercise revision.
- A breaking document-shape change increments `schemaVersion`; readers either migrate it explicitly or report it as unsupported.
- Existing attempt records keep their original ID and revision and are not rewritten to a newer exercise revision.
- IDs are not derived from display titles or array positions and are never reused for a different learning task.

### Edge Cases

- Unknown schema versions and evaluation modes fail validation with a useful error; they are not partially rendered or evaluated.
- Missing IDs, duplicate expected-event IDs, duplicate exercise IDs within one library, empty expected-event lists, out-of-range MIDI notes, invalid hand values, and non-positive revisions are invalid.
- Repeated pitches are valid when represented as separate expected events with distinct event IDs.
- The general schema continues to allow repeated pitches, while every exercise in the current five-key library deliberately uses exactly five distinct pitches.
- Chords are not encoded as adjacent individual notes whose shared timing is merely implied. A future chord event must make simultaneity explicit.
- Timing metadata or beat offsets on an untimed exercise are invalid rather than silently turning it into a timed exercise.
- Timed exercises reject missing or non-increasing beat offsets, a non-zero first offset, invalid or inverted tempo bounds, a default tempo outside the declared range, invalid meter/count-in values, and a negative or non-finite timing window.
- A missing optional repertoire goal never prevents an otherwise valid original exercise from loading.

### Anti-Patterns

- Do not hard-code any canonical sequence in a view, controller, fixture runner, or evaluator.
- Do not use visible labels, DOM element IDs, titles, or curriculum positions as canonical exercise identity.
- Do not let persisted attempts refer only to "the current exercise" without its ID and revision.
- Do not encode future chords or rhythms through undocumented array conventions.
- Do not encode audible click times, MIDI timestamps, or a selected attempt tempo in the canonical exercise; it defines beat-relative intent and allowed tempo only.
- Do not add platform event objects, callbacks, rendered markup, or persistence handles to exercise documents.
- Do not interpret artist names or piece titles as permission to include protected notation, MIDI, audio, lyrics, or substantial melodic material.
- Do not claim physical fingering, tension, or technique can be inferred from exercise metadata or MIDI alone.

## Contract

### Definition of Done

- [ ] One validated canonical library defines the available exercises and is consumed by view, evaluator, persistence, fixtures, and curriculum references.
- [ ] Eight stable exercises cover right and left hands, ascending and descending motion, step-skip coordination, and steady quarter notes while preserving the original right-hand ascent as default.
- [ ] Every current exercise contains five distinct pitches and remains compatible with the five-key view; exactly two use the timed evaluator.
- [ ] Both timed studies define beat offsets 0–4, 40–100 BPM with 60 BPM default, 4/4 quarter-note pulse, four-beat count-in, and ±0.2-beat tolerance.
- [ ] Library lookup returns the matching canonical object for a known stable ID and `null` for an unknown ID.
- [ ] Schema version, stable exercise ID, and exercise revision have distinct documented meanings.
- [ ] Invalid or unsupported exercise data fails before a practice session begins.
- [ ] Source and rights metadata exists for every exercise.
- [ ] Future extension points are typed or reserved without requiring their runtime implementation in the current library.
- [ ] The spec is updated in the same change set when exercise semantics or versioning rules change.
- [ ] Automated tests cover valid loading and every critical validation branch.

### Regression Guardrails

- All consumers must continue to use the canonical `(id, revision)` pair.
- C4 must remain MIDI note 60 and C3 MIDI note 48 throughout domain, display, fixture, and evaluation boundaries.
- Reordering rendered keys must not change the canonical expected sequence.
- Untimed exercises must remain independent of tempo, duration, inter-event spacing, and velocity.
- Timed exercises must derive interval targets from canonical beat offsets and a selected tempo inside the declared range; they must not contain runtime audio or MIDI timestamps.
- The steady-quarter studies must remain hands-separate, single-note, quarter-note material unless a later revision and updated contract explicitly broaden them.
- Unsupported schema versions and modes must fail closed instead of being guessed.
- Existing attempt history must remain attributable to the exact revision performed.
- Repertoire goals must remain metadata-only until lawful source content is deliberately introduced.
- Adding future fields must not make existing valid version-1 exercises change meaning.

### Verification

- **Schema tests:** Accept every canonical exercise; reject unknown versions, invalid modes, empty sequences, duplicate IDs, invalid hands, invalid revisions, out-of-range MIDI notes, mode/timing mismatches, invalid tempo ranges, and missing or non-increasing timed beat offsets.
- **Library tests:** Protect stable identities and default selection, validate all source metadata and prerequisites, require five distinct pitches per exercise, and prove left-hand, descending, step-skip, and steady-quarter coverage.
- **Consumer contract tests:** Rendered guidance and evaluator expectations are derived from the same fixture and identity.
- **Versioning tests:** A stored attempt continues to resolve its original ID/revision after a newer revision is added.
- **Coverage target:** Exercise parsing, validation, and version dispatch branches remain fully exercised.

### Scenarios

**Scenario: Load the current library**

- Given: eight schema-version-1 documents for the current exercises
- When: the exercise library validates them
- Then: it exposes eight unique stable IDs, five distinct pitches per exercise, lawful original-source metadata, two timed steady-quarter studies, and the original right-hand ascent as default

**Scenario: Choose left-hand descending work**

- Given: the learner selects `five-note-descent-c-major-left-hand`
- When: the exercise is resolved by canonical ID
- Then: it exposes the untimed left-hand sequence 55, 53, 52, 50, and 48 in that order

**Scenario: Practice steps and skips**

- Given: the learner selects either step-skip exercise
- When: its ordered events are inspected
- Then: the five unique pitches contain both neighboring steps and wider skips without adding timing or velocity scoring

**Scenario: Load a steady-quarter study**

- Given: the learner selects `steady-quarter-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes C4-D4-E4-F4-G4 at beat offsets 0–4, `timed-ordered-notes`, 40–100 BPM with 60 BPM default, 4/4 quarter pulse, four count-in beats, and a 0.2-beat timing window

**Scenario: Reject an invalid timed exercise**

- Given: a `timed-ordered-notes` exercise omits a beat offset or declares beat offsets that do not increase
- When: the exercise is validated
- Then: validation fails before rendering or evaluation rather than inferring a rhythm from array position

**Scenario: Render and evaluate one identity**

- Given: a canonical exercise is selected
- When: the page renders instructions and starts evaluation
- Then: both surfaces use the same canonical exercise ID, revision, and expected-event list

**Scenario: Reject an unknown schema**

- Given: an exercise declares a schema version the application does not support
- When: the exercise is loaded
- Then: practice does not start and the application reports that the format is unsupported

**Scenario: Preserve a repeated pitch**

- Given: a future valid exercise contains the same pitch twice in succession with different expected-event IDs
- When: it is validated
- Then: both events remain distinct expectations rather than being deduplicated

**Scenario: Repertoire goal has no embedded content**

- Given: an exercise or pathway references a protected piece as a future goal
- When: its canonical data is inspected
- Then: the reference contains competency and goal metadata only, with no unlicensed score, MIDI transcription, recording, lyrics, or substantial melody

**Scenario: Exercise behavior changes**

- Given: an author changes the expected note order
- When: the updated exercise is published
- Then: its revision increments while older attempts retain the previous revision
