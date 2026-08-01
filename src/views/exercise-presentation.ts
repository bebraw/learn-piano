import { formatMidiNote } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  "notes-and-reading": "Notes and reading",
  "rhythm-and-coordination": "Rhythm and coordination",
  "patterns-and-technique": "Patterns and technique",
  repertoire: "Repertoire",
};

export type ExerciseRhythmKind = "untimed" | "steady-quarter" | "even-eighth" | "timed";

export interface ExerciseRhythmPresentation {
  readonly kind: ExerciseRhythmKind;
  readonly label: string;
  readonly practiceTask: string;
  readonly staffLabel: string;
}

const RHYTHM_PRESENTATIONS: Readonly<Record<ExerciseRhythmKind, ExerciseRhythmPresentation>> = {
  untimed: {
    kind: "untimed",
    label: "Untimed",
    practiceTask: "Play each note once in order. The next expected key stays lit.",
    staffLabel: "Pitch order · No fixed rhythm",
  },
  "steady-quarter": {
    kind: "steady-quarter",
    label: "Steady pulse",
    practiceTask: "After the count-in, place one note on each beat. The next expected key stays lit.",
    staffLabel: "Pitch order · One note per beat",
  },
  "even-eighth": {
    kind: "even-eighth",
    label: "Eighth-note grid",
    practiceTask:
      "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3.",
    staffLabel: "Pitch order · Even eighth-note onsets",
  },
  timed: {
    kind: "timed",
    label: "Timed study",
    practiceTask: "After the count-in, follow the study's timing guide. The next expected key stays lit.",
    staffLabel: "Pitch order · Timing shown separately",
  },
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

export function getExerciseRhythmPresentation(exercise: Exercise): ExerciseRhythmPresentation {
  if (exercise.evaluationMode === "untimed-ordered-notes") {
    return RHYTHM_PRESENTATIONS.untimed;
  }

  const usesQuarterNoteBeat = exercise.timing?.beatUnit === 4;
  if (usesQuarterNoteBeat && exercise.expectedEvents.every((event, index) => event.beatOffset === index)) {
    return RHYTHM_PRESENTATIONS["steady-quarter"];
  }

  if (usesQuarterNoteBeat && exercise.expectedEvents.every((event, index) => event.beatOffset === index / 2)) {
    return RHYTHM_PRESENTATIONS["even-eighth"];
  }

  return RHYTHM_PRESENTATIONS.timed;
}

export function formatExerciseTimingLabel(exercise: Exercise, includeMeter = false): string {
  const rhythm = getExerciseRhythmPresentation(exercise);
  if (rhythm.kind === "untimed") {
    return rhythm.label;
  }

  const timing = exercise.timing;
  if (timing === undefined) {
    throw new Error(`Timed exercise ${exercise.id} requires timing metadata`);
  }

  const meter = includeMeter ? ` · ${timing.beatsPerMeasure}/${timing.beatUnit}` : "";
  return `${rhythm.label} · ${timing.defaultBpm} BPM${meter}`;
}

function sentenceCaseWords(value: string): string {
  const words = value.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}
