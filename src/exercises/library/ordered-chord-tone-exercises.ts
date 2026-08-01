import { parseExercise } from "../schema.js";
import type { Exercise, ExerciseHand } from "../types.js";
import { STEP_SKIP_LEFT_HAND_EXERCISE_ID, STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "./beginner-five-note-exercises.js";

interface ChordTonePitch {
  readonly eventToken: string;
  readonly noteNumber: number;
}

interface OrderedChordToneExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: readonly [ChordTonePitch, ChordTonePitch, ChordTonePitch, ChordTonePitch, ChordTonePitch];
  readonly prerequisite: string;
  readonly curriculumTags: readonly string[];
}

const RIGHT_HAND_C_MAJOR_CHORD_TONES = [
  { eventToken: "c4-start", noteNumber: 60 },
  { eventToken: "e4-up", noteNumber: 64 },
  { eventToken: "g4-apex", noteNumber: 67 },
  { eventToken: "e4-down", noteNumber: 64 },
  { eventToken: "c4-return", noteNumber: 60 },
] as const;

const LEFT_HAND_C_MAJOR_CHORD_TONES = [
  { eventToken: "c3-start", noteNumber: 48 },
  { eventToken: "e3-up", noteNumber: 52 },
  { eventToken: "g3-apex", noteNumber: 55 },
  { eventToken: "e3-down", noteNumber: 52 },
  { eventToken: "c3-return", noteNumber: 48 },
] as const;

const RIGHT_HAND_D_MINOR_CHORD_TONES = [
  { eventToken: "d-minor-d4-start", noteNumber: 62 },
  { eventToken: "d-minor-f4-up", noteNumber: 65 },
  { eventToken: "d-minor-a4-apex", noteNumber: 69 },
  { eventToken: "d-minor-f4-down", noteNumber: 65 },
  { eventToken: "d-minor-d4-return", noteNumber: 62 },
] as const;

const LEFT_HAND_D_MINOR_CHORD_TONES = [
  { eventToken: "d-minor-d3-start", noteNumber: 50 },
  { eventToken: "d-minor-f3-up", noteNumber: 53 },
  { eventToken: "d-minor-a3-apex", noteNumber: 57 },
  { eventToken: "d-minor-f3-down", noteNumber: 53 },
  { eventToken: "d-minor-d3-return", noteNumber: 50 },
] as const;

const C_MAJOR_CURRICULUM_TAGS = [
  "patterns-and-technique.chord-tone-patterns",
  "notes-and-reading.interval-recognition",
  "rhythm-and-coordination.hands-separately",
] as const;

const D_MINOR_CURRICULUM_TAGS = [
  "patterns-and-technique.chord-tone-patterns",
  "patterns-and-technique.minor-chord-vocabulary",
  "notes-and-reading.interval-recognition",
  "rhythm-and-coordination.hands-separately",
] as const;

function createOrderedChordToneExercise(definition: OrderedChordToneExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber }) => ({
      id: `${definition.hand}-hand-chord-tone-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: [definition.prerequisite],
    curriculumTags: definition.curriculumTags,
    repertoireGoalTags: [],
  });
}

export const ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID = "ordered-chord-tones-c-major-right-hand";

export const orderedChordTonesRightHandExercise = createOrderedChordToneExercise({
  id: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  title: "C major chord tones · right hand",
  instructions:
    "Play C-E-G-E-C one note at a time with your right hand. C, E, and G are the chord tones of C major; do not play them together yet. Suggested fingering: 1-3-5-3-1.",
  hand: "right",
  pitches: RIGHT_HAND_C_MAJOR_CHORD_TONES,
  prerequisite: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
  curriculumTags: C_MAJOR_CURRICULUM_TAGS,
});

export const ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID = "ordered-chord-tones-c-major-left-hand";

export const orderedChordTonesLeftHandExercise = createOrderedChordToneExercise({
  id: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  title: "C major chord tones · left hand",
  instructions:
    "Play C-E-G-E-C one note at a time with your left hand. C, E, and G are the chord tones of C major; do not play them together yet. Suggested fingering: 5-3-1-3-5.",
  hand: "left",
  pitches: LEFT_HAND_C_MAJOR_CHORD_TONES,
  prerequisite: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  curriculumTags: C_MAJOR_CURRICULUM_TAGS,
});

export const ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID = "ordered-chord-tones-d-minor-right-hand";

export const orderedDMinorChordTonesRightHandExercise = createOrderedChordToneExercise({
  id: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  title: "D minor chord tones · right hand",
  instructions:
    "Place five fingers over D-E-F-G-A. Play D-F-A-F-D one note at a time with your right hand. D, F, and A are the chord tones of D minor; do not play them together yet. Suggested fingering: 1-3-5-3-1.",
  hand: "right",
  pitches: RIGHT_HAND_D_MINOR_CHORD_TONES,
  prerequisite: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  curriculumTags: D_MINOR_CURRICULUM_TAGS,
});

export const ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID = "ordered-chord-tones-d-minor-left-hand";

export const orderedDMinorChordTonesLeftHandExercise = createOrderedChordToneExercise({
  id: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  title: "D minor chord tones · left hand",
  instructions:
    "Place five fingers over D-E-F-G-A. Play D-F-A-F-D one note at a time with your left hand. D, F, and A are the chord tones of D minor; do not play them together yet. Suggested fingering: 5-3-1-3-5.",
  hand: "left",
  pitches: LEFT_HAND_D_MINOR_CHORD_TONES,
  prerequisite: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  curriculumTags: D_MINOR_CURRICULUM_TAGS,
});
