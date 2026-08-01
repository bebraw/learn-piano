import { describe, expect, it } from "vitest";
import type { CompletedAttemptRecord } from "../client/persistence/attempt-repository.js";
import { STEP_SKIP_LEFT_HAND_EXERCISE_ID, STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "../exercises/library/beginner-five-note-exercises.js";
import { EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID } from "../exercises/library/even-eighth-exercises.js";
import { exerciseLibrary } from "../exercises/library/index.js";
import {
  ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/ordered-chord-tone-exercises.js";
import {
  REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
  REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/repeated-note-exercises.js";
import {
  STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/steady-quarter-exercises.js";
import type { Exercise } from "../exercises/types.js";
import { recommendNextStudy, type StudyAttemptEvidence } from "./study-recommendation.js";

describe("recommendNextStudy", () => {
  it("chooses the first prerequisite-free study when history is empty", () => {
    const prerequisite = exercise("prerequisite");
    const blocked = exercise("blocked", [prerequisite.id]);
    const laterRoot = exercise("later-root");

    const recommendation = recommendNextStudy([blocked, prerequisite, laterRoot], [], null);

    expect(recommendation).toEqual({
      kind: "new-study",
      exercise: prerequisite,
      reason: { kind: "prerequisite-free" },
    });
    expect(recommendation?.exercise).toBe(prerequisite);
  });

  it("prefers an eligible direct dependent over an earlier unpracticed root", () => {
    const completedRoot = exercise("completed-root");
    const earlierRoot = exercise("earlier-root");
    const directDependent = exercise("direct-dependent", [completedRoot.id]);

    expect(
      recommendNextStudy(
        [completedRoot, earlierRoot, directDependent],
        [attempt(completedRoot, "2026-08-01T08:00:00.000Z")],
        completedRoot.id,
      ),
    ).toEqual({
      kind: "new-study",
      exercise: directDependent,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [completedRoot.id],
      },
    });
  });

  it("otherwise chooses the first eligible unpracticed study in library order", () => {
    const root = exercise("root");
    const firstDependent = exercise("first-dependent", [root.id]);
    const secondDependent = exercise("second-dependent", [root.id]);

    expect(
      recommendNextStudy([root, firstDependent, secondDependent], [attempt(root, "2026-08-01T08:00:00.000Z")], "unrelated-study"),
    ).toEqual({
      kind: "new-study",
      exercise: firstDependent,
      reason: {
        kind: "prerequisites-practiced",
        prerequisiteExerciseIds: [root.id],
      },
    });
  });

  it("requires current-revision evidence for every prerequisite and ignores unknown attempts", () => {
    const firstPrerequisite = exercise("first-prerequisite", [], 2);
    const secondPrerequisite = exercise("second-prerequisite");
    const dependent = exercise("dependent", [firstPrerequisite.id, secondPrerequisite.id]);
    const attempts: StudyAttemptEvidence[] = [
      attempt(firstPrerequisite, "2026-08-01T08:00:00.000Z", 1),
      attempt(secondPrerequisite, "2026-08-01T08:05:00.000Z"),
      { exerciseId: "unknown", exerciseRevision: 1, completedAt: "2026-08-01T08:10:00.000Z" },
    ];

    expect(recommendNextStudy([firstPrerequisite, secondPrerequisite, dependent], attempts, secondPrerequisite.id)).toEqual({
      kind: "new-study",
      exercise: firstPrerequisite,
      reason: { kind: "prerequisite-free" },
    });
  });

  it("does not use attempt quality or input telemetry to choose a study", () => {
    const root = exercise("root");
    const dependent = exercise("dependent", [root.id]);
    const completedAt = "2026-08-01T08:00:00.000Z";
    const leanEvidence = [attempt(root, completedAt)];
    const enrichedAttempt: CompletedAttemptRecord = {
      schemaVersion: 1,
      id: "telemetry-heavy-attempt",
      exerciseId: root.id,
      exerciseRevision: root.revision,
      startedAt: "2026-08-01T07:59:30.000Z",
      completedAt,
      inputKind: "native-midi",
      status: "completed",
      errorCounts: { outOfOrder: 7, repeated: 5, wrong: 9 },
      timing: {
        tempoBpm: 100,
        assessedIntervals: 4,
        onPulse: 0,
        early: 2,
        late: 2,
        meanAbsoluteErrorMs: 750,
      },
    };

    expect(recommendNextStudy([root, dependent], [enrichedAttempt], root.id)).toEqual(
      recommendNextStudy([root, dependent], leanEvidence, root.id),
    );
  });

  it("uses the latest completion per study and recommends the least-recently practiced study for review", () => {
    const first = exercise("first");
    const second = exercise("second");
    const third = exercise("third");
    const attempts = [
      attempt(first, "2026-08-01T08:00:00.000Z"),
      attempt(first, "2026-08-03T08:00:00.000Z"),
      attempt(second, "2026-08-02T08:00:00.000Z"),
      attempt(third, "2026-08-04T08:00:00.000Z"),
    ];

    expect(recommendNextStudy([first, second, third], attempts, third.id)).toEqual({
      kind: "review",
      exercise: second,
      reason: {
        kind: "least-recently-practiced",
        lastCompletedAt: "2026-08-02T08:00:00.000Z",
      },
    });
  });

  it("uses library order to break equal review timestamps", () => {
    const first = exercise("first");
    const second = exercise("second");
    const completedAt = "2026-08-01T08:00:00.000Z";

    const recommendation = recommendNextStudy([first, second], [attempt(first, completedAt), attempt(second, completedAt)], null);

    expect(recommendation?.kind).toBe("review");
    expect(recommendation?.exercise).toBe(first);
  });

  it("ignores malformed completion timestamps", () => {
    const root = exercise("root");
    const dependent = exercise("dependent", [root.id]);

    expect(
      recommendNextStudy([root, dependent], [{ exerciseId: root.id, exerciseRevision: root.revision, completedAt: "not-a-date" }], root.id),
    ).toEqual({
      kind: "new-study",
      exercise: root,
      reason: { kind: "prerequisite-free" },
    });
  });

  it.each([
    {
      name: "an empty library",
      library: [] as readonly Exercise[],
    },
    {
      name: "duplicate exercise IDs",
      library: [exercise("duplicate"), exercise("duplicate")],
    },
    {
      name: "duplicate prerequisite references",
      library: [exercise("root"), exercise("dependent", ["root", "root"])],
    },
    {
      name: "a missing prerequisite",
      library: [exercise("dependent", ["missing"])],
    },
    {
      name: "a prerequisite cycle",
      library: [exercise("first", ["second"]), exercise("second", ["first"])],
    },
  ])("returns null safely for $name", ({ library }) => {
    expect(recommendNextStudy(library, [], null)).toBeNull();
  });

  it("follows the canonical direct progression after the default study", () => {
    const defaultStudy = exerciseLibrary[0]!;
    const recommendation = recommendNextStudy(exerciseLibrary, [attempt(defaultStudy, "2026-08-01T08:00:00.000Z")], defaultStudy.id);

    expect(recommendation?.kind).toBe("new-study");
    expect(recommendation?.exercise).toBe(exerciseLibrary[1]);
    expect(recommendation?.reason.kind).toBe("direct-dependent");
  });

  it.each([
    {
      patternId: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      combinedId: STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
    },
    {
      patternId: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      combinedId: STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
    },
  ])("gates $combinedId on both its untimed pattern and straight-pulse prerequisite", ({ patternId, straightPulseId, combinedId }) => {
    const pattern = requireLibraryExercise(patternId);
    const straightPulse = requireLibraryExercise(straightPulseId);
    const combined = requireLibraryExercise(combinedId);

    const patternOnly = recommendNextStudy(exerciseLibrary, [attempt(pattern, "2026-08-01T08:00:00.000Z")], pattern.id);
    const straightPulseOnly = recommendNextStudy(exerciseLibrary, [attempt(straightPulse, "2026-08-01T08:05:00.000Z")], straightPulse.id);
    expect(patternOnly?.exercise).not.toBe(combined);
    expect(straightPulseOnly?.exercise).not.toBe(combined);

    expect(
      recommendNextStudy(
        exerciseLibrary,
        [attempt(pattern, "2026-08-01T08:00:00.000Z"), attempt(straightPulse, "2026-08-01T08:05:00.000Z")],
        straightPulse.id,
      ),
    ).toEqual({
      kind: "new-study",
      exercise: combined,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [pattern.id, straightPulse.id],
      },
    });
  });

  it.each([
    {
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      evenEighthsId: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
    },
    {
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      evenEighthsId: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $evenEighthsId directly after its straight-pulse prerequisite", ({ straightPulseId, evenEighthsId }) => {
    const straightPulse = requireLibraryExercise(straightPulseId);
    const evenEighths = requireLibraryExercise(evenEighthsId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(straightPulse, "2026-08-01T08:00:00.000Z")], straightPulse.id)).toEqual({
      kind: "new-study",
      exercise: evenEighths,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [straightPulse.id],
      },
    });
  });

  it.each([
    {
      patternId: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
    },
    {
      patternId: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $chordTonesId directly after its untimed step-skip prerequisite", ({ patternId, chordTonesId }) => {
    const pattern = requireLibraryExercise(patternId);
    const chordTones = requireLibraryExercise(chordTonesId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(pattern, "2026-08-01T08:00:00.000Z")], pattern.id)).toEqual({
      kind: "new-study",
      exercise: chordTones,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [pattern.id],
      },
    });
  });

  it.each([
    {
      evenEighthsId: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
      repeatedNotesId: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
    },
    {
      evenEighthsId: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
      repeatedNotesId: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $repeatedNotesId directly after its even-eighth prerequisite", ({ evenEighthsId, repeatedNotesId }) => {
    const evenEighths = requireLibraryExercise(evenEighthsId);
    const repeatedNotes = requireLibraryExercise(repeatedNotesId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(evenEighths, "2026-08-01T08:00:00.000Z")], evenEighths.id)).toEqual({
      kind: "new-study",
      exercise: repeatedNotes,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [evenEighths.id],
      },
    });
  });
});

function requireLibraryExercise(id: string): Exercise {
  const exercise = exerciseLibrary.find((candidate) => candidate.id === id);
  if (exercise === undefined) {
    throw new Error(`Missing canonical exercise ${id}`);
  }
  return exercise;
}

function exercise(id: string, prerequisites: readonly string[] = [], revision = 1): Exercise {
  return {
    schemaVersion: 1,
    id,
    revision,
    title: id,
    instructions: `Play ${id}.`,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: [{ id: `${id}-note`, kind: "note", noteNumber: 60, hand: "right" }],
    source: { kind: "original" },
    prerequisites,
    curriculumTags: [],
    repertoireGoalTags: [],
  };
}

function attempt(exercise: Exercise, completedAt: string, exerciseRevision = exercise.revision): StudyAttemptEvidence {
  return {
    exerciseId: exercise.id,
    exerciseRevision,
    completedAt,
  };
}
