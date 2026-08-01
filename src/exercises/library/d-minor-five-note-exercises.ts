import { parseExercise } from "../schema.js";
import type { Exercise, ExerciseHand } from "../types.js";
import {
  ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
} from "./ordered-chord-tone-exercises.js";

interface FiveNotePitch {
  readonly eventToken: string;
  readonly noteNumber: number;
}

interface DMinorFiveNoteExerciseDefinition {
  readonly id: string;
  readonly hand: ExerciseHand;
  readonly pitches: readonly [FiveNotePitch, FiveNotePitch, FiveNotePitch, FiveNotePitch, FiveNotePitch];
  readonly prerequisite: string;
  readonly fingering: string;
}

const RIGHT_HAND_D_POSITION = [
  { eventToken: "d4", noteNumber: 62 },
  { eventToken: "e4", noteNumber: 64 },
  { eventToken: "f4", noteNumber: 65 },
  { eventToken: "g4", noteNumber: 67 },
  { eventToken: "a4", noteNumber: 69 },
] as const;

const LEFT_HAND_D_POSITION = [
  { eventToken: "d3", noteNumber: 50 },
  { eventToken: "e3", noteNumber: 52 },
  { eventToken: "f3", noteNumber: 53 },
  { eventToken: "g3", noteNumber: 55 },
  { eventToken: "a3", noteNumber: 57 },
] as const;

const CURRICULUM_TAGS = [
  "notes-and-reading.keyboard-geography",
  "notes-and-reading.interval-recognition",
  "patterns-and-technique.five-finger-patterns",
  "patterns-and-technique.minor-scale-preparation",
  "rhythm-and-coordination.hands-separately",
] as const;

function createDMinorFiveNoteExercise(definition: DMinorFiveNoteExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: `Five-note ascent in D minor · ${definition.hand} hand`,
    instructions: `Play D-E-F-G-A in ascending order with your ${definition.hand} hand. Keep one finger over each white key in D position; E and F form the close half-step in this minor five-finger pattern. Suggested fingering: ${definition.fingering}.`,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber }) => ({
      id: `${definition.hand}-hand-d-minor-five-note-ascent-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
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

export const D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID = "five-note-ascent-d-minor-right-hand";

export const dMinorFiveNoteAscentRightHandExercise = createDMinorFiveNoteExercise({
  id: D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID,
  hand: "right",
  pitches: RIGHT_HAND_D_POSITION,
  prerequisite: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  fingering: "1-2-3-4-5",
});

export const D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID = "five-note-ascent-d-minor-left-hand";

export const dMinorFiveNoteAscentLeftHandExercise = createDMinorFiveNoteExercise({
  id: D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  hand: "left",
  pitches: LEFT_HAND_D_POSITION,
  prerequisite: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  fingering: "5-4-3-2-1",
});
