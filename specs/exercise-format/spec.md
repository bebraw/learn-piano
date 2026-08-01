# Feature: Exercise Format

## Blueprint

### Context

Exercises need one canonical representation so instructions, visual guidance, evaluation, persistence, fixtures, curriculum, and a future notation layer cannot drift into separate interpretations of the same musical task. The representation starts with a compact beginner library but must evolve deliberately toward chords, rhythm, technique, and lawfully sourced repertoire.

### Current Starter Library Scope

- The validated library contains six schema-version-1, revision-1 exercises:
  - `five-note-ascent-c-major-right-hand`: C4-D4-E4-F4-G4
  - `five-note-descent-c-major-right-hand`: G4-F4-E4-D4-C4
  - `five-note-ascent-c-major-left-hand`: C3-D3-E3-F3-G3
  - `five-note-descent-c-major-left-hand`: G3-F3-E3-D3-C3
  - `step-skip-c-major-right-hand`: C4-E4-D4-F4-G4
  - `step-skip-c-major-left-hand`: C3-E3-D3-F3-G3
- Every starter exercise contains exactly five distinct pitches, remains compatible with the five-key practice view, and uses the deterministic `untimed-ordered-notes` evaluator.
- The original right-hand ascent remains the default so existing links and attempt identity stay stable. The library API exposes `exerciseLibrary`, `defaultExercise`, `DEFAULT_EXERCISE_ID`, and nullable lookup by stable ID.
- Each exercise has learner-facing title and instructions, beginner difficulty, explicit hand and prerequisite metadata, curriculum tags, and source metadata identifying it as original project material.
- Titles name the assigned hand consistently. Instructions offer concise conventional C-position fingering as optional learner guidance; MIDI evaluation checks only the canonical pitch order and cannot verify which fingers were used.
- The starter library has no required tempo, duration, rhythmic value, velocity target, fingering assessment, notation payload, audio asset, or bundled repertoire content.

### Future Scope

- Later schema versions or backward-compatible optional fields may represent chords, ordered timed events, both-hand material, tempo, meter, rhythm, duration, fingering suggestions, dynamic targets, prerequisites, curriculum tags, repertoire-goal tags, and difficulty variants.
- A later notation system, imported score format, or licensed content source must adapt to this canonical domain model rather than become a parallel exercise identity system.
- MusicXML parsing, a notation framework, and copyrighted repertoire content are not part of the starter library and require separate decisions or lawful input.

### Architecture

- **Canonical identity:** `id` is a stable opaque identifier for the musical learning task. `revision` is a positive integer that changes when behavior, expected events, or learning intent changes. The pair `(id, revision)` identifies the exact exercise attempted.
- **Schema identity:** `schemaVersion` is a positive integer describing the document shape. It is independent of the exercise revision.
- **Core document:** A version-1 exercise contains its identity, title, plain-language instructions, evaluation mode, ordered expected events, difficulty, hand metadata, source metadata, prerequisites, curriculum tags, and repertoire-goal tags. Fields with no values use explicit empty collections or are omitted according to the typed schema; they are never inferred from rendered DOM.
- **Library boundary:** Each document is validated when constructed, and the complete library is validated again for duplicate canonical IDs before export. Selection is by stable ID rather than title or array position; unknown IDs resolve to `null` so callers can choose an explicit fallback.
- **Expected event identity:** Each expected event has an ID unique within the exercise. A version-1 event identifies an individual MIDI note and its hand. Event order in the canonical list defines the expected order for an untimed sequence.
- **Pitch convention:** MIDI note number is authoritative for machine comparison. Display labels use scientific pitch notation with middle C represented as C4/MIDI 60.
- **Evaluation mode:** Every starter exercise declares `untimed-ordered-notes`. Evaluators reject unsupported modes rather than guessing semantics.
- **Source and rights metadata:** Each exercise declares whether it is original, public domain, licensed, or user-provided, plus attribution or license information when applicable. A repertoire-goal tag is motivational metadata and never grants permission to embed the referenced composition.
- **Validation boundary:** Exercise data is validated at document construction and as a complete library before use. Renderer, evaluator, fixtures, persistence, and curriculum consume the resulting typed exercise and the same canonical ID/revision.
- **Dependencies:** Exercise documents contain domain data and no browser, MIDI-device, view, persistence, or framework objects.

### Versioning Rules

- Correcting prose without changing musical behavior may retain the exercise revision.
- Changing expected pitches, order, mode, hand assignment, prerequisite meaning, or learning objective increments the exercise revision.
- A breaking document-shape change increments `schemaVersion`; readers either migrate it explicitly or report it as unsupported.
- Existing attempt records keep their original ID and revision and are not rewritten to a newer exercise revision.
- IDs are not derived from display titles or array positions and are never reused for a different learning task.

### Edge Cases

- Unknown schema versions and evaluation modes fail validation with a useful error; they are not partially rendered or evaluated.
- Missing IDs, duplicate expected-event IDs, duplicate exercise IDs within one library, empty expected-event lists, out-of-range MIDI notes, invalid hand values, and non-positive revisions are invalid.
- Repeated pitches are valid when represented as separate expected events with distinct event IDs.
- The general schema continues to allow repeated pitches, while every exercise in the current five-key starter library deliberately uses exactly five distinct pitches.
- Chords are not encoded as adjacent individual notes whose shared timing is merely implied. A future chord event must make simultaneity explicit.
- Optional tempo or dynamic metadata must not accidentally turn an untimed exercise into a timed or velocity-scored exercise.
- A missing optional repertoire goal never prevents an otherwise valid original exercise from loading.

### Anti-Patterns

- Do not hard-code any starter sequence in a view, controller, fixture runner, or evaluator.
- Do not use visible labels, DOM element IDs, titles, or curriculum positions as canonical exercise identity.
- Do not let persisted attempts refer only to "the current exercise" without its ID and revision.
- Do not encode future chords or rhythms through undocumented array conventions.
- Do not add platform event objects, callbacks, rendered markup, or persistence handles to exercise documents.
- Do not interpret artist names or piece titles as permission to include protected notation, MIDI, audio, lyrics, or substantial melodic material.
- Do not claim physical fingering, tension, or technique can be inferred from exercise metadata or MIDI alone.

## Contract

### Definition of Done

- [ ] One validated canonical library defines the available exercises and is consumed by view, evaluator, persistence, fixtures, and curriculum references.
- [ ] Six stable starter exercises cover right and left hands, ascending and descending motion, and step-skip coordination while preserving the original right-hand ascent as default.
- [ ] Every starter exercise contains five distinct pitches and remains compatible with the untimed evaluator and five-key view.
- [ ] Library lookup returns the matching canonical object for a known stable ID and `null` for an unknown ID.
- [ ] Schema version, stable exercise ID, and exercise revision have distinct documented meanings.
- [ ] Invalid or unsupported exercise data fails before a practice session begins.
- [ ] Source and rights metadata exists for every exercise.
- [ ] Future extension points are typed or reserved without requiring their runtime implementation in the starter library.
- [ ] The spec is updated in the same change set when exercise semantics or versioning rules change.
- [ ] Automated tests cover valid loading and every critical validation branch.

### Regression Guardrails

- All consumers must continue to use the canonical `(id, revision)` pair.
- C4 must remain MIDI note 60 and C3 MIDI note 48 throughout domain, display, fixture, and evaluation boundaries.
- Reordering rendered keys must not change the canonical expected sequence.
- Untimed exercises must remain independent of tempo, duration, inter-event spacing, and velocity.
- Unsupported schema versions and modes must fail closed instead of being guessed.
- Existing attempt history must remain attributable to the exact revision performed.
- Repertoire goals must remain metadata-only until lawful source content is deliberately introduced.
- Adding future fields must not make existing valid version-1 exercises change meaning.

### Verification

- **Schema tests:** Accept every canonical starter exercise; reject unknown versions, invalid modes, empty sequences, duplicate IDs, invalid hands, invalid revisions, and out-of-range MIDI notes.
- **Library tests:** Protect stable identities and default selection, validate all source metadata and prerequisites, require five distinct pitches per exercise, and prove left-hand, descending, and step-skip coverage.
- **Consumer contract tests:** Rendered guidance and evaluator expectations are derived from the same fixture and identity.
- **Versioning tests:** A stored attempt continues to resolve its original ID/revision after a newer revision is added.
- **Coverage target:** Exercise parsing, validation, and version dispatch branches remain fully exercised.

### Scenarios

**Scenario: Load the starter library**

- Given: six schema-version-1 documents for the starter exercises
- When: the exercise library validates them
- Then: it exposes six unique stable IDs, five distinct pitches per exercise, lawful original-source metadata, and the original right-hand ascent as default

**Scenario: Choose left-hand descending work**

- Given: the learner selects `five-note-descent-c-major-left-hand`
- When: the exercise is resolved by canonical ID
- Then: it exposes the untimed left-hand sequence 55, 53, 52, 50, and 48 in that order

**Scenario: Practice steps and skips**

- Given: the learner selects either step-skip exercise
- When: its ordered events are inspected
- Then: the five unique pitches contain both neighboring steps and wider skips without adding timing or velocity scoring

**Scenario: Render and evaluate one identity**

- Given: a starter exercise is selected
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
