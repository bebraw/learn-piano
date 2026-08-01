import { describe, expect, it } from "vitest";
import {
  D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID,
  dMinorFiveNoteAscentLeftHandExercise,
  dMinorFiveNoteAscentRightHandExercise,
} from "./d-minor-five-note-exercises.js";
import {
  ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
} from "./ordered-chord-tone-exercises.js";

const CURRICULUM_TAGS = [
  "notes-and-reading.keyboard-geography",
  "notes-and-reading.interval-recognition",
  "patterns-and-technique.five-finger-patterns",
  "patterns-and-technique.minor-scale-preparation",
  "rhythm-and-coordination.hands-separately",
] as const;

describe("D-minor five-note ascent exercises", () => {
  it.each([
    {
      exercise: dMinorFiveNoteAscentRightHandExercise,
      id: D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [62, 64, 65, 67, 69],
      eventIds: [
        "right-hand-d-minor-five-note-ascent-d4",
        "right-hand-d-minor-five-note-ascent-e4",
        "right-hand-d-minor-five-note-ascent-f4",
        "right-hand-d-minor-five-note-ascent-g4",
        "right-hand-d-minor-five-note-ascent-a4",
      ],
      prerequisite: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-2-3-4-5",
    },
    {
      exercise: dMinorFiveNoteAscentLeftHandExercise,
      id: D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [50, 52, 53, 55, 57],
      eventIds: [
        "left-hand-d-minor-five-note-ascent-d3",
        "left-hand-d-minor-five-note-ascent-e3",
        "left-hand-d-minor-five-note-ascent-f3",
        "left-hand-d-minor-five-note-ascent-g3",
        "left-hand-d-minor-five-note-ascent-a3",
      ],
      prerequisite: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      fingering: "5-4-3-2-1",
    },
  ] as const)("defines the canonical $hand-hand study", ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
    expect(exercise).toMatchObject({
      schemaVersion: 1,
      id,
      revision: 1,
      title: `Five-note ascent in D minor · ${hand} hand`,
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
    expect(exercise.instructions).toBe(
      `Play D-E-F-G-A in ascending order with your ${hand} hand. Keep one finger over each white key in D position; E and F form the close half-step in this minor five-finger pattern. Suggested fingering: ${fingering}.`,
    );
    expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
    expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
    expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
    expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    expect(new Set(exercise.expectedEvents.map(({ noteNumber }) => noteNumber))).toHaveLength(5);
  });
});
