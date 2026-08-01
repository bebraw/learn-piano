import type { RawMidiMessage } from "../types.js";

export interface RawMidiFixture {
  readonly id: string;
  readonly label: string;
  readonly messages: readonly RawMidiMessage[];
}

export function createRawNoteTapMessages(noteNumbers: readonly number[]): readonly RawMidiMessage[] {
  return noteNumbers.flatMap((noteNumber, index) => {
    const noteOnTimestamp = 100 + index * 100;
    return [
      { data: [0x90, noteNumber, 72], timestamp: noteOnTimestamp },
      { data: [0x80, noteNumber, 0], timestamp: noteOnTimestamp + 25 },
    ];
  });
}

export const resilientNormalizationRawFixture: RawMidiFixture = {
  id: "normalization-edge-cases",
  label: "Unsupported, velocity-zero, and valid messages",
  messages: [
    { data: [0xb0, 7, 100], timestamp: 10 },
    { data: [0x90, 60, 0], timestamp: 20 },
    { data: [0x91, 62, 64], timestamp: 30 },
  ],
};
