import type { AttemptErrorCounts, CompletedAttemptRecord } from "./attempt-repository.js";

export const RECENT_ATTEMPT_WINDOW_SIZE = 5;

export interface RecentAttemptTimingSummary {
  readonly contributingAttempts: number;
  readonly assessedIntervals: number;
  readonly onTime: number;
  readonly early: number;
  readonly late: number;
}

export interface RecentAttemptEvidence {
  readonly attemptCount: number;
  readonly correctionFreeAttempts: number;
  readonly errorCounts: AttemptErrorCounts;
  readonly timing: RecentAttemptTimingSummary | null;
}

export interface PracticeHistorySummary {
  readonly completedToday: number;
  readonly totalCompleted: number;
  readonly mostRecent: CompletedAttemptRecord | null;
  readonly recentEvidence: RecentAttemptEvidence;
}

export function summarizePracticeHistory(attempts: readonly CompletedAttemptRecord[], now: Date): PracticeHistorySummary {
  const newestFirst = [...attempts].sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
  const recentAttempts = newestFirst.slice(0, RECENT_ATTEMPT_WINDOW_SIZE);

  return {
    completedToday: newestFirst.filter((attempt) => isSameLocalDay(new Date(attempt.completedAt), now)).length,
    totalCompleted: newestFirst.length,
    mostRecent: newestFirst[0] ?? null,
    recentEvidence: summarizeRecentAttempts(recentAttempts),
  };
}

function summarizeRecentAttempts(attempts: readonly CompletedAttemptRecord[]): RecentAttemptEvidence {
  const errorCounts = attempts.reduce<AttemptErrorCounts>(
    (total, attempt) => ({
      outOfOrder: total.outOfOrder + attempt.errorCounts.outOfOrder,
      repeated: total.repeated + attempt.errorCounts.repeated,
      wrong: total.wrong + attempt.errorCounts.wrong,
    }),
    { outOfOrder: 0, repeated: 0, wrong: 0 },
  );
  const timingSummaries = attempts.flatMap((attempt) => (attempt.timing === undefined ? [] : [attempt.timing]));

  return {
    attemptCount: attempts.length,
    correctionFreeAttempts: attempts.filter((attempt) => isCorrectionFree(attempt.errorCounts)).length,
    errorCounts,
    timing:
      timingSummaries.length === 0
        ? null
        : timingSummaries.reduce<RecentAttemptTimingSummary>(
            (total, timing) => ({
              contributingAttempts: total.contributingAttempts + 1,
              assessedIntervals: total.assessedIntervals + timing.assessedIntervals,
              onTime: total.onTime + timing.onPulse,
              early: total.early + timing.early,
              late: total.late + timing.late,
            }),
            { contributingAttempts: 0, assessedIntervals: 0, onTime: 0, early: 0, late: 0 },
          ),
  };
}

function isCorrectionFree(errorCounts: AttemptErrorCounts): boolean {
  return errorCounts.outOfOrder === 0 && errorCounts.repeated === 0 && errorCounts.wrong === 0;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}
