import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import {
  STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
  steadyBrokenChordLeftHandExercise,
  steadyBrokenChordRightHandExercise,
} from "./steady-broken-chord-exercises.js";
import { STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID } from "./steady-quarter-exercises.js";

const CURRICULUM_TAGS = [
  "patterns-and-technique.broken-chord-patterns",
  "patterns-and-technique.chord-tone-patterns",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "notes-and-reading.interval-recognition",
] as const;

describe("steady broken-chord exercises", () => {
  it.each([
    {
      exercise: steadyBrokenChordRightHandExercise,
      id: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 64, 67, 64, 60, 64, 67, 64],
      eventIds: [
        "right-hand-steady-broken-chord-c4-first",
        "right-hand-steady-broken-chord-e4-first",
        "right-hand-steady-broken-chord-g4-first",
        "right-hand-steady-broken-chord-e4-second",
        "right-hand-steady-broken-chord-c4-second",
        "right-hand-steady-broken-chord-e4-third",
        "right-hand-steady-broken-chord-g4-second",
        "right-hand-steady-broken-chord-e4-fourth",
      ],
      prerequisites: [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID],
      fingering: "1-3-5-3-1-3-5-3",
    },
    {
      exercise: steadyBrokenChordLeftHandExercise,
      id: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 52, 55, 52, 48, 52, 55, 52],
      eventIds: [
        "left-hand-steady-broken-chord-c3-first",
        "left-hand-steady-broken-chord-e3-first",
        "left-hand-steady-broken-chord-g3-first",
        "left-hand-steady-broken-chord-e3-second",
        "left-hand-steady-broken-chord-c3-second",
        "left-hand-steady-broken-chord-e3-third",
        "left-hand-steady-broken-chord-g3-second",
        "left-hand-steady-broken-chord-e3-fourth",
      ],
      prerequisites: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_LEFT_HAND_EXERCISE_ID],
      fingering: "5-3-1-3-5-3-1-3",
    },
  ] as const)(
    "defines the canonical $hand-hand steady broken-chord study",
    ({ exercise, id, hand, notes, eventIds, prerequisites, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `Steady broken chord in C · ${hand} hand`,
        evaluationMode: "timed-ordered-notes",
        timing: DEFAULT_TIMED_EXERCISE_TIMING,
        difficulty: "beginner",
        source: {
          kind: "original",
          attribution: "Original exercise created for learn-piano",
        },
        prerequisites,
        curriculumTags: CURRICULUM_TAGS,
        repertoireGoalTags: [],
      });
      expect(exercise.instructions).toBe(
        `After the four-beat count-in, play C-E-G-E-C-E-G-E as steady quarter notes with your ${hand} hand. Keep one note on each click. Count 1 2 3 4, 1 2 3 4. Suggested fingering: ${fingering}.`,
      );
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(new Set(eventIds)).toHaveLength(eventIds.length);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 8 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    },
  );
});
