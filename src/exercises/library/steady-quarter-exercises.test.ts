import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import {
  STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
  steadyQuarterLeftHandExercise,
  steadyQuarterRightHandExercise,
  steadyQuarterStepSkipLeftHandExercise,
  steadyQuarterStepSkipRightHandExercise,
} from "./steady-quarter-exercises.js";

describe("steady-quarter exercises", () => {
  it.each([
    {
      exercise: steadyQuarterRightHandExercise,
      id: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      prerequisites: ["five-note-ascent-c-major-right-hand"],
      hand: "right",
      notes: [60, 62, 64, 65, 67],
      curriculumTags: ["rhythm-and-coordination.steady-quarter-notes", "rhythm-and-coordination.hands-separately"],
    },
    {
      exercise: steadyQuarterLeftHandExercise,
      id: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      prerequisites: ["five-note-ascent-c-major-left-hand"],
      hand: "left",
      notes: [48, 50, 52, 53, 55],
      curriculumTags: ["rhythm-and-coordination.steady-quarter-notes", "rhythm-and-coordination.hands-separately"],
    },
    {
      exercise: steadyQuarterStepSkipRightHandExercise,
      id: STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      prerequisites: ["step-skip-c-major-right-hand", STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID],
      hand: "right",
      notes: [60, 64, 62, 65, 67],
      curriculumTags: [
        "rhythm-and-coordination.steady-quarter-notes",
        "rhythm-and-coordination.hands-separately",
        "notes-and-reading.interval-recognition",
        "patterns-and-technique.step-skip-coordination",
      ],
    },
    {
      exercise: steadyQuarterStepSkipLeftHandExercise,
      id: STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      prerequisites: ["step-skip-c-major-left-hand", STEADY_QUARTER_LEFT_HAND_EXERCISE_ID],
      hand: "left",
      notes: [48, 52, 50, 53, 55],
      curriculumTags: [
        "rhythm-and-coordination.steady-quarter-notes",
        "rhythm-and-coordination.hands-separately",
        "notes-and-reading.interval-recognition",
        "patterns-and-technique.step-skip-coordination",
      ],
    },
  ] as const)(
    "defines the canonical $hand-hand steady-quarter study $id",
    ({ exercise, id, prerequisites, hand, notes, curriculumTags }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        evaluationMode: "timed-ordered-notes",
        timing: DEFAULT_TIMED_EXERCISE_TIMING,
        difficulty: "beginner",
        source: { kind: "original" },
        prerequisites,
        curriculumTags,
        repertoireGoalTags: [],
      });
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4]);
    },
  );
});
