import { describe, expect, it } from "vitest";
import { STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID } from "./steady-broken-chord-exercises.js";
import {
  THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
  threeFourBrokenChordLeftHandExercise,
  threeFourBrokenChordRightHandExercise,
} from "./three-four-broken-chord-exercises.js";

const THREE_FOUR_TIMING = {
  defaultBpm: 60,
  minBpm: 40,
  maxBpm: 100,
  beatsPerMeasure: 3,
  beatUnit: 4,
  countInBeats: 3,
  timingWindowBeats: 0.2,
} as const;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.three-four-meter",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "patterns-and-technique.broken-chord-patterns",
  "patterns-and-technique.chord-tone-patterns",
  "notes-and-reading.interval-recognition",
] as const;

describe("3/4 broken-chord exercises", () => {
  it.each([
    {
      exercise: threeFourBrokenChordRightHandExercise,
      id: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 64, 67, 60, 64, 67, 60],
      eventIds: [
        "right-hand-three-four-broken-chord-c4-first",
        "right-hand-three-four-broken-chord-e4-first",
        "right-hand-three-four-broken-chord-g4-first",
        "right-hand-three-four-broken-chord-c4-second",
        "right-hand-three-four-broken-chord-e4-second",
        "right-hand-three-four-broken-chord-g4-second",
        "right-hand-three-four-broken-chord-c4-third",
      ],
      prerequisite: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-3-5-1-3-5-1",
    },
    {
      exercise: threeFourBrokenChordLeftHandExercise,
      id: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 52, 55, 48, 52, 55, 48],
      eventIds: [
        "left-hand-three-four-broken-chord-c3-first",
        "left-hand-three-four-broken-chord-e3-first",
        "left-hand-three-four-broken-chord-g3-first",
        "left-hand-three-four-broken-chord-c3-second",
        "left-hand-three-four-broken-chord-e3-second",
        "left-hand-three-four-broken-chord-g3-second",
        "left-hand-three-four-broken-chord-c3-third",
      ],
      prerequisite: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      fingering: "5-3-1-5-3-1-5",
    },
  ] as const)(
    "defines the canonical $hand-hand 3/4 broken-chord study",
    ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `Broken chord in 3/4 · ${hand} hand`,
        evaluationMode: "timed-ordered-notes",
        timing: THREE_FOUR_TIMING,
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
        `After the three-beat count-in, play C-E-G, C-E-G, then land on C as steady quarter notes with your ${hand} hand. Let each C begin a new three-beat group. Count 1 2 3, 1 2 3, 1. Suggested fingering: ${fingering}.`,
      );
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(new Set(eventIds)).toHaveLength(eventIds.length);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 7 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    },
  );
});
