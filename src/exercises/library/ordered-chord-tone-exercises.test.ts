import { describe, expect, it } from "vitest";
import { STEP_SKIP_LEFT_HAND_EXERCISE_ID, STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "./beginner-five-note-exercises.js";
import {
  ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  orderedChordTonesLeftHandExercise,
  orderedChordTonesRightHandExercise,
} from "./ordered-chord-tone-exercises.js";

const CURRICULUM_TAGS = [
  "patterns-and-technique.chord-tone-patterns",
  "notes-and-reading.interval-recognition",
  "rhythm-and-coordination.hands-separately",
] as const;

describe("ordered chord-tone exercises", () => {
  it.each([
    {
      exercise: orderedChordTonesRightHandExercise,
      id: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 64, 67, 64, 60],
      eventIds: [
        "right-hand-chord-tone-c4-start",
        "right-hand-chord-tone-e4-up",
        "right-hand-chord-tone-g4-apex",
        "right-hand-chord-tone-e4-down",
        "right-hand-chord-tone-c4-return",
      ],
      prerequisite: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-3-5-3-1",
    },
    {
      exercise: orderedChordTonesLeftHandExercise,
      id: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 52, 55, 52, 48],
      eventIds: [
        "left-hand-chord-tone-c3-start",
        "left-hand-chord-tone-e3-up",
        "left-hand-chord-tone-g3-apex",
        "left-hand-chord-tone-e3-down",
        "left-hand-chord-tone-c3-return",
      ],
      prerequisite: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      fingering: "5-3-1-3-5",
    },
  ] as const)(
    "defines the canonical $hand-hand ordered chord-tone study",
    ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `C major chord tones · ${hand} hand`,
        evaluationMode: "untimed-ordered-notes",
        difficulty: "beginner",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        prerequisites: [prerequisite],
        curriculumTags: CURRICULUM_TAGS,
        repertoireGoalTags: [],
      });
      expect(exercise.timing).toBeUndefined();
      expect(exercise.instructions).toContain(`one note at a time with your ${hand} hand`);
      expect(exercise.instructions).toContain("C, E, and G are the chord tones of C major; do not play them together yet.");
      expect(exercise.instructions).toContain(`Suggested fingering: ${fingering}.`);
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([undefined, undefined, undefined, undefined, undefined]);
      expect(new Set(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).size).toBe(3);
    },
  );
});
