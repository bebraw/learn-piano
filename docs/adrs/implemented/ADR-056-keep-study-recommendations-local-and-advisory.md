# ADR-056: Keep Study Recommendations Local and Advisory

**Status:** Implemented

**Date:** 2026-08-01

## Context

The application now offers eight exercises with declared prerequisites and local exact-revision completion history. After completion, the practice page needs a more useful next action than cycling through rendered library positions. The learner also wants short, focused guidance without a rigid course, hidden score, streak pressure, or remote AI coach.

Recommendation evidence is deliberately limited. A completed attempt can establish that the canonical sequence reached completion, but one pass cannot establish mastery, correct hand use, staff reading, healthy technique, or general rhythmic ability. Local attempt retention is bounded, can be cleared, and may be unavailable; any recommendation must remain honest under those conditions.

## Decision

Choose and explain study recommendations with deterministic local domain logic over the validated canonical exercise library and typed completed-attempt summaries.

Only exact-current-revision completions count as prerequisite and completion evidence. After completion, prefer an eligible uncompleted direct dependent of the just-completed exercise, then the first eligible uncompleted exercise in canonical library order. If every current exercise is completed, suggest the least recently practiced exercise, with canonical order resolving equal timestamps. If readable history contains no current evidence, suggest the first prerequisite-free exercise.

Validate every prerequisite reference and reject cycles before recommendation. A missing or cyclic graph produces no recommendation; practice and the complete exercise chooser continue normally.

Recommendations are advisory. They never unlock, lock, hide, disable, or rewrite exercises and never modify evaluation or persisted attempts. Each result includes a deterministic reason based only on the rule that selected it. This first version ignores pitch errors, repeated or out-of-order counts, timing classifications, tempo, velocity, and duration. Completion evidence must never be described as mastery.

The controller may include the current just-completed attempt as optimistic in-memory evidence before its save finishes, then refresh after successful persistence. If saving fails, the in-session suggestion may still reflect the transient completion while history reports the failure; a later reload uses only evidence that was actually retained. Initial history failure remains neutral and leaves the exercise library as the fallback.

Do not add an account, cloud synchronization, remote recommendation API, generative explanation, random choice, or hidden learner profile for this slice.

## Trigger

The completed pitch, timing, native MIDI, exercise-library, persistence, and staff-guide slices provide enough canonical local evidence to offer one explainable next study without expanding musical evaluation.

## Consequences

**Positive:**

- The learner receives one concrete next option and an honest reason while retaining full control.
- Identical library and evidence inputs always yield the same recommendation offline.
- Recommendation reuses stable exercise IDs, revisions, prerequisites, and local history rather than introducing a second curriculum identity.
- The live evaluator remains small, deterministic, and independent from planning policy.

**Negative:**

- Canonical library order becomes observable recommendation policy and must be changed deliberately and tested.
- Completion-only evidence cannot distinguish a confident pass from one completed with corrections or weak timing.
- Bounded or cleared local history can cause an earlier exercise to be suggested again.
- Device-local recommendations may differ because there is no cross-device history.

**Neutral:**

- Exercise definitions, revisions, evaluation modes, attempt schema, and storage key remain unchanged.
- Current-session optimistic evidence can influence a suggestion before it becomes durable.
- Future quality-sensitive or goal-sensitive recommendation requires a new contract rather than silently changing version-one behavior.

## Alternatives Considered

### Use A Remote Or Generative Recommender

A remote model could produce varied coaching language, but it would add latency, connectivity, privacy, cost, and nondeterminism without better evidence than the local completion summaries. It could also overstate what MIDI proves.

### Build A Mandatory Linear Course

A fixed lock-and-unlock ladder would simplify progression, but it conflicts with the curriculum's parallel tracks, the learner's repertoire motivation, and the requirement to repeat, skip, or change tracks without penalty.

### Rank Attempts By Errors Or Timing

Pitch corrections and timing summaries are available, but converting one short pass into readiness thresholds would introduce arbitrary mastery implications. The first version uses completion identity only; a later evidence contract can add quality-sensitive advice explicitly.

### Keep The Circular Next Link

Advancing to the next rendered card is deterministic, but it ignores prerequisites, current revision evidence, recency, and why the exercise is useful. UI position alone is not adequate pedagogical guidance.
