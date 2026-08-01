import type { Exercise } from "../exercises/types.js";
import { WebAudioPracticePulse } from "../audio/web-audio-practice-pulse.js";
import { exerciseLibrary } from "../exercises/library/index.js";
import { MockMidiInputPort } from "../midi/mock-midi-input-port.js";
import { createNativeMidiBridgeFromHost, NativeMidiInputPort } from "../midi/native-midi-input-port.js";
import { WebMidiInputPort } from "../midi/web-midi-input-port.js";
import { projectPracticeKeyboardNotes } from "../views/exercise-presentation.js";
import { collectHomePageElements, createHomePageView } from "./home-page-view.js";
import type { AttemptInputKind, AttemptRepository } from "./persistence/attempt-repository.js";
import { LocalStorageAttemptRepository } from "./persistence/local-storage-attempt-repository.js";
import { loadPracticeOverview } from "./persistence/practice-overview.js";
import { PracticeController } from "./practice-controller.js";
import { initializePracticeCueMode } from "./practice-cue-mode.js";
import { resolveRenderedExercise } from "./practice-exercise-resolver.js";
import { handlePracticePageHide } from "./practice-page-lifecycle.js";
import {
  createPracticePageView,
  type PracticeKeyElement,
  type PracticePageElements,
  type PracticeStaffNoteElement,
} from "./practice-page-view.js";

export async function bootstrapHomePage(pageDocument: Document, browserWindow: Window): Promise<void> {
  const view = createHomePageView(collectHomePageElements(pageDocument));
  view.renderLoading();

  try {
    const overview = await loadPracticeOverview(createBrowserAttemptRepository(browserWindow), exerciseLibrary);
    view.renderReady(overview);
  } catch {
    view.renderUnavailable();
  }
}

export async function bootstrapPracticePage(pageDocument: Document, browserWindow: Window): Promise<PracticeController> {
  const root = requireElement(pageDocument, "practice-main", HTMLElement);
  const exercise = resolveRenderedExercise(root.dataset.exerciseId, root.dataset.exerciseRevision);
  if (exercise === null) {
    throw new Error("The rendered exercise does not match the canonical client exercise");
  }

  const elements = collectPageElements(pageDocument, exercise);
  const cueMode = initializePracticeCueMode(
    root,
    elements.readingFocusToggle,
    elements.staffNotes.length === exercise.expectedEvents.length,
  );
  const mockPort = new MockMidiInputPort();
  const nativePort = new NativeMidiInputPort({ bridge: createNativeMidiBridgeFromHost(browserWindow) });
  const pageView = createPracticePageView(elements, cueMode.getMode);
  const controller = new PracticeController(
    exercise,
    { mock: mockPort, "web-midi": new WebMidiInputPort(), "native-midi": nativePort },
    createBrowserAttemptRepository(browserWindow),
    pageView,
    { createPulse: (config) => new WebAudioPracticePulse(config), exerciseLibrary },
  );
  cueMode.subscribe(() => pageView.render(controller.getSnapshot()));

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
  elements.pulseTempo.addEventListener("change", () => {
    try {
      controller.setTempo(Number(elements.pulseTempo.value));
    } catch {
      elements.feedbackMessage.textContent = "Restart the study before changing its tempo.";
    }
  });
  elements.startPulseButton.addEventListener("click", () => {
    runAction(controller.startPulse(), elements.feedbackMessage);
  });
  elements.stopPulseButton.addEventListener("click", () => controller.stopPulse());

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
  readonly pulseTempo: HTMLSelectElement;
  readonly startPulseButton: HTMLButtonElement;
  readonly stopPulseButton: HTMLButtonElement;
  readonly feedbackMessage: HTMLElement;
  readonly readingFocusToggle: HTMLButtonElement;
  readonly keys: readonly (PracticeKeyElement & { readonly element: HTMLButtonElement })[];
  readonly staffNotes: readonly PracticeStaffNoteElement[];
} {
  const keys = projectPracticeKeyboardNotes(exercise).map((noteNumber) => ({
    noteNumber,
    element: requireElement(pageDocument, `practice-key-${noteNumber}`, HTMLButtonElement),
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
    pulseControls: requireElement(pageDocument, "pulse-controls", HTMLElement),
    pulseStatus: requireElement(pageDocument, "pulse-status", HTMLElement),
    pulseTempo: requireElement(pageDocument, "pulse-tempo", HTMLSelectElement),
    startPulseButton: requireElement(pageDocument, "start-pulse", HTMLButtonElement),
    stopPulseButton: requireElement(pageDocument, "stop-pulse", HTMLButtonElement),
    pulseBeats: [...pageDocument.querySelectorAll<HTMLElement>("[data-pulse-beat]")],
    connectionStatus: requireElement(pageDocument, "connection-status", HTMLElement),
    nextNote: requireElement(pageDocument, "next-note", HTMLElement),
    readingFocusNextNote: requireElement(pageDocument, "reading-focus-next-note", HTMLElement),
    progressText: requireElement(pageDocument, "progress-text", HTMLElement),
    feedbackMessage: requireElement(pageDocument, "feedback-message", HTMLElement),
    readingFocusToggle: requireElement(pageDocument, "reading-focus-toggle", HTMLButtonElement),
    persistenceMessage: requireElement(pageDocument, "persistence-message", HTMLElement),
    historyCount: requireElement(pageDocument, "history-count", HTMLElement),
    historyDetail: requireElement(pageDocument, "history-detail", HTMLElement),
    keyboardHelp: requireElement(pageDocument, "keyboard-help", HTMLElement),
    nextStudyRecommendation: requireElement(pageDocument, "next-study-recommendation", HTMLElement),
    nextStudyKicker: requireElement(pageDocument, "next-study-kicker", HTMLElement),
    nextStudyTitle: requireElement(pageDocument, "next-study-title", HTMLElement),
    nextStudyReason: requireElement(pageDocument, "next-study-reason", HTMLElement),
    nextExerciseLink: requireElement(pageDocument, "next-exercise", HTMLAnchorElement),
    nextExerciseLabel: requireElement(pageDocument, "next-exercise-label", HTMLElement),
    keys,
    staffNotes: collectStaffNotes(pageDocument, exercise),
  };
}

function collectStaffNotes(pageDocument: Document, exercise: Exercise): readonly PracticeStaffNoteElement[] {
  const practiceRoot = pageDocument.querySelector("[data-practice-root]");
  const guide = practiceRoot?.querySelector("[data-staff-pitch-guide]") ?? null;
  if (guide === null) {
    return [];
  }

  const svgNamespace = "http://www.w3.org/2000/svg";
  if (guide.namespaceURI !== svgNamespace) {
    guide.setAttribute("hidden", "");
    return [];
  }

  const markersByEventId = new Map<string, Element>();
  for (const marker of guide.querySelectorAll("[data-staff-note]")) {
    const eventId = marker.getAttribute("data-event-id");
    if (marker.namespaceURI !== svgNamespace || eventId === null || markersByEventId.has(eventId)) {
      guide.setAttribute("hidden", "");
      return [];
    }
    markersByEventId.set(eventId, marker);
  }

  if (markersByEventId.size !== exercise.expectedEvents.length) {
    guide.setAttribute("hidden", "");
    return [];
  }

  const staffNotes: PracticeStaffNoteElement[] = [];
  for (const event of exercise.expectedEvents) {
    const element = markersByEventId.get(event.id);
    if (element === undefined) {
      guide.setAttribute("hidden", "");
      return [];
    }
    staffNotes.push({ eventId: event.id, element });
  }
  return staffNotes;
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

async function bootstrapRenderedPage(pageDocument: Document, browserWindow: Window): Promise<void> {
  if (pageDocument.querySelector("[data-home-root]") !== null) {
    await bootstrapHomePage(pageDocument, browserWindow);
    return;
  }

  if (pageDocument.querySelector("[data-practice-root]") !== null) {
    await bootstrapPracticePage(pageDocument, browserWindow);
  }
}

void bootstrapRenderedPage(document, window).catch(() => {
  const homeStatus = document.getElementById("home-overview-status");
  if (homeStatus !== null) {
    homeStatus.textContent = "Local practice record unavailable. The exercise library still works.";
  }
  const feedback = document.getElementById("feedback-message");
  if (feedback !== null) {
    feedback.textContent = "Live practice could not start. The exercise instructions are still available.";
  }
});
