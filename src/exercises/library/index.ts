import type { Exercise } from "../types.js";
import {
  fiveNoteAscentLeftHandExercise,
  fiveNoteDescentLeftHandExercise,
  fiveNoteDescentRightHandExercise,
  stepSkipLeftHandExercise,
  stepSkipRightHandExercise,
} from "./beginner-five-note-exercises.js";
import { FIVE_NOTE_ASCENT_EXERCISE_ID, fiveNoteAscentExercise } from "./five-note-ascent.js";
import {
  steadyQuarterLeftHandExercise,
  steadyQuarterRightHandExercise,
  steadyQuarterStepSkipLeftHandExercise,
  steadyQuarterStepSkipRightHandExercise,
} from "./steady-quarter-exercises.js";
import { evenEighthsLeftHandExercise, evenEighthsRightHandExercise } from "./even-eighth-exercises.js";
import { orderedChordTonesLeftHandExercise, orderedChordTonesRightHandExercise } from "./ordered-chord-tone-exercises.js";
import { parseExerciseLibrary } from "../schema.js";

export const DEFAULT_EXERCISE_ID = FIVE_NOTE_ASCENT_EXERCISE_ID;

export const exerciseLibrary: readonly Exercise[] = Object.freeze([
  fiveNoteAscentExercise,
  fiveNoteDescentRightHandExercise,
  fiveNoteAscentLeftHandExercise,
  fiveNoteDescentLeftHandExercise,
  stepSkipRightHandExercise,
  stepSkipLeftHandExercise,
  steadyQuarterRightHandExercise,
  steadyQuarterLeftHandExercise,
  steadyQuarterStepSkipRightHandExercise,
  steadyQuarterStepSkipLeftHandExercise,
  evenEighthsRightHandExercise,
  evenEighthsLeftHandExercise,
  orderedChordTonesRightHandExercise,
  orderedChordTonesLeftHandExercise,
]);

parseExerciseLibrary(exerciseLibrary);

export const defaultExercise = fiveNoteAscentExercise;

export function findExerciseById(id: string): Exercise | null {
  return exerciseLibrary.find((exercise) => exercise.id === id) ?? null;
}
