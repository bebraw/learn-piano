# ADR-050: Keep Live Evaluation Deterministic

**Status:** Implemented

**Date:** 2026-08-01

## Context

During an exercise, a learner needs immediate and consistent feedback about what was played. For the initial untimed sequence, correctness follows explicit musical rules: expected note, ordering, repetition, and completion. The same input should produce the same outcome in unit tests, replayable fixtures, mock-backed browser flows, and real practice.

Putting a generative AI model in the live evaluation loop would add latency, network dependence, cost, privacy exposure, and variable judgments to behavior that can be defined exactly. MIDI data also cannot justify physical diagnoses such as tension or finger strength.

## Decision

Live performance evaluation will be deterministic domain logic. The evaluator consumes a canonical exercise definition and normalized MIDI events, advances explicit attempt state, and returns typed outcomes that the feedback layer renders as brief fixed language.

For the first untimed exercise, evaluation covers correct, wrong, repeated, out-of-order, and completed outcomes. Evaluation must not call a network service, language model, or nondeterministic clock. Tests and replay fixtures supply timestamps explicitly.

AI may be reconsidered later for optional, non-authoritative reflection or planning based on a deterministic attempt summary. It must not silently redefine correctness, block live practice, or infer physical technique from MIDI-only evidence. Such a capability requires its own specification and architecture decision.

## Trigger

The first vertical slice needs calm live feedback that is fast, replayable, and directly testable.

## Consequences

**Positive:**

- Identical exercises and event sequences produce identical results.
- Live feedback works offline with predictable latency.
- Domain rules can be covered directly with unit tests and replayed in browser tests.
- The application avoids sending fine-grained practice data to an external model.

**Negative:**

- Every supported musical rule must be modeled explicitly as exercise and evaluator behavior.
- Deterministic templates can be less conversational than generated coaching.
- The evaluator cannot responsibly assess posture, tension, fingering, or other information absent from its inputs.

**Neutral:**

- Timing, duration, chord, and velocity evaluation can be added later as deterministic rules when their contracts are specified.
- Exercise recommendation can evolve independently from live note evaluation.

## Alternatives Considered

### Use A Language Model For Every Feedback Event

This could vary wording, but it introduces avoidable latency and nondeterminism and gives an external model authority over simple correctness rules.

### Combine Deterministic Scoring With AI In The Required Live Path

Keeping scoring deterministic would reduce one risk, but a required generated explanation would still make practice depend on connectivity, model availability, and variable output.

### Provide Visual State Without An Evaluator

Highlighting raw notes alone is simple, but it does not provide the ordered feedback and persisted attempt outcome required by the practice experience.
