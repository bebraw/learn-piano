import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseHand } from "../../exercises/types.js";
import type { AttemptRepository, CompletedAttemptRecord } from "./attempt-repository.js";
import { loadPracticeOverview, summarizePracticeOverview } from "./practice-overview.js";

describe("summarizePracticeOverview", () => {
  it("summarizes an empty history and recommends the first available study", () => {
    const right = exercise("right", "right");
    const left = exercise("left", "left");
    const both = exercise("both", "both");

    const summary = summarizePracticeOverview([right, left, both], [], new Date(2026, 7, 1, 12));

    expect(summary).toMatchObject({
      totalStudies: 3,
      completedStudyIdentities: [],
      completedStudies: 0,
      rightHand: { completed: 0, total: 2 },
      leftHand: { completed: 0, total: 2 },
      completedToday: 0,
      mostRecent: null,
      recommendation: {
        kind: "new-study",
        reason: { kind: "prerequisite-free" },
      },
    });
    expect(summary.recommendation?.exercise).toBe(right);
  });

  it("counts each completed study once while retaining every matching completion for today", () => {
    const right = exercise("right", "right");
    const left = exercise("left", "left");
    const both = exercise("both", "both");
    const completedAt = new Date(2026, 7, 1, 10).toISOString();
    const attempts = [
      attempt("right-first", right, completedAt),
      attempt("right-second", right, completedAt),
      attempt("both-first", both, completedAt),
    ];

    expect(summarizePracticeOverview([right, left, both], attempts, new Date(2026, 7, 1, 12))).toMatchObject({
      completedStudyIdentities: [
        { exerciseId: right.id, exerciseRevision: right.revision },
        { exerciseId: both.id, exerciseRevision: both.revision },
      ],
      completedStudies: 2,
      rightHand: { completed: 2, total: 2 },
      leftHand: { completed: 1, total: 2 },
      completedToday: 3,
    });
  });

  it("uses the learner's local calendar day", () => {
    const study = exercise("study", "right");
    const attempts = [
      attempt("yesterday", study, new Date(2026, 6, 31, 23, 59).toISOString()),
      attempt("morning", study, new Date(2026, 7, 1, 0, 1).toISOString()),
      attempt("evening", study, new Date(2026, 7, 1, 23, 59).toISOString()),
      attempt("tomorrow", study, new Date(2026, 7, 2, 0, 1).toISOString()),
    ];

    expect(summarizePracticeOverview([study], attempts, new Date(2026, 7, 1, 12)).completedToday).toBe(2);
  });

  it("ignores unknown studies, old revisions, and invalid completion dates", () => {
    const current = exercise("current", "right", [], 2);
    const other = exercise("other", "left");
    const valid = attempt("valid", other, new Date(2026, 7, 1, 9).toISOString());
    const evidence = [
      valid,
      attempt("old-revision", current, new Date(2026, 7, 1, 10).toISOString(), 1),
      attempt("invalid-date", current, "not-a-date"),
      attempt("normalized-invalid-date", current, "2026-02-30T10:00:00.000Z"),
      { ...attempt("unknown", current, new Date(2026, 7, 1, 11).toISOString()), exerciseId: "unknown" },
    ];

    const summary = summarizePracticeOverview([current, other], evidence, new Date(2026, 7, 1, 12));

    expect(summary.completedStudyIdentities).toEqual([{ exerciseId: other.id, exerciseRevision: other.revision }]);
    expect(summary.completedStudies).toBe(1);
    expect(summary.completedToday).toBe(1);
    expect(summary.mostRecent).toEqual({ exercise: other, attempt: valid });
  });

  it("pairs the newest completion with its canonical exercise", () => {
    const first = exercise("first", "right");
    const second = exercise("second", "left");
    const older = attempt("older", first, "2026-08-01T08:00:00.000Z");
    const newer = attempt("newer", second, "2026-08-02T08:00:00.000Z");

    expect(summarizePracticeOverview([first, second], [newer, older], new Date(2026, 7, 2, 12)).mostRecent).toEqual({
      exercise: second,
      attempt: newer,
    });
  });

  it("breaks equal newest timestamps by canonical exercise order", () => {
    const first = exercise("first", "right");
    const second = exercise("second", "left");
    const completedAt = "2026-08-01T08:00:00.000Z";
    const firstAttempt = attempt("first-attempt", first, completedAt);
    const secondAttempt = attempt("second-attempt", second, completedAt);

    expect(summarizePracticeOverview([first, second], [secondAttempt, firstAttempt], new Date(2026, 7, 1, 12)).mostRecent).toEqual({
      exercise: first,
      attempt: firstAttempt,
    });
  });

  it("recommends the next eligible study from matching evidence", () => {
    const root = exercise("root", "right");
    const dependent = exercise("dependent", "right", [root.id]);
    const summary = summarizePracticeOverview(
      [root, dependent],
      [attempt("root-completion", root, "2026-08-01T08:00:00.000Z")],
      new Date(2026, 7, 1, 12),
    );

    expect(summary.recommendation).toEqual({
      kind: "new-study",
      exercise: dependent,
      reason: {
        kind: "prerequisites-practiced",
        prerequisiteExerciseIds: [root.id],
      },
    });
  });

  it("returns no recommendation when the exercise graph is invalid or empty", () => {
    const cyclicFirst = exercise("first", "right", ["second"]);
    const cyclicSecond = exercise("second", "left", ["first"]);

    expect(summarizePracticeOverview([], [], new Date(2026, 7, 1, 12)).recommendation).toBeNull();
    expect(summarizePracticeOverview([cyclicFirst, cyclicSecond], [], new Date(2026, 7, 1, 12)).recommendation).toBeNull();
  });
});

describe("loadPracticeOverview", () => {
  it("loads every current exercise history with its exact revision", async () => {
    const first = exercise("first", "right", [], 2);
    const second = exercise("second", "left", [], 4);
    const firstAttempt = attempt("first-attempt", first, "2026-08-01T08:00:00.000Z");
    const calls: Array<{ readonly exerciseId: string; readonly exerciseRevision: number }> = [];
    const repository: AttemptRepository = {
      async list(exerciseId, exerciseRevision) {
        calls.push({ exerciseId, exerciseRevision });
        return exerciseId === first.id ? [firstAttempt] : [];
      },
      async save() {},
    };

    const summary = await loadPracticeOverview(repository, [first, second], new Date(2026, 7, 1, 12));

    expect(calls).toEqual([
      { exerciseId: first.id, exerciseRevision: first.revision },
      { exerciseId: second.id, exerciseRevision: second.revision },
    ]);
    expect(summary.completedStudyIdentities).toEqual([{ exerciseId: first.id, exerciseRevision: first.revision }]);
  });

  it("rejects the whole overview when any exercise history read fails", async () => {
    const first = exercise("first", "right");
    const second = exercise("second", "left");
    const calls: string[] = [];
    const repository: AttemptRepository = {
      async list(exerciseId) {
        calls.push(exerciseId);
        if (exerciseId === second.id) {
          throw new Error("storage unavailable");
        }
        return [];
      },
      async save() {},
    };

    await expect(loadPracticeOverview(repository, [first, second])).rejects.toThrow("storage unavailable");
    expect(calls).toEqual([first.id, second.id]);
  });
});

function exercise(id: string, hand: ExerciseHand, prerequisites: readonly string[] = [], revision = 1): Exercise {
  return {
    schemaVersion: 1,
    id,
    revision,
    title: id,
    instructions: `Play ${id}.`,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: [{ id: `${id}-note`, kind: "note", noteNumber: 60, hand }],
    source: { kind: "original" },
    prerequisites,
    curriculumTags: [],
    repertoireGoalTags: [],
  };
}

function attempt(
  id: string,
  exerciseFixture: Exercise,
  completedAt: string,
  exerciseRevision = exerciseFixture.revision,
): CompletedAttemptRecord {
  return {
    schemaVersion: 1,
    id,
    exerciseId: exerciseFixture.id,
    exerciseRevision,
    startedAt: completedAt,
    completedAt,
    inputKind: "mock",
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
  };
}
