import { describe, expect, it } from "vitest";
import {
  fiveNoteAscentLeftHandExercise,
  fiveNoteDescentLeftHandExercise,
  stepSkipLeftHandExercise,
} from "../exercises/library/beginner-five-note-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { mixedEighthPatternRightHandExercise } from "../exercises/library/mixed-eighth-pattern-exercises.js";
import type { ExerciseExpectedEvent } from "../exercises/types.js";
import { projectStaffPitchGuide, STAFF_PITCH_GUIDE_SUPPORTED_RANGES } from "./staff-pitch-guide.js";

describe("projectStaffPitchGuide", () => {
  it("projects the right-hand C position onto a treble staff with a middle-C ledger line", () => {
    const guide = projectStaffPitchGuide(fiveNoteAscentExercise.expectedEvents);

    expect(guide).not.toBeNull();
    expect(guide?.clef).toBe("treble");
    expect(guide?.clefLabel).toBe("Treble");
    expect(guide?.accessibleLabel).toBe("Treble staff pitch order: C4, D4, E4, F4, G4.");
    expect(guide?.viewBox).toEqual({ width: 640, height: 168 });
    expect(guide?.staffLines).toEqual([
      { x1: 56, x2: 616, y: 40 },
      { x1: 56, x2: 616, y: 56 },
      { x1: 56, x2: 616, y: 72 },
      { x1: 56, x2: 616, y: 88 },
      { x1: 56, x2: 616, y: 104 },
    ]);
    expect(guide?.notes.map(({ eventId, noteNumber, label, x, y }) => ({ eventId, noteNumber, label, x, y }))).toEqual([
      { eventId: "right-hand-c4", noteNumber: 60, label: "C4", x: 180, y: 120 },
      { eventId: "right-hand-d4", noteNumber: 62, label: "D4", x: 272, y: 112 },
      { eventId: "right-hand-e4", noteNumber: 64, label: "E4", x: 364, y: 104 },
      { eventId: "right-hand-f4", noteNumber: 65, label: "F4", x: 456, y: 96 },
      { eventId: "right-hand-g4", noteNumber: 67, label: "G4", x: 548, y: 88 },
    ]);
    expect(guide?.notes[0]?.ledgerLines).toEqual([{ x1: 166, x2: 194, y: 120 }]);
    expect(guide?.notes.slice(1).every(({ ledgerLines }) => ledgerLines.length === 0)).toBe(true);
  });

  it("projects left-hand events onto a bass staff while preserving canonical order", () => {
    const guide = projectStaffPitchGuide(fiveNoteDescentLeftHandExercise.expectedEvents);

    expect(guide).not.toBeNull();
    expect(guide?.clef).toBe("bass");
    expect(guide?.clefLabel).toBe("Bass");
    expect(guide?.accessibleLabel).toBe("Bass staff pitch order: G3, F3, E3, D3, C3.");
    expect(guide?.notes.map(({ label, x, y }) => ({ label, x, y }))).toEqual([
      { label: "G3", x: 180, y: 48 },
      { label: "F3", x: 272, y: 56 },
      { label: "E3", x: 364, y: 64 },
      { label: "D3", x: 456, y: 72 },
      { label: "C3", x: 548, y: 80 },
    ]);
    expect(guide?.notes.every(({ ledgerLines }) => ledgerLines.length === 0)).toBe(true);
  });

  it("uses sequence position for horizontal placement and pitch for vertical placement", () => {
    const guide = projectStaffPitchGuide(stepSkipLeftHandExercise.expectedEvents);

    expect(guide?.notes.map(({ label }) => label)).toEqual(["C3", "E3", "D3", "F3", "G3"]);
    expect(guide?.notes.map(({ x }) => x)).toEqual([180, 272, 364, 456, 548]);
    expect(guide?.notes.map(({ y }) => y)).toEqual([80, 64, 72, 56, 48]);
  });

  it("keeps repeated canonical events distinct without adding duration data", () => {
    const firstEvent = fiveNoteAscentLeftHandExercise.expectedEvents[0]!;
    const repeatedEvents: readonly ExerciseExpectedEvent[] = [
      { ...firstEvent, id: "first-c3" },
      { ...firstEvent, id: "second-c3" },
    ];

    const guide = projectStaffPitchGuide(repeatedEvents);

    expect(guide?.notes).toEqual([
      { eventId: "first-c3", noteNumber: 48, label: "C3", x: 180, y: 80, ledgerLines: [] },
      { eventId: "second-c3", noteNumber: 48, label: "C3", x: 548, y: 80, ledgerLines: [] },
    ]);
    expect(guide?.notes[0]).not.toHaveProperty("duration");
    expect(guide?.notes[0]).not.toHaveProperty("stem");
  });

  it("projects eight mixed-pattern occurrences into distinct horizontal positions", () => {
    const guide = projectStaffPitchGuide(mixedEighthPatternRightHandExercise.expectedEvents);

    expect(guide?.notes).toHaveLength(8);
    expect(guide?.notes[0]?.x).toBe(180);
    expect(guide?.notes[7]?.x).toBe(548);
    expect(guide?.notes.map(({ x }) => x).every((x, index, positions) => index === 0 || x > positions[index - 1]!)).toBe(true);
    expect(guide?.notes[2]?.noteNumber).toBe(62);
    expect(guide?.notes[3]?.noteNumber).toBe(62);
    expect(guide?.notes[2]?.x).not.toBe(guide?.notes[3]?.x);
  });

  it("documents the conservative ranges covered by the current guide", () => {
    expect(STAFF_PITCH_GUIDE_SUPPORTED_RANGES).toEqual({
      treble: { minimumMidiNote: 60, maximumMidiNote: 67 },
      bass: { minimumMidiNote: 48, maximumMidiNote: 55 },
    });
  });

  it.each([
    ["an empty sequence", []],
    ["a both-hands event", [{ ...fiveNoteAscentExercise.expectedEvents[0]!, hand: "both" }]],
    ["mixed hands", [fiveNoteAscentExercise.expectedEvents[0]!, { ...fiveNoteAscentExercise.expectedEvents[1]!, hand: "left" }]],
    ["a chromatic pitch", [{ ...fiveNoteAscentExercise.expectedEvents[0]!, noteNumber: 61 }]],
    ["a treble pitch below the supported range", [{ ...fiveNoteAscentExercise.expectedEvents[0]!, noteNumber: 59 }]],
    ["a treble pitch above the supported range", [{ ...fiveNoteAscentExercise.expectedEvents[0]!, noteNumber: 69 }]],
    ["a bass pitch below the supported range", [{ ...fiveNoteAscentLeftHandExercise.expectedEvents[0]!, noteNumber: 47 }]],
    ["a bass pitch above the supported range", [{ ...fiveNoteAscentLeftHandExercise.expectedEvents[0]!, noteNumber: 57 }]],
  ] satisfies ReadonlyArray<readonly [string, readonly ExerciseExpectedEvent[]]>)("returns no guide for %s", (_label, events) => {
    expect(projectStaffPitchGuide(events)).toBeNull();
  });
});
