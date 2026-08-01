import { describe, expect, it } from "vitest";
import { fiveNoteDescentLeftHandExercise } from "../exercises/library/beginner-five-note-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { steadyQuarterRightHandExercise } from "../exercises/library/steady-quarter-exercises.js";
import type { Exercise } from "../exercises/types.js";
import { renderStaffPitchGuide } from "./staff-pitch-guide.js";

describe("renderStaffPitchGuide", () => {
  it("renders a supplementary treble pitch guide with stable event hooks", () => {
    const html = renderStaffPitchGuide(fiveNoteAscentExercise);

    expect(html).toContain("Treble staff · Pitch guide");
    expect(html).toContain("Pitch order · No fixed rhythm");
    expect(html).toContain("data-staff-pitch-guide");
    expect(html).toContain('data-staff-clef="treble"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html.match(/data-staff-note/g)).toHaveLength(5);
    expect(html.match(/data-note-state="expected"/g)).toHaveLength(1);
    expect(html.match(/data-note-state="remaining"/g)).toHaveLength(4);
    expect(html.match(/data-note-active="false"/g)).toHaveLength(5);
    expect(html).toContain('id="staff-note-right-hand-c4"');
    expect(html).toContain('data-event-id="right-hand-c4"');
    expect(html.match(/class="staff-pitch-line"/g)).toHaveLength(5);
    expect(html.match(/class="staff-pitch-ledger"/g)).toHaveLength(1);
    expect(html).not.toContain('data-note-state="accepted"');
  });

  it("renders bass notes in canonical sequence order", () => {
    const html = renderStaffPitchGuide(fiveNoteDescentLeftHandExercise);

    expect(html).toContain("Bass staff · Pitch guide");
    expect(html).toContain('data-staff-clef="bass"');
    expect(html.indexOf('id="staff-note-left-hand-g3"')).toBeLessThan(html.indexOf('id="staff-note-left-hand-f3"'));
    expect(html.indexOf('id="staff-note-left-hand-f3"')).toBeLessThan(html.indexOf('id="staff-note-left-hand-c3"'));
  });

  it("labels timed projection as pitch order with a beat rather than a duration claim", () => {
    const html = renderStaffPitchGuide(steadyQuarterRightHandExercise);

    expect(html).toContain("Pitch order · One note per beat");
    expect(html).not.toContain("No fixed rhythm");
  });

  it("does not claim one note per beat for another supported timed pattern", () => {
    const beatOffsets = [0, 0.5, 1.5, 2, 3] as const;
    const syncopatedExercise: Exercise = {
      ...steadyQuarterRightHandExercise,
      expectedEvents: steadyQuarterRightHandExercise.expectedEvents.map((event, index) => {
        const beatOffset = beatOffsets[index];
        if (beatOffset === undefined) {
          throw new Error("The timed-label fixture needs one offset per event");
        }
        return { ...event, beatOffset };
      }),
    };

    const html = renderStaffPitchGuide(syncopatedExercise);

    expect(html).toContain("Pitch order · Timing shown separately");
    expect(html).not.toContain("One note per beat");
  });

  it("omits the supplementary guide when projection is unsupported", () => {
    const unsupportedExercise: Exercise = {
      ...fiveNoteAscentExercise,
      expectedEvents: [{ ...fiveNoteAscentExercise.expectedEvents[0]!, noteNumber: 61 }],
    };

    expect(renderStaffPitchGuide(unsupportedExercise)).toBe("");
  });
});
