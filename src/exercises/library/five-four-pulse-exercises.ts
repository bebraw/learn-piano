import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand, type ExerciseTiming } from "../types.js";
import {
  THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
} from "./three-four-broken-chord-exercises.js";

interface FiveFourPulsePitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

type FiveFourPulsePitches = readonly [
  FiveFourPulsePitch,
  FiveFourPulsePitch,
  FiveFourPulsePitch,
  FiveFourPulsePitch,
  FiveFourPulsePitch,
  FiveFourPulsePitch,
];

interface FiveFourPulseExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: FiveFourPulsePitches;
  readonly prerequisite: string;
}

const FIVE_FOUR_PULSE_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  beatsPerMeasure: 5,
  countInBeats: 5,
} as const satisfies ExerciseTiming;

const RIGHT_HAND_FIVE_FOUR_PULSE = [
  { eventToken: "c4-first", noteNumber: 60, beatOffset: 0 },
  { eventToken: "d4", noteNumber: 62, beatOffset: 1 },
  { eventToken: "e4", noteNumber: 64, beatOffset: 2 },
  { eventToken: "f4", noteNumber: 65, beatOffset: 3 },
  { eventToken: "g4", noteNumber: 67, beatOffset: 4 },
  { eventToken: "c4-second", noteNumber: 60, beatOffset: 5 },
] as const satisfies FiveFourPulsePitches;

const LEFT_HAND_FIVE_FOUR_PULSE = [
  { eventToken: "c3-first", noteNumber: 48, beatOffset: 0 },
  { eventToken: "d3", noteNumber: 50, beatOffset: 1 },
  { eventToken: "e3", noteNumber: 52, beatOffset: 2 },
  { eventToken: "f3", noteNumber: 53, beatOffset: 3 },
  { eventToken: "g3", noteNumber: 55, beatOffset: 4 },
  { eventToken: "c3-second", noteNumber: 48, beatOffset: 5 },
] as const satisfies FiveFourPulsePitches;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.five-four-meter",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "notes-and-reading.keyboard-geography",
  "patterns-and-technique.five-finger-patterns",
] as const;

function createFiveFourPulseExercise(definition: FiveFourPulseExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: FIVE_FOUR_PULSE_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-five-four-pulse-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
      beatOffset,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: [definition.prerequisite],
    curriculumTags: CURRICULUM_TAGS,
    repertoireGoalTags: [],
  });
}

export const FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID = "five-four-pulse-c-major-right-hand";

export const fiveFourPulseRightHandExercise = createFiveFourPulseExercise({
  id: FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID,
  title: "Five-count pulse in C · right hand",
  instructions:
    "After the five-beat count-in, play C-D-E-F-G, then return to C on the next beat 1 as steady quarter notes with your right hand. Count 1 2 3 4 5, 1. Suggested fingering: 1-2-3-4-5-1.",
  hand: "right",
  pitches: RIGHT_HAND_FIVE_FOUR_PULSE,
  prerequisite: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
});

export const FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID = "five-four-pulse-c-major-left-hand";

export const fiveFourPulseLeftHandExercise = createFiveFourPulseExercise({
  id: FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID,
  title: "Five-count pulse in C · left hand",
  instructions:
    "After the five-beat count-in, play C-D-E-F-G, then return to C on the next beat 1 as steady quarter notes with your left hand. Count 1 2 3 4 5, 1. Suggested fingering: 5-4-3-2-1-5.",
  hand: "left",
  pitches: LEFT_HAND_FIVE_FOUR_PULSE,
  prerequisite: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
});
