import { describe, expect, it } from "vitest";
import { parseExerciseLibrary } from "../schema.js";
import {
  FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID,
  FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID,
  STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "./beginner-five-note-exercises.js";
import { DEFAULT_EXERCISE_ID, defaultExercise, exerciseLibrary, findExerciseById } from "./index.js";

const EXPECTED_SEQUENCES = new Map<string, readonly number[]>([
  ["five-note-ascent-c-major-right-hand", [60, 62, 64, 65, 67]],
  [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, [67, 65, 64, 62, 60]],
  [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID, [48, 50, 52, 53, 55]],
  [FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID, [55, 53, 52, 50, 48]],
  [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, [60, 64, 62, 65, 67]],
  [STEP_SKIP_LEFT_HAND_EXERCISE_ID, [48, 52, 50, 53, 55]],
]);

const EXPECTED_FINGERINGS = new Map<string, string>([
  ["five-note-ascent-c-major-right-hand", "1-2-3-4-5"],
  [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID, "1-2-3-4-5"],
  [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, "1-3-2-4-5"],
  [STEP_SKIP_LEFT_HAND_EXERCISE_ID, "5-3-4-2-1"],
]);

describe("beginner exercise library", () => {
  it("exposes six stable identities with the original ascent as default", () => {
    expect(exerciseLibrary.map(({ id, revision }) => [id, revision])).toEqual([...EXPECTED_SEQUENCES.keys()].map((id) => [id, 1]));
    expect(new Set(exerciseLibrary.map(({ id }) => id))).toHaveLength(6);
    expect(DEFAULT_EXERCISE_ID).toBe("five-note-ascent-c-major-right-hand");
    expect(defaultExercise.id).toBe(DEFAULT_EXERCISE_ID);
    expect(findExerciseById(DEFAULT_EXERCISE_ID)).toBe(defaultExercise);
  });

  it("resolves known IDs and returns null for an unknown ID", () => {
    for (const exercise of exerciseLibrary) {
      expect(findExerciseById(exercise.id)).toBe(exercise);
    }

    expect(findExerciseById("missing-exercise")).toBeNull();
  });

  it("keeps every document valid, original, beginner-level, and untimed", () => {
    expect(() => parseExerciseLibrary(exerciseLibrary)).not.toThrow();

    for (const exercise of exerciseLibrary) {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        revision: 1,
        difficulty: "beginner",
        evaluationMode: "untimed-ordered-notes",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        repertoireGoalTags: [],
      });
    }
  });

  it("uses exactly five distinct pitches and event IDs per exercise", () => {
    for (const exercise of exerciseLibrary) {
      const pitches = exercise.expectedEvents.map(({ noteNumber }) => noteNumber);
      const eventIds = exercise.expectedEvents.map(({ id }) => id);

      expect(pitches).toHaveLength(5);
      expect(new Set(pitches)).toHaveLength(5);
      expect(new Set(eventIds)).toHaveLength(5);
      expect(pitches).toEqual(EXPECTED_SEQUENCES.get(exercise.id));
    }
  });

  it("names the assigned hand and offers conventional C-position fingering", () => {
    for (const exercise of exerciseLibrary) {
      const hand = exercise.expectedEvents[0]!.hand;

      expect(exercise.title.toLowerCase()).toContain(`${hand} hand`);
      expect(exercise.instructions.toLowerCase()).toContain(`${hand} hand`);
      expect(exercise.instructions).toContain(`Suggested fingering: ${EXPECTED_FINGERINGS.get(exercise.id)}.`);
    }
  });

  it("covers both hands, ascending and descending motion, and step-skip patterns", () => {
    const leftHandExercises = exerciseLibrary.filter((exercise) => exercise.expectedEvents.every(({ hand }) => hand === "left"));
    expect(leftHandExercises).toHaveLength(3);

    expect(findExerciseById(FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID)?.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([
      67, 65, 64, 62, 60,
    ]);
    expect(findExerciseById(FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID)?.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([
      55, 53, 52, 50, 48,
    ]);

    for (const id of [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, STEP_SKIP_LEFT_HAND_EXERCISE_ID]) {
      const pitches = findExerciseById(id)?.expectedEvents.map(({ noteNumber }) => noteNumber) ?? [];
      const intervals = pitches.slice(1).map((pitch, index) => Math.abs(pitch - pitches[index]!));

      expect(intervals.some((interval) => interval <= 2)).toBe(true);
      expect(intervals.some((interval) => interval >= 3)).toBe(true);
    }
  });

  it("references only exercises that exist in the same starter library", () => {
    for (const exercise of exerciseLibrary) {
      for (const prerequisite of exercise.prerequisites) {
        expect(findExerciseById(prerequisite), `${exercise.id} prerequisite ${prerequisite}`).not.toBeNull();
      }
    }
  });
});
