# Feature: Immediate Repeat Guidance

## Blueprint

### Context

Completion feedback tells the learner what happened in the current attempt, but it does not turn a correction or an off-time interval into an obvious short next action. The canonical next-study recommendation answers a different question and deliberately ignores performance quality. A small current-attempt repeat cue can make practice more focused without grading the learner, changing progression, or treating one pass as proof of ability.

### Current Scope

- The progressively enhanced practice completion surface may show one page-local immediate-repeat cue for the just-completed attempt.
- The cue is derived only from that attempt's current `EvaluationCompletionSummary`; it is not restored from persisted attempts and is absent before completion, after restart, and after reload.
- `errorFree: false` supplies the pitch-or-order reason because at least one wrong, repeated, or out-of-order note was corrected before completion.
- A timing summary supplies the timing reason only when `early + late > 0`. On-time intervals, the first timing anchor, zero assessed intervals, tempo, and mean absolute error do not independently trigger a repeat.
- Pitch-or-order and timing reasons combine into one cue when both conditions are true. They remain two factual focus areas rather than a score or diagnosis.
- The projection returns the following stable presentation shape:

  ```ts
  type PracticeRepeatGuidanceReason = "pitch-or-order" | "timing" | "pitch-or-order-and-timing";

  interface PracticeRepeatGuidance {
    readonly reason: PracticeRepeatGuidanceReason;
    readonly message: string;
    readonly actionLabel: "Repeat study" | `Repeat at ${number} BPM`;
  }
  ```

- Untimed pitch-or-order guidance uses `Repeat study`. Any triggered repeat for a timed completion uses `Repeat at <tempo> BPM`, including a timed attempt whose only trigger was pitch or order.
- Timing copy reports the non-zero early and late assessed-interval counts with singular or plural grammar and the completed attempt's tempo. Combined copy retains both the pitch-or-order fact and the timing facts.
- The cue appears in a polite live-status region in the feedback dock. While present, the existing restart button uses the projected action label; when absent, its label is `Restart`.
- A visible repeat cue and the ADR-056 next-study recommendation coexist. The learner may repeat, open the suggested study, or use the complete exercise chooser.

### Architecture

- **Entry point:** The typed enhancement for `/practice` projects guidance only when `PracticeSnapshot.sessionStatus` is `completed`.
- **Source model:** `EvaluationCompletionSummary` remains the sole input. `errorFree` supplies the pitch/order boolean; optional timing `early`, `late`, and `tempoBpm` supply the timing boolean and factual copy.
- **Projection:** `projectPracticeRepeatGuidance(summary)` returns `null` or `PracticeRepeatGuidance`. It is deterministic, side-effect free, and independent of DOM text, persisted attempts, and recommendation state.
- **Presentation:** The practice view hides and clears the repeat status when the projection is null, presents its message when non-null, and restores the restart button label outside the guided completed state.
- **Action:** The projected action invokes the existing `PracticeController.restart()` transition. It does not add a repeat-specific controller state or method.
- **Timed lifecycle:** Restart recreates evaluation at the already selected tempo and leaves the pulse stopped. The learner must explicitly start the canonical count-in before timed note input becomes evaluable again.
- **Lifetime:** The projection belongs to the current in-memory completed evaluator state. Persistence completion, persistence failure, retained-history refresh, recommendation refresh, and old saved attempts do not determine its visibility.
- **Dependencies:** ADR-050 owns deterministic live evaluation, ADR-054 owns MIDI-relative timing evidence, ADR-056 owns study recommendation, ADR-062 owns retained recent-attempt aggregation, and ADR-065 owns the separation and lifetime of immediate-repeat guidance.

### Evidence Boundary

- A pitch-or-order cue establishes only that the current completed sequence included one or more evaluator-classified corrections.
- A timing cue establishes only that the current timed completion contained one or more assessed intervals classified early or late relative to its fixed MIDI anchor at the selected tempo.
- The cue does not establish the cause of a correction, audible beat alignment, hand use, fingering, posture, tension, technique, reading, improvement, consistency, readiness, or mastery.
- Repeating at the same selected tempo is a learner action, not proof that the previous tempo was suitable or that the next attempt will improve.

### Anti-Patterns

- Do not read `AttemptRepository`, `PracticeHistorySummary`, recent saved-attempt aggregates, or DOM copy to decide whether the current repeat cue appears.
- Do not feed the cue, its reason, correction counts, timing counts, or action choice into `recommendNextStudy`.
- Do not replace, hide, disable, or relabel the canonical next-study recommendation when repeat guidance appears.
- Do not trigger from an all-on-time timing summary, `meanAbsoluteErrorMs`, tempo alone, an unassessed timing anchor, correction-free completion, or the presence of any older saved correction.
- Do not persist the cue, add it to the attempt schema, change exercise identity or revision, or treat a reload without the cue as evidence loss.
- Do not automatically start the pulse, count-in, audio context, or MIDI evaluation after a timed restart.
- Do not describe the repeat as required, unlocked, failed, remedial, corrective punishment, a score consequence, or evidence of mastery.

## Contract

### Definition of Done

- [ ] `projectPracticeRepeatGuidance(null)` and a correction-free untimed completion return no guidance.
- [ ] A completed attempt with `errorFree: false` returns a `pitch-or-order` cue even when the summary's observation list is bounded.
- [ ] A correction-free timed completion with any early or late interval returns a `timing` cue; an all-on-time completion returns no cue.
- [ ] A completion with both triggers returns one `pitch-or-order-and-timing` cue that preserves both factual areas.
- [ ] Early-only, late-only, and mixed early/late messages report exact assessed-interval counts, correct singular or plural grammar, and the selected tempo.
- [ ] The untimed action label is `Repeat study`; a triggered timed action label is `Repeat at <tempo> BPM`, including pitch-only corrections in a timed attempt.
- [ ] The cue renders only for the current completed enhanced session, uses a polite status region, clears on restart, and restores the button label to `Restart` when absent.
- [ ] Immediate-repeat guidance and the existing recommended study, explanation, and navigation action remain visible together when both are available.
- [ ] Activating repeat uses the existing restart transition, retains the current exercise, revision, input selection, and selected tempo, and creates a clean evaluation state.
- [ ] A timed repeat leaves the pulse stopped and requires an explicit new count-in before the attempt can accept evaluated notes.
- [ ] Save success, save failure, history refresh, recommendation refresh, retained corrections, and repository eviction neither create nor suppress the cue for the current completed evaluator state.
- [ ] Exercise, evaluator, attempt, storage, history, curriculum, recommendation, MIDI, and pulse schemas and policies remain unchanged.
- [ ] Server-rendered instructions, keyboard guidance, feedback fallback, and exercise selection remain meaningful without JavaScript; the hidden repeat region makes no server-side quality guess.
- [ ] Automated domain, view, controller, server-rendering, and browser tests cover the critical behavior without relying on snapshots alone.

### Regression Guardrails

- `EvaluationCompletionSummary` must remain the projection's only evidence input.
- Pitch-or-order guidance must key from completed correction evidence and must not depend on which two observation messages happen to survive the summary's display bound.
- Timing guidance must require at least one early or late assessed interval. `onPulse`, `assessedIntervals`, `tempoBpm`, and `meanAbsoluteErrorMs` cannot trigger it by themselves.
- Identical completion summaries must always produce identical guidance, messages, reasons, and action labels.
- A timed pitch-or-order cue must retain the summary's tempo in its action even when every assessed interval was on time.
- Restart must clear the completed summary from the active evaluation, hide the cue, restore ordinary restart copy, and preserve already saved history.
- Restarting a timed study must preserve the selected tempo without starting or resuming Web Audio.
- Repeat visibility and action must not change the current recommendation candidate, reason, history evidence, completion status of the saved attempt, or unrestricted exercise availability.
- Saving or failing to save the completed attempt must not change current repeat guidance while its completion summary remains active.
- Reloaded retained history must not reconstruct immediate-repeat guidance.
- Guidance copy must stay factual, calm, and free from causal diagnosis, percentage grades, trends, readiness gates, punishment, or mastery claims.

### Verification

- **Projection tests:** Null summary, correction-free untimed, pitch/order only, timed pitch/order with all intervals on time, early only, late only, mixed early and late, combined pitch/order and timing, all-on-time timing, and zero assessed intervals. Assert the exact reason, factual message, tempo-bearing action label, and singular/plural grammar.
- **View tests:** Hidden and cleared default, corrected-completion visibility, relabeled repeat action, label restoration after restart, combined timing copy, polite status semantics, and coexistence with every available recommendation kind and the library fallback.
- **Controller tests:** Existing restart creates clean occurrence progress and feedback, retains the selected timed tempo and input connection, clears active notes, leaves the pulse stopped, and requires explicit pulse start. Persistence and recommendation refreshes do not mutate evaluator-derived guidance.
- **Server-rendering tests:** The empty repeat status exists hidden for enhancement, contains no inferred correction, and leaves the complete no-JavaScript practice document usable.
- **Browser tests:** Complete an untimed attempt after a wrong, repeated, or out-of-order correction; observe the repeat message and unchanged next-study suggestion; activate repeat and verify clean progress. Complete a timed attempt with an early or late interval at a non-default tempo; observe `Repeat at <tempo> BPM`, activate it, verify the tempo remains selected, and verify the pulse does not start until requested.
- **Separation tests:** Seed retained corrections without correcting the current completion and assert no cue; fail persistence and assert the current cue and independent recommendation remain; reload and assert saved recent evidence may appear while the page-local cue does not.
- **Coverage target:** Every trigger combination, copy branch, lifecycle transition, and separation boundary remains exercised with direct assertions.

### Scenarios

**Scenario: Suggest an untimed repeat after a pitch correction**

- Given: the current untimed attempt includes a wrong, repeated, or out-of-order note and then completes the expected sequence
- When: the completion surface projects the current `EvaluationCompletionSummary`
- Then: it shows a `pitch-or-order` message, labels the restart action `Repeat study`, and leaves the canonical next-study suggestion visible

**Scenario: Do not prompt after a correction-free untimed completion**

- Given: the current untimed attempt completes with `errorFree: true`
- When: completion renders
- Then: no immediate-repeat cue appears, the ordinary `Restart` action remains available, and recommendation behavior is unchanged

**Scenario: Suggest a repeat for early timing**

- Given: the current timed completion has one early assessed interval, no late intervals, and no pitch or order corrections at 60 BPM
- When: completion renders
- Then: the cue factually reports that one assessed interval was early and labels the action `Repeat at 60 BPM`

**Scenario: Suggest a repeat for late timing**

- Given: the current timed completion has two late assessed intervals and every other interval is on time at 70 BPM
- When: completion renders
- Then: the cue factually reports that two assessed intervals were late and labels the action `Repeat at 70 BPM`

**Scenario: Combine pitch, order, and timing facts**

- Given: the current timed completion needed a pitch or order correction and contains both early and late assessed intervals
- When: the repeat projection runs
- Then: it returns one `pitch-or-order-and-timing` cue whose message retains both factual areas without calculating a score or changing the recommendation

**Scenario: Retain tempo for timed pitch corrections**

- Given: a timed completion needed a pitch or order correction but every assessed interval was on time at 80 BPM
- When: completion renders
- Then: its reason is `pitch-or-order`, its action says `Repeat at 80 BPM`, and timing does not become a second trigger

**Scenario: Do not prompt for all-on-time timing**

- Given: a correction-free timed completion has only on-time assessed intervals
- When: the repeat projection runs
- Then: it returns no guidance regardless of tempo, assessed-interval count, or mean absolute error

**Scenario: Restart a timed study deliberately**

- Given: a timed immediate-repeat cue is visible at the learner's selected tempo
- When: the learner activates its repeat action
- Then: progress and completion feedback reset for the same exercise at that tempo, the cue clears, and the pulse remains stopped until the learner explicitly starts a new count-in

**Scenario: Keep recommendation independent**

- Given: the current completion produces both immediate-repeat guidance and an available ADR-056 recommendation
- When: the completed surface renders or retained history refreshes
- Then: both actions remain visible, and the recommended exercise and explanation are identical to the result produced without performance-quality inputs

**Scenario: Ignore retained corrections**

- Given: recent saved attempts contain pitch, order, early, or late classifications but the current attempt is correction-free and all assessed intervals are on time
- When: the current completion renders
- Then: no immediate-repeat cue appears while ADR-062 may independently show those retained facts in the history panel

**Scenario: Preserve the cue when saving fails**

- Given: the current completion triggers immediate-repeat guidance and local persistence rejects the attempted save
- When: the page reports the storage failure
- Then: the current evaluator-derived repeat cue and independent in-memory recommendation remain available without claiming the attempt was retained

**Scenario: Do not restore the cue from history**

- Given: a completed attempt with corrections was saved and the practice page is reloaded
- When: retained history loads without a current completed evaluator summary
- Then: recent saved evidence may report the correction, but immediate-repeat guidance remains hidden
