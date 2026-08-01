import type { NormalizedMidiEvent } from "../midi/types.js";
import type { Exercise, ExerciseExpectedEvent } from "./types.js";

export type EvaluationClassification = "correct" | "repeated" | "out-of-order" | "wrong";
export type EvaluationErrorClassification = Exclude<EvaluationClassification, "correct">;

export interface EvaluationCounts {
  readonly correct: number;
  readonly repeated: number;
  readonly outOfOrder: number;
  readonly wrong: number;
}

export interface EvaluationFeedback {
  readonly classification: EvaluationClassification;
  readonly actualNoteNumber: number;
  readonly expectedNoteNumber: number;
  readonly expectedEventId: string;
  readonly message: string;
}

export interface CompletionObservation {
  readonly classification: EvaluationErrorClassification;
  readonly count: number;
  readonly message: string;
}

export interface EvaluationCompletionSummary {
  readonly errorFree: boolean;
  readonly message: string;
  readonly observations: readonly CompletionObservation[];
}

export interface EvaluationState {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly nextExpectedIndex: number;
  readonly acceptedEventIds: readonly string[];
  readonly counts: EvaluationCounts;
  readonly completed: boolean;
  readonly completionSummary: EvaluationCompletionSummary | null;
}

export interface EvaluationTransition {
  readonly state: EvaluationState;
  readonly feedback: EvaluationFeedback | null;
  readonly completedNow: boolean;
}

const PITCH_CLASSES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export function formatMidiNote(noteNumber: number): string {
  if (!Number.isInteger(noteNumber) || noteNumber < 0 || noteNumber > 127) {
    return `MIDI note ${noteNumber}`;
  }

  const pitchClass = PITCH_CLASSES[noteNumber % 12];
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${pitchClass ?? "?"}${octave}`;
}

export function createEvaluationState(exercise: Exercise): EvaluationState {
  return {
    exerciseId: exercise.id,
    exerciseRevision: exercise.revision,
    nextExpectedIndex: 0,
    acceptedEventIds: [],
    counts: { correct: 0, repeated: 0, outOfOrder: 0, wrong: 0 },
    completed: false,
    completionSummary: null,
  };
}

function assertStateMatchesExercise(exercise: Exercise, state: EvaluationState): void {
  if (state.exerciseId !== exercise.id || state.exerciseRevision !== exercise.revision) {
    throw new Error("Evaluation state belongs to a different exercise revision");
  }

  if (
    !Number.isInteger(state.nextExpectedIndex) ||
    state.nextExpectedIndex < 0 ||
    state.nextExpectedIndex > exercise.expectedEvents.length ||
    state.acceptedEventIds.length !== state.nextExpectedIndex
  ) {
    throw new Error("Evaluation state has invalid expected-event progress");
  }
}

function classifyNote(
  exercise: Exercise,
  state: EvaluationState,
  noteNumber: number,
  expectedEvent: ExerciseExpectedEvent,
): EvaluationClassification {
  if (noteNumber === expectedEvent.noteNumber) {
    return "correct";
  }

  const previousAcceptedEvent = exercise.expectedEvents[state.nextExpectedIndex - 1];
  if (previousAcceptedEvent?.noteNumber === noteNumber) {
    return "repeated";
  }

  const laterPendingEvent = exercise.expectedEvents.slice(state.nextExpectedIndex + 1).some((event) => event.noteNumber === noteNumber);
  return laterPendingEvent ? "out-of-order" : "wrong";
}

function incrementCounts(counts: EvaluationCounts, classification: EvaluationClassification): EvaluationCounts {
  switch (classification) {
    case "correct":
      return { ...counts, correct: counts.correct + 1 };
    case "repeated":
      return { ...counts, repeated: counts.repeated + 1 };
    case "out-of-order":
      return { ...counts, outOfOrder: counts.outOfOrder + 1 };
    case "wrong":
      return { ...counts, wrong: counts.wrong + 1 };
  }
}

function createFeedback(
  classification: EvaluationClassification,
  actualNoteNumber: number,
  expectedEvent: ExerciseExpectedEvent,
): EvaluationFeedback {
  const actual = formatMidiNote(actualNoteNumber);
  const expected = formatMidiNote(expectedEvent.noteNumber);
  let message: string;

  switch (classification) {
    case "correct":
      message = `Correct: ${actual}.`;
      break;
    case "repeated":
      message = `You repeated ${actual}. ${expected} is next.`;
      break;
    case "out-of-order":
      message = `You played ${actual} before ${expected}. ${expected} is next.`;
      break;
    case "wrong":
      message = `You played ${actual}. ${expected} is next.`;
      break;
  }

  return {
    classification,
    actualNoteNumber,
    expectedNoteNumber: expectedEvent.noteNumber,
    expectedEventId: expectedEvent.id,
    message,
  };
}

function createCompletionSummary(counts: EvaluationCounts): EvaluationCompletionSummary {
  const errorFree = counts.repeated === 0 && counts.outOfOrder === 0 && counts.wrong === 0;
  if (errorFree) {
    return { errorFree: true, message: "The sequence was correct.", observations: [] };
  }

  const observations: CompletionObservation[] = [];
  if (counts.outOfOrder > 0) {
    observations.push({
      classification: "out-of-order",
      count: counts.outOfOrder,
      message: counts.outOfOrder === 1 ? "One note was played out of order." : `${counts.outOfOrder} notes were played out of order.`,
    });
  }
  if (counts.repeated > 0) {
    observations.push({
      classification: "repeated",
      count: counts.repeated,
      message: counts.repeated === 1 ? "You repeated a note once." : `You repeated notes ${counts.repeated} times.`,
    });
  }
  if (counts.wrong > 0) {
    observations.push({
      classification: "wrong",
      count: counts.wrong,
      message: counts.wrong === 1 ? "One note did not match the sequence." : `${counts.wrong} notes did not match the sequence.`,
    });
  }

  return {
    errorFree: false,
    message: "Sequence complete.",
    observations: observations.slice(0, 2),
  };
}

export function evaluateMidiEvent(exercise: Exercise, state: EvaluationState, event: NormalizedMidiEvent): EvaluationTransition {
  assertStateMatchesExercise(exercise, state);

  if (state.completed || event.type !== "note-on") {
    return { state, feedback: null, completedNow: false };
  }

  const expectedEvent = exercise.expectedEvents[state.nextExpectedIndex];
  if (expectedEvent === undefined) {
    throw new Error("Evaluation state has no next expected event");
  }

  const classification = classifyNote(exercise, state, event.noteNumber, expectedEvent);
  const counts = incrementCounts(state.counts, classification);
  const feedback = createFeedback(classification, event.noteNumber, expectedEvent);

  if (classification !== "correct") {
    return {
      state: { ...state, counts },
      feedback,
      completedNow: false,
    };
  }

  const nextExpectedIndex = state.nextExpectedIndex + 1;
  const completed = nextExpectedIndex === exercise.expectedEvents.length;
  const completionSummary = completed ? createCompletionSummary(counts) : null;

  return {
    state: {
      ...state,
      nextExpectedIndex,
      acceptedEventIds: [...state.acceptedEventIds, expectedEvent.id],
      counts,
      completed,
      completionSummary,
    },
    feedback,
    completedNow: completed,
  };
}
