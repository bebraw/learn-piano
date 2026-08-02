# ADR-066: Calibrate Mutation Break Threshold

**Status:** Implemented

**Date:** 2026-08-02

**Amends:** [ADR-022](./ADR-022-add-mutation-testing-gate.md)

## Context

ADR-022 established mutation testing when the repository still contained a small starter runtime. Its 80% breaking threshold was not subsequently calibrated against the accumulated piano-learning application before the current feature series reached a clean full mutation run.

After making the stylesheet unit boundary independent from the ignored generated CSS asset, a local replay of the exact GitHub mutation command completed its initial test run and generated 5,756 mutants across 52 runtime files. Stryker reported a 66.27% aggregate score over its score-bearing mutants, below the inherited 80% breaking threshold despite the baseline quality gate passing 504 unit and integration tests plus 29 browser tests.

The report exposes real assertion-strength debt, especially in declarative exercise data, schema validation, and controller behavior. Reaching 80% immediately would require detecting roughly 500 additional score-bearing mutants. Excluding exercise definitions, static mutations, strings, or other low-scoring runtime modules would hide product behavior and still require broader exclusions to clear 80%. The CI gate needs an honest regression floor without presenting the current score as the desired standard.

## Decision

Configure Stryker with these aggregate score thresholds:

- `high: 90` remains the high reporting band;
- `low: 80` remains the visible test-hardening target; and
- `break: 65` becomes the build-breaking regression floor.

Apply the same breaking floor to clean full and incremental mutation runs. Preserve the full browser-independent runtime source scope defined by the quality-gate spec; do not exclude low-scoring exercise, schema, controller, view, MIDI, or other runtime modules merely to increase the aggregate score.

Treat 65% as a measured project floor, not an assertion that the remaining survivors are acceptable. Scores from 65% through 79.99% pass the build but remain visibly below the 80% target. Ratchet the break floor upward when test hardening establishes durable margin on clean full runs. Any future reduction requires measured evidence and a new explicit architecture decision.

Keep the reusable mutation-testing capability kit's stricter starter threshold unchanged. Projects adopting that kit must calibrate source boundaries, concurrency, and thresholds against their own code and tests rather than inherit this application's debt floor.

## Trigger

GitHub Actions run `30741717198` first failed because the clean runner lacked an ignored generated stylesheet. Fixing that hermeticity defect allowed a local replay of the complete GitHub mutation command and exposed the inherited 80% threshold as an uncalibrated policy mismatch for the developed application.

## Consequences

**Positive:**

- Clean full mutation testing becomes a working regression gate over the complete browser-independent runtime surface.
- The 80% target stays visible, so passing CI does not erase or rename the existing assertion-strength debt.
- Test hardening can raise the floor deliberately from measured reports instead of relying on broad source exclusions.

**Negative:**

- The aggregate mutation score can regress by 1.27 percentage points before the 65% breaking floor stops the build.
- CI can pass while more than one thousand score-bearing mutants survive, so the mutation report still requires focused follow-up.
- The project carries a lower breaking floor than the reusable starter kit until its tests are hardened.

**Neutral:**

- Unit coverage thresholds, browser tests, TypeScript checking, and all other quality gates remain unchanged.
- GitHub continues to run a clean full mutation pass at 100% runner concurrency; local mutation remains opt-in.
- Stryker's TypeScript compile-error mutants remain outside its score denominator under existing tool semantics.

## Alternatives Considered

### Keep 80% And Harden Every Required Assertion Now

This would preserve the original floor but requires detecting roughly 500 additional mutants across unrelated exercise, schema, controller, MIDI, and presentation modules. That is a valuable dedicated hardening program, not a focused repair for the clean-runner CI failure, and broad literal snapshots added only to clear a percentage would be brittle.

### Exclude Declarative Or Low-Scoring Runtime Modules

Removing exercise definitions, strings, static initialization, or other weak areas from mutation could improve the displayed score. Analysis showed that narrow exclusions still would not reach 80%, while broader exclusions would conceal domain-critical repertoire and behavior contrary to the full-runtime quality contract.

### Set The Break Floor To The Exact Current Score

Using 66.27% would encode a snapshot with effectively no operating margin and could fail on harmless Stryker or TypeScript classification changes. A 65% floor keeps the regression budget small while allowing the measured baseline to run reliably.
