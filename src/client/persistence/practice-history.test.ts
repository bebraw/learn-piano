import { describe, expect, it } from "vitest";
import type { CompletedAttemptRecord } from "./attempt-repository.js";
import { summarizePracticeHistory } from "./practice-history.js";

describe("summarizePracticeHistory", () => {
  it("returns a meaningful empty summary", () => {
    expect(summarizePracticeHistory([], new Date(2026, 7, 1, 12))).toEqual({
      completedToday: 0,
      totalCompleted: 0,
      mostRecent: null,
      recentEvidence: {
        attemptCount: 0,
        correctionFreeAttempts: 0,
        errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
        timing: null,
      },
    });
  });

  it("counts the learner's local day and identifies the newest completion", () => {
    const yesterday = attempt("older", new Date(2026, 6, 31, 23, 59).toISOString());
    const morning = attempt("morning", new Date(2026, 7, 1, 9, 0).toISOString());
    const evening = attempt("evening", new Date(2026, 7, 1, 18, 0).toISOString());

    expect(summarizePracticeHistory([morning, yesterday, evening], new Date(2026, 7, 1, 20))).toEqual({
      completedToday: 2,
      totalCompleted: 3,
      mostRecent: evening,
      recentEvidence: {
        attemptCount: 3,
        correctionFreeAttempts: 3,
        errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
        timing: null,
      },
    });
  });

  it("summarizes only the five newest retained attempts without averaging tempos or timing error", () => {
    const attempts = [
      attempt("excluded-oldest", "2026-08-01T08:00:00.000Z", {
        errorCounts: { outOfOrder: 20, repeated: 20, wrong: 20 },
        timing: timing(60, 20, 0, 10, 10),
      }),
      attempt("clean-one", "2026-08-01T08:01:00.000Z", { timing: timing(40, 4, 3, 1, 0) }),
      attempt("wrong", "2026-08-01T08:02:00.000Z", {
        errorCounts: { outOfOrder: 0, repeated: 0, wrong: 2 },
        timing: timing(100, 4, 2, 0, 2),
      }),
      attempt("repeated-without-timing", "2026-08-01T08:03:00.000Z", {
        errorCounts: { outOfOrder: 0, repeated: 1, wrong: 0 },
      }),
      attempt("out-of-order", "2026-08-01T08:04:00.000Z", {
        errorCounts: { outOfOrder: 1, repeated: 0, wrong: 0 },
        timing: timing(70, 4, 4, 0, 0),
      }),
      attempt("clean-two", "2026-08-01T08:05:00.000Z", { timing: timing(80, 4, 3, 1, 0) }),
    ];

    const summary = summarizePracticeHistory(attempts, new Date("2026-08-01T12:00:00.000Z"));

    expect(summary.totalCompleted).toBe(6);
    expect(summary.mostRecent?.id).toBe("clean-two");
    expect(summary.recentEvidence).toEqual({
      attemptCount: 5,
      correctionFreeAttempts: 2,
      errorCounts: { outOfOrder: 1, repeated: 1, wrong: 2 },
      timing: { contributingAttempts: 4, assessedIntervals: 16, onTime: 12, early: 2, late: 2 },
    });
  });
});

function attempt(
  id: string,
  completedAt: string,
  overrides: Partial<Pick<CompletedAttemptRecord, "errorCounts" | "timing">> = {},
): CompletedAttemptRecord {
  return {
    schemaVersion: 1,
    id,
    exerciseId: "exercise",
    exerciseRevision: 1,
    startedAt: completedAt,
    completedAt,
    inputKind: "mock",
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
    ...overrides,
  };
}

function timing(
  tempoBpm: number,
  assessedIntervals: number,
  onPulse: number,
  early: number,
  late: number,
): NonNullable<CompletedAttemptRecord["timing"]> {
  return { tempoBpm, assessedIntervals, onPulse, early, late, meanAbsoluteErrorMs: 999 };
}
