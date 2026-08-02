# Feature: Practice Session

## Blueprint

### Context

The learner needs a short, calm practice flow that works with a physical keyboard on desktop or iPad, or with deterministic mock input, survives normal device failures, and leaves useful local evidence of progress. The server-rendered page must still explain the exercise when JavaScript or MIDI is unavailable.

### Current Scope

- The validated library contains thirty-three canonical exercises. The first thirty remain original beginner foundations, fifteen per hand: C-position ascents and descents, untimed C-E-D-F-G step-and-skip patterns, untimed C-E-G-E-C C-major and D-F-A-F-D D-minor ordered chord-tone patterns, untimed D-E-F-G-A D-minor five-note ascents, straight C-D-E-F-G steady-quarter studies, timed C-E-D-F-G step-and-skip studies, C-D-E-F-G even-eighth studies, C-C-D-D-E repeated-note studies, C-E-D-D-F-G-E-C mixed-pattern studies, C-E-D-F-G offbeat-onset studies, C-E-G-E-C-E-G-E steady broken-chord studies, C-E-G-C-E-G-C broken-chord loops in 3/4, and C-D-E-F-G-C pulse patterns in 5/4. Three sourced public-domain learning arrangements add Beethoven, Bach, and Pachelbel excerpts at task-relative beginner, intermediate, and advanced levels. Fifteen are untimed and eighteen are timed.
- `GET /practice` returns the default right-hand ascent. `GET /practice?exercise=<id>` returns the selected canonical exercise, while an unknown, empty, or duplicated exercise parameter returns `404` instead of silently changing the learner's task.
- The home and practice pages render the complete exercise chooser on the server. The selected title, instructions, expected notes, pitch-only staff guide, chooser, and basic limitation text remain meaningful without JavaScript; connecting input, live highlighting, evaluation, completion, and local history are progressive enhancements.
- Every current exercise receives a supported inline-SVG pitch guide derived from its canonical expected events: treble for the single-hand right-hand C4-A4 natural-note range and bass for the single-hand left-hand C3-A3 natural-note range. Adjacent ordered note text remains the semantic fallback, and the guide adds no duration, rhythm, chord-quality, or staff-reading evidence.
- Enhanced mode provides input selection and connection state, accepted/next/remaining pitch-guide state, a clear natural-note-span keyboard, the next expected note, brief event feedback, restart, completion feedback, a local history summary with factual newest-five retained evidence, and one explained advisory study suggestion after completion. Timed studies also expose a 40–100 BPM control with 60 BPM default, timing-derived meter and count-in guidance, quarter-note clicks, and deterministic “on time,” “early,” or “late” learner feedback. Fourteen studies retain a four-beat 4/4 count-in; the 3/4 pair uses three count-in beats, three visible beat indicators, and audible pulse wrap after beat 3; and the 5/4 pair uses five count-in beats, five visible beat indicators, and audible pulse wrap after beat 5. Exercise cards and setup copy distinguish `Steady pulse`, the regular `Eighth-note grid`, and the `Offbeat grid`; steady-pulse staff labels say `Pitch order · One note per beat`, while the offbeat staff label says `Pitch order · Downbeat then offbeat onsets`. Compact-landscape Guided mode may hide duplicate pitch-free tasks while pitch-bearing heading instructions remain visible; Reading Focus reveals the pitch-free task when it suppresses those instructions, including the steady broken chord's generic one-note-per-beat guidance across eight positions, the 3/4 loop's complete `1 2 3, 1 2 3, 1` task across seven, the 5/4 pulse's complete `1 2 3 4 5, 1` task across six, and the offbeat study's full count. The pitch guide, next-note cue, keyboard, and feedback read as one primary practice stage; input setup, exercise selection, history, and scope guidance sit in a secondary rail that follows the stage when the layout stacks.
- When client enhancement validates a supported staff guide, the learner may switch from the fully guided server default to a transient reading-focus presentation. It visually suppresses the selected instructions and sequence, next-pitch answer, staff/key pitch labels, and amber expected-key answer while retaining accessible equivalents, staff and numeric progress, keyboard focus and pressed state, rhythm and count-in guidance, explicit error correction, completion, history, and recommendation.
- The mock adapter supports the complete browser flow without physical hardware. Supported desktop browsers may use Web MIDI and the iPadOS 17-or-later wrapper may use CoreMIDI through `NativeMidiInputPort`, all through the same session boundary.
- Only completed attempts are persisted in this slice. History is filtered by exercise ID and revision; an incomplete, restarted, disconnected, or abandoned attempt does not appear as a completed history item. A timed completion may include its fixed tempo, assessed-interval classifications, and mean absolute error while existing untimed records omit timing. Under ADR-062, the practice page derives recent pitch-or-order-correction and timing-classification facts from no more than the five newest retained exact-revision records without turning them into a grade, trend, or recommendation input.
- Native MIDI completions use the `native-midi` adapter kind; they do not have a separate evaluator, completion rule, or history model.
- The completion UI suggests an eligible uncompleted direct dependent first, then an eligible uncompleted exercise in canonical library order. When every current exercise has exact-revision completion evidence, it suggests the least recently practiced review. The learner can always ignore it and use the complete exercise chooser.
- Each timed step-and-skip study declares both its matching untimed step-and-skip and straight steady-quarter studies as prerequisites. Those declarations affect advisory eligibility only and never block a direct selection.
- Each even-eighth study declares only its matching straight steady-quarter study as a prerequisite. It uses onset offsets 0, 0.5, 1, 1.5, and 2 with a ±0.1-beat window; this affects advisory eligibility and timing evaluation without blocking direct selection or adding duration semantics.
- Each C-major ordered chord-tone study declares only its matching untimed step-and-skip study as a prerequisite. Each D-minor chord-tone study declares only its matching C-major chord-tone study, asks for D-F-A-F-D over D-E-F-G-A, and follows the C-major pair in canonical recommendation priority. All four chord-tone studies remain freely selectable; their chord-tone and quality names do not imply simultaneous, blocked-chord, chord-quality-recognition, or harmony evaluation. Each D-minor five-note ascent declares only the matching D-minor chord-tone study, asks for D-E-F-G-A, and remains freely selectable; the instructional E-F half-step cue adds no scale-completion, interval-recognition, fingering, hand-use, evenness, or technique evidence.
- Each repeated-note study declares only its matching even-eighth study as a prerequisite. It asks for five individual note occurrences in C-C-D-D-E order on the same half-beat grid and remains freely selectable; its name and separate-press instruction do not imply release, articulation, fingering, or physical-technique evaluation.
- Each mixed-pattern study declares its matching repeated-note and ordered chord-tone studies as prerequisites. It asks for eight individual note occurrences in C-E-D-D-F-G-E-C order on the half-beat grid and remains freely selectable. Its completion proves only ordered pitches and seven onset intervals, not duration, release, articulation, fingering, declared-hand use, relaxation, reading, or consistency.
- Each offbeat study declares only its matching mixed-pattern study as a prerequisite. It asks for C-E-D-F-G at offsets 0, 0.5, 1.5, 2.5, and 3.5 and remains freely selectable. The first C is the ungraded MIDI anchor; its four later timing facts do not prove audible downbeat or between-click alignment, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, declared-hand use, reading, relaxation, consistency, or mastery.
- Each steady broken-chord study declares, in canonical prerequisite order, its matching ordered chord-tone study followed by its matching straight steady-quarter study. It asks for eight individual occurrences in C-E-G-E-C-E-G-E order at offsets 0–7 with a ±0.2-beat window and remains freely selectable. The first C is the ungraded MIDI anchor; its seven later timing facts do not prove audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, declared-hand use, relaxation, harmony recognition, staff reading, consistency, or mastery.
- Each 3/4 broken-chord loop declares only its matching steady broken-chord study as prerequisite. It asks for seven individual occurrences in C-E-G-C-E-G-C order at offsets 0–6 with a ±0.2-beat window and remains freely selectable. Its 3/4 meter, three-beat count-in, visible and audible pulse wrap, beat-1 click accent, grouped count, and final-C instruction guide the learner but do not prove audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, declared-hand use, harmony recognition, staff reading, consistency, or mastery.
- Each 5/4 pulse study declares only its matching 3/4 broken-chord study as prerequisite. It asks for six individual occurrences in C-D-E-F-G-C order at offsets 0–5 with a ±0.2-beat window and remains freely selectable. Its 5/4 meter, five-beat count-in, visible and audible pulse wrap, beat-1 click accent, grouped count, and final-C instruction guide the learner but do not strengthen its evidence beyond six ordered pitches and five MIDI-relative whole-beat gaps. They do not prove audible meter, count-in, phase, downbeat, click, pulse, grouping, learner accent or dynamics, duration, release, legato, rests, fingering, declared-hand use, relaxation, keyboard geography, five-finger technique, staff reading, consistency, or mastery.

### Future Scope

- Full score notation, note-duration and velocity evaluation, rests, tuplets, syncopation, simultaneous chord events, hands-together coordination, adaptive tempo, pause/resume, richer history, and quality-sensitive or goal-sensitive recommendations belong to later slices.
- Cloud synchronization, authentication, social comparison, streaks, and remote analytics are not implied by local history.
- Native release distribution, signing automation, device provisioning, and native-only practice features are not implied by the thin MIDI wrapper.

### Architecture

- **Entry point:** The Worker resolves the optional `exercise` query parameter against the validated library and renders `/practice`; typed client modules enhance the returned HTML without inline executable code.
- **Platform composition:** Browser composition remains standalone. When the trusted iPad shell exposes its validated bridge, bootstrap uses `NativeMidiInputPort`; otherwise the same page offers Web MIDI where supported and deterministic mock input everywhere.
- **Selection rule:** An omitted exercise query selects the stable canonical default. A supplied ID must resolve exactly or return `404`; the client initializes from the server-selected exercise identity embedded in the document.
- **Session states:** A session progresses through ready, in-progress, completed, or interrupted. Input capability and connection state are related context, not substitutes for session state.
- **Tempo rule:** A timed study starts at its canonical 60 BPM default and accepts an integer selection from 40 through 100 BPM. The selected tempo is fixed when the attempt starts; changing it prepares a clean attempt rather than modifying an in-progress timing target.
- **Count-in rule:** Under ADR-060, starting a timed study schedules the exercise's canonical `countInBeats` followed by ongoing quarter-note click guidance whose numbered-beat wrap and beat-1 accent derive from `beatsPerMeasure`. Fourteen current studies use four count-in beats and 4/4; the 3/4 pair uses three count-in beats and wraps after beat 3; and the 5/4 pair uses five count-in beats and wraps after beat 5. For all fractional-position work, each click marks a numbered beat and explanatory copy locates the “and” count halfway between clicks. The offbeat pair keeps the complete count visible while targeting the anchor plus four successive “and” positions; the steady broken-chord pair keeps its generic pitch-free one-note-per-beat task visible across all eight progress positions; the 3/4 pair keeps its complete pitch-free `1 2 3, 1 2 3, 1` task visible across seven; and the 5/4 pair keeps `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` visible across six when Reading Focus hides the pitch-bearing instructions. The count-in, beat labels, pulse wrap, and accents prepare the learner but do not establish evaluation time zero or meter evidence.
- **Start rule:** The first evaluable note-on starts an attempt. In timed mode, the first accepted correct note also establishes the evaluator's fixed MIDI timestamp anchor. Note-off, unsupported MIDI, pitch errors before the first accepted note, audio clicks, device enumeration, and connection changes do not establish that anchor.
- **Progress rule:** The performance evaluator owns note classification and expected-event advancement. The session projects evaluator state into the display and feedback region.
- **Pitch-guide projection:** A presentation adapter derives ordered staff positions from canonical event IDs, MIDI note numbers, and the current single-hand natural-note subset. Server rendering provides the initial inline SVG; client enhancement projects accepted, next, and remaining evaluator state onto the matching canonical markers. Neither renderer nor SVG decides progress.
- **Physical-key projection:** The on-screen keyboard derives the sorted inclusive natural-note span from the lowest through highest expected pitch and renders one control per MIDI note in that span. Repeated occurrences reuse one pitch-keyed control and intermediate non-phrase notes remain idle but playable through the normal evaluator. For C-E-G-E-C, semantic text and staff progress retain five event IDs while the keyboard shows C-D-E-F-G once each; D-F-A-F-D likewise retains five over D-E-F-G-A, with E and G idle. The D-E-F-G-A ascents use all five D-position controls as expected events. C-D-E-F-G-C retains six event IDs, C-E-G-C-E-G-C retains seven, and C-E-D-D-F-G-E-C and C-E-G-E-C-E-G-E retain eight over their five C-position keys. Marker spacing remains pitch-only for every pair.
- **Physical-key state:** Aggregate occurrence progress onto each key as `expected` when that pitch is next, otherwise `remaining` while any occurrence of the pitch is pending, otherwise `accepted` when all occurrences are accepted. A span pitch absent from the phrase is `idle`. Pressed state is independent, and tapping a key emits its MIDI pitch instead of advancing an event ID directly.
- **Notation fallback:** The semantic ordered note sequence remains present beside the guide and is the fallback for assistive technology or unsupported future notation. The renderer must not transpose, clamp, respell, omit, or partially draw an unsupported exercise to make it fit.
- **Reading-focus boundary:** Guided content remains complete in the server response. Client presentation offers reading focus only after supported-guide validation, preserves semantic and ARIA equivalents, and changes no canonical, evaluator, session, pulse, persistence, history, or recommendation facts. Correct feedback omits pitch answers in reading focus; explicit errors may retain actual and expected pitches as correction. Pitch-free rhythm guidance remains visible, including the offbeat study's first-note-on-1 instruction and full `1 & 2 & 3 & 4 &` count, the steady broken chord's one-note-per-beat task across all eight positions, the 3/4 loop's three-beat count-in plus `1 2 3, 1 2 3, 1` count across seven, and the 5/4 pulse's exact task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` across six.
- **Reading-focus lifetime:** The guided/reading-focus selection belongs to the current page instance. It may change during an attempt and survives restart, but navigation and reload restore guided presentation. No URL, storage, exercise, attempt, bridge, or recommendation field carries it.
- **Clock boundary:** A small Web Audio guidance service owns timing-derived count-in and quarter-note click scheduling, numbered-beat wrap, and beat-1 accents. The session never converts its scheduled or actual audio times, pulse states, meter labels, or accents into MIDI time or supplies them to the evaluator; timing feedback comes only from normalized MIDI timestamp deltas and canonical beat gaps, including fractional offsets for subdivision.
- **Presentation hierarchy:** The canonical exercise and live session state are projected into a responsive practice-desk surface. Desktop and iPad layouts may place supporting panels beside the stage, but narrow layouts preserve the stage-first document and focus order instead of visually promoting configuration over playing.
- **Evaluation boundary:** The evaluator observes normalized note pitch and order and, for timed mode only, MIDI timestamp intervals from the first accepted correct note. That evidence cannot prove audible meter, count-in, phase, downbeat, between-click or click alignment, pulse, grouping, or measure alignment, 3/4 or 5/4 counting, learner accents, rests, silence, duration, release, holding, legato, articulation, dynamics or velocity quality, fingering, syncopation, declared-hand use, relaxation, harmony recognition, keyboard geography, five-finger technique, staff reading, consistency, mastery, touch, movement, or posture.
- **Identity boundary:** Adding or replacing staff or physical-key presentation does not change the current exercise schema, canonical ID, revision, evaluator, or attempt-history identity. Canonical event occurrences remain distinct even when they share one physical key; rendered coordinates, glyphs, and control identity never enter canonical exercise or persistence data.
- **Restart rule:** Restart stops active click guidance, creates a clean evaluator and timing anchor for the same exercise revision and selected tempo, clears transient feedback and progress, and keeps already completed history. Restarting an incomplete attempt does not persist it as completed.
- **Disconnect rule:** Losing the active input during an in-progress attempt marks it interrupted. The learner is told to reconnect and restart; events after the disconnect cannot complete that attempt.
- **Completion rule:** The attempt completes once the evaluator accepts every expected event in order. Additional input does not mutate the completed result.
- **Recommendation boundary:** The controller requests one deterministic recommendation only from the validated canonical library and completed-attempt identity, revision, and recency. Pitch-error counts, timing classifications, tempo, input kind, and other performance-quality fields do not affect this version. The result never changes evaluator state or exercise availability.
- **Recommendation timing:** The controller loads retained exact-revision records for the library independently from the selected exercise's history summary. On completion it includes the new in-memory record immediately, before persistence settles; after a successful save it reloads retained history and recalculates. The completion UI shows the canonical suggestion and its reason, or the unrestricted exercise library when recommendation is unavailable.
- **Persistence boundary:** A local attempt repository isolates browser storage from the session controller. A versioned `localStorage` envelope is the first-slice backing store for compact completed-attempt summaries; IndexedDB remains a migration option if the data model outgrows synchronous key-value storage.
- **Completed-attempt record:** The stored record includes a unique attempt ID, exercise ID and revision, canonical ISO wall-clock start and completion timestamps for history, input adapter kind, completion status, and deterministic feedback/error counts. Timestamp validation round-trips the parsed instant to the stored canonical form so parseable but impossible calendar dates cannot normalize into false history. A timed completion also includes an optional summary with tempo, assessed intervals, compatibility-named `onPulse`, early, and late counts, and mean absolute error in milliseconds. Internal `on-pulse` and persisted `onPulse` remain stable while learner copy says “on time.” Raw MIDI messages, per-note traces, audio times, and platform device objects are not required.
- **Native attempt identity:** A session driven through `NativeMidiInputPort` records `native-midi` as its adapter kind. It uses the same local attempt repository and exercise/revision scoping as every other completion.
- **History summary:** The page presents a meaningful empty state and the number of completed attempts today for the selected exercise ID and revision. “Today” uses the learner's current local calendar day. For readable non-empty history it also shows the latest matching completion and an ADR-062 projection over at most the five newest retained matches: attempts completed without pitch or order corrections, non-zero wrong/repeated/out-of-order totals, and categorical timing totals with their contributing-attempt count where saved. Records without timing still contribute note-sequence evidence; tempo and mean absolute error are not averaged.
- **Dependencies:** Sessions consume a validated canonical exercise, `MidiInputPort`, the deterministic evaluator, and the local attempt repository. None of those domains read rendered DOM as source data.

### Accessibility and Progressive Enhancement

- The initial HTML contains the exercise chooser, selected exercise heading, instructions, pitch guide, and ordered notes rather than placeholder content that only JavaScript fills.
- The adjacent semantic note sequence names every pitch in canonical order. The inline SVG does not create a conflicting second spoken sequence, and next-note meaning remains available in text rather than colour alone.
- The expected-note state is conveyed by text in addition to colour. Every physical key exposes its pitch and aggregate expected, remaining, accepted, or idle meaning to keyboard navigation and common assistive technology; pressed state does not replace that progress description.
- Reading focus reduces only visible answers. The toggle and physical keys retain accessible names, focus indication, pressed state, and operability; visually suppressed instructions, sequence, pitches, and states retain semantic or ARIA equivalents.
- Connection, feedback, completion, persistence failure, and history regions use appropriate status semantics without repeatedly interrupting the learner.
- The suggested exercise and its reason are expressed as text in the completion region. Unavailable recommendation state falls back to a plainly labelled exercise-library action, and no exercise link is disabled by recommendation state.
- Tempo, count-in, and click state are conveyed in text as well as sound. Starting audio remains an explicit learner action compatible with browser audio-permission rules.
- Fractional-position instructions explain that quarter clicks mark numbered beats and the “and” count falls halfway between. Steady broken-chord instructions name one note per beat across two four-beat groups. The 3/4 pair names its three-beat count-in and complete `1 2 3, 1 2 3, 1` grouping. The 5/4 pair names its five-beat count-in and uses the exact pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.` Guided mode keeps the applicable complete count or task in either the separate task or the still-visible pitch-bearing heading instructions; Reading Focus guarantees the separate pitch-free task is visible when those instructions are suppressed. The learner is therefore not expected to infer these relationships from sound or visual spacing alone.
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
- Each timing window scales with the selected BPM. The steady-quarter ±0.2-beat window is 300 ms at 40 BPM, 200 ms at 60 BPM, and 120 ms at 100 BPM; the regular eighth-grid and offbeat ±0.1-beat window is 150, 100, and 60 ms respectively.
- Rapid restart invalidates callbacks from the old attempt so a late event cannot mutate the new one.
- Storage unavailability, quota failure, or a corrupt stored record does not prevent practice or erase other valid records. Completion remains visible and the learner is told that history could not be saved.
- A non-canonical or impossible wall-clock timestamp, such as a normalized February 30 date, makes that record invalid; it must not become current coverage, today's activity, recency, or recommendation evidence.
- If the initial cross-library history read fails, recommendation remains unavailable and the completion action opens the full library. If saving a just-completed attempt fails, the current page may retain the optimistic suggestion from that in-memory completion while history reports the failure; after reload only successfully retained evidence can contribute.
- Local retention is bounded. Once an older completion is evicted, it no longer satisfies a current prerequisite or completion fact and an earlier exercise may be suggested again without regression or penalty language.
- A missing prerequisite reference, prerequisite cycle, or inability to resolve a canonical candidate yields no suggestion; it does not block the selected exercise or completion.
- Multiple completion callbacks for one attempt are idempotent and create one stored record.
- An empty history is displayed as an empty state, never as an error or fabricated zero-streak judgement.
- Local-day counting handles midnight by deriving the summary from stored timestamps and the current local calendar day at render time.
- If a future exercise uses accidentals, an unsupported range, mixed hands, `both` hand, simultaneous chord events, or multiple voices, the pitch-guide adapter reports the unsupported subset and the complete semantic text and normal practice flow remain available.
- A descending or step-and-skip exercise keeps canonical event order horizontally while its pitch markers move vertically by note number; presentation order never sorts or rewrites evaluator order.
- In C-E-G-E-C, accepting the first C leaves the physical C key `remaining` because the final C is still pending. When the final C becomes next it is `expected`; the first C staff marker remains accepted throughout.
- D and F remain `idle` in the C-major ordered chord-tone studies, while E and G remain `idle` in the D-minor chord-tone studies. Playing an idle pitch follows the ordinary wrong-note path and does not change event progress or promote the key into the phrase. The D-minor five-note ascents instead use all five D-through-A controls as expected pitches.
- The repeated-note studies render C-D-E once each beneath five occurrence-based staff markers. After the first C or D is accepted, its one physical key remains `expected` for the adjacent second occurrence; only after that second occurrence does the key become accepted and the next pitch become expected.
- The mixed-pattern studies render C-D-E-F-G once each beneath eight occurrence-based staff markers. The adjacent D occurrences and later E and C returns retain separate progress, while the shared physical key derives its aggregate state from all pending occurrences.
- The steady broken-chord studies render C-D-E-F-G once each beneath eight occurrence-based staff markers. The returning C, E, and G occurrences retain separate progress, while the shared physical key derives its aggregate state from all pending occurrences.
- The 3/4 broken-chord studies render C-D-E-F-G once each beneath seven occurrence-based staff markers. Returning C, E, and G occurrences retain separate progress, while the three visible beat indicators and audible pulse wrap independently follow canonical timing metadata rather than marker count or spacing.
- The 5/4 pulse studies render C-D-E-F-G once each beneath six occurrence-based staff markers. The returning C occurrences retain separate progress, while the five visible beat indicators and audible pulse wrap independently follow canonical timing metadata rather than marker count or spacing.
- If staff projection is unsupported or client enhancement is unavailable, the page remains guided and no reading-focus control is offered. Toggling a supported page at any session state changes presentation only; restart preserves that page-local choice, while exercise navigation and reload discard it.
- In reading focus, a correct event may report correctness and timing without naming either the played or next pitch. Wrong, repeated, and out-of-order feedback may name actual and expected pitches without moving progress or the timing anchor.

### Anti-Patterns

- Do not require JavaScript merely to read the exercise instructions.
- Do not require JavaScript to choose or link directly to an exercise.
- Do not make reading focus the server, saved, URL-selected, inferred, or unsupported-guide default.
- Do not remove accessible pitch and state meaning, keyboard focus or pressed indication, staff progress, rhythm guidance, or explicit correction to make reading focus more restrictive.
- Do not store reading-focus state or use it to alter exercise identity, evaluator results, attempt records, history, curriculum evidence, or recommendations.
- Do not derive exercise notes or identity by scraping the rendered keyboard.
- Do not equate physical-key identity with expected-event identity, duplicate a piano key for a repeated occurrence, or deduplicate canonical event progress to match the keyboard.
- Do not derive exercise notes or identity by scraping the staff guide, or treat rendered coordinates as canonical notation data.
- Do not silently fall back to the default when a supplied exercise ID is invalid.
- Do not allow views to classify MIDI events or advance evaluation independently.
- Do not continue an interrupted attempt across a device disconnect when input may have been lost.
- Do not compare Web Audio schedule or callback times with normalized MIDI timestamps.
- Do not change tempo adaptively or move the evaluation anchor to excuse an error or accumulated drift.
- Do not persist a restart, disconnect, or abandoned attempt as a successful completion.
- Do not block practice because local history storage failed.
- Do not describe recent saved-attempt evidence as complete history, a percentage, score, grade, streak, trend, improvement, consistency, mastery, diagnosis, or recommendation rationale.
- Do not turn recommendation into an unlock, lock, required next step, mastery claim, or replacement for the complete chooser.
- Do not choose the next study from rendered card position, a circular “next” link, storage iteration order, error totals, timing quality, tempo, or velocity.
- Do not add cloud storage, identity, telemetry, streak pressure, punitive scoring, or celebratory game mechanics to this slice.
- Do not imply that the app replaces a teacher or diagnoses posture, tension, fingering, or strength.
- Do not infer written duration, beat placement, articulation, dynamics, or staff-reading mastery from the pitch-only guide or its marker spacing.
- Do not infer held duration, rests, notation, or simultaneity from fractional onset offsets or the `Eighth-note grid` label.
- Do not describe ordered C-E-G-E-C completion as simultaneous chord playing, voicing, harmony recognition, or blocked-chord evidence.
- Do not describe D-E-F-G-A completion as a complete D-minor scale or proof of half-step recognition, fingering, evenness, hand use, or technique.
- Do not promote mixed-pattern completion beyond its ordered-pitch and onset evidence into duration, release, articulation, fingering, hand, relaxation, reading, or consistency claims.
- Do not promote steady broken-chord completion beyond eight ordered pitches and seven MIDI-relative onset gaps into audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, hand, relaxation, harmony recognition, staff reading, consistency, or mastery claims.
- Do not promote 3/4 broken-chord completion beyond seven ordered pitches and six MIDI-relative whole-beat gaps into audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, hand, harmony recognition, staff reading, consistency, or mastery claims.
- Do not promote 5/4 pulse completion beyond six ordered pitches and five MIDI-relative whole-beat gaps into audible meter, count-in, phase, downbeat, click or measure alignment, pulse, 5/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, hand, relaxation, keyboard geography, five-finger technique, staff reading, consistency, or mastery claims.
- Do not branch practice-session or evaluator behavior on CoreMIDI packet details, native source identity, or WKWebView messages.
- Do not store native attempts under a web or mock adapter kind.
- Do not let input configuration, exercise browsing, history, or decorative progress treatment compete with the current note and keyboard as the primary practice task.

## Contract

### Definition of Done

- [ ] `/practice` returns the canonical default, and `?exercise=<id>` selects each of the thirty-three validated exercises without requiring client JavaScript.
- [ ] Unknown, empty, and duplicated supplied exercise parameters return `404`.
- [ ] The server-rendered chooser identifies the selected exercise and links to every library entry.
- [ ] Every current exercise server-renders the supported treble or bass pitch guide and adjacent semantic note text from its canonical expected events.
- [ ] Enhancement exposes input choice and state, accepted/next/remaining pitch-guide state, a natural-note-span keyboard with pitch-based aggregate state, next expected note, calm feedback, restart, and completion.
- [ ] A supported enhanced guide offers a learner-controlled reading-focus presentation that hides the documented visual answers, preserves semantic equivalents and interaction state, and leaves unsupported or no-JavaScript pages guided.
- [ ] Reading focus may change mid-attempt, survives restart in-page, resets on navigation or reload, and is never persisted or added to canonical or attempt data.
- [ ] Correct reading-focus feedback does not reveal the current or next pitch; explicit error feedback may provide actual and expected pitches as correction.
- [ ] The C-major chord-tone pair retains five event and staff occurrences while reusing C and E keyboard controls over C-G; the D-minor chord-tone pair does the same for D and F over D-A while keeping E and G idle and preserving the evaluator's normal wrong-note path. The D-minor five-note ascent pair renders five distinct event, staff, and physical-key positions over D-A with no idle span pitches.
- [ ] The repeated-note pair retains five event and staff occurrences while reusing one C, D, and E keyboard control; the shared key stays expected between adjacent equal-pitch events.
- [ ] The mixed-pattern pair retains eight event and staff occurrences while reusing five C-G keyboard controls and assesses seven half-beat-grid intervals without inferring duration, release, articulation, fingering, hand, relaxation, reading, or consistency.
- [ ] The offbeat pair retains five event and staff occurrences over five C-G keyboard controls, presents the complete count through the task or heading instructions in Guided mode, guarantees the pitch-free task in Reading Focus, and assesses four MIDI-relative intervals without claiming audible phase, rest, silence, duration, release, holding, accent, articulation, velocity-quality, syncopation, fingering, hand, reading, relaxation, consistency, or mastery evidence.
- [ ] The steady broken-chord pair retains eight event and staff occurrences over five C-G keyboard controls, uses `Steady pulse` and `Pitch order · One note per beat`, guarantees the full pitch-free eight-position task in Reading Focus, and assesses seven MIDI-relative intervals without claiming audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, hand, relaxation, harmony recognition, staff reading, consistency, or mastery evidence.
- [ ] The 3/4 broken-chord pair retains seven event and staff occurrences over five C-G keyboard controls, uses `Steady pulse`, `Pitch order · One note per beat`, a three-beat count-in, three visible beat indicators, and complete pitch-free `1 2 3, 1 2 3, 1` guidance, and assesses six MIDI-relative intervals without claiming audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, hand, harmony recognition, staff reading, consistency, or mastery evidence.
- [ ] The 5/4 pulse pair retains six event and staff occurrences over five C-G keyboard controls, uses `Steady pulse`, `Pitch order · One note per beat`, a five-beat count-in, five visible beat indicators, and the exact pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.`, and assesses five MIDI-relative whole-beat intervals without claiming audible meter, count-in, phase, downbeat, click or measure alignment, pulse, 5/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, hand, relaxation, keyboard geography, five-finger technique, staff reading, consistency, or mastery evidence.
- [ ] The active practice stage remains the dominant surface at desktop and iPad sizes, with secondary panels following it in semantic and narrow-screen order.
- [ ] The complete session works through deterministic mock input, through Web MIDI on supported desktop browsers, and through `NativeMidiInputPort` in the trusted iPad wrapper.
- [ ] Each of the eighteen timed studies offers 40–100 BPM with 60 BPM default and quarter-note click guidance. Fourteen use a four-beat 4/4 count-in, the 3/4 pair uses three count-in beats and three-beat pulse wrap, and the 5/4 pair uses five count-in beats and five-beat pulse wrap. The ten five-event timed studies produce four MIDI-interval timing assessments, the two six-event studies produce five, the two seven-event studies produce six, and the mixed-pattern and steady broken-chord pairs produce seven. Ten steady-quarter studies use integer positions and ±0.2-beat tolerance; six regular eighth-grid studies and two offbeat studies use fractional positions and ±0.1-beat tolerance.
- [ ] Web Audio remains guidance-only and cannot alter pitch or timing evaluation.
- [ ] Restart after an incomplete attempt produces clean progress without a false history record.
- [ ] Disconnect during an attempt interrupts it and requires a clean restart.
- [ ] One completed-attempt record is stored locally and appears in the history summary.
- [ ] Timed completion stores one internally consistent optional timing summary while untimed and older records remain valid without it.
- [ ] Empty and unavailable history states are handled explicitly.
- [ ] Readable non-empty history shows factual pitch evidence over at most the five newest retained exact-revision completions and categorical timing evidence where saved, without averaging tempo or mean absolute error.
- [ ] Completion shows one deterministic, explained advisory suggestion from exact-current-revision retained history plus the current in-memory completion, or an exercise-library fallback when recommendation is unavailable.
- [ ] Recommendation does not restrict exercise choice or use pitch-error and timing-quality fields in this version.
- [ ] The spec is updated in the same change set when session or persistence behavior changes.
- [ ] Unit and Playwright tests cover critical lifecycle behavior.
- [ ] Native completions are persisted with the `native-midi` adapter kind through the existing repository.
- [ ] Closing, disconnecting, or replacing the selected native source interrupts an active attempt by the same rule as browser input loss.

### Regression Guardrails

- Server-rendered instructions must remain present in the response body before enhancement.
- The complete supported pitch guide and its semantic text fallback must remain present before enhancement.
- Guided presentation must remain the server default. Reading-focus availability must follow supported-guide validation, and its visual suppression must retain accessible equivalents, staff progress, keyboard focus and pressed state, progress count, and rhythm guidance.
- Presentation state must not change normalized-input evaluation, session progress, timing anchor, completion, persistence, history, recommendation, or curriculum evidence; restart preserves it only within the page and a document boundary resets it.
- Before enhancement, the history shell must state that JavaScript is required rather than claim there are zero completed attempts.
- Only normalized note-on events may start or advance an attempt.
- Only accepted correct notes may establish or contribute to timed interval evaluation; pitch errors must not move the timing anchor.
- The highlighted next note must always correspond to evaluator state from the canonical exercise.
- Pitch-guide marker order and live state must use canonical event order and IDs; a renderer must not create its own exercise identity or progress logic.
- Physical keys must be sorted by MIDI pitch across the inclusive natural-note span, use one control per pitch, preserve `expected` over `remaining` over `accepted`, leave non-phrase span pitches `idle`, and keep pressed state independent.
- The selected exercise ID in the URL, server-rendered content, client evaluator, and persisted attempt must agree.
- No completion may claim that the declared hand or fingering was verified.
- No completion may claim staff-reading or sight-reading evidence merely because the pitch guide was visible.
- Timed completion may additionally represent MIDI onset timing against declared integer or fractional beat offsets, but never audible phase, downbeat, between-click, or measure alignment, rests, silence, duration, release, holding, legato, accents, articulation, dynamics or velocity quality, syncopation, harmony recognition, notation, simultaneity, adaptive tempo, mastery, or physical technique.
- Count-in copy, visible beat indicators, running-beat wrap, meter labels, and click accents must derive from the selected exercise's canonical timing metadata. Valid 3/4 and 5/4 selections must never retain a four-beat UI assumption, and those guidance facts must never enter evaluation evidence.
- Restart must clear transient evaluation state while preserving completed history.
- Device disconnect must make completion impossible for the interrupted attempt.
- A completed attempt must be persisted at most once.
- Storage failure must not convert a completed performance into a failed musical attempt.
- Recommendation failure must not hide, disable, or reorder the complete exercise chooser, and recommendation must not change evaluator or completion results.
- Only exact-current-revision retained completions and the current unsaved completion may satisfy recommendation prerequisites; bounded eviction and reload after a failed save remove unavailable evidence without punitive language.
- History must remain local to the browser and scoped by exercise ID and revision unless a later accepted architecture decision changes that contract.
- Recent evidence must exclude retained matches older than the newest five, keep compatible timing-free records in pitch totals, and remain presentation-only rather than changing evaluation, curriculum, or recommendation behavior.
- Mock, Web MIDI, and native MIDI input must share the same session and evaluation path.
- The presence or absence of a WKWebView bridge must not change exercise identity, evaluator results, or browser-only availability.
- Swift must never persist an attempt or claim practice completion directly.
- Responsive CSS must preserve the same canonical exercise, live-region meaning, control labels, and focus sequence at every supported viewport.
- Responsive CSS must keep the pitch guide inside the practice stage without page-level horizontal overflow and retain the ordered note text fallback.
- Audio guidance and MIDI evaluation must remain separate clock domains across mock, Web MIDI, and native input.

### Verification

- **Unit tests:** Session state transitions, note-off filtering, restart invalidation, disconnect interruption, completion idempotence, tempo boundaries, timing-derived three-, four-, and five-beat count-in scheduling and visual indicators, quarter-click subdivision guidance, audio cleanup, fixed MIDI timing anchor, regular and offbeat four-interval plus 5/4-pulse five-interval plus 3/4-loop six-interval plus mixed-pattern and steady-broken-chord seven-interval timing-summary validation, rhythm-aware presentation labels, local-day summary, empty history, newest-five recent evidence, correction and timing category aggregation, corrupt-record isolation, persistence failure, pitch-guide state projection, repeated-occurrence physical-key aggregation, reading-focus availability/lifetime/feedback projection, optimistic post-completion recommendation, retained-history refresh, and unavailable recommendation fallback.
- **Integration tests:** Exercise-library selection, supported staff rendering, canonical timed and untimed exercises, evaluator, audio guidance, mock port, and attempt repository cooperate without DOM-derived data, notation-derived identity, or cross-clock comparison; unknown IDs fail closed.
- **Native adapter tests:** Validated native replies, state changes, and normalized events drive the same controller; malformed payloads, stale callbacks, disconnect, and disposal cannot advance or complete an attempt.
- **Browser tests:** Playwright opens the default, a left-hand untimed exercise, ordered chord-tone and D-minor five-note exercises, a timed step-and-skip exercise, an ascending even-eighth exercise, a repeated-note exercise, a mixed-pattern exercise, an offbeat study, a steady broken-chord study, a 3/4 broken-chord loop, and a 5/4 pulse study; verifies server-rendered pitch guides, rhythm-aware labels, ordered text, timing-derived beat indicators, physical-key projection, instructions, and chooser behavior; toggles reading focus on a supported guide and verifies visual suppression, retained pitch-free offbeat count, steady broken-chord one-note-per-beat guidance, 3/4 grouped count, exact 5/4 task, accessible equivalents, mid-attempt state, restart lifetime, reload reset, and feedback disclosure; selects mock input; observes matching occurrence-based staff and aggregate keyboard progress, including shared keys across adjacent and returning occurrences; changes tempo; starts the count-in; plays canonical timestamped fixtures; observes pitch and onset-timing feedback; completes; sees factual recent pitch and timing evidence plus the explained direct-dependent suggestion while the full chooser remains available; reloads; and sees only successfully retained exact-revision history.
- **Coverage target:** Every session transition and persistence failure branch remains exercised; snapshots alone are insufficient evidence.

### Scenarios

**Scenario: Instructions survive without JavaScript**

- Given: client scripting is disabled or fails to load
- When: the learner opens `/practice`
- Then: the default C-D-E-F-G right-hand instructions, expected notes, and thirty-three-exercise chooser remain visible, and history says JavaScript is required instead of claiming the history is empty

**Scenario: Select another exercise without JavaScript**

- Given: client scripting is disabled
- When: the learner opens `/practice?exercise=five-note-ascent-c-major-left-hand`
- Then: the left-hand C3-D3-E3-F3-G3 exercise is selected and fully readable with a bass pitch guide, ordered note text, and links to the other twenty-nine exercises

**Scenario: Read right-hand staff positions without JavaScript**

- Given: client scripting is disabled
- When: the learner opens the default right-hand exercise
- Then: the server response contains a treble pitch guide for C4-D4-E4-F4-G4, the middle-C ledger line, and the same sequence in semantic text

**Scenario: Project evaluator progress onto the staff**

- Given: C4 is next in an enhanced right-hand exercise
- When: the shared evaluator accepts C4
- Then: the C4 marker becomes accepted and the marker matching the evaluator's next canonical event becomes next, consistently with the textual and keyboard cues

**Scenario: Reduce visible answers without changing practice**

- Given: client enhancement validates the selected exercise's supported staff guide
- When: the learner turns on reading focus during an attempt
- Then: selected instructions and sequence, next pitch, visible pitch labels, and amber expected-key answer are suppressed while evaluator progress, staff state, keyboard focus and pressed state, rhythm guidance, accessible semantics, and attempt identity remain unchanged

**Scenario: Keep reading focus transient**

- Given: reading focus is active
- When: the learner restarts, then later reloads or chooses another exercise
- Then: restart keeps reading focus in that page instance, while reload or navigation returns the new server-rendered document to guided presentation without reading-focus storage

**Scenario: Reuse physical keys for ordered chord tones**

- Given: `ordered-chord-tones-c-major-right-hand` expects C4-E4-G4-E4-C4 and its keyboard shows C4-D4-E4-F4-G4 once each
- When: the first C4 is accepted and E4 becomes next
- Then: the first C4 staff marker remains accepted, the physical C4 key is `remaining` for its final occurrence, E4 is `expected`, D4 and F4 stay `idle`, and pressing either idle key follows the normal wrong-note path

**Scenario: Practice the D-minor transfer through A**

- Given: `ordered-chord-tones-d-minor-right-hand` expects D4-F4-A4-F4-D4 and its keyboard shows D4-E4-F4-G4-A4 once each
- When: the learner completes the sequence with Reading Focus available
- Then: five staff occurrences advance over reused D and F controls, E and G stay correction inputs, the attempt stores no timing, and completion proves neither blocked-chord performance nor minor-quality recognition

**Scenario: Activate all five keys in D position**

- Given: `five-note-ascent-d-minor-right-hand` expects D4-E4-F4-G4-A4 and its keyboard shows those five pitches once each
- When: the learner completes the sequence without prerequisite history
- Then: all five staff markers and physical keys advance, the untimed attempt persists without timing, and completion proves neither a complete D-minor scale nor half-step recognition, fingering, hand use, evenness, or technique

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

**Scenario: Recent saved attempts remain factual**

- Given: six retained completions match the selected exercise revision and include pitch or order corrections, mixed tempos, and one compatible timing-free record
- When: the history summary loads
- Then: the five newest records contribute correction-free and categorical correction totals, the timing row identifies how many records contribute on-time, early, and late interval totals, and the page claims no score, trend, improvement, consistency, mastery, or recommendation effect

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

**Scenario: Combine learned pitch and onset patterns**

- Given: the learner selected `mixed-eighth-pattern-c-major-right-hand`, completed its repeated-note and ordered chord-tone prerequisites, connected an input, and left tempo at 60 BPM
- When: they play C4-E4-D4-D4-F4-G4-E4-C4 at offsets 0, 0.5, 1, 1.5, 2, 2.5, 3, and 3.5
- Then: eight staff occurrences advance across five physical keys, seven intervals are assessed with the ±0.1-beat window, and completion claims no duration, release, articulation, fingering, declared-hand use, relaxation, reading, or consistency evidence

**Scenario: Sustain a steady broken-chord pattern across two groups**

- Given: the learner selected `steady-quarter-broken-chord-c-major-right-hand`, completed its matching ordered chord-tone and straight steady-quarter prerequisites, connected an input, and left tempo at 60 BPM
- When: they play C4-E4-G4-E4-C4-E4-G4-E4 at offsets 0–7
- Then: the card says `Steady pulse`, the pitch-only staff says `Pitch order · One note per beat`, eight staff occurrences advance across five physical C-G keys, seven intervals are assessed with the ±0.2-beat window, and completion claims no audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, hand, relaxation, harmony recognition, staff reading, consistency, or mastery evidence

**Scenario: Practice a familiar broken chord in 3/4**

- Given: the learner selected `three-four-broken-chord-c-major-right-hand`, completed its matching steady broken-chord prerequisite, connected an input, and left tempo at 60 BPM
- When: they start the three-beat count-in and play C4-E4-G4-C4-E4-G4-C4 at offsets 0–6
- Then: the page shows 3/4, exactly three beat indicators, `Steady pulse`, `Pitch order · One note per beat`, and the pitch-free `1 2 3, 1 2 3, 1` task; seven staff occurrences advance across five physical C-G keys; six intervals are assessed with the ±0.2-beat window; and completion claims no audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, fingering, hand, harmony recognition, reading, consistency, or mastery evidence

**Scenario: Extend the pulse into 5/4**

- Given: the learner selected `five-four-pulse-c-major-right-hand`, completed its matching 3/4 broken-chord prerequisite, connected an input, and left tempo at 60 BPM
- When: they start the five-beat count-in and play C4-D4-E4-F4-G4-C4 at offsets 0–5
- Then: the page shows 5/4, exactly five beat indicators, `Steady pulse`, `Pitch order · One note per beat`, and the exact pitch-free task `After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.`; six staff occurrences advance across five physical C-G keys; five intervals are assessed with the ±0.2-beat window; and completion claims only six ordered pitches and five MIDI-relative whole-beat gaps, with no audible meter, count-in, phase, downbeat, click or measure alignment, pulse, 5/4 counting or grouping, learner accent or dynamics, duration, release, legato, rests, fingering, hand, relaxation, keyboard geography, five-finger technique, reading, consistency, or mastery evidence

**Scenario: Practice the offbeat grid without revealing pitches**

- Given: the learner selected `offbeat-step-skip-c-major-right-hand`, connected an input, and enabled Reading Focus
- When: they play C4-E4-D4-F4-G4 at offsets 0, 0.5, 1.5, 2.5, and 3.5
- Then: the card says `Offbeat grid`, the pitch-only staff says `Pitch order · Downbeat then offbeat onsets`, the full pitch-free `1 & 2 & 3 & 4 &` task remains visible, five staff events advance, and four MIDI-relative intervals are assessed without proving audible downbeat or between-click alignment, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, hand use, reading, relaxation, consistency, or mastery

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
