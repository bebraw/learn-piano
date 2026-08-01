import { describe, expect, it } from "vitest";
import type {
  PracticePulseConfig,
  PracticePulsePort,
  PracticePulseState,
  PracticePulseStateListener,
  PracticePulseUnsubscribe,
} from "../audio/practice-pulse-port.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { exerciseLibrary } from "../exercises/library/index.js";
import { steadyQuarterRightHandExercise } from "../exercises/library/steady-quarter-exercises.js";
import type { MidiInputPort } from "../midi/midi-input-port.js";
import { MOCK_MIDI_INPUT_ID, MockMidiInputPort } from "../midi/mock-midi-input-port.js";
import type {
  MidiConnectionState,
  MidiEventListener,
  MidiInputDevice,
  MidiStateListener,
  MidiUnsubscribe,
  NormalizedMidiEvent,
} from "../midi/types.js";
import type { AttemptInputKind, AttemptRepository, CompletedAttemptRecord } from "./persistence/attempt-repository.js";
import { PracticeController, type PracticeControllerOptions, type PracticeSnapshot, type PracticeView } from "./practice-controller.js";

class MemoryAttemptRepository implements AttemptRepository {
  public readonly records: CompletedAttemptRecord[] = [];
  public failList = false;
  public failSave = false;
  public saveGate: Promise<void> | null = null;

  public async list(exerciseId: string, exerciseRevision: number): Promise<readonly CompletedAttemptRecord[]> {
    if (this.failList) {
      throw new Error("Storage blocked");
    }

    return this.records.filter((record) => record.exerciseId === exerciseId && record.exerciseRevision === exerciseRevision);
  }

  public async save(attempt: CompletedAttemptRecord): Promise<void> {
    if (this.failSave) {
      throw new Error("Storage full");
    }

    if (this.saveGate !== null) {
      await this.saveGate;
    }
    this.records.push(attempt);
  }
}

class RecordingView implements PracticeView {
  public readonly snapshots: PracticeSnapshot[] = [];

  public render(snapshot: PracticeSnapshot): void {
    this.snapshots.push(snapshot);
  }

  public latest(): PracticeSnapshot {
    const snapshot = this.snapshots.at(-1);
    if (snapshot === undefined) {
      throw new Error("No snapshot was rendered");
    }
    return snapshot;
  }
}

class ControllableMidiInputPort implements MidiInputPort {
  public readonly capability = "supported" as const;
  public inputs: readonly MidiInputDevice[];
  public state: MidiConnectionState = { status: "idle", selectedInputId: null, errorMessage: null };
  public accessResult: Promise<readonly MidiInputDevice[]> | null = null;
  public selectionResult: Promise<boolean> | null = null;

  private readonly eventListeners = new Set<MidiEventListener>();
  private readonly stateListeners = new Set<MidiStateListener>();

  public constructor(inputs: readonly MidiInputDevice[]) {
    this.inputs = inputs;
  }

  public getInputs(): readonly MidiInputDevice[] {
    return this.inputs.map((input) => ({ ...input }));
  }

  public getState(): MidiConnectionState {
    return { ...this.state };
  }

  public async requestAccess(): Promise<readonly MidiInputDevice[]> {
    return this.accessResult ?? this.getInputs();
  }

  public async selectInput(inputId: string): Promise<boolean> {
    const selected = this.selectionResult === null ? true : await this.selectionResult;
    if (selected) {
      this.emitState({ status: "connected", selectedInputId: inputId, errorMessage: null });
    }
    return selected;
  }

  public disconnect(): void {
    this.emitState({
      status: this.state.selectedInputId === null ? "idle" : "disconnected",
      selectedInputId: this.state.selectedInputId,
      errorMessage: null,
    });
  }

  public onEvent(listener: MidiEventListener): MidiUnsubscribe {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public onStateChange(listener: MidiStateListener): MidiUnsubscribe {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  public dispose(): void {
    this.eventListeners.clear();
    this.stateListeners.clear();
  }

  public emitEvent(event: NormalizedMidiEvent): void {
    for (const listener of Array.from(this.eventListeners)) {
      listener(event);
    }
  }

  public emitState(state: MidiConnectionState, inputs = this.inputs): void {
    this.state = { ...state };
    this.inputs = inputs;
    for (const listener of Array.from(this.stateListeners)) {
      listener(this.getState());
    }
  }
}

class ControllablePracticePulse implements PracticePulsePort {
  private readonly listeners = new Set<PracticePulseStateListener>();
  private state: PracticePulseState;
  public startCalls = 0;
  public stopCalls = 0;
  public disposed = false;
  public startBehavior: (() => Promise<void>) | null = null;

  public constructor(readonly config: PracticePulseConfig) {
    this.state = {
      status: "stopped",
      tempoBpm: config.tempoBpm,
      currentBeat: null,
      countInBeat: null,
      errorMessage: null,
    };
  }

  public getState(): PracticePulseState {
    return { ...this.state };
  }

  public async start(): Promise<void> {
    this.startCalls += 1;
    if (this.startBehavior !== null) {
      await this.startBehavior();
      return;
    }
    this.emit({ status: "counting-in", currentBeat: null, countInBeat: 1, errorMessage: null });
  }

  public stop(): void {
    this.stopCalls += 1;
    this.emit({ status: "stopped", currentBeat: null, countInBeat: null, errorMessage: null });
  }

  public onStateChange(listener: PracticePulseStateListener): PracticePulseUnsubscribe {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  public runAtBeat(currentBeat: number): void {
    this.emit({ status: "running", currentBeat, countInBeat: null, errorMessage: null });
  }

  public fail(errorMessage: string): void {
    this.emit({ status: "error", currentBeat: null, countInBeat: null, errorMessage });
  }

  private emit(state: Omit<PracticePulseState, "tempoBpm">): void {
    this.state = { ...state, tempoBpm: this.config.tempoBpm };
    for (const listener of Array.from(this.listeners)) {
      listener(this.getState());
    }
  }
}

describe("PracticeController", () => {
  it("initializes with deterministic mock input and empty history", async () => {
    const { controller, view } = createController();

    await controller.initialize();

    expect(view.latest()).toMatchObject({
      inputKind: "mock",
      sessionStatus: "ready",
      historyStatus: "ready",
      history: { completedToday: 0, totalCompleted: 0, mostRecent: null },
      inputs: [{ id: MOCK_MIDI_INPUT_ID, label: "Deterministic mock keyboard" }],
    });
  });

  it("completes the canonical sequence once and persists its exact identity", async () => {
    const { controller, mock, repository, view } = createController();
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    mock.tapNote(72);
    await controller.waitForPersistence();

    expect(view.latest().sessionStatus).toBe("completed");
    expect(view.latest().evaluation.completionSummary?.message).toBe("The sequence was correct.");
    expect(view.latest().history.completedToday).toBe(1);
    expect(repository.records).toEqual([
      expect.objectContaining({
        id: "attempt-fixed",
        exerciseId: fiveNoteAscentExercise.id,
        exerciseRevision: fiveNoteAscentExercise.revision,
        inputKind: "mock",
        status: "completed",
        errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
      }),
    ]);
  });

  it("recommends the direct dependent before persistence resolves and retains it after refresh", async () => {
    const repository = new MemoryAttemptRepository();
    const saveGate = deferred<void>();
    repository.saveGate = saveGate.promise;
    const { controller, mock, view } = createController(repository, { exerciseLibrary });
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }

    expect(repository.records).toEqual([]);
    expect(view.latest()).toMatchObject({
      sessionStatus: "completed",
      recommendationStatus: "ready",
      recommendation: {
        kind: "new-study",
        exercise: { id: exerciseLibrary[1]!.id },
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [fiveNoteAscentExercise.id],
        },
      },
    });

    saveGate.resolve(undefined);
    await controller.waitForPersistence();

    expect(repository.records).toHaveLength(1);
    expect(view.latest()).toMatchObject({
      recommendationStatus: "ready",
      recommendation: {
        kind: "new-study",
        exercise: { id: exerciseLibrary[1]!.id },
        reason: { kind: "direct-dependent" },
      },
    });
  });

  it("uses retained all-study history to recommend the least-recently practiced review", async () => {
    const repository = new MemoryAttemptRepository();
    repository.records.push(
      ...exerciseLibrary.map((exercise, index): CompletedAttemptRecord => ({
        schemaVersion: 1,
        id: `retained-${exercise.id}`,
        exerciseId: exercise.id,
        exerciseRevision: exercise.revision,
        startedAt: `2026-08-01T08:${String(index).padStart(2, "0")}:00.000Z`,
        completedAt: `2026-08-01T08:${String(index).padStart(2, "0")}:30.000Z`,
        inputKind: "mock",
        status: "completed",
        errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
      })),
    );
    const { controller, mock, view } = createController(repository, { exerciseLibrary });
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    await controller.waitForPersistence();

    expect(view.latest()).toMatchObject({
      recommendationStatus: "ready",
      recommendation: {
        kind: "review",
        exercise: { id: exerciseLibrary[1]!.id },
        reason: {
          kind: "least-recently-practiced",
          lastCompletedAt: "2026-08-01T08:01:30.000Z",
        },
      },
    });
  });

  it("restarts an incomplete attempt without creating history", async () => {
    const { controller, mock, repository, view } = createController();
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);
    mock.tapNote(60);
    mock.tapNote(62);

    expect(view.latest().evaluation.nextExpectedIndex).toBe(2);
    controller.restart();

    expect(view.latest()).toMatchObject({
      sessionStatus: "ready",
      feedback: null,
      evaluation: { nextExpectedIndex: 0, completed: false },
    });
    expect(repository.records).toEqual([]);
  });

  it("interrupts on disconnect and ignores input until an explicit restart", async () => {
    const { controller, mock, repository, view } = createController();
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);
    mock.tapNote(60);

    controller.disconnect();
    expect(view.latest().sessionStatus).toBe("interrupted");

    await controller.connect(MOCK_MIDI_INPUT_ID);
    mock.tapNote(62);
    expect(view.latest().evaluation.nextExpectedIndex).toBe(1);

    controller.restart();
    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    await controller.waitForPersistence();

    expect(view.latest().sessionStatus).toBe("completed");
    expect(repository.records).toHaveLength(1);
  });

  it("keeps musical completion and its advisory recommendation visible when persistence fails", async () => {
    const repository = new MemoryAttemptRepository();
    repository.failSave = true;
    const { controller, mock, view } = createController(repository, { exerciseLibrary });
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    await controller.waitForPersistence();

    expect(view.latest()).toMatchObject({
      sessionStatus: "completed",
      historyStatus: "unavailable",
      recommendationStatus: "ready",
      recommendation: {
        kind: "new-study",
        exercise: { id: exerciseLibrary[1]!.id },
        reason: { kind: "direct-dependent" },
      },
    });
    expect(view.latest().persistenceMessage).toContain("history could not be saved");
  });

  it("reports unavailable history without preventing input setup", async () => {
    const repository = new MemoryAttemptRepository();
    repository.failList = true;
    const { controller, mock, view } = createController(repository, { exerciseLibrary });

    await controller.initialize();

    expect(view.latest().historyStatus).toBe("unavailable");
    expect(view.latest().recommendationStatus).toBe("unavailable");
    expect(view.latest().inputs).toHaveLength(1);

    await controller.connect(MOCK_MIDI_INPUT_ID);
    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    await controller.waitForPersistence();

    expect(view.latest()).toMatchObject({
      sessionStatus: "completed",
      recommendationStatus: "unavailable",
      recommendation: null,
    });
  });

  it("switches ports, exposes selection failures, and disposes once", async () => {
    const { controller, web, view } = createController();
    await controller.initialize();

    await controller.selectInputKind("web-midi");
    expect(view.latest().inputKind).toBe("web-midi");
    await expect(controller.connect("missing")).resolves.toBe(false);
    expect(view.latest().connection.status).toBe("error");

    controller.dispose();
    controller.dispose();
    expect(web.onEvent(() => undefined)()).toBeUndefined();
    expect(() => controller.restart()).toThrow("disposed");
  });

  it("records native iPad input through the shared evaluation and persistence path", async () => {
    const native = new ControllableMidiInputPort([{ id: "coremidi:61", label: "GO:PIANO 61" }]);
    const repository = new MemoryAttemptRepository();
    const view = new RecordingView();
    const controller = new PracticeController(
      fiveNoteAscentExercise,
      { mock: new MockMidiInputPort(), "web-midi": new MockMidiInputPort(), "native-midi": native },
      repository,
      view,
      { monotonicNow: () => 0, createAttemptId: () => "native-attempt" },
    );
    await controller.initialize();
    await controller.selectInputKind("native-midi");
    await controller.connect("coremidi:61");

    for (const [index, event] of fiveNoteAscentExercise.expectedEvents.entries()) {
      native.emitEvent({ type: "note-on", channel: 1, noteNumber: event.noteNumber, velocity: 72, timestamp: index + 1 });
    }
    await controller.waitForPersistence();

    expect(view.latest().sessionStatus).toBe("completed");
    expect(repository.records).toEqual([expect.objectContaining({ id: "native-attempt", inputKind: "native-midi" })]);
  });

  it("gates a timed exercise behind count-in and persists MIDI-relative timing evidence", async () => {
    const input = { id: "timed-keyboard", label: "Timed keyboard" };
    const port = new ControllableMidiInputPort([input]);
    const repository = new MemoryAttemptRepository();
    const view = new RecordingView();
    let pulse: ControllablePracticePulse | null = null;
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: port, "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      repository,
      view,
      {
        monotonicNow: () => 0,
        createAttemptId: () => "timed-attempt",
        createPulse: (config) => {
          pulse = new ControllablePracticePulse(config);
          return pulse;
        },
      },
    );
    await controller.initialize();
    await controller.connect(input.id);

    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 500 });
    expect(view.latest().evaluation.nextExpectedIndex).toBe(0);

    await expect(controller.startPulse()).resolves.toBe(true);
    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 750 });
    expect(view.latest().evaluation.nextExpectedIndex).toBe(0);

    const activePulse = pulse as ControllablePracticePulse | null;
    if (activePulse === null) {
      throw new Error("Timed controller did not create a pulse");
    }
    activePulse.runAtBeat(1);
    for (const [index, event] of steadyQuarterRightHandExercise.expectedEvents.entries()) {
      port.emitEvent({ type: "note-on", channel: 1, noteNumber: event.noteNumber, velocity: 72, timestamp: 1_000 + index * 1_000 });
    }
    await controller.waitForPersistence();

    expect(view.latest().sessionStatus).toBe("completed");
    expect(view.latest().pulse?.status).toBe("stopped");
    expect(repository.records).toEqual([
      expect.objectContaining({
        id: "timed-attempt",
        timing: {
          tempoBpm: 60,
          assessedIntervals: 4,
          onPulse: 4,
          early: 0,
          late: 0,
          meanAbsoluteErrorMs: 0,
        },
      }),
    ]);
  });

  it("rebuilds a ready timed attempt at a selected tempo and locks tempo after count-in", async () => {
    const pulses: ControllablePracticePulse[] = [];
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: new MockMidiInputPort(), "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      new RecordingView(),
      {
        createPulse: (config) => {
          const pulse = new ControllablePracticePulse(config);
          pulses.push(pulse);
          return pulse;
        },
      },
    );
    await controller.initialize();

    controller.setTempo(80);
    expect(controller.getSnapshot()).toMatchObject({ tempoBpm: 80, evaluation: { timing: { tempoBpm: 80 } } });
    expect(pulses.map(({ config }) => config.tempoBpm)).toEqual([60, 80]);
    expect(pulses[0]?.disposed).toBe(true);
    expect(() => controller.setTempo(101)).toThrow(RangeError);

    await controller.connect(MOCK_MIDI_INPUT_ID);
    await controller.startPulse();
    expect(() => controller.setTempo(60)).toThrow(/Restart before changing/);
  });

  it("interrupts an active timed attempt when the learner stops the pulse", async () => {
    const input = { id: "timed-keyboard", label: "Timed keyboard" };
    const port = new ControllableMidiInputPort([input]);
    let pulse: ControllablePracticePulse | null = null;
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: port, "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      new RecordingView(),
      {
        createPulse: (config) => {
          pulse = new ControllablePracticePulse(config);
          return pulse;
        },
      },
    );
    await controller.initialize();
    await controller.connect(input.id);
    await controller.startPulse();
    const activePulse = pulse as ControllablePracticePulse | null;
    if (activePulse === null) {
      throw new Error("Timed controller did not create a pulse");
    }
    activePulse.runAtBeat(1);
    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1_000 });

    controller.stopPulse();

    expect(controller.getSnapshot()).toMatchObject({ sessionStatus: "interrupted", pulse: { status: "stopped" } });
  });

  it("interrupts an active timed attempt when pulse scheduling fails", async () => {
    const input = { id: "timed-keyboard", label: "Timed keyboard" };
    const port = new ControllableMidiInputPort([input]);
    let pulse: ControllablePracticePulse | null = null;
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: port, "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      new RecordingView(),
      {
        createPulse: (config) => {
          pulse = new ControllablePracticePulse(config);
          return pulse;
        },
      },
    );
    await controller.initialize();
    await controller.connect(input.id);
    await controller.startPulse();
    const activePulse = pulse as ControllablePracticePulse | null;
    if (activePulse === null) {
      throw new Error("Timed controller did not create a pulse");
    }
    activePulse.runAtBeat(1);
    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1_000 });

    activePulse.fail("The audio device stopped.");

    expect(controller.getSnapshot()).toMatchObject({
      sessionStatus: "interrupted",
      pulse: { status: "error", errorMessage: "The audio device stopped." },
      evaluation: { nextExpectedIndex: 1, timing: { anchorTimestamp: 1_000 } },
    });
  });

  it("stops timed guidance and resets its anchor after a disconnect and restart", async () => {
    const input = { id: "timed-keyboard", label: "Timed keyboard" };
    const port = new ControllableMidiInputPort([input]);
    let pulse: ControllablePracticePulse | null = null;
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: port, "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      new RecordingView(),
      {
        monotonicNow: () => 1_500,
        createPulse: (config) => {
          pulse = new ControllablePracticePulse(config);
          return pulse;
        },
      },
    );
    await controller.initialize();
    await controller.connect(input.id);
    await controller.startPulse();
    const activePulse = pulse as ControllablePracticePulse | null;
    if (activePulse === null) {
      throw new Error("Timed controller did not create a pulse");
    }
    activePulse.runAtBeat(1);
    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1_000 });

    controller.disconnect();
    expect(controller.getSnapshot()).toMatchObject({ sessionStatus: "interrupted", pulse: { status: "stopped" } });
    expect(activePulse.stopCalls).toBeGreaterThan(0);

    await controller.connect(input.id);
    controller.restart();
    expect(controller.getSnapshot()).toMatchObject({
      sessionStatus: "ready",
      pulse: { status: "stopped" },
      evaluation: { nextExpectedIndex: 0, timing: { anchorTimestamp: null } },
    });
  });

  it("does not render or report success when a pending pulse start outlives disposal", async () => {
    const gate = deferred<void>();
    const view = new RecordingView();
    let pulse: ControllablePracticePulse | null = null;
    const controller = new PracticeController(
      steadyQuarterRightHandExercise,
      { mock: new MockMidiInputPort(), "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      view,
      {
        createPulse: (config) => {
          const createdPulse = new ControllablePracticePulse(config);
          createdPulse.startBehavior = () => gate.promise;
          pulse = createdPulse;
          return createdPulse;
        },
      },
    );
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    const pendingStart = controller.startPulse();
    const renderCountBeforeDispose = view.snapshots.length;
    controller.dispose();
    gate.resolve(undefined);

    await expect(pendingStart).resolves.toBe(false);
    expect(view.snapshots).toHaveLength(renderCountBeforeDispose);
    expect((pulse as ControllablePracticePulse | null)?.disposed).toBe(true);
  });

  it("discards a late refresh result after the learner switches input kinds", async () => {
    const mock = new MockMidiInputPort();
    const web = new ControllableMidiInputPort([{ id: "web-keyboard", label: "Web keyboard" }]);
    const pendingAccess = deferred<readonly MidiInputDevice[]>();
    web.accessResult = pendingAccess.promise;
    const view = new RecordingView();
    const controller = new PracticeController(
      fiveNoteAscentExercise,
      { mock, "web-midi": web, "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      view,
      {
        monotonicNow: () => 0,
        createAttemptId: () => "attempt-fixed",
      },
    );
    await controller.initialize();

    const selectWeb = controller.selectInputKind("web-midi");
    const selectMock = controller.selectInputKind("mock");
    await selectMock;
    pendingAccess.resolve([{ id: "stale-web", label: "Stale Web device" }]);
    await selectWeb;

    expect(view.latest().inputKind).toBe("mock");
    expect(view.latest().inputs).toEqual([{ id: MOCK_MIDI_INPUT_ID, label: "Deterministic mock keyboard" }]);
  });

  it("refreshes the device list and interrupts held notes when the active source changes", async () => {
    const first = { id: "keyboard-a", label: "Keyboard A" };
    const second = { id: "keyboard-b", label: "Keyboard B" };
    const port = new ControllableMidiInputPort([first, second]);
    const view = new RecordingView();
    const controller = new PracticeController(
      fiveNoteAscentExercise,
      { mock: port, "web-midi": new MockMidiInputPort(), "native-midi": new MockMidiInputPort() },
      new MemoryAttemptRepository(),
      view,
      { monotonicNow: () => 0, createAttemptId: () => "attempt-fixed" },
    );
    await controller.initialize();
    await controller.connect(first.id);
    port.emitEvent({ type: "note-on", channel: 1, noteNumber: 60, velocity: 72, timestamp: 1 });

    port.emitState({ status: "connected", selectedInputId: second.id, errorMessage: null }, [second]);

    expect(view.latest()).toMatchObject({
      sessionStatus: "interrupted",
      activeNoteNumbers: [],
      inputs: [second],
      connection: { status: "connected", selectedInputId: second.id },
    });
  });

  it("ignores input timestamped before a restart and accepts a later event", async () => {
    let monotonicTime = 0;
    const { controller, mock, view } = createController(new MemoryAttemptRepository(), {
      monotonicNow: () => monotonicTime,
    });
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);
    mock.replay([{ data: [0x90, 60, 72], timestamp: 10 }]);

    monotonicTime = 20;
    controller.restart();
    mock.replay([
      { data: [0x90, 62, 72], timestamp: 15 },
      { data: [0x90, 60, 72], timestamp: 21 },
    ]);

    expect(view.latest().evaluation.nextExpectedIndex).toBe(1);
    expect(view.latest().feedback?.classification).toBe("correct");
  });

  it("recomputes completed-today history from the current local day", async () => {
    const repository = new MemoryAttemptRepository();
    repository.records.push({
      schemaVersion: 1,
      id: "yesterday",
      exerciseId: fiveNoteAscentExercise.id,
      exerciseRevision: fiveNoteAscentExercise.revision,
      startedAt: new Date(2026, 7, 1, 22, 55).toISOString(),
      completedAt: new Date(2026, 7, 1, 23, 0).toISOString(),
      inputKind: "mock",
      status: "completed",
      errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
    });
    let currentTime = new Date(2026, 7, 1, 23, 59);
    const { controller } = createController(repository, { now: () => currentTime });

    await controller.initialize();
    expect(controller.getSnapshot().history.completedToday).toBe(1);

    currentTime = new Date(2026, 7, 2, 0, 1);
    expect(controller.getSnapshot().history.completedToday).toBe(0);
  });
});

function createController(
  repository = new MemoryAttemptRepository(),
  options: PracticeControllerOptions = {},
): {
  readonly controller: PracticeController;
  readonly mock: MockMidiInputPort;
  readonly web: MockMidiInputPort;
  readonly repository: MemoryAttemptRepository;
  readonly view: RecordingView;
} {
  const mock = new MockMidiInputPort();
  const web = new MockMidiInputPort();
  const view = new RecordingView();
  const ports: Record<AttemptInputKind, MidiInputPort> = { mock, "web-midi": web, "native-midi": new MockMidiInputPort() };
  const now = new Date(2026, 7, 1, 12, 0);
  const controller = new PracticeController(fiveNoteAscentExercise, ports, repository, view, {
    now: () => now,
    monotonicNow: () => 0,
    createAttemptId: () => "attempt-fixed",
    ...options,
  });
  return { controller, mock, web, repository, view };
}

function deferred<T>(): { readonly promise: Promise<T>; resolve(value: T): void } {
  let resolvePromise: (value: T) => void = () => {
    throw new Error("Deferred promise was not initialized");
  };
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}
