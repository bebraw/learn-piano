import { describe, expect, it, vi } from "vitest";
import { ascendingFiveNoteRawFixture } from "../exercises/library/five-note-ascent-fixture.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { resilientNormalizationRawFixture } from "./fixtures/raw-midi-fixtures.js";
import { MOCK_MIDI_INPUT_ID, MockMidiInputPort } from "./mock-midi-input-port.js";
import type { MidiConnectionState, NormalizedMidiEvent } from "./types.js";

async function connectedMockPort(): Promise<MockMidiInputPort> {
  const port = new MockMidiInputPort();
  await port.requestAccess();
  await port.selectInput(MOCK_MIDI_INPUT_ID);
  return port;
}

describe("MockMidiInputPort", () => {
  it("reports deterministic access and selection state", async () => {
    const port = new MockMidiInputPort();
    const states: MidiConnectionState[] = [];
    port.onStateChange((state) => states.push(state));

    await expect(port.requestAccess()).resolves.toEqual([{ id: MOCK_MIDI_INPUT_ID, label: "Deterministic mock keyboard" }]);
    await expect(port.selectInput(MOCK_MIDI_INPUT_ID)).resolves.toBe(true);

    expect(states.map((state) => state.status)).toEqual(["idle", "requesting-permission", "idle", "connected"]);
    expect(port.getState()).toEqual({
      status: "connected",
      selectedInputId: MOCK_MIDI_INPUT_ID,
      errorMessage: null,
    });
  });

  it("reports an unknown mock input as a recoverable error", async () => {
    const port = new MockMidiInputPort();

    await expect(port.selectInput("missing-input")).resolves.toBe(false);
    expect(port.getState()).toEqual({
      status: "error",
      selectedInputId: "missing-input",
      errorMessage: 'MIDI input "missing-input" is not available.',
    });

    await expect(port.selectInput(MOCK_MIDI_INPUT_ID)).resolves.toBe(true);
    expect(port.getState().status).toBe("connected");
  });

  it("preserves an established connection across repeated access requests", async () => {
    const port = await connectedMockPort();
    const listener = vi.fn();
    port.onStateChange(listener);

    await port.requestAccess();

    expect(port.getState()).toEqual({
      status: "connected",
      selectedInputId: MOCK_MIDI_INPUT_ID,
      errorMessage: null,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("replays the ascending raw fixture through the shared normalizer", async () => {
    const port = await connectedMockPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.replay(ascendingFiveNoteRawFixture.messages);

    expect(ascendingFiveNoteRawFixture).toMatchObject({
      exerciseId: fiveNoteAscentExercise.id,
      exerciseRevision: fiveNoteAscentExercise.revision,
      noteNumbers: fiveNoteAscentExercise.expectedEvents.map(({ noteNumber }) => noteNumber),
    });
    expect(events).toHaveLength(fiveNoteAscentExercise.expectedEvents.length * 2);
    expect(events.filter((event) => event.type === "note-on").map((event) => event.noteNumber)).toEqual(
      fiveNoteAscentExercise.expectedEvents.map(({ noteNumber }) => noteNumber),
    );
    expect(events[0]).toEqual({
      type: "note-on",
      channel: 1,
      noteNumber: fiveNoteAscentExercise.expectedEvents[0]?.noteNumber,
      velocity: 72,
      timestamp: 100,
    });
    expect(events.at(-1)).toEqual({
      type: "note-off",
      channel: 1,
      noteNumber: fiveNoteAscentExercise.expectedEvents.at(-1)?.noteNumber,
      velocity: 0,
      timestamp: 525,
    });
  });

  it("ignores unsupported fixture messages and continues with later valid messages", async () => {
    const port = await connectedMockPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.replay(resilientNormalizationRawFixture.messages);

    expect(events).toEqual([
      { type: "note-off", channel: 1, noteNumber: 60, velocity: 0, timestamp: 20 },
      { type: "note-on", channel: 2, noteNumber: 62, velocity: 64, timestamp: 30 },
    ]);
  });

  it("exposes a deterministic note-tap helper that uses raw normalization", async () => {
    const port = await connectedMockPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.tapNote(67, {
      channel: 16,
      velocity: 80,
      releaseVelocity: 12,
      timestamp: 10,
      duration: 5,
    });

    expect(events).toEqual([
      { type: "note-on", channel: 16, noteNumber: 67, velocity: 80, timestamp: 10 },
      { type: "note-off", channel: 16, noteNumber: 67, velocity: 12, timestamp: 15 },
    ]);
  });

  it("uses the injected monotonic clock for default tap timestamps and advances past prior events", async () => {
    const now = vi.fn(() => 100);
    const port = new MockMidiInputPort({ now });
    await port.selectInput(MOCK_MIDI_INPUT_ID);
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.tapNote(60);
    now.mockReturnValue(50);
    port.tapNote(62, { duration: 5 });

    expect(events.map((event) => event.timestamp)).toEqual([100, 125, 126, 131]);
    expect(now).toHaveBeenCalledTimes(2);
  });

  it("preserves explicit fixture timestamps without consulting the runtime clock", async () => {
    const now = vi.fn(() => 1_000);
    const port = new MockMidiInputPort({ now });
    await port.selectInput(MOCK_MIDI_INPUT_ID);
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.tapNote(60, { timestamp: 10, duration: 5 });

    expect(events.map((event) => event.timestamp)).toEqual([10, 15]);
    expect(now).not.toHaveBeenCalled();
  });

  it("emits a nondecreasing sequence and accepts equal timestamps", async () => {
    const port = await connectedMockPort();
    const events: NormalizedMidiEvent[] = [];
    port.onEvent((event) => events.push(event));

    port.replay([
      { data: [0x90, 60, 1], timestamp: 10 },
      { data: [0x90, 61, 1], timestamp: 9 },
      { data: [0x90, 62, 1], timestamp: 10 },
    ]);

    expect(events.map((event) => event.noteNumber)).toEqual([60, 62]);
  });

  it("does not deliver while disconnected or after listener cleanup", async () => {
    const port = new MockMidiInputPort();
    const listener = vi.fn();
    const unsubscribe = port.onEvent(listener);

    port.replay([{ data: [0x90, 60, 72], timestamp: 1 }]);
    await port.selectInput(MOCK_MIDI_INPUT_ID);
    port.replay([{ data: [0x90, 60, 72], timestamp: 1 }]);
    port.disconnect();
    port.replay([{ data: [0x90, 62, 72], timestamp: 2 }]);
    unsubscribe();
    await port.selectInput(MOCK_MIDI_INPUT_ID);
    port.replay([{ data: [0x90, 64, 72], timestamp: 3 }]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(port.getState().status).toBe("connected");
  });

  it("ignores invalid note-tap inputs without emitting a partial tap", async () => {
    const port = await connectedMockPort();
    const listener = vi.fn();
    port.onEvent(listener);

    port.tapNote(-1);
    port.tapNote(128);
    port.tapNote(60, { channel: 0 });
    port.tapNote(60, { channel: 17 });
    port.tapNote(60, { velocity: 128 });
    port.tapNote(60, { releaseVelocity: -1 });
    port.tapNote(60, { timestamp: Number.NaN });
    port.tapNote(60, { timestamp: -1 });
    port.tapNote(60, { duration: Infinity });
    port.tapNote(60, { duration: -1 });
    port.tapNote(60, { timestamp: Number.MAX_VALUE, duration: Number.MAX_VALUE });

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps idle state when disconnected before selection", () => {
    const port = new MockMidiInputPort();

    port.disconnect();

    expect(port.getState().status).toBe("idle");
  });

  it("does not reconnect when a pending selection is followed by disconnect", async () => {
    const port = new MockMidiInputPort();

    const selection = port.selectInput(MOCK_MIDI_INPUT_ID);
    port.disconnect();

    await expect(selection).resolves.toBe(false);
    expect(port.getState().status).toBe("idle");
  });

  it("does not connect when disposed during a pending selection", async () => {
    const port = new MockMidiInputPort();

    const selection = port.selectInput(MOCK_MIDI_INPUT_ID);
    port.dispose();

    await expect(selection).resolves.toBe(false);
    expect(port.getInputs()).toEqual([]);
  });

  it("disposes subscriptions and rejects later interaction", async () => {
    const port = await connectedMockPort();
    const eventListener = vi.fn();
    const stateListener = vi.fn();
    port.onEvent(eventListener);
    port.onStateChange(stateListener);

    port.dispose();
    port.replay([{ data: [0x90, 60, 72], timestamp: 1 }]);
    port.tapNote(60);

    await expect(port.requestAccess()).resolves.toEqual([]);
    await expect(port.selectInput(MOCK_MIDI_INPUT_ID)).resolves.toBe(false);
    expect(port.getInputs()).toEqual([]);
    expect(eventListener).not.toHaveBeenCalled();
    expect(stateListener).toHaveBeenCalledTimes(1);

    const lateEventUnsubscribe = port.onEvent(eventListener);
    const lateStateUnsubscribe = port.onStateChange(stateListener);
    lateEventUnsubscribe();
    lateStateUnsubscribe();
    port.disconnect();
    port.dispose();
  });

  it("can be disposed while an access request is pending", async () => {
    const port = new MockMidiInputPort();

    const request = port.requestAccess();
    port.dispose();

    await expect(request).resolves.toEqual([]);
  });

  it("removes a state listener through its cleanup function", async () => {
    const port = new MockMidiInputPort();
    const listener = vi.fn();
    const unsubscribe = port.onStateChange(listener);

    unsubscribe();
    await port.selectInput(MOCK_MIDI_INPUT_ID);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
