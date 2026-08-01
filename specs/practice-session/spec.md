# Feature: Practice Session

## Blueprint

### Context

The learner needs a short, calm practice flow that works with a physical keyboard on desktop or iPad, or with deterministic mock input, survives normal device failures, and leaves useful local evidence of progress. The server-rendered page must still explain the exercise when JavaScript or MIDI is unavailable.

### Current Scope

- The validated library contains eight canonical, original beginner exercises: right-hand C4-G4 ascent and descent, left-hand C3-G3 ascent and descent, a C-E-D-F-G step-and-skip pattern for each hand, and one C-D-E-F-G steady-quarter study for each hand.
- `GET /practice` returns the default right-hand ascent. `GET /practice?exercise=<id>` returns the selected canonical exercise, while an unknown, empty, or duplicated exercise parameter returns `404` instead of silently changing the learner's task.
- The home and practice pages render the complete exercise chooser on the server. The selected title, instructions, expected notes, chooser, and basic limitation text remain meaningful without JavaScript; connecting input, live highlighting, evaluation, completion, and local history are progressive enhancements.
- Enhanced mode provides input selection and connection state, a clear five-key note display, the next expected note, brief event feedback, restart, completion feedback, and a local history summary. Timed studies also expose a 40–100 BPM control with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and deterministic on-pulse, early, or late feedback. The score, next-note cue, keyboard, and feedback read as one primary practice stage; input setup, exercise selection, history, and scope guidance sit in a secondary rail that follows the stage when the layout stacks.
- The mock adapter supports the complete browser flow without physical hardware. Supported desktop browsers may use Web MIDI and the iPadOS 17-or-later wrapper may use CoreMIDI through `NativeMidiInputPort`, all through the same session boundary.
- Only completed attempts are persisted in this slice. History is filtered by exercise ID and revision; an incomplete, restarted, disconnected, or abandoned attempt does not appear as a completed history item. A timed completion may include its fixed tempo, four interval classifications, and mean absolute error while existing untimed records omit timing.
- Native MIDI completions use the `native-midi` adapter kind; they do not have a separate evaluator, completion rule, or history model.

### Future Scope

- Note-duration and velocity evaluation, rests, eighth notes, syncopation, chords, hands-together coordination, adaptive tempo, pause/resume, richer history, and recommendations belong to later slices.
- Cloud synchronization, authentication, social comparison, streaks, and remote analytics are not implied by local history.
- Native release distribution, signing automation, device provisioning, and native-only practice features are not implied by the thin MIDI wrapper.

### Architecture

- **Entry point:** The Worker resolves the optional `exercise` query parameter against the validated library and renders `/practice`; typed client modules enhance the returned HTML without inline executable code.
- **Platform composition:** Browser composition remains standalone. When the trusted iPad shell exposes its validated bridge, bootstrap uses `NativeMidiInputPort`; otherwise the same page offers Web MIDI where supported and deterministic mock input everywhere.
- **Selection rule:** An omitted exercise query selects the stable canonical default. A supplied ID must resolve exactly or return `404`; the client initializes from the server-selected exercise identity embedded in the document.
- **Session states:** A session progresses through ready, in-progress, completed, or interrupted. Input capability and connection state are related context, not substitutes for session state.
- **Tempo rule:** A timed study starts at its canonical 60 BPM default and accepts an integer selection from 40 through 100 BPM. The selected tempo is fixed when the attempt starts; changing it prepares a clean attempt rather than modifying an in-progress timing target.
- **Count-in rule:** Starting a timed study schedules four quarter-note count-in beats followed by ongoing quarter-note click guidance. The count-in prepares the learner but does not establish evaluation time zero.
- **Start rule:** The first evaluable note-on starts an attempt. In timed mode, the first accepted correct note also establishes the evaluator's fixed MIDI timestamp anchor. Note-off, unsupported MIDI, pitch errors before the first accepted note, audio clicks, device enumeration, and connection changes do not establish that anchor.
- **Progress rule:** The performance evaluator owns note classification and expected-event advancement. The session projects evaluator state into the display and feedback region.
- **Clock boundary:** A small Web Audio guidance service owns count-in and click scheduling. The session never converts its scheduled or actual audio times into MIDI time and never supplies them to the evaluator; timing feedback comes only from normalized MIDI timestamp deltas and canonical beat gaps.
- **Presentation hierarchy:** The canonical exercise and live session state are projected into a responsive practice-desk surface. Desktop and iPad layouts may place supporting panels beside the stage, but narrow layouts preserve the stage-first document and focus order instead of visually promoting configuration over playing.
- **Evaluation boundary:** The evaluator observes normalized note pitch and order and, for timed mode only, MIDI timestamp intervals. Hand labels are practice instructions; MIDI input cannot verify which hand, fingering, touch, movement, or posture produced a note.
- **Restart rule:** Restart stops active click guidance, creates a clean evaluator and timing anchor for the same exercise revision and selected tempo, clears transient feedback and progress, and keeps already completed history. Restarting an incomplete attempt does not persist it as completed.
- **Disconnect rule:** Losing the active input during an in-progress attempt marks it interrupted. The learner is told to reconnect and restart; events after the disconnect cannot complete that attempt.
- **Completion rule:** The attempt completes once the evaluator accepts every expected event in order. Additional input does not mutate the completed result.
- **Persistence boundary:** A local attempt repository isolates browser storage from the session controller. A versioned `localStorage` envelope is the first-slice backing store for compact completed-attempt summaries; IndexedDB remains a migration option if the data model outgrows synchronous key-value storage.
- **Completed-attempt record:** The stored record includes a unique attempt ID, exercise ID and revision, wall-clock start and completion times for history, input adapter kind, completion status, and deterministic feedback/error counts. A timed completion also includes an optional summary with tempo, assessed intervals, on-pulse, early, and late counts, and mean absolute error in milliseconds. Raw MIDI messages, per-note traces, audio times, and platform device objects are not required.
- **Native attempt identity:** A session driven through `NativeMidiInputPort` records `native-midi` as its adapter kind. It uses the same local attempt repository and exercise/revision scoping as every other completion.
- **History summary:** At minimum, the page presents a meaningful empty state and the number of completed attempts today for the selected exercise ID and revision. It may also show the most recent matching completion. “Today” uses the learner's current local calendar day.
- **Dependencies:** Sessions consume a validated canonical exercise, `MidiInputPort`, the deterministic evaluator, and the local attempt repository. None of those domains read rendered DOM as source data.

### Accessibility and Progressive Enhancement

- The initial HTML contains the exercise chooser, selected exercise heading, instructions, and ordered notes rather than placeholder content that only JavaScript fills.
- The expected-note state is conveyed by text in addition to colour. The five-key display remains understandable with keyboard navigation and common assistive technology.
- Connection, feedback, completion, persistence failure, and history regions use appropriate status semantics without repeatedly interrupting the learner.
- Tempo, count-in, and click state are conveyed in text as well as sound. Starting audio remains an explicit learner action compatible with browser audio-permission rules.
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
- The ±0.2-beat timing window scales with the selected BPM. The window is 300 ms at 40 BPM, 200 ms at 60 BPM, and 120 ms at 100 BPM.
- Rapid restart invalidates callbacks from the old attempt so a late event cannot mutate the new one.
- Storage unavailability, quota failure, or a corrupt stored record does not prevent practice or erase other valid records. Completion remains visible and the learner is told that history could not be saved.
- Multiple completion callbacks for one attempt are idempotent and create one stored record.
- An empty history is displayed as an empty state, never as an error or fabricated zero-streak judgement.
- Local-day counting handles midnight by deriving the summary from stored timestamps and the current local calendar day at render time.

### Anti-Patterns

- Do not require JavaScript merely to read the exercise instructions.
- Do not require JavaScript to choose or link directly to an exercise.
- Do not derive exercise notes or identity by scraping the rendered keyboard.
- Do not silently fall back to the default when a supplied exercise ID is invalid.
- Do not allow views to classify MIDI events or advance evaluation independently.
- Do not continue an interrupted attempt across a device disconnect when input may have been lost.
- Do not compare Web Audio schedule or callback times with normalized MIDI timestamps.
- Do not change tempo adaptively or move the evaluation anchor to excuse an error or accumulated drift.
- Do not persist a restart, disconnect, or abandoned attempt as a successful completion.
- Do not block practice because local history storage failed.
- Do not add cloud storage, identity, telemetry, streak pressure, punitive scoring, or celebratory game mechanics to this slice.
- Do not imply that the app replaces a teacher or diagnoses posture, tension, fingering, or strength.
- Do not branch practice-session or evaluator behavior on CoreMIDI packet details, native source identity, or WKWebView messages.
- Do not store native attempts under a web or mock adapter kind.
- Do not let input configuration, exercise browsing, history, or decorative progress treatment compete with the current note and keyboard as the primary practice task.

## Contract

### Definition of Done

- [ ] `/practice` returns the canonical default, and `?exercise=<id>` selects each of the eight validated exercises without requiring client JavaScript.
- [ ] Unknown, empty, and duplicated supplied exercise parameters return `404`.
- [ ] The server-rendered chooser identifies the selected exercise and links to every library entry.
- [ ] Enhancement exposes input choice and state, five-key guidance, next expected note, calm feedback, restart, and completion.
- [ ] The active practice stage remains the dominant surface at desktop and iPad sizes, with secondary panels following it in semantic and narrow-screen order.
- [ ] The complete session works through deterministic mock input, through Web MIDI on supported desktop browsers, and through `NativeMidiInputPort` in the trusted iPad wrapper.
- [ ] Each steady-quarter study offers 40–100 BPM with 60 BPM default, a four-beat 4/4 count-in, quarter-note click guidance, and four MIDI-interval timing assessments after the first accepted correct note anchors the attempt.
- [ ] Web Audio remains guidance-only and cannot alter pitch or timing evaluation.
- [ ] Restart after an incomplete attempt produces clean progress without a false history record.
- [ ] Disconnect during an attempt interrupts it and requires a clean restart.
- [ ] One completed-attempt record is stored locally and appears in the history summary.
- [ ] Timed completion stores one internally consistent optional timing summary while untimed and older records remain valid without it.
- [ ] Empty and unavailable history states are handled explicitly.
- [ ] The spec is updated in the same change set when session or persistence behavior changes.
- [ ] Unit and Playwright tests cover critical lifecycle behavior.
- [ ] Native completions are persisted with the `native-midi` adapter kind through the existing repository.
- [ ] Closing, disconnecting, or replacing the selected native source interrupts an active attempt by the same rule as browser input loss.

### Regression Guardrails

- Server-rendered instructions must remain present in the response body before enhancement.
- Before enhancement, the history shell must state that JavaScript is required rather than claim there are zero completed attempts.
- Only normalized note-on events may start or advance an attempt.
- Only accepted correct notes may establish or contribute to timed interval evaluation; pitch errors must not move the timing anchor.
- The highlighted next note must always correspond to evaluator state from the canonical exercise.
- The selected exercise ID in the URL, server-rendered content, client evaluator, and persisted attempt must agree.
- No completion may claim that the declared hand or fingering was verified.
- Timed completion may additionally represent MIDI onset timing against the declared quarter-note pulse, but never duration, velocity, audio synchronization, adaptive tempo, or physical technique.
- Restart must clear transient evaluation state while preserving completed history.
- Device disconnect must make completion impossible for the interrupted attempt.
- A completed attempt must be persisted at most once.
- Storage failure must not convert a completed performance into a failed musical attempt.
- History must remain local to the browser and scoped by exercise ID and revision unless a later accepted architecture decision changes that contract.
- Mock, Web MIDI, and native MIDI input must share the same session and evaluation path.
- The presence or absence of a WKWebView bridge must not change exercise identity, evaluator results, or browser-only availability.
- Swift must never persist an attempt or claim practice completion directly.
- Responsive CSS must preserve the same canonical exercise, live-region meaning, control labels, and focus sequence at every supported viewport.
- Audio guidance and MIDI evaluation must remain separate clock domains across mock, Web MIDI, and native input.

### Verification

- **Unit tests:** Session state transitions, note-off filtering, restart invalidation, disconnect interruption, completion idempotence, tempo boundaries, four-beat count-in scheduling, audio cleanup, fixed MIDI timing anchor, optional timing-summary validation, local-day summary, empty history, corrupt-record isolation, and persistence failure.
- **Integration tests:** Exercise-library selection, canonical timed and untimed exercises, evaluator, audio guidance, mock port, and attempt repository cooperate without DOM-derived data or cross-clock comparison; unknown IDs fail closed.
- **Native adapter tests:** Validated native replies, state changes, and normalized events drive the same controller; malformed payloads, stale callbacks, disconnect, and disposal cannot advance or complete an attempt.
- **Browser tests:** Playwright opens the default, a non-default untimed exercise, and a timed exercise; verifies server-rendered instructions and chooser behavior; selects mock input; changes tempo; starts the count-in; plays canonical timestamped fixtures; observes pitch and timing feedback; completes; reloads; and sees history only for the selected exercise revision.
- **Coverage target:** Every session transition and persistence failure branch remains exercised; snapshots alone are insufficient evidence.

### Scenarios

**Scenario: Instructions survive without JavaScript**

- Given: client scripting is disabled or fails to load
- When: the learner opens `/practice`
- Then: the default C-D-E-F-G right-hand instructions, expected notes, and eight-exercise chooser remain visible, and history says JavaScript is required instead of claiming the history is empty

**Scenario: Select another exercise without JavaScript**

- Given: client scripting is disabled
- When: the learner opens `/practice?exercise=five-note-ascent-c-major-left-hand`
- Then: the left-hand C3-D3-E3-F3-G3 exercise is selected and fully readable, with links to the other seven exercises

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
- Then: completion feedback remains visible and a separate message says that history was not saved

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

**Scenario: Change the steady-quarter tempo**

- Given: the timed exercise is ready at its 60 BPM default
- When: the learner chooses any integer tempo from 40 through 100 BPM before playing
- Then: the count-in, click guidance, evaluator, feedback, and eventual timing summary consistently use that selected tempo for the attempt

**Scenario: Complete and persist timed evidence**

- Given: C4 established the timing anchor and D4, E4, F4, and G4 were accepted against their canonical beat gaps
- When: the timed attempt completes
- Then: history stores one optional summary whose assessed intervals equal its on-pulse, early, and late counts, while no raw MIDI or Web Audio timestamps are persisted

**Scenario: Make a pitch error during timed practice**

- Given: C4 anchored the attempt and D4 is next
- When: the learner plays E4 early and then corrects with D4
- Then: E4 receives pitch feedback only, the original anchor remains fixed, and D4 timing uses its actual MIDI timestamp against canonical beat 1

**Scenario: Restart timed practice**

- Given: count-in or performance is active for a steady-quarter study
- When: the learner restarts or changes tempo
- Then: old audio scheduling and timing state are invalidated, no completion is persisted, and the next accepted first note establishes a fresh anchor
