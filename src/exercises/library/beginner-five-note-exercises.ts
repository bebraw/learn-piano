import { parseExercise } from "../schema.js";
import type { Exercise, ExerciseHand } from "../types.js";

interface ExercisePitch {
  readonly eventToken: string;
  readonly noteNumber: number;
}

type FiveExercisePitches = readonly [ExercisePitch, ExercisePitch, ExercisePitch, ExercisePitch, ExercisePitch];

interface FiveNoteExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: FiveExercisePitches;
  readonly prerequisites: readonly string[];
  readonly curriculumTags: readonly string[];
}

const RIGHT_HAND_C_POSITION = [
  { eventToken: "c4", noteNumber: 60 },
  { eventToken: "d4", noteNumber: 62 },
  { eventToken: "e4", noteNumber: 64 },
  { eventToken: "f4", noteNumber: 65 },
  { eventToken: "g4", noteNumber: 67 },
] as const;

const LEFT_HAND_C_POSITION = [
  { eventToken: "c3", noteNumber: 48 },
  { eventToken: "d3", noteNumber: 50 },
  { eventToken: "e3", noteNumber: 52 },
  { eventToken: "f3", noteNumber: 53 },
  { eventToken: "g3", noteNumber: 55 },
] as const;

function createFiveNoteExercise(definition: FiveNoteExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber }) => ({
      id: `${definition.hand}-hand-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: definition.prerequisites,
    curriculumTags: definition.curriculumTags,
    repertoireGoalTags: [],
  });
}

export const FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID = "five-note-descent-c-major-right-hand";

export const fiveNoteDescentRightHandExercise = createFiveNoteExercise({
  id: FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID,
  title: "Five-note descent in C · right hand",
  instructions: "Play G-F-E-D-C in descending order with your right hand. Suggested fingering: 5-4-3-2-1.",
  hand: "right",
  pitches: [
    RIGHT_HAND_C_POSITION[4],
    RIGHT_HAND_C_POSITION[3],
    RIGHT_HAND_C_POSITION[2],
    RIGHT_HAND_C_POSITION[1],
    RIGHT_HAND_C_POSITION[0],
  ],
  prerequisites: ["five-note-ascent-c-major-right-hand"],
  curriculumTags: ["notes-and-reading.keyboard-geography", "patterns-and-technique.five-finger-patterns"],
});

export const FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID = "five-note-ascent-c-major-left-hand";

export const fiveNoteAscentLeftHandExercise = createFiveNoteExercise({
  id: FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  title: "Five-note ascent in C · left hand",
  instructions: "Play C-D-E-F-G in ascending order with your left hand. Suggested fingering: 5-4-3-2-1.",
  hand: "left",
  pitches: LEFT_HAND_C_POSITION,
  prerequisites: [],
  curriculumTags: [
    "notes-and-reading.keyboard-geography",
    "rhythm-and-coordination.hands-separately",
    "patterns-and-technique.five-finger-patterns",
  ],
});

export const FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID = "five-note-descent-c-major-left-hand";

export const fiveNoteDescentLeftHandExercise = createFiveNoteExercise({
  id: FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID,
  title: "Five-note descent in C · left hand",
  instructions: "Play G-F-E-D-C in descending order with your left hand. Suggested fingering: 1-2-3-4-5.",
  hand: "left",
  pitches: [LEFT_HAND_C_POSITION[4], LEFT_HAND_C_POSITION[3], LEFT_HAND_C_POSITION[2], LEFT_HAND_C_POSITION[1], LEFT_HAND_C_POSITION[0]],
  prerequisites: [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID],
  curriculumTags: [
    "notes-and-reading.keyboard-geography",
    "rhythm-and-coordination.hands-separately",
    "patterns-and-technique.five-finger-patterns",
  ],
});

export const STEP_SKIP_RIGHT_HAND_EXERCISE_ID = "step-skip-c-major-right-hand";

export const stepSkipRightHandExercise = createFiveNoteExercise({
  id: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
  title: "Step and skip in C · right hand",
  instructions: "Play C-E-D-F-G with your right hand, noticing each skip and neighboring step. Suggested fingering: 1-3-2-4-5.",
  hand: "right",
  pitches: [
    RIGHT_HAND_C_POSITION[0],
    RIGHT_HAND_C_POSITION[2],
    RIGHT_HAND_C_POSITION[1],
    RIGHT_HAND_C_POSITION[3],
    RIGHT_HAND_C_POSITION[4],
  ],
  prerequisites: ["five-note-ascent-c-major-right-hand", FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID],
  curriculumTags: ["notes-and-reading.interval-recognition", "patterns-and-technique.step-skip-coordination"],
});

export const STEP_SKIP_LEFT_HAND_EXERCISE_ID = "step-skip-c-major-left-hand";

export const stepSkipLeftHandExercise = createFiveNoteExercise({
  id: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  title: "Step and skip in C · left hand",
  instructions: "Play C-E-D-F-G with your left hand, noticing each skip and neighboring step. Suggested fingering: 5-3-4-2-1.",
  hand: "left",
  pitches: [LEFT_HAND_C_POSITION[0], LEFT_HAND_C_POSITION[2], LEFT_HAND_C_POSITION[1], LEFT_HAND_C_POSITION[3], LEFT_HAND_C_POSITION[4]],
  prerequisites: [FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID, FIVE_NOTE_DESCENT_LEFT_HAND_EXERCISE_ID],
  curriculumTags: [
    "notes-and-reading.interval-recognition",
    "rhythm-and-coordination.hands-separately",
    "patterns-and-technique.step-skip-coordination",
  ],
});
