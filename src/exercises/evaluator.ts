import type { NormalizedMidiEvent } from "../midi/types.js";
import type { Exercise, ExerciseExpectedEvent, ExerciseTiming } from "./types.js";

export type EvaluationClassification = "correct" | "repeated" | "out-of-order" | "wrong";
export type EvaluationErrorClassification = Exclude<EvaluationClassification, "correct">;

export interface EvaluationCounts {
  readonly correct: number;
  readonly repeated: number;
  readonly outOfOrder: number;
  readonly wrong: number;
}

export type TimingClassification = "on-pulse" | "early" | "late";
export type TimingFeedbackClassification = "anchor" | TimingClassification;

export interface TimingEvaluationState {
  readonly tempoBpm: number;
  readonly anchorTimestamp: number | null;
  readonly assessedIntervals: number;
  readonly onPulse: number;
  readonly early: number;
  readonly late: number;
  readonly totalAbsoluteErrorMs: number;
}

export interface TimingFeedback {
  readonly classification: TimingFeedbackClassification;
  readonly deviationMs: number | null;
  readonly message: string;
}

export interface EvaluationFeedback {
  readonly classification: EvaluationClassification;
  readonly actualNoteNumber: number;
  readonly expectedNoteNumber: number;
  readonly expectedEventId: string;
  readonly message: string;
  readonly timing?: TimingFeedback;
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
  readonly timing?: TimingCompletionSummary;
}

export interface TimingCompletionSummary {
  readonly tempoBpm: number;
  readonly assessedIntervals: number;
  readonly onPulse: number;
  readonly early: number;
  readonly late: number;
  readonly meanAbsoluteErrorMs: number;
  readonly message: string;
}

export interface EvaluationState {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly nextExpectedIndex: number;
  readonly acceptedEventIds: readonly string[];
  readonly counts: EvaluationCounts;
  readonly timing: TimingEvaluationState | null;
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

export function createEvaluationState(exercise: Exercise, tempoBpm?: number): EvaluationState {
  return {
    exerciseId: exercise.id,
    exerciseRevision: exercise.revision,
    nextExpectedIndex: 0,
    acceptedEventIds: [],
    counts: { correct: 0, repeated: 0, outOfOrder: 0, wrong: 0 },
    timing: createTimingState(exercise, tempoBpm),
    completed: false,
    completionSummary: null,
  };
}

function createTimingState(exercise: Exercise, tempoBpm: number | undefined): TimingEvaluationState | null {
  if (exercise.evaluationMode === "untimed-ordered-notes") {
    if (tempoBpm !== undefined) {
      throw new Error("An untimed exercise does not accept a practice tempo");
    }
    return null;
  }

  const timing = requireExerciseTiming(exercise);
  const selectedTempo = tempoBpm ?? timing.defaultBpm;
  if (!Number.isInteger(selectedTempo) || selectedTempo < timing.minBpm || selectedTempo > timing.maxBpm) {
    throw new RangeError(`Practice tempo must be an integer from ${timing.minBpm} through ${timing.maxBpm} BPM`);
  }

  return {
    tempoBpm: selectedTempo,
    anchorTimestamp: null,
    assessedIntervals: 0,
    onPulse: 0,
    early: 0,
    late: 0,
    totalAbsoluteErrorMs: 0,
  };
}

function requireExerciseTiming(exercise: Exercise): ExerciseTiming {
  if (exercise.timing === undefined) {
    throw new Error("A timed exercise requires timing metadata");
  }
  return exercise.timing;
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

function createCompletionSummary(counts: EvaluationCounts, timing: TimingEvaluationState | null): EvaluationCompletionSummary {
  const errorFree = counts.repeated === 0 && counts.outOfOrder === 0 && counts.wrong === 0;
  const timingSummary = timing === null ? undefined : createTimingCompletionSummary(timing);
  if (errorFree) {
    return {
      errorFree: true,
      message: "The sequence was correct.",
      observations: [],
      ...(timingSummary === undefined ? {} : { timing: timingSummary }),
    };
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
      message: counts.repeated === 1 ? "You added one extra repeat." : `You added ${counts.repeated} extra repeats.`,
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
    ...(timingSummary === undefined ? {} : { timing: timingSummary }),
  };
}

function createTimingCompletionSummary(timing: TimingEvaluationState): TimingCompletionSummary {
  const meanAbsoluteErrorMs = timing.assessedIntervals === 0 ? 0 : Math.round(timing.totalAbsoluteErrorMs / timing.assessedIntervals);
  let message: string;

  if (timing.assessedIntervals === 0) {
    message = "Pulse timing began, but there was no interval to assess.";
  } else if (timing.onPulse === timing.assessedIntervals) {
    message =
      timing.assessedIntervals === 1
        ? `The interval was on time at ${timing.tempoBpm} BPM.`
        : `All ${timing.assessedIntervals} intervals were on time at ${timing.tempoBpm} BPM.`;
  } else {
    const observations = [
      timing.early === 0 ? null : `${timing.early} ${timing.early === 1 ? "interval was" : "intervals were"} early.`,
      timing.late === 0 ? null : `${timing.late} ${timing.late === 1 ? "interval was" : "intervals were"} late.`,
    ].filter((observation): observation is string => observation !== null);
    const intervalTiming = timing.assessedIntervals === 1 ? "interval was" : "intervals were";
    message = `${timing.onPulse} of ${timing.assessedIntervals} ${intervalTiming} on time at ${timing.tempoBpm} BPM. ${observations.join(" ")}`;
  }

  return {
    tempoBpm: timing.tempoBpm,
    assessedIntervals: timing.assessedIntervals,
    onPulse: timing.onPulse,
    early: timing.early,
    late: timing.late,
    meanAbsoluteErrorMs,
    message,
  };
}

function evaluateTiming(
  exercise: Exercise,
  timingState: TimingEvaluationState,
  expectedEvent: ExerciseExpectedEvent,
  timestamp: number,
): { readonly state: TimingEvaluationState; readonly feedback: TimingFeedback } {
  if (timingState.anchorTimestamp === null) {
    return {
      state: { ...timingState, anchorTimestamp: timestamp },
      feedback: {
        classification: "anchor",
        deviationMs: null,
        message: "Pulse timing starts here.",
      },
    };
  }

  const beatOffset = expectedEvent.beatOffset;
  if (beatOffset === undefined) {
    throw new Error("A timed expected event requires a beat offset");
  }

  const exerciseTiming = requireExerciseTiming(exercise);
  const beatDurationMs = 60_000 / timingState.tempoBpm;
  const expectedTimestamp = timingState.anchorTimestamp + beatOffset * beatDurationMs;
  const deviationMs = timestamp - expectedTimestamp;
  const toleranceMs = exerciseTiming.timingWindowBeats * beatDurationMs;
  const classification: TimingClassification = deviationMs < -toleranceMs ? "early" : deviationMs > toleranceMs ? "late" : "on-pulse";

  return {
    state: {
      ...timingState,
      assessedIntervals: timingState.assessedIntervals + 1,
      onPulse: timingState.onPulse + (classification === "on-pulse" ? 1 : 0),
      early: timingState.early + (classification === "early" ? 1 : 0),
      late: timingState.late + (classification === "late" ? 1 : 0),
      totalAbsoluteErrorMs: timingState.totalAbsoluteErrorMs + Math.abs(deviationMs),
    },
    feedback: {
      classification,
      deviationMs,
      message: classification === "on-pulse" ? "On time." : classification === "early" ? "A little early." : "A little late.",
    },
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
  const pitchFeedback = createFeedback(classification, event.noteNumber, expectedEvent);

  if (classification !== "correct") {
    return {
      state: { ...state, counts },
      feedback: pitchFeedback,
      completedNow: false,
    };
  }

  const timingTransition = state.timing === null ? null : evaluateTiming(exercise, state.timing, expectedEvent, event.timestamp);
  const timing = timingTransition?.state ?? null;
  const feedback: EvaluationFeedback =
    timingTransition === null
      ? pitchFeedback
      : {
          ...pitchFeedback,
          message: `${pitchFeedback.message} ${timingTransition.feedback.message}`,
          timing: timingTransition.feedback,
        };

  const nextExpectedIndex = state.nextExpectedIndex + 1;
  const completed = nextExpectedIndex === exercise.expectedEvents.length;
  const completionSummary = completed ? createCompletionSummary(counts, timing) : null;

  return {
    state: {
      ...state,
      nextExpectedIndex,
      acceptedEventIds: [...state.acceptedEventIds, expectedEvent.id],
      counts,
      timing,
      completed,
      completionSummary,
    },
    feedback,
    completedNow: completed,
  };
}
