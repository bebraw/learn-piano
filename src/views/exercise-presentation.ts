import { formatMidiNote } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  "notes-and-reading": "Notes and reading",
  "rhythm-and-coordination": "Rhythm and coordination",
  "patterns-and-technique": "Patterns and technique",
  repertoire: "Repertoire",
};

export function exercisePracticeHref(exercise: Exercise): string {
  return `/practice?exercise=${encodeURIComponent(exercise.id)}`;
}

export function formatExerciseNoteOrder(exercise: Exercise): string {
  return exercise.expectedEvents.map((event) => formatMidiNote(event.noteNumber)).join(" · ");
}

export function formatExerciseHand(exercise: Exercise): string {
  const hands = new Set(exercise.expectedEvents.map((event) => event.hand));
  if (hands.size !== 1 || hands.has("both")) {
    return "Both hands";
  }
  return hands.has("left") ? "Left hand" : "Right hand";
}

export function formatExerciseCategory(exercise: Exercise): string {
  const category = exercise.curriculumTags[0]?.split(".")[0] ?? "focused-practice";
  return CATEGORY_LABELS[category] ?? sentenceCaseWords(category);
}

export function formatExerciseDifficulty(exercise: Exercise): string {
  return sentenceCaseWords(exercise.difficulty);
}

function sentenceCaseWords(value: string): string {
  const words = value.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}
