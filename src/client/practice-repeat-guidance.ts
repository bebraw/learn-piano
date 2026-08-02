import type { EvaluationCompletionSummary, TimingCompletionSummary } from "../exercises/evaluator.js";

export type PracticeRepeatGuidanceReason = "pitch-or-order" | "timing" | "pitch-or-order-and-timing";

export interface PracticeRepeatGuidance {
  readonly reason: PracticeRepeatGuidanceReason;
  readonly message: string;
  readonly actionLabel: "Repeat study" | `Repeat at ${number} BPM`;
}

export function projectPracticeRepeatGuidance(summary: EvaluationCompletionSummary | null): PracticeRepeatGuidance | null {
  if (summary === null) {
    return null;
  }

  const hasPitchOrOrderCorrections = !summary.errorFree;
  const timing = summary.timing;
  const hasTimingCorrections = timing !== undefined && timing.early + timing.late > 0;
  if (!hasPitchOrOrderCorrections && !hasTimingCorrections) {
    return null;
  }

  return {
    reason:
      hasPitchOrOrderCorrections && hasTimingCorrections
        ? "pitch-or-order-and-timing"
        : hasPitchOrOrderCorrections
          ? "pitch-or-order"
          : "timing",
    message: repeatMessage(hasPitchOrOrderCorrections, hasTimingCorrections ? timing : undefined),
    actionLabel: timing === undefined ? "Repeat study" : `Repeat at ${timing.tempoBpm} BPM`,
  };
}

function repeatMessage(hasPitchOrOrderCorrections: boolean, timing: TimingCompletionSummary | undefined): string {
  if (timing === undefined) {
    return "Pitch or order corrections occurred in this attempt. Repeat once while the phrase is familiar.";
  }

  const timingFact = formatTimingFact(timing);
  if (hasPitchOrOrderCorrections) {
    return `Pitch or order corrections occurred, and ${timingFact} Repeat once at the same tempo.`;
  }

  return `${timingFact} Repeat once at the same tempo.`;
}

function formatTimingFact(timing: TimingCompletionSummary): string {
  if (timing.early > 0 && timing.late > 0) {
    return `${formatIntervalCount(timing.early)} ${timing.early === 1 ? "was" : "were"} early and ${timing.late} ${
      timing.late === 1 ? "was" : "were"
    } late at ${timing.tempoBpm} BPM.`;
  }

  const count = timing.early > 0 ? timing.early : timing.late;
  const direction = timing.early > 0 ? "early" : "late";
  return `${formatIntervalCount(count)} ${count === 1 ? "was" : "were"} ${direction} at ${timing.tempoBpm} BPM.`;
}

function formatIntervalCount(count: number): string {
  return `${count} assessed ${count === 1 ? "interval" : "intervals"}`;
}
