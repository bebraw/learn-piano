import type {
  MidiConnectionState,
  MidiEventListener,
  MidiInputCapability,
  MidiInputDevice,
  MidiStateListener,
  MidiUnsubscribe,
} from "./types.js";

export interface MidiInputPort {
  readonly capability: MidiInputCapability;

  getInputs(): readonly MidiInputDevice[];
  getState(): MidiConnectionState;
  requestAccess(): Promise<readonly MidiInputDevice[]>;
  selectInput(inputId: string): Promise<boolean>;
  disconnect(): void;
  onEvent(listener: MidiEventListener): MidiUnsubscribe;
  onStateChange(listener: MidiStateListener): MidiUnsubscribe;
  dispose(): void;
}
