import { describe, expect, it } from "vitest";
import type { PracticePulseState, PracticePulseStatus } from "../audio/practice-pulse-port.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { steadyQuarterRightHandExercise } from "../exercises/library/steady-quarter-exercises.js";
import { createEvaluationState, evaluateMidiEvent } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";
import type { MidiConnectionState } from "../midi/types.js";
import { createPracticePageView, type PracticePageElements } from "./practice-page-view.js";
import type { PracticeSnapshot } from "./practice-controller.js";

class FakeElement {
  public hidden = true;
  public readonly attributes = new Map<string, string>();
  public textContentWrites = 0;
  private currentTextContent: string | null = "";

  public get textContent(): string | null {
    return this.currentTextContent;
  }

  public set textContent(value: string | null) {
    this.textContentWrites += 1;
    this.currentTextContent = value;
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class FakeControl extends FakeElement {
  public disabled = false;
}

class FakeSelect extends FakeControl {
  public value = "";
  public innerHTML = "";
}

class FakeKey extends FakeControl {
  public readonly dataset: Record<string, string | undefined> = {};
}

type FakePracticePageElements = PracticePageElements & {
  readonly connectionStatus: FakeElement;
  readonly feedbackMessage: FakeElement;
  readonly persistenceMessage: FakeElement;
  readonly historyDetail: FakeElement;
};

describe("createPracticePageView", () => {
  it("renders ready mock input, canonical progress, and empty history", () => {
    const { elements, keys, staffNotes } = createElements();
    const view = createPracticePageView(elements);

    view.render(snapshot());

    expect(elements.enhancements.every((element) => !element.hidden)).toBe(true);
    expect(elements.javascriptStatus.hidden).toBe(true);
    expect(elements.midiInput.value).toBe("mock-midi-input");
    expect(elements.connectButton.disabled).toBe(false);
    expect(elements.connectionStatus.textContent).toBe("Choose an input and connect.");
    expect(elements.connectionStatus.getAttribute("data-status")).toBe("idle");
    expect(elements.practiceStage.getAttribute("data-session-status")).toBe("ready");
    expect(elements.practiceStage.getAttribute("data-pulse-status")).toBe("untimed");
    expect(elements.feedbackMessage.getAttribute("data-session-status")).toBe("ready");
    expect(elements.pulseControls.hidden).toBe(true);
    expect(elements.pulseTempo.disabled).toBe(true);
    expect(elements.startPulseButton.disabled).toBe(true);
    expect(elements.stopPulseButton.disabled).toBe(true);
    expect(elements.pulseBeats.every((beat) => beat.getAttribute("data-beat-state") === "idle")).toBe(true);
    expect(elements.nextExerciseLink.hidden).toBe(true);
    expect(elements.nextNote.textContent).toBe("C4");
    expect(elements.progressText.textContent).toBe("0 of 5 notes");
    expect(elements.historyCount.textContent).toBe("0 attempts completed today");
    expect(keys[0]?.dataset.noteState).toBe("expected");
    expect(keys[0]?.disabled).toBe(true);
    expect(staffNotes[0]?.getAttribute("data-note-state")).toBe("expected");
    expect(staffNotes.slice(1).every((note) => note.getAttribute("data-note-state") === "remaining")).toBe(true);
  });

  it("keeps text and keyboard enhancement working when no staff guide was rendered", () => {
    const { elements, keys } = createElements();
    const view = createPracticePageView({ ...elements, staffNotes: [] });

    expect(() => view.render(snapshot())).not.toThrow();
    expect(elements.nextNote.textContent).toBe("C4");
    expect(keys[0]?.dataset.noteState).toBe("expected");
  });

  it("maps shuffled staff markers by event ID and does not advance them for a wrong note", () => {
    const { elements, staffNotes } = createElements();
    const evaluation = createEvaluationState(fiveNoteAscentExercise);
    const wrongNote = evaluateMidiEvent(fiveNoteAscentExercise, evaluation, {
      type: "note-on",
      channel: 1,
      noteNumber: 61,
      velocity: 72,
      timestamp: 1,
    });

    createPracticePageView({ ...elements, staffNotes: [...elements.staffNotes].reverse() }).render(
      snapshot({ evaluation: wrongNote.state, feedback: wrongNote.feedback }),
    );

    expect(staffNotes[0]?.getAttribute("data-note-state")).toBe("expected");
    expect(staffNotes.slice(1).every((note) => note.getAttribute("data-note-state") === "remaining")).toBe(true);
  });

  it("keeps a stopped timed study gated until an input is connected and the pulse starts", () => {
    const { elements, keys } = createElements(steadyQuarterRightHandExercise);
    const view = createPracticePageView(elements);

    view.render(timedSnapshot());

    expect(elements.pulseControls.hidden).toBe(false);
    expect(elements.pulseTempo.value).toBe("60");
    expect(elements.pulseTempo.disabled).toBe(false);
    expect(elements.startPulseButton.disabled).toBe(true);
    expect(elements.stopPulseButton.disabled).toBe(true);
    expect(elements.pulseStatus.textContent).toBe("Ready at 60 BPM. Start the 4-beat count-in when you are settled.");
    expect(elements.practiceStage.getAttribute("data-pulse-status")).toBe("stopped");
    expect(keys.every((key) => key.disabled)).toBe(true);

    view.render(timedSnapshot({ connection: connection("connected", "mock-midi-input") }));

    expect(elements.startPulseButton.disabled).toBe(false);
    expect(keys.every((key) => key.disabled)).toBe(true);
    expect(elements.keyboardHelp.textContent).toContain("Start the count-in");
  });

  it("projects count-in and running beats without adding per-beat ARIA announcements", () => {
    const { elements, keys } = createElements(steadyQuarterRightHandExercise);
    const view = createPracticePageView(elements);
    const connected = connection("connected", "mock-midi-input");

    view.render(
      timedSnapshot({
        connection: connected,
        pulse: pulse("starting"),
      }),
    );
    expect(elements.pulseStatus.textContent).toBe("The 4-beat count-in is starting.");
    expect(elements.startPulseButton.disabled).toBe(true);
    expect(elements.stopPulseButton.disabled).toBe(false);
    expect(elements.keyboardHelp.textContent).toContain("pulse is starting");
    expect(elements.pulseBeats.every((beat) => beat.getAttribute("data-beat-state") === "idle")).toBe(true);

    view.render(
      timedSnapshot({
        connection: connected,
        pulse: pulse("counting-in", { countInBeat: 2 }),
      }),
    );

    const countInFeedback = elements.feedbackMessage.textContent;
    expect(elements.pulseStatus.textContent).toBe("Count-in 2 of 4.");
    expect(elements.pulseTempo.disabled).toBe(true);
    expect(elements.startPulseButton.disabled).toBe(true);
    expect(elements.stopPulseButton.disabled).toBe(false);
    expect(elements.pulseBeats[1]?.getAttribute("data-beat-state")).toBe("active");
    expect(elements.pulseBeats.every((beat) => beat.getAttribute("aria-label") === null)).toBe(true);
    expect(keys.every((key) => key.disabled)).toBe(true);
    const liveRegionWriteCounts = {
      connection: elements.connectionStatus.textContentWrites,
      feedback: elements.feedbackMessage.textContentWrites,
      persistence: elements.persistenceMessage.textContentWrites,
      history: elements.historyDetail.textContentWrites,
    };

    view.render(
      timedSnapshot({
        connection: connected,
        pulse: pulse("counting-in", { countInBeat: 3 }),
      }),
    );
    expect(elements.feedbackMessage.textContent).toBe(countInFeedback);
    expect(elements.pulseBeats[2]?.getAttribute("data-beat-state")).toBe("active");
    expect({
      connection: elements.connectionStatus.textContentWrites,
      feedback: elements.feedbackMessage.textContentWrites,
      persistence: elements.persistenceMessage.textContentWrites,
      history: elements.historyDetail.textContentWrites,
    }).toEqual(liveRegionWriteCounts);

    view.render(
      timedSnapshot({
        connection: connected,
        pulse: pulse("running", { currentBeat: 3 }),
      }),
    );

    expect(elements.practiceStage.getAttribute("data-pulse-status")).toBe("running");
    expect(elements.pulseStatus.textContent).toBe("Pulse running at 60 BPM. Keep the notes even and unhurried.");
    expect(elements.pulseBeats[2]?.getAttribute("data-beat-state")).toBe("active");
    expect(keys.every((key) => !key.disabled)).toBe(true);
  });

  it("surfaces pulse errors calmly and permits a connected ready study to retry", () => {
    const { elements, keys } = createElements(steadyQuarterRightHandExercise);

    createPracticePageView(elements).render(
      timedSnapshot({
        connection: connection("connected", "mock-midi-input"),
        pulse: pulse("error", { errorMessage: "Audio playback is still suspended." }),
      }),
    );

    expect(elements.practiceStage.getAttribute("data-pulse-status")).toBe("error");
    expect(elements.pulseStatus.textContent).toBe("Audio playback is still suspended.");
    expect(elements.feedbackMessage.textContent).toBe("Audio playback is still suspended. Your note progress is unchanged.");
    expect(elements.pulseTempo.disabled).toBe(false);
    expect(elements.startPulseButton.disabled).toBe(false);
    expect(elements.stopPulseButton.disabled).toBe(true);
    expect(keys.every((key) => key.disabled)).toBe(true);

    createPracticePageView(elements).render(
      timedSnapshot({
        connection: connection("connected", "mock-midi-input"),
        sessionStatus: "interrupted",
        pulse: pulse("error", { errorMessage: "The click stopped unexpectedly." }),
      }),
    );
    expect(elements.feedbackMessage.textContent).toContain("The click stopped unexpectedly.");
    expect(elements.pulseTempo.disabled).toBe(true);
    expect(elements.startPulseButton.disabled).toBe(true);
  });

  it("includes MIDI-relative timing in feedback, completion, and recent history", () => {
    const { elements } = createElements(steadyQuarterRightHandExercise);
    const view = createPracticePageView(elements);
    const connected = connection("connected", "mock-midi-input");
    const initial = createEvaluationState(steadyQuarterRightHandExercise, 60);
    const firstTransition = evaluateMidiEvent(steadyQuarterRightHandExercise, initial, {
      type: "note-on",
      channel: 1,
      noteNumber: 60,
      velocity: 72,
      timestamp: 1_000,
    });

    view.render(
      timedSnapshot({
        connection: connected,
        sessionStatus: "in-progress",
        pulse: pulse("running", { currentBeat: 1 }),
        evaluation: firstTransition.state,
        feedback: firstTransition.feedback,
      }),
    );
    expect(elements.feedbackMessage.textContent).toBe("Correct: C4. Pulse timing starts here. D4 is next.");

    let evaluation = firstTransition.state;
    for (const [index, event] of steadyQuarterRightHandExercise.expectedEvents.slice(1).entries()) {
      evaluation = evaluateMidiEvent(steadyQuarterRightHandExercise, evaluation, {
        type: "note-on",
        channel: 1,
        noteNumber: event.noteNumber,
        velocity: 72,
        timestamp: 2_000 + index * 1_000,
      }).state;
    }

    view.render(
      timedSnapshot({
        connection: connected,
        sessionStatus: "completed",
        evaluation,
        history: {
          completedToday: 1,
          totalCompleted: 1,
          mostRecent: {
            schemaVersion: 1,
            id: "timed-attempt",
            exerciseId: steadyQuarterRightHandExercise.id,
            exerciseRevision: steadyQuarterRightHandExercise.revision,
            startedAt: "2026-08-01T08:00:00.000Z",
            completedAt: "2026-08-01T08:01:00.000Z",
            inputKind: "mock",
            status: "completed",
            errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
            timing: {
              tempoBpm: 60,
              assessedIntervals: 4,
              onPulse: 4,
              early: 0,
              late: 0,
              meanAbsoluteErrorMs: 0,
            },
          },
        },
      }),
    );

    expect(elements.feedbackMessage.textContent).toBe("The sequence was correct. All 4 intervals stayed on the pulse at 60 BPM.");
    expect(elements.pulseStatus.textContent).toBe("Pulse stopped. Study complete at 60 BPM.");
    expect(elements.historyDetail.textContent).toContain("At 60 BPM, 4 of 4 intervals stayed on the pulse.");
    expect(elements.nextExerciseLink.hidden).toBe(false);
  });

  it("enables on-screen keys and advances calm feedback after a correct note", () => {
    const { elements, keys, staffNotes } = createElements();
    const initial = createEvaluationState(fiveNoteAscentExercise);
    const transition = evaluateMidiEvent(fiveNoteAscentExercise, initial, {
      type: "note-on",
      channel: 1,
      noteNumber: 60,
      velocity: 72,
      timestamp: 1,
    });
    const view = createPracticePageView(elements);

    view.render(
      snapshot({
        connection: connection("connected", "mock-midi-input"),
        sessionStatus: "in-progress",
        evaluation: transition.state,
        feedback: transition.feedback,
        activeNoteNumbers: [60],
      }),
    );

    expect(elements.connectionStatus.textContent).toContain("Connected to Practice keys");
    expect(elements.connectionStatus.getAttribute("data-status")).toBe("connected");
    expect(elements.practiceStage.getAttribute("data-session-status")).toBe("in-progress");
    expect(elements.feedbackMessage.getAttribute("data-session-status")).toBe("in-progress");
    expect(elements.nextNote.textContent).toBe("D4");
    expect(elements.feedbackMessage.textContent).toBe("Correct: C4. D4 is next.");
    expect(keys[0]?.dataset.noteState).toBe("accepted");
    expect(keys[0]?.attributes.get("aria-pressed")).toBe("true");
    expect(keys.every((key) => !key.disabled)).toBe(true);
    expect(staffNotes[0]?.getAttribute("data-note-state")).toBe("accepted");
    expect(staffNotes[0]?.getAttribute("data-note-active")).toBe("true");
    expect(staffNotes[1]?.getAttribute("data-note-state")).toBe("expected");
  });

  it("keeps the staff pitch guide aligned through completion and restart", () => {
    const { elements, staffNotes } = createElements();
    const view = createPracticePageView(elements);
    let evaluation = createEvaluationState(fiveNoteAscentExercise);

    for (const [index, event] of fiveNoteAscentExercise.expectedEvents.entries()) {
      evaluation = evaluateMidiEvent(fiveNoteAscentExercise, evaluation, {
        type: "note-on",
        channel: 1,
        noteNumber: event.noteNumber,
        velocity: 72,
        timestamp: index,
      }).state;
    }

    view.render(snapshot({ sessionStatus: "completed", evaluation }));
    expect(staffNotes.every((note) => note.getAttribute("data-note-state") === "accepted")).toBe(true);

    view.render(snapshot());
    expect(staffNotes[0]?.getAttribute("data-note-state")).toBe("expected");
    expect(staffNotes.slice(1).every((note) => note.getAttribute("data-note-state") === "remaining")).toBe(true);
    expect(staffNotes.every((note) => note.getAttribute("data-note-active") === "false")).toBe(true);
  });

  it("asks for only a restart when a connected learner stops an active study", () => {
    const { elements } = createElements(steadyQuarterRightHandExercise);

    createPracticePageView(elements).render(
      timedSnapshot({
        connection: connection("connected", "mock-midi-input"),
        sessionStatus: "interrupted",
        pulse: pulse("stopped"),
      }),
    );

    expect(elements.feedbackMessage.textContent).toBe("This attempt was interrupted. Restart from C4.");
    expect(elements.keyboardHelp.textContent).toBe("Restart before playing this study again.");
    expect(elements.pulseStatus.textContent).toBe("Pulse stopped. Restart the study to try again at 60 BPM.");
  });

  it("renders interruption, unsupported input, completion, and unavailable history states", () => {
    const { elements } = createElements();
    const view = createPracticePageView(elements);
    let evaluation = createEvaluationState(fiveNoteAscentExercise);
    for (const [index, event] of fiveNoteAscentExercise.expectedEvents.entries()) {
      evaluation = evaluateMidiEvent(fiveNoteAscentExercise, evaluation, {
        type: "note-on",
        channel: 1,
        noteNumber: event.noteNumber,
        velocity: 72,
        timestamp: index,
      }).state;
    }

    view.render(
      snapshot({
        inputKind: "web-midi",
        connection: connection("unsupported"),
        sessionStatus: "interrupted",
        historyStatus: "unavailable",
        persistenceMessage: "Not saved",
      }),
    );
    expect(elements.connectionStatus.textContent).toContain("Web MIDI is unavailable");
    expect(elements.nextNote.textContent).toBe("Restart required");
    expect(elements.feedbackMessage.textContent).toContain("interrupted");
    expect(elements.practiceStage.getAttribute("data-session-status")).toBe("interrupted");
    expect(elements.feedbackMessage.getAttribute("data-session-status")).toBe("interrupted");
    expect(elements.nextExerciseLink.hidden).toBe(true);
    expect(elements.historyCount.textContent).toBe("History unavailable");
    expect(elements.persistenceMessage.hidden).toBe(false);

    view.render(snapshot({ inputKind: "native-midi", connection: connection("unsupported") }));
    expect(elements.connectionStatus.textContent).toContain("iPad MIDI bridge is unavailable");

    view.render(
      snapshot({
        exercise: { ...fiveNoteAscentExercise, expectedEvents: [...fiveNoteAscentExercise.expectedEvents].reverse() },
        sessionStatus: "interrupted",
      }),
    );
    expect(elements.feedbackMessage.textContent).toBe("This attempt was interrupted. Reconnect the input, then restart from G4.");

    view.render(snapshot({ sessionStatus: "completed", evaluation }));
    expect(elements.nextNote.textContent).toBe("Complete");
    expect(elements.feedbackMessage.textContent).toBe("The sequence was correct.");
    expect(elements.practiceStage.getAttribute("data-session-status")).toBe("completed");
    expect(elements.feedbackMessage.getAttribute("data-session-status")).toBe("completed");
    expect(elements.nextExerciseLink.hidden).toBe(false);
  });

  it("escapes input labels and reports recent history with singular grammar", () => {
    const { elements } = createElements();
    createPracticePageView(elements).render(
      snapshot({
        inputs: [{ id: 'unsafe"', label: "<Keyboard & Co>" }],
        history: {
          completedToday: 1,
          totalCompleted: 1,
          mostRecent: {
            schemaVersion: 1,
            id: "attempt",
            exerciseId: fiveNoteAscentExercise.id,
            exerciseRevision: 1,
            startedAt: "2026-08-01T08:00:00.000Z",
            completedAt: "2026-08-01T08:01:00.000Z",
            inputKind: "mock",
            status: "completed",
            errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
          },
        },
      }),
    );

    expect(elements.midiInput.innerHTML).toContain("&lt;Keyboard &amp; Co&gt;");
    expect(elements.midiInput.innerHTML).toContain('value="unsafe&quot;"');
    expect(elements.historyCount.textContent).toBe("1 attempt completed today");
    expect(elements.historyDetail.textContent).toContain("1 total for this exercise");
  });

  it("does not silently substitute another input when the selected device disappears", () => {
    const { elements } = createElements();
    elements.midiInput.value = "keyboard-a";

    createPracticePageView(elements).render(
      snapshot({
        inputKind: "web-midi",
        inputs: [{ id: "keyboard-b", label: "Keyboard B" }],
        connection: connection("disconnected", "keyboard-a"),
      }),
    );

    expect(elements.midiInput.value).toBe("");
    expect(elements.connectButton.disabled).toBe(true);
    expect(elements.connectionStatus.textContent).toContain("disconnected");
  });
});

function createElements(exercise: Exercise = fiveNoteAscentExercise): {
  readonly elements: FakePracticePageElements;
  readonly keys: FakeKey[];
  readonly staffNotes: FakeElement[];
} {
  const enhancements = [new FakeElement(), new FakeElement()];
  const keys = exercise.expectedEvents.map(() => new FakeKey());
  const staffNotes = exercise.expectedEvents.map(() => new FakeElement());
  return {
    keys,
    staffNotes,
    elements: {
      enhancements,
      javascriptStatus: new FakeElement(),
      inputKind: new FakeSelect(),
      midiInput: new FakeSelect(),
      connectButton: new FakeControl(),
      refreshButton: new FakeControl(),
      disconnectButton: new FakeControl(),
      restartButton: new FakeControl(),
      practiceStage: new FakeElement(),
      pulseControls: new FakeElement(),
      pulseStatus: new FakeElement(),
      pulseTempo: new FakeSelect(),
      startPulseButton: new FakeControl(),
      stopPulseButton: new FakeControl(),
      pulseBeats: [new FakeElement(), new FakeElement(), new FakeElement(), new FakeElement()],
      connectionStatus: new FakeElement(),
      nextNote: new FakeElement(),
      progressText: new FakeElement(),
      feedbackMessage: new FakeElement(),
      persistenceMessage: new FakeElement(),
      historyCount: new FakeElement(),
      historyDetail: new FakeElement(),
      keyboardHelp: new FakeElement(),
      nextExerciseLink: new FakeElement(),
      keys: exercise.expectedEvents.map((event, index) => ({
        eventId: event.id,
        noteNumber: event.noteNumber,
        element: keys[index]!,
      })),
      staffNotes: exercise.expectedEvents.map((event, index) => ({
        eventId: event.id,
        element: staffNotes[index]!,
      })),
    },
  };
}

function timedSnapshot(overrides: Partial<PracticeSnapshot> = {}): PracticeSnapshot {
  return snapshot({
    exercise: steadyQuarterRightHandExercise,
    tempoBpm: 60,
    pulse: pulse("stopped"),
    evaluation: createEvaluationState(steadyQuarterRightHandExercise, 60),
    ...overrides,
  });
}

function pulse(status: PracticePulseStatus, overrides: Partial<PracticePulseState> = {}): PracticePulseState {
  return {
    status,
    tempoBpm: 60,
    currentBeat: null,
    countInBeat: null,
    errorMessage: null,
    ...overrides,
  };
}

function snapshot(overrides: Partial<PracticeSnapshot> = {}): PracticeSnapshot {
  return {
    exercise: fiveNoteAscentExercise,
    inputKind: "mock",
    inputs: [{ id: "mock-midi-input", label: "Practice keys" }],
    connection: connection("idle"),
    sessionStatus: "ready",
    tempoBpm: null,
    pulse: null,
    evaluation: createEvaluationState(fiveNoteAscentExercise),
    feedback: null,
    activeNoteNumbers: [],
    historyStatus: "ready",
    history: { completedToday: 0, totalCompleted: 0, mostRecent: null },
    persistenceMessage: null,
    ...overrides,
  };
}

function connection(status: MidiConnectionState["status"], selectedInputId: string | null = null): MidiConnectionState {
  return { status, selectedInputId, errorMessage: null };
}
