export const MIDI_CHANNEL_MIN = 1;
export const MIDI_CHANNEL_MAX = 16;
export const MIDI_DATA_BYTE_MIN = 0;
export const MIDI_DATA_BYTE_MAX = 127;

interface NormalizedMidiEventBase {
  readonly channel: number;
  readonly noteNumber: number;
  readonly velocity: number;
  readonly timestamp: number;
}

export interface MidiNoteOnEvent extends NormalizedMidiEventBase {
  readonly type: "note-on";
}

export interface MidiNoteOffEvent extends NormalizedMidiEventBase {
  readonly type: "note-off";
}

export type NormalizedMidiEvent = MidiNoteOnEvent | MidiNoteOffEvent;

export interface RawMidiMessage {
  readonly data: ArrayLike<number>;
  readonly timestamp: number;
}

export interface MidiInputDevice {
  readonly id: string;
  readonly label: string;
}

export type MidiInputCapability = "supported" | "unsupported";

export type MidiConnectionStatus = "unsupported" | "idle" | "requesting-permission" | "connected" | "disconnected" | "error";

export interface MidiConnectionState {
  readonly status: MidiConnectionStatus;
  readonly selectedInputId: string | null;
  readonly errorMessage: string | null;
}

export type MidiEventListener = (event: NormalizedMidiEvent) => void;
export type MidiStateListener = (state: MidiConnectionState) => void;
export type MidiUnsubscribe = () => void;
