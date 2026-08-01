import { describe, expect, it, vi } from "vitest";
import type { MidiConnectionState, NormalizedMidiEvent } from "./types.js";
import {
  NATIVE_MIDI_EVENT_NAME,
  NativeMidiInputPort,
  createNativeMidiBridgeFromHost,
  type NativeMidiBridge,
  type NativeMidiCommand,
  type NativeMidiPushListener,
} from "./native-midi-input-port.js";

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value: T): void {
      if (resolvePromise === undefined) {
        throw new Error("Deferred promise was not initialized.");
      }
      resolvePromise(value);
    },
  };
}

function reply(
  status: "idle" | "requesting-permission" | "connected" | "disconnected" | "error",
  selectedInputId: string | null = null,
  options: {
    readonly ok?: boolean;
    readonly errorMessage?: string | null;
    readonly inputs?: readonly { readonly id: string; readonly label: string }[];
  } = {},
): unknown {
  return {
    ok: options.ok ?? true,
    inputs: options.inputs ?? [{ id: "piano", label: "Roland GO:PIANO 61" }],
    state: {
      status,
      selectedInputId,
      errorMessage: options.errorMessage ?? null,
    },
  };
}

class FakeNativeMidiBridge implements NativeMidiBridge {
  readonly commands: NativeMidiCommand[] = [];
  responder: (command: NativeMidiCommand) => Promise<unknown> = async () => reply("idle");

  private readonly listeners = new Set<NativeMidiPushListener>();

  postMessage(command: NativeMidiCommand): Promise<unknown> {
    this.commands.push(command);
    return this.responder(command);
  }

  subscribe(listener: NativeMidiPushListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(payload: unknown): void {
    for (const listener of Array.from(this.listeners)) {
      listener(payload);
    }
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

async function connectedPort(): Promise<{ readonly bridge: FakeNativeMidiBridge; readonly port: NativeMidiInputPort }> {
  const bridge = new FakeNativeMidiBridge();
  bridge.responder = async (command) => (command.type === "select-input" ? reply("connected", command.inputId) : reply("idle"));
  const port = new NativeMidiInputPort({ bridge });
  await port.requestAccess();
  await port.selectInput("piano");
  return { bridge, port };
}

describe("createNativeMidiBridgeFromHost", () => {
  it("detects the reply handler and forwards commands and event detail without a DOM", async () => {
    const listeners = new Map<string, (event: unknown) => void>();
    const handler = {
      postMessage(command: NativeMidiCommand): Promise<unknown> {
        expect(this).toBe(handler);
        return Promise.resolve({ command });
      },
    };
    const host = {
      webkit: { messageHandlers: { learnPianoMidi: handler } },
      addEventListener(name: string, listener: (event: unknown) => void): void {
        listeners.set(name, listener);
      },
      removeEventListener(name: string, listener: (event: unknown) => void): void {
        if (listeners.get(name) === listener) {
          listeners.delete(name);
        }
      },
    };
    const bridge = createNativeMidiBridgeFromHost(host);
    if (bridge === null) {
      throw new Error("Expected the native bridge to be detected.");
    }

    await expect(bridge.postMessage({ type: "list-inputs" })).resolves.toEqual({
      command: { type: "list-inputs" },
    });
    const pushListener = vi.fn();
    const unsubscribe = bridge.subscribe(pushListener);
    listeners.get(NATIVE_MIDI_EVENT_NAME)?.({ detail: { type: "state-change" } });
    listeners.get(NATIVE_MIDI_EVENT_NAME)?.({ wrong: "shape" });

    expect(pushListener).toHaveBeenCalledOnce();
    expect(pushListener).toHaveBeenCalledWith({ type: "state-change" });
    unsubscribe();
    unsubscribe();
    expect(listeners).toHaveLength(0);
  });

  it("rejects incomplete hosts and handlers that do not return replies", async () => {
    expect(createNativeMidiBridgeFromHost(null)).toBeNull();
    expect(createNativeMidiBridgeFromHost({})).toBeNull();
    expect(createNativeMidiBridgeFromHost({ webkit: {} })).toBeNull();
    expect(createNativeMidiBridgeFromHost({ webkit: { messageHandlers: {} } })).toBeNull();
    expect(
      createNativeMidiBridgeFromHost({
        webkit: { messageHandlers: { learnPianoMidi: { postMessage: true } } },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    ).toBeNull();
    expect(
      createNativeMidiBridgeFromHost({
        webkit: { messageHandlers: { learnPianoMidi: { postMessage: vi.fn() } } },
      }),
    ).toBeNull();

    const bridge = createNativeMidiBridgeFromHost({
      webkit: { messageHandlers: { learnPianoMidi: { postMessage: () => undefined } } },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    if (bridge === null) {
      throw new Error("Expected a structurally valid bridge.");
    }
    await expect(bridge.postMessage({ type: "list-inputs" })).rejects.toThrow("does not support replies");
  });
});

describe("NativeMidiInputPort", () => {
  it("reports unsupported without a valid bridge", async () => {
    const port = new NativeMidiInputPort({ bridge: null });

    expect(port.capability).toBe("unsupported");
    expect(port.getState()).toEqual({ status: "unsupported", selectedInputId: null, errorMessage: null });
    await expect(port.requestAccess()).resolves.toEqual([]);
    await expect(port.selectInput("piano")).resolves.toBe(false);
    await expect(port.openBluetoothSettings()).resolves.toBe(false);
    port.disconnect();
  });

  it("enumerates and selects native MIDI inputs", async () => {
    const bridge = new FakeNativeMidiBridge();
    bridge.responder = async (command) => {
      if (command.type === "select-input") {
        return reply("connected", command.inputId);
      }
      return reply("idle");
    };
    const port = new NativeMidiInputPort({ bridge });
    const states: MidiConnectionState[] = [];
    port.onStateChange((state) => states.push(state));

    await expect(port.requestAccess()).resolves.toEqual([{ id: "piano", label: "Roland GO:PIANO 61" }]);
    await expect(port.selectInput("piano")).resolves.toBe(true);

    expect(bridge.commands).toEqual([{ type: "list-inputs" }, { type: "select-input", inputId: "piano" }]);
    expect(port.getState()).toEqual({ status: "connected", selectedInputId: "piano", errorMessage: null });
    expect(states.map((state) => state.status)).toEqual(["idle", "requesting-permission", "idle", "requesting-permission", "connected"]);
  });

  it("validates and delivers normalized events, including velocity-zero note-off", async () => {
    const { bridge, port } = await connectedPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 10 },
    });
    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 16, noteNumber: 60, velocity: 0, timestamp: 11 },
    });
    bridge.emit({
      type: "midi-event",
      event: { type: "note-off", channel: 16, noteNumber: 60, velocity: 24, timestamp: 11 },
    });

    expect(events).toEqual([
      { type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 10 },
      { type: "note-off", channel: 16, noteNumber: 60, velocity: 0, timestamp: 11 },
      { type: "note-off", channel: 16, noteNumber: 60, velocity: 24, timestamp: 11 },
    ]);
  });

  it("ignores malformed and regressing events without stopping later delivery", async () => {
    const { bridge, port } = await connectedPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    const malformedEvents: readonly unknown[] = [
      null,
      { type: "midi-event" },
      { type: "midi-event", event: { type: "control-change", channel: 1, noteNumber: 60, velocity: 1, timestamp: 1 } },
      { type: "midi-event", event: { type: "note-on", channel: 0, noteNumber: 60, velocity: 1, timestamp: 1 } },
      { type: "midi-event", event: { type: "note-on", channel: 1, noteNumber: 128, velocity: 1, timestamp: 1 } },
      { type: "midi-event", event: { type: "note-on", channel: 1, noteNumber: 60, velocity: -1, timestamp: 1 } },
      { type: "midi-event", event: { type: "note-on", channel: 1, noteNumber: 60, velocity: 1, timestamp: Number.NaN } },
    ];
    for (const event of malformedEvents) {
      bridge.emit(event);
    }

    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 61, velocity: 1, timestamp: 10 },
    });
    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 62, velocity: 1, timestamp: 9 },
    });
    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 63, velocity: 1, timestamp: 12 },
    });

    expect(events.map((event) => event.noteNumber)).toEqual([61, 63]);
  });

  it("applies valid state pushes and ignores malformed snapshots and events while disconnected", async () => {
    const { bridge, port } = await connectedPort();
    const events = vi.fn();
    port.onEvent(events);

    bridge.emit({
      type: "state-change",
      inputs: [{ id: "piano", label: "  GO:PIANO 61  " }],
      state: { status: "disconnected", selectedInputId: "piano", errorMessage: "ignored" },
    });
    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1 },
    });
    bridge.emit({
      type: "state-change",
      inputs: [
        { id: "duplicate", label: "One" },
        { id: "duplicate", label: "Two" },
      ],
      state: { status: "connected", selectedInputId: "duplicate", errorMessage: null },
    });
    bridge.emit({
      type: "state-change",
      inputs: [],
      state: { status: "connected", selectedInputId: "missing", errorMessage: null },
    });

    expect(port.getInputs()).toEqual([{ id: "piano", label: "GO:PIANO 61" }]);
    expect(port.getState()).toEqual({ status: "disconnected", selectedInputId: "piano", errorMessage: null });
    expect(events).not.toHaveBeenCalled();
  });

  it("does not let an older asynchronous reply replace a newer selection", async () => {
    const bridge = new FakeNativeMidiBridge();
    const listGate = deferred<unknown>();
    bridge.responder = (command) => (command.type === "list-inputs" ? listGate.promise : Promise.resolve(reply("connected", "piano")));
    const port = new NativeMidiInputPort({ bridge });

    const listRequest = port.requestAccess();
    await expect(port.selectInput("piano")).resolves.toBe(true);
    listGate.resolve(reply("idle"));
    await listRequest;

    expect(port.getState()).toEqual({ status: "connected", selectedInputId: "piano", errorMessage: null });
  });

  it("disconnects immediately and ignores a pending selection reply", async () => {
    const bridge = new FakeNativeMidiBridge();
    const selectionGate = deferred<unknown>();
    bridge.responder = (command) => {
      if (command.type === "select-input") {
        return selectionGate.promise;
      }
      return Promise.resolve(reply("disconnected", "piano"));
    };
    const port = new NativeMidiInputPort({ bridge });

    const selection = port.selectInput("piano");
    port.disconnect();
    expect(port.getState()).toEqual({ status: "disconnected", selectedInputId: "piano", errorMessage: null });
    selectionGate.resolve(reply("connected", "piano"));

    await expect(selection).resolves.toBe(false);
    await Promise.resolve();
    expect(bridge.commands).toEqual([{ type: "select-input", inputId: "piano" }, { type: "disconnect" }]);
    expect(port.getState()).toEqual({ status: "disconnected", selectedInputId: "piano", errorMessage: null });
  });

  it("lets a state push supersede an older command reply", async () => {
    const bridge = new FakeNativeMidiBridge();
    const gate = deferred<unknown>();
    bridge.responder = () => gate.promise;
    const port = new NativeMidiInputPort({ bridge });

    const request = port.requestAccess();
    bridge.emit({
      type: "state-change",
      inputs: [{ id: "piano", label: "Piano" }],
      state: { status: "connected", selectedInputId: "piano", errorMessage: null },
    });
    gate.resolve(reply("idle"));
    await request;

    expect(port.getState()).toEqual({ status: "connected", selectedInputId: "piano", errorMessage: null });
  });

  it("treats a matching connected push before the selection reply as success", async () => {
    const bridge = new FakeNativeMidiBridge();
    const gate = deferred<unknown>();
    bridge.responder = () => gate.promise;
    const port = new NativeMidiInputPort({ bridge });

    const selection = port.selectInput("piano");
    bridge.emit({
      type: "state-change",
      inputs: [{ id: "piano", label: "Piano" }],
      state: { status: "connected", selectedInputId: "piano", errorMessage: null },
    });
    gate.resolve(reply("connected", "piano"));

    await expect(selection).resolves.toBe(true);
    expect(port.getState()).toEqual({ status: "connected", selectedInputId: "piano", errorMessage: null });
  });

  it("uses bounded calm errors for rejected, malformed, and failed replies", async () => {
    const bridge = new FakeNativeMidiBridge();
    const port = new NativeMidiInputPort({ bridge });
    bridge.responder = async () =>
      reply("error", "piano", {
        ok: false,
        errorMessage: `  Device is busy.\n${"x".repeat(300)}`,
      });

    await expect(port.selectInput("piano")).resolves.toBe(false);
    expect(port.getState().status).toBe("error");
    expect(port.getState().errorMessage).toMatch(/^Device is busy\. /);
    expect(port.getState().errorMessage?.length).toBeLessThanOrEqual(160);

    bridge.responder = async () => ({ ok: true, inputs: "not-an-array", state: {} });
    await port.requestAccess();
    expect(port.getState().errorMessage).toBe("The iPad MIDI response could not be read.");

    bridge.responder = async () => Promise.reject(new Error("CoreMIDI internals should stay private"));
    await port.requestAccess();
    expect(port.getState().errorMessage).toBe("The iPad MIDI connection could not be updated.");
  });

  it("opens Bluetooth settings through the native command", async () => {
    const bridge = new FakeNativeMidiBridge();
    const port = new NativeMidiInputPort({ bridge });

    await expect(port.openBluetoothSettings()).resolves.toBe(true);
    expect(bridge.commands).toEqual([{ type: "open-bluetooth-settings" }]);
  });

  it("removes native and subscriber listeners on disposal and ignores late replies", async () => {
    const bridge = new FakeNativeMidiBridge();
    const gate = deferred<unknown>();
    bridge.responder = () => gate.promise;
    const port = new NativeMidiInputPort({ bridge });
    const eventListener = vi.fn();
    const stateListener = vi.fn();
    port.onEvent(eventListener);
    port.onStateChange(stateListener);

    const pending = port.requestAccess();
    expect(bridge.listenerCount).toBe(1);
    port.dispose();
    expect(bridge.listenerCount).toBe(0);
    expect(bridge.commands).toEqual([{ type: "list-inputs" }, { type: "disconnect" }]);
    gate.resolve(reply("connected", "piano"));
    await pending;
    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1 },
    });

    expect(port.getInputs()).toEqual([]);
    expect(eventListener).not.toHaveBeenCalled();
    expect(stateListener).toHaveBeenCalledTimes(2);
    await expect(port.selectInput("piano")).resolves.toBe(false);
    await expect(port.openBluetoothSettings()).resolves.toBe(false);
    const unsubscribeEvent = port.onEvent(eventListener);
    const unsubscribeState = port.onStateChange(stateListener);
    unsubscribeEvent();
    unsubscribeState();
    port.disconnect();
    port.dispose();
  });

  it("does not expose synchronous or asynchronous native disconnect failures during disposal", async () => {
    const synchronousBridge = new FakeNativeMidiBridge();
    synchronousBridge.responder = () => {
      throw new Error("Native disconnect failed synchronously");
    };
    const synchronousPort = new NativeMidiInputPort({ bridge: synchronousBridge });
    expect(() => synchronousPort.dispose()).not.toThrow();

    const asynchronousBridge = new FakeNativeMidiBridge();
    asynchronousBridge.responder = async () => Promise.reject(new Error("Native disconnect failed asynchronously"));
    const asynchronousPort = new NativeMidiInputPort({ bridge: asynchronousBridge });
    asynchronousPort.dispose();
    await Promise.resolve();

    expect(synchronousBridge.commands).toEqual([{ type: "disconnect" }]);
    expect(asynchronousBridge.commands).toEqual([{ type: "disconnect" }]);
  });

  it("supports removing individual event and state subscribers", async () => {
    const { bridge, port } = await connectedPort();
    const eventListener = vi.fn();
    const stateListener = vi.fn();
    const unsubscribeEvent = port.onEvent(eventListener);
    const unsubscribeState = port.onStateChange(stateListener);
    unsubscribeEvent();
    unsubscribeState();

    bridge.emit({
      type: "midi-event",
      event: { type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1 },
    });
    bridge.emit({
      type: "state-change",
      inputs: [],
      state: { status: "idle", selectedInputId: null, errorMessage: null },
    });

    expect(eventListener).not.toHaveBeenCalled();
    expect(stateListener).toHaveBeenCalledTimes(1);
  });
});
