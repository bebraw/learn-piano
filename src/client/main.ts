import type { Exercise } from "../exercises/types.js";
import { MockMidiInputPort } from "../midi/mock-midi-input-port.js";
import { createNativeMidiBridgeFromHost, NativeMidiInputPort } from "../midi/native-midi-input-port.js";
import { WebMidiInputPort } from "../midi/web-midi-input-port.js";
import type { AttemptInputKind, AttemptRepository } from "./persistence/attempt-repository.js";
import { LocalStorageAttemptRepository } from "./persistence/local-storage-attempt-repository.js";
import { PracticeController } from "./practice-controller.js";
import { resolveRenderedExercise } from "./practice-exercise-resolver.js";
import { handlePracticePageHide } from "./practice-page-lifecycle.js";
import { createPracticePageView, type PracticeKeyElement, type PracticePageElements } from "./practice-page-view.js";

export async function bootstrapPracticePage(pageDocument: Document, browserWindow: Window): Promise<PracticeController> {
  const root = requireElement(pageDocument, "practice-main", HTMLElement);
  const exercise = resolveRenderedExercise(root.dataset.exerciseId, root.dataset.exerciseRevision);
  if (exercise === null) {
    throw new Error("The rendered exercise does not match the canonical client exercise");
  }

  const elements = collectPageElements(pageDocument, exercise);
  const mockPort = new MockMidiInputPort();
  const nativePort = new NativeMidiInputPort({ bridge: createNativeMidiBridgeFromHost(browserWindow) });
  const controller = new PracticeController(
    exercise,
    { mock: mockPort, "web-midi": new WebMidiInputPort(), "native-midi": nativePort },
    createBrowserAttemptRepository(browserWindow),
    createPracticePageView(elements),
  );

  if (nativePort.capability === "supported") {
    elements.nativeInputOption.hidden = false;
    elements.nativeInputOption.disabled = false;
    elements.pairBluetoothButton.hidden = false;
  }

  elements.inputKind.addEventListener("change", () => {
    const kind = parseInputKind(elements.inputKind.value);
    if (kind !== null) {
      runAction(controller.selectInputKind(kind), elements.feedbackMessage);
    }
  });
  elements.midiInput.addEventListener("change", () => {
    const snapshot = controller.getSnapshot();
    elements.connectButton.disabled =
      elements.midiInput.value === "" ||
      (snapshot.connection.status === "connected" && elements.midiInput.value === snapshot.connection.selectedInputId);
  });
  elements.refreshButton.addEventListener("click", () => {
    runAction(controller.refreshInputs(), elements.feedbackMessage);
  });
  elements.connectButton.addEventListener("click", () => {
    if (elements.midiInput.value !== "") {
      runAction(controller.connect(elements.midiInput.value), elements.feedbackMessage);
    }
  });
  elements.disconnectButton.addEventListener("click", () => controller.disconnect());
  elements.pairBluetoothButton.addEventListener("click", () => {
    runAction(
      nativePort.openBluetoothSettings().then(async (opened) => {
        if (opened) {
          await controller.refreshInputs();
        }
      }),
      elements.feedbackMessage,
    );
  });
  elements.restartButton.addEventListener("click", () => controller.restart());

  for (const key of elements.keys) {
    key.element.addEventListener("click", () => {
      const snapshot = controller.getSnapshot();
      if (snapshot.inputKind === "mock" && snapshot.connection.status === "connected") {
        mockPort.tapNote(key.noteNumber);
      }
    });
  }

  browserWindow.addEventListener("pagehide", (event) => handlePracticePageHide(controller, event));
  await controller.initialize();
  if (nativePort.capability === "supported") {
    await controller.selectInputKind("native-midi");
  }
  return controller;
}

function collectPageElements(
  pageDocument: Document,
  exercise: Exercise,
): PracticePageElements & {
  readonly inputKind: HTMLSelectElement;
  readonly midiInput: HTMLSelectElement;
  readonly connectButton: HTMLButtonElement;
  readonly refreshButton: HTMLButtonElement;
  readonly disconnectButton: HTMLButtonElement;
  readonly nativeInputOption: HTMLOptionElement;
  readonly pairBluetoothButton: HTMLButtonElement;
  readonly restartButton: HTMLButtonElement;
  readonly feedbackMessage: HTMLElement;
  readonly keys: readonly (PracticeKeyElement & { readonly element: HTMLButtonElement })[];
} {
  const keys = exercise.expectedEvents.map((event) => ({
    eventId: event.id,
    noteNumber: event.noteNumber,
    element: requireElement(pageDocument, `practice-key-${event.id}`, HTMLButtonElement),
  }));

  return {
    enhancements: [...pageDocument.querySelectorAll<HTMLElement>("[data-enhancement]")],
    javascriptStatus: requireElement(pageDocument, "javascript-status", HTMLElement),
    inputKind: requireElement(pageDocument, "input-kind", HTMLSelectElement),
    midiInput: requireElement(pageDocument, "midi-input", HTMLSelectElement),
    connectButton: requireElement(pageDocument, "connect-input", HTMLButtonElement),
    refreshButton: requireElement(pageDocument, "refresh-inputs", HTMLButtonElement),
    disconnectButton: requireElement(pageDocument, "disconnect-input", HTMLButtonElement),
    nativeInputOption: requireElement(pageDocument, "native-midi-input-kind", HTMLOptionElement),
    pairBluetoothButton: requireElement(pageDocument, "pair-bluetooth-midi", HTMLButtonElement),
    restartButton: requireElement(pageDocument, "restart-exercise", HTMLButtonElement),
    practiceStage: requireElement(pageDocument, "practice-stage", HTMLElement),
    connectionStatus: requireElement(pageDocument, "connection-status", HTMLElement),
    nextNote: requireElement(pageDocument, "next-note", HTMLElement),
    progressText: requireElement(pageDocument, "progress-text", HTMLElement),
    feedbackMessage: requireElement(pageDocument, "feedback-message", HTMLElement),
    persistenceMessage: requireElement(pageDocument, "persistence-message", HTMLElement),
    historyCount: requireElement(pageDocument, "history-count", HTMLElement),
    historyDetail: requireElement(pageDocument, "history-detail", HTMLElement),
    keyboardHelp: requireElement(pageDocument, "keyboard-help", HTMLElement),
    nextExerciseLink: requireElement(pageDocument, "next-exercise", HTMLAnchorElement),
    keys,
  };
}

function requireElement<T extends HTMLElement>(pageDocument: Document, id: string, elementType: { new (): T }): T {
  const element = pageDocument.getElementById(id);
  if (!(element instanceof elementType)) {
    throw new Error(`Practice page is missing #${id}`);
  }
  return element;
}

function createBrowserAttemptRepository(browserWindow: Window): AttemptRepository {
  try {
    return new LocalStorageAttemptRepository(browserWindow.localStorage);
  } catch (error: unknown) {
    const storageError = error instanceof Error ? error : new Error("Browser storage is unavailable");
    return {
      async list(): Promise<never> {
        throw storageError;
      },
      async save(): Promise<never> {
        throw storageError;
      },
    };
  }
}

function parseInputKind(value: string): AttemptInputKind | null {
  return value === "mock" || value === "web-midi" || value === "native-midi" ? value : null;
}

function runAction(action: Promise<unknown>, feedbackElement: HTMLElement): void {
  void action.catch(() => {
    feedbackElement.textContent = "That input action did not finish. Try it once more.";
  });
}

void bootstrapPracticePage(document, window).catch(() => {
  const feedback = document.getElementById("feedback-message");
  if (feedback !== null) {
    feedback.textContent = "Live practice could not start. The exercise instructions are still available.";
  }
});
