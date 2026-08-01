# Feature: Study Recommendation

## Blueprint

### Context

The learner has twenty-eight short exercises—fourteen per hand, ten untimed, and eighteen timed—across pitch, pattern, ordered chord-tone, minor chord vocabulary, steady broken-chord, 3/4 broken-chord loop, 5/4 pulse, repeated-note, mixed-pattern, offbeat-onset, hand, steady-pulse, and onset-subdivision work. The timed set contains fourteen 4/4 studies, two 3/4 studies, and two 5/4 studies; ten use the integer steady-pulse grid. The exercise library already declares prerequisites, and completed attempts already carry stable exercise IDs and revisions in local history. The practice completion flow and home overview should use that evidence to suggest one understandable next study instead of advancing by a circular UI position, while preserving the learner's freedom to choose any exercise.

A recommendation is practice guidance, not an evaluator result, unlock, grade, or mastery claim. The first implementation therefore uses only completion identity and recency. Pitch-error counts, timing classifications, tempo, velocity, and inferred physical technique do not affect this version.

### Current Scope

- The browser computes one deterministic, explainable recommendation from the validated canonical exercise library, retained local completed attempts, and the just-completed exercise identity and in-memory attempt when completion has occurred.
- The home overview uses the same policy with `justCompletedExerciseId` set to `null`, so it reflects retained browser evidence only and never treats an unsaved completion from another page as durable.
- Completion evidence matches the current canonical `(exerciseId, exerciseRevision)` pair exactly. A completion for an older or unknown revision does not satisfy a current prerequisite.
- The recommendation graph uses each canonical exercise's declared prerequisite IDs. Missing prerequisite references and prerequisite cycles make recommendation unavailable without blocking practice.
- After completion, the service prefers an eligible, uncompleted direct dependent of the just-completed exercise, then the first eligible, uncompleted exercise in canonical library order.
- Each timed step-and-skip study is eligible only after both its matching untimed step-and-skip study and its matching straight steady-quarter study have exact-current-revision completion evidence.
- Each even-eighth study is eligible after its matching straight steady-quarter study has exact-current-revision completion evidence; it does not require the matching untimed step-and-skip study.
- Each C-major ordered chord-tone study is eligible after its matching untimed step-and-skip study has exact-current-revision completion evidence; that matching study is its sole prerequisite.
- Each D-minor ordered chord-tone study is eligible after its matching-hand C-major ordered chord-tone study has exact-current-revision completion evidence; that matching study is its sole prerequisite. The D-minor pair follows the C-major pair in canonical order, so the matching transfer wins direct-dependent priority before later timed C-major elaboration when both are eligible.
- Each repeated-note study is eligible after its matching ascending even-eighth study has exact-current-revision completion evidence; that matching study is its sole prerequisite.
- Each mixed-pattern study is eligible only after both its matching repeated-note and ordered chord-tone studies have exact-current-revision completion evidence.
- Each offbeat study is eligible after its matching mixed-pattern study has exact-current-revision completion evidence; that matching study is its sole prerequisite.
- `steady-quarter-broken-chord-c-major-right-hand` and `steady-quarter-broken-chord-c-major-left-hand` are each eligible only after both matching foundations have exact-current-revision completion evidence. Their canonical prerequisite order is the matching ordered chord-tone study first and matching straight steady-quarter study second.
- A steady broken-chord completion contributes recommendation identity and recency only. The exercise evaluator may retain its eight ordered pitches and seven MIDI-relative gaps, but recommendation does not infer audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, declared-hand use, relaxation, harmony recognition, staff reading, consistency, or mastery from them.
- `three-four-broken-chord-c-major-right-hand` and `three-four-broken-chord-c-major-left-hand` are each eligible after their matching steady broken-chord study has exact-current-revision completion evidence; that matching study is the sole prerequisite.
- A 3/4 broken-chord completion contributes recommendation identity and recency only. The evaluator may retain its seven ordered pitches and six MIDI-relative whole-beat gaps, but recommendation does not infer audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, learner accent or dynamics, duration, fingering, declared-hand use, harmony recognition, staff reading, consistency, or mastery from them.
- `five-four-pulse-c-major-right-hand` and `five-four-pulse-c-major-left-hand` are each eligible after their matching-hand 3/4 broken-chord study has exact-current-revision completion evidence; that matching study is the sole prerequisite, opposite-hand evidence does not satisfy it, and both 5/4 studies remain freely selectable without it. Each uses C-D-E-F-G-C at offsets 0–5 and carries, in order, `rhythm-and-coordination.five-four-meter`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, `notes-and-reading.keyboard-geography`, and `patterns-and-technique.five-finger-patterns`.
- A 5/4 pulse completion contributes recommendation identity and recency only. The evaluator may retain its six ordered pitches and five MIDI-relative whole-beat gaps, but recommendation does not infer 5/4 understanding, counting or grouping, audible phase, downbeat, click or measure alignment, learner accent or dynamics, duration, release, articulation, fingering, declared-hand use, staff reading, physical technique, consistency, or mastery from them. The canonical meter, five-beat count-in, five visible pulse positions, audio wrap, and instruction remain guidance rather than recommendation evidence.
- When every current exercise has exact-revision completion evidence, the service recommends the least recently practiced exercise. Equal recency is resolved by canonical library order.
- When readable history contains no current-revision completions, the service recommends the first prerequisite-free exercise in canonical library order.
- The practice completion view and enhanced home overview explain why the study was suggested and always keep the complete exercise library available as the fallback and override.
- The service uses no network, remote model, account, cloud state, randomness, percentage score, streak, or hidden learner profile.

### Future Scope

- Later recommendation versions may consider learner-selected goals, recent difficulty, tempo progression, repeated attempts, track balance, or richer curriculum nodes only after their evidence and explanation contracts are explicit.
- Error-sensitive or timing-sensitive suggestions require a separate decision; this version treats every completed attempt equally regardless of corrections, early/late intervals, or mean timing error.
- Cloud synchronization, cross-device history, teacher-authored plans, AI coaching, and mandatory course progression are not implied.

### Architecture

- **Canonical inputs:** Recommendation consumes the ordered validated `exerciseLibrary` plus typed completed-attempt summaries. It returns a canonical exercise identity and structured reason; it neither creates exercises nor reads titles, DOM order, rendered links, MIDI events, or SVG state as source data.
- **Exact-revision evidence:** A prerequisite is satisfied only when a retained attempt or the current page's just-completed attempt matches the prerequisite exercise's current revision. Evidence from old revisions remains valid history but is not current recommendation evidence.
- **Graph validation:** Before choosing a study, recommendation verifies that every prerequisite ID resolves inside the supplied library and that the prerequisite graph is acyclic. Invalid graph data produces an unavailable result with no partial or guessed traversal.
- **Direct-dependent rule:** If the just-completed exercise has current exact-revision completion evidence, first consider uncompleted exercises that name it directly as a prerequisite and whose complete prerequisite sets are satisfied. Choose the first such exercise in canonical library order.
- **Eligible-uncompleted rule:** If no direct dependent qualifies, choose the first uncompleted exercise in canonical library order whose complete prerequisite set is satisfied. A prerequisite-free exercise is eligible by definition.
- **Empty-history rule:** If readable local history contributes no exact-current-revision evidence and no just-completed attempt is present, choose the first prerequisite-free exercise in canonical library order.
- **Review rule:** If every current exercise has exact-revision evidence, compare each exercise's most recent matching `completedAt` value and choose the least recently practiced. Canonical library order breaks timestamp ties.
- **Evidence-retention rule:** Recommendation sees only valid attempts still retained by the local repository, plus the current in-memory completion while the page remains open. The repository may evict old attempts at its bounded retention limit; an evicted completion no longer counts and can make an earlier study a useful review suggestion.
- **Optimistic completion rule:** Immediately after musical completion, the controller may calculate from the just-completed in-memory record before persistence finishes. After a successful save, it refreshes retained history and recalculates. If saving fails, the in-session suggestion may still reflect that transient completion, but it must not be described as durable and a later reload falls back to whatever history can actually be read.
- **Failure rule:** An initial history read failure, malformed recommendation graph, or inability to produce a canonical candidate yields an unavailable recommendation. Completion remains complete, history reports its own failure, and the exercise library remains usable.
- **Explanation rule:** Every available recommendation exposes a short deterministic reason matching the branch that selected it: direct next step, eligible next step, beginner starting point, or least-recently-practiced review. Copy must not use “mastered,” “unlocked,” “passed,” or equivalent claims.
- **Evaluation separation:** Recommendation never mutates evaluator state, pulse behavior, attempt facts, exercise prerequisites, or persisted records. Error counts and optional timing summaries remain visible evidence but are deliberately ignored by this first recommender.

### Accessibility and Progressive Enhancement

- Server-rendered instructions, exercise links, note text, and the selected study remain usable without recommendation enhancement.
- Before local history loads, recommendation detail remains absent rather than showing a fabricated choice; the server-rendered home overview keeps only its no-JavaScript explanation visible.
- The suggested exercise name, reason, and action are available as text, not colour or card position alone.
- Recommendation updates after completion use calm status semantics and do not repeatedly interrupt the learner.
- Every exercise link remains keyboard-accessible regardless of eligibility or recommendation state.

### Edge Cases

- Attempts for an exercise ID that no longer exists are ignored for current recommendation but remain untouched in storage.
- An attempt for the right ID and an older revision does not complete a current prerequisite or remove that exercise from the uncompleted set.
- Multiple attempts for one current revision contribute one completion fact; the newest matching `completedAt` value supplies its review recency.
- Equal completion timestamps use canonical library order, never storage iteration order, DOM order, or randomness.
- If retained history was evicted, cleared, or belongs only to old revisions, the result may return to a prerequisite-free starting study without describing the learner as having regressed.
- A save failure after completion may leave an optimistic suggestion visible for the current page while history is unavailable. Reloading cannot recover that unsaved evidence.
- A learner may open or repeat an exercise whose prerequisites lack history evidence; selection is never blocked and does not fabricate prerequisite completion.
- A valid finite acyclic prerequisite graph always has at least one prerequisite-free exercise. If the supplied graph cannot yield one, recommendation fails neutral.

### Anti-Patterns

- Do not use one completion to claim mastery, readiness, hand correctness, staff reading, rhythm consistency, duration, release, articulation, fingering, relaxation, or physical technique.
- Do not lock, hide, disable, assign ranks to, or punish learner-selected exercises based on recommendation state.
- Do not use pitch-error totals, early/late counts, mean timing error, tempo, velocity, or duration as recommendation thresholds in this version.
- Do not derive prerequisites or candidate order from rendered exercise cards, DOM positions, titles, or persisted storage order.
- Do not silently ignore missing prerequisite references or cycles and continue with a partial graph.
- Do not call a remote, generative, or nondeterministic service to choose or explain the recommendation.
- Do not convert local-history loss or bounded eviction into negative feedback, a reset warning, or a streak consequence.

## Contract

### Definition of Done

- [ ] The current recommendation library contains twenty-eight exercises—fourteen per hand, ten untimed, and eighteen timed—with the timed set distributed as fourteen in 4/4, two in 3/4, and two in 5/4; ten timed studies use the integer steady-pulse grid.
- [ ] The current canonical library produces one deterministic recommendation from the same exact-revision history input.
- [ ] Every prerequisite reference resolves and every cycle is rejected before recommendation.
- [ ] Eligible uncompleted direct dependents are preferred, followed by eligible uncompleted exercises in canonical library order.
- [ ] Each D-minor ordered chord-tone candidate requires exact-current-revision evidence only for its matching-hand C-major ordered chord-tone prerequisite, rejects opposite-hand evidence, remains freely selectable without it, and retains canonical priority over later eligible timed C-major dependents.
- [ ] Each mixed-pattern candidate requires exact-current-revision evidence for both its matching repeated-note and ordered chord-tone prerequisites; neither prerequisite alone makes it eligible.
- [ ] Each offbeat candidate requires exact-current-revision evidence only for its matching mixed-pattern prerequisite and remains freely selectable without it.
- [ ] Each steady broken-chord candidate declares its matching ordered chord-tone prerequisite before its matching straight steady-quarter prerequisite and requires exact-current-revision evidence for both; neither prerequisite alone makes it eligible, and the study remains freely selectable without them.
- [ ] Each 3/4 broken-chord candidate requires exact-current-revision evidence only for its matching steady broken-chord prerequisite and remains freely selectable without it.
- [ ] `five-four-pulse-c-major-right-hand` and `five-four-pulse-c-major-left-hand` each require exact-current-revision evidence only for the matching-hand 3/4 broken-chord prerequisite, reject opposite-hand evidence, become eligible direct dependents when that one prerequisite completes, and remain freely selectable without it.
- [ ] Empty readable history selects the first prerequisite-free exercise.
- [ ] When every current exercise has matching completion evidence, the least recently practiced exercise is selected with canonical-order tie-breaking.
- [ ] A just-completed in-memory attempt may inform the immediate suggestion before save, and successful persistence refreshes the retained-history result.
- [ ] Initial history-read or graph failure preserves musical completion and exposes the unrestricted exercise library as a neutral fallback; save failure may preserve only the current page's transient suggestion.
- [ ] Each available result includes an accurate deterministic explanation without mastery or unlock language.
- [ ] Error counts, timing summaries, tempo, and velocity have no effect on the first recommendation version.
- [ ] Unit, controller, view, and browser tests cover rule precedence, failure, explanation, persistence timing, and learner override.

### Regression Guardrails

- Recommendation evidence must remain scoped to current canonical exercise revisions.
- Direct-dependent preference must not bypass any additional prerequisite on the candidate.
- A D-minor ordered chord-tone candidate becomes an eligible direct dependent only from its matching-hand C-major chord-tone completion; opposite-hand evidence must not satisfy it, and canonical order must preserve the intended transfer priority over later eligible C-major elaboration.
- A steady broken-chord candidate must not become an eligible direct dependent until both its matching ordered chord-tone and straight steady-quarter prerequisites are satisfied; their declaration order must remain stable.
- A 3/4 broken-chord candidate becomes an eligible direct dependent only from its matching steady broken-chord completion; the opposite-hand study or another timed completion must not satisfy it.
- A 5/4 pulse candidate becomes an eligible direct dependent only from its matching-hand 3/4 broken-chord completion; the opposite-hand 3/4 study or another timed completion must not satisfy it, and missing evidence must never hide or lock the candidate.
- Canonical library order is the only candidate and equal-recency tie-break; changing DOM presentation order must not change results.
- Recommendations must remain deterministic for identical library, history, just-completed exercise, and in-memory completion inputs.
- A recommendation must never modify evaluation, history records, curriculum metadata, or exercise availability.
- Current-session optimistic evidence must not be represented as persisted after a failed save.
- Missing or evicted history must not generate a mastery loss, penalty, or false assertion that an exercise was never practiced.
- The exercise chooser must remain complete and usable in loading, ready, unavailable, completed, and storage-failure states.
- Explanation copy must identify only facts the algorithm used.

### Verification

- **Graph tests:** Accept the current twenty-eight-exercise library and verify its fourteen-per-hand, ten-untimed, eighteen-timed, 14-in-4/4, 2-in-3/4, 2-in-5/4, and 10-steady-pulse distributions; reject missing prerequisite IDs, self-cycles, and multi-node cycles without returning a partial recommendation.
- **Rule tests:** Cover direct dependent, an unmet additional prerequisite, C-major ordered chord-tone eligibility from its sole step-and-skip prerequisite, same-hand D-minor eligibility from its sole C-major chord-tone prerequisite, opposite-hand rejection and deliberate direct-dependent priority for the D-minor transfer, repeated-note eligibility from its sole ascending even-eighth prerequisite, mixed-pattern eligibility only after both matching prerequisites, offbeat eligibility from its sole matching mixed-pattern prerequisite, steady broken-chord eligibility only after both matching prerequisites in canonical declaration order, steady broken-chord direct-dependent selection after the second prerequisite is completed, 3/4 broken-chord eligibility and direct-dependent selection from its sole matching steady broken-chord prerequisite, 5/4 eligibility and direct-dependent selection from its sole matching-hand 3/4 prerequisite, eligible non-dependent fallback, canonical-order tie-break, empty history, all-completed review, and equal recency.
- **Evidence tests:** Cover current versus old revision, duplicate completions, unknown exercise history, bounded-history disappearance, and a just-completed transient record.
- **Exclusion tests:** Changing error counts, timing classifications, tempo, and input kind on otherwise equivalent completed records does not change the recommendation; steady, 3/4, or 5/4 pitch and timing evidence does not create phase, downbeat, click, meter understanding or counting, grouping, accent, measure, note-length, release, articulation, dynamics, physical-technique, harmony, reading, consistency, or mastery signals.
- **Controller tests:** Recommendation loads independently of practice, recalculates optimistically on completion, refreshes after save, and preserves the in-session suggestion while surfacing save failure honestly.
- **View tests:** Loading, available reasons, current-study review, unavailable fallback, and unrestricted chooser states render with calm accessible text.
- **Browser tests:** Completing the default with empty retained history suggests its first eligible direct dependent from the new in-memory completion; manual selection remains available; reload reflects only successfully retained evidence.

### Scenarios

**Scenario: Begin with no local history**

- Given: local history is readable and contains no attempt for any current exercise revision
- When: recommendation runs without a current in-memory completion
- Then: it suggests the first prerequisite-free exercise in canonical library order and explains that it is a gentle starting point

**Scenario: Prefer a direct dependent**

- Given: the just-completed right-hand ascent has exact-revision completion evidence and its right-hand descent is the first uncompleted direct dependent whose prerequisites are satisfied
- When: recommendation runs
- Then: it suggests the right-hand descent and explains that it builds directly on the completed study

**Scenario: Require every prerequisite**

- Given: a timed step-and-skip study names its matching untimed step-and-skip and straight steady-quarter studies as prerequisites
- When: only one of those prerequisites has exact-revision completion evidence
- Then: the timed step-and-skip candidate is skipped and the service selects the first other eligible uncompleted exercise

**Scenario: Suggest even eighths after the matching pulse foundation**

- Given: the matching straight steady-quarter study has exact-current-revision completion evidence and the even-eighth study is uncompleted
- When: recommendation considers `even-eighths-c-major-right-hand`
- Then: that study is eligible from its one declared prerequisite, remains freely selectable without it, and receives no readiness or mastery claim

**Scenario: Suggest ordered chord tones after matching step-and-skip work**

- Given: `step-skip-c-major-right-hand` has exact-current-revision completion evidence and `ordered-chord-tones-c-major-right-hand` is uncompleted
- When: recommendation considers the ordered chord-tone study
- Then: it is eligible from that sole declared prerequisite, remains freely selectable without it, and receives no chord-mastery or readiness claim

**Scenario: Transfer matching chord tones to D minor first**

- Given: `ordered-chord-tones-c-major-right-hand` has exact-current-revision completion evidence and both its D-minor transfer and a later timed C-major dependent would otherwise be eligible
- When: recommendation runs with the C-major chord-tone study as the just-completed exercise
- Then: it selects `ordered-chord-tones-d-minor-right-hand` as the first canonical direct dependent, rejects the left-hand C-major completion as its prerequisite, keeps every study freely selectable, and makes no minor-quality, harmony, readiness, or mastery claim

**Scenario: Suggest repeated notes after matching even-eighth work**

- Given: `even-eighths-c-major-right-hand` has exact-current-revision completion evidence and `repeated-note-eighths-c-major-right-hand` is uncompleted
- When: recommendation considers the repeated-note study
- Then: it is eligible from that sole declared prerequisite, remains freely selectable without it, and receives no technique-mastery or readiness claim

**Scenario: Require both foundations for the mixed pattern**

- Given: `mixed-eighth-pattern-c-major-right-hand` declares `repeated-note-eighths-c-major-right-hand` and `ordered-chord-tones-c-major-right-hand` as prerequisites
- When: recommendation runs with exact-current-revision completion evidence for only one of them
- Then: the mixed-pattern candidate is skipped; after both are present it becomes eligible, remains freely selectable either way, and receives no duration, release, articulation, fingering, hand, relaxation, reading, consistency, mastery, or readiness claim

**Scenario: Suggest offbeat onsets after the mixed pattern**

- Given: `mixed-eighth-pattern-c-major-right-hand` has exact-current-revision completion evidence and `offbeat-step-skip-c-major-right-hand` is uncompleted
- When: recommendation considers the offbeat study
- Then: it is eligible as a direct dependent from that sole prerequisite, remains freely selectable without it, and receives no audible-phase, timing-quality, syncopation, readiness, or mastery claim

**Scenario: Require both foundations for a steady broken chord**

- Given: `steady-quarter-broken-chord-c-major-right-hand` declares `ordered-chord-tones-c-major-right-hand` first and `steady-quarter-c-major-right-hand` second
- When: recommendation has exact-current-revision completion evidence for only one prerequisite
- Then: the broken-chord candidate is skipped; after both are present it becomes eligible, remains freely selectable either way, and receives no audible-phase, measure-alignment, duration, release, legato, rest, articulation, dynamics, velocity, fingering, hand-use, relaxation, harmony-recognition, staff-reading, consistency, readiness, or mastery claim

**Scenario: Suggest a steady broken chord after its second foundation**

- Given: the matching ordered chord-tone study already has exact-current-revision completion evidence, the learner just completed the matching straight steady-quarter study, and the steady broken-chord study is the first eligible uncompleted direct dependent in canonical library order
- When: recommendation runs with the just-completed in-memory record
- Then: it suggests the matching steady broken-chord study as a direct next step and explains that it builds on the completed study without claiming either foundation was mastered

**Scenario: Suggest a 3/4 broken chord after the matching steady study**

- Given: `steady-quarter-broken-chord-c-major-right-hand` has exact-current-revision completion evidence and `three-four-broken-chord-c-major-right-hand` is uncompleted
- When: recommendation considers the 3/4 broken-chord study
- Then: it is eligible as a direct dependent from that sole matching-hand prerequisite, remains freely selectable without it, and receives no audible-phase, downbeat, meter-grouping, accent, measure, duration, fingering, hand-use, harmony-recognition, staff-reading, consistency, readiness, or mastery claim

**Scenario: Suggest a 5/4 pulse study after matching 3/4 guidance**

- Given: `three-four-broken-chord-c-major-right-hand` has exact-current-revision completion evidence and `five-four-pulse-c-major-right-hand` is uncompleted
- When: recommendation considers the right-hand 5/4 pulse study
- Then: it is eligible as a direct dependent from that sole matching-hand prerequisite, remains freely selectable without it, rejects the left-hand 3/4 completion as prerequisite evidence, and receives no 5/4-understanding, counting, grouping, audible-phase, downbeat, click, measure-alignment, accent, dynamics, duration, release, articulation, fingering, hand-use, staff-reading, physical-technique, consistency, readiness, or mastery claim

**Scenario: Fall back to another eligible study**

- Given: no uncompleted direct dependent of the current exercise is eligible
- When: another uncompleted exercise has all prerequisites satisfied
- Then: the first such exercise in canonical library order is suggested with an eligible-next-step explanation

**Scenario: Review the least recent study**

- Given: every current exercise revision has at least one retained completion
- When: recommendation runs
- Then: it suggests the exercise whose newest matching completion is oldest, using canonical order only for equal timestamps

**Scenario: Ignore performance quality in version one**

- Given: two histories differ only in pitch-error counts, timing classifications, tempo, or input kind
- When: recommendation runs with otherwise identical completion identities and timestamps
- Then: both histories produce the same exercise and explanation

**Scenario: Use completion before persistence settles**

- Given: the learner completes the current exercise and its attempt has not finished saving
- When: the completion UI requests a recommendation
- Then: the in-memory exact-revision completion may select a direct dependent immediately, and successful save later refreshes the same rules from retained history

**Scenario: Fail to save the current completion**

- Given: the learner completes the exercise but local storage rejects the save
- When: the page already calculated an optimistic suggestion from that completion
- Then: musical completion and the advisory suggestion remain visible for the current session, history reports that it was not saved, and the full exercise library remains available; a reload makes no durability claim

**Scenario: Reject an invalid graph**

- Given: a prerequisite ID is missing or the graph contains a cycle
- When: recommendation initializes
- Then: it returns an unavailable result, leaves the exercise library available, and does not block practice or choose from a partial graph

**Scenario: Lose old evidence through bounded retention**

- Given: an old exact-revision completion has been evicted from local history
- When: recommendation runs
- Then: the exercise may be suggested again as an uncompleted or prerequisite review without saying the learner regressed or never practiced it
