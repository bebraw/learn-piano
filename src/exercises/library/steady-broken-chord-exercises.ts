import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import { STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID } from "./steady-quarter-exercises.js";

interface SteadyBrokenChordPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

type SteadyBrokenChordPitches = readonly [
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
  SteadyBrokenChordPitch,
];

interface SteadyBrokenChordExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: SteadyBrokenChordPitches;
  readonly prerequisites: readonly [string, string];
}

const RIGHT_HAND_STEADY_BROKEN_CHORD = [
  { eventToken: "c4-first", noteNumber: 60, beatOffset: 0 },
  { eventToken: "e4-first", noteNumber: 64, beatOffset: 1 },
  { eventToken: "g4-first", noteNumber: 67, beatOffset: 2 },
  { eventToken: "e4-second", noteNumber: 64, beatOffset: 3 },
  { eventToken: "c4-second", noteNumber: 60, beatOffset: 4 },
  { eventToken: "e4-third", noteNumber: 64, beatOffset: 5 },
  { eventToken: "g4-second", noteNumber: 67, beatOffset: 6 },
  { eventToken: "e4-fourth", noteNumber: 64, beatOffset: 7 },
] as const satisfies SteadyBrokenChordPitches;

const LEFT_HAND_STEADY_BROKEN_CHORD = [
  { eventToken: "c3-first", noteNumber: 48, beatOffset: 0 },
  { eventToken: "e3-first", noteNumber: 52, beatOffset: 1 },
  { eventToken: "g3-first", noteNumber: 55, beatOffset: 2 },
  { eventToken: "e3-second", noteNumber: 52, beatOffset: 3 },
  { eventToken: "c3-second", noteNumber: 48, beatOffset: 4 },
  { eventToken: "e3-third", noteNumber: 52, beatOffset: 5 },
  { eventToken: "g3-second", noteNumber: 55, beatOffset: 6 },
  { eventToken: "e3-fourth", noteNumber: 52, beatOffset: 7 },
] as const satisfies SteadyBrokenChordPitches;

const CURRICULUM_TAGS = [
  "patterns-and-technique.broken-chord-patterns",
  "patterns-and-technique.chord-tone-patterns",
  "rhythm-and-coordination.steady-quarter-notes",
  "rhythm-and-coordination.hands-separately",
  "notes-and-reading.interval-recognition",
] as const;

function createSteadyBrokenChordExercise(definition: SteadyBrokenChordExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: DEFAULT_TIMED_EXERCISE_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-steady-broken-chord-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
      beatOffset,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: definition.prerequisites,
    curriculumTags: CURRICULUM_TAGS,
    repertoireGoalTags: [],
  });
}

export const STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID = "steady-quarter-broken-chord-c-major-right-hand";

export const steadyBrokenChordRightHandExercise = createSteadyBrokenChordExercise({
  id: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
  title: "Steady broken chord in C · right hand",
  instructions:
    "After the four-beat count-in, play C-E-G-E-C-E-G-E as steady quarter notes with your right hand. Keep one note on each click. Count 1 2 3 4, 1 2 3 4. Suggested fingering: 1-3-5-3-1-3-5-3.",
  hand: "right",
  pitches: RIGHT_HAND_STEADY_BROKEN_CHORD,
  prerequisites: [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID],
});

export const STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID = "steady-quarter-broken-chord-c-major-left-hand";

export const steadyBrokenChordLeftHandExercise = createSteadyBrokenChordExercise({
  id: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  title: "Steady broken chord in C · left hand",
  instructions:
    "After the four-beat count-in, play C-E-G-E-C-E-G-E as steady quarter notes with your left hand. Keep one note on each click. Count 1 2 3 4, 1 2 3 4. Suggested fingering: 5-3-1-3-5-3-1-3.",
  hand: "left",
  pitches: LEFT_HAND_STEADY_BROKEN_CHORD,
  prerequisites: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_LEFT_HAND_EXERCISE_ID],
});
