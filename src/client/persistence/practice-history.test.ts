import { describe, expect, it } from "vitest";
import type { CompletedAttemptRecord } from "./attempt-repository.js";
import { summarizePracticeHistory } from "./practice-history.js";

describe("summarizePracticeHistory", () => {
  it("returns a meaningful empty summary", () => {
    expect(summarizePracticeHistory([], new Date(2026, 7, 1, 12))).toEqual({
      completedToday: 0,
      totalCompleted: 0,
      mostRecent: null,
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
    });
  });
});

function attempt(id: string, completedAt: string): CompletedAttemptRecord {
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
  };
}
