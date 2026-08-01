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
import { fiveFourPulseLeftHandExercise, fiveFourPulseRightHandExercise } from "./five-four-pulse-exercises.js";
import { mixedEighthPatternLeftHandExercise, mixedEighthPatternRightHandExercise } from "./mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipLeftHandExercise, offbeatStepSkipRightHandExercise } from "./offbeat-step-skip-exercises.js";
import { orderedChordTonesLeftHandExercise, orderedChordTonesRightHandExercise } from "./ordered-chord-tone-exercises.js";
import { repeatedNotesLeftHandExercise, repeatedNotesRightHandExercise } from "./repeated-note-exercises.js";
import { steadyBrokenChordLeftHandExercise, steadyBrokenChordRightHandExercise } from "./steady-broken-chord-exercises.js";
import { threeFourBrokenChordLeftHandExercise, threeFourBrokenChordRightHandExercise } from "./three-four-broken-chord-exercises.js";
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
  steadyBrokenChordRightHandExercise,
  steadyBrokenChordLeftHandExercise,
  threeFourBrokenChordRightHandExercise,
  threeFourBrokenChordLeftHandExercise,
  fiveFourPulseRightHandExercise,
  fiveFourPulseLeftHandExercise,
  repeatedNotesRightHandExercise,
  repeatedNotesLeftHandExercise,
  mixedEighthPatternRightHandExercise,
  mixedEighthPatternLeftHandExercise,
  offbeatStepSkipRightHandExercise,
  offbeatStepSkipLeftHandExercise,
]);

parseExerciseLibrary(exerciseLibrary);

export const defaultExercise = fiveNoteAscentExercise;

export function findExerciseById(id: string): Exercise | null {
  return exerciseLibrary.find((exercise) => exercise.id === id) ?? null;
}
