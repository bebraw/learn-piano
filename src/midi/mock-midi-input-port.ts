import type { MidiInputPort } from "./midi-input-port.js";
import { normalizeMidiMessage } from "./normalize-midi-message.js";
import {
  MIDI_CHANNEL_MAX,
  MIDI_CHANNEL_MIN,
  MIDI_DATA_BYTE_MAX,
  MIDI_DATA_BYTE_MIN,
  type MidiConnectionState,
  type MidiEventListener,
  type MidiInputDevice,
  type MidiStateListener,
  type MidiUnsubscribe,
  type RawMidiMessage,
} from "./types.js";

export const MOCK_MIDI_INPUT_ID = "mock-midi-input";

const MOCK_INPUT: MidiInputDevice = {
  id: MOCK_MIDI_INPUT_ID,
  label: "Deterministic mock keyboard",
};

export interface MockMidiNoteTapOptions {
  readonly channel?: number;
  readonly velocity?: number;
  readonly releaseVelocity?: number;
  readonly timestamp?: number;
  readonly duration?: number;
}

export interface MockMidiInputPortOptions {
  readonly now?: () => number;
}

function isIntegerInRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function copyState(state: MidiConnectionState): MidiConnectionState {
  return { ...state };
}

function runtimeNow(): number {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : 0;
}

export class MockMidiInputPort implements MidiInputPort {
  readonly capability = "supported" as const;

  private readonly eventListeners = new Set<MidiEventListener>();
  private readonly stateListeners = new Set<MidiStateListener>();
  private readonly now: () => number;
  private state: MidiConnectionState = {
    status: "idle",
    selectedInputId: null,
    errorMessage: null,
  };
  private accessInitialized = false;
  private disposed = false;
  private lifecycleGeneration = 0;
  private lastTimestamp: number | null = null;

  constructor(options: MockMidiInputPortOptions = {}) {
    this.now = options.now ?? runtimeNow;
  }

  getInputs(): readonly MidiInputDevice[] {
    return this.disposed ? [] : [{ ...MOCK_INPUT }];
  }

  getState(): MidiConnectionState {
    return copyState(this.state);
  }

  async requestAccess(): Promise<readonly MidiInputDevice[]> {
    if (this.disposed) {
      return [];
    }

    if (this.accessInitialized) {
      return this.getInputs();
    }

    const generation = this.lifecycleGeneration;
    const previousState = this.getState();
    this.setState({
      status: "requesting-permission",
      selectedInputId: previousState.selectedInputId,
      errorMessage: null,
    });
    await Promise.resolve();
    if (!this.disposed && generation === this.lifecycleGeneration) {
      this.accessInitialized = true;
      this.setState({
        status:
          previousState.status === "connected" || previousState.status === "disconnected"
            ? previousState.status
            : previousState.selectedInputId === null
              ? "idle"
              : "disconnected",
        selectedInputId: previousState.selectedInputId,
        errorMessage: null,
      });
    }
    return this.disposed ? [] : this.getInputs();
  }

  async selectInput(inputId: string): Promise<boolean> {
    const generation = ++this.lifecycleGeneration;
    if (this.disposed) {
      return false;
    }

    await Promise.resolve();
    if (this.disposed || generation !== this.lifecycleGeneration) {
      return false;
    }

    if (inputId !== MOCK_MIDI_INPUT_ID) {
      this.setState({
        status: "error",
        selectedInputId: inputId,
        errorMessage: `MIDI input "${inputId}" is not available.`,
      });
      return false;
    }

    this.accessInitialized = true;
    this.setState({ status: "connected", selectedInputId: inputId, errorMessage: null });
    return true;
  }

  disconnect(): void {
    if (this.disposed) {
      return;
    }

    this.lifecycleGeneration += 1;
    this.setState({
      status: this.state.selectedInputId === null ? "idle" : "disconnected",
      selectedInputId: this.state.selectedInputId,
      errorMessage: null,
    });
  }

  onEvent(listener: MidiEventListener): MidiUnsubscribe {
    if (this.disposed) {
      return () => undefined;
    }

    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  onStateChange(listener: MidiStateListener): MidiUnsubscribe {
    if (this.disposed) {
      return () => undefined;
    }

    this.stateListeners.add(listener);
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  replay(messages: readonly RawMidiMessage[]): void {
    if (this.disposed || this.state.status !== "connected") {
      return;
    }

    for (const rawMessage of messages) {
      const event = normalizeMidiMessage(rawMessage);
      if (event === null || (this.lastTimestamp !== null && event.timestamp < this.lastTimestamp)) {
        continue;
      }

      this.lastTimestamp = event.timestamp;
      for (const listener of Array.from(this.eventListeners)) {
        listener(event);
      }
    }
  }

  tapNote(noteNumber: number, options: MockMidiNoteTapOptions = {}): void {
    const channel = options.channel ?? MIDI_CHANNEL_MIN;
    const velocity = options.velocity ?? 72;
    const releaseVelocity = options.releaseVelocity ?? 0;
    const duration = options.duration ?? 25;
    const timestamp = options.timestamp ?? Math.max(this.now(), this.lastTimestamp === null ? 0 : this.lastTimestamp + 1);

    if (
      !isIntegerInRange(channel, MIDI_CHANNEL_MIN, MIDI_CHANNEL_MAX) ||
      !isIntegerInRange(noteNumber, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
      !isIntegerInRange(velocity, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
      !isIntegerInRange(releaseVelocity, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
      !Number.isFinite(timestamp) ||
      timestamp < 0 ||
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      return;
    }

    const noteOffTimestamp = timestamp + duration;
    if (!Number.isFinite(noteOffTimestamp)) {
      return;
    }

    const channelNibble = channel - MIDI_CHANNEL_MIN;
    this.replay([
      { data: [0x90 | channelNibble, noteNumber, velocity], timestamp },
      { data: [0x80 | channelNibble, noteNumber, releaseVelocity], timestamp: noteOffTimestamp },
    ]);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.lifecycleGeneration += 1;
    this.eventListeners.clear();
    this.stateListeners.clear();
  }

  private setState(state: MidiConnectionState): void {
    this.state = copyState(state);
    for (const listener of Array.from(this.stateListeners)) {
      listener(copyState(state));
    }
  }
}
