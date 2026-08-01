# Feature: D-Minor Five-Note Ascent

## Blueprint

### Context

The D-minor chord-tone studies move the learner into D position but use only D, F, and A. Before adding another timing demand, the learner needs a small transfer task that activates E and G, keeps one finger over each natural key from D through A, and exposes the close E-F half-step without claiming a complete D-minor scale or assessed interval recognition.

### Current Scope

- `five-note-ascent-d-minor-right-hand` asks for D4-E4-F4-G4-A4; `five-note-ascent-d-minor-left-hand` asks for D3-E3-F3-G3-A3.
- Their titles are `Five-note ascent in D minor · right hand` and `Five-note ascent in D minor · left hand`.
- Both are original schema-version-1, revision-1 beginner exercises using `untimed-ordered-notes`.
- Instructions keep one finger over each white key in D position, identify E-F as the close half-step in the minor five-finger pattern, and suggest `1-2-3-4-5` for the right hand or `5-4-3-2-1` for the left hand.
- Each exercise declares only its matching D-minor chord-tone study as an advisory prerequisite and remains directly selectable without saved prerequisite evidence.
- Tags, in order, are `notes-and-reading.keyboard-geography`, `notes-and-reading.interval-recognition`, `patterns-and-technique.five-finger-patterns`, `patterns-and-technique.minor-scale-preparation`, and `rhythm-and-coordination.hands-separately`. Repertoire-goal metadata remains empty.
- The pair follows the D-minor chord-tone pair in canonical library order and precedes the existing timed broken-chord studies.

### Architecture

- **Canonical data:** Existing schema-version-1 note events, hand metadata, prerequisites, source metadata, curriculum tags, and stable identities represent the pair without changing the exercise schema or existing revisions.
- **Evaluation:** The existing deterministic untimed ordered-note evaluator accepts D-E-F-G-A and applies the same correct, wrong, repeated, and out-of-order classifications as every current untimed study.
- **Staff:** ADR-063 already projects the five natural pitches through A4 on treble and A3 on bass. The markers remain pitch-order guidance without duration, key-signature, accidental, fingering, or rhythmic semantics.
- **Keyboard:** The existing inclusive natural-note-span projection yields exactly D-E-F-G-A, with all five keys carrying expected-event state and the derived `D–A range` label.
- **Recommendation:** Exact-current-revision completion of the matching D-minor chord-tone study makes the corresponding five-note ascent eligible. Opposite-hand evidence does not satisfy the prerequisite, and missing evidence never locks direct practice.
- **Dependencies:** ADR-053, ADR-055, ADR-056, ADR-058, ADR-059, and ADR-063 define the reused canonical, staff, recommendation, occurrence, reading-focus, and widened-range boundaries.

### Evidence Boundary

- Completion proves only five accepted D-E-F-G-A note-on occurrences in order.
- The title and instruction do not prove recognition of D minor, scale construction, the E-F half-step, interval size, tonality, or harmonic understanding.
- The five-note fragment is not a complete D natural, harmonic, or melodic minor scale and provides no key-signature or accidental evidence.
- MIDI does not verify the suggested fingering, declared hand, hand position, staff reading, evenness, tempo, duration, articulation, dynamics, relaxation, consistency, physical technique, readiness, or mastery.
- Seeing five markers on the current guide is bounded pitch-position exposure, not general treble- or bass-clef fluency.

### Anti-Patterns

- Do not describe this five-note fragment as a complete D-minor scale or infer scale mastery from completion.
- Do not encode accidentals, a key signature, beat offsets, simultaneity, or a wider pitch range in this slice.
- Do not turn the instructional E-F half-step cue into assessed interval-recognition evidence.
- Do not lock, hide, or disable either exercise when its advisory prerequisite lacks retained completion evidence.

## Contract

### Definition of Done

- [ ] Both canonical exercises validate with exact IDs, titles, instructions, five events, hands, matching prerequisites, ordered tags, source metadata, and fingerings.
- [ ] The complete library exposes thirty exercises, fifteen per hand, with twelve untimed and eighteen timed studies.
- [ ] The canonical D-minor ascent pair follows the D-minor chord-tone pair and preserves every earlier identity, revision, and relative order.
- [ ] Practice HTML renders five D-through-A physical keys, five D-E-F-G-A staff occurrences, a derived `D–A range` label, and Reading Focus support before enhancement.
- [ ] Completing either study uses the existing persistence, recent-evidence, and advisory recommendation paths without timing data.
- [ ] The matching D-minor chord-tone completion makes only the same-hand five-note ascent eligible as its direct dependent, while both ascents remain freely selectable.
- [ ] Automated tests cover canonical data, library order and counts, presentation, recommendation, SSR, Reading Focus, browser completion, and persistence.

### Regression Guardrails

- Existing exercise IDs, revisions, default selection, and order before the D-minor chord-tone pair remain unchanged.
- The C4-G4, C3-G3, and D-minor chord-tone studies retain their current staff coordinates and keyboard behavior.
- Exactly five event, staff, and physical-key positions represent D-E-F-G-A.
- Completion adds no timing, harmony-recognition, scale-completion, half-step-recognition, fingering, reading, technique, consistency, or mastery evidence.
- Prerequisite evidence affects only advisory recommendation and never direct selection or practice availability.

### Verification

- **Exercise tests:** Assert exact canonical documents, instructions, sequences, event IDs, hands, matching D-minor chord-tone prerequisites, ordered tags, metadata, and fingerings.
- **Library tests:** Assert thirty unique stable IDs in canonical order, fifteen studies per hand, twelve untimed studies, eighteen timed studies, and twenty-two five-event studies.
- **Presentation tests:** Assert five D-E-F-G-A staff markers, five expected keyboard controls, the derived range copy, and unchanged C-position behavior.
- **Recommendation tests:** Assert same-hand D-minor chord-tone completion selects the ascent as its direct dependent while opposite-hand evidence does not.
- **Browser tests:** Open and complete the right-hand ascent through on-screen input, verify Reading Focus and the D-A position, and reload its persisted exact-revision history.

### Scenarios

**Scenario: Activate every natural key in D position**

- Given: `five-note-ascent-d-minor-right-hand` expects D4-E4-F4-G4-A4
- When: those five note-ons arrive in order
- Then: the exercise completes as ordered pitch practice without claiming a complete D-minor scale or assessed half-step recognition

**Scenario: Project the complete five-note position**

- Given: the canonical ascent contains five distinct natural pitches from D through A
- When: the practice surface renders
- Then: five expected keyboard controls and five staff markers appear within the derived `D–A range`

**Scenario: Recommend the matching-hand transfer**

- Given: the right-hand D-minor chord-tone study has an exact-current-revision completion
- When: recommendation evaluates the new pair
- Then: the right-hand ascent is eligible as its direct dependent, the left-hand ascent remains gated by its own prerequisite, and both stay directly selectable

**Scenario: Keep the half-step cue instructional**

- Given: the instructions identify E-F as the close half-step in the minor five-finger pattern
- When: D-E-F-G-A is accepted in order
- Then: the saved attempt records pitch-order completion only and does not claim interval recognition, scale knowledge, or technique quality
