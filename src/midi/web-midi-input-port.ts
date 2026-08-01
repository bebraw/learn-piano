import type { MidiInputPort } from "./midi-input-port.js";
import { normalizeMidiMessage } from "./normalize-midi-message.js";
import type {
  MidiConnectionState,
  MidiEventListener,
  MidiInputCapability,
  MidiInputDevice,
  MidiStateListener,
  MidiUnsubscribe,
  NormalizedMidiEvent,
} from "./types.js";

export interface WebMidiMessageEventHandle {
  readonly data: ArrayLike<number> | null;
  readonly timeStamp: number;
}

export type WebMidiMessageListener = (event: WebMidiMessageEventHandle) => void;

export interface WebMidiInputHandle {
  readonly id: string;
  readonly name?: string | null;
  readonly manufacturer?: string | null;
  readonly state?: string;
  readonly connection: "closed" | "open" | "pending";
  open(): Promise<unknown>;
  close(): Promise<unknown>;
  addEventListener(type: "midimessage", listener: WebMidiMessageListener): void;
  removeEventListener(type: "midimessage", listener: WebMidiMessageListener): void;
}

export interface WebMidiPortStateHandle {
  readonly id: string;
  readonly state?: string;
  readonly type?: string;
}

export interface WebMidiStateChangeEventHandle {
  readonly port: WebMidiPortStateHandle | null;
}

export type WebMidiStateChangeListener = (event: WebMidiStateChangeEventHandle) => void;

export interface WebMidiInputCollectionHandle {
  values(): IterableIterator<WebMidiInputHandle>;
}

export interface WebMidiAccessHandle {
  readonly inputs: WebMidiInputCollectionHandle;
  addEventListener(type: "statechange", listener: WebMidiStateChangeListener): void;
  removeEventListener(type: "statechange", listener: WebMidiStateChangeListener): void;
}

export type WebMidiAccessRequest = () => Promise<WebMidiAccessHandle>;

type WebMidiAccessResult =
  { readonly status: "granted"; readonly access: WebMidiAccessHandle } | { readonly status: "denied"; readonly error: unknown };

export interface WebMidiInputPortOptions {
  readonly requestAccess?: WebMidiAccessRequest | null;
}

interface WebMidiNavigatorHandle {
  requestMIDIAccess(options: { readonly sysex: false }): Promise<WebMidiAccessHandle>;
}

const SUPPORTED_INITIAL_STATE: MidiConnectionState = {
  status: "idle",
  selectedInputId: null,
  errorMessage: null,
};

const UNSUPPORTED_INITIAL_STATE: MidiConnectionState = {
  status: "unsupported",
  selectedInputId: null,
  errorMessage: null,
};

function hasWebMidiAccess(value: object): value is WebMidiNavigatorHandle {
  return "requestMIDIAccess" in value && typeof value.requestMIDIAccess === "function";
}

function browserMidiAccessRequest(): WebMidiAccessRequest | null {
  if (typeof navigator === "undefined" || !hasWebMidiAccess(navigator)) {
    return null;
  }

  const midiNavigator = navigator;
  return () => midiNavigator.requestMIDIAccess({ sysex: false });
}

function copyState(state: MidiConnectionState): MidiConnectionState {
  return { ...state };
}

function inputLabel(input: WebMidiInputHandle): string {
  const parts = [input.manufacturer, input.name].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  return parts.length > 0 ? parts.join(" ") : input.id;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "MIDI access could not be requested.";
}

export class WebMidiInputPort implements MidiInputPort {
  readonly capability: MidiInputCapability;

  private readonly requestMidiAccess: WebMidiAccessRequest | null;
  private readonly eventListeners = new Set<MidiEventListener>();
  private readonly stateListeners = new Set<MidiStateListener>();
  private access: WebMidiAccessHandle | null = null;
  private accessRequest: Promise<WebMidiAccessResult> | null = null;
  private accessStateListener: WebMidiStateChangeListener | null = null;
  private inputs: readonly MidiInputDevice[] = [];
  private selectedInput: WebMidiInputHandle | null = null;
  private openingInput: WebMidiInputHandle | null = null;
  private selectedInputId: string | null = null;
  private selectedInputListener: WebMidiMessageListener | null = null;
  private accessGeneration = 0;
  private selectionGeneration = 0;
  private connectionGeneration = 0;
  private lastTimestamp: number | null = null;
  private state: MidiConnectionState;
  private disposed = false;

  constructor(options: WebMidiInputPortOptions = {}) {
    this.requestMidiAccess = options.requestAccess === undefined ? browserMidiAccessRequest() : options.requestAccess;
    this.capability = this.requestMidiAccess === null ? "unsupported" : "supported";
    this.state = this.capability === "supported" ? copyState(SUPPORTED_INITIAL_STATE) : copyState(UNSUPPORTED_INITIAL_STATE);
  }

  getInputs(): readonly MidiInputDevice[] {
    return this.inputs.map((input) => ({ ...input }));
  }

  getState(): MidiConnectionState {
    return copyState(this.state);
  }

  async requestAccess(): Promise<readonly MidiInputDevice[]> {
    if (this.disposed || this.requestMidiAccess === null) {
      return this.getInputs();
    }

    if (this.access !== null) {
      this.refreshInputs();
      this.disconnectMissingSelectedInput();
      return this.getInputs();
    }

    const generation = this.accessGeneration;
    this.setState({
      status: "requesting-permission",
      selectedInputId: this.selectedInputId,
      errorMessage: null,
    });

    const result = await this.getOrCreateAccessRequest();
    if (this.disposed || generation !== this.accessGeneration) {
      return this.getInputs();
    }

    if (result.status === "granted") {
      this.attachAccess(result.access);
      this.refreshInputs();
      this.setState({
        status: this.selectedInputId === null ? "idle" : "disconnected",
        selectedInputId: this.selectedInputId,
        errorMessage: null,
      });
    } else {
      this.inputs = [];
      this.setState({
        status: "error",
        selectedInputId: this.selectedInputId,
        errorMessage: errorMessage(result.error),
      });
    }

    return this.getInputs();
  }

  async selectInput(inputId: string): Promise<boolean> {
    const selectionGeneration = ++this.selectionGeneration;
    this.openingInput = null;

    if (this.disposed || this.capability === "unsupported") {
      return false;
    }

    if (this.access === null) {
      await this.requestAccess();
    }

    if (!this.isCurrentSelection(selectionGeneration) || this.access === null) {
      return false;
    }

    this.refreshInputs();
    const targetInput = this.findAvailableInput(inputId);
    if (targetInput === null) {
      this.detachSelectedInput();
      this.selectedInputId = inputId;
      this.setState({
        status: "error",
        selectedInputId: inputId,
        errorMessage: `MIDI input "${inputId}" is not available.`,
      });
      return false;
    }

    if (this.selectedInput === targetInput && this.selectedInputListener !== null && targetInput.connection === "open") {
      this.selectedInputId = inputId;
      this.setState({ status: "connected", selectedInputId: inputId, errorMessage: null });
      return true;
    }

    this.detachSelectedInput(targetInput);
    this.selectedInputId = inputId;
    this.openingInput = targetInput;
    this.setState({ status: "requesting-permission", selectedInputId: inputId, errorMessage: null });

    try {
      await targetInput.open();
    } catch (error: unknown) {
      if (!this.isCurrentSelection(selectionGeneration)) {
        this.closeIfUnowned(targetInput);
        return false;
      }

      this.openingInput = null;
      this.closeIfUnowned(targetInput);
      this.setState({ status: "error", selectedInputId: inputId, errorMessage: errorMessage(error) });
      return false;
    }

    if (!this.isCurrentSelection(selectionGeneration)) {
      this.closeIfUnowned(targetInput);
      return false;
    }

    if (targetInput.state === "disconnected" || this.findAvailableInput(inputId) !== targetInput) {
      this.openingInput = null;
      this.closeIfUnowned(targetInput);
      this.setState({ status: "disconnected", selectedInputId: inputId, errorMessage: null });
      return false;
    }

    this.openingInput = null;
    this.selectedInput = targetInput;
    const generation = this.connectionGeneration;
    const listener: WebMidiMessageListener = (event) => {
      this.handleMidiMessage(targetInput, generation, event);
    };
    this.selectedInputListener = listener;
    targetInput.addEventListener("midimessage", listener);
    this.setState({ status: "connected", selectedInputId: inputId, errorMessage: null });
    return true;
  }

  disconnect(): void {
    if (this.disposed) {
      return;
    }

    this.accessGeneration += 1;
    this.selectionGeneration += 1;
    this.openingInput = null;
    const disconnectedInputId = this.selectedInputId;
    this.detachSelectedInput();
    this.setState({
      status: disconnectedInputId === null ? "idle" : "disconnected",
      selectedInputId: disconnectedInputId,
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

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.accessGeneration += 1;
    this.selectionGeneration += 1;
    this.openingInput = null;
    this.detachSelectedInput();
    this.detachAccess();
    this.inputs = [];
    this.eventListeners.clear();
    this.stateListeners.clear();
  }

  private setState(state: MidiConnectionState): void {
    this.state = copyState(state);
    for (const listener of Array.from(this.stateListeners)) {
      listener(copyState(state));
    }
  }

  private getOrCreateAccessRequest(): Promise<WebMidiAccessResult> {
    if (this.accessRequest !== null) {
      return this.accessRequest;
    }

    if (this.requestMidiAccess === null) {
      return Promise.resolve({ status: "denied", error: new Error("Web MIDI is not supported.") });
    }

    const requestMidiAccess = this.requestMidiAccess;
    const request = (async (): Promise<WebMidiAccessResult> => {
      try {
        return { status: "granted", access: await requestMidiAccess() };
      } catch (error: unknown) {
        return { status: "denied", error };
      }
    })();
    this.accessRequest = request;
    void request.then(() => {
      if (this.accessRequest === request) {
        this.accessRequest = null;
      }
    });
    return request;
  }

  private attachAccess(access: WebMidiAccessHandle): void {
    if (this.access === access) {
      return;
    }

    this.detachAccess();
    this.access = access;
    const listener: WebMidiStateChangeListener = (event) => {
      this.handleAccessStateChange(event);
    };
    this.accessStateListener = listener;
    access.addEventListener("statechange", listener);
  }

  private detachAccess(): void {
    if (this.access !== null && this.accessStateListener !== null) {
      this.access.removeEventListener("statechange", this.accessStateListener);
    }
    this.access = null;
    this.accessStateListener = null;
  }

  private refreshInputs(): void {
    if (this.access === null) {
      this.inputs = [];
      return;
    }

    const devices = new Map<string, MidiInputDevice>();
    for (const input of this.access.inputs.values()) {
      if (input.state !== "disconnected") {
        devices.set(input.id, { id: input.id, label: inputLabel(input) });
      }
    }
    this.inputs = [...devices.values()];
  }

  private findAvailableInput(inputId: string): WebMidiInputHandle | null {
    if (this.access === null) {
      return null;
    }

    for (const input of this.access.inputs.values()) {
      if (input.id === inputId && input.state !== "disconnected") {
        return input;
      }
    }
    return null;
  }

  private handleAccessStateChange(event: WebMidiStateChangeEventHandle): void {
    if (this.disposed) {
      return;
    }

    this.refreshInputs();
    if (event.port === null) {
      this.setState(this.state);
      return;
    }

    if (
      event.port.type !== "output" &&
      event.port.id === this.selectedInputId &&
      (event.port.state === "disconnected" || this.findAvailableInput(event.port.id) === null)
    ) {
      this.selectionGeneration += 1;
      this.openingInput = null;
      const disconnectedInputId = this.selectedInputId;
      this.detachSelectedInput();
      this.setState({
        status: "disconnected",
        selectedInputId: disconnectedInputId,
        errorMessage: null,
      });
      return;
    }

    this.setState(this.state);
  }

  private disconnectMissingSelectedInput(): void {
    if (this.selectedInputId !== null && this.selectedInput !== null && this.findAvailableInput(this.selectedInputId) === null) {
      this.selectionGeneration += 1;
      this.openingInput = null;
      const disconnectedInputId = this.selectedInputId;
      this.detachSelectedInput();
      this.setState({
        status: "disconnected",
        selectedInputId: disconnectedInputId,
        errorMessage: null,
      });
    }
  }

  private detachSelectedInput(inputToKeepOpen: WebMidiInputHandle | null = null): void {
    this.connectionGeneration += 1;
    const detachedInput = this.selectedInput;
    if (detachedInput !== null && this.selectedInputListener !== null) {
      detachedInput.removeEventListener("midimessage", this.selectedInputListener);
    }
    this.selectedInput = null;
    this.selectedInputListener = null;

    if (detachedInput !== null && detachedInput !== inputToKeepOpen) {
      this.bestEffortClose(detachedInput);
    }
  }

  private handleMidiMessage(source: WebMidiInputHandle, generation: number, event: WebMidiMessageEventHandle): void {
    if (this.disposed || generation !== this.connectionGeneration || source !== this.selectedInput || event.data === null) {
      return;
    }

    const normalized = normalizeMidiMessage({ data: event.data, timestamp: event.timeStamp });
    if (normalized === null || !this.acceptTimestamp(normalized)) {
      return;
    }

    for (const listener of Array.from(this.eventListeners)) {
      listener(normalized);
    }
  }

  private acceptTimestamp(event: NormalizedMidiEvent): boolean {
    if (this.lastTimestamp !== null && event.timestamp < this.lastTimestamp) {
      return false;
    }
    this.lastTimestamp = event.timestamp;
    return true;
  }

  private isCurrentSelection(generation: number): boolean {
    return !this.disposed && generation === this.selectionGeneration;
  }

  private closeIfUnowned(input: WebMidiInputHandle): void {
    if (this.selectedInput !== input && this.openingInput !== input) {
      this.bestEffortClose(input);
    }
  }

  private bestEffortClose(input: WebMidiInputHandle): void {
    try {
      void input.close().catch(() => undefined);
    } catch {
      // Device cleanup is best effort; the adapter is already detached.
    }
  }
}
