# Feature: D-Minor Chord-Tone Study

## Blueprint

### Context

The current library offers many rhythm variations but keeps every pitch pattern inside C position. After learning the ordered C-major chord tones C-E-G-E-C, the learner needs a small transfer task that changes both keyboard position and chord quality without adding timing, simultaneous notes, accidentals, or a new evaluator. D-F-A-F-D reuses the familiar root-position chord-tone contour while introducing the first minor chord-tone pattern and the natural pitch A.

### Current Scope

- `ordered-chord-tones-d-minor-right-hand` asks for D4-F4-A4-F4-D4; `ordered-chord-tones-d-minor-left-hand` asks for D3-F3-A3-F3-D3.
- Their titles are `D minor chord tones · right hand` and `D minor chord tones · left hand`.
- Both are original schema-version-1, revision-1 beginner exercises using `untimed-ordered-notes`.
- Each exercise contains five unique event occurrences over three expected pitches. Returning D and F remain separate progress and staff events while the physical keyboard reuses one key per pitch.
- Instructions place five fingers over D-E-F-G-A, name D, F, and A as D-minor chord tones, explicitly require one note at a time, and suggest `1-3-5-3-1` for the right hand or `5-3-1-3-5` for the left hand.
- Each exercise declares only its matching C-major ordered chord-tone study as an advisory prerequisite and remains directly selectable without saved prerequisite evidence.
- Tags, in order, are `patterns-and-technique.chord-tone-patterns`, `patterns-and-technique.minor-chord-vocabulary`, `notes-and-reading.interval-recognition`, and `rhythm-and-coordination.hands-separately`. Repertoire-goal metadata remains empty.
- The pair follows the C-major chord-tone pair in canonical library order. When a just-completed C-major chord-tone exercise has multiple eligible dependents, the matching D-minor transfer takes the existing library-order recommendation priority before later timed C-major elaboration.

### Architecture

- **Canonical data:** Existing schema-version-1 note events, hand metadata, prerequisites, source metadata, curriculum tags, and stable identities represent the pair without changing the schema or existing exercise revisions.
- **Evaluation:** The existing deterministic untimed ordered-note evaluator accepts D-F-A-F-D, preserves repeated occurrences, and applies the same correct, wrong, repeated, and out-of-order classifications as every current untimed study.
- **Staff:** ADR-063 extends the reversible ADR-055 natural-note projection through A4 on treble and A3 on bass. Five equally spaced markers remain pitch-order guidance without chord, duration, accidental, key-signature, or rhythmic semantics.
- **Keyboard:** The existing inclusive natural-note-span projection yields D-E-F-G-A. D, F, and A carry occurrence state; E and G remain playable wrong-note inputs. The range label is derived as `D–A range` rather than hardcoded to C position.
- **Recommendation:** Exact-current-revision completion of the matching C-major chord-tone study makes the corresponding D-minor study eligible. Opposite-hand evidence does not satisfy the prerequisite, and missing evidence never locks direct practice.
- **Dependencies:** ADR-053, ADR-055, ADR-056, ADR-058, ADR-059, and ADR-063 define the reused canonical, staff, recommendation, occurrence, reading-focus, and widened-range boundaries.

### Evidence Boundary

- Completion proves only five accepted D-F-A-F-D pitch occurrences in order.
- Naming D minor in the title and instruction does not prove recognition of minor quality, harmonic understanding, interval identification, aural comparison, or chord vocabulary mastery.
- Ordered single-note events do not prove blocked or simultaneous chord playing, voicing, duration, release, articulation, legato, rhythm, dynamics, or velocity quality.
- MIDI does not verify the suggested fingering, declared hand, hand position, staff reading, relaxation, consistency, readiness, physical technique, or mastery.
- Seeing A on the current guide is bounded pitch-position exposure, not general treble- or bass-clef fluency.

### Anti-Patterns

- Do not encode D minor as simultaneous events, a key signature, an accidental-bearing scale, or a schema extension.
- Do not describe completion as proof that the learner heard, recognized, understood, or played a D-minor chord.
- Do not merge returning D or F occurrences or duplicate their physical keys.
- Do not widen the pitch guide beyond A, add unbounded ledger-line support, or imply general notation coverage in this slice.
- Do not lock, hide, or disable either exercise when its advisory prerequisite lacks retained completion evidence.

## Contract

### Definition of Done

- [ ] Both canonical exercises validate with exact IDs, titles, instructions, five events, hands, matching prerequisites, tags, source metadata, and fingerings.
- [ ] The complete library exposes twenty-eight exercises, fourteen per hand, with ten untimed and eighteen timed studies.
- [ ] Treble C4-A4 and bass C3-A3 natural pitches project through the existing staff adapter; pitches outside those bounded ranges still use the semantic fallback.
- [ ] Practice HTML renders five D-through-A physical keys, five D-F-A-F-D staff occurrences, a derived `D–A range` label, and Reading Focus support before enhancement.
- [ ] Completing either study uses the existing persistence, recent-evidence, and advisory recommendation paths without timing data.
- [ ] The matching C-major chord-tone completion makes only the same-hand D-minor study eligible as its direct dependent, and canonical ordering protects the intended transfer priority.
- [ ] Automated tests cover canonical data, library order and counts, pitch projection, keyboard range, recommendation, SSR, Reading Focus, browser completion, and persistence.

### Regression Guardrails

- Existing exercise IDs, revisions, order before the C-major chord-tone pair, and default selection remain unchanged.
- The C4-G4 and C3-G3 studies retain their current staff coordinates and keyboard behavior.
- Exactly five event and staff occurrences remain distinct over five physical D-through-A keys.
- E and G remain visible idle controls and wrong-note inputs; returning D and F reuse their original controls.
- D-minor completion adds no timing, harmony-recognition, fingering, reading, technique, consistency, or mastery evidence.
- Prerequisite evidence affects only advisory recommendation and never direct selection or practice availability.

### Verification

- **Exercise tests:** Assert exact canonical documents, instructions, sequences, event IDs, hands, matching C-major prerequisites, ordered tags, metadata, and fingerings.
- **Library tests:** Assert twenty-eight unique stable IDs in canonical order, fourteen studies per hand, ten untimed studies, eighteen timed studies, and twenty five-event studies.
- **Notation tests:** Assert A4 and A3 coordinates, D-F-A-F-D occurrence order, expanded exact ranges, and fallback above A.
- **Presentation tests:** Assert D-E-F-G-A keyboard projection, derived range copy, five staff occurrences, and unchanged C-position behavior.
- **Recommendation tests:** Assert same-hand C-major completion selects D minor as a direct dependent before eligible timed C-major elaboration, while opposite-hand evidence does not.
- **Browser tests:** Open and complete the right-hand D-minor study through on-screen input, verify Reading Focus and reused D/F keys, and reload its persisted exact-revision history.

### Scenarios

**Scenario: Transfer the chord-tone shape to D minor**

- Given: `ordered-chord-tones-d-minor-right-hand` expects D4-F4-A4-F4-D4
- When: those five note-ons arrive in order
- Then: the exercise completes as ordered pitch practice without claiming simultaneous chord playing or minor-quality recognition

**Scenario: Reuse physical keys for returning tones**

- Given: five canonical D-F-A-F-D occurrences project onto the practice keyboard
- When: the learner advances through both returning tones
- Then: five progress and staff positions remain distinct while one D key and one F key are reused within the D-E-F-G-A range

**Scenario: Extend the pitch guide only through A**

- Given: the current natural-note adapter supports treble C4-A4 and bass C3-A3
- When: either D-minor study renders
- Then: A appears on the appropriate staff while a natural pitch above A still falls back to semantic note-order text

**Scenario: Keep recommendation advisory and hand-specific**

- Given: the right-hand C-major chord-tone study has an exact-current-revision completion
- When: recommendation evaluates the new pair
- Then: the right-hand D-minor study is eligible as the first direct dependent, the left-hand study remains gated by its own prerequisite, and both stay directly selectable
