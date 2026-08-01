import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand, type ExerciseTiming } from "../types.js";
import { STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID, STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID } from "./steady-broken-chord-exercises.js";

interface ThreeFourBrokenChordPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

type ThreeFourBrokenChordPitches = readonly [
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
  ThreeFourBrokenChordPitch,
];

interface ThreeFourBrokenChordExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: ThreeFourBrokenChordPitches;
  readonly prerequisite: string;
}

const THREE_FOUR_BROKEN_CHORD_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  beatsPerMeasure: 3,
  countInBeats: 3,
} as const satisfies ExerciseTiming;

const RIGHT_HAND_THREE_FOUR_BROKEN_CHORD = [
  { eventToken: "c4-first", noteNumber: 60, beatOffset: 0 },
  { eventToken: "e4-first", noteNumber: 64, beatOffset: 1 },
  { eventToken: "g4-first", noteNumber: 67, beatOffset: 2 },
  { eventToken: "c4-second", noteNumber: 60, beatOffset: 3 },
  { eventToken: "e4-second", noteNumber: 64, beatOffset: 4 },
  { eventToken: "g4-second", noteNumber: 67, beatOffset: 5 },
  { eventToken: "c4-third", noteNumber: 60, beatOffset: 6 },
] as const satisfies ThreeFourBrokenChordPitches;

const LEFT_HAND_THREE_FOUR_BROKEN_CHORD = [
  { eventToken: "c3-first", noteNumber: 48, beatOffset: 0 },
  { eventToken: "e3-first", noteNumber: 52, beatOffset: 1 },
  { eventToken: "g3-first", noteNumber: 55, beatOffset: 2 },
  { eventToken: "c3-second", noteNumber: 48, beatOffset: 3 },
  { eventToken: "e3-second", noteNumber: 52, beatOffset: 4 },
  { eventToken: "g3-second", noteNumber: 55, beatOffset: 5 },
  { eventToken: "c3-third", noteNumber: 48, beatOffset: 6 },
] as const satisfies ThreeFourBrokenChordPitches;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.three-four-meter",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "patterns-and-technique.broken-chord-patterns",
  "patterns-and-technique.chord-tone-patterns",
  "notes-and-reading.interval-recognition",
] as const;

function createThreeFourBrokenChordExercise(definition: ThreeFourBrokenChordExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: THREE_FOUR_BROKEN_CHORD_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-three-four-broken-chord-${eventToken}`,
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

export const THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID = "three-four-broken-chord-c-major-right-hand";

export const threeFourBrokenChordRightHandExercise = createThreeFourBrokenChordExercise({
  id: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
  title: "Broken chord in 3/4 · right hand",
  instructions:
    "After the three-beat count-in, play C-E-G, C-E-G, then land on C as steady quarter notes with your right hand. Let each C begin a new three-beat group. Count 1 2 3, 1 2 3, 1. Suggested fingering: 1-3-5-1-3-5-1.",
  hand: "right",
  pitches: RIGHT_HAND_THREE_FOUR_BROKEN_CHORD,
  prerequisite: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
});

export const THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID = "three-four-broken-chord-c-major-left-hand";

export const threeFourBrokenChordLeftHandExercise = createThreeFourBrokenChordExercise({
  id: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  title: "Broken chord in 3/4 · left hand",
  instructions:
    "After the three-beat count-in, play C-E-G, C-E-G, then land on C as steady quarter notes with your left hand. Let each C begin a new three-beat group. Count 1 2 3, 1 2 3, 1. Suggested fingering: 5-3-1-5-3-1-5.",
  hand: "left",
  pitches: LEFT_HAND_THREE_FOUR_BROKEN_CHORD,
  prerequisite: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
});
