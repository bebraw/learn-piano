import { describe, expect, it } from "vitest";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
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

  it("keeps musical completion visible when persistence fails", async () => {
    const repository = new MemoryAttemptRepository();
    repository.failSave = true;
    const { controller, mock, view } = createController(repository);
    await controller.initialize();
    await controller.connect(MOCK_MIDI_INPUT_ID);

    for (const event of fiveNoteAscentExercise.expectedEvents) {
      mock.tapNote(event.noteNumber);
    }
    await controller.waitForPersistence();

    expect(view.latest().sessionStatus).toBe("completed");
    expect(view.latest().historyStatus).toBe("unavailable");
    expect(view.latest().persistenceMessage).toContain("history could not be saved");
  });

  it("reports unavailable history without preventing input setup", async () => {
    const repository = new MemoryAttemptRepository();
    repository.failList = true;
    const { controller, view } = createController(repository);

    await controller.initialize();

    expect(view.latest().historyStatus).toBe("unavailable");
    expect(view.latest().inputs).toHaveLength(1);
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
