import { formatMidiNote } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  "notes-and-reading": "Notes and reading",
  "rhythm-and-coordination": "Rhythm and coordination",
  "patterns-and-technique": "Patterns and technique",
  repertoire: "Repertoire",
};

const NATURAL_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
const EVEN_EIGHTH_PRACTICE_TASK =
  "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between.";
const OFFBEAT_EIGHTH_PRACTICE_TASK =
  "After the count-in, play the first note on 1, then place each remaining note on an “and” count between clicks.";

export type ExerciseRhythmKind = "untimed" | "steady-quarter" | "even-eighth" | "offbeat-eighth" | "timed";
export type PracticeKeyboardNoteState = "accepted" | "expected" | "idle" | "remaining";

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
    practiceTask: "Play the notes in order.",
    staffLabel: "Pitch order · No fixed rhythm",
  },
  "steady-quarter": {
    kind: "steady-quarter",
    label: "Steady pulse",
    practiceTask: "After the count-in, place one note on each beat.",
    staffLabel: "Pitch order · One note per beat",
  },
  "even-eighth": {
    kind: "even-eighth",
    label: "Eighth-note grid",
    practiceTask: EVEN_EIGHTH_PRACTICE_TASK,
    staffLabel: "Pitch order · Even eighth-note onsets",
  },
  "offbeat-eighth": {
    kind: "offbeat-eighth",
    label: "Offbeat grid",
    practiceTask: OFFBEAT_EIGHTH_PRACTICE_TASK,
    staffLabel: "Pitch order · Downbeat then offbeat onsets",
  },
  timed: {
    kind: "timed",
    label: "Timed study",
    practiceTask: "After the count-in, follow the study's timing guide.",
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

export function projectPracticeKeyboardNotes(exercise: Exercise): readonly number[] {
  const expectedPitches = new Set(exercise.expectedEvents.map(({ noteNumber }) => noteNumber));
  if (expectedPitches.size === 0) {
    return [];
  }

  const minimum = Math.min(...expectedPitches);
  const maximum = Math.max(...expectedPitches);
  const projectedPitches: number[] = [];

  for (let noteNumber = minimum; noteNumber <= maximum; noteNumber += 1) {
    if (expectedPitches.has(noteNumber) || NATURAL_PITCH_CLASSES.has(noteNumber % 12)) {
      projectedPitches.push(noteNumber);
    }
  }

  return projectedPitches;
}

export function formatPracticeKeyboardNoteLabel(noteNumber: number, state: PracticeKeyboardNoteState): string {
  const stateLabel: Readonly<Record<PracticeKeyboardNoteState, string>> = {
    accepted: "completed",
    expected: "next note",
    idle: "not in phrase",
    remaining: "later in phrase",
  };
  return `${formatMidiNote(noteNumber)}, ${stateLabel[state]}`;
}

export function getExerciseRhythmPresentation(exercise: Exercise): ExerciseRhythmPresentation {
  if (exercise.evaluationMode === "untimed-ordered-notes") {
    return RHYTHM_PRESENTATIONS.untimed;
  }

  const timing = exercise.timing;
  const usesQuarterNoteBeat = timing?.beatUnit === 4;
  if (usesQuarterNoteBeat && exercise.expectedEvents.every((event, index) => event.beatOffset === index)) {
    if (timing.beatsPerMeasure !== 4 || timing.countInBeats !== 4) {
      return {
        ...RHYTHM_PRESENTATIONS["steady-quarter"],
        practiceTask: `${formatCountInLead(timing.countInBeats)}, place one note on each beat. Count ${formatQuarterGridCount(
          exercise.expectedEvents.length,
          timing.beatsPerMeasure,
        )}.`,
      };
    }

    return RHYTHM_PRESENTATIONS["steady-quarter"];
  }

  if (usesQuarterNoteBeat && exercise.expectedEvents.every((event, index) => event.beatOffset === index / 2)) {
    return {
      ...RHYTHM_PRESENTATIONS["even-eighth"],
      practiceTask: `${EVEN_EIGHTH_PRACTICE_TASK} Count ${formatEighthGridCount(exercise.expectedEvents.length, timing.beatsPerMeasure)}.`,
    };
  }

  if (
    usesQuarterNoteBeat &&
    exercise.expectedEvents.length === timing.beatsPerMeasure + 1 &&
    exercise.expectedEvents.every((event, index) => event.beatOffset === (index === 0 ? 0 : index - 0.5))
  ) {
    return {
      ...RHYTHM_PRESENTATIONS["offbeat-eighth"],
      practiceTask: `${OFFBEAT_EIGHTH_PRACTICE_TASK} Count ${formatEighthGridCount(timing.beatsPerMeasure * 2, timing.beatsPerMeasure)}.`,
    };
  }

  return RHYTHM_PRESENTATIONS.timed;
}

function formatEighthGridCount(positionCount: number, beatsPerMeasure: number): string {
  return Array.from({ length: positionCount }, (_, index) => (index % 2 === 0 ? String(((index / 2) % beatsPerMeasure) + 1) : "&")).join(
    " ",
  );
}

function formatCountInLead(countInBeats: number): string {
  if (countInBeats === 0) {
    return "When the pulse starts";
  }

  const smallNumberNames = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"] as const;
  const count = smallNumberNames[countInBeats] ?? String(countInBeats);
  return `After the ${count}-beat count-in`;
}

function formatQuarterGridCount(positionCount: number, beatsPerMeasure: number): string {
  return Array.from({ length: positionCount }, (_, index) => {
    const beat = String((index % beatsPerMeasure) + 1);
    return index > 0 && index % beatsPerMeasure === 0 ? `, ${beat}` : index === 0 ? beat : ` ${beat}`;
  }).join("");
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
