import { describe, expect, it } from "vitest";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { createEvaluationState, evaluateMidiEvent } from "../exercises/evaluator.js";
import type { MidiConnectionState } from "../midi/types.js";
import { createPracticePageView, type PracticePageElements } from "./practice-page-view.js";
import type { PracticeSnapshot } from "./practice-controller.js";

class FakeElement {
  public hidden = true;
  public textContent: string | null = "";
  public readonly attributes = new Map<string, string>();

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

describe("createPracticePageView", () => {
  it("renders ready mock input, canonical progress, and empty history", () => {
    const { elements, keys } = createElements();
    const view = createPracticePageView(elements);

    view.render(snapshot());

    expect(elements.enhancements.every((element) => !element.hidden)).toBe(true);
    expect(elements.javascriptStatus.hidden).toBe(true);
    expect(elements.midiInput.value).toBe("mock-midi-input");
    expect(elements.connectButton.disabled).toBe(false);
    expect(elements.connectionStatus.textContent).toBe("Choose an input and connect.");
    expect(elements.nextNote.textContent).toBe("C4");
    expect(elements.progressText.textContent).toBe("0 of 5 notes");
    expect(elements.historyCount.textContent).toBe("0 attempts completed today");
    expect(keys[0]?.dataset.noteState).toBe("expected");
    expect(keys[0]?.disabled).toBe(true);
  });

  it("enables on-screen keys and advances calm feedback after a correct note", () => {
    const { elements, keys } = createElements();
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
    expect(elements.nextNote.textContent).toBe("D4");
    expect(elements.feedbackMessage.textContent).toBe("Correct: C4. D4 is next.");
    expect(keys[0]?.dataset.noteState).toBe("accepted");
    expect(keys[0]?.attributes.get("aria-pressed")).toBe("true");
    expect(keys.every((key) => !key.disabled)).toBe(true);
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
    expect(elements.historyCount.textContent).toBe("History unavailable");
    expect(elements.persistenceMessage.hidden).toBe(false);

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

function createElements(): { readonly elements: PracticePageElements; readonly keys: FakeKey[] } {
  const enhancements = [new FakeElement(), new FakeElement()];
  const keys = fiveNoteAscentExercise.expectedEvents.map(() => new FakeKey());
  return {
    keys,
    elements: {
      enhancements,
      javascriptStatus: new FakeElement(),
      inputKind: new FakeSelect(),
      midiInput: new FakeSelect(),
      connectButton: new FakeControl(),
      refreshButton: new FakeControl(),
      disconnectButton: new FakeControl(),
      restartButton: new FakeControl(),
      connectionStatus: new FakeElement(),
      nextNote: new FakeElement(),
      progressText: new FakeElement(),
      feedbackMessage: new FakeElement(),
      persistenceMessage: new FakeElement(),
      historyCount: new FakeElement(),
      historyDetail: new FakeElement(),
      keyboardHelp: new FakeElement(),
      keys: fiveNoteAscentExercise.expectedEvents.map((event, index) => ({
        eventId: event.id,
        noteNumber: event.noteNumber,
        element: keys[index]!,
      })),
    },
  };
}

function snapshot(overrides: Partial<PracticeSnapshot> = {}): PracticeSnapshot {
  return {
    exercise: fiveNoteAscentExercise,
    inputKind: "mock",
    inputs: [{ id: "mock-midi-input", label: "Practice keys" }],
    connection: connection("idle"),
    sessionStatus: "ready",
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
