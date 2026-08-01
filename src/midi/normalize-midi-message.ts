import { MIDI_DATA_BYTE_MAX, MIDI_DATA_BYTE_MIN, type NormalizedMidiEvent, type RawMidiMessage } from "./types.js";

const NOTE_OFF_STATUS = 0x80;
const NOTE_ON_STATUS = 0x90;
const MESSAGE_TYPE_MASK = 0xf0;
const CHANNEL_MASK = 0x0f;
const MIDI_STATUS_MAX = 0xff;
const NOTE_MESSAGE_LENGTH = 3;

function isIntegerInRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isValidTimestamp(timestamp: number): boolean {
  return Number.isFinite(timestamp) && timestamp >= 0;
}

export function normalizeMidiMessage(message: RawMidiMessage): NormalizedMidiEvent | null {
  const { data, timestamp } = message;

  if (data.length !== NOTE_MESSAGE_LENGTH || !isValidTimestamp(timestamp)) {
    return null;
  }

  const status = data[0];
  if (status === undefined || !isIntegerInRange(status, 0, MIDI_STATUS_MAX)) {
    return null;
  }

  const messageType = status & MESSAGE_TYPE_MASK;
  if (messageType !== NOTE_ON_STATUS && messageType !== NOTE_OFF_STATUS) {
    return null;
  }

  const noteNumber = data[1];
  const velocity = data[2];
  if (
    noteNumber === undefined ||
    velocity === undefined ||
    !isIntegerInRange(noteNumber, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
    !isIntegerInRange(velocity, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX)
  ) {
    return null;
  }

  const type = messageType === NOTE_OFF_STATUS || velocity === MIDI_DATA_BYTE_MIN ? "note-off" : "note-on";

  return {
    type,
    channel: (status & CHANNEL_MASK) + 1,
    noteNumber,
    velocity,
    timestamp,
  };
}
