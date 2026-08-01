import { findExerciseById } from "../exercises/library/index.js";
import type { Exercise } from "../exercises/types.js";

export function resolveRenderedExercise(exerciseId: string | undefined, exerciseRevision: string | undefined): Exercise | null {
  if (exerciseId === undefined || exerciseRevision === undefined) {
    return null;
  }

  const exercise = findExerciseById(exerciseId);
  return exercise !== null && String(exercise.revision) === exerciseRevision ? exercise : null;
}
