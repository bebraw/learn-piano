import { describe, expect, it } from "vitest";
import type { NormalizedMidiEvent } from "../midi/types.js";
import { createEvaluationState, evaluateMidiEvent, formatMidiNote, type EvaluationState } from "./evaluator.js";
import { fiveNoteAscentExercise } from "./library/five-note-ascent.js";
import { parseExercise } from "./schema.js";

function noteOn(noteNumber: number, timestamp = 100): NormalizedMidiEvent {
  return { type: "note-on", channel: 1, noteNumber, velocity: 64, timestamp };
}

function noteOff(noteNumber: number, timestamp = 100): NormalizedMidiEvent {
  return { type: "note-off", channel: 1, noteNumber, velocity: 0, timestamp };
}

function playNotes(state: EvaluationState, noteNumbers: readonly number[]): EvaluationState {
  let nextState = state;
  for (const [index, noteNumber] of noteNumbers.entries()) {
    nextState = evaluateMidiEvent(fiveNoteAscentExercise, nextState, noteOn(noteNumber, index * 100)).state;
  }
  return nextState;
}

describe("formatMidiNote", () => {
  it("uses scientific pitch notation with middle C as C4", () => {
    expect(formatMidiNote(60)).toBe("C4");
    expect(formatMidiNote(59)).toBe("B3");
    expect(formatMidiNote(61)).toBe("C♯4");
  });

  it("uses an explicit fallback for invalid MIDI notes", () => {
    expect(formatMidiNote(-1)).toBe("MIDI note -1");
    expect(formatMidiNote(60.5)).toBe("MIDI note 60.5");
  });
});

describe("createEvaluationState", () => {
  it("binds clean progress to one canonical exercise revision", () => {
    expect(createEvaluationState(fiveNoteAscentExercise)).toEqual({
      exerciseId: "five-note-ascent-c-major-right-hand",
      exerciseRevision: 1,
      nextExpectedIndex: 0,
      acceptedEventIds: [],
      counts: { correct: 0, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: false,
      completionSummary: null,
    });
  });
});

describe("evaluateMidiEvent", () => {
  it("accepts C4-D4-E4-F4-G4 in order and completes exactly once", () => {
    let state = createEvaluationState(fiveNoteAscentExercise);
    const notes = [60, 62, 64, 65, 67];

    for (const [index, noteNumber] of notes.entries()) {
      const transition = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(noteNumber, index * 100));

      expect(transition.feedback?.classification).toBe("correct");
      expect(transition.feedback?.message).toBe(`Correct: ${formatMidiNote(noteNumber)}.`);
      expect(transition.completedNow).toBe(index === notes.length - 1);
      state = transition.state;
    }

    expect(state).toMatchObject({
      nextExpectedIndex: 5,
      counts: { correct: 5, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      completionSummary: {
        errorFree: true,
        message: "The sequence was correct.",
        observations: [],
      },
    });
    expect(state.acceptedEventIds).toEqual(["right-hand-c4", "right-hand-d4", "right-hand-e4", "right-hand-f4", "right-hand-g4"]);

    const afterCompletion = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60, 900));
    expect(afterCompletion).toEqual({ state, feedback: null, completedNow: false });
    expect(afterCompletion.state).toBe(state);
  });

  it("ignores note-off without changing state", () => {
    const state = createEvaluationState(fiveNoteAscentExercise);

    const transition = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOff(60));

    expect(transition).toEqual({ state, feedback: null, completedNow: false });
    expect(transition.state).toBe(state);
  });

  it("classifies only the immediately previous accepted pitch as repeated", () => {
    const afterC = playNotes(createEvaluationState(fiveNoteAscentExercise), [60]);
    const repeated = evaluateMidiEvent(fiveNoteAscentExercise, afterC, noteOn(60));

    expect(repeated.feedback).toEqual({
      classification: "repeated",
      actualNoteNumber: 60,
      expectedNoteNumber: 62,
      expectedEventId: "right-hand-d4",
      message: "You repeated C4. D4 is next.",
    });
    expect(repeated.state.nextExpectedIndex).toBe(1);
    expect(repeated.state.counts).toEqual({
      correct: 1,
      repeated: 1,
      outOfOrder: 0,
      wrong: 0,
    });

    const afterD = evaluateMidiEvent(fiveNoteAscentExercise, repeated.state, noteOn(62)).state;
    const olderAcceptedPitch = evaluateMidiEvent(fiveNoteAscentExercise, afterD, noteOn(60));
    expect(olderAcceptedPitch.feedback?.classification).toBe("wrong");
    expect(olderAcceptedPitch.state.nextExpectedIndex).toBe(2);
  });

  it("classifies a future pending note as out of order", () => {
    const state = createEvaluationState(fiveNoteAscentExercise);

    const transition = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(64));

    expect(transition.feedback).toEqual({
      classification: "out-of-order",
      actualNoteNumber: 64,
      expectedNoteNumber: 60,
      expectedEventId: "right-hand-c4",
      message: "You played E4 before C4. C4 is next.",
    });
    expect(transition.state.nextExpectedIndex).toBe(0);
    expect(transition.state.acceptedEventIds).toEqual([]);
  });

  it("classifies an unrelated pitch as wrong", () => {
    const afterC = playNotes(createEvaluationState(fiveNoteAscentExercise), [60]);

    const transition = evaluateMidiEvent(fiveNoteAscentExercise, afterC, noteOn(59));

    expect(transition.feedback).toEqual({
      classification: "wrong",
      actualNoteNumber: 59,
      expectedNoteNumber: 62,
      expectedEventId: "right-hand-d4",
      message: "You played B3. D4 is next.",
    });
    expect(transition.state.nextExpectedIndex).toBe(1);
  });

  it("preserves progress through errors and reports at most two observations", () => {
    let state = createEvaluationState(fiveNoteAscentExercise);

    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(62)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(59)).state;
    state = playNotes(state, [62, 64, 65, 67]);

    expect(state.completed).toBe(true);
    expect(state.counts).toEqual({ correct: 5, repeated: 1, outOfOrder: 1, wrong: 1 });
    expect(state.completionSummary).toEqual({
      errorFree: false,
      message: "Sequence complete.",
      observations: [
        {
          classification: "out-of-order",
          count: 1,
          message: "One note was played out of order.",
        },
        {
          classification: "repeated",
          count: 1,
          message: "You repeated a note once.",
        },
      ],
    });
  });

  it("uses deterministic plural completion observations", () => {
    let state = createEvaluationState(fiveNoteAscentExercise);
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(62)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(62)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(59)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(58)).state;
    state = playNotes(state, [62, 64, 65, 67]);

    expect(state.completionSummary?.observations).toEqual([
      {
        classification: "out-of-order",
        count: 2,
        message: "2 notes were played out of order.",
      },
      {
        classification: "repeated",
        count: 2,
        message: "You repeated notes 2 times.",
      },
    ]);
    expect(state.counts.wrong).toBe(2);
  });

  it("treats a repeated expected pitch as correct by expected-event identity", () => {
    const repeatedPitchExercise = parseExercise({
      ...fiveNoteAscentExercise,
      id: "repeated-pitch-test",
      expectedEvents: [
        { id: "c4-first", kind: "note", noteNumber: 60, hand: "right" },
        { id: "c4-second", kind: "note", noteNumber: 60, hand: "right" },
      ],
    });
    let state = createEvaluationState(repeatedPitchExercise);

    state = evaluateMidiEvent(repeatedPitchExercise, state, noteOn(60)).state;
    const secondC = evaluateMidiEvent(repeatedPitchExercise, state, noteOn(60));

    expect(secondC.feedback?.classification).toBe("correct");
    expect(secondC.state.acceptedEventIds).toEqual(["c4-first", "c4-second"]);
    expect(secondC.state.completed).toBe(true);
  });

  it("processes equal timestamps in delivery order", () => {
    let state = createEvaluationState(fiveNoteAscentExercise);

    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60, 500)).state;
    state = evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(62, 500)).state;

    expect(state.nextExpectedIndex).toBe(2);
    expect(state.counts.correct).toBe(2);
  });

  it("rejects state from another exercise revision", () => {
    const state = {
      ...createEvaluationState(fiveNoteAscentExercise),
      exerciseRevision: 2,
    };

    expect(() => evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60))).toThrow(/different exercise revision/);
  });

  it("rejects inconsistent state progress", () => {
    const state = {
      ...createEvaluationState(fiveNoteAscentExercise),
      nextExpectedIndex: -1,
    };

    expect(() => evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60))).toThrow(/invalid expected-event progress/);
  });

  it("rejects a non-completed state with no pending event", () => {
    const state: EvaluationState = {
      ...createEvaluationState(fiveNoteAscentExercise),
      nextExpectedIndex: fiveNoteAscentExercise.expectedEvents.length,
      acceptedEventIds: fiveNoteAscentExercise.expectedEvents.map(({ id }) => id),
    };

    expect(() => evaluateMidiEvent(fiveNoteAscentExercise, state, noteOn(60))).toThrow(/no next expected event/);
  });
});
