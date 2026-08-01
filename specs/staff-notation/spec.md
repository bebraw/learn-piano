# Feature: Staff Pitch Guide

## Blueprint

### Context

The current practice stage names every expected pitch and shows its piano key, but the learner also wants gradual exposure to staff reading. All ten current exercises use a small, single-hand, natural-note range, so they can share a useful pitch-position guide without adopting a general score engine or pretending that the application can assess whether the learner actually read it.

The first notation surface must preserve the server-rendered, progressively enhanced application model and the canonical exercise boundary. It must not invent note duration, rhythmic value, or a second exercise identity merely to draw the current pitches.

### Current Scope

- Every current practice page includes a server-rendered inline SVG pitch guide derived from the selected canonical exercise.
- The supported subset is deliberately narrow: single-hand exercises containing the current natural notes C4-G4 for right-hand treble display or C3-G3 for left-hand bass display.
- The guide shows five staff lines, the appropriate clef, ordered pitch markers, and any ledger line required by the supported range.
- Pitch markers represent vertical staff position and canonical event order only. They have no stem, beam, rest, articulation, duration, velocity, fingering, or performance-timing semantics.
- The selected exercise's existing semantic note sequence remains adjacent to the SVG as the accessible and unsupported-content fallback.
- Progressive enhancement marks accepted, next, and remaining canonical events in the guide from the same evaluator progress that drives the textual next-note cue and keyboard.
- This presentation addition does not change exercise schema version, exercise revision, evaluator behavior, attempt persistence, prerequisites, curriculum evidence, or exercise identity.

### Future Scope

- Accidentals, key signatures, written durations, rests, beams, ties, articulation, dynamics, multiple voices, both-hand grand staff, chords, scrolling, pagination, editing, MusicXML, and score import or export require later domain and rendering decisions.
- A full notation adapter or third-party notation library may replace the initial renderer when canonical exercise data contains the musical semantics needed to use it truthfully.
- A later reading-focused practice mode may reduce note-name or keyboard cues, but it must retain an accessible equivalent and define its own learner-control and evidence boundaries.

### Architecture

- **Canonical input:** The adapter consumes the selected validated `Exercise`. It uses the ordered expected-event IDs, MIDI note numbers, and single-hand assignment already present in that document; it does not scrape the keyboard or create notation-only exercise IDs.
- **Rendering boundary:** The Worker view invokes a small presentation adapter that returns inline SVG markup for supported exercises. The adapter owns staff geometry and pitch-to-position mapping but no evaluation, session, MIDI, audio, persistence, or curriculum logic.
- **Supported-subset rule:** The adapter renders only the documented single-hand natural-note subset. A mixed-hand, `both`-hand, chromatic, or out-of-range exercise is unsupported until a later contract broadens the adapter.
- **Fallback rule:** Unsupported notation never blocks the practice page. The semantic exercise title, instructions, ordered note text, keyboard guidance, and evaluator remain available; the renderer must not transpose, clamp, respell, or silently omit events to force a drawing.
- **Progress projection:** Each rendered pitch marker retains its canonical event ID. Client enhancement projects accepted, next, and remaining state onto those existing markers from evaluator state; the SVG never decides progress itself.
- **Clef rule:** Current right-hand C4-G4 material uses treble clef and current left-hand C3-G3 material uses bass clef. This is a supported-subset mapping, not a global claim that hand assignment always determines clef.
- **Pitch convention:** Staff position is derived from the canonical MIDI note number using C4/MIDI 60 as middle C. Natural pitch spelling is valid only for the current supported notes.
- **Reversibility:** Callers depend on the pitch-guide presentation boundary rather than a notation library's internal document model. Replacing the inline SVG implementation must not require new canonical IDs, changed exercise revisions, or rewritten attempt history.

### Accessibility and Progressive Enhancement

- The complete pitch guide is present in the initial HTML; JavaScript is not required to see it.
- The adjacent semantic note sequence names every pitch in canonical order and remains the accessible fallback. The SVG does not duplicate a second, conflicting spoken sequence.
- Next-note and progress meaning remains available in text and is not conveyed by pitch-marker colour alone.
- Inline SVG scales within the practice stage without horizontal page overflow or loss of readable text at supported desktop, iPad, and narrow-phone widths.
- Client enhancement may update marker state but must not replace or remove the server-rendered fallback.

### Edge Cases

- A descending or step-and-skip exercise retains canonical event order horizontally even though vertical pitch position moves independently.
- Middle C in the supported right-hand range receives its ledger line; no other ledger line is fabricated.
- A repeated pitch in a future supported exercise would retain separate markers because canonical event IDs, not MIDI note number alone, identify positions in the sequence.
- If exercise data falls outside the supported subset, the renderer returns the explicit unsupported result and the page continues with semantic text rather than partial or misleading notation.
- Timed exercise progress may update the same pitch markers, but beat offsets and timing feedback do not change their pitch-only meaning.

### Anti-Patterns

- Do not infer note duration, rests, meter, beat placement, articulation, or dynamics from pitch-marker shape or horizontal spacing.
- Do not treat the inline SVG as a canonical score document or persist rendered coordinates with an attempt.
- Do not infer staff-reading mastery, sight-reading ability, clef fluency, or use of the instructed hand from MIDI completion.
- Do not make the SVG the only source of pitch order or the only accessible explanation of the exercise.
- Do not silently approximate accidentals, unsupported ranges, mixed hands, chords, or multiple voices.
- Do not add a notation dependency, font download, MusicXML pipeline, or exercise-schema field merely to extend this first supported subset.

## Contract

### Definition of Done

- [ ] Every current exercise renders the complete ordered pitch guide in the server response from its canonical expected events.
- [ ] Right-hand C4-G4 material renders on treble staff and left-hand C3-G3 material renders on bass staff, with the supported middle-C ledger line.
- [ ] The guide distinguishes accepted, next, and remaining events from evaluator progress without advancing evaluation itself.
- [ ] Ordered note text remains present and meaningful without JavaScript and when notation is unsupported.
- [ ] Pitch markers carry no duration or performance-timing meaning, and timed studies continue to use their separate pulse controls and evaluator contract.
- [ ] Exercise schema versions, exercise revisions, canonical IDs, evaluator behavior, and persisted attempt records remain unchanged.
- [ ] Completion feedback and curriculum evidence make no staff-reading mastery claim.
- [ ] Rendering, view, client-projection, and browser tests cover the supported subset, fallback, progress states, and responsive layout.

### Regression Guardrails

- Canonical expected-event order and IDs must remain the only source for marker order and progress identity.
- The notation adapter must remain a presentation consumer rather than a second exercise model.
- Unsupported content must fail open to correct semantic text and normal practice behavior, never to partial or guessed notation.
- The staff guide must remain present before enhancement, while live state must continue to come only from evaluator progress.
- Marker styling and spacing must never be interpreted as canonical duration, rhythm, velocity, or articulation.
- Adding the guide alone must not increment an exercise revision or make existing history disappear.
- MIDI completion must not satisfy a staff-reading competency merely because staff graphics were visible.
- No external runtime asset, notation dependency, or client framework may become required for the initial pitch guide.

### Verification

- **Unit tests:** Natural-note pitch-to-staff mapping, treble and bass selection for the supported subset, middle-C ledger-line placement, canonical horizontal order, unique event identity, and explicit unsupported results.
- **View tests:** Server HTML contains the complete SVG guide and semantic note sequence for right-hand, left-hand, descending, step-and-skip, and timed exercises.
- **Client tests:** Accepted, next, remaining, restart, interrupted, and completed projections update the matching canonical marker without changing evaluator state.
- **Browser tests:** With and without JavaScript, the guide and text fallback remain visible; desktop, iPad, and narrow layouts do not overflow; a mock-input completion advances marker state consistently with keyboard and text.
- **Documentation checks:** README, practice-session, exercise-format, and curriculum wording retain the pitch-only and no-mastery boundaries.

### Scenarios

**Scenario: Read the right-hand ascent before enhancement**

- Given: the server selects `five-note-ascent-c-major-right-hand`
- When: the practice page is returned without running JavaScript
- Then: it contains a treble pitch guide for C4-D4-E4-F4-G4, the middle-C ledger line, and the same ordered notes in semantic text

**Scenario: Render left-hand bass positions**

- Given: the server selects a current left-hand C3-G3 exercise
- When: its pitch guide is rendered
- Then: the natural pitches appear in canonical event order on bass staff without treating left hand as a universal bass-clef rule

**Scenario: Follow live progress**

- Given: the enhanced guide shows C4 as next and the shared evaluator accepts C4
- When: the practice view projects its new state
- Then: C4 becomes accepted and the marker for the evaluator's next canonical event becomes next, matching the text and keyboard cues

**Scenario: Keep timed meaning separate**

- Given: a steady-quarter exercise displays its pitch guide
- When: the learner starts the count-in and plays the exercise
- Then: the guide continues to represent pitch and order only while the pulse service and MIDI-interval evaluator independently own timing guidance and evidence

**Scenario: Encounter unsupported notation**

- Given: a future exercise contains an accidental, mixed hands, or a pitch outside the supported range
- When: the pitch-guide adapter is asked to render it
- Then: it reports the unsupported subset without drawing an approximation, and the page retains the canonical instructions and ordered note text

**Scenario: Complete while the guide is visible**

- Given: the learner can see the staff pitch guide
- When: MIDI input completes the exercise
- Then: the result records only the evaluator's existing pitch, order, and optional timing evidence and makes no claim that the staff was read
