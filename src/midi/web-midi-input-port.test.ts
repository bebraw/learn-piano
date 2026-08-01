import { describe, expect, it, vi } from "vitest";
import type { MidiConnectionState, NormalizedMidiEvent } from "./types.js";
import {
  WebMidiInputPort,
  type WebMidiAccessHandle,
  type WebMidiInputCollectionHandle,
  type WebMidiInputHandle,
  type WebMidiMessageEventHandle,
  type WebMidiMessageListener,
  type WebMidiPortStateHandle,
  type WebMidiStateChangeEventHandle,
  type WebMidiStateChangeListener,
} from "./web-midi-input-port.js";

class FakeWebMidiInput implements WebMidiInputHandle {
  readonly id: string;
  readonly name: string | null;
  readonly manufacturer: string | null;
  state = "connected";
  connection: "closed" | "open" | "pending" = "closed";
  openCalls = 0;
  closeCalls = 0;

  private readonly listeners = new Set<WebMidiMessageListener>();
  private openBehavior: (() => Promise<void>) | null = null;

  constructor(id: string, name: string | null, manufacturer: string | null = null) {
    this.id = id;
    this.name = name;
    this.manufacturer = manufacturer;
  }

  setOpenBehavior(behavior: () => Promise<void>): void {
    this.openBehavior = behavior;
  }

  async open(): Promise<void> {
    this.openCalls += 1;
    this.connection = "pending";
    try {
      await this.openBehavior?.();
      this.connection = "open";
    } catch (error: unknown) {
      this.connection = "closed";
      throw error;
    }
  }

  async close(): Promise<void> {
    this.closeCalls += 1;
    this.connection = "closed";
  }

  addEventListener(type: "midimessage", listener: WebMidiMessageListener): void {
    expect(type).toBe("midimessage");
    this.listeners.add(listener);
  }

  removeEventListener(type: "midimessage", listener: WebMidiMessageListener): void {
    expect(type).toBe("midimessage");
    this.listeners.delete(listener);
  }

  emit(data: ArrayLike<number> | null, timeStamp: number): void {
    const event: WebMidiMessageEventHandle = { data, timeStamp };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getListeners(): readonly WebMidiMessageListener[] {
    return [...this.listeners];
  }
}

class FakeWebMidiAccess implements WebMidiAccessHandle {
  private readonly inputMap = new Map<string, FakeWebMidiInput>();
  private readonly listeners = new Set<WebMidiStateChangeListener>();

  readonly inputs: WebMidiInputCollectionHandle = {
    values: () => this.inputMap.values(),
  };

  constructor(inputs: readonly FakeWebMidiInput[] = []) {
    for (const input of inputs) {
      this.inputMap.set(input.id, input);
    }
  }

  addEventListener(type: "statechange", listener: WebMidiStateChangeListener): void {
    expect(type).toBe("statechange");
    this.listeners.add(listener);
  }

  removeEventListener(type: "statechange", listener: WebMidiStateChangeListener): void {
    expect(type).toBe("statechange");
    this.listeners.delete(listener);
  }

  addInput(input: FakeWebMidiInput): void {
    input.state = "connected";
    this.inputMap.set(input.id, input);
    this.emitStateChange({ id: input.id, state: "connected", type: "input" });
  }

  disconnectInput(input: FakeWebMidiInput): void {
    input.state = "disconnected";
    this.inputMap.delete(input.id);
    this.emitStateChange({ id: input.id, state: "disconnected", type: "input" });
  }

  removeInputWithoutEvent(input: FakeWebMidiInput): void {
    input.state = "disconnected";
    this.inputMap.delete(input.id);
  }

  emitStateChange(port: WebMidiPortStateHandle | null): void {
    const event: WebMidiStateChangeEventHandle = { port };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getListeners(): readonly WebMidiStateChangeListener[] {
    return [...this.listeners];
  }
}

function firstListener<T>(listeners: readonly T[]): T {
  const listener = listeners[0];
  if (listener === undefined) {
    throw new Error("Expected one registered listener.");
  }
  return listener;
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolvePromise: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: () => {
      if (resolvePromise === undefined) {
        throw new Error("Deferred promise was not initialized.");
      }
      resolvePromise();
    },
  };
}

async function connectedWebPort(
  inputs: readonly FakeWebMidiInput[],
  selectedInputId = inputs[0]?.id,
): Promise<{ access: FakeWebMidiAccess; port: WebMidiInputPort }> {
  if (selectedInputId === undefined) {
    throw new Error("A selected input id is required.");
  }

  const access = new FakeWebMidiAccess(inputs);
  const port = new WebMidiInputPort({ requestAccess: async () => access });
  await port.requestAccess();
  await port.selectInput(selectedInputId);
  return { access, port };
}

describe("WebMidiInputPort", () => {
  it("uses the browser requester with system-exclusive access disabled", async () => {
    const access = new FakeWebMidiAccess();
    const requestMIDIAccess = vi.fn(async () => access);
    vi.stubGlobal("navigator", { requestMIDIAccess });

    try {
      const port = new WebMidiInputPort();

      expect(port.capability).toBe("supported");
      await port.requestAccess();
      expect(requestMIDIAccess).toHaveBeenCalledWith({ sysex: false });
      port.dispose();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses input ids as labels when platform names are empty", async () => {
    const access = new FakeWebMidiAccess([new FakeWebMidiInput("anonymous", "  ")]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });

    await expect(port.requestAccess()).resolves.toEqual([{ id: "anonymous", label: "anonymous" }]);
  });

  it("reports unsupported capability without requesting browser access", async () => {
    const port = new WebMidiInputPort({ requestAccess: null });

    expect(port.capability).toBe("unsupported");
    expect(port.getState()).toEqual({
      status: "unsupported",
      selectedInputId: null,
      errorMessage: null,
    });
    await expect(port.requestAccess()).resolves.toEqual([]);
    await expect(port.selectInput("anything")).resolves.toBe(false);
  });

  it("uses a generic recoverable error for non-Error permission failures", async () => {
    const port = new WebMidiInputPort({
      requestAccess: async () => Promise.reject("denied"),
    });

    await port.requestAccess();

    expect(port.getState().errorMessage).toBe("MIDI access could not be requested.");
  });

  it("enumerates labeled inputs after a recoverable permission error", async () => {
    const input = new FakeWebMidiInput("roland", "GO:PIANO 61", "Roland");
    const access = new FakeWebMidiAccess([input]);
    let requestCount = 0;
    const states: MidiConnectionState[] = [];
    const port = new WebMidiInputPort({
      requestAccess: async () => {
        requestCount += 1;
        if (requestCount === 1) {
          throw new Error("Permission denied");
        }
        return access;
      },
    });
    port.onStateChange((state) => states.push(state));

    await expect(port.requestAccess()).resolves.toEqual([]);
    expect(port.getState()).toEqual({
      status: "error",
      selectedInputId: null,
      errorMessage: "Permission denied",
    });
    await expect(port.requestAccess()).resolves.toEqual([{ id: "roland", label: "Roland GO:PIANO 61" }]);

    expect(states.map((state) => state.status)).toEqual(["idle", "requesting-permission", "error", "requesting-permission", "idle"]);
    expect(access.getListeners()).toHaveLength(1);
  });

  it("deduplicates concurrent platform access requests", async () => {
    const gate = deferred();
    const access = new FakeWebMidiAccess([new FakeWebMidiInput("keyboard", "Keyboard")]);
    const requestAccess = vi.fn(async () => {
      await gate.promise;
      return access;
    });
    const port = new WebMidiInputPort({ requestAccess });

    const firstRequest = port.requestAccess();
    const secondRequest = port.requestAccess();
    expect(requestAccess).toHaveBeenCalledTimes(1);

    gate.resolve();
    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      [{ id: "keyboard", label: "Keyboard" }],
      [{ id: "keyboard", label: "Keyboard" }],
    ]);
    expect(access.getListeners()).toHaveLength(1);
  });

  it("does not attach stale access after a manual disconnect", async () => {
    const gate = deferred();
    const access = new FakeWebMidiAccess();
    const port = new WebMidiInputPort({
      requestAccess: async () => {
        await gate.promise;
        return access;
      },
    });

    const request = port.requestAccess();
    port.disconnect();
    gate.resolve();

    await expect(request).resolves.toEqual([]);
    expect(access.getListeners()).toHaveLength(0);
    expect(port.getState().status).toBe("idle");
  });

  it("normalizes supported messages, skips unsupported data, and preserves delivery", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    input.emit([0xb0, 7, 100], 1);
    input.emit([0x90, 60, 0], 2);
    input.emit([0x92, 62, 80], 3);

    expect(events).toEqual([
      { type: "note-off", channel: 1, noteNumber: 60, velocity: 0, timestamp: 2 },
      { type: "note-on", channel: 3, noteNumber: 62, velocity: 80, timestamp: 3 },
    ]);
  });

  it("keeps emitted timestamps nondecreasing while accepting equal timestamps", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    input.emit([0x90, 60, 1], 10);
    input.emit([0x90, 61, 1], 9);
    input.emit([0x90, 62, 1], 10);

    expect(events.map((event) => event.noteNumber)).toEqual([60, 62]);
  });

  it("selecting the same input repeatedly never duplicates delivery", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);
    const listener = vi.fn();
    port.onEvent(listener);

    await port.selectInput(input.id);
    await port.selectInput(input.id);
    input.emit([0x90, 60, 72], 1);

    expect(input.getListeners()).toHaveLength(1);
    expect(input.openCalls).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("selects an input by requesting access when needed", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const access = new FakeWebMidiAccess([input]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });

    await expect(port.selectInput(input.id)).resolves.toBe(true);

    expect(port.getState().status).toBe("connected");
    expect(input.openCalls).toBe(1);
    expect(input.getListeners()).toHaveLength(1);
  });

  it("awaits platform input opening before reporting a connection", async () => {
    const gate = deferred();
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    input.setOpenBehavior(() => gate.promise);
    const access = new FakeWebMidiAccess([input]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });
    await port.requestAccess();

    const selection = port.selectInput(input.id);

    expect(input.connection).toBe("pending");
    expect(input.getListeners()).toHaveLength(0);
    expect(port.getState()).toEqual({
      status: "requesting-permission",
      selectedInputId: input.id,
      errorMessage: null,
    });

    gate.resolve();
    await expect(selection).resolves.toBe(true);
    expect(input.connection).toBe("open");
    expect(input.getListeners()).toHaveLength(1);
    expect(port.getState().status).toBe("connected");
  });

  it("reports a recoverable error when platform input opening fails", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    input.setOpenBehavior(async () => Promise.reject(new Error("Input could not open")));
    const access = new FakeWebMidiAccess([input]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });
    await port.requestAccess();

    await expect(port.selectInput(input.id)).resolves.toBe(false);

    expect(input.getListeners()).toHaveLength(0);
    expect(input.closeCalls).toBe(1);
    expect(port.getState()).toEqual({
      status: "error",
      selectedInputId: input.id,
      errorMessage: "Input could not open",
    });
  });

  it("keeps only the latest selection when platform openings settle out of order", async () => {
    const firstGate = deferred();
    const secondGate = deferred();
    const first = new FakeWebMidiInput("first", "First");
    const second = new FakeWebMidiInput("second", "Second");
    first.setOpenBehavior(() => firstGate.promise);
    second.setOpenBehavior(() => secondGate.promise);
    const access = new FakeWebMidiAccess([first, second]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });
    await port.requestAccess();

    const firstSelection = port.selectInput(first.id);
    const secondSelection = port.selectInput(second.id);
    secondGate.resolve();
    await expect(secondSelection).resolves.toBe(true);
    firstGate.resolve();
    await expect(firstSelection).resolves.toBe(false);

    expect(first.getListeners()).toHaveLength(0);
    expect(first.closeCalls).toBe(1);
    expect(second.getListeners()).toHaveLength(1);
    expect(second.closeCalls).toBe(0);
    expect(port.getState()).toEqual({ status: "connected", selectedInputId: second.id, errorMessage: null });
  });

  it("cancels and closes an input that finishes opening after disconnect", async () => {
    const gate = deferred();
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    input.setOpenBehavior(() => gate.promise);
    const access = new FakeWebMidiAccess([input]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });
    await port.requestAccess();

    const selection = port.selectInput(input.id);
    port.disconnect();
    gate.resolve();

    await expect(selection).resolves.toBe(false);
    expect(input.getListeners()).toHaveLength(0);
    expect(input.closeCalls).toBe(1);
    expect(port.getState().status).toBe("disconnected");
  });

  it("switches inputs by detaching the old listener and ignores its late callback", async () => {
    const first = new FakeWebMidiInput("first", "First");
    const second = new FakeWebMidiInput("second", "Second");
    const { port } = await connectedWebPort([first, second], first.id);
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));
    const lateFirstListener = firstListener(first.getListeners());

    await port.selectInput(second.id);
    lateFirstListener({ data: [0x90, 60, 72], timeStamp: 1 });
    second.emit([0x90, 62, 72], 2);

    expect(first.getListeners()).toHaveLength(0);
    expect(first.closeCalls).toBe(1);
    expect(second.getListeners()).toHaveLength(1);
    expect(events.map((event) => event.noteNumber)).toEqual([62]);
  });

  it("disconnects an active device and reconnects the same id without duplicate listeners", async () => {
    const firstConnection = new FakeWebMidiInput("keyboard", "Keyboard");
    const { access, port } = await connectedWebPort([firstConnection]);
    const listener = vi.fn();
    port.onEvent(listener);
    const lateListener = firstListener(firstConnection.getListeners());

    access.disconnectInput(firstConnection);
    lateListener({ data: [0x90, 60, 72], timeStamp: 1 });

    expect(port.getState()).toEqual({
      status: "disconnected",
      selectedInputId: "keyboard",
      errorMessage: null,
    });
    expect(firstConnection.getListeners()).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();

    const secondConnection = new FakeWebMidiInput("keyboard", "Keyboard");
    access.addInput(secondConnection);
    expect(port.getState().status).toBe("disconnected");
    await port.selectInput(secondConnection.id);
    await port.selectInput(secondConnection.id);
    secondConnection.emit([0x90, 64, 72], 2);

    expect(secondConnection.getListeners()).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("detects a selected input removed before a repeated access query", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { access, port } = await connectedWebPort([input]);
    access.removeInputWithoutEvent(input);

    await expect(port.requestAccess()).resolves.toEqual([]);

    expect(input.getListeners()).toHaveLength(0);
    expect(port.getState().status).toBe("disconnected");
  });

  it("manual disconnect removes delivery and can remain idle before selection", async () => {
    const idleAccess = new FakeWebMidiAccess();
    const idlePort = new WebMidiInputPort({ requestAccess: async () => idleAccess });
    idlePort.disconnect();
    expect(idlePort.getState().status).toBe("idle");

    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);
    const listener = vi.fn();
    port.onEvent(listener);
    const lateListener = firstListener(input.getListeners());

    port.disconnect();
    lateListener({ data: [0x90, 60, 72], timeStamp: 1 });

    expect(port.getState().status).toBe("disconnected");
    expect(input.getListeners()).toHaveLength(0);
    expect(input.closeCalls).toBe(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("ignores nullable browser event payloads", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { access, port } = await connectedWebPort([input]);
    const listener = vi.fn();
    port.onEvent(listener);

    input.emit(null, 1);
    access.emitStateChange(null);

    expect(listener).not.toHaveBeenCalled();
    expect(port.getState().status).toBe("connected");
  });

  it("refreshes devices for unrelated and output state changes without disconnecting", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { access, port } = await connectedWebPort([input]);
    const other = new FakeWebMidiInput("other", "Other");

    access.addInput(other);
    access.emitStateChange({ id: input.id, state: "disconnected", type: "output" });

    expect(port.getInputs()).toEqual([
      { id: "keyboard", label: "Keyboard" },
      { id: "other", label: "Other" },
    ]);
    expect(port.getState().status).toBe("connected");
  });

  it("reports unavailable selection without retaining the previous input listener", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);

    await expect(port.selectInput("missing")).resolves.toBe(false);

    expect(input.getListeners()).toHaveLength(0);
    expect(port.getState()).toEqual({
      status: "error",
      selectedInputId: "missing",
      errorMessage: 'MIDI input "missing" is not available.',
    });
  });

  it("disposes platform listeners and ignores captured late callbacks", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { access, port } = await connectedWebPort([input]);
    const eventListener = vi.fn();
    const stateListener = vi.fn();
    port.onEvent(eventListener);
    port.onStateChange(stateListener);
    const lateInputListener = firstListener(input.getListeners());
    const lateAccessListener = firstListener(access.getListeners());

    port.dispose();
    lateInputListener({ data: [0x90, 60, 72], timeStamp: 1 });
    lateAccessListener({ port: { id: input.id, state: "disconnected", type: "input" } });

    expect(input.getListeners()).toHaveLength(0);
    expect(input.closeCalls).toBe(1);
    expect(access.getListeners()).toHaveLength(0);
    expect(eventListener).not.toHaveBeenCalled();
    expect(stateListener).toHaveBeenCalledTimes(1);
    await expect(port.requestAccess()).resolves.toEqual([]);
    await expect(port.selectInput(input.id)).resolves.toBe(false);

    const lateEventUnsubscribe = port.onEvent(eventListener);
    const lateStateUnsubscribe = port.onStateChange(stateListener);
    lateEventUnsubscribe();
    lateStateUnsubscribe();
    port.disconnect();
    port.dispose();
  });

  it("removes event and state subscribers through cleanup functions", async () => {
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    const { port } = await connectedWebPort([input]);
    const eventListener = vi.fn();
    const stateListener = vi.fn();
    const unsubscribeEvent = port.onEvent(eventListener);
    const unsubscribeState = port.onStateChange(stateListener);

    unsubscribeEvent();
    unsubscribeState();
    input.emit([0x90, 60, 72], 1);
    port.disconnect();

    expect(eventListener).not.toHaveBeenCalled();
    expect(stateListener).toHaveBeenCalledTimes(1);
  });

  it("does not attach access listeners when disposed during a pending request", async () => {
    const access = new FakeWebMidiAccess();
    const port = new WebMidiInputPort({
      requestAccess: async () => {
        await Promise.resolve();
        return access;
      },
    });

    const accessResult = port.requestAccess();
    port.dispose();

    await expect(accessResult).resolves.toEqual([]);
    expect(access.getListeners()).toHaveLength(0);
  });

  it("closes an input that finishes opening after disposal", async () => {
    const gate = deferred();
    const input = new FakeWebMidiInput("keyboard", "Keyboard");
    input.setOpenBehavior(() => gate.promise);
    const access = new FakeWebMidiAccess([input]);
    const port = new WebMidiInputPort({ requestAccess: async () => access });
    await port.requestAccess();

    const selection = port.selectInput(input.id);
    port.dispose();
    gate.resolve();

    await expect(selection).resolves.toBe(false);
    expect(input.getListeners()).toHaveLength(0);
    expect(input.closeCalls).toBe(1);
  });
});
