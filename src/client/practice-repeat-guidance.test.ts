import { describe, expect, it } from "vitest";
import type { EvaluationCompletionSummary, TimingCompletionSummary } from "../exercises/evaluator.js";
import { projectPracticeRepeatGuidance } from "./practice-repeat-guidance.js";

describe("projectPracticeRepeatGuidance", () => {
  it("returns no guidance before completion or after a correction-free untimed attempt", () => {
    expect(projectPracticeRepeatGuidance(null)).toBeNull();
    expect(projectPracticeRepeatGuidance(completion())).toBeNull();
  });

  it("returns no guidance when every assessed interval was on time", () => {
    expect(projectPracticeRepeatGuidance(completion({ timing: timing({ onPulse: 4 }) }))).toBeNull();
  });

  it("suggests an untimed repeat after pitch or order corrections", () => {
    expect(projectPracticeRepeatGuidance(completion({ errorFree: false }))).toEqual({
      reason: "pitch-or-order",
      message: "Pitch or order corrections occurred in this attempt. Repeat once while the phrase is familiar.",
      actionLabel: "Repeat study",
    });
  });

  it("retains a timed attempt's tempo when only pitch or order corrections occurred", () => {
    expect(projectPracticeRepeatGuidance(completion({ errorFree: false, timing: timing({ tempoBpm: 70, onPulse: 4 }) }))).toEqual({
      reason: "pitch-or-order",
      message: "Pitch or order corrections occurred in this attempt. Repeat once while the phrase is familiar.",
      actionLabel: "Repeat at 70 BPM",
    });
  });

  it.each([
    {
      name: "early-only",
      timing: timing({ early: 1, onPulse: 3 }),
      message: "1 assessed interval was early at 60 BPM. Repeat once at the same tempo.",
    },
    {
      name: "late-only",
      timing: timing({ late: 2, onPulse: 2 }),
      message: "2 assessed intervals were late at 60 BPM. Repeat once at the same tempo.",
    },
    {
      name: "both early and late",
      timing: timing({ early: 1, late: 2, onPulse: 1 }),
      message: "1 assessed interval was early and 2 were late at 60 BPM. Repeat once at the same tempo.",
    },
  ])("describes $name timing factually", ({ timing: attemptTiming, message }) => {
    expect(projectPracticeRepeatGuidance(completion({ timing: attemptTiming }))).toEqual({
      reason: "timing",
      message,
      actionLabel: "Repeat at 60 BPM",
    });
  });

  it("combines pitch or order and timing reasons without collapsing their facts", () => {
    expect(
      projectPracticeRepeatGuidance(completion({ errorFree: false, timing: timing({ tempoBpm: 80, early: 2, late: 1, onPulse: 1 }) })),
    ).toEqual({
      reason: "pitch-or-order-and-timing",
      message:
        "Pitch or order corrections occurred, and 2 assessed intervals were early and 1 was late at 80 BPM. Repeat once at the same tempo.",
      actionLabel: "Repeat at 80 BPM",
    });
  });
});

function completion(overrides: Partial<Pick<EvaluationCompletionSummary, "errorFree" | "timing">> = {}): EvaluationCompletionSummary {
  return {
    errorFree: true,
    message: "The sequence was correct.",
    observations: [],
    ...overrides,
  };
}

function timing(overrides: Partial<TimingCompletionSummary> = {}): TimingCompletionSummary {
  return {
    tempoBpm: 60,
    assessedIntervals: 4,
    onPulse: 0,
    early: 0,
    late: 0,
    meanAbsoluteErrorMs: 0,
    message: "Timing summary.",
    ...overrides,
  };
}
