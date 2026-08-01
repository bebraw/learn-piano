import type { ExerciseExpectedEvent } from "../exercises/types.js";

export type StaffPitchGuideClef = "treble" | "bass";

export interface StaffPitchGuidePointRange {
  readonly minimumMidiNote: number;
  readonly maximumMidiNote: number;
}

export interface StaffPitchGuideViewBox {
  readonly width: number;
  readonly height: number;
}

export interface StaffPitchGuideLine {
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
}

export interface StaffPitchGuideNote {
  readonly eventId: string;
  readonly noteNumber: number;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly ledgerLines: readonly StaffPitchGuideLine[];
}

export interface StaffPitchGuide {
  readonly clef: StaffPitchGuideClef;
  readonly clefLabel: "Treble" | "Bass";
  readonly accessibleLabel: string;
  readonly viewBox: StaffPitchGuideViewBox;
  readonly staffLines: readonly StaffPitchGuideLine[];
  readonly notes: readonly StaffPitchGuideNote[];
}

/**
 * This projection is intentionally limited to the natural-note C-through-A
 * ranges used by the current library. A wider range needs a deliberate layout
 * contract rather than unbounded ledger lines.
 */
export const STAFF_PITCH_GUIDE_SUPPORTED_RANGES: Readonly<Record<StaffPitchGuideClef, StaffPitchGuidePointRange>> = {
  treble: { minimumMidiNote: 60, maximumMidiNote: 69 },
  bass: { minimumMidiNote: 48, maximumMidiNote: 57 },
};

const VIEW_BOX: StaffPitchGuideViewBox = { width: 640, height: 168 };
const STAFF_LINE_START_X = 56;
const STAFF_LINE_END_X = 616;
const STAFF_LINE_Y_VALUES = [40, 56, 72, 88, 104] as const;
const STAFF_BOTTOM_LINE_Y = STAFF_LINE_Y_VALUES[4];
const STAFF_LINE_SPACING = 16;
const DIATONIC_STEP_Y = STAFF_LINE_SPACING / 2;
const FIRST_NOTE_X = 180;
const LAST_NOTE_X = 548;
const LEDGER_LINE_HALF_WIDTH = 14;

const NATURAL_PITCHES: Readonly<Record<number, { readonly name: string; readonly diatonicDegree: number }>> = {
  0: { name: "C", diatonicDegree: 0 },
  2: { name: "D", diatonicDegree: 1 },
  4: { name: "E", diatonicDegree: 2 },
  5: { name: "F", diatonicDegree: 3 },
  7: { name: "G", diatonicDegree: 4 },
  9: { name: "A", diatonicDegree: 5 },
  11: { name: "B", diatonicDegree: 6 },
};

const BOTTOM_LINE_DIATONIC_INDEX: Readonly<Record<StaffPitchGuideClef, number>> = {
  treble: diatonicIndex(64)!,
  bass: diatonicIndex(43)!,
};

export function projectStaffPitchGuide(events: readonly ExerciseExpectedEvent[]): StaffPitchGuide | null {
  const clef = resolveClef(events);
  if (clef === null) {
    return null;
  }

  const projectedNotes: StaffPitchGuideNote[] = [];
  for (const [index, event] of events.entries()) {
    const pitch = naturalPitch(event.noteNumber);
    if (pitch === null || !isWithinSupportedRange(event.noteNumber, clef)) {
      return null;
    }

    const x = noteX(index, events.length);
    const y = noteY(event.noteNumber, clef);
    projectedNotes.push({
      eventId: event.id,
      noteNumber: event.noteNumber,
      label: `${pitch.name}${pitch.octave}`,
      x,
      y,
      ledgerLines: ledgerLines(x, y),
    });
  }

  const clefLabel = clef === "treble" ? "Treble" : "Bass";
  return {
    clef,
    clefLabel,
    accessibleLabel: `${clefLabel} staff pitch order: ${projectedNotes.map(({ label }) => label).join(", ")}.`,
    viewBox: VIEW_BOX,
    staffLines: STAFF_LINE_Y_VALUES.map((y) => ({ x1: STAFF_LINE_START_X, x2: STAFF_LINE_END_X, y })),
    notes: projectedNotes,
  };
}

function resolveClef(events: readonly ExerciseExpectedEvent[]): StaffPitchGuideClef | null {
  const firstEvent = events[0];
  if (firstEvent === undefined || firstEvent.hand === "both") {
    return null;
  }

  for (const event of events) {
    if (event.hand !== firstEvent.hand) {
      return null;
    }
  }

  return firstEvent.hand === "right" ? "treble" : "bass";
}

function isWithinSupportedRange(noteNumber: number, clef: StaffPitchGuideClef): boolean {
  const range = STAFF_PITCH_GUIDE_SUPPORTED_RANGES[clef];
  return noteNumber >= range.minimumMidiNote && noteNumber <= range.maximumMidiNote;
}

function noteX(index: number, eventCount: number): number {
  if (eventCount === 1) {
    return (FIRST_NOTE_X + LAST_NOTE_X) / 2;
  }

  return FIRST_NOTE_X + (index * (LAST_NOTE_X - FIRST_NOTE_X)) / (eventCount - 1);
}

function noteY(noteNumber: number, clef: StaffPitchGuideClef): number {
  return STAFF_BOTTOM_LINE_Y - (diatonicIndex(noteNumber)! - BOTTOM_LINE_DIATONIC_INDEX[clef]) * DIATONIC_STEP_Y;
}

function ledgerLines(noteXPosition: number, noteYPosition: number): readonly StaffPitchGuideLine[] {
  const lines: StaffPitchGuideLine[] = [];
  const staffTopLineY = STAFF_LINE_Y_VALUES[0];

  for (let y = STAFF_BOTTOM_LINE_Y + STAFF_LINE_SPACING; y <= noteYPosition; y += STAFF_LINE_SPACING) {
    lines.push({ x1: noteXPosition - LEDGER_LINE_HALF_WIDTH, x2: noteXPosition + LEDGER_LINE_HALF_WIDTH, y });
  }

  for (let y = staffTopLineY - STAFF_LINE_SPACING; y >= noteYPosition; y -= STAFF_LINE_SPACING) {
    lines.push({ x1: noteXPosition - LEDGER_LINE_HALF_WIDTH, x2: noteXPosition + LEDGER_LINE_HALF_WIDTH, y });
  }

  return lines;
}

function naturalPitch(noteNumber: number): { readonly name: string; readonly octave: number } | null {
  if (!Number.isInteger(noteNumber) || noteNumber < 0 || noteNumber > 127) {
    return null;
  }

  const pitch = NATURAL_PITCHES[noteNumber % 12];
  return pitch === undefined ? null : { name: pitch.name, octave: Math.floor(noteNumber / 12) - 1 };
}

function diatonicIndex(noteNumber: number): number | null {
  const pitch = NATURAL_PITCHES[noteNumber % 12];
  if (pitch === undefined) {
    return null;
  }

  const octave = Math.floor(noteNumber / 12) - 1;
  return octave * 7 + pitch.diatonicDegree;
}
