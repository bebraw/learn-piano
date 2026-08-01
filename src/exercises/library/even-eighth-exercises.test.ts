import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import {
  EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
  EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
  evenEighthsLeftHandExercise,
  evenEighthsRightHandExercise,
} from "./even-eighth-exercises.js";
import { STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID } from "./steady-quarter-exercises.js";

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

describe("even-eighth exercises", () => {
  it.each([
    {
      exercise: evenEighthsRightHandExercise,
      id: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 62, 64, 65, 67],
      eventIds: ["right-hand-eighth-c4", "right-hand-eighth-d4", "right-hand-eighth-e4", "right-hand-eighth-f4", "right-hand-eighth-g4"],
      prerequisite: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-2-3-4-5",
    },
    {
      exercise: evenEighthsLeftHandExercise,
      id: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 50, 52, 53, 55],
      eventIds: ["left-hand-eighth-c3", "left-hand-eighth-d3", "left-hand-eighth-e3", "left-hand-eighth-f3", "left-hand-eighth-g3"],
      prerequisite: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      fingering: "5-4-3-2-1",
    },
  ] as const)("defines the canonical $hand-hand eighth-note study", ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
    expect(exercise).toMatchObject({
      schemaVersion: 1,
      id,
      revision: 1,
      title: `Even eighths in C · ${hand} hand`,
      evaluationMode: "timed-ordered-notes",
      timing: { ...DEFAULT_TIMED_EXERCISE_TIMING, timingWindowBeats: 0.1 },
      difficulty: "beginner",
      source: {
        kind: "original",
        attribution: "Original exercise created for learn-piano",
      },
      prerequisites: [prerequisite],
      curriculumTags: CURRICULUM_TAGS,
      repertoireGoalTags: [],
    });
    expect(exercise.instructions).toContain(`with your ${hand} hand. Count 1 & 2 & 3.`);
    expect(exercise.instructions).toContain(`Suggested fingering: ${fingering}.`);
    expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
    expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
    expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
    expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1, 1.5, 2]);
  });
});
