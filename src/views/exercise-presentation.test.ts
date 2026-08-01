import { describe, expect, it } from "vitest";
import { evenEighthsRightHandExercise } from "../exercises/library/even-eighth-exercises.js";
import { fiveFourPulseRightHandExercise } from "../exercises/library/five-four-pulse-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { mixedEighthPatternRightHandExercise } from "../exercises/library/mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipRightHandExercise } from "../exercises/library/offbeat-step-skip-exercises.js";
import {
  orderedChordTonesRightHandExercise,
  orderedDMinorChordTonesRightHandExercise,
} from "../exercises/library/ordered-chord-tone-exercises.js";
import { repeatedNotesRightHandExercise } from "../exercises/library/repeated-note-exercises.js";
import { steadyBrokenChordRightHandExercise } from "../exercises/library/steady-broken-chord-exercises.js";
import { steadyQuarterRightHandExercise } from "../exercises/library/steady-quarter-exercises.js";
import { threeFourBrokenChordRightHandExercise } from "../exercises/library/three-four-broken-chord-exercises.js";
import type { Exercise } from "../exercises/types.js";
import {
  exercisePracticeHref,
  formatExerciseCategory,
  formatExerciseDifficulty,
  formatExerciseHand,
  formatExerciseNoteOrder,
  formatExerciseTimingLabel,
  formatPracticeKeyboardNoteLabel,
  formatPracticeKeyboardRange,
  getExerciseRhythmPresentation,
  projectPracticeKeyboardNotes,
} from "./exercise-presentation.js";

describe("exercise presentation", () => {
  it("derives labels and links from canonical exercise data", () => {
    expect(exercisePracticeHref(fiveNoteAscentExercise)).toBe("/practice?exercise=five-note-ascent-c-major-right-hand");
    expect(formatExerciseNoteOrder(fiveNoteAscentExercise)).toBe("C4 · D4 · E4 · F4 · G4");
    expect(formatExerciseHand(fiveNoteAscentExercise)).toBe("Right hand");
    expect(formatExerciseCategory(fiveNoteAscentExercise)).toBe("Notes and reading");
    expect(formatExerciseDifficulty(fiveNoteAscentExercise)).toBe("Beginner");
  });

  it("handles left-hand, both-hands, and fallback category labels", () => {
    const leftHand: Exercise = {
      ...fiveNoteAscentExercise,
      id: "left hand/one",
      curriculumTags: ["sight-reading.steps"],
      expectedEvents: fiveNoteAscentExercise.expectedEvents.map((event) => ({ ...event, hand: "left" })),
    };
    const bothHands: Exercise = {
      ...leftHand,
      expectedEvents: [leftHand.expectedEvents[0]!, { ...leftHand.expectedEvents[1]!, hand: "right" }],
    };

    expect(exercisePracticeHref(leftHand)).toBe("/practice?exercise=left%20hand%2Fone");
    expect(formatExerciseHand(leftHand)).toBe("Left hand");
    expect(formatExerciseHand(bothHands)).toBe("Both hands");
    expect(formatExerciseCategory(leftHand)).toBe("Sight reading");
  });

  it("uses a calm fallback when curriculum tags are absent", () => {
    expect(formatExerciseCategory({ ...fiveNoteAscentExercise, curriculumTags: [] })).toBe("Focused practice");
    expect(
      formatExerciseHand({
        ...fiveNoteAscentExercise,
        expectedEvents: [{ ...fiveNoteAscentExercise.expectedEvents[0]!, hand: "both" }],
      }),
    ).toBe("Both hands");
  });

  it("classifies untimed, quarter-note, even-eighth, offbeat-eighth, and other timed grids from canonical offsets", () => {
    const genericBeatOffsets = [0, 0.5, 1.5, 2, 3] as const;
    const genericTimed: Exercise = {
      ...steadyQuarterRightHandExercise,
      id: "timed-with-another-grid",
      expectedEvents: steadyQuarterRightHandExercise.expectedEvents.map((event, index) => ({
        ...event,
        beatOffset: genericBeatOffsets[index]!,
      })),
    };
    const threeFourWithTwoBeatCountIn: Exercise = {
      ...threeFourBrokenChordRightHandExercise,
      id: "three-four-with-two-beat-count-in",
      timing: {
        ...threeFourBrokenChordRightHandExercise.timing!,
        countInBeats: 2,
      },
    };

    expect(getExerciseRhythmPresentation(fiveNoteAscentExercise)).toMatchObject({
      kind: "untimed",
      label: "Untimed",
      practiceTask: "Play the notes in order.",
      staffLabel: "Pitch order · No fixed rhythm",
    });
    expect(getExerciseRhythmPresentation(steadyQuarterRightHandExercise)).toMatchObject({
      kind: "steady-quarter",
      label: "Steady pulse",
      practiceTask: "After the count-in, place one note on each beat.",
      staffLabel: "Pitch order · One note per beat",
    });
    expect(getExerciseRhythmPresentation(steadyBrokenChordRightHandExercise)).toMatchObject({
      kind: "steady-quarter",
      label: "Steady pulse",
      practiceTask: "After the count-in, place one note on each beat.",
      staffLabel: "Pitch order · One note per beat",
    });
    expect(getExerciseRhythmPresentation(threeFourBrokenChordRightHandExercise)).toMatchObject({
      kind: "steady-quarter",
      label: "Steady pulse",
      practiceTask: "After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.",
      staffLabel: "Pitch order · One note per beat",
    });
    expect(getExerciseRhythmPresentation(fiveFourPulseRightHandExercise)).toMatchObject({
      kind: "steady-quarter",
      label: "Steady pulse",
      practiceTask: "After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.",
      staffLabel: "Pitch order · One note per beat",
    });
    expect(formatExerciseTimingLabel(fiveFourPulseRightHandExercise, true)).toBe("Steady pulse · 60 BPM · 5/4");
    expect(getExerciseRhythmPresentation(threeFourWithTwoBeatCountIn)).toMatchObject({
      kind: "steady-quarter",
      label: "Steady pulse",
      practiceTask: "After the two-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.",
      staffLabel: "Pitch order · One note per beat",
    });
    expect(getExerciseRhythmPresentation(evenEighthsRightHandExercise)).toMatchObject({
      kind: "even-eighth",
      label: "Eighth-note grid",
      practiceTask:
        "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3.",
      staffLabel: "Pitch order · Even eighth-note onsets",
    });
    expect(getExerciseRhythmPresentation(offbeatStepSkipRightHandExercise)).toMatchObject({
      kind: "offbeat-eighth",
      label: "Offbeat grid",
      practiceTask:
        "After the count-in, play the first note on 1, then place each remaining note on an “and” count between clicks. Count 1 & 2 & 3 & 4 &.",
      staffLabel: "Pitch order · Downbeat then offbeat onsets",
    });
    expect(getExerciseRhythmPresentation(genericTimed)).toMatchObject({
      kind: "timed",
      label: "Timed study",
      practiceTask: "After the count-in, follow the study's timing guide.",
      staffLabel: "Pitch order · Timing shown separately",
    });
    expect(formatExerciseTimingLabel(genericTimed)).toBe("Timed study · 60 BPM");
    expect(
      [
        fiveNoteAscentExercise,
        steadyQuarterRightHandExercise,
        steadyBrokenChordRightHandExercise,
        threeFourBrokenChordRightHandExercise,
        fiveFourPulseRightHandExercise,
        evenEighthsRightHandExercise,
        offbeatStepSkipRightHandExercise,
        genericTimed,
      ].every((exercise) => !getExerciseRhythmPresentation(exercise).practiceTask.includes("key stays lit")),
    ).toBe(true);
  });

  it("derives the practice count from every onset in a strict half-beat grid", () => {
    expect(getExerciseRhythmPresentation(evenEighthsRightHandExercise).practiceTask).toBe(
      "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3.",
    );
    expect(getExerciseRhythmPresentation(mixedEighthPatternRightHandExercise)).toMatchObject({
      kind: "even-eighth",
      practiceTask:
        "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3 & 4 &.",
      staffLabel: "Pitch order · Even eighth-note onsets",
    });
  });

  it("wraps a strict half-beat count at the exercise's measure boundary", () => {
    const threeFourGrid: Exercise = {
      ...mixedEighthPatternRightHandExercise,
      id: "three-four-eight-event-grid",
      timing: { ...mixedEighthPatternRightHandExercise.timing!, beatsPerMeasure: 3 },
    };

    expect(getExerciseRhythmPresentation(threeFourGrid).practiceTask).toBe(
      "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3 & 1 &.",
    );
  });

  it("derives a one-measure offbeat count from the exercise meter", () => {
    const threeFourOffbeats: Exercise = {
      ...offbeatStepSkipRightHandExercise,
      id: "three-four-offbeat-grid",
      timing: { ...offbeatStepSkipRightHandExercise.timing!, beatsPerMeasure: 3 },
      expectedEvents: offbeatStepSkipRightHandExercise.expectedEvents.slice(0, 4),
    };

    expect(getExerciseRhythmPresentation(threeFourOffbeats)).toMatchObject({
      kind: "offbeat-eighth",
      practiceTask:
        "After the count-in, play the first note on 1, then place each remaining note on an “and” count between clicks. Count 1 & 2 & 3 &.",
    });
  });

  it("classifies offbeat grids from timing data rather than exercise metadata", () => {
    const neutralOffbeatGrid: Exercise = {
      ...offbeatStepSkipRightHandExercise,
      id: "timed-study-with-neutral-metadata",
      title: "Timed study with neutral metadata",
    };
    const misleadingOffbeatMetadata: Exercise = {
      ...offbeatStepSkipRightHandExercise,
      id: "offbeat-grid-with-irregular-timing",
      title: "Offbeat grid with irregular timing",
      expectedEvents: offbeatStepSkipRightHandExercise.expectedEvents.map((event, index) =>
        index === 4 ? { ...event, beatOffset: 3.75 } : event,
      ),
    };

    expect(getExerciseRhythmPresentation(neutralOffbeatGrid).kind).toBe("offbeat-eighth");
    expect(getExerciseRhythmPresentation(misleadingOffbeatMetadata).kind).toBe("timed");
  });

  it("keeps an irregular eight-event grid on the generic timed fallback", () => {
    const irregularGrid: Exercise = {
      ...mixedEighthPatternRightHandExercise,
      id: "irregular-eight-event-grid",
      expectedEvents: mixedEighthPatternRightHandExercise.expectedEvents.map((event, index) =>
        index === 7 ? { ...event, beatOffset: 3.75 } : event,
      ),
    };

    expect(getExerciseRhythmPresentation(irregularGrid)).toMatchObject({
      kind: "timed",
      label: "Timed study",
      practiceTask: "After the count-in, follow the study's timing guide.",
      staffLabel: "Pitch order · Timing shown separately",
    });
  });

  it("does not name subdivisions without a quarter-note beat unit", () => {
    const eighthNoteBeat: Exercise = {
      ...evenEighthsRightHandExercise,
      id: "half-offsets-with-an-eighth-note-beat",
      timing: { ...evenEighthsRightHandExercise.timing!, beatUnit: 8 },
    };

    expect(getExerciseRhythmPresentation(eighthNoteBeat)).toMatchObject({
      kind: "timed",
      label: "Timed study",
      staffLabel: "Pitch order · Timing shown separately",
    });
    expect(
      getExerciseRhythmPresentation({
        ...offbeatStepSkipRightHandExercise,
        id: "offbeats-with-an-eighth-note-beat",
        timing: { ...offbeatStepSkipRightHandExercise.timing!, beatUnit: 8 },
      }),
    ).toMatchObject({ kind: "timed", label: "Timed study" });
  });

  it("formats rhythm labels with tempo and optional meter", () => {
    expect(formatExerciseTimingLabel(fiveNoteAscentExercise)).toBe("Untimed");
    expect(formatExerciseTimingLabel(steadyQuarterRightHandExercise)).toBe("Steady pulse · 60 BPM");
    expect(formatExerciseTimingLabel(steadyBrokenChordRightHandExercise, true)).toBe("Steady pulse · 60 BPM · 4/4");
    expect(formatExerciseTimingLabel(threeFourBrokenChordRightHandExercise, true)).toBe("Steady pulse · 60 BPM · 3/4");
    expect(formatExerciseTimingLabel(evenEighthsRightHandExercise, true)).toBe("Eighth-note grid · 60 BPM · 4/4");
    expect(formatExerciseTimingLabel(offbeatStepSkipRightHandExercise, true)).toBe("Offbeat grid · 60 BPM · 4/4");
  });

  it("projects one physical natural-note span while retaining canonical accidentals", () => {
    const chromaticFixture: Exercise = {
      ...orderedChordTonesRightHandExercise,
      expectedEvents: [
        { ...orderedChordTonesRightHandExercise.expectedEvents[0]!, id: "c-sharp", noteNumber: 61 },
        { ...orderedChordTonesRightHandExercise.expectedEvents[2]!, id: "g", noteNumber: 67 },
      ],
    };

    expect(projectPracticeKeyboardNotes(orderedChordTonesRightHandExercise)).toEqual([60, 62, 64, 65, 67]);
    expect(projectPracticeKeyboardNotes(orderedDMinorChordTonesRightHandExercise)).toEqual([62, 64, 65, 67, 69]);
    expect(projectPracticeKeyboardNotes(threeFourBrokenChordRightHandExercise)).toEqual([60, 62, 64, 65, 67]);
    expect(projectPracticeKeyboardNotes(repeatedNotesRightHandExercise)).toEqual([60, 62, 64]);
    expect(projectPracticeKeyboardNotes(chromaticFixture)).toEqual([61, 62, 64, 65, 67]);
    expect(projectPracticeKeyboardNotes({ ...fiveNoteAscentExercise, expectedEvents: [] })).toEqual([]);
  });

  it("derives a learner-facing pitch range from the projected physical keys", () => {
    expect(formatPracticeKeyboardRange(fiveNoteAscentExercise)).toBe("C–G range");
    expect(formatPracticeKeyboardRange(orderedDMinorChordTonesRightHandExercise)).toBe("D–A range");
    expect(
      formatPracticeKeyboardRange({
        ...fiveNoteAscentExercise,
        expectedEvents: [fiveNoteAscentExercise.expectedEvents[0]!],
      }),
    ).toBe("C key");
    expect(formatPracticeKeyboardRange({ ...fiveNoteAscentExercise, expectedEvents: [] })).toBe("Keyboard range");
  });

  it("names every physical-key state for assistive technology", () => {
    expect(formatPracticeKeyboardNoteLabel(60, "expected")).toBe("C4, next note");
    expect(formatPracticeKeyboardNoteLabel(62, "idle")).toBe("D4, not in phrase");
    expect(formatPracticeKeyboardNoteLabel(64, "remaining")).toBe("E4, later in phrase");
    expect(formatPracticeKeyboardNoteLabel(67, "accepted")).toBe("G4, completed");
  });
});
