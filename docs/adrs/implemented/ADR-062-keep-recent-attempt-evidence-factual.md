# ADR-062: Keep Recent Attempt Evidence Factual

**Status:** Implemented

**Date:** 2026-08-01

## Context

The practice page already shows today's saved completion count and the latest result for one exercise revision. That confirms persistence, but it gives little context when the learner repeats a study. Completed-attempt records already retain categorical wrong, repeated, and out-of-order note counts and, for timed studies, interval classifications.

The browser repository is globally bounded, older compatible records may omit timing, and attempts may use different tempos. Presenting all retained records as a complete history, averaging timing error across tempos, or converting a small saved sample into a score or trend would overstate the available evidence. Feeding those aggregates into study recommendations would also change the recommendation policy established by ADR-056.

## Decision

The practice page will derive a compact recent-evidence projection from at most the five newest retained completions for the selected exact exercise ID and revision.

For that window, the projection will:

- count attempts whose persisted `wrong`, `repeated`, and `outOfOrder` counts are all zero;
- sum those three categorical correction counts;
- count timing-bearing attempts and sum their `onPulse`, `early`, `late`, and assessed-interval counts, while presenting `onPulse` as “on time”; and
- leave records without timing in the note-sequence summary without inventing timing evidence for them.

The projection will not average tempo or `meanAbsoluteErrorMs`. Learner-facing copy will call the records recent saved or retained attempts and will not describe the window as complete history.

This is a read-model and presentation change. It does not change the attempt schema, storage envelope, evaluator, completion rule, curriculum evidence, or recommendation inputs. It will not produce a percentage, score, grade, streak, trend, improvement claim, consistency claim, or mastery claim.

## Trigger

Repeated practice needs useful, measurable local evidence without introducing a game mechanic or claiming more than the retained attempt summaries establish.

## Consequences

**Positive:**

- Every current exercise gains a compact repeated-practice view from already persisted facts.
- Wrong, repeated, out-of-order, early, and late classifications remain visible as concrete categories instead of becoming an opaque score, and the timing row identifies how many attempts supplied timing.
- Exact-revision scoping and a fixed small window keep the summary interpretable and inexpensive.
- Older records without timing remain compatible.

**Negative:**

- Five retained attempts are only a recent saved sample and cannot establish a durable trend.
- Summed classifications can show where corrections occurred but cannot diagnose technique or explain why they occurred.
- A globally bounded repository may evict records, so the displayed window can shrink or change independently of actual lifetime practice.

**Neutral:**

- The latest attempt's tempo-specific timing sentence remains separate from the multi-attempt categorical summary.
- Recommendation remains intentionally insensitive to error and timing quality.

## Alternatives Considered

### Show Only The Latest Completion

This was the existing behavior. It preserves tempo-specific detail but does not help the learner put repeated attempts in context.

### Aggregate Every Retained Completion

This would maximize the visible sample, but repository eviction means the result still would not be complete history. Older work would also dominate a learner's current practice signal.

### Calculate A Percentage Or Composite Score

A single number would be compact, but weighting pitch classifications, interval classifications, and tempos would create an ungrounded grading policy and hide actionable categories.

### Infer Improvement Or Drive Recommendations

Comparing windows or ranking studies by their results could be useful later, but it requires a separate evidence and product decision. The current saved sample is not sufficient to claim improvement, consistency, or mastery.
