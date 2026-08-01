import { describe, expect, it } from "vitest";
import {
  FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID,
  FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID,
  fiveFourPulseLeftHandExercise,
  fiveFourPulseRightHandExercise,
} from "./five-four-pulse-exercises.js";
import {
  THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
} from "./three-four-broken-chord-exercises.js";

const FIVE_FOUR_TIMING = {
  defaultBpm: 60,
  minBpm: 40,
  maxBpm: 100,
  beatsPerMeasure: 5,
  beatUnit: 4,
  countInBeats: 5,
  timingWindowBeats: 0.2,
} as const;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.five-four-meter",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "notes-and-reading.keyboard-geography",
  "patterns-and-technique.five-finger-patterns",
] as const;

describe("5/4 pulse exercises", () => {
  it.each([
    {
      exercise: fiveFourPulseRightHandExercise,
      id: FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID,
      expectedId: "five-four-pulse-c-major-right-hand",
      hand: "right",
      notes: [60, 62, 64, 65, 67, 60],
      eventIds: [
        "right-hand-five-four-pulse-c4-first",
        "right-hand-five-four-pulse-d4",
        "right-hand-five-four-pulse-e4",
        "right-hand-five-four-pulse-f4",
        "right-hand-five-four-pulse-g4",
        "right-hand-five-four-pulse-c4-second",
      ],
      prerequisite: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-2-3-4-5-1",
    },
    {
      exercise: fiveFourPulseLeftHandExercise,
      id: FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID,
      expectedId: "five-four-pulse-c-major-left-hand",
      hand: "left",
      notes: [48, 50, 52, 53, 55, 48],
      eventIds: [
        "left-hand-five-four-pulse-c3-first",
        "left-hand-five-four-pulse-d3",
        "left-hand-five-four-pulse-e3",
        "left-hand-five-four-pulse-f3",
        "left-hand-five-four-pulse-g3",
        "left-hand-five-four-pulse-c3-second",
      ],
      prerequisite: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      fingering: "5-4-3-2-1-5",
    },
  ] as const)(
    "defines the canonical $hand-hand 5/4 pulse study",
    ({ exercise, id, expectedId, hand, notes, eventIds, prerequisite, fingering }) => {
      expect(id).toBe(expectedId);
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id: expectedId,
        revision: 1,
        title: `Five-count pulse in C · ${hand} hand`,
        evaluationMode: "timed-ordered-notes",
        timing: FIVE_FOUR_TIMING,
        difficulty: "beginner",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        prerequisites: [prerequisite],
        curriculumTags: CURRICULUM_TAGS,
        repertoireGoalTags: [],
      });
      expect(exercise.instructions).toBe(
        `After the five-beat count-in, play C-D-E-F-G, then return to C on the next beat 1 as steady quarter notes with your ${hand} hand. Count 1 2 3 4 5, 1. Suggested fingering: ${fingering}.`,
      );
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(new Set(eventIds)).toHaveLength(eventIds.length);
      expect(exercise.expectedEvents.map(({ kind }) => kind)).toEqual(Array.from({ length: 6 }, () => "note"));
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 6 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4, 5]);
    },
  );
});
