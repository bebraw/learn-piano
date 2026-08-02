# ADR-065: Separate Immediate Repeat Guidance From Study Recommendation

**Status:** Implemented

**Date:** 2026-08-02

## Context

The completion surface already reports the current attempt's deterministic pitch, order, and optional timing facts. It also shows ADR-056's advisory next-study recommendation, while ADR-062 summarizes a bounded window of retained attempts elsewhere on the page. These three views answer different questions: what happened just now, whether one more pass may be useful while the phrase is familiar, and what study to consider next.

Using current-attempt corrections to change the recommended study would silently make ADR-056 quality-sensitive and could turn a single completion into a readiness judgment. Deriving the repeat cue from ADR-062's newest-five aggregate would instead make old or evicted records control an immediate action and would keep the cue alive after the current evaluator state is gone. The learner needs a small, reversible suggestion that preserves both boundaries.

## Decision

Derive immediate-repeat guidance as a page-local client projection from the current `EvaluationCompletionSummary` only. `projectPracticeRepeatGuidance` accepts that summary or `null` and returns either no guidance or a presentation value containing:

- a `reason` of `pitch-or-order`, `timing`, or `pitch-or-order-and-timing`;
- a calm factual `message`; and
- an `actionLabel` of `Repeat study` for an untimed completion or `Repeat at <tempo> BPM` when the completed summary contains timing.

A pitch-or-order reason exists only when `errorFree` is false, meaning the completed current attempt needed at least one wrong, repeated, or out-of-order correction. A timing reason exists only when the timing summary contains at least one early or late assessed interval. The two reasons combine when both conditions hold.

Do not suggest an immediate repeat for a correction-free untimed completion, a timed completion whose assessed intervals are all on time, a timing anchor with no assessed interval, tempo alone, `meanAbsoluteErrorMs`, completion identity, input kind, or any retained-history fact. The projection may state the early and late counts and current tempo, but it must not diagnose why they occurred, calculate a score, or claim readiness, improvement, consistency, or mastery.

Render the cue only while the current enhanced practice session is completed and the projection is non-null. Reuse the existing restart action, relabeling it from `Restart` to the projected action label while the cue is present. Restart creates a clean attempt for the same exercise revision and clears the cue. For a timed study it retains the learner's selected tempo, stops or leaves stopped the prior pulse, and requires the learner to start the count-in again; it never automatically starts Web Audio or accepts timed input before the pulse is running.

Keep the ADR-056 recommendation visible beside immediate-repeat guidance. The repeat projection does not choose, replace, hide, reprioritize, or recalculate the recommended exercise or its explanation. It also does not read or modify ADR-062's retained recent-attempt aggregate.

This is a presentation projection over existing evaluator output. It changes no exercise schema or revision, evaluator transition or completion rule, attempt schema or repository behavior, persistence timing, recommendation input or policy, curriculum evidence, MIDI behavior, pulse evidence, or server-rendered no-JavaScript meaning.

## Trigger

The completion page can already distinguish a corrected pitch or order and an early or late interval. The next focused slice needs to turn those current-attempt facts into one optional repeat action without broadening the recommender or retained-history contracts.

## Consequences

**Positive:**

- The learner receives one immediate, specific next action while the phrase and correction are still familiar.
- Pitch/order and timing remain at most two factual focus areas instead of becoming a composite score.
- The canonical next-study suggestion remains available, so repeating never becomes a gate or mandatory detour.
- The implementation reuses the existing completion summary, restart transition, selected tempo, and pulse lifecycle without a new domain or persistence model.

**Negative:**

- A single corrected note or off-time interval can produce a repeat cue even when the learner does not consider another pass useful.
- The cue is intentionally page-local and disappears after reload, so it cannot serve as a durable practice plan.
- The completed surface may show both repeat and next-study actions, which requires clear visual hierarchy and accessible copy.

**Neutral:**

- Every completed attempt remains equally valid completion evidence for ADR-056 regardless of whether repeat guidance appears.
- Successfully saving, failing to save, or refreshing retained history does not create or suppress the current evaluator-derived cue.
- The existing `Restart` action remains available when no immediate-repeat guidance is warranted.

## Alternatives Considered

### Make Recommendation Quality-Sensitive

Pitch corrections or early and late intervals could force the recommender to return the current study. That would change ADR-056's completion-only policy, hide the canonical next option, and imply a readiness threshold that the application has not defined.

### Derive The Cue From Recent Saved Attempts

ADR-062's newest-five projection could identify recurring categories, but bounded retention, mixed tempos, reload behavior, and storage failure make it a different evidence window. It cannot honestly describe what the learner should do immediately after this attempt without a separate trend policy.

### Prompt After Every Completion

An unconditional repeat would be simple, but it would add friction after a correction-free attempt and would not use the specific current evidence that motivates this slice. The ordinary `Restart` control already supports voluntary repetition.

### Restart And Start The Pulse Automatically

Automatically beginning a timed repeat would reduce one click, but it could start audible guidance before the learner is settled and blur the existing explicit count-in lifecycle. Restart preserves the selected tempo while leaving pulse start under learner control.
