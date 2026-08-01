import { describe, expect, it } from "vitest";
import { DEFAULT_TIMED_EXERCISE_TIMING } from "../types.js";
import {
  MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
} from "./mixed-eighth-pattern-exercises.js";
import {
  OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
  offbeatStepSkipLeftHandExercise,
  offbeatStepSkipRightHandExercise,
} from "./offbeat-step-skip-exercises.js";

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.offbeat-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
  "patterns-and-technique.step-skip-coordination",
  "notes-and-reading.interval-recognition",
] as const;

describe("offbeat step-skip exercises", () => {
  it.each([
    {
      exercise: offbeatStepSkipRightHandExercise,
      id: OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      hand: "right",
      notes: [60, 64, 62, 65, 67],
      eventIds: [
        "right-hand-offbeat-step-skip-c4-anchor",
        "right-hand-offbeat-step-skip-e4-first-offbeat",
        "right-hand-offbeat-step-skip-d4-second-offbeat",
        "right-hand-offbeat-step-skip-f4-third-offbeat",
        "right-hand-offbeat-step-skip-g4-fourth-offbeat",
      ],
      prerequisite: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      fingering: "1-3-2-4-5",
    },
    {
      exercise: offbeatStepSkipLeftHandExercise,
      id: OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      hand: "left",
      notes: [48, 52, 50, 53, 55],
      eventIds: [
        "left-hand-offbeat-step-skip-c3-anchor",
        "left-hand-offbeat-step-skip-e3-first-offbeat",
        "left-hand-offbeat-step-skip-d3-second-offbeat",
        "left-hand-offbeat-step-skip-f3-third-offbeat",
        "left-hand-offbeat-step-skip-g3-fourth-offbeat",
      ],
      prerequisite: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      fingering: "5-3-4-2-1",
    },
  ] as const)(
    "defines the canonical $hand-hand offbeat step-skip study",
    ({ exercise, id, hand, notes, eventIds, prerequisite, fingering }) => {
      expect(exercise).toMatchObject({
        schemaVersion: 1,
        id,
        revision: 1,
        title: `Offbeat step and skip in C · ${hand} hand`,
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
      expect(exercise.instructions).toBe(
        `After the four-beat count-in, play C on beat 1, then E-D-F-G on the four “and” counts between quarter-note clicks with your ${hand} hand. Count 1 & 2 & 3 & 4 &. Suggested fingering: ${fingering}.`,
      );
      expect(exercise.expectedEvents.map(({ id: eventId }) => eventId)).toEqual(eventIds);
      expect(new Set(eventIds)).toHaveLength(eventIds.length);
      expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(notes);
      expect(exercise.expectedEvents.map(({ hand: eventHand }) => eventHand)).toEqual(Array.from({ length: 5 }, () => hand));
      expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1.5, 2.5, 3.5]);
    },
  );
});
