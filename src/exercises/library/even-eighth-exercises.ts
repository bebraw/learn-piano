import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import { STEADY_QUARTER_LEFT_HAND_EXERCISE_ID, STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID } from "./steady-quarter-exercises.js";

interface EvenEighthPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

interface EvenEighthExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: readonly [EvenEighthPitch, EvenEighthPitch, EvenEighthPitch, EvenEighthPitch, EvenEighthPitch];
  readonly prerequisite: string;
}

const EVEN_EIGHTH_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  timingWindowBeats: 0.1,
} as const;

const RIGHT_HAND_C_ASCENT = [
  { eventToken: "c4", noteNumber: 60, beatOffset: 0 },
  { eventToken: "d4", noteNumber: 62, beatOffset: 0.5 },
  { eventToken: "e4", noteNumber: 64, beatOffset: 1 },
  { eventToken: "f4", noteNumber: 65, beatOffset: 1.5 },
  { eventToken: "g4", noteNumber: 67, beatOffset: 2 },
] as const;

const LEFT_HAND_C_ASCENT = [
  { eventToken: "c3", noteNumber: 48, beatOffset: 0 },
  { eventToken: "d3", noteNumber: 50, beatOffset: 0.5 },
  { eventToken: "e3", noteNumber: 52, beatOffset: 1 },
  { eventToken: "f3", noteNumber: 53, beatOffset: 1.5 },
  { eventToken: "g3", noteNumber: 55, beatOffset: 2 },
] as const;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

function createEvenEighthExercise(definition: EvenEighthExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: EVEN_EIGHTH_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-eighth-${eventToken}`,
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

export const EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID = "even-eighths-c-major-right-hand";

export const evenEighthsRightHandExercise = createEvenEighthExercise({
  id: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
  title: "Even eighths in C · right hand",
  instructions:
    "After the four-beat count-in, place C-D-E-F-G evenly on the eighth-note grid with your right hand. Count 1 & 2 & 3. Suggested fingering: 1-2-3-4-5.",
  hand: "right",
  pitches: RIGHT_HAND_C_ASCENT,
  prerequisite: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
});

export const EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID = "even-eighths-c-major-left-hand";

export const evenEighthsLeftHandExercise = createEvenEighthExercise({
  id: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
  title: "Even eighths in C · left hand",
  instructions:
    "After the four-beat count-in, place C-D-E-F-G evenly on the eighth-note grid with your left hand. Count 1 & 2 & 3. Suggested fingering: 5-4-3-2-1.",
  hand: "left",
  pitches: LEFT_HAND_C_ASCENT,
  prerequisite: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
});
