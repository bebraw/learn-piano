# Feature: Practice Session

## Blueprint

### Context

The learner needs a short, calm practice flow that works with a physical keyboard on desktop or iPad, or with deterministic mock input, survives normal device failures, and leaves useful local evidence of progress. The server-rendered page must still explain the exercise when JavaScript or MIDI is unavailable.

### Current Scope

- The validated library contains twelve canonical, original beginner exercises, six per hand: C-position ascents and descents, untimed C-E-D-F-G step-and-skip patterns, straight C-D-E-F-G steady-quarter studies, timed C-E-D-F-G step-and-skip studies, and C-D-E-F-G even-eighth studies.
- `GET /practice` returns the default right-hand ascent. `GET /practice?exercise=<id>` returns the selected canonical exercise, while an unknown, empty, or duplicated exercise parameter returns `404` instead of silently changing the learner's task.
- The home and practice pages render the complete exercise chooser on the server. The selected title, instructions, expected notes, pitch-only staff guide, chooser, and basic limitation text remain meaningful without JavaScript; connecting input, live highlighting, evaluation, completion, and local history are progressive enhancements.
- Every current exercise receives a supported inline-SVG pitch guide derived from its canonical expected events: treble for the single-hand right-hand C4-G4 natural-note range and bass for the single-hand left-hand C3-G3 natural-note range. Adjacent ordered note text remains the semantic fallback, and the guide adds no duration, rhythm, or staff-reading evidence.
- Enhanced mode provides input selection and connection state, accepted/next/remaining pitch-guide state, a clear five-key note display, the next expected note, brief event feedback, restart, completion feedback, a local history summary, and one explained advisory study suggestion after completion. Timed studies also expose a 40–100 BPM control with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and deterministic “on time,” “early,” or “late” learner feedback. Exercise cards and setup copy distinguish the `Eighth-note grid` from `Steady pulse`, while the staff label says `Pitch order · Even eighth-note onsets`. The pitch guide, next-note cue, keyboard, and feedback read as one primary practice stage; input setup, exercise selection, history, and scope guidance sit in a secondary rail that follows the stage when the layout stacks.
- The mock adapter supports the complete browser flow without physical hardware. Supported desktop browsers may use Web MIDI and the iPadOS 17-or-later wrapper may use CoreMIDI through `NativeMidiInputPort`, all through the same session boundary.
- Only completed attempts are persisted in this slice. History is filtered by exercise ID and revision; an incomplete, restarted, disconnected, or abandoned attempt does not appear as a completed history item. A timed completion may include its fixed tempo, four interval classifications, and mean absolute error while existing untimed records omit timing.
- Native MIDI completions use the `native-midi` adapter kind; they do not have a separate evaluator, completion rule, or history model.
- The completion UI suggests an eligible uncompleted direct dependent first, then an eligible uncompleted exercise in canonical library order. When every current exercise has exact-revision completion evidence, it suggests the least recently practiced review. The learner can always ignore it and use the complete exercise chooser.
- Each timed step-and-skip study declares both its matching untimed step-and-skip and straight steady-quarter studies as prerequisites. Those declarations affect advisory eligibility only and never block a direct selection.
- Each even-eighth study declares only its matching straight steady-quarter study as a prerequisite. It uses onset offsets 0, 0.5, 1, 1.5, and 2 with a ±0.1-beat window; this affects advisory eligibility and timing evaluation without blocking direct selection or adding duration semantics.

### Future Scope

- Full score notation, note-duration and velocity evaluation, rests, tuplets, syncopation, chords, hands-together coordination, adaptive tempo, pause/resume, richer history, and quality-sensitive or goal-sensitive recommendations belong to later slices.
- Cloud synchronization, authentication, social comparison, streaks, and remote analytics are not implied by local history.
- Native release distribution, signing automation, device provisioning, and native-only practice features are not implied by the thin MIDI wrapper.

### Architecture

- **Entry point:** The Worker resolves the optional `exercise` query parameter against the validated library and renders `/practice`; typed client modules enhance the returned HTML without inline executable code.
- **Platform composition:** Browser composition remains standalone. When the trusted iPad shell exposes its validated bridge, bootstrap uses `NativeMidiInputPort`; otherwise the same page offers Web MIDI where supported and deterministic mock input everywhere.
- **Selection rule:** An omitted exercise query selects the stable canonical default. A supplied ID must resolve exactly or return `404`; the client initializes from the server-selected exercise identity embedded in the document.
- **Session states:** A session progresses through ready, in-progress, completed, or interrupted. Input capability and connection state are related context, not substitutes for session state.
- **Tempo rule:** A timed study starts at its canonical 60 BPM default and accepts an integer selection from 40 through 100 BPM. The selected tempo is fixed when the attempt starts; changing it prepares a clean attempt rather than modifying an in-progress timing target.
- **Count-in rule:** Starting a timed study schedules four quarter-note count-in beats followed by ongoing quarter-note click guidance. For even-eighth work, each click marks a numbered beat and explanatory copy places the “and” count halfway between clicks. The count-in prepares the learner but does not establish evaluation time zero.
- **Start rule:** The first evaluable note-on starts an attempt. In timed mode, the first accepted correct note also establishes the evaluator's fixed MIDI timestamp anchor. Note-off, unsupported MIDI, pitch errors before the first accepted note, audio clicks, device enumeration, and connection changes do not establish that anchor.
- **Progress rule:** The performance evaluator owns note classification and expected-event advancement. The session projects evaluator state into the display and feedback region.
- **Pitch-guide projection:** A presentation adapter derives ordered staff positions from canonical event IDs, MIDI note numbers, and the current single-hand natural-note subset. Server rendering provides the initial inline SVG; client enhancement projects accepted, next, and remaining evaluator state onto the matching canonical markers. Neither renderer nor SVG decides progress.
- **Notation fallback:** The semantic ordered note sequence remains present beside the guide and is the fallback for assistive technology or unsupported future notation. The renderer must not transpose, clamp, respell, omit, or partially draw an unsupported exercise to make it fit.
- **Clock boundary:** A small Web Audio guidance service owns count-in and quarter-note click scheduling. The session never converts its scheduled or actual audio times into MIDI time and never supplies them to the evaluator; timing feedback comes only from normalized MIDI timestamp deltas and canonical beat gaps, including fractional offsets for subdivision.
- **Presentation hierarchy:** The canonical exercise and live session state are projected into a responsive practice-desk surface. Desktop and iPad layouts may place supporting panels beside the stage, but narrow layouts preserve the stage-first document and focus order instead of visually promoting configuration over playing.
- **Evaluation boundary:** The evaluator observes normalized note pitch and order and, for timed mode only, MIDI timestamp intervals. Hand labels are practice instructions; MIDI input cannot verify which hand, fingering, touch, movement, or posture produced a note.
- **Identity boundary:** Adding or replacing the staff presentation does not change the current exercise schema, canonical ID, revision, evaluator, or attempt-history identity. Rendered coordinates and glyphs never enter canonical exercise or persistence data.
- **Restart rule:** Restart stops active click guidance, creates a clean evaluator and timing anchor for the same exercise revision and selected tempo, clears transient feedback and progress, and keeps already completed history. Restarting an incomplete attempt does not persist it as completed.
- **Disconnect rule:** Losing the active input during an in-progress attempt marks it interrupted. The learner is told to reconnect and restart; events after the disconnect cannot complete that attempt.
- **Completion rule:** The attempt completes once the evaluator accepts every expected event in order. Additional input does not mutate the completed result.
- **Recommendation boundary:** The controller requests one deterministic recommendation only from the validated canonical library and completed-attempt identity, revision, and recency. Pitch-error counts, timing classifications, tempo, input kind, and other performance-quality fields do not affect this version. The result never changes evaluator state or exercise availability.
- **Recommendation timing:** The controller loads retained exact-revision records for the library independently from the selected exercise's history summary. On completion it includes the new in-memory record immediately, before persistence settles; after a successful save it reloads retained history and recalculates. The completion UI shows the canonical suggestion and its reason, or the unrestricted exercise library when recommendation is unavailable.
- **Persistence boundary:** A local attempt repository isolates browser storage from the session controller. A versioned `localStorage` envelope is the first-slice backing store for compact completed-attempt summaries; IndexedDB remains a migration option if the data model outgrows synchronous key-value storage.
- **Completed-attempt record:** The stored record includes a unique attempt ID, exercise ID and revision, wall-clock start and completion times for history, input adapter kind, completion status, and deterministic feedback/error counts. A timed completion also includes an optional summary with tempo, assessed intervals, compatibility-named `onPulse`, early, and late counts, and mean absolute error in milliseconds. Internal `on-pulse` and persisted `onPulse` remain stable while learner copy says “on time.” Raw MIDI messages, per-note traces, audio times, and platform device objects are not required.
- **Native attempt identity:** A session driven through `NativeMidiInputPort` records `native-midi` as its adapter kind. It uses the same local attempt repository and exercise/revision scoping as every other completion.
- **History summary:** At minimum, the page presents a meaningful empty state and the number of completed attempts today for the selected exercise ID and revision. It may also show the most recent matching completion. “Today” uses the learner's current local calendar day.
- **Dependencies:** Sessions consume a validated canonical exercise, `MidiInputPort`, the deterministic evaluator, and the local attempt repository. None of those domains read rendered DOM as source data.

### Accessibility and Progressive Enhancement

- The initial HTML contains the exercise chooser, selected exercise heading, instructions, pitch guide, and ordered notes rather than placeholder content that only JavaScript fills.
- The adjacent semantic note sequence names every pitch in canonical order. The inline SVG does not create a conflicting second spoken sequence, and next-note meaning remains available in text rather than colour alone.
- The expected-note state is conveyed by text in addition to colour. The five-key display remains understandable with keyboard navigation and common assistive technology.
- Connection, feedback, completion, persistence failure, and history regions use appropriate status semantics without repeatedly interrupting the learner.
- The suggested exercise and its reason are expressed as text in the completion region. Unavailable recommendation state falls back to a plainly labelled exercise-library action, and no exercise link is disabled by recommendation state.
- Tempo, count-in, and click state are conveyed in text as well as sound. Starting audio remains an explicit learner action compatible with browser audio-permission rules.
- Even-eighth instructions explain that quarter clicks mark numbered beats and the “and” count falls halfway between; the learner is not expected to infer that relationship from sound or visual spacing alone.
- Controls have visible text labels and usable focus states. No essential action depends only on pointer input.

### Edge Cases

- If client JavaScript fails, the learner still sees what to play and is not shown a false connected, completed, or empty-history state. The server-rendered history shell states neutrally that JavaScript is required to read local attempts.
- If an exercise query is missing, the canonical default is selected. If the parameter is present but empty, unknown, or repeated, the Worker returns a non-indexable `404`; client code never substitutes a different exercise.
- If Web MIDI is unsupported or permission is denied, the page explains the state calmly and offers the mock path.
- If the native bridge is absent, malformed, rejected, or not running at the configured trusted origin, native input is not offered and the standalone browser paths remain usable.
- If the native source disconnects, is replaced, or the app leaves the foreground during an active attempt, the same disconnect rule interrupts the attempt; Swift does not synthesize completion or restore progress.
- Note-off and unsupported events do not change expected-note highlighting or start an attempt.
- If Web Audio starts late, is suspended, or cannot produce a click, the page must not fabricate count-in progress or derive a MIDI timing result from audio state. Retrying guidance or restarting the attempt preserves the same canonical timing contract.
- A wrong, repeated, or out-of-order note does not move the fixed timing anchor. The later correct note is assessed at its actual MIDI timestamp against the original anchor.
- Each timing window scales with the selected BPM. The steady-quarter ±0.2-beat window is 300 ms at 40 BPM, 200 ms at 60 BPM, and 120 ms at 100 BPM; the even-eighth ±0.1-beat window is 150, 100, and 60 ms respectively.
- Rapid restart invalidates callbacks from the old attempt so a late event cannot mutate the new one.
- Storage unavailability, quota failure, or a corrupt stored record does not prevent practice or erase other valid records. Completion remains visible and the learner is told that history could not be saved.
- If the initial cross-library history read fails, recommendation remains unavailable and the completion action opens the full library. If saving a just-completed attempt fails, the current page may retain the optimistic suggestion from that in-memory completion while history reports the failure; after reload only successfully retained evidence can contribute.
- Local retention is bounded. Once an older completion is evicted, it no longer satisfies a current prerequisite or completion fact and an earlier exercise may be suggested again without regression or penalty language.
- A missing prerequisite reference, prerequisite cycle, or inability to resolve a canonical candidate yields no suggestion; it does not block the selected exercise or completion.
- Multiple completion callbacks for one attempt are idempotent and create one stored record.
- An empty history is displayed as an empty state, never as an error or fabricated zero-streak judgement.
- Local-day counting handles midnight by deriving the summary from stored timestamps and the current local calendar day at render time.
- If a future exercise uses accidentals, an unsupported range, mixed hands, `both` hand, chords, or multiple voices, the pitch-guide adapter reports the unsupported subset and the complete semantic text and normal practice flow remain available.
- A descending or step-and-skip exercise keeps canonical event order horizontally while its pitch markers move vertically by note number; presentation order never sorts or rewrites evaluator order.

### Anti-Patterns

- Do not require JavaScript merely to read the exercise instructions.
- Do not require JavaScript to choose or link directly to an exercise.
- Do not derive exercise notes or identity by scraping the rendered keyboard.
- Do not derive exercise notes or identity by scraping the staff guide, or treat rendered coordinates as canonical notation data.
- Do not silently fall back to the default when a supplied exercise ID is invalid.
- Do not allow views to classify MIDI events or advance evaluation independently.
- Do not continue an interrupted attempt across a device disconnect when input may have been lost.
- Do not compare Web Audio schedule or callback times with normalized MIDI timestamps.
- Do not change tempo adaptively or move the evaluation anchor to excuse an error or accumulated drift.
- Do not persist a restart, disconnect, or abandoned attempt as a successful completion.
- Do not block practice because local history storage failed.
- Do not turn recommendation into an unlock, lock, required next step, mastery claim, or replacement for the complete chooser.
- Do not choose the next study from rendered card position, a circular “next” link, storage iteration order, error totals, timing quality, tempo, or velocity.
- Do not add cloud storage, identity, telemetry, streak pressure, punitive scoring, or celebratory game mechanics to this slice.
- Do not imply that the app replaces a teacher or diagnoses posture, tension, fingering, or strength.
- Do not infer written duration, beat placement, articulation, dynamics, or staff-reading mastery from the pitch-only guide or its marker spacing.
- Do not infer held duration, rests, notation, or simultaneity from fractional onset offsets or the `Eighth-note grid` label.
- Do not branch practice-session or evaluator behavior on CoreMIDI packet details, native source identity, or WKWebView messages.
- Do not store native attempts under a web or mock adapter kind.
- Do not let input configuration, exercise browsing, history, or decorative progress treatment compete with the current note and keyboard as the primary practice task.

## Contract

### Definition of Done

- [ ] `/practice` returns the canonical default, and `?exercise=<id>` selects each of the twelve validated exercises without requiring client JavaScript.
- [ ] Unknown, empty, and duplicated supplied exercise parameters return `404`.
- [ ] The server-rendered chooser identifies the selected exercise and links to every library entry.
- [ ] Every current exercise server-renders the supported treble or bass pitch guide and adjacent semantic note text from its canonical expected events.
- [ ] Enhancement exposes input choice and state, accepted/next/remaining pitch-guide state, five-key guidance, next expected note, calm feedback, restart, and completion.
- [ ] The active practice stage remains the dominant surface at desktop and iPad sizes, with secondary panels following it in semantic and narrow-screen order.
- [ ] The complete session works through deterministic mock input, through Web MIDI on supported desktop browsers, and through `NativeMidiInputPort` in the trusted iPad wrapper.
- [ ] Each of the six timed studies offers 40–100 BPM with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and four MIDI-interval timing assessments after the first accepted correct note anchors the attempt. The even-eighth pair uses fractional half-beat offsets and ±0.1-beat tolerance.
- [ ] Web Audio remains guidance-only and cannot alter pitch or timing evaluation.
- [ ] Restart after an incomplete attempt produces clean progress without a false history record.
- [ ] Disconnect during an attempt interrupts it and requires a clean restart.
- [ ] One completed-attempt record is stored locally and appears in the history summary.
- [ ] Timed completion stores one internally consistent optional timing summary while untimed and older records remain valid without it.
- [ ] Empty and unavailable history states are handled explicitly.
- [ ] Completion shows one deterministic, explained advisory suggestion from exact-current-revision retained history plus the current in-memory completion, or an exercise-library fallback when recommendation is unavailable.
- [ ] Recommendation does not restrict exercise choice or use pitch-error and timing-quality fields in this version.
- [ ] The spec is updated in the same change set when session or persistence behavior changes.
- [ ] Unit and Playwright tests cover critical lifecycle behavior.
- [ ] Native completions are persisted with the `native-midi` adapter kind through the existing repository.
- [ ] Closing, disconnecting, or replacing the selected native source interrupts an active attempt by the same rule as browser input loss.

### Regression Guardrails

- Server-rendered instructions must remain present in the response body before enhancement.
- The complete supported pitch guide and its semantic text fallback must remain present before enhancement.
- Before enhancement, the history shell must state that JavaScript is required rather than claim there are zero completed attempts.
- Only normalized note-on events may start or advance an attempt.
- Only accepted correct notes may establish or contribute to timed interval evaluation; pitch errors must not move the timing anchor.
- The highlighted next note must always correspond to evaluator state from the canonical exercise.
- Pitch-guide marker order and live state must use canonical event order and IDs; a renderer must not create its own exercise identity or progress logic.
- The selected exercise ID in the URL, server-rendered content, client evaluator, and persisted attempt must agree.
- No completion may claim that the declared hand or fingering was verified.
- No completion may claim staff-reading or sight-reading evidence merely because the pitch guide was visible.
- Timed completion may additionally represent MIDI onset timing against declared integer or fractional beat offsets, but never duration, rests, notation, simultaneity, velocity, audio synchronization, adaptive tempo, or physical technique.
- Restart must clear transient evaluation state while preserving completed history.
- Device disconnect must make completion impossible for the interrupted attempt.
- A completed attempt must be persisted at most once.
- Storage failure must not convert a completed performance into a failed musical attempt.
- Recommendation failure must not hide, disable, or reorder the complete exercise chooser, and recommendation must not change evaluator or completion results.
- Only exact-current-revision retained completions and the current unsaved completion may satisfy recommendation prerequisites; bounded eviction and reload after a failed save remove unavailable evidence without punitive language.
- History must remain local to the browser and scoped by exercise ID and revision unless a later accepted architecture decision changes that contract.
- Mock, Web MIDI, and native MIDI input must share the same session and evaluation path.
- The presence or absence of a WKWebView bridge must not change exercise identity, evaluator results, or browser-only availability.
- Swift must never persist an attempt or claim practice completion directly.
- Responsive CSS must preserve the same canonical exercise, live-region meaning, control labels, and focus sequence at every supported viewport.
- Responsive CSS must keep the pitch guide inside the practice stage without page-level horizontal overflow and retain the ordered note text fallback.
- Audio guidance and MIDI evaluation must remain separate clock domains across mock, Web MIDI, and native input.

### Verification

- **Unit tests:** Session state transitions, note-off filtering, restart invalidation, disconnect interruption, completion idempotence, tempo boundaries, four-beat count-in scheduling, quarter-click subdivision guidance, audio cleanup, fixed MIDI timing anchor, optional timing-summary validation, rhythm-aware presentation labels, local-day summary, empty history, corrupt-record isolation, persistence failure, pitch-guide state projection, optimistic post-completion recommendation, retained-history refresh, and unavailable recommendation fallback.
- **Integration tests:** Exercise-library selection, supported staff rendering, canonical timed and untimed exercises, evaluator, audio guidance, mock port, and attempt repository cooperate without DOM-derived data, notation-derived identity, or cross-clock comparison; unknown IDs fail closed.
- **Native adapter tests:** Validated native replies, state changes, and normalized events drive the same controller; malformed payloads, stale callbacks, disconnect, and disposal cannot advance or complete an attempt.
- **Browser tests:** Playwright opens the default, a left-hand untimed exercise, a timed step-and-skip exercise, and an even-eighth exercise; verifies server-rendered pitch guides, rhythm-aware labels, ordered text, instructions, and chooser behavior; selects mock input; observes matching staff and keyboard progress; changes tempo; starts the count-in; plays canonical timestamped fixtures; observes pitch and onset-timing feedback; completes; sees the explained direct-dependent suggestion while the full chooser remains available; reloads; and sees only successfully retained exact-revision history.
- **Coverage target:** Every session transition and persistence failure branch remains exercised; snapshots alone are insufficient evidence.

### Scenarios

**Scenario: Instructions survive without JavaScript**

- Given: client scripting is disabled or fails to load
- When: the learner opens `/practice`
- Then: the default C-D-E-F-G right-hand instructions, expected notes, and twelve-exercise chooser remain visible, and history says JavaScript is required instead of claiming the history is empty

**Scenario: Select another exercise without JavaScript**

- Given: client scripting is disabled
- When: the learner opens `/practice?exercise=five-note-ascent-c-major-left-hand`
- Then: the left-hand C3-D3-E3-F3-G3 exercise is selected and fully readable with a bass pitch guide, ordered note text, and links to the other eleven exercises

**Scenario: Read right-hand staff positions without JavaScript**

- Given: client scripting is disabled
- When: the learner opens the default right-hand exercise
- Then: the server response contains a treble pitch guide for C4-D4-E4-F4-G4, the middle-C ledger line, and the same sequence in semantic text

**Scenario: Project evaluator progress onto the staff**

- Given: C4 is next in an enhanced right-hand exercise
- When: the shared evaluator accepts C4
- Then: the C4 marker becomes accepted and the marker matching the evaluator's next canonical event becomes next, consistently with the textual and keyboard cues

**Scenario: Requested exercise does not exist**

- Given: a supplied exercise ID is empty or absent from the canonical library, or more than one exercise parameter is supplied
- When: the learner requests `/practice?exercise=<invalid-id>`
- Then: the Worker returns a non-indexable `404` and does not present the default as if it were the requested exercise

**Scenario: Start and complete with mock input**

- Given: the learner selects the deterministic mock adapter on a ready session
- When: the fixture plays C4, D4, E4, F4, and G4 in order
- Then: guidance advances after each note, the session completes, and one local attempt is recorded

**Scenario: Restart an incomplete attempt**

- Given: C4 and D4 have been accepted in the current attempt
- When: the learner restarts
- Then: C4 becomes the next expected note, transient feedback clears, and no completion is added to history

**Scenario: Disconnect during an attempt**

- Given: an input disconnects after an attempt has started
- When: the session receives the disconnection
- Then: it becomes interrupted, explains that a restart is required, and cannot complete from late or reconnected events

**Scenario: Complete attempt persists**

- Given: browser storage is available
- When: the learner completes the sequence and later reloads the practice page
- Then: the history summary includes exactly one completed attempt for that exercise revision and does not count attempts from another exercise or revision

**Scenario: Practice history is empty**

- Given: no completed attempt is stored
- When: the history summary loads
- Then: it presents a calm empty state and zero completed attempts today

**Scenario: Persistence fails after completion**

- Given: the sequence is complete but browser storage rejects the write
- When: the session saves the attempt
- Then: completion feedback remains visible, a separate message says that history was not saved, and any in-session suggestion may use the transient completion without implying it was retained

**Scenario: Suggest the next study optimistically**

- Given: retained history is available and the learner has just completed the selected exercise
- When: its completed-attempt save is still pending
- Then: the completion UI may use that in-memory exact-revision record to show the first eligible direct dependent and explain that it builds on the completed study

**Scenario: Recommendation evidence is unavailable**

- Given: cross-library history cannot be read or the prerequisite graph is invalid
- When: the learner completes an exercise
- Then: musical completion remains valid, no study is guessed, and the completion action opens the unrestricted exercise library

**Scenario: Complete through native MIDI**

- Given: the trusted iPad wrapper selected one CoreMIDI source and the ready session uses `NativeMidiInputPort`
- When: the learner plays the canonical notes in order
- Then: the shared evaluator completes the exercise and the existing repository stores one attempt with adapter kind `native-midi`

**Scenario: Native source disconnects during practice**

- Given: a native MIDI attempt is in progress
- When: the selected CoreMIDI source disconnects
- Then: the shared session becomes interrupted, late native packets cannot complete it, and the learner must restart

**Scenario: Open the browser without the wrapper**

- Given: the application runs in an ordinary browser with no native bridge
- When: the learner opens a practice exercise
- Then: server-rendered content, mock input, and supported Web MIDI behavior remain available without a native error

**Scenario: Start a steady-quarter study**

- Given: the learner selected `steady-quarter-c-major-right-hand`, connected an input, and left tempo at 60 BPM
- When: they start the timed exercise
- Then: the page presents four 4/4 quarter-note count-in beats, continues quarter-note click guidance, and waits for the first accepted C4 to establish MIDI time zero

**Scenario: Practice step-and-skip motion on the pulse**

- Given: the learner selected `steady-quarter-step-skip-c-major-right-hand`, connected an input, and left tempo at 60 BPM
- When: they start the timed exercise and play C4-E4-D4-F4-G4 on successive quarter-note beats
- Then: the same count-in, click, fixed MIDI anchor, pitch feedback, and four timing classifications apply without treating pitch distance as elapsed time

**Scenario: Subdivide the quarter-note click**

- Given: the learner selected `even-eighths-c-major-right-hand`, connected an input, and left tempo at 60 BPM
- When: they start the exercise and play C4-D4-E4-F4-G4 at offsets 0, 0.5, 1, 1.5, and 2
- Then: setup copy explains that clicks mark numbered beats and “and” falls halfway between, the card says `Eighth-note grid`, the staff says `Pitch order · Even eighth-note onsets`, and four intervals are assessed with the ±0.1-beat window

**Scenario: Keep staff markers pitch-only during timed practice**

- Given: a steady-quarter study displays its staff pitch guide
- When: its count-in and timing evaluation run
- Then: the guide continues to represent only pitch and canonical order, while the pulse service and MIDI-interval evaluator separately own timing guidance and evidence

**Scenario: Change the steady-quarter tempo**

- Given: the timed exercise is ready at its 60 BPM default
- When: the learner chooses any integer tempo from 40 through 100 BPM before playing
- Then: the count-in, click guidance, evaluator, feedback, and eventual timing summary consistently use that selected tempo for the attempt

**Scenario: Complete and persist timed evidence**

- Given: C4 established the timing anchor and D4, E4, F4, and G4 were accepted against their canonical beat gaps
- When: the timed attempt completes
- Then: history stores one optional summary whose assessed intervals equal its `onPulse`, early, and late counts, while learner copy says “on time” and no raw MIDI or Web Audio timestamps are persisted

**Scenario: Make a pitch error during timed practice**

- Given: C4 anchored the attempt and D4 is next
- When: the learner plays E4 early and then corrects with D4
- Then: E4 receives pitch feedback only, the original anchor remains fixed, and D4 timing uses its actual MIDI timestamp against canonical beat 1

**Scenario: Restart timed practice**

- Given: count-in or performance is active for a steady-quarter study
- When: the learner restarts or changes tempo
- Then: old audio scheduling and timing state are invalidated, no completion is persisted, and the next accepted first note establishes a fresh anchor
