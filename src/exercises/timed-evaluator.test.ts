import { describe, expect, it } from "vitest";
import type { NormalizedMidiEvent } from "../midi/types.js";
import { createEvaluationState, evaluateMidiEvent } from "./evaluator.js";
import { evenEighthsRightHandExercise } from "./library/even-eighth-exercises.js";
import { fiveNoteAscentExercise } from "./library/five-note-ascent.js";
import { mixedEighthPatternRightHandExercise } from "./library/mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipRightHandExercise } from "./library/offbeat-step-skip-exercises.js";
import { repeatedNotesRightHandExercise } from "./library/repeated-note-exercises.js";
import { steadyBrokenChordRightHandExercise } from "./library/steady-broken-chord-exercises.js";
import { steadyQuarterRightHandExercise, steadyQuarterStepSkipRightHandExercise } from "./library/steady-quarter-exercises.js";
import { threeFourBrokenChordRightHandExercise } from "./library/three-four-broken-chord-exercises.js";
import { parseExercise } from "./schema.js";

function noteOn(noteNumber: number, timestamp: number): NormalizedMidiEvent {
  return { type: "note-on", channel: 1, noteNumber, velocity: 72, timestamp };
}

describe("timed ordered-note evaluation", () => {
  it("anchors the first correct note and classifies later notes against its beat grid", () => {
    let state = createEvaluationState(steadyQuarterRightHandExercise);
    const performance = [noteOn(60, 1_000), noteOn(62, 2_000), noteOn(64, 2_700), noteOn(65, 4_300), noteOn(67, 5_000)];
    const timingClassifications: string[] = [];

    for (const event of performance) {
      const transition = evaluateMidiEvent(steadyQuarterRightHandExercise, state, event);
      if (transition.feedback?.timing !== undefined) {
        timingClassifications.push(transition.feedback.timing.classification);
      }
      state = transition.state;
    }

    expect(timingClassifications).toEqual(["anchor", "on-pulse", "early", "late", "on-pulse"]);
    expect(state.timing).toEqual({
      tempoBpm: 60,
      anchorTimestamp: 1_000,
      assessedIntervals: 4,
      onPulse: 2,
      early: 1,
      late: 1,
      totalAbsoluteErrorMs: 600,
    });
    expect(state.completionSummary?.timing).toEqual({
      tempoBpm: 60,
      assessedIntervals: 4,
      onPulse: 2,
      early: 1,
      late: 1,
      meanAbsoluteErrorMs: 150,
      message: "2 of 4 intervals were on time at 60 BPM. 1 interval was early. 1 interval was late.",
    });
  });

  it("treats both proportional tolerance boundaries as on-pulse and values outside them as early or late", () => {
    let state = createEvaluationState(steadyQuarterRightHandExercise);
    state = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(60, 1_000)).state;

    const earlyBoundary = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(62, 1_800));
    const earlyOutside = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(62, 1_799.9));
    const lateBoundary = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(62, 2_200));
    const lateOutside = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(62, 2_200.1));

    expect(earlyBoundary.feedback?.timing).toMatchObject({ classification: "on-pulse", deviationMs: -200, message: "On time." });
    expect(earlyOutside.feedback?.timing?.classification).toBe("early");
    expect(lateBoundary.feedback?.timing).toMatchObject({ classification: "on-pulse", deviationMs: 200 });
    expect(lateOutside.feedback?.timing?.classification).toBe("late");
  });

  it("does not establish a timing anchor from a pitch error before the first accepted note", () => {
    const state = createEvaluationState(steadyQuarterRightHandExercise);

    const wrong = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(59, 500));
    const anchored = evaluateMidiEvent(steadyQuarterRightHandExercise, wrong.state, noteOn(60, 1_000));

    expect(wrong.feedback?.classification).toBe("wrong");
    expect(wrong.feedback?.timing).toBeUndefined();
    expect(wrong.state.timing?.anchorTimestamp).toBeNull();
    expect(anchored.feedback?.timing?.classification).toBe("anchor");
    expect(anchored.state.timing?.anchorTimestamp).toBe(1_000);
  });

  it("keeps pitch errors orthogonal to the anchored timing grid", () => {
    let state = createEvaluationState(steadyQuarterRightHandExercise);
    state = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(60, 1_000)).state;

    const wrong = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(59, 1_500));
    expect(wrong.feedback?.classification).toBe("wrong");
    expect(wrong.feedback?.timing).toBeUndefined();
    expect(wrong.state.timing?.anchorTimestamp).toBe(1_000);

    const corrected = evaluateMidiEvent(steadyQuarterRightHandExercise, wrong.state, noteOn(62, 2_000));
    expect(corrected.feedback?.timing?.classification).toBe("on-pulse");
    expect(corrected.state.timing).toMatchObject({ assessedIntervals: 1, onPulse: 1 });
  });

  it("uses a validated session tempo without changing canonical defaults", () => {
    let state = createEvaluationState(steadyQuarterRightHandExercise, 100);
    state = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(60, 500)).state;
    const second = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(62, 1_100));

    expect(second.feedback?.timing).toMatchObject({ classification: "on-pulse", deviationMs: 0 });
    expect(second.state.timing?.tempoBpm).toBe(100);
    expect(steadyQuarterRightHandExercise.timing?.defaultBpm).toBe(60);
  });

  it("rejects invalid tempo overrides and tempo on untimed exercises", () => {
    expect(() => createEvaluationState(steadyQuarterRightHandExercise, 39)).toThrow(RangeError);
    expect(() => createEvaluationState(steadyQuarterRightHandExercise, 101)).toThrow(RangeError);
    expect(() => createEvaluationState(steadyQuarterRightHandExercise, 60.5)).toThrow(RangeError);
    expect(() => createEvaluationState(fiveNoteAscentExercise, 60)).toThrow(/untimed exercise/);
  });

  it("summarizes a fully steady pulse without turning timing into a grade", () => {
    let state = createEvaluationState(steadyQuarterRightHandExercise);
    for (const [index, event] of steadyQuarterRightHandExercise.expectedEvents.entries()) {
      state = evaluateMidiEvent(steadyQuarterRightHandExercise, state, noteOn(event.noteNumber, 2_000 + index * 1_000)).state;
    }

    expect(state.completionSummary).toMatchObject({
      errorFree: true,
      message: "The sequence was correct.",
      timing: {
        assessedIntervals: 4,
        onPulse: 4,
        early: 0,
        late: 0,
        meanAbsoluteErrorMs: 0,
        message: "All 4 intervals were on time at 60 BPM.",
      },
    });
  });

  it("keeps step-and-skip pitch order on successive canonical beats", () => {
    let state = createEvaluationState(steadyQuarterStepSkipRightHandExercise);

    for (const [index, event] of steadyQuarterStepSkipRightHandExercise.expectedEvents.entries()) {
      state = evaluateMidiEvent(steadyQuarterStepSkipRightHandExercise, state, noteOn(event.noteNumber, 2_000 + index * 1_000)).state;
    }

    expect(steadyQuarterStepSkipRightHandExercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([60, 64, 62, 65, 67]);
    expect(state.completionSummary).toMatchObject({
      errorFree: true,
      timing: {
        assessedIntervals: 4,
        onPulse: 4,
        early: 0,
        late: 0,
        meanAbsoluteErrorMs: 0,
      },
    });
  });

  it("evaluates even eighth-note onsets on successive half-beat offsets", () => {
    let state = createEvaluationState(evenEighthsRightHandExercise);

    for (const [index, event] of evenEighthsRightHandExercise.expectedEvents.entries()) {
      state = evaluateMidiEvent(evenEighthsRightHandExercise, state, noteOn(event.noteNumber, 2_000 + index * 500)).state;
    }

    expect(evenEighthsRightHandExercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(state.completionSummary).toMatchObject({
      errorFree: true,
      timing: {
        assessedIntervals: 4,
        onPulse: 4,
        early: 0,
        late: 0,
        meanAbsoluteErrorMs: 0,
      },
    });
  });

  it("accepts adjacent repeated-note occurrences on the eighth-note grid", () => {
    let state = createEvaluationState(repeatedNotesRightHandExercise);

    for (const [index, event] of repeatedNotesRightHandExercise.expectedEvents.entries()) {
      const transition = evaluateMidiEvent(repeatedNotesRightHandExercise, state, noteOn(event.noteNumber, 2_000 + index * 500));
      expect(transition.feedback?.classification).toBe("correct");
      state = transition.state;
    }

    expect(state).toMatchObject({
      nextExpectedIndex: 5,
      counts: { correct: 5, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      timing: {
        assessedIntervals: 4,
        onPulse: 4,
        early: 0,
        late: 0,
      },
    });
  });

  it("evaluates an eight-onset mixed pattern across a complete four-beat grid", () => {
    let state = createEvaluationState(mixedEighthPatternRightHandExercise);

    for (const [index, event] of mixedEighthPatternRightHandExercise.expectedEvents.entries()) {
      const transition = evaluateMidiEvent(mixedEighthPatternRightHandExercise, state, noteOn(event.noteNumber, 2_000 + index * 500));
      expect(transition.feedback?.classification).toBe("correct");
      state = transition.state;
    }

    expect(mixedEighthPatternRightHandExercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([
      60, 64, 62, 62, 65, 67, 64, 60,
    ]);
    expect(mixedEighthPatternRightHandExercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([
      0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5,
    ]);
    expect(state).toMatchObject({
      nextExpectedIndex: 8,
      counts: { correct: 8, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      completionSummary: {
        errorFree: true,
        timing: {
          assessedIntervals: 7,
          onPulse: 7,
          early: 0,
          late: 0,
          meanAbsoluteErrorMs: 0,
        },
      },
    });
  });

  it("evaluates an exact eight-note broken-chord pulse independently of timestamp origin", () => {
    const performAt = (anchorTimestamp: number) => {
      let state = createEvaluationState(steadyBrokenChordRightHandExercise);
      const timingClassifications: string[] = [];

      for (const event of steadyBrokenChordRightHandExercise.expectedEvents) {
        const transition = evaluateMidiEvent(
          steadyBrokenChordRightHandExercise,
          state,
          noteOn(event.noteNumber, anchorTimestamp + event.beatOffset! * 1_000),
        );
        expect(transition.feedback?.classification).toBe("correct");
        if (transition.feedback?.timing !== undefined) {
          timingClassifications.push(transition.feedback.timing.classification);
        }
        state = transition.state;
      }

      return { state, timingClassifications };
    };

    const first = performAt(2_000);
    const translated = performAt(12_000);

    expect(steadyBrokenChordRightHandExercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(first.timingClassifications).toEqual([
      "anchor",
      "on-pulse",
      "on-pulse",
      "on-pulse",
      "on-pulse",
      "on-pulse",
      "on-pulse",
      "on-pulse",
    ]);
    expect(first.state).toMatchObject({
      nextExpectedIndex: 8,
      counts: { correct: 8, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      timing: {
        tempoBpm: 60,
        anchorTimestamp: 2_000,
        assessedIntervals: 7,
        onPulse: 7,
        early: 0,
        late: 0,
        totalAbsoluteErrorMs: 0,
      },
      completionSummary: {
        errorFree: true,
        timing: { tempoBpm: 60, assessedIntervals: 7, onPulse: 7, early: 0, late: 0, meanAbsoluteErrorMs: 0 },
      },
    });
    expect(translated.timingClassifications).toEqual(first.timingClassifications);
    expect(translated.state.timing).toEqual({ ...first.state.timing, anchorTimestamp: 12_000 });
    expect(translated.state.completionSummary).toEqual(first.state.completionSummary);
  });

  it("evaluates the seven-note 3/4 broken chord independently of timestamp origin", () => {
    const performAt = (anchorTimestamp: number) => {
      let state = createEvaluationState(threeFourBrokenChordRightHandExercise);
      const timingClassifications: string[] = [];

      for (const event of threeFourBrokenChordRightHandExercise.expectedEvents) {
        const transition = evaluateMidiEvent(
          threeFourBrokenChordRightHandExercise,
          state,
          noteOn(event.noteNumber, anchorTimestamp + event.beatOffset! * 1_000),
        );
        expect(transition.feedback?.classification).toBe("correct");
        if (transition.feedback?.timing !== undefined) {
          timingClassifications.push(transition.feedback.timing.classification);
        }
        state = transition.state;
      }

      return { state, timingClassifications };
    };

    const first = performAt(2_000);
    const translated = performAt(12_000);

    expect(threeFourBrokenChordRightHandExercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([60, 64, 67, 60, 64, 67, 60]);
    expect(threeFourBrokenChordRightHandExercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(first.timingClassifications).toEqual(["anchor", "on-pulse", "on-pulse", "on-pulse", "on-pulse", "on-pulse", "on-pulse"]);
    expect(first.state).toMatchObject({
      nextExpectedIndex: 7,
      counts: { correct: 7, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      timing: {
        tempoBpm: 60,
        anchorTimestamp: 2_000,
        assessedIntervals: 6,
        onPulse: 6,
        early: 0,
        late: 0,
        totalAbsoluteErrorMs: 0,
      },
      completionSummary: {
        errorFree: true,
        timing: { tempoBpm: 60, assessedIntervals: 6, onPulse: 6, early: 0, late: 0, meanAbsoluteErrorMs: 0 },
      },
    });
    expect(translated.timingClassifications).toEqual(first.timingClassifications);
    expect(translated.state.timing).toEqual({ ...first.state.timing, anchorTimestamp: 12_000 });
    expect(translated.state.completionSummary).toEqual(first.state.completionSummary);
  });

  it("evaluates offbeat onsets from the fixed first-note anchor regardless of timestamp origin", () => {
    const performAt = (anchorTimestamp: number) => {
      let state = createEvaluationState(offbeatStepSkipRightHandExercise);
      const timingClassifications: string[] = [];

      for (const event of offbeatStepSkipRightHandExercise.expectedEvents) {
        const transition = evaluateMidiEvent(
          offbeatStepSkipRightHandExercise,
          state,
          noteOn(event.noteNumber, anchorTimestamp + event.beatOffset! * 1_000),
        );
        if (transition.feedback?.timing !== undefined) {
          timingClassifications.push(transition.feedback.timing.classification);
        }
        state = transition.state;
      }

      return { state, timingClassifications };
    };

    const first = performAt(2_000);
    const translated = performAt(12_000);

    expect(offbeatStepSkipRightHandExercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 0.5, 1.5, 2.5, 3.5]);
    expect(first.timingClassifications).toEqual(["anchor", "on-pulse", "on-pulse", "on-pulse", "on-pulse"]);
    expect(first.state).toMatchObject({
      nextExpectedIndex: 5,
      counts: { correct: 5, repeated: 0, outOfOrder: 0, wrong: 0 },
      completed: true,
      timing: {
        anchorTimestamp: 2_000,
        assessedIntervals: 4,
        onPulse: 4,
        early: 0,
        late: 0,
        totalAbsoluteErrorMs: 0,
      },
      completionSummary: {
        errorFree: true,
        timing: { assessedIntervals: 4, onPulse: 4, early: 0, late: 0, meanAbsoluteErrorMs: 0 },
      },
    });
    expect(translated.timingClassifications).toEqual(first.timingClassifications);
    expect(translated.state.timing).toEqual({ ...first.state.timing, anchorTimestamp: 12_000 });
    expect(translated.state.completionSummary).toEqual(first.state.completionSummary);
  });

  it("accepts a correctly pitched offbeat onset while reporting a missed half-beat target", () => {
    let state = createEvaluationState(offbeatStepSkipRightHandExercise);
    state = evaluateMidiEvent(offbeatStepSkipRightHandExercise, state, noteOn(60, 1_000)).state;

    const lateE = evaluateMidiEvent(offbeatStepSkipRightHandExercise, state, noteOn(64, 2_000));

    expect(lateE.feedback).toMatchObject({
      classification: "correct",
      timing: { classification: "late", deviationMs: 500 },
    });
    expect(lateE.state).toMatchObject({ nextExpectedIndex: 2, timing: { assessedIntervals: 1, late: 1 } });
  });

  it("keeps an extra same-pitch onset outside the canonical repeated pair off the timing grid", () => {
    let state = createEvaluationState(repeatedNotesRightHandExercise);
    state = evaluateMidiEvent(repeatedNotesRightHandExercise, state, noteOn(60, 2_000)).state;
    state = evaluateMidiEvent(repeatedNotesRightHandExercise, state, noteOn(60, 2_500)).state;

    const extraC = evaluateMidiEvent(repeatedNotesRightHandExercise, state, noteOn(60, 2_700));
    const expectedD = evaluateMidiEvent(repeatedNotesRightHandExercise, extraC.state, noteOn(62, 3_000));
    const secondD = evaluateMidiEvent(repeatedNotesRightHandExercise, expectedD.state, noteOn(62, 3_500));
    const finalE = evaluateMidiEvent(repeatedNotesRightHandExercise, secondD.state, noteOn(64, 4_000));

    expect(extraC.feedback).toMatchObject({
      classification: "repeated",
      actualNoteNumber: 60,
      expectedNoteNumber: 62,
    });
    expect(extraC.feedback?.timing).toBeUndefined();
    expect(extraC.state).toMatchObject({
      nextExpectedIndex: 2,
      timing: { anchorTimestamp: 2_000, assessedIntervals: 1, onPulse: 1 },
    });
    expect(expectedD.feedback).toMatchObject({ classification: "correct", timing: { classification: "on-pulse", deviationMs: 0 } });
    expect(finalE.state).toMatchObject({
      completed: true,
      counts: { correct: 5, repeated: 1, outOfOrder: 0, wrong: 0 },
      completionSummary: {
        errorFree: false,
        message: "Sequence complete.",
        observations: [{ classification: "repeated", count: 1, message: "You added one extra repeat." }],
        timing: { assessedIntervals: 4, onPulse: 4, early: 0, late: 0 },
      },
    });
  });

  it("uses the even-eighth study's narrower tenth-beat tolerance", () => {
    const initial = createEvaluationState(evenEighthsRightHandExercise);
    const anchored = evaluateMidiEvent(evenEighthsRightHandExercise, initial, noteOn(60, 1_000)).state;

    expect(evaluateMidiEvent(evenEighthsRightHandExercise, anchored, noteOn(62, 1_400)).feedback?.timing?.classification).toBe("on-pulse");
    expect(evaluateMidiEvent(evenEighthsRightHandExercise, anchored, noteOn(62, 1_399.9)).feedback?.timing?.classification).toBe("early");
    expect(evaluateMidiEvent(evenEighthsRightHandExercise, anchored, noteOn(62, 1_600)).feedback?.timing?.classification).toBe("on-pulse");
    expect(evaluateMidiEvent(evenEighthsRightHandExercise, anchored, noteOn(62, 1_600.1)).feedback?.timing?.classification).toBe("late");
  });

  it("completes a valid one-note timed study without inventing an assessed interval", () => {
    const oneNoteExercise = parseExercise({
      ...steadyQuarterRightHandExercise,
      id: "single-note-pulse-check",
      expectedEvents: [steadyQuarterRightHandExercise.expectedEvents[0]],
    });

    const transition = evaluateMidiEvent(oneNoteExercise, createEvaluationState(oneNoteExercise), noteOn(60, 1_000));

    expect(transition.completedNow).toBe(true);
    expect(transition.state.completionSummary?.timing).toEqual({
      tempoBpm: 60,
      assessedIntervals: 0,
      onPulse: 0,
      early: 0,
      late: 0,
      meanAbsoluteErrorMs: 0,
      message: "Pulse timing began, but there was no interval to assess.",
    });
  });

  it("uses singular timing copy for one assessed interval", () => {
    const twoNoteExercise = parseExercise({
      ...steadyQuarterRightHandExercise,
      id: "two-note-pulse-check",
      expectedEvents: steadyQuarterRightHandExercise.expectedEvents.slice(0, 2),
    });
    let state = createEvaluationState(twoNoteExercise);

    state = evaluateMidiEvent(twoNoteExercise, state, noteOn(60, 1_000)).state;
    state = evaluateMidiEvent(twoNoteExercise, state, noteOn(62, 2_500)).state;

    expect(state.completionSummary?.timing?.message).toBe("0 of 1 interval was on time at 60 BPM. 1 interval was late.");
  });
});
