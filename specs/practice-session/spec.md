# Feature: Practice Session

## Blueprint

### Context

The learner needs a short, calm practice flow that works with a physical keyboard or deterministic mock input, survives normal device failures, and leaves useful local evidence of progress. The server-rendered page must still explain the exercise when JavaScript or MIDI is unavailable.

### Current First-Slice Scope

- The validated library contains six canonical, original beginner exercises: right-hand C4-G4 ascent and descent, left-hand C3-G3 ascent and descent, and a C-E-D-F-G step-and-skip pattern for each hand.
- `GET /practice` returns the default right-hand ascent. `GET /practice?exercise=<id>` returns the selected canonical exercise, while an unknown, empty, or duplicated exercise parameter returns `404` instead of silently changing the learner's task.
- The home and practice pages render the complete exercise chooser on the server. The selected title, instructions, expected notes, chooser, and basic limitation text remain meaningful without JavaScript; connecting input, live highlighting, evaluation, completion, and local history are progressive enhancements.
- Enhanced mode provides input selection and connection state, a clear five-key note display, the next expected note, brief event feedback, restart, completion feedback, and a local history summary.
- The mock adapter supports the complete browser flow without physical hardware. Supported desktop browsers may use Web MIDI through the same session boundary.
- Only completed attempts are persisted in this slice. History is filtered by exercise ID and revision; an incomplete, restarted, disconnected, or abandoned attempt does not appear as a completed history item.

### Future Scope

- Count-in, metronome, tempo controls, timing and duration evaluation, Web Audio clicks, pause/resume, richer history, recommendations, and original steady-pulse Rhythm and Coordination exercises belong to later slices.
- Cloud synchronization, authentication, social comparison, streaks, and remote analytics are not implied by local history.
- A native iPad MIDI wrapper may supply input later without changing session behavior.

### Architecture

- **Entry point:** The Worker resolves the optional `exercise` query parameter against the validated library and renders `/practice`; typed client modules enhance the returned HTML without inline executable code.
- **Selection rule:** An omitted exercise query selects the stable canonical default. A supplied ID must resolve exactly or return `404`; the client initializes from the server-selected exercise identity embedded in the document.
- **Session states:** A session progresses through ready, in-progress, completed, or interrupted. Input capability and connection state are related context, not substitutes for session state.
- **Start rule:** The first evaluable note-on starts an attempt. Note-off, unsupported MIDI, device enumeration, and connection changes do not start one.
- **Progress rule:** The performance evaluator owns note classification and expected-event advancement. The session projects evaluator state into the display and feedback region.
- **Evaluation boundary:** The evaluator observes normalized note pitch and order only. Hand labels are practice instructions; MIDI input cannot verify which hand, fingering, touch, movement, or posture produced a note.
- **Restart rule:** Restart creates a clean evaluator state for the same exercise revision, clears transient feedback and progress, and keeps already completed history. Restarting an incomplete attempt does not persist it as completed.
- **Disconnect rule:** Losing the active input during an in-progress attempt marks it interrupted. The learner is told to reconnect and restart; events after the disconnect cannot complete that attempt.
- **Completion rule:** The attempt completes once the evaluator accepts every expected event in order. Additional input does not mutate the completed result.
- **Persistence boundary:** A local attempt repository isolates browser storage from the session controller. A versioned `localStorage` envelope is the first-slice backing store for compact completed-attempt summaries; IndexedDB remains a migration option if the data model outgrows synchronous key-value storage.
- **Completed-attempt record:** The stored record includes a unique attempt ID, exercise ID and revision, wall-clock start and completion times for history, input adapter kind, completion status, and deterministic feedback/error counts. Raw MIDI messages and platform device objects are not required.
- **History summary:** At minimum, the page presents a meaningful empty state and the number of completed attempts today for the selected exercise ID and revision. It may also show the most recent matching completion. “Today” uses the learner's current local calendar day.
- **Dependencies:** Sessions consume a validated canonical exercise, `MidiInputPort`, the deterministic evaluator, and the local attempt repository. None of those domains read rendered DOM as source data.

### Accessibility and Progressive Enhancement

- The initial HTML contains the exercise chooser, selected exercise heading, instructions, and ordered notes rather than placeholder content that only JavaScript fills.
- The expected-note state is conveyed by text in addition to colour. The five-key display remains understandable with keyboard navigation and common assistive technology.
- Connection, feedback, completion, persistence failure, and history regions use appropriate status semantics without repeatedly interrupting the learner.
- Controls have visible text labels and usable focus states. No essential action depends only on pointer input.

### Edge Cases

- If client JavaScript fails, the learner still sees what to play and is not shown a false connected, completed, or empty-history state. The server-rendered history shell states neutrally that JavaScript is required to read local attempts.
- If an exercise query is missing, the canonical default is selected. If the parameter is present but empty, unknown, or repeated, the Worker returns a non-indexable `404`; client code never substitutes a different exercise.
- If Web MIDI is unsupported or permission is denied, the page explains the state calmly and offers the mock path.
- Note-off and unsupported events do not change expected-note highlighting or start an attempt.
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
- Do not persist a restart, disconnect, or abandoned attempt as a successful completion.
- Do not block practice because local history storage failed.
- Do not add cloud storage, identity, telemetry, streak pressure, punitive scoring, or celebratory game mechanics to this slice.
- Do not imply that the app replaces a teacher or diagnoses posture, tension, fingering, or strength.

## Contract

### Definition of Done

- [ ] `/practice` returns the canonical default, and `?exercise=<id>` selects each of the six validated exercises without requiring client JavaScript.
- [ ] Unknown, empty, and duplicated supplied exercise parameters return `404`.
- [ ] The server-rendered chooser identifies the selected exercise and links to every library entry.
- [ ] Enhancement exposes input choice and state, five-key guidance, next expected note, calm feedback, restart, and completion.
- [ ] The complete session works through deterministic mock input and through Web MIDI on supported desktop browsers.
- [ ] Restart after an incomplete attempt produces clean progress without a false history record.
- [ ] Disconnect during an attempt interrupts it and requires a clean restart.
- [ ] One completed-attempt record is stored locally and appears in the history summary.
- [ ] Empty and unavailable history states are handled explicitly.
- [ ] The spec is updated in the same change set when session or persistence behavior changes.
- [ ] Unit and Playwright tests cover critical lifecycle behavior.

### Regression Guardrails

- Server-rendered instructions must remain present in the response body before enhancement.
- Before enhancement, the history shell must state that JavaScript is required rather than claim there are zero completed attempts.
- Only normalized note-on events may start or advance the current untimed attempt.
- The highlighted next note must always correspond to evaluator state from the canonical exercise.
- The selected exercise ID in the URL, server-rendered content, client evaluator, and persisted attempt must agree.
- Completion must represent accepted pitch and order only, without claiming that the declared hand or fingering was verified.
- Restart must clear transient evaluation state while preserving completed history.
- Device disconnect must make completion impossible for the interrupted attempt.
- A completed attempt must be persisted at most once.
- Storage failure must not convert a completed performance into a failed musical attempt.
- History must remain local to the browser and scoped by exercise ID and revision unless a later accepted architecture decision changes that contract.
- Mock and Web MIDI input must share the same session and evaluation path.

### Verification

- **Unit tests:** Session state transitions, note-off filtering, restart invalidation, disconnect interruption, completion idempotence, local-day summary, empty history, corrupt-record isolation, and persistence failure.
- **Integration tests:** Exercise-library selection, canonical exercise, evaluator, mock port, and attempt repository cooperate without DOM-derived data; unknown IDs fail closed.
- **Browser tests:** Playwright opens the default and at least one non-default exercise, verifies server-rendered instructions and chooser behavior, selects mock input, plays canonical fixtures, observes guidance and feedback, completes the exercise, reloads, and sees history only for the selected exercise revision.
- **Coverage target:** Every session transition and persistence failure branch remains exercised; snapshots alone are insufficient evidence.

### Scenarios

**Scenario: Instructions survive without JavaScript**

- Given: client scripting is disabled or fails to load
- When: the learner opens `/practice`
- Then: the default C-D-E-F-G right-hand instructions, expected notes, and six-exercise chooser remain visible, and history says JavaScript is required instead of claiming the history is empty

**Scenario: Select another exercise without JavaScript**

- Given: client scripting is disabled
- When: the learner opens `/practice?exercise=five-note-ascent-c-major-left-hand`
- Then: the left-hand C3-D3-E3-F3-G3 exercise is selected and fully readable, with links to the other five exercises

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
