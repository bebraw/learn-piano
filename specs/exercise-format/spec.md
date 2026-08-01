# Feature: Exercise Format

## Blueprint

### Context

Exercises need one canonical representation so instructions, visual guidance, evaluation, persistence, fixtures, curriculum, the current pitch guide, and any future full-notation layer cannot drift into separate interpretations of the same musical task. The representation starts with a compact beginner library but must evolve deliberately toward simultaneous chords, rhythm, technique, and lawfully sourced repertoire.

### Current Library Scope

- The validated library contains thirty schema-version-1, revision-1 exercises:
  - `five-note-ascent-c-major-right-hand`: C4-D4-E4-F4-G4
  - `five-note-descent-c-major-right-hand`: G4-F4-E4-D4-C4
  - `five-note-ascent-c-major-left-hand`: C3-D3-E3-F3-G3
  - `five-note-descent-c-major-left-hand`: G3-F3-E3-D3-C3
  - `step-skip-c-major-right-hand`: C4-E4-D4-F4-G4
  - `step-skip-c-major-left-hand`: C3-E3-D3-F3-G3
  - `steady-quarter-c-major-right-hand`: C4-D4-E4-F4-G4 at quarter-note beat offsets 0–4
  - `steady-quarter-c-major-left-hand`: C3-D3-E3-F3-G3 at quarter-note beat offsets 0–4
  - `steady-quarter-step-skip-c-major-right-hand`: C4-E4-D4-F4-G4 at quarter-note beat offsets 0–4
  - `steady-quarter-step-skip-c-major-left-hand`: C3-E3-D3-F3-G3 at quarter-note beat offsets 0–4
  - `even-eighths-c-major-right-hand`: C4-D4-E4-F4-G4 at beat offsets 0, 0.5, 1, 1.5, and 2
  - `even-eighths-c-major-left-hand`: C3-D3-E3-F3-G3 at beat offsets 0, 0.5, 1, 1.5, and 2
  - `ordered-chord-tones-c-major-right-hand` (`C major chord tones · right hand`): C4-E4-G4-E4-C4
  - `ordered-chord-tones-c-major-left-hand` (`C major chord tones · left hand`): C3-E3-G3-E3-C3
  - `ordered-chord-tones-d-minor-right-hand` (`D minor chord tones · right hand`): D4-F4-A4-F4-D4
  - `ordered-chord-tones-d-minor-left-hand` (`D minor chord tones · left hand`): D3-F3-A3-F3-D3
  - `five-note-ascent-d-minor-right-hand` (`Five-note ascent in D minor · right hand`): D4-E4-F4-G4-A4
  - `five-note-ascent-d-minor-left-hand` (`Five-note ascent in D minor · left hand`): D3-E3-F3-G3-A3
  - `repeated-note-eighths-c-major-right-hand` (`Repeated pairs in C · right hand`): C4-C4-D4-D4-E4 at beat offsets 0, 0.5, 1, 1.5, and 2
  - `repeated-note-eighths-c-major-left-hand` (`Repeated pairs in C · left hand`): C3-C3-D3-D3-E3 at beat offsets 0, 0.5, 1, 1.5, and 2
  - `mixed-eighth-pattern-c-major-right-hand` (`Mixed eighth pattern in C · right hand`): C4-E4-D4-D4-F4-G4-E4-C4 at beat offsets 0 through 3.5 in half-beat steps
  - `mixed-eighth-pattern-c-major-left-hand` (`Mixed eighth pattern in C · left hand`): C3-E3-D3-D3-F3-G3-E3-C3 at beat offsets 0 through 3.5 in half-beat steps
  - `offbeat-step-skip-c-major-right-hand` (`Offbeat step and skip in C · right hand`): C4-E4-D4-F4-G4 at beat offsets 0, 0.5, 1.5, 2.5, and 3.5
  - `offbeat-step-skip-c-major-left-hand` (`Offbeat step and skip in C · left hand`): C3-E3-D3-F3-G3 at beat offsets 0, 0.5, 1.5, 2.5, and 3.5
  - `steady-quarter-broken-chord-c-major-right-hand` (`Steady broken chord in C · right hand`): C4-E4-G4-E4-C4-E4-G4-E4 at beat offsets 0–7
  - `steady-quarter-broken-chord-c-major-left-hand` (`Steady broken chord in C · left hand`): C3-E3-G3-E3-C3-E3-G3-E3 at beat offsets 0–7
  - `three-four-broken-chord-c-major-right-hand` (`Broken chord in 3/4 · right hand`): C4-E4-G4-C4-E4-G4-C4 at beat offsets 0–6
  - `three-four-broken-chord-c-major-left-hand` (`Broken chord in 3/4 · left hand`): C3-E3-G3-C3-E3-G3-C3 at beat offsets 0–6
  - `five-four-pulse-c-major-right-hand` (`Five-count pulse in C · right hand`): C4-D4-E4-F4-G4-C4 at beat offsets 0–5
  - `five-four-pulse-c-major-left-hand` (`Five-count pulse in C · left hand`): C3-D3-E3-F3-G3-C3 at beat offsets 0–5
- Twenty-two studies contain five expected-event occurrences; the 5/4 pulse pair contains six; the 3/4 broken-chord pair contains seven; and the mixed-pattern and steady broken-chord pairs each contain eight. The first twelve exercises, the D-minor five-note ascent pair, and the offbeat pair contain five distinct pitches; the four ordered chord-tone studies plus the repeated-note, steady broken-chord, and 3/4 broken-chord pairs each contain three distinct pitches; the 5/4 pair returns to its first C across six event IDs and five distinct C-position pitches; and the mixed pair returns to five distinct C-position pitches across eight event IDs. Twelve studies use `untimed-ordered-notes`; eighteen use `timed-ordered-notes`.
- The original right-hand ascent remains the default so existing links and attempt identity stay stable. The library API exposes `exerciseLibrary`, `defaultExercise`, `DEFAULT_EXERCISE_ID`, and nullable lookup by stable ID.
- Canonical library order is deterministic recommendation policy: it resolves candidate and equal-recency ties, but it is not exercise identity and must not be inferred from rendered card or storage order.
- Each exercise has learner-facing title and instructions, beginner difficulty, explicit hand and prerequisite metadata, curriculum tags, and source metadata identifying it as original project material.
- Titles name the assigned hand consistently. Instructions offer concise conventional C- or D-position fingering as optional learner guidance; MIDI evaluation checks only the canonical pitch order and cannot verify which fingers were used.
- Each straight steady-quarter exercise requires the matching untimed ascent. Each timed step-and-skip exercise requires, in canonical prerequisite order, its matching untimed step-and-skip exercise and matching straight steady-quarter exercise. Those four belong to the `rhythm-and-coordination.steady-quarter-notes` curriculum competency and define beat offsets 0–4 with a ±0.2-beat timing window. The timed step-and-skip pair additionally carries the existing interval-recognition and step-skip-coordination tags.
- Each ascending even-eighth exercise requires only the matching straight steady-quarter exercise. The pair carries `rhythm-and-coordination.even-eighth-note-onsets`, `rhythm-and-coordination.subdivision`, and hands-separate tags, defines beat offsets 0, 0.5, 1, 1.5, and 2, and uses a ±0.1-beat timing window.
- Each repeated-note exercise requires only the matching ascending even-eighth exercise. The pair uses C-C-D-D-E at the same offsets and tolerance and carries `patterns-and-technique.repeated-note-control`, `rhythm-and-coordination.repeated-note-onsets`, even-eighth-onset, subdivision, and hands-separate tags. Its optional fingering and separate-press instruction add no release, duration, articulation, fingering, hand-use, or physical-technique evidence.
- Each mixed-pattern exercise requires, in canonical prerequisite order, the matching repeated-note and ordered chord-tone exercises. The pair uses C-E-D-D-F-G-E-C at offsets 0 through 3.5 in half-beat steps with the same ±0.1-beat tolerance. Eight event IDs preserve its repeated and returning occurrences while five physical C-position keys are reused. Completion provides only ordered pitch and seven MIDI-relative onset-interval facts; it does not prove duration, release, articulation, fingering, hand use, relaxation, staff reading, or consistency across attempts.
- Each offbeat exercise requires only the matching mixed-pattern exercise. The pair reuses C-E-D-F-G at offsets 0, 0.5, 1.5, 2.5, and 3.5 with a ±0.1-beat tolerance and carries offbeat-onset, subdivision, hands-separate, step-skip-coordination, and interval-recognition tags. The first C is the ungraded MIDI anchor and the four later notes are assessed only at their MIDI-relative beat gaps; the result cannot prove audible downbeat or between-click alignment, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, hand use, reading, relaxation, consistency, or mastery.
- Each C-major ordered chord-tone exercise requires only the matching untimed step-and-skip exercise and carries `patterns-and-technique.chord-tone-patterns`, `notes-and-reading.interval-recognition`, and `rhythm-and-coordination.hands-separately`. Each D-minor ordered chord-tone exercise requires only the matching C-major chord-tone study, inserts `patterns-and-technique.minor-chord-vocabulary` after the shared chord-tone tag, and follows the C-major pair in canonical order. C-E-G-E-C and D-F-A-F-D each remain five ordered individual-note events; exercise names and tags add no simultaneity, blocked-chord, chord-quality recognition, voicing, or harmony-assessment semantics.
- Each D-minor five-note ascent requires only the matching D-minor ordered chord-tone study and follows that pair in canonical order. D-E-F-G-A remains five untimed individual-note events, with `notes-and-reading.keyboard-geography`, `notes-and-reading.interval-recognition`, `patterns-and-technique.five-finger-patterns`, `patterns-and-technique.minor-scale-preparation`, and `rhythm-and-coordination.hands-separately` in that order. The title and E-F instructional cue add no complete-scale, half-step-recognition, scale-construction, fingering, evenness, hand-use, or technique evidence.
- Each steady broken-chord exercise requires, in canonical prerequisite order, its matching ordered chord-tone exercise and straight steady-quarter exercise. The pair uses C-E-G-E-C-E-G-E at offsets 0–7 with a ±0.2-beat tolerance and carries broken-chord-pattern, chord-tone-pattern, steady-quarter-note, hands-separate, and interval-recognition tags. Eight event IDs preserve every occurrence while five physical C-position keys are reused. Completion provides only eight ordered-pitch facts and seven MIDI-relative onset-interval facts; it cannot prove audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, hand use, relaxation, harmony recognition, staff reading, consistency, or mastery.
- Each 3/4 broken-chord exercise requires only its matching steady broken-chord exercise. The pair uses C-E-G-C-E-G-C at offsets 0–6 with a ±0.2-beat tolerance, 3/4 meter, and three-beat count-in, and carries three-four-meter, steady-quarter-note, hands-separate, broken-chord-pattern, chord-tone-pattern, and interval-recognition tags. Seven event IDs preserve every occurrence while five physical C-position keys are reused. Completion provides only seven ordered-pitch facts and six MIDI-relative whole-beat interval facts; it cannot prove audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, beat-1 accent or dynamics, duration, release, legato, rests, fingering, hand use, harmony recognition, staff reading, consistency, or mastery.
- Each 5/4 pulse exercise requires only its matching 3/4 broken-chord exercise. The pair uses C-D-E-F-G-C at offsets 0–5 with a ±0.2-beat tolerance, 5/4 meter, and five-beat count-in, and carries five-four-meter, steady-quarter-note, hands-separate, keyboard-geography, and five-finger-pattern tags. Six event IDs preserve the returning C while five physical C-position keys are reused. Completion provides only six ordered-pitch facts and five MIDI-relative whole-beat interval facts; it cannot prove audible 5/4 meter, count-in, phase, downbeat, click, pulse, grouping, beat-1 accent, or measure alignment, nor duration, release, legato, rests, fingering, declared-hand use, relaxation, keyboard geography, five-finger technique, staff reading, consistency, or mastery.
- All eighteen timed studies share a 40–100 BPM range with 60 BPM default and a quarter-note beat unit and click. Fourteen retain 4/4 meter with a four-beat count-in; the 3/4 pair declares three beats per measure and a three-beat count-in; and the 5/4 pair declares five beats per measure and a five-beat count-in.
- A presentation adapter derives a pitch-only staff guide for all current exercises from their existing event IDs, MIDI note numbers, order, and single-hand assignments. Under ADR-063, right-hand C4-A4 natural notes use the supported treble view and left-hand C3-A3 natural notes use the supported bass view.
- A physical-key presentation adapter derives the inclusive natural-note span from the exercise's lowest through highest expected pitch and emits one sorted control per MIDI note in that span. Repeated occurrences reuse a control; intermediate notes absent from the phrase remain idle and playable through the normal evaluator. C-E-G-E-C retains five canonical events and staff markers over C-D-E-F-G, D-F-A-F-D retains five over D-E-F-G-A with E and G idle, D-E-F-G-A uses all five D-position controls, C-D-E-F-G-C retains six, C-E-G-C-E-G-C retains seven, and C-E-G-E-C-E-G-E retains eight.
- A separate rhythm presentation helper derives learner labels from evaluation mode, canonical beat-offset spacing, and timing metadata. The ten integer-grid studies are labelled `Steady pulse` in the catalog and setup surface and `Pitch order · One note per beat` beside the staff. The steady broken-chord instructions count two groups of `1 2 3 4`, while their separate generic pitch-free task applies one note per beat across all eight events. The 3/4 pair retains the pitch-free task `After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.` across seven events. The 5/4 pair retains the pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` across six events. The six regular half-beat-grid studies are labelled `Eighth-note grid` and `Pitch order · Even eighth-note onsets`; their count guidance derives the complete grid from canonical event count and meter, so the regular five-event studies end on count 3 and the eight-event studies show `1 & 2 & 3 & 4 &`. The offbeat pair is labelled `Offbeat grid`, retains pitch-free `1 & 2 & 3 & 4 &` guidance, and uses `Pitch order · Downbeat then offbeat onsets` beside the pitch-only staff. These presentation labels are not canonical exercise identity or added notation semantics.
- The staff guide and physical-key projection add no notation payload, schema version, exercise revision, evaluator behavior, or attempt identity. Fractional beat offsets describe onset subdivision only. Missing numbered-beat targets in the offbeat pair are not encoded rests or assessed silence. The current library still has no written-duration or note-duration target, velocity target, fingering assessment, audio asset, rests, syncopation, simultaneous chord events, hands-together material, adaptive tempo, or bundled repertoire content.

### Future Scope

- Later schema versions or backward-compatible optional fields may represent simultaneous chords, both-hand material, note duration, rests, additional subdivision models, syncopation, fingering suggestions, dynamic targets, adaptive tempo, repertoire-goal tags, and difficulty variants.
- A later full notation system, imported score format, or licensed content source must adapt to this canonical domain model rather than become a parallel exercise identity system.
- Accidentals, written durations, key signatures, rests, multiple voices, both-hand grand staff, MusicXML parsing, a general notation framework, and copyrighted repertoire content are not part of the current library and require separate decisions or lawful input.

### Architecture

- **Canonical identity:** `id` is a stable opaque identifier for the musical learning task. `revision` is a positive integer that changes when behavior, expected events, or learning intent changes. The pair `(id, revision)` identifies the exact exercise attempted.
- **Schema identity:** `schemaVersion` is a positive integer describing the document shape. It is independent of the exercise revision.
- **Core document:** A version-1 exercise contains its identity, title, plain-language instructions, evaluation mode, ordered expected events, difficulty, hand metadata, source metadata, prerequisites, curriculum tags, and repertoire-goal tags. A timed exercise also contains exercise-level timing metadata, while each of its expected events declares a beat offset. Fields with no values use explicit empty collections or are omitted according to the typed schema; they are never inferred from rendered DOM.
- **Library boundary:** Each document is validated when constructed, and the complete library is validated again for duplicate canonical IDs, missing prerequisite references, and prerequisite cycles before export. Selection is by stable ID rather than title or array position; unknown IDs resolve to `null` so callers can choose an explicit fallback. The exported collection order is the deliberate deterministic tie-break for advisory study selection.
- **Expected event identity:** Each expected event has an ID unique within the exercise. A version-1 event identifies an individual MIDI note and its hand. Event order in the canonical list defines pitch order. `beatOffset` is absent for untimed events and required for timed events; it measures canonical beat-unit distance from the exercise's first event rather than an audio or wall-clock timestamp. Finite fractional offsets place onsets on subdivisions of that beat unit without defining written duration, silence, or simultaneity.
- **Pitch convention:** MIDI note number is authoritative for machine comparison. Display labels use scientific pitch notation with middle C represented as C4/MIDI 60.
- **Evaluation mode:** Each exercise explicitly declares `untimed-ordered-notes` or `timed-ordered-notes`. Untimed mode rejects timing metadata and beat offsets. Timed mode requires `timing`, a zero beat offset on the first event, and finite, non-negative, strictly increasing offsets thereafter. Evaluators reject unsupported modes or invalid mode-specific combinations rather than guessing semantics.
- **Timing metadata:** Positive finite `defaultBpm`, `minBpm`, and `maxBpm` values define an inclusive tempo range; the evaluator accepts integer attempt tempos within it, and the current studies require 40–100 BPM with 60 BPM default. Positive integer `beatsPerMeasure` and `beatUnit` define canonical meter, while independent non-negative integer `countInBeats` defines the guidance count-in. Fourteen studies use 4/4 with four count-in beats; the 3/4 pair uses three beats per measure and three count-in beats; and the 5/4 pair uses five beats per measure and five count-in beats. Under ADR-060, the view and pulse service derive meter labels, visible beat count, running-beat wrap, count-in length, and click accents from those fields instead of assuming four. Non-negative finite `timingWindowBeats` defines the exercise-specific inclusive early/late tolerance around each canonical onset: 0.2 beat for the ten steady-quarter studies and 0.1 beat for the eight fractional-position studies.
- **Source and rights metadata:** Each exercise declares whether it is original, public domain, licensed, or user-provided, plus attribution or license information when applicable. A repertoire-goal tag is motivational metadata and never grants permission to embed the referenced composition.
- **Validation boundary:** Exercise data is validated at document construction and as a complete library before use. Renderer, evaluator, fixtures, persistence, and curriculum consume the resulting typed exercise and the same canonical ID/revision.
- **Pitch-guide consumer:** The current notation adapter is a presentation consumer of the typed exercise. It maps the supported single-hand natural MIDI pitches to treble or bass staff geometry and preserves canonical event order and identity; SVG coordinates, glyph choices, and live marker state are not canonical exercise fields.
- **Physical-key consumer:** The current keyboard adapter maps the inclusive natural-note span to one pitch-keyed control per MIDI note. It never deduplicates canonical events or treats a control as an expected-event ID. Evaluator state projects onto each control with `expected` precedence, then `remaining` while any occurrence of that pitch is pending, then `accepted` when all occurrences are accepted; notes absent from the phrase are `idle`, and pressed state is independent.
- **Unsupported notation:** The adapter must report exercises outside its supported subset instead of transposing, clamping, respelling, omitting events, or deriving missing notation semantics. The semantic ordered-note presentation remains the fallback and practice evaluation remains available.
- **Dependencies:** Exercise documents contain domain data and no browser, MIDI-device, view, persistence, or framework objects.

### Versioning Rules

- Correcting prose without changing musical behavior may retain the exercise revision.
- Adding or replacing a presentation-only projection of already-canonical pitches retains the exercise revision when musical behavior, expected events, and learning intent are unchanged.
- Changing expected pitches, order, beat offsets, timing metadata, mode, hand assignment, prerequisite meaning, or learning objective increments the exercise revision.
- A breaking document-shape change increments `schemaVersion`; readers either migrate it explicitly or report it as unsupported.
- Existing attempt records keep their original ID and revision and are not rewritten to a newer exercise revision.
- IDs are not derived from display titles or array positions and are never reused for a different learning task.
- Reordering otherwise unchanged library entries changes recommendation priority but not an exercise's musical task, so it does not increment exercise revisions. The policy change still requires recommendation-spec and tie-break test updates.

### Edge Cases

- Unknown schema versions and evaluation modes fail validation with a useful error; they are not partially rendered or evaluated.
- Missing IDs, duplicate expected-event IDs, duplicate exercise IDs within one library, empty expected-event lists, out-of-range MIDI notes, invalid hand values, and non-positive revisions are invalid.
- Repeated pitches are valid when represented as separate expected events with distinct event IDs.
- A notation consumer preserves separate event markers for repeated pitches and canonical horizontal order for descending or step-and-skip patterns; it does not sort or deduplicate the expected-event sequence.
- Each ordered chord-tone study uses three distinct pitches across five event IDs. The C-major pair reuses C and E controls over C-D-E-F-G; the D-minor chord-tone pair reuses D and F controls over D-E-F-G-A. Event progress, semantic note order, and staff markers remain occurrence-based.
- Each D-minor five-note ascent uses five distinct pitches across five event IDs. Its physical keyboard shows D-E-F-G-A once each with no idle span notes, while the instructional half-step cue remains outside evaluator evidence.
- The repeated-note pair uses three distinct pitches across five event IDs. Its physical keyboard shows C-D-E once each; after the first C or D, the shared control remains expected until the second adjacent occurrence is accepted.
- The mixed-pattern pair uses five distinct pitches across eight event IDs. Its physical keyboard shows C-D-E-F-G once each while staff, semantic, evaluation, and progress projections retain every repeated and returning occurrence.
- The offbeat pair uses five distinct pitches across five event IDs. Its staff and keyboard remain C-position pitch presentations; offsets 0, 0.5, 1.5, 2.5, and 3.5 do not change marker spacing or create rests, accents, or written rhythm.
- The steady broken-chord pair uses three distinct pitches across eight event IDs. Its physical keyboard shows C-D-E-F-G once each while staff, semantic, evaluation, and progress projections retain every returning occurrence; offsets 0–7 do not add written measures or duration semantics.
- The 3/4 broken-chord pair uses three distinct pitches across seven event IDs. Its physical keyboard shows C-D-E-F-G once each while staff, semantic, evaluation, and progress projections retain every returning occurrence; offsets 0–6 and `beatsPerMeasure: 3` do not add written barlines, learner accent evidence, or duration semantics.
- The 5/4 pulse pair uses five distinct pitches across six event IDs. Its physical keyboard shows C-D-E-F-G once each while staff, semantic, evaluation, and progress projections retain both C occurrences; offsets 0–5 and `beatsPerMeasure: 5` do not add written barlines, audible meter or count-in evidence, learner pulse or accent evidence, or duration semantics.
- Chords are not encoded as adjacent individual notes whose shared timing is merely implied. A future simultaneous chord event must make simultaneity explicit; the current chord-tone label describes pitch membership, not simultaneous performance.
- Timing metadata or beat offsets on an untimed exercise are invalid rather than silently turning it into a timed exercise.
- A fractional beat offset is valid onset placement for a timed exercise but cannot be interpreted as note duration, an implicit rest, notation spacing, or a chord relationship.
- Timed exercises reject missing or non-increasing beat offsets, a non-zero first offset, invalid or inverted tempo bounds, a default tempo outside the declared range, invalid meter/count-in values, and a negative or non-finite timing window. Meter and count-in lengths remain explicit independent fields; one must not be inferred by silently replacing the other.
- A missing optional repertoire goal never prevents an otherwise valid original exercise from loading.
- An exercise outside the pitch-guide adapter's supported range, spelling, or hand subset remains a valid canonical exercise even though that adapter declines to draw it.
- A library with an unknown prerequisite reference or any direct or transitive prerequisite cycle is invalid. Advisory recommendation also fails neutral if separately supplied malformed graph data reaches its boundary.

### Anti-Patterns

- Do not hard-code any canonical sequence in a view, controller, fixture runner, or evaluator.
- Do not use a physical key control as canonical event identity, render duplicate physical keys for repeated events, or deduplicate repeated canonical events to match the keyboard.
- Do not use visible labels, DOM element IDs, titles, or curriculum positions as canonical exercise identity.
- Do not derive recommendation priority from rendered exercise order, persisted record order, or object-key iteration; use the validated canonical library order explicitly.
- Do not let persisted attempts refer only to "the current exercise" without its ID and revision.
- Do not encode future simultaneous chords or rhythms through undocumented array conventions.
- Do not encode audible click times, MIDI timestamps, or a selected attempt tempo in the canonical exercise; it defines beat-relative intent and allowed tempo only.
- Do not infer written eighth-note duration merely because two expected onsets are 0.5 beat apart.
- Do not add platform event objects, callbacks, rendered markup, or persistence handles to exercise documents.
- Do not add rendered staff coordinates, clef glyphs, SVG state, or a notation library's document objects to exercise documents.
- Do not infer written duration, rhythm, articulation, dynamics, or staff-reading evidence from pitch-marker shape or spacing.
- Do not interpret artist names or piece titles as permission to include protected notation, MIDI, audio, lyrics, or substantial melodic material.
- Do not claim physical fingering, tension, or technique can be inferred from exercise metadata or MIDI alone.

## Contract

### Definition of Done

- [ ] One validated canonical library defines the available exercises and is consumed by view, evaluator, persistence, fixtures, and curriculum references.
- [ ] Thirty stable exercises cover fifteen studies per hand, ascending and descending motion, untimed and timed step-skip coordination, ordered C-major and D-minor chord tones, D-minor five-note ascents, straight steady quarter notes, steady broken-chord patterns, 3/4 broken-chord loops, 5/4 pulse patterns, even-eighth onset subdivision, adjacent repeated-note onsets, one longer mixed pattern, and offbeat-onset preparation while preserving the original right-hand ascent as default.
- [ ] Twenty-two exercises contain five expected-event occurrences; the 5/4 pair contains six; the 3/4 pair contains seven; and the mixed-pattern and steady broken-chord pairs contain eight. Twelve exercises are untimed and exactly eighteen use the timed evaluator.
- [ ] The physical keyboard renders one control for every natural MIDI note in the expected range, keeps unused span notes idle, reuses controls for repeated pitches, and never changes canonical event or staff-marker identity.
- [ ] The four five-event steady-quarter studies define beat offsets 0–4, the two six-event 5/4 studies define offsets 0–5, the two seven-event 3/4 studies define offsets 0–6, and the two eight-event steady broken-chord studies define offsets 0–7; all ten use ±0.2-beat tolerance. The two ascending even-eighth and two repeated-note studies define five regular half-beat offsets through beat 2, the two mixed-pattern studies define eight regular half-beat offsets through beat 3.5, and the offbeat pair defines 0, 0.5, 1.5, 2.5, and 3.5. All eight fractional-position studies use ±0.1 beat, and all eighteen timed studies use 40–100 BPM with 60 BPM default and a quarter-note pulse. Fourteen use 4/4 with a four-beat count-in, the 3/4 pair uses a three-beat count-in, and the 5/4 pair uses a five-beat count-in.
- [ ] The current pitch-guide consumer renders every current canonical sequence from existing event fields while leaving schema version 1 and all exercise revisions unchanged.
- [ ] Rhythm-aware presentation derives `Untimed`, `Steady pulse`, `Eighth-note grid`, `Offbeat grid`, or the neutral timed fallback from canonical evaluation mode and offset spacing without inspecting titles or IDs.
- [ ] Library lookup returns the matching canonical object for a known stable ID and `null` for an unknown ID.
- [ ] Library validation rejects missing prerequisite references and prerequisite cycles, and canonical order is protected as the recommendation tie-break.
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
- Physical-key state must preserve `expected` over `remaining` over `accepted`, leave non-phrase span notes `idle`, and keep pressed state independent.
- Reordering rendered exercise cards or stored attempt records must not change recommendation priority; changing canonical library order is an explicit policy change.
- Untimed exercises must remain independent of tempo, duration, inter-event spacing, and velocity.
- Timed exercises must derive interval targets from canonical beat offsets and a selected tempo inside the declared range; they must not contain runtime audio or MIDI timestamps.
- The ten steady-quarter, two ascending even-eighth, two repeated-note, two mixed-pattern, and two offbeat studies must remain hands-separate, single-note onset material unless a later revision and updated contract explicitly broaden them. Integer or fractional spacing, missing numbered-beat targets, chord-derived pitch order, canonical meter, count-in grouping, click accents, and longer phrase length must not acquire audible phase, downbeat, grouping, or measure-alignment, duration, release, holding, legato, learner accent, articulation, dynamics or velocity-quality, fingering, hand-verification, relaxation, harmony-recognition, reading, consistency, mastery, rest, silence, syncopation, notation, or simultaneity meaning implicitly.
- Unsupported schema versions and modes must fail closed instead of being guessed.
- Existing attempt history must remain attributable to the exact revision performed.
- Repertoire goals must remain metadata-only until lawful source content is deliberately introduced.
- Adding future fields must not make existing valid version-1 exercises change meaning.
- Replacing the pitch-guide implementation must not change canonical IDs, revisions, event order, or historical attempt attribution.
- Unsupported notation must retain the complete canonical exercise and semantic text fallback rather than approximating or rejecting the exercise itself.

### Verification

- **Schema tests:** Accept every canonical exercise; reject unknown versions, invalid modes, empty sequences, duplicate IDs, invalid hands, invalid revisions, out-of-range MIDI notes, mode/timing mismatches, invalid tempo ranges, and missing or non-increasing timed beat offsets.
- **Library tests:** Protect stable identities, default selection, canonical order, valid prerequisite references, and acyclic prerequisites; validate all source metadata and per-exercise event counts, and prove left-hand, descending, untimed step-skip, ordered chord-tone, straight steady-quarter, timed step-and-skip, even-eighth, repeated-note, eight-event mixed-pattern, offbeat-step-skip, eight-event steady broken-chord, seven-event 3/4 broken-chord, and six-event 5/4 pulse coverage.
- **Consumer contract tests:** Rendered guidance and evaluator expectations are derived from the same fixture and identity.
- **Rhythm presentation tests:** Unit-beat offsets, regular half-beat offsets, downbeat-then-offbeat offsets, and an otherwise valid timed pattern receive their documented steady-quarter, even-eighth, offbeat, and neutral fallback labels; the 3/4 and 5/4 unit-beat patterns receive their complete pitch-free three- and five-beat tasks from timing metadata.
- **Notation consumer tests:** Protect natural-note pitch mapping, current treble and bass ranges, canonical event order and identity, and explicit unsupported results without schema mutation.
- **Versioning tests:** A stored attempt continues to resolve its original ID/revision after a newer revision is added.
- **Coverage target:** Exercise parsing, validation, and version dispatch branches remain fully exercised.

### Scenarios

**Scenario: Load the current library**

- Given: thirty schema-version-1 documents for the current exercises
- When: the exercise library validates them
- Then: it exposes thirty unique stable IDs, five occurrences for twenty-two studies, six for each 5/4 pulse study, seven for each 3/4 broken-chord study, eight for each mixed-pattern and steady broken-chord study, twelve untimed and eighteen timed studies, lawful original-source metadata, and the original right-hand ascent as default

**Scenario: Choose left-hand descending work**

- Given: the learner selects `five-note-descent-c-major-left-hand`
- When: the exercise is resolved by canonical ID
- Then: it exposes the untimed left-hand sequence 55, 53, 52, 50, and 48 in that order

**Scenario: Practice steps and skips**

- Given: the learner selects either untimed step-and-skip exercise
- When: its ordered events are inspected
- Then: the five unique pitches contain both neighboring steps and wider skips without adding timing or velocity scoring

**Scenario: Load a steady-quarter study**

- Given: the learner selects `steady-quarter-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes C4-D4-E4-F4-G4 at beat offsets 0–4, `timed-ordered-notes`, 40–100 BPM with 60 BPM default, 4/4 quarter pulse, four count-in beats, and a 0.2-beat timing window

**Scenario: Load a timed step-and-skip study**

- Given: the learner selects `steady-quarter-step-skip-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes C4-E4-D4-F4-G4 at beat offsets 0–4 with the existing timed evaluation metadata and requires both `step-skip-c-major-right-hand` and `steady-quarter-c-major-right-hand`

**Scenario: Load an even-eighth study**

- Given: the learner selects `even-eighths-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes C4-D4-E4-F4-G4 at offsets 0, 0.5, 1, 1.5, and 2 with a 0.1-beat timing window and requires only `steady-quarter-c-major-right-hand`

**Scenario: Load a repeated-note study**

- Given: the learner selects `repeated-note-eighths-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes five distinct event IDs for C4-C4-D4-D4-E4 at offsets 0, 0.5, 1, 1.5, and 2 with a 0.1-beat timing window and requires only `even-eighths-c-major-right-hand`

**Scenario: Load ordered C-major chord tones**

- Given: the learner selects `ordered-chord-tones-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `C major chord tones · right hand`, it exposes five distinct event IDs for C4-E4-G4-E4-C4 in untimed order, requires only `step-skip-c-major-right-hand`, and carries `patterns-and-technique.chord-tone-patterns`, `notes-and-reading.interval-recognition`, and `rhythm-and-coordination.hands-separately` without implying simultaneity

**Scenario: Transfer ordered chord tones to D minor**

- Given: the learner selects `ordered-chord-tones-d-minor-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `D minor chord tones · right hand`, it exposes five distinct event IDs for D4-F4-A4-F4-D4 in untimed order, requires only `ordered-chord-tones-c-major-right-hand`, adds `patterns-and-technique.minor-chord-vocabulary`, and implies neither simultaneity nor chord-quality recognition

**Scenario: Load a D-minor five-note ascent**

- Given: the learner selects `five-note-ascent-d-minor-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `Five-note ascent in D minor · right hand`, it exposes D4-E4-F4-G4-A4 as five untimed event IDs, requires only `ordered-chord-tones-d-minor-right-hand`, carries the documented five ordered tags, and implies neither a complete D-minor scale nor assessed half-step recognition, fingering, evenness, hand use, or technique

**Scenario: Load a steady broken-chord study**

- Given: the learner selects `steady-quarter-broken-chord-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `Steady broken chord in C · right hand`, it exposes eight distinct event IDs for C4-E4-G4-E4-C4-E4-G4-E4 at beat offsets 0–7 with a 0.2-beat window, requires `ordered-chord-tones-c-major-right-hand` followed by `steady-quarter-c-major-right-hand`, and carries the broken-chord-pattern, chord-tone-pattern, steady-quarter-note, hands-separate, and interval-recognition tags without adding harmony-recognition or staff-reading evidence

**Scenario: Load a 3/4 broken-chord loop**

- Given: the learner selects `three-four-broken-chord-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `Broken chord in 3/4 · right hand`, it exposes seven distinct event IDs for C4-E4-G4-C4-E4-G4-C4 at beat offsets 0–6 with a 0.2-beat window, declares 3/4 with three count-in beats, requires only `steady-quarter-broken-chord-c-major-right-hand`, and carries the three-four-meter, steady-quarter-note, hands-separate, broken-chord-pattern, chord-tone-pattern, and interval-recognition tags without adding audible-meter, harmony-recognition, or staff-reading evidence

**Scenario: Load a 5/4 pulse study**

- Given: the learner selects `five-four-pulse-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: its title is `Five-count pulse in C · right hand`, it exposes six distinct event IDs for C4-D4-E4-F4-G4-C4 at beat offsets 0–5 with a 0.2-beat window, declares 5/4 with five count-in beats, requires only `three-four-broken-chord-c-major-right-hand`, and carries the five-four-meter, steady-quarter-note, hands-separate, keyboard-geography, and five-finger-pattern tags without adding audible-meter, count-in, pulse, accent, grouping, physical-technique, or staff-reading evidence

**Scenario: Load a mixed eighth pattern**

- Given: the learner selects `mixed-eighth-pattern-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes eight event IDs for C4-E4-D4-D4-F4-G4-E4-C4 at half-beat offsets 0 through 3.5, uses a 0.1-beat window, and requires both `repeated-note-eighths-c-major-right-hand` and `ordered-chord-tones-c-major-right-hand`

**Scenario: Load an offbeat onset study**

- Given: the learner selects `offbeat-step-skip-c-major-right-hand`
- When: the canonical exercise is resolved
- Then: it exposes C4-E4-D4-F4-G4 at offsets 0, 0.5, 1.5, 2.5, and 3.5 with a 0.1-beat window, requires only `mixed-eighth-pattern-c-major-right-hand`, and adds no rest, silence, duration, release, holding, accent, articulation, velocity-quality, syncopation, fingering, hand-use, reading, relaxation, consistency, or mastery semantics

**Scenario: Reject an invalid timed exercise**

- Given: a `timed-ordered-notes` exercise omits a beat offset or declares beat offsets that do not increase
- When: the exercise is validated
- Then: validation fails before rendering or evaluation rather than inferring a rhythm from array position

**Scenario: Render and evaluate one identity**

- Given: a canonical exercise is selected
- When: the page renders instructions and starts evaluation
- Then: both surfaces use the same canonical exercise ID, revision, and expected-event list

**Scenario: Project the current library into pitch guides**

- Given: a current schema-version-1 single-hand exercise is selected
- When: the pitch-guide adapter consumes its expected events
- Then: it derives the supported treble or bass positions and canonical event markers without adding notation fields or changing the exercise revision

**Scenario: Decline unsupported notation without rejecting the exercise**

- Given: a future valid exercise contains an accidental, mixed hands, or a pitch outside the adapter's supported subset
- When: the pitch-guide adapter consumes it
- Then: the adapter reports the unsupported presentation while the canonical exercise, semantic ordered notes, and evaluator remain valid

**Scenario: Reject an unknown schema**

- Given: an exercise declares a schema version the application does not support
- When: the exercise is loaded
- Then: practice does not start and the application reports that the format is unsupported

**Scenario: Project repeated events onto physical keys**

- Given: `ordered-chord-tones-c-major-right-hand` contains C4-E4-G4-E4-C4 as five expected-event IDs
- When: canonical guidance and the current physical keyboard are derived
- Then: evaluation, semantic text, and staff notation retain five occurrences while the keyboard renders C4-D4-E4-F4-G4 once each, reuses C4 and E4 for their later occurrences, and leaves D4 and F4 idle but playable as wrong-note inputs

**Scenario: Project the returning C in 5/4**

- Given: `five-four-pulse-c-major-right-hand` contains C4-D4-E4-F4-G4-C4 as six expected-event IDs
- When: canonical guidance and the current physical keyboard are derived
- Then: evaluation, semantic text, and staff notation retain six occurrences while the keyboard renders C4-D4-E4-F4-G4 once each and reuses C4 for the final occurrence

**Scenario: Repertoire goal has no embedded content**

- Given: an exercise or pathway references a protected piece as a future goal
- When: its canonical data is inspected
- Then: the reference contains competency and goal metadata only, with no unlicensed score, MIDI transcription, recording, lyrics, or substantial melody

**Scenario: Exercise behavior changes**

- Given: an author changes the expected note order
- When: the updated exercise is published
- Then: its revision increments while older attempts retain the previous revision

**Scenario: Change recommendation priority without changing an exercise**

- Given: two unchanged eligible exercises exchange positions in the canonical library
- When: recommendation resolves a candidate tie
- Then: the new canonical order determines the suggestion, while both exercise IDs and revisions remain unchanged and rendered or storage order remains irrelevant
