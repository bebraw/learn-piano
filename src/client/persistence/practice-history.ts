import type { CompletedAttemptRecord } from "./attempt-repository.js";

export interface PracticeHistorySummary {
  readonly completedToday: number;
  readonly totalCompleted: number;
  readonly mostRecent: CompletedAttemptRecord | null;
}

export function summarizePracticeHistory(attempts: readonly CompletedAttemptRecord[], now: Date): PracticeHistorySummary {
  const newestFirst = [...attempts].sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));

  return {
    completedToday: newestFirst.filter((attempt) => isSameLocalDay(new Date(attempt.completedAt), now)).length,
    totalCompleted: newestFirst.length,
    mostRecent: newestFirst[0] ?? null,
  };
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}
