# Feature: Five-Four Pulse Study

## Blueprint

### Context

The learner can already follow hands-separate C-position patterns in steady 4/4 and a repeating broken-chord loop in 3/4. The next meter step introduces a five-beat measure without changing key position, input semantics, or the deterministic note-on evaluator. Playing C-D-E-F-G across five beats and returning to C on the next beat 1 makes one complete five-count group visible while keeping the phrase short and familiar.

### Current Scope

- `five-four-pulse-c-major-right-hand` asks for C4-D4-E4-F4-G4-C4; `five-four-pulse-c-major-left-hand` asks for C3-D3-E3-F3-G3-C3.
- Their titles are `Five-count pulse in C · right hand` and `Five-count pulse in C · left hand`.
- Both are original schema-version-1, revision-1 beginner studies with six distinct note occurrences at integer beat offsets 0 through 5.
- Both use `timed-ordered-notes`, 5/4 meter, a five-beat count-in, 60 BPM default within 40–100 BPM, ongoing quarter-note clicks, and an inclusive ±0.2-beat timing window.
- Each study requires only its matching 3/4 broken-chord study for recommendation eligibility and remains freely selectable without prerequisite evidence.
- The right-hand instruction is `After the five-beat count-in, play C-D-E-F-G, then return to C on the next beat 1 as steady quarter notes with your right hand. Count 1 2 3 4 5, 1. Suggested fingering: 1-2-3-4-5-1.`
- The left-hand instruction is `After the five-beat count-in, play C-D-E-F-G, then return to C on the next beat 1 as steady quarter notes with your left hand. Count 1 2 3 4 5, 1. Suggested fingering: 5-4-3-2-1-5.`
- Tags, in order, are `rhythm-and-coordination.five-four-meter`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, `notes-and-reading.keyboard-geography`, and `patterns-and-technique.five-finger-patterns`. Repertoire-goal metadata remains empty.

### Architecture

- **Canonical meter:** `ExerciseTiming` supplies `beatsPerMeasure: 5`, `beatUnit: 4`, and `countInBeats: 5`. Server copy, five visible pulse indicators, controller pulse configuration, and Web Audio wrapping consume those values rather than introducing a separate 5/4 path.
- **Canonical events:** Six unique event IDs preserve the initial C, the D-E-F-G ascent, and the returning C. Evaluation, staff progress, semantic order, and persistence retain all six occurrences.
- **Timing:** The first accepted C establishes the fixed normalized-MIDI timestamp anchor. Five later notes are compared with it at canonical gaps of one through five quarter-note beats.
- **Audio boundary:** Web Audio accents beat 1 and cycles through five beats after the independent five-beat count-in. Audio scheduling never enters evaluation, so a globally shifted MIDI performance retains the same result.
- **Presentation:** Cards remain `Steady pulse` and show `5/4`; the timing card reads `Steady pulse · 60 BPM · 5/4`. Reading Focus retains `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` The staff remains a pitch-order guide labelled `Pitch order · One note per beat` rather than written 5/4 notation.
- **Staff and keyboard:** Six occurrence markers fit the existing C4-G4 treble or C3-G3 bass subset. The keyboard remains five physical C-through-G controls; C reuses occurrence-aware state for the final event.
- **Persistence and recommendation:** A completed attempt may store five assessed intervals through the existing attempt schema. Exact-current-revision completion of the matching 3/4 broken-chord study makes the corresponding 5/4 study eligible as a direct dependent; quality and tempo do not gate it, and missing prerequisite evidence never locks direct practice.
- **Dependencies:** ADR-053, ADR-054, ADR-055, ADR-056, ADR-058, ADR-059, and ADR-060 define the reused canonical, timing, notation, recommendation, occurrence, focus, and pulse-meter boundaries. ADR-060 already makes meter and count-in presentation timing-driven, so this pair introduces no new architecture decision or ADR.

### Evidence Boundary

- Completion proves only six accepted pitches in order and five MIDI-relative timing classifications after the first accepted C.
- The first C is ungraded. Completion cannot prove that it aligned with an audible downbeat, that D-E-F-G aligned with clicks, that the final C aligned with the next audible beat 1, or that the phrase followed an audible measure boundary.
- Pulse accents and instructional grouping do not prove performed accents, dynamics, velocity quality, 5/4 counting, grouping, meter recognition, or meter understanding.
- Integer onsets do not establish duration, release, holding, legato, rests, silence, or articulation.
- MIDI does not verify fingering, declared hand, relaxation, staff reading, consistency, readiness, physical technique, or mastery.

### Anti-Patterns

- Do not hardcode a five-beat DOM, controller, or audio path; derive meter presentation from canonical timing under ADR-060.
- Do not infer count-in length from the meter numerator even when both are five in this pair.
- Do not turn six equally spaced staff markers into written 5/4 notation, a barline, or a time signature.
- Do not call MIDI-relative completion proof of an audible downbeat, click alignment, the final C landing on beat 1, measure alignment, accents, grouping, or 5/4 competence.
- Do not merge the two C occurrences or duplicate their physical key.
- Do not lock, hide, or disable either study when its advisory prerequisite lacks retained completion evidence.

## Contract

### Definition of Done

- [ ] Both exercises validate with exact IDs, titles, instructions, six events, offsets, hands, timing, prerequisites, tags, source, and fingerings.
- [ ] Practice HTML derives `5/4`, `Five-beat count-in`, and exactly five pulse indicators from canonical timing while existing 4/4 and 3/4 studies retain their current behavior.
- [ ] Web Audio cycles and accents the configured five-beat measure after the independent five-beat count-in by reusing ADR-060 rather than adding an exercise-specific branch.
- [ ] An exact 60 BPM performance accepts six pitches and assesses five on-time MIDI-relative intervals regardless of timestamp origin.
- [ ] Staff, keyboard, Reading Focus, persistence, and recommendation preserve their documented occurrence and evidence boundaries.
- [ ] Each study remains directly selectable without matching 3/4 completion evidence.
- [ ] Automated tests cover canonical data, meter presentation, audio cycling, evaluation, recommendation, SSR, Reading Focus, browser completion, and persistence.

### Regression Guardrails

- Canonical `beatsPerMeasure` remains the source for visible indicator count and running pulse wrapping; `countInBeats` remains explicit and independent.
- Existing 4/4 and 3/4 studies retain their indicator counts, copy, audio cycles, and evaluation.
- Exactly six event IDs and staff markers remain distinct over five physical keys.
- The first event remains an ungraded fixed MIDI anchor and exactly five later accepted events contribute timing facts.
- Adding one constant to every MIDI timestamp cannot change timing classifications.
- Audio state, click accents, displayed meter, grouped count, and final-C instruction never become evaluator, persistence, or recommendation evidence.
- Prerequisite evidence affects only advisory recommendation eligibility and never direct selection or practice availability.

### Verification

- **Exercise tests:** Assert both canonical documents, exact titles, instructions, sequences, offsets, timing, hands, matching 3/4 prerequisites, ordered tags, metadata, and fingering copy.
- **Pulse tests:** Assert five count-in beats, running beat wrap and beat-1 accents, five rendered indicators, and unchanged 4/4 and 3/4 behavior.
- **Evaluator tests:** Replay exact 60 BPM fixtures from two timestamp origins and assert six accepted notes plus five on-time intervals.
- **Presentation tests:** Assert `Steady pulse · 60 BPM · 5/4`, `Five-beat count-in`, the complete pitch-free count task in Reading Focus, six staff occurrences, and five physical keys.
- **Recommendation tests:** Assert the matching 3/4 broken-chord completion makes the corresponding 5/4 study the eligible direct dependent, while the opposite hand and missing evidence do not.
- **Persistence tests:** Assert a completed timed attempt stores an internally consistent summary with exactly five assessed intervals and the canonical 5/4 exercise identity and revision.
- **SSR tests:** Assert direct links render the selected canonical title, instruction, 5/4 timing facts, six semantic/staff events, five pulse indicators, and the complete unrestricted exercise chooser before enhancement.
- **Browser tests:** Complete the right-hand study through mock input, verify Reading Focus retains `1 2 3 4 5, 1`, observe five-beat pulse presentation, and verify five persisted intervals plus the matching advisory next action or unrestricted library fallback.

### Scenarios

**Scenario: Follow a five-beat C-position pulse**

- Given: `five-four-pulse-c-major-right-hand` expects C4-D4-E4-F4-G4-C4 at offsets 0 through 5
- When: those note-ons arrive one second apart at 60 BPM
- Then: six events are accepted, five intervals are on time, and completion claims only ordered-pitch and MIDI-relative onset-gap evidence

**Scenario: Present canonical 5/4 guidance**

- Given: the selected exercise declares `beatsPerMeasure: 5`, `beatUnit: 4`, and `countInBeats: 5`
- When: the practice page renders and starts its pulse
- Then: it shows 5/4, renders five beat indicators, counts in five beats, and wraps the running accent cycle after beat 5

**Scenario: Keep the final C instructional**

- Given: the phrase asks the learner to return to C on the next beat 1
- When: the final C is accepted at the canonical five-beat MIDI gap
- Then: it completes the six-event sequence without claiming alignment to the audible click, downbeat, or measure boundary

**Scenario: Preserve recommendation freedom**

- Given: the matching 3/4 study has no retained exact-current-revision completion
- When: the learner opens either 5/4 study directly
- Then: the complete study remains available, while the missing prerequisite affects only whether recommendation selects it

**Scenario: Preserve the audio-evidence boundary**

- Given: two correct performances have identical MIDI gaps but different first-note phases relative to the audible 5/4 pulse
- When: both complete
- Then: their five timing classifications match and neither result claims audible downbeat, click, final-C, accent, measure, grouping, or meter understanding
