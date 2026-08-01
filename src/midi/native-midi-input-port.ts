import type { MidiInputPort } from "./midi-input-port.js";
import {
  MIDI_CHANNEL_MAX,
  MIDI_CHANNEL_MIN,
  MIDI_DATA_BYTE_MAX,
  MIDI_DATA_BYTE_MIN,
  type MidiConnectionState,
  type MidiConnectionStatus,
  type MidiEventListener,
  type MidiInputCapability,
  type MidiInputDevice,
  type MidiStateListener,
  type MidiUnsubscribe,
  type NormalizedMidiEvent,
} from "./types.js";

export const NATIVE_MIDI_HANDLER_NAME = "learnPianoMidi";
export const NATIVE_MIDI_EVENT_NAME = "learn-piano-native-midi";

export type NativeMidiCommand =
  | { readonly type: "list-inputs" }
  | { readonly type: "select-input"; readonly inputId: string }
  | { readonly type: "disconnect" }
  | { readonly type: "open-bluetooth-settings" };

export type NativeMidiPushListener = (payload: unknown) => void;

/**
 * Small, injectable boundary around WKScriptMessageHandlerWithReply and the
 * CustomEvent channel used for native-to-JavaScript pushes.
 */
export interface NativeMidiBridge {
  postMessage(command: NativeMidiCommand): Promise<unknown>;
  subscribe(listener: NativeMidiPushListener): MidiUnsubscribe;
}

export interface NativeMidiInputPortOptions {
  readonly bridge?: NativeMidiBridge | null;
}

type NativeMidiConnectionStatus = Exclude<MidiConnectionStatus, "unsupported">;

interface NativeMidiSnapshot {
  readonly inputs: readonly MidiInputDevice[];
  readonly state: MidiConnectionState;
}

interface NativeMidiReply extends NativeMidiSnapshot {
  readonly ok: boolean;
}

type NativeMidiPush =
  { readonly type: "midi-event"; readonly event: NormalizedMidiEvent } | ({ readonly type: "state-change" } & NativeMidiSnapshot);

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

const RESPONSE_ERROR_MESSAGE = "The iPad MIDI response could not be read.";
const REQUEST_ERROR_MESSAGE = "The iPad MIDI connection could not be updated.";
const REJECTED_ERROR_MESSAGE = "The iPad MIDI request was not completed.";
const MAX_INPUTS = 128;
const MAX_IDENTIFIER_LENGTH = 256;
const MAX_LABEL_LENGTH = 256;
const MAX_ERROR_MESSAGE_LENGTH = 160;

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) {
    return false;
  }

  return "then" in value && typeof value.then === "function";
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function copyState(state: MidiConnectionState): MidiConnectionState {
  return { ...state };
}

function parseIdentifier(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_IDENTIFIER_LENGTH || value.trim() !== value) {
    return null;
  }

  return value;
}

function parseLabel(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const label = value.trim();
  return label.length > 0 && label.length <= MAX_LABEL_LENGTH ? label : null;
}

function calmErrorMessage(value: string | null, fallback: string): string {
  if (value === null) {
    return fallback;
  }

  let printable = "";
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    printable += codePoint !== undefined && codePoint >= 32 && codePoint !== 127 ? character : " ";
  }

  const normalized = printable.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return fallback;
  }

  if (normalized.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)}…`;
}

function parseInputs(value: unknown): readonly MidiInputDevice[] | null {
  if (!Array.isArray(value) || value.length > MAX_INPUTS) {
    return null;
  }

  const seenInputIds = new Set<string>();
  const inputs: MidiInputDevice[] = [];
  for (const candidate of value) {
    if (!isUnknownRecord(candidate)) {
      return null;
    }

    const id = parseIdentifier(candidate.id);
    const label = parseLabel(candidate.label);
    if (id === null || label === null || seenInputIds.has(id)) {
      return null;
    }

    seenInputIds.add(id);
    inputs.push({ id, label });
  }

  return inputs;
}

function isNativeStatus(value: unknown): value is NativeMidiConnectionStatus {
  return value === "idle" || value === "requesting-permission" || value === "connected" || value === "disconnected" || value === "error";
}

function parseState(value: unknown, inputs: readonly MidiInputDevice[]): MidiConnectionState | null {
  if (!isUnknownRecord(value) || !isNativeStatus(value.status)) {
    return null;
  }

  const selectedInputId = value.selectedInputId === null ? null : parseIdentifier(value.selectedInputId);
  if (selectedInputId === null && value.selectedInputId !== null) {
    return null;
  }

  if (typeof value.errorMessage !== "string" && value.errorMessage !== null) {
    return null;
  }

  if (value.status === "connected" && (selectedInputId === null || !inputs.some((input) => input.id === selectedInputId))) {
    return null;
  }

  return {
    status: value.status,
    selectedInputId,
    errorMessage: value.status === "error" ? calmErrorMessage(value.errorMessage, REJECTED_ERROR_MESSAGE) : null,
  };
}

function parseSnapshot(value: unknown): NativeMidiSnapshot | null {
  if (!isUnknownRecord(value)) {
    return null;
  }

  const inputs = parseInputs(value.inputs);
  if (inputs === null) {
    return null;
  }

  const state = parseState(value.state, inputs);
  return state === null ? null : { inputs, state };
}

function parseReply(value: unknown): NativeMidiReply | null {
  if (!isUnknownRecord(value) || typeof value.ok !== "boolean") {
    return null;
  }

  const snapshot = parseSnapshot(value);
  return snapshot === null ? null : { ok: value.ok, ...snapshot };
}

function parseMidiEvent(value: unknown): NormalizedMidiEvent | null {
  if (
    !isUnknownRecord(value) ||
    (value.type !== "note-on" && value.type !== "note-off") ||
    !isIntegerInRange(value.channel, MIDI_CHANNEL_MIN, MIDI_CHANNEL_MAX) ||
    !isIntegerInRange(value.noteNumber, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
    !isIntegerInRange(value.velocity, MIDI_DATA_BYTE_MIN, MIDI_DATA_BYTE_MAX) ||
    !isFiniteTimestamp(value.timestamp)
  ) {
    return null;
  }

  return {
    type: value.type === "note-on" && value.velocity === 0 ? "note-off" : value.type,
    channel: value.channel,
    noteNumber: value.noteNumber,
    velocity: value.velocity,
    timestamp: value.timestamp,
  };
}

function parsePush(value: unknown): NativeMidiPush | null {
  if (!isUnknownRecord(value)) {
    return null;
  }

  if (value.type === "midi-event") {
    const event = parseMidiEvent(value.event);
    return event === null ? null : { type: "midi-event", event };
  }

  if (value.type === "state-change") {
    const snapshot = parseSnapshot(value);
    return snapshot === null ? null : { type: "state-change", ...snapshot };
  }

  return null;
}

/**
 * Creates a native bridge from a window-like object. Passing the host keeps
 * bridge detection and event forwarding testable without a DOM.
 */
export function createNativeMidiBridgeFromHost(host: unknown): NativeMidiBridge | null {
  if (!isUnknownRecord(host)) {
    return null;
  }

  const webkit = host.webkit;
  if (!isUnknownRecord(webkit)) {
    return null;
  }

  const messageHandlers = webkit.messageHandlers;
  if (!isUnknownRecord(messageHandlers)) {
    return null;
  }

  const handler = messageHandlers[NATIVE_MIDI_HANDLER_NAME];
  if (!isUnknownRecord(handler) || typeof handler.postMessage !== "function") {
    return null;
  }

  const postMessage = handler.postMessage;
  const addEventListener = host.addEventListener;
  const removeEventListener = host.removeEventListener;
  if (typeof addEventListener !== "function" || typeof removeEventListener !== "function") {
    return null;
  }

  return {
    postMessage(command: NativeMidiCommand): Promise<unknown> {
      let result: unknown;
      try {
        result = postMessage.call(handler, command);
      } catch (error: unknown) {
        return Promise.reject(error);
      }

      return isPromiseLike(result)
        ? Promise.resolve(result)
        : Promise.reject(new Error("The native MIDI handler does not support replies."));
    },
    subscribe(listener: NativeMidiPushListener): MidiUnsubscribe {
      let subscribed = true;
      const eventListener = (event: unknown): void => {
        if (isUnknownRecord(event) && "detail" in event) {
          listener(event.detail);
        }
      };

      addEventListener.call(host, NATIVE_MIDI_EVENT_NAME, eventListener);
      return () => {
        if (!subscribed) {
          return;
        }
        subscribed = false;
        removeEventListener.call(host, NATIVE_MIDI_EVENT_NAME, eventListener);
      };
    },
  };
}

export function createBrowserNativeMidiBridge(): NativeMidiBridge | null {
  return typeof window === "undefined" ? null : createNativeMidiBridgeFromHost(window);
}

export class NativeMidiInputPort implements MidiInputPort {
  readonly capability: MidiInputCapability;

  private readonly eventListeners = new Set<MidiEventListener>();
  private readonly stateListeners = new Set<MidiStateListener>();
  private readonly bridge: NativeMidiBridge | null;
  private bridgeUnsubscribe: MidiUnsubscribe | null = null;
  private inputs: readonly MidiInputDevice[] = [];
  private state: MidiConnectionState = copyState(UNSUPPORTED_INITIAL_STATE);
  private operationGeneration = 0;
  private lastTimestamp: number | null = null;
  private disposed = false;

  constructor(options: NativeMidiInputPortOptions = {}) {
    const candidateBridge = options.bridge === undefined ? createBrowserNativeMidiBridge() : options.bridge;
    let activeBridge: NativeMidiBridge | null = candidateBridge;
    this.state = copyState(candidateBridge === null ? UNSUPPORTED_INITIAL_STATE : SUPPORTED_INITIAL_STATE);

    if (activeBridge !== null) {
      try {
        this.bridgeUnsubscribe = activeBridge.subscribe((payload) => {
          this.handlePush(payload);
        });
      } catch {
        activeBridge = null;
        this.bridgeUnsubscribe = null;
        this.state = copyState(UNSUPPORTED_INITIAL_STATE);
      }
    }

    this.bridge = activeBridge;
    this.capability = activeBridge === null ? "unsupported" : "supported";
  }

  getInputs(): readonly MidiInputDevice[] {
    return this.inputs.map((input) => ({ ...input }));
  }

  getState(): MidiConnectionState {
    return copyState(this.state);
  }

  async requestAccess(): Promise<readonly MidiInputDevice[]> {
    if (this.disposed || this.bridge === null) {
      return this.getInputs();
    }

    const generation = ++this.operationGeneration;
    this.setState({
      status: "requesting-permission",
      selectedInputId: this.state.selectedInputId,
      errorMessage: null,
    });
    await this.dispatch({ type: "list-inputs" }, generation);
    return this.getInputs();
  }

  async selectInput(inputId: string): Promise<boolean> {
    const generation = ++this.operationGeneration;
    if (this.disposed || this.bridge === null) {
      return false;
    }

    const parsedInputId = parseIdentifier(inputId);
    if (parsedInputId === null) {
      this.setError(RESPONSE_ERROR_MESSAGE);
      return false;
    }

    this.setState({ status: "requesting-permission", selectedInputId: parsedInputId, errorMessage: null });
    const reply = await this.dispatch({ type: "select-input", inputId: parsedInputId }, generation);
    if (reply !== null) {
      return reply.ok && reply.state.status === "connected" && reply.state.selectedInputId === parsedInputId;
    }

    // A native state push may cross the WebKit boundary before the reply to
    // the command that produced it. That push supersedes older replies, but a
    // matching connected snapshot still means this selection succeeded.
    return !this.disposed && this.state.status === "connected" && this.state.selectedInputId === parsedInputId;
  }

  disconnect(): void {
    if (this.disposed || this.bridge === null) {
      return;
    }

    const generation = ++this.operationGeneration;
    const selectedInputId = this.state.selectedInputId;
    this.setState({
      status: selectedInputId === null ? "idle" : "disconnected",
      selectedInputId,
      errorMessage: null,
    });
    void this.dispatch({ type: "disconnect" }, generation);
  }

  async openBluetoothSettings(): Promise<boolean> {
    if (this.disposed || this.bridge === null) {
      return false;
    }

    const generation = ++this.operationGeneration;
    const reply = await this.dispatch({ type: "open-bluetooth-settings" }, generation);
    return reply?.ok === true;
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
    this.operationGeneration += 1;
    this.bestEffortNativeDisconnect();
    try {
      this.bridgeUnsubscribe?.();
    } catch {
      // Native listener cleanup is best effort after local ownership ends.
    }
    this.bridgeUnsubscribe = null;
    this.inputs = [];
    this.eventListeners.clear();
    this.stateListeners.clear();
  }

  private bestEffortNativeDisconnect(): void {
    if (this.bridge === null) {
      return;
    }

    try {
      void this.bridge.postMessage({ type: "disconnect" }).catch(() => undefined);
    } catch {
      // The local port is already disposed; native teardown cannot block it.
    }
  }

  private async dispatch(command: NativeMidiCommand, generation: number): Promise<NativeMidiReply | null> {
    if (this.bridge === null) {
      return null;
    }

    let rawReply: unknown;
    try {
      rawReply = await this.bridge.postMessage(command);
    } catch {
      if (this.isCurrentOperation(generation)) {
        this.setError(REQUEST_ERROR_MESSAGE);
      }
      return null;
    }

    if (!this.isCurrentOperation(generation)) {
      return null;
    }

    const reply = parseReply(rawReply);
    if (reply === null) {
      this.setError(RESPONSE_ERROR_MESSAGE);
      return null;
    }

    this.inputs = reply.inputs.map((input) => ({ ...input }));
    if (reply.ok) {
      this.setState(reply.state);
    } else {
      this.setState({
        status: "error",
        selectedInputId: reply.state.selectedInputId,
        errorMessage: calmErrorMessage(reply.state.errorMessage, REJECTED_ERROR_MESSAGE),
      });
    }
    return reply;
  }

  private handlePush(payload: unknown): void {
    if (this.disposed) {
      return;
    }

    const push = parsePush(payload);
    if (push === null) {
      return;
    }

    if (push.type === "state-change") {
      this.operationGeneration += 1;
      this.inputs = push.inputs.map((input) => ({ ...input }));
      this.setState(push.state);
      return;
    }

    if (this.state.status !== "connected" || (this.lastTimestamp !== null && push.event.timestamp < this.lastTimestamp)) {
      return;
    }

    this.lastTimestamp = push.event.timestamp;
    for (const listener of Array.from(this.eventListeners)) {
      listener(push.event);
    }
  }

  private isCurrentOperation(generation: number): boolean {
    return !this.disposed && generation === this.operationGeneration;
  }

  private setError(errorMessage: string): void {
    this.setState({
      status: "error",
      selectedInputId: this.state.selectedInputId,
      errorMessage,
    });
  }

  private setState(state: MidiConnectionState): void {
    this.state = copyState(state);
    for (const listener of Array.from(this.stateListeners)) {
      listener(copyState(state));
    }
  }
}
