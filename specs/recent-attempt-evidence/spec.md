# Feature: Recent Attempt Evidence

## Blueprint

### Context

The learner needs factual context when repeating a study. A latest-completion timestamp and total retained count do not reveal whether recent saved attempts needed pitch or order corrections or whether timed intervals tended to be on time, early, or late. The application already persists those categories, so it can expose them without adding grading, telemetry, or another evaluator.

### Architecture

- **Entry point:** The progressively enhanced history panel on `/practice?exercise=<id>`.
- **Source records:** `AttemptRepository.list` results for the selected exact exercise ID and revision, already sorted or re-sorted newest first by completion time.
- **Read model:** `summarizePracticeHistory` derives `recentEvidence` from at most the five newest retained matching records.
- **Note-sequence projection:** An attempt is correction-free only when all persisted `wrong`, `repeated`, and `outOfOrder` counts are zero. The window also sums each correction category.
- **Timing projection:** Records with timing contribute a timing-bearing-attempt count plus assessed-interval, `onPulse`, early, and late counts. Learner copy calls `onPulse` “on time” and states how many recent attempts supplied timing. Records without timing still contribute note-sequence evidence and do not create timing facts.
- **Presentation:** The panel identifies the retained exact-revision window, separates pitch and timing facts, and hides the recent-evidence block for empty or unavailable history.
- **Dependencies:** ADR-049 owns local persistence, ADR-054 owns MIDI-relative timing evidence, ADR-056 owns recommendation inputs, and ADR-062 owns this factual recent-window projection.

### Anti-Patterns

- Do not call the newest five retained records the learner's complete or lifetime history.
- Do not convert the categories into a percentage, score, grade, streak, trend, improvement statement, consistency claim, or mastery claim.
- Do not average `meanAbsoluteErrorMs` or tempo across attempts.
- Do not infer fingering, hand use, articulation, dynamics, touch, posture, tension, staff reading, or the cause of an error from these aggregates.
- Do not feed recent pitch or timing quality into recommendation, curriculum completion, unlocking, or exercise availability without a later decision.
- Do not discard compatible records from the note-sequence summary merely because they have no timing field.

## Contract

### Definition of Done

- [ ] A readable non-empty exact-revision history shows a `Recent saved attempts` block.
- [ ] The block uses no more than the five newest retained matching completions and states the retained revision scope.
- [ ] Note-sequence evidence shows attempts completed without pitch or order corrections out of the window size and lists non-zero wrong, repeated, and out-of-order correction totals.
- [ ] Timing evidence identifies how many recent attempts supplied timing and sums their assessed intervals and on-time, early, and late classifications.
- [ ] Untimed or older compatible records without timing remain valid and do not create fabricated timing values.
- [ ] Empty, loading, and unavailable history states do not expose stale recent evidence.
- [ ] The attempt schema, local-storage envelope, evaluator, completion behavior, and recommendation policy remain unchanged.
- [ ] The spec is updated with behavior changes, and unit, view, controller, and browser tests cover the critical path.

### Regression Guardrails

- The recent window must remain scoped to the selected exact exercise ID and revision supplied by the repository.
- Records older than the newest five retained matches must not affect recent evidence.
- An attempt completed without pitch or order corrections requires all three note-sequence error categories to be zero; timing quality does not change that classification.
- The summed timing classifications must equal the summed assessed intervals because each source timing record has the same invariant.
- Mixed tempos and `meanAbsoluteErrorMs` values must not be averaged or displayed as a multi-attempt metric.
- Storage failure must keep practice and musical completion usable while hiding unavailable history evidence.
- Recent evidence must remain a read-only presentation and must not alter recommendation or curriculum results.

### Verification

- **Domain tests:** Empty history, local-day counts, newest-five truncation, correction-free classification, category sums, mixed tempos, and records without timing.
- **View tests:** Empty and unavailable hiding, exact-revision window copy, singular grammar, pitch-or-order correction details, partial timing coverage, timing classification details, and absence of score or mastery language.
- **Controller tests:** Initial empty evidence and refreshed evidence after a successfully persisted completion.
- **Browser tests:** An untimed attempt with a wrong-note correction survives reload with factual pitch evidence; a timed attempt shows its saved interval distribution.
- **Coverage target:** Every aggregation branch and presentation state remains exercised without snapshot-only evidence.

### Scenarios

**Scenario: Summarize fewer than five saved attempts**

- Given: three retained completions match the selected exercise ID and revision
- When: practice history loads
- Then: the panel identifies the three newest retained completions and reports correction-free attempts plus any non-zero correction categories

**Scenario: Limit the recent window**

- Given: six retained completions match the selected exercise ID and revision
- When: practice history loads
- Then: only the five newest completions contribute to recent pitch and timing evidence while the saved-total line still reports all six retained matches

**Scenario: Combine compatible timing evidence**

- Given: the newest five records include timing summaries at different tempos and one compatible record without timing
- When: recent evidence is derived
- Then: all five contribute note-sequence facts, the timing row states how many records contribute categorical interval totals, and neither tempo nor mean absolute error is averaged

**Scenario: Keep untimed history factual**

- Given: retained completions contain no timing summaries
- When: the history panel renders
- Then: it shows recent pitch evidence and omits the timing row

**Scenario: History is unavailable**

- Given: the browser repository cannot read or save local history
- When: the page renders the unavailable state
- Then: practice remains usable, the recent-evidence block is hidden, and no partial aggregate is presented

**Scenario: Recommendation remains independent**

- Given: recent attempts contain pitch or order corrections or early and late intervals
- When: the application recommends a next study
- Then: the recommendation uses its existing exact-revision completion and prerequisite policy without consulting recent evidence
