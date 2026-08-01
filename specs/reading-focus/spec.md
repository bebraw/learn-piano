# Feature: Reading Focus

## Blueprint

### Context

The guided practice page intentionally names the exercise sequence, labels staff markers and piano keys, and identifies the next pitch. Those cues are useful for a beginner and keep the page meaningful without JavaScript, but they can dominate the staff once a learner wants to practice locating the next note from pitch position. Reading focus reduces those visible answers while preserving the same exercise, evaluator, input, progress, and accessible control meaning.

### Current Scope

- Every practice page is server-rendered in `Guided` presentation with complete selected-exercise instructions, ordered note text, pitch labels, next-pitch cue, and expected-key cue.
- Typed client enhancement offers a `Reading focus` toggle only after the selected exercise's staff guide has passed the existing C4-A4 treble or C3-A3 bass supported-subset validation. If the guide is absent or unsupported, guided presentation remains available and no focus toggle is offered.
- Reading focus visually hides the selected exercise instructions and ordered sequence, the textual next pitch, visible staff and physical-key pitch labels, and the amber expected-key answer.
- The same semantic text and ARIA labels remain available to assistive technology. Physical keys remain focusable and playable through the selected input path, and visible keyboard focus and pressed state remain distinct.
- Occurrence-based accepted, expected, and remaining progress remains visible on the staff. Progress count, pitch-free rhythm task, count-in, pulse state, timing controls and feedback, error correction, restart, completion, history, recommendation, and exercise chooser remain available. For the steady broken-chord pair, the generic one-note-per-beat task applies across all eight event positions without displaying pitch order. For the 3/4 broken-chord pair, the pitch-free task retains the three-beat count-in and complete `1 2 3, 1 2 3, 1` count across seven positions. For the 5/4 pulse pair, it retains the exact six-position task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` For the offbeat pair, the task includes the first-note-on-1 instruction and complete `1 & 2 & 3 & 4 &` count.
- Correct feedback in reading focus does not name either the accepted pitch or the next pitch. Wrong, repeated, and out-of-order feedback may name actual and expected pitches as an explicit correction. Guided feedback remains unchanged.
- The learner may toggle the presentation before or during an attempt. The selected presentation survives restart within that page instance, but navigation, exercise selection, or reload restores the guided default.
- The choice is not persisted, placed in the URL, or added to exercise, evaluation, attempt, history, recommendation, curriculum, analytics, or native-wrapper state.

### Future Scope

- Reading assessment, sight-reading evidence, cue-reduction levels, timed reveal, score concealment, memorization detection, adaptive hints, saved preferences, and goal-sensitive recommendations require separate evidence and persistence decisions.
- A future full notation system may define reading-focused controls for written rhythm, accidentals, voices, or both hands only after those semantics exist in canonical exercise data.
- Equivalent challenge designs for non-visual reading workflows require their own learner research; preserving assistive semantics in this slice is non-negotiable.

### Architecture

- **Server default:** The Worker always renders the complete guided document. Reading focus is progressive enhancement and never a prerequisite for understanding or completing an exercise.
- **Availability boundary:** Client composition may expose the toggle only when the already-rendered staff guide matches the supported projection for the selected canonical exercise. It does not independently guess support from title, hand, pitch range, or DOM geometry.
- **Presentation state:** The page instance owns a two-value guided/reading-focus presentation state. It is independent from session status, evaluator progress, pulse status, input connection, and persistence status.
- **Visual suppression:** Presentation state changes classes or presentation attributes on existing content; it does not delete canonical copy, reorder events, mutate staff geometry, duplicate controls, or synthesize another exercise.
- **Rhythm-guidance boundary:** Reading Focus may hide pitch-bearing exercise instructions but never the separate pitch-free rhythm task. The steady broken-chord study retains `Steady pulse`, `Pitch order · One note per beat`, and a task that applies one note per beat across its eight positions. The 3/4 loop retains those labels plus `After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.` Canonical timing under ADR-060 separately drives its three visible beat indicators and pulse wrap. The 5/4 pulse retains those labels plus the exact task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` while canonical timing separately drives five visible beat indicators and pulse wrap. The offbeat study remains playable from its staff order plus the visible instruction to place the first note on 1 and the remaining notes on successive “and” counts.
- **Accessible semantics:** Visually suppressed instructions, sequence meaning, pitches, and key states retain semantic or ARIA equivalents. Keyboard focus, pressed state, and control operability do not depend on the visible pitch label or amber expected-state styling.
- **Progress boundary:** Evaluator state continues to drive occurrence-based staff progress and pitch-based keyboard state. Reading focus suppresses only the keyboard's visible expected-answer treatment; it does not change expected, remaining, accepted, idle, or pressed facts.
- **Feedback projection:** The existing structured evaluator result remains authoritative. Reading-focus presentation removes pitch names and the next-pitch answer from correct feedback, while explicit error classifications may expose actual and expected pitches. Timing facts and completion summaries remain truthful.
- **Lifetime:** Restart preserves presentation state because it resets the attempt inside the same page. Navigation and reload create a new guided page. No query parameter, cookie, Web Storage entry, attempt field, or bridge message carries the choice.
- **Evidence boundary:** Reading focus is not recorded, recommended, scored, or interpreted as proof that the staff was read. The same canonical completion has the same evidence regardless of presentation state. For a steady broken-chord study, that evidence remains limited to eight ordered pitches and seven MIDI-relative timing gaps; it does not prove audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering or hand use, relaxation, harmony recognition, staff reading, consistency, or mastery. For a 3/4 loop, it remains limited to seven ordered pitches and six MIDI-relative whole-beat gaps; visible count grouping and timing-derived pulse guidance do not prove audible downbeat, 3/4 counting or grouping, learner accent, or measure alignment. For a 5/4 pulse study, it remains limited to six ordered pitches and five MIDI-relative whole-beat gaps; the visible five-beat count-in, task, indicators, pulse, wrap, and accent do not prove audible meter, count-in, phase, downbeat, click or measure alignment, performed pulse, counting or grouping, learner accent or dynamics, physical technique, declared-hand use, keyboard geography, five-finger control, staff reading, consistency, or mastery.

### Accessibility and Progressive Enhancement

- Without JavaScript, the learner receives the complete guided exercise and no non-functional reading-focus control.
- The toggle has an accessible name, current-state semantics, visible focus, and clear guided/reading-focus labels rather than relying on icon or colour alone.
- Visually suppressed text remains available to assistive technology; CSS must not use `display: none`, the `hidden` attribute, or `aria-hidden` on the only semantic equivalent.
- Physical keys retain stable accessible pitch/state labels, focus indication, pressed state, and activation behavior in both presentations.
- Staff progress and numeric progress remain perceivable independently of the amber expected-key answer.
- Correct feedback remains a live update without disclosing pitch names in reading focus; error corrections remain specific and calm.

### Edge Cases

- Toggling during count-in, ready, in-progress, interrupted, or completed state changes only presentation and preserves the exact session snapshot.
- Restart while reading focus is active resets attempt progress and feedback but leaves reading focus active.
- Choosing another exercise through the server-rendered catalog or reloading the same URL creates a guided page.
- An unsupported or missing staff guide leaves the guided page fully functional and does not expose a misleading reading-focus toggle.
- Repeated-pitch events remain separate staff occurrences while one physical key is reused. Reading focus does not collapse progress or reveal the expected occurrence through keyboard colour.
- A correct timed note may still report timing without a pitch name; a pitch error may name the actual and expected notes without changing the timing anchor.
- The steady broken-chord study keeps its generic pitch-free one-note-per-beat task visible across all eight positions. Canonical 4/4 metadata and offsets 0–7 do not turn the pitch-only staff guide into written rhythm or strengthen completion evidence into audible measure alignment.
- The 3/4 broken-chord study keeps its pitch-free three-beat count-in and complete grouped count visible across all seven positions. Canonical 3/4 metadata, three beat indicators, and offsets 0–6 do not turn the pitch-only staff guide into written rhythm or strengthen completion evidence into audible phase, grouping, accent, or measure alignment.
- The 5/4 pulse study keeps `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` visible across all six positions. Canonical 5/4 metadata, five beat indicators, and offsets 0–5 do not turn the pitch-only staff guide into written rhythm or strengthen completion evidence beyond six ordered pitches and five MIDI-relative whole-beat gaps.
- The offbeat study's pitch-free full count remains visible even though its selected heading instructions and note-order text are suppressed. This presentation does not strengthen the evaluator's evidence: audible downbeat and between-click alignment remain unproved.
- Completion and recommendation copy may name exercise titles, but must not claim the learner read the staff or mastered notation.

### Anti-Patterns

- Do not make reading focus the server-rendered, no-JavaScript, saved, or inferred default.
- Do not offer reading focus when the staff adapter reports unsupported content.
- Do not remove accessible pitch, sequence, control-state, focus, or pressed-state meaning to make the visual challenge stricter.
- Do not hide the staff's evaluator-driven progress, numeric progress, count-in, rhythm contract, or necessary error correction.
- Do not leak the next pitch through correct-feedback copy while reading focus is active.
- Do not change evaluator classifications, expected events, timing, completion, attempt identity, history, recommendation, or exercise revision based on presentation state.
- Do not persist, synchronize, analyze, or use reading-focus choice as curriculum evidence.
- Do not describe completion in this presentation as proof of staff reading, sight reading, memory, clef fluency, or notation mastery.

## Contract

### Definition of Done

- [ ] Every practice response remains a complete guided server-rendered document, and no-JavaScript practice remains unchanged.
- [ ] Enhanced pages expose a learner-controlled guided/reading-focus toggle only for an exercise with a validated supported staff guide.
- [ ] Reading focus visually suppresses selected-exercise instructions and sequence, next pitch, staff/key pitch labels, and the amber expected-key answer while retaining semantic and ARIA equivalents.
- [ ] Physical-key focus, pressed state, operability, staff progress, numeric progress, count-in, pitch-free rhythm guidance, timing behavior, and completion remain intact; the steady broken-chord pair retains its generic one-note-per-beat task across eight positions, the 3/4 pair retains its three-beat count-in and full `1 2 3, 1 2 3, 1` task across seven, the 5/4 pair retains the exact task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` across six, and the offbeat pair retains its full `1 & 2 & 3 & 4 &` task.
- [ ] Correct feedback reveals no current or next pitch in reading focus; explicit wrong, repeated, and out-of-order feedback may identify actual and expected pitches.
- [ ] Toggling before or during an attempt never changes evaluator, session, pulse, persistence, history, or recommendation state.
- [ ] Restart preserves the current presentation in-page, while navigation and reload restore guided presentation.
- [ ] No exercise, attempt, history, recommendation, storage, URL, curriculum, analytics, or native-wrapper field records the choice.
- [ ] Completion makes no reading-mastery claim.
- [ ] Unit, view, and browser tests cover availability, cue suppression, accessibility semantics, mid-attempt toggle, restart lifetime, navigation/reload reset, feedback projection, and unsupported-guide fallback.

### Regression Guardrails

- Guided server HTML remains the source of complete exercise meaning and stays usable before enhancement.
- Reading-focus availability comes from validated staff support, not a duplicated pitch-range heuristic.
- Visual suppression never removes the only accessible semantic equivalent.
- The expected-key domain state remains present even when its amber visual answer is suppressed.
- Staff occurrence progress and physical-key aggregation continue to use canonical evaluator and event identity.
- Correct feedback in reading focus cannot append a next-note answer indirectly through shared copy.
- Pitch-bearing instructions may be visually suppressed, but a timed study's separate rhythm task must remain visible and must not leak the hidden pitch order.
- Error correction may reveal notes only as the projection of existing evaluator facts and may not reset or skip progress.
- Presentation state is page-local, survives only in-page restart, and never enters persistence or canonical identity.
- The same normalized MIDI input produces the same evaluator result and completed-attempt record in guided and reading-focus presentations.
- No curriculum or recommendation path may treat use of reading focus as evidence or a prerequisite.

### Verification

- **Unit tests:** Presentation state defaults, support gating, correct/error feedback projection, mid-attempt state preservation, restart lifetime, and unsupported-guide behavior.
- **View tests:** Guided server HTML contains every cue and accessible hook; enhanced reading-focus selectors target existing semantic content without creating alternate exercise data.
- **Client tests:** Toggling changes only presentation, preserves evaluator/pulse/input snapshots, keeps physical-key focus and pressed state, retains staff progress, and does not write storage.
- **Browser tests:** No-JavaScript remains guided; supported exercises, including the D-minor studies at the expanded A boundary, can enter and leave reading focus before and during practice; visible cues disappear while accessible names remain; the steady broken-chord study retains its pitch-free eight-position one-note-per-beat task, the 3/4 pair retains its pitch-free three-beat grouped count, the 5/4 pair retains its exact six-position five-beat task, and the offbeat study retains its pitch-free full count; restart preserves focus; reload and exercise navigation restore guided; error correction is specific and correct feedback does not disclose the next pitch.
- **Documentation checks:** README, architecture, ADR, practice-session, staff-notation, curriculum, and Worker-shell wording agree on the transient presentation and no-mastery boundaries.

### Scenarios

**Scenario: Load the guided default**

- Given: the learner opens a current practice route
- When: the Worker response is displayed before enhancement
- Then: instructions, ordered notes, pitch labels, next pitch, and expected-key guidance are visible and there is no non-functional reading-focus control

**Scenario: Enter reading focus on a supported guide**

- Given: client enhancement has validated the selected exercise's supported staff guide
- When: the learner chooses `Reading focus`
- Then: the selected-exercise instructions and sequence, next pitch, visible staff/key labels, and amber expected-key answer are visually suppressed while staff progress, numeric progress, rhythm guidance, focus, pressed state, operability, and accessible equivalents remain

**Scenario: Keep D minor inside the supported reading range**

- Given: `ordered-chord-tones-d-minor-right-hand` renders its validated D4-F4-A4-F4-D4 guide at the current A4 boundary
- When: the learner enters Reading Focus and completes the untimed sequence
- Then: the same five occurrence markers and D-E-F-G-A controls preserve progress and accessible meaning while visible pitch answers are reduced, and completion records no reading-focus, minor-quality, fingering, hand-use, or staff-reading evidence

**Scenario: Retain offbeat count guidance**

- Given: `offbeat-step-skip-c-major-right-hand` is selected and its supported guide enables Reading Focus
- When: the learner turns on Reading Focus
- Then: pitch-bearing instructions and note-order answers are visually suppressed, while the pitch-free task still places the first note on 1, the remaining notes on successive “and” counts, and displays `1 & 2 & 3 & 4 &`

**Scenario: Retain steady broken-chord pulse guidance**

- Given: `steady-quarter-broken-chord-c-major-right-hand` is selected and its supported eight-marker guide enables Reading Focus
- When: the learner turns on Reading Focus
- Then: pitch-bearing instructions and C-E-G-E-C-E-G-E answers are visually suppressed, while `Steady pulse`, `Pitch order · One note per beat`, and the generic pitch-free one-note-per-beat task remain visible and apply across all eight progress positions without claiming audible phase or measure alignment

**Scenario: Retain 3/4 grouping guidance**

- Given: `three-four-broken-chord-c-major-right-hand` is selected and its supported seven-marker guide enables Reading Focus
- When: the learner turns on Reading Focus
- Then: pitch-bearing instructions and C-E-G-C-E-G-C answers are visually suppressed, while `Steady pulse`, `Pitch order · One note per beat`, the three-beat count-in, three beat indicators, and `Count 1 2 3, 1 2 3, 1` remain visible without claiming audible phase, downbeat, grouping, learner accent, or measure alignment

**Scenario: Retain 5/4 pulse guidance**

- Given: `five-four-pulse-c-major-right-hand` is selected and its supported six-marker guide enables Reading Focus
- When: the learner turns on Reading Focus
- Then: pitch-bearing instructions and C-D-E-F-G-C answers are visually suppressed, while `Steady pulse`, `Pitch order · One note per beat`, five beat indicators, and the exact task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` remain visible without claiming audible meter, count-in, phase, downbeat, click or measure alignment, pulse, counting or grouping, learner accent, physical technique, or staff-reading evidence

**Scenario: Keep correct feedback from revealing the answer**

- Given: reading focus is active and the learner plays the expected pitch
- When: correct feedback is projected
- Then: it confirms correctness and any timing fact without naming the accepted or next pitch

**Scenario: Reveal an explicit correction**

- Given: reading focus is active and the learner plays a wrong, repeated, or out-of-order note
- When: feedback is projected
- Then: it may name the actual and expected pitches so the learner can correct the error without changing canonical progress

**Scenario: Toggle during an attempt**

- Given: an attempt has accepted at least one event
- When: the learner switches between guided and reading focus
- Then: the same evaluator progress, timing anchor, active input, and attempt identity continue while only cue presentation changes

**Scenario: Restart without losing the page preference**

- Given: reading focus is active during an incomplete attempt
- When: the learner restarts
- Then: attempt progress resets normally and reading focus remains active in the current page instance

**Scenario: Reset at a document boundary**

- Given: reading focus is active
- When: the learner reloads or navigates to another exercise
- Then: the new server-rendered page begins in guided presentation with no stored preference

**Scenario: Encounter unsupported notation**

- Given: the staff adapter reports the selected exercise as unsupported
- When: client enhancement initializes
- Then: it leaves the complete guided practice page available and does not offer reading focus

**Scenario: Complete without claiming reading mastery**

- Given: the learner completes an exercise while reading focus is active
- When: completion, history, curriculum, and recommendation consume the attempt
- Then: they receive the same pitch/order and optional timing evidence as guided practice, with no reading-focus field or staff-reading claim
