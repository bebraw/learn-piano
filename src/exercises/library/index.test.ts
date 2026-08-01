import { describe, expect, it } from "vitest";
import { parseExerciseLibrary } from "../schema.js";
import {
  FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID,
  FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID,
  STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "./beginner-five-note-exercises.js";
import { EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID } from "./even-eighth-exercises.js";
import { DEFAULT_EXERCISE_ID, defaultExercise, exerciseLibrary, findExerciseById } from "./index.js";
import {
  MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
} from "./mixed-eighth-pattern-exercises.js";
import { OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID, OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "./offbeat-step-skip-exercises.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import { REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID } from "./repeated-note-exercises.js";
import {
  STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "./steady-quarter-exercises.js";
import { STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID } from "./steady-broken-chord-exercises.js";
import {
  THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
} from "./three-four-broken-chord-exercises.js";

const EXPECTED_SEQUENCES = new Map<string, readonly number[]>([
  ["five-note-ascent-c-major-right-hand", [60, 62, 64, 65, 67]],
  [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, [67, 65, 64, 62, 60]],
  [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID, [48, 50, 52, 53, 55]],
  [FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID, [55, 53, 52, 50, 48]],
  [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, [60, 64, 62, 65, 67]],
  [STEP_SKIP_LEFT_HAND_EXERCISE_ID, [48, 52, 50, 53, 55]],
  [STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID, [60, 62, 64, 65, 67]],
  [STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, [48, 50, 52, 53, 55]],
  [STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID, [60, 64, 62, 65, 67]],
  [STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID, [48, 52, 50, 53, 55]],
  [EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID, [60, 62, 64, 65, 67]],
  [EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, [48, 50, 52, 53, 55]],
  [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID, [60, 64, 67, 64, 60]],
  [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, [48, 52, 55, 52, 48]],
  [STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID, [60, 64, 67, 64, 60, 64, 67, 64]],
  [STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, [48, 52, 55, 52, 48, 52, 55, 52]],
  [THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID, [60, 64, 67, 60, 64, 67, 60]],
  [THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, [48, 52, 55, 48, 52, 55, 48]],
  [REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID, [60, 60, 62, 62, 64]],
  [REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, [48, 48, 50, 50, 52]],
  [MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID, [60, 64, 62, 62, 65, 67, 64, 60]],
  [MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID, [48, 52, 50, 50, 53, 55, 52, 48]],
  [OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID, [60, 64, 62, 65, 67]],
  [OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID, [48, 52, 50, 53, 55]],
]);

const EXPECTED_FINGERINGS = new Map<string, string>([
  ["five-note-ascent-c-major-right-hand", "1-2-3-4-5"],
  [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID, "1-2-3-4-5"],
  [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, "1-3-2-4-5"],
  [STEP_SKIP_LEFT_HAND_EXERCISE_ID, "5-3-4-2-1"],
  [STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID, "1-2-3-4-5"],
  [STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID, "1-3-2-4-5"],
  [STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID, "5-3-4-2-1"],
  [EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID, "1-2-3-4-5"],
  [EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, "5-4-3-2-1"],
  [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID, "1-3-5-3-1"],
  [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, "5-3-1-3-5"],
  [REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID, "1-1-2-2-3"],
  [REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, "5-5-4-4-3"],
  [MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID, "1-3-2-2-4-5-3-1"],
  [MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID, "5-3-4-4-2-1-3-5"],
  [OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID, "1-3-2-4-5"],
  [OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID, "5-3-4-2-1"],
  [STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID, "1-3-5-3-1-3-5-3"],
  [STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, "5-3-1-3-5-3-1-3"],
  [THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID, "1-3-5-1-3-5-1"],
  [THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, "5-3-1-5-3-1-5"],
]);

describe("beginner exercise library", () => {
  it("exposes twenty-four stable identities with the original ascent as default", () => {
    expect(exerciseLibrary.map(({ id, revision }) => [id, revision])).toEqual([...EXPECTED_SEQUENCES.keys()].map((id) => [id, 1]));
    expect(new Set(exerciseLibrary.map(({ id }) => id))).toHaveLength(24);
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

  it("keeps every document valid, original, beginner-level, and explicitly evaluated", () => {
    expect(() => parseExerciseLibrary(exerciseLibrary)).not.toThrow();

    for (const exercise of exerciseLibrary) {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        revision: 1,
        difficulty: "beginner",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        repertoireGoalTags: [],
      });
      expect(["untimed-ordered-notes", "timed-ordered-notes"]).toContain(exercise.evaluationMode);
    }
  });

  it("uses unique event occurrences and each exercise's declared pitch sequence", () => {
    for (const exercise of exerciseLibrary) {
      const pitches = exercise.expectedEvents.map(({ noteNumber }) => noteNumber);
      const eventIds = exercise.expectedEvents.map(({ id }) => id);
      const expectedSequence = EXPECTED_SEQUENCES.get(exercise.id);

      expect(pitches).toEqual(expectedSequence);
      expect(new Set(eventIds)).toHaveLength(pitches.length);
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

  it("covers both hands, motion, step-skip patterns, subdivision, repeated pairs, mixed patterns, offbeats, broken chords, and 3/4", () => {
    const rightHandExercises = exerciseLibrary.filter((exercise) => exercise.expectedEvents.every(({ hand }) => hand === "right"));
    const leftHandExercises = exerciseLibrary.filter((exercise) => exercise.expectedEvents.every(({ hand }) => hand === "left"));
    expect(rightHandExercises).toHaveLength(12);
    expect(leftHandExercises).toHaveLength(12);

    expect(findExerciseById(FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID)?.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([
      67, 65, 64, 62, 60,
    ]);
    expect(findExerciseById(FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID)?.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([
      55, 53, 52, 50, 48,
    ]);

    for (const id of [
      STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
    ]) {
      const pitches = findExerciseById(id)?.expectedEvents.map(({ noteNumber }) => noteNumber) ?? [];
      const intervals = pitches.slice(1).map((pitch, index) => Math.abs(pitch - pitches[index]!));

      expect(intervals.some((interval) => interval <= 2)).toBe(true);
      expect(intervals.some((interval) => interval >= 3)).toBe(true);
    }

    expect(exerciseLibrary.filter(({ evaluationMode }) => evaluationMode === "timed-ordered-notes")).toHaveLength(16);
    expect(exerciseLibrary.filter(({ evaluationMode }) => evaluationMode === "untimed-ordered-notes")).toHaveLength(8);
  });

  it.each([
    {
      id: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      prerequisite: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
    },
    {
      id: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      prerequisite: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
    },
  ])("requires the matching steady broken-chord study for $id", ({ id, prerequisite }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual([prerequisite]);
  });

  it.each([
    {
      id: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      prerequisites: [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID],
    },
    {
      id: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      prerequisites: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_LEFT_HAND_EXERCISE_ID],
    },
  ])("requires matching chord-tone and straight steady-quarter studies for $id", ({ id, prerequisites }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual(prerequisites);
  });

  it.each([
    {
      id: OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      prerequisite: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
    },
    {
      id: OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      prerequisite: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
    },
  ])("requires the matching mixed eighth-pattern study for $id", ({ id, prerequisite }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual([prerequisite]);
  });

  it.each([
    {
      id: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      prerequisites: [REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
    },
    {
      id: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      prerequisites: [REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID],
    },
  ])("requires both the matching repeated-note and ordered chord-tone studies for $id", ({ id, prerequisites }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual(prerequisites);
  });

  it.each([
    {
      id: STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      prerequisites: [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID],
    },
    {
      id: STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      prerequisites: [STEP_SKIP_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_LEFT_HAND_EXERCISE_ID],
    },
  ])("requires both the matching untimed pattern and straight steady-quarter study for $id", ({ id, prerequisites }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual(prerequisites);
  });

  it.each([
    {
      id: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
      prerequisite: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
    },
    {
      id: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
      prerequisite: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
    },
  ])("requires the matching straight steady-quarter study for $id", ({ id, prerequisite }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual([prerequisite]);
  });

  it.each([
    {
      id: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
      prerequisite: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
    },
    {
      id: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
      prerequisite: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
    },
  ])("requires the matching even-eighth study for $id", ({ id, prerequisite }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual([prerequisite]);
  });

  it.each([
    {
      id: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      prerequisite: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
    },
    {
      id: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      prerequisite: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
    },
  ])("requires the matching untimed step-skip study for $id", ({ id, prerequisite }) => {
    expect(findExerciseById(id)?.prerequisites).toEqual([prerequisite]);
  });

  it("references only exercises that exist in the same starter library", () => {
    for (const exercise of exerciseLibrary) {
      for (const prerequisite of exercise.prerequisites) {
        expect(findExerciseById(prerequisite), `${exercise.id} prerequisite ${prerequisite}`).not.toBeNull();
      }
    }
  });
});
