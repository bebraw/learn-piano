import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import { FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID } from "./beginner-five-note-exercises.js";
import { FIVE_NOTE_ASCENT_EXERCISE_ID } from "./five-note-ascent.js";

interface TimedPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

interface SteadyQuarterExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: readonly [TimedPitch, TimedPitch, TimedPitch, TimedPitch, TimedPitch];
  readonly prerequisite: string;
}

const RIGHT_HAND_C_ASCENT = [
  { eventToken: "c4", noteNumber: 60, beatOffset: 0 },
  { eventToken: "d4", noteNumber: 62, beatOffset: 1 },
  { eventToken: "e4", noteNumber: 64, beatOffset: 2 },
  { eventToken: "f4", noteNumber: 65, beatOffset: 3 },
  { eventToken: "g4", noteNumber: 67, beatOffset: 4 },
] as const;

const LEFT_HAND_C_ASCENT = [
  { eventToken: "c3", noteNumber: 48, beatOffset: 0 },
  { eventToken: "d3", noteNumber: 50, beatOffset: 1 },
  { eventToken: "e3", noteNumber: 52, beatOffset: 2 },
  { eventToken: "f3", noteNumber: 53, beatOffset: 3 },
  { eventToken: "g3", noteNumber: 55, beatOffset: 4 },
] as const;

function createSteadyQuarterExercise(definition: SteadyQuarterExerciseDefinition): Exercise {
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
      id: `${definition.hand}-hand-quarter-${eventToken}`,
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
    curriculumTags: ["rhythm-and-coordination.steady-quarter-notes", "rhythm-and-coordination.hands-separately"],
    repertoireGoalTags: [],
  });
}

export const STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID = "steady-quarter-c-major-right-hand";

export const steadyQuarterRightHandExercise = createSteadyQuarterExercise({
  id: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
  title: "Steady quarters in C · right hand",
  instructions:
    "After the four-beat count-in, play C-D-E-F-G as steady quarter notes with your right hand. Suggested fingering: 1-2-3-4-5.",
  hand: "right",
  pitches: RIGHT_HAND_C_ASCENT,
  prerequisite: FIVE_NOTE_ASCENT_EXERCISE_ID,
});

export const STEADY_QUARTER_LEFT_HAND_EXERCISE_ID = "steady-quarter-c-major-left-hand";

export const steadyQuarterLeftHandExercise = createSteadyQuarterExercise({
  id: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
  title: "Steady quarters in C · left hand",
  instructions: "After the four-beat count-in, play C-D-E-F-G as steady quarter notes with your left hand. Suggested fingering: 5-4-3-2-1.",
  hand: "left",
  pitches: LEFT_HAND_C_ASCENT,
  prerequisite: FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
});
