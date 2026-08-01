import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import { EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID } from "./even-eighth-exercises.js";
import {
  REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
  REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
  repeatedNotesLeftHandExercise,
  repeatedNotesRightHandExercise,
} from "./repeated-note-exercises.js";

const CURRICULUM_TAGS = [
  "patterns-and-technique.repeated-note-control",
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.repeated-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

describe("repeated-note exercises", () => {
  it.each([
    {
      exercise: repeatedNotesRightHandExercise,
      id: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 60, 62, 62, 64],
      eventIds: [
        "right-hand-repeated-note-c4-first",
        "right-hand-repeated-note-c4-second",
        "right-hand-repeated-note-d4-first",
        "right-hand-repeated-note-d4-second",
        "right-hand-repeated-note-e4",
      ],
      prerequisite: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-1-2-2-3",
    },
    {
      exercise: repeatedNotesLeftHandExercise,
      id: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 48, 50, 50, 52],
      eventIds: [
        "left-hand-repeated-note-c3-first",
        "left-hand-repeated-note-c3-second",
        "left-hand-repeated-note-d3-first",
        "left-hand-repeated-note-d3-second",
        "left-hand-repeated-note-e3",
      ],
      prerequisite: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
      fingering: "5-5-4-4-3",
    },
  ] as const)(
    "defines the canonical $hand-hand repeated-pair study",
    ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `Repeated pairs in C · ${hand} hand`,
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
      expect(exercise.instructions).toContain(`with your ${hand} hand.`);
      expect(exercise.instructions).toContain("press C twice, then D twice, and finish on E");
      expect(exercise.instructions).toContain("Keep all five presses evenly spaced on the eighth-note grid");
      expect(exercise.instructions).toContain(`Suggested fingering: ${fingering}.`);
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1, 1.5, 2]);
    },
  );
});
