# Feature: Staff Pitch Guide

## Blueprint

### Context

The current practice stage names every expected pitch and shows its piano key, but the learner also wants gradual exposure to staff reading. All twenty-six current exercises use a small, single-hand, natural-note range, so they can share a useful pitch-position guide without adopting a general score engine or pretending that the application can assess whether the learner actually read it.

The first notation surface must preserve the server-rendered, progressively enhanced application model and the canonical exercise boundary. It must not invent note duration, rhythmic value, or a second exercise identity merely to draw the current pitches.

### Current Scope

- Every current practice page includes a server-rendered inline SVG pitch guide derived from the selected canonical exercise.
- The supported subset is deliberately narrow: single-hand exercises containing the current natural notes C4-G4 for right-hand treble display or C3-G3 for left-hand bass display.
- The guide shows five staff lines, the appropriate clef, ordered pitch markers, and any ledger line required by the supported range.
- Pitch markers represent vertical staff position and canonical event order only. They have no stem, beam, rest, articulation, duration, velocity, fingering, or performance-timing semantics.
- Timed staff metadata may name the separate onset contract. The six regular eighth-grid studies use `Pitch order · Even eighth-note onsets`; the offbeat pair uses `Pitch order · Downbeat then offbeat onsets`; and the ten steady-quarter studies use `Steady pulse` with `Pitch order · One note per beat`. That text does not turn the pitch markers or their horizontal spacing into written rhythmic or meter notation.
- The selected exercise's existing semantic note sequence remains adjacent to the SVG as the accessible and unsupported-content fallback.
- Progressive enhancement marks accepted, next, and remaining canonical events in the guide from the same evaluator progress that drives the textual next-note cue and keyboard.
- The ordered C-major chord-tone pair renders five markers for C-E-G-E-C. Repeated C and E occurrences retain separate expected-event IDs and horizontal positions even though they share staff pitch positions and physical keyboard controls.
- The `steady-quarter-broken-chord-c-major-right-hand` and `steady-quarter-broken-chord-c-major-left-hand` studies each render eight markers for C-E-G-E-C-E-G-E over five C-G physical controls. Every repeated occurrence retains its own expected-event ID and horizontal position. The equal presentation spacing remains pitch order only and does not encode its canonical offsets `0` through `7` as written beats or two written measures.
- The `three-four-broken-chord-c-major-right-hand` and `three-four-broken-chord-c-major-left-hand` studies each render seven markers for C-E-G-C-E-G-C over five C-G physical controls. Every repeated occurrence retains its own expected-event ID and horizontal position. The equal presentation spacing remains pitch order only and does not encode offsets `0` through `6`, 3/4 meter, written beats, barlines, or accents.
- The `five-four-pulse-c-major-right-hand` and `five-four-pulse-c-major-left-hand` studies each render six markers for C-D-E-F-G-C over five C-G physical controls. Both C occurrences retain their own expected-event ID and horizontal position. The equal presentation spacing remains pitch order only and does not encode offsets `0` through `5`, 5/4 meter, the five-beat count-in, written beats, barlines, pulse, grouping, or accents. The exact pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` remains separate from the guide.
- The mixed-pattern pair renders eight markers for C-E-D-D-F-G-E-C. Adjacent D occurrences and returning E and C occurrences retain separate expected-event IDs and horizontal positions while sharing five physical keyboard controls.
- The offbeat pair renders five markers for C-E-D-F-G over five physical controls. Their equal horizontal spacing remains pitch-order presentation and does not draw the canonical gaps at numbered beats 2, 3, and 4.
- For a validated supported guide, enhanced reading focus may visually suppress staff pitch labels and the surrounding note-name answers while retaining occurrence-based staff progress and semantic equivalents. Guided server rendering remains the default.
- This presentation addition does not change exercise schema version, exercise revision, evaluator behavior, attempt persistence, prerequisites, curriculum evidence, or exercise identity.

### Future Scope

- Accidentals, key signatures, written durations, rests, beams, ties, articulation, dynamics, multiple voices, both-hand grand staff, simultaneous chord notation, scrolling, pagination, editing, MusicXML, and score import or export require later domain and rendering decisions.
- A full notation adapter or third-party notation library may replace the initial renderer when canonical exercise data contains the musical semantics needed to use it truthfully.
- Reading assessment, sight-reading evidence, saved cue preferences, and graduated hint levels remain future work; the current reading-focus presentation adds none of them.

### Architecture

- **Canonical input:** The adapter consumes the selected validated `Exercise`. It uses the ordered expected-event IDs, MIDI note numbers, and single-hand assignment already present in that document; it does not scrape the keyboard or create notation-only exercise IDs.
- **Rendering boundary:** The Worker view invokes a small presentation adapter that returns inline SVG markup for supported exercises. The adapter owns staff geometry and pitch-to-position mapping but no evaluation, session, MIDI, audio, persistence, or curriculum logic.
- **Supported-subset rule:** The adapter renders only the documented single-hand natural-note subset. A mixed-hand, `both`-hand, chromatic, or out-of-range exercise is unsupported until a later contract broadens the adapter.
- **Fallback rule:** Unsupported notation never blocks the practice page. The semantic exercise title, instructions, ordered note text, keyboard guidance, and evaluator remain available; the renderer must not transpose, clamp, respell, or silently omit events to force a drawing.
- **Progress projection:** Each rendered pitch marker retains its canonical event ID. Client enhancement projects accepted, next, and remaining state onto those existing markers from evaluator state; the SVG never decides progress itself. Staff occurrence state remains lossless when the physical keyboard aggregates repeated occurrences by MIDI pitch.
- **Reading-focus projection:** Only a validated supported guide enables reading focus. The client may hide visible staff labels and adjacent visual answers, but preserves the guide, canonical marker state, semantic fallback, and accessible meaning. The choice is page-local presentation state and never enters exercise or attempt identity.
- **Clef rule:** Current right-hand C4-G4 material uses treble clef and current left-hand C3-G3 material uses bass clef. This is a supported-subset mapping, not a global claim that hand assignment always determines clef.
- **Pitch convention:** Staff position is derived from the canonical MIDI note number using C4/MIDI 60 as middle C. Natural pitch spelling is valid only for the current supported notes.
- **Reversibility:** Callers depend on the pitch-guide presentation boundary rather than a notation library's internal document model. Replacing the inline SVG implementation must not require new canonical IDs, changed exercise revisions, or rewritten attempt history.

### Accessibility and Progressive Enhancement

- The complete pitch guide is present in the initial HTML; JavaScript is not required to see it.
- The adjacent semantic note sequence names every pitch in canonical order and remains the accessible fallback. The SVG does not duplicate a second, conflicting spoken sequence.
- Next-note and progress meaning remains available in text and is not conveyed by pitch-marker colour alone.
- Inline SVG scales within the practice stage without horizontal page overflow or loss of readable text at supported desktop, iPad, and narrow-phone widths.
- Client enhancement may update marker state but must not replace or remove the server-rendered fallback.
- Reading focus visually suppresses selected cues without removing their semantic or ARIA equivalents. It retains staff progress and restores every guided cue when switched off.

### Edge Cases

- A descending or step-and-skip exercise retains canonical event order horizontally even though vertical pitch position moves independently.
- Middle C in the supported right-hand range receives its ledger line; no other ledger line is fabricated.
- A repeated pitch in the current ordered chord-tone, steady broken-chord, 3/4 broken-chord, 5/4 pulse, repeated-note, or mixed-pattern pair retains separate markers because canonical event IDs, not MIDI note number alone, identify positions in the sequence. Adjacent equal-pitch markers share a vertical position but remain independently accepted, expected, or remaining.
- C-E-G-E-C remains five equally presentation-spaced, individual pitch markers. Shared pitch positions do not stack markers into chords or add simultaneity, duration, voicing, or harmony-assessment meaning.
- C-E-G-E-C-E-G-E remains eight equally presentation-spaced, individual pitch markers over five physical controls. The guide does not show or prove audible phase, measure alignment, duration, release, legato, rests, articulation, dynamics, velocity, fingering, hand use, relaxation, harmony recognition, staff reading, consistency, or mastery.
- C-E-G-C-E-G-C remains seven equally presentation-spaced, individual pitch markers over five physical controls. The guide does not draw or prove 3/4 meter, beat grouping, a beat-1 accent, audible phase, downbeat or measure alignment, duration, release, legato, rests, dynamics, fingering, hand use, harmony recognition, staff reading, consistency, or mastery.
- C-D-E-F-G-C remains six equally presentation-spaced, individual pitch markers over five physical controls. The guide does not draw or prove 5/4 meter, the five-beat count-in, beat grouping, a beat-1 accent, audible phase, downbeat, click, pulse, or measure alignment, duration, release, legato, rests, dynamics, fingering, declared-hand use, keyboard geography, five-finger technique, staff reading, consistency, or mastery.
- If exercise data falls outside the supported subset, the renderer returns the explicit unsupported result and the page continues with semantic text rather than partial or misleading notation.
- Timed exercise progress may update the same pitch markers, but beat offsets and timing feedback do not change their pitch-only meaning.
- Fractional beat offsets do not alter marker spacing, create beams, imply held duration or key release, or introduce rests between markers. Missing numbered-beat targets in the offbeat pair remain canonical onset gaps, not rendered or assessed silence.
- Reading focus may be toggled during progress without changing marker identity or state. Unsupported notation has no toggle and remains fully guided.

### Anti-Patterns

- Do not infer note duration, rests, meter, beat placement, articulation, or dynamics from pitch-marker shape or horizontal spacing.
- Do not describe `Pitch order · One note per beat`, `Pitch order · Even eighth-note onsets`, or `Pitch order · Downbeat then offbeat onsets` as full notation or as evidence that the learner read rhythmic notation.
- Do not treat the inline SVG as a canonical score document or persist rendered coordinates with an attempt.
- Do not infer staff-reading mastery, sight-reading ability, clef fluency, or use of the instructed hand from MIDI completion.
- Do not make the SVG the only source of pitch order or the only accessible explanation of the exercise.
- Do not silently approximate accidentals, unsupported ranges, mixed hands, simultaneous chords, or multiple voices.
- Do not merge repeated-pitch markers merely because the physical keyboard reuses one pitch control.
- Do not offer reading focus for an unsupported guide, hide evaluator-driven staff progress, remove the only semantic pitch equivalent, or use the presentation as reading evidence.
- Do not add a notation dependency, font download, MusicXML pipeline, or exercise-schema field merely to extend this first supported subset.

## Contract

### Definition of Done

- [ ] Every current exercise renders the complete ordered pitch guide in the server response from its canonical expected events.
- [ ] Each ordered chord-tone study renders five occurrence-based markers for C-E-G-E-C while the keyboard separately reuses one C control and one E control from the same canonical data.
- [ ] Each steady broken-chord study renders eight occurrence-based markers for C-E-G-E-C-E-G-E while the keyboard separately reuses five C-G controls, and displays `Steady pulse` with `Pitch order · One note per beat` outside the pitch-only guide.
- [ ] Each 3/4 broken-chord study renders seven occurrence-based markers for C-E-G-C-E-G-C while the keyboard separately reuses five C-G controls, and displays `Steady pulse`, `Pitch order · One note per beat`, and separate pitch-free three-beat count guidance outside the pitch-only guide.
- [ ] Each 5/4 pulse study renders six occurrence-based markers for C-D-E-F-G-C while the keyboard separately reuses five C-G controls, and displays `Steady pulse`, `Pitch order · One note per beat`, and the exact pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` outside the pitch-only guide.
- [ ] Each repeated-note study renders five occurrence-based markers for C-C-D-D-E while the keyboard separately reuses one C, D, and E control from the same canonical data.
- [ ] Each mixed-pattern study renders eight occurrence-based markers for C-E-D-D-F-G-E-C while the keyboard separately reuses one C, D, E, F, and G control from the same canonical data.
- [ ] Each offbeat study renders five C-E-D-F-G markers over five C-position controls, uses `Pitch order · Downbeat then offbeat onsets`, and leaves its timing gaps to separate pitch-free guidance and evaluation.
- [ ] Right-hand C4-G4 material renders on treble staff and left-hand C3-G3 material renders on bass staff, with the supported middle-C ledger line.
- [ ] The guide distinguishes accepted, next, and remaining events from evaluator progress without advancing evaluation itself.
- [ ] A validated supported guide can enter reading focus, hiding visible pitch labels and answer cues while retaining semantic equivalents and occurrence progress; unsupported and no-JavaScript pages remain guided.
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
- Reading-focus visibility, toggling, or completion must not satisfy a staff-reading competency or change canonical, evaluator, or attempt identity.
- No external runtime asset, notation dependency, or client framework may become required for the initial pitch guide.

### Verification

- **Unit tests:** Natural-note pitch-to-staff mapping, treble and bass selection for the supported subset, middle-C ledger-line placement, canonical horizontal order, repeated-pitch occurrence identity, and explicit unsupported results.
- **View tests:** Server HTML contains the complete SVG guide and semantic note sequence for right-hand, left-hand, descending, step-and-skip, ordered chord-tone, steady broken-chord, 3/4 broken-chord, 5/4 pulse, repeated-note, mixed-pattern, offbeat, and timed exercises.
- **Client tests:** Accepted, next, remaining, restart, interrupted, and completed projections update the matching canonical marker without changing evaluator state; reading focus hides labels but preserves the same progress and semantic hooks.
- **Browser tests:** Without JavaScript the guide and text fallback remain guided; enhanced supported guides can hide and restore visual labels while retaining accessibility and progress; desktop, iPad, and narrow layouts do not overflow; a mock-input completion advances marker state consistently with keyboard and text.
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

**Scenario: Use the guide in reading focus**

- Given: the enhanced page has validated a supported staff guide
- When: the learner turns on reading focus
- Then: visible staff labels and surrounding pitch answers are suppressed while the complete guide, occurrence progress, semantic equivalents, and canonical marker identity remain unchanged

**Scenario: Preserve ordered chord-tone occurrences**

- Given: `ordered-chord-tones-c-major-right-hand` contains C4-E4-G4-E4-C4 as five expected-event IDs
- When: its treble guide is rendered and progress advances
- Then: five separate markers retain occurrence-specific accepted, next, and remaining state at their canonical horizontal positions, while repeated vertical pitch positions add no simultaneity or chord notation

**Scenario: Preserve steady broken-chord occurrences without drawing measures**

- Given: `steady-quarter-broken-chord-c-major-right-hand` contains C4-E4-G4-E4-C4-E4-G4-E4 at canonical offsets `0` through `7`
- When: its treble guide and timed metadata are rendered and progress advances across all eight events
- Then: eight separate markers retain occurrence-specific state over five C-G physical controls, the labels read `Steady pulse` and `Pitch order · One note per beat`, and marker spacing encodes neither written beats nor two written measures

**Scenario: Preserve 3/4 occurrences without drawing meter**

- Given: `three-four-broken-chord-c-major-right-hand` contains C4-E4-G4-C4-E4-G4-C4 at canonical offsets `0` through `6`
- When: its treble guide and timed metadata are rendered and progress advances across all seven events
- Then: seven separate markers retain occurrence-specific state over five C-G physical controls, the labels read `Steady pulse` and `Pitch order · One note per beat`, and marker spacing encodes neither 3/4, beat grouping, accents, written beats, nor measures

**Scenario: Preserve 5/4 occurrences without drawing meter**

- Given: `five-four-pulse-c-major-right-hand` contains C4-D4-E4-F4-G4-C4 at canonical offsets `0` through `5`
- When: its treble guide and timed metadata are rendered and progress advances across all six events
- Then: six separate markers retain occurrence-specific state over five C-G physical controls, the labels read `Steady pulse` and `Pitch order · One note per beat`, the exact task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` remains outside the guide, and marker spacing encodes neither 5/4, count-in, beat grouping, pulse, accents, written beats, nor measures

**Scenario: Preserve adjacent repeated-note occurrences**

- Given: `repeated-note-eighths-c-major-right-hand` contains C4-C4-D4-D4-E4 as five expected-event IDs
- When: its treble guide is rendered and the first C4 is accepted
- Then: five separate markers retain occurrence-specific state, the second C4 marker becomes expected, and their shared vertical position adds no duration, release, or articulation notation

**Scenario: Preserve mixed-pattern occurrences**

- Given: `mixed-eighth-pattern-c-major-right-hand` contains C4-E4-D4-D4-F4-G4-E4-C4 as eight expected-event IDs
- When: its treble guide is rendered and progress advances through the adjacent D4 pair and later E4 and C4 returns
- Then: eight separate markers retain occurrence-specific state across five vertical pitch positions, and the guide adds no duration, release, articulation, fingering, hand, relaxation, reading, or consistency evidence

**Scenario: Keep timed meaning separate**

- Given: a steady-quarter exercise, including an eight-event broken-chord study, seven-event 3/4 loop, or six-event 5/4 pulse study, displays its pitch guide
- When: the learner starts the count-in and plays the exercise
- Then: the guide continues to represent pitch and order only while canonical timing metadata, the pulse service, and the MIDI-interval evaluator independently own meter guidance and timing evidence under ADR-060

**Scenario: Label even-eighth onset intent without drawing rhythm**

- Given: `even-eighths-c-major-right-hand` displays its pitch guide
- When: the server renders its rhythm metadata
- Then: the label says `Pitch order · Even eighth-note onsets`, while five unstemmed pitch markers remain equally presentation-spaced and encode no duration, rests, or simultaneity

**Scenario: Label offbeat intent without drawing timing gaps**

- Given: `offbeat-step-skip-c-major-right-hand` displays its pitch guide
- When: the server renders its rhythm metadata
- Then: the label says `Pitch order · Downbeat then offbeat onsets`, while five unstemmed C-E-D-F-G markers remain equally presentation-spaced and encode no audible phase, missing-beat rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, or written rhythm

**Scenario: Encounter unsupported notation**

- Given: a future exercise contains an accidental, mixed hands, or a pitch outside the supported range
- When: the pitch-guide adapter is asked to render it
- Then: it reports the unsupported subset without drawing an approximation, and the page retains the canonical instructions and ordered note text

**Scenario: Complete while the guide is visible**

- Given: the learner can see the staff pitch guide
- When: MIDI input completes the exercise
- Then: the result records only the evaluator's existing pitch, order, and optional timing evidence and makes no claim that the staff was read
