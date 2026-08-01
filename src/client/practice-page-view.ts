import { formatMidiNote } from "../exercises/evaluator.js";
import type { MidiInputDevice } from "../midi/types.js";
import type { PracticeSnapshot, PracticeView } from "./practice-controller.js";

interface ElementLike {
  hidden: boolean | string;
  textContent: string | null;
  setAttribute(name: string, value: string): void;
}

interface ControlLike extends ElementLike {
  disabled: boolean;
}

interface SelectLike extends ControlLike {
  value: string;
  innerHTML: string;
}

interface KeyLike extends ControlLike {
  readonly dataset: Record<string, string | undefined>;
}

export interface PracticeKeyElement {
  readonly eventId: string;
  readonly noteNumber: number;
  readonly element: KeyLike;
}

export interface PracticePageElements {
  readonly enhancements: readonly ElementLike[];
  readonly javascriptStatus: ElementLike;
  readonly inputKind: SelectLike;
  readonly midiInput: SelectLike;
  readonly connectButton: ControlLike;
  readonly refreshButton: ControlLike;
  readonly disconnectButton: ControlLike;
  readonly restartButton: ControlLike;
  readonly connectionStatus: ElementLike;
  readonly nextNote: ElementLike;
  readonly progressText: ElementLike;
  readonly feedbackMessage: ElementLike;
  readonly persistenceMessage: ElementLike;
  readonly historyCount: ElementLike;
  readonly historyDetail: ElementLike;
  readonly keyboardHelp: ElementLike;
  readonly keys: readonly PracticeKeyElement[];
}

export function createPracticePageView(elements: PracticePageElements): PracticeView {
  return {
    render(snapshot): void {
      for (const element of elements.enhancements) {
        element.hidden = false;
      }
      elements.javascriptStatus.hidden = true;

      elements.inputKind.value = snapshot.inputKind;
      renderInputs(elements.midiInput, snapshot.inputs, snapshot.connection.selectedInputId);
      renderConnection(elements, snapshot);
      renderSession(elements, snapshot);
      renderHistory(elements, snapshot);
    },
  };
}

function renderInputs(select: SelectLike, inputs: readonly MidiInputDevice[], selectedInputId: string | null): void {
  const previousValue = select.value;
  select.innerHTML = [
    '<option value="">Choose an input</option>',
    ...inputs.map((input) => `<option value="${escapeMarkup(input.id)}">${escapeMarkup(input.label)}</option>`),
  ].join("");

  const preferredValue = selectedInputId ?? previousValue;
  if (inputs.some((input) => input.id === preferredValue)) {
    select.value = preferredValue;
  } else if (selectedInputId === null) {
    select.value = inputs[0]?.id ?? "";
  } else {
    select.value = "";
  }
  select.disabled = inputs.length === 0;
}

function renderConnection(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  const connected = snapshot.connection.status === "connected";
  const selectedInput = snapshot.inputs.find((input) => input.id === snapshot.connection.selectedInputId);
  elements.connectionStatus.textContent = connectionMessage(snapshot, selectedInput?.label);
  elements.connectButton.disabled = elements.midiInput.value === "" || connected || snapshot.connection.status === "requesting-permission";
  elements.refreshButton.disabled = snapshot.connection.status === "requesting-permission";
  elements.disconnectButton.disabled = !connected;
}

function connectionMessage(snapshot: PracticeSnapshot, selectedLabel: string | undefined): string {
  switch (snapshot.connection.status) {
    case "unsupported":
      return "Web MIDI is unavailable in this browser. The on-screen practice keys still work.";
    case "idle":
      return snapshot.inputs.length > 0 ? "Choose an input and connect." : "No inputs are available yet.";
    case "requesting-permission":
      return "Waiting for MIDI access…";
    case "connected":
      return `Connected to ${selectedLabel ?? "the selected input"}.`;
    case "disconnected":
      return "The input disconnected. Reconnect it before continuing.";
    case "error":
      return snapshot.connection.errorMessage ?? "The input could not be connected.";
  }
}

function renderSession(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  const nextEvent = snapshot.exercise.expectedEvents[snapshot.evaluation.nextExpectedIndex];
  const mockKeysEnabled = snapshot.inputKind === "mock" && snapshot.connection.status === "connected";
  const activeNotes = new Set(snapshot.activeNoteNumbers);

  for (const [index, event] of snapshot.exercise.expectedEvents.entries()) {
    const key = elements.keys.find((candidate) => candidate.eventId === event.id);
    if (key === undefined) {
      continue;
    }

    const state = snapshot.evaluation.completed
      ? "accepted"
      : index < snapshot.evaluation.nextExpectedIndex
        ? "accepted"
        : index === snapshot.evaluation.nextExpectedIndex
          ? "expected"
          : "remaining";
    key.element.dataset.noteState = state;
    key.element.disabled = !mockKeysEnabled;
    key.element.setAttribute(
      "aria-label",
      `${formatMidiNote(key.noteNumber)}${state === "expected" ? ", next note" : state === "accepted" ? ", completed" : ""}`,
    );
    key.element.setAttribute("aria-current", state === "expected" ? "true" : "false");
    key.element.setAttribute("aria-pressed", activeNotes.has(key.noteNumber) ? "true" : "false");
  }

  elements.nextNote.textContent =
    snapshot.sessionStatus === "completed"
      ? "Complete"
      : snapshot.sessionStatus === "interrupted"
        ? "Restart required"
        : nextEvent === undefined
          ? "—"
          : formatMidiNote(nextEvent.noteNumber);
  elements.progressText.textContent = `${snapshot.evaluation.nextExpectedIndex} of ${snapshot.exercise.expectedEvents.length} notes`;
  elements.feedbackMessage.textContent = feedbackMessage(snapshot, nextEvent?.noteNumber);
  elements.keyboardHelp.textContent = mockKeysEnabled
    ? "Play these on-screen keys, or use a connected MIDI keyboard."
    : "Connect the on-screen input to make these keys playable, or use a connected MIDI keyboard.";

  elements.persistenceMessage.hidden = snapshot.persistenceMessage === null;
  elements.persistenceMessage.textContent = snapshot.persistenceMessage;
}

function feedbackMessage(snapshot: PracticeSnapshot, nextNoteNumber: number | undefined): string {
  if (snapshot.sessionStatus === "interrupted") {
    const firstNote = snapshot.exercise.expectedEvents[0]!;
    return `This attempt was interrupted. Reconnect the input, then restart from ${formatMidiNote(firstNote.noteNumber)}.`;
  }

  if (snapshot.sessionStatus === "completed") {
    const summary = snapshot.evaluation.completionSummary;
    return summary === null
      ? "Sequence complete."
      : [summary.message, ...summary.observations.map((observation) => observation.message)].join(" ");
  }

  if (snapshot.feedback !== null) {
    if (snapshot.feedback.classification === "correct" && nextNoteNumber !== undefined) {
      return `${snapshot.feedback.message} ${formatMidiNote(nextNoteNumber)} is next.`;
    }
    return snapshot.feedback.message;
  }

  return `Begin when your input is connected. ${formatMidiNote(snapshot.exercise.expectedEvents[0]?.noteNumber ?? 60)} is first.`;
}

function renderHistory(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  if (snapshot.historyStatus === "loading") {
    elements.historyCount.textContent = "Loading history…";
    elements.historyDetail.textContent = "Reading completed attempts from this browser.";
    return;
  }

  if (snapshot.historyStatus === "unavailable") {
    elements.historyCount.textContent = "History unavailable";
    elements.historyDetail.textContent = "Practice still works; this browser could not read or save local history.";
    return;
  }

  const count = snapshot.history.completedToday;
  elements.historyCount.textContent = `${count} ${count === 1 ? "attempt" : "attempts"} completed today`;
  const mostRecent = snapshot.history.mostRecent;
  elements.historyDetail.textContent =
    mostRecent === null
      ? "No completed attempts in this browser yet."
      : `Most recent completion: ${formatCompletionTime(mostRecent.completedAt)}. ${snapshot.history.totalCompleted} total for this exercise.`;
}

function formatCompletionTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function escapeMarkup(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
