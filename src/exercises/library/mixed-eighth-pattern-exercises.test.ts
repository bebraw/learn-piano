import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import {
  MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
  mixedEighthPatternLeftHandExercise,
  mixedEighthPatternRightHandExercise,
} from "./mixed-eighth-pattern-exercises.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import { REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID } from "./repeated-note-exercises.js";

const CURRICULUM_TAGS = [
  "patterns-and-technique.mixed-patterns",
  "patterns-and-technique.step-skip-coordination",
  "patterns-and-technique.chord-tone-patterns",
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.repeated-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

describe("mixed eighth-pattern exercises", () => {
  it.each([
    {
      exercise: mixedEighthPatternRightHandExercise,
      id: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 64, 62, 62, 65, 67, 64, 60],
      eventIds: [
        "right-hand-mixed-eighth-c4-start",
        "right-hand-mixed-eighth-e4-up",
        "right-hand-mixed-eighth-d4-first",
        "right-hand-mixed-eighth-d4-repeat",
        "right-hand-mixed-eighth-f4-up",
        "right-hand-mixed-eighth-g4-apex",
        "right-hand-mixed-eighth-e4-return",
        "right-hand-mixed-eighth-c4-close",
      ],
      prerequisites: [REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
      fingering: "1-3-2-2-4-5-3-1",
    },
    {
      exercise: mixedEighthPatternLeftHandExercise,
      id: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 52, 50, 50, 53, 55, 52, 48],
      eventIds: [
        "left-hand-mixed-eighth-c3-start",
        "left-hand-mixed-eighth-e3-up",
        "left-hand-mixed-eighth-d3-first",
        "left-hand-mixed-eighth-d3-repeat",
        "left-hand-mixed-eighth-f3-up",
        "left-hand-mixed-eighth-g3-apex",
        "left-hand-mixed-eighth-e3-return",
        "left-hand-mixed-eighth-c3-close",
      ],
      prerequisites: [REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID],
      fingering: "5-3-4-4-2-1-3-5",
    },
  ] as const)(
    "defines the canonical $hand-hand mixed eighth pattern",
    ({ exercise, id, hand, notes, eventIds, prerequisites, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `Mixed eighth pattern in C · ${hand} hand`,
        evaluationMode: "timed-ordered-notes",
        timing: { ...DEFAULT_TIMED_EXERCISE_TIMING, timingWindowBeats: 0.1 },
        difficulty: "beginner",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        prerequisites,
        curriculumTags: CURRICULUM_TAGS,
        repertoireGoalTags: [],
      });
      expect(exercise.instructions).toContain(`with your ${hand} hand.`);
      expect(exercise.instructions).toContain("Count 1 & 2 & 3 & 4 &.");
      expect(exercise.instructions).toContain(`Suggested fingering: ${fingering}.`);
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(new Set(eventIds)).toHaveLength(eventIds.length);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 8 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    },
  );
});
