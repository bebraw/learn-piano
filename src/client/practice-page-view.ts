import { formatMidiNote } from "../exercises/evaluator.js";
import type { MidiInputDevice } from "../midi/types.js";
import type { AttemptTimingSummary } from "./persistence/attempt-repository.js";
import type { PracticeSnapshot, PracticeView } from "./practice-controller.js";

interface AttributeElementLike {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

interface ElementLike extends AttributeElementLike {
  hidden: boolean | string;
  textContent: string | null;
}

interface ControlLike extends ElementLike {
  disabled: boolean;
}

interface ValueControlLike extends ControlLike {
  value: string;
}

interface SelectLike extends ValueControlLike {
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

export interface PracticeStaffNoteElement {
  readonly eventId: string;
  readonly element: AttributeElementLike;
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
  readonly practiceStage: ElementLike;
  readonly pulseControls: ElementLike;
  readonly pulseStatus: ElementLike;
  readonly pulseTempo: ValueControlLike;
  readonly startPulseButton: ControlLike;
  readonly stopPulseButton: ControlLike;
  readonly pulseBeats: readonly ElementLike[];
  readonly connectionStatus: ElementLike;
  readonly nextNote: ElementLike;
  readonly progressText: ElementLike;
  readonly feedbackMessage: ElementLike;
  readonly persistenceMessage: ElementLike;
  readonly historyCount: ElementLike;
  readonly historyDetail: ElementLike;
  readonly keyboardHelp: ElementLike;
  readonly nextStudyRecommendation: ElementLike;
  readonly nextStudyKicker: ElementLike;
  readonly nextStudyTitle: ElementLike;
  readonly nextStudyReason: ElementLike;
  readonly nextExerciseLink: ElementLike;
  readonly nextExerciseLabel: ElementLike;
  readonly keys: readonly PracticeKeyElement[];
  readonly staffNotes: readonly PracticeStaffNoteElement[];
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
      renderPulse(elements, snapshot);
      renderSession(elements, snapshot);
      renderHistory(elements, snapshot);
    },
  };
}

function renderPulse(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  const timing = snapshot.exercise.timing;
  const timed = timing !== undefined;
  const pulseStatus = snapshot.pulse?.status ?? "untimed";
  const pulseStarted =
    snapshot.pulse?.status === "starting" || snapshot.pulse?.status === "counting-in" || snapshot.pulse?.status === "running";
  const connected = snapshot.connection.status === "connected";

  elements.pulseControls.hidden = !timed;
  elements.practiceStage.setAttribute("data-pulse-status", pulseStatus);
  elements.pulseStatus.setAttribute("data-status", pulseStatus);
  setTextContent(elements.pulseStatus, pulseMessage(snapshot));
  elements.pulseTempo.value = snapshot.tempoBpm === null ? "" : String(snapshot.tempoBpm);
  elements.pulseTempo.disabled = !timed || snapshot.sessionStatus !== "ready" || pulseStarted;
  elements.startPulseButton.disabled =
    !timed || snapshot.pulse === null || !connected || snapshot.sessionStatus !== "ready" || pulseStarted;
  elements.stopPulseButton.disabled = !pulseStarted;

  const activeBeat = snapshot.pulse?.status === "counting-in" ? snapshot.pulse.countInBeat : snapshot.pulse?.currentBeat;
  for (const [index, beat] of elements.pulseBeats.entries()) {
    beat.setAttribute("data-beat-state", activeBeat === index + 1 ? "active" : "idle");
  }
}

function pulseMessage(snapshot: PracticeSnapshot): string {
  const timing = snapshot.exercise.timing;
  if (timing === undefined) {
    return "This study has no fixed pulse.";
  }

  const pulse = snapshot.pulse;
  if (pulse === null) {
    return "Pulse guidance is unavailable. The written study remains readable.";
  }

  if (pulse.status === "stopped" && snapshot.sessionStatus === "completed") {
    return `Pulse stopped. Study complete at ${pulse.tempoBpm} BPM.`;
  }

  if (pulse.status === "stopped" && snapshot.sessionStatus === "interrupted") {
    return snapshot.connection.status === "connected"
      ? `Pulse stopped. Restart the study to try again at ${pulse.tempoBpm} BPM.`
      : "Pulse stopped. Reconnect your input, then restart the study.";
  }

  switch (pulse.status) {
    case "stopped":
      return `Ready at ${pulse.tempoBpm} BPM. Start the ${timing.countInBeats}-beat count-in when you are settled.`;
    case "starting":
      return timing.countInBeats === 0 ? "The pulse is starting." : `The ${timing.countInBeats}-beat count-in is starting.`;
    case "counting-in":
      return pulse.countInBeat === null
        ? `The ${timing.countInBeats}-beat count-in is starting.`
        : `Count-in ${pulse.countInBeat} of ${timing.countInBeats}.`;
    case "running":
      return `Pulse running at ${pulse.tempoBpm} BPM. Keep the notes even and unhurried.`;
    case "error":
      return pulse.errorMessage ?? "The practice pulse could not start. Try it again when you are ready.";
  }
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
  setTextContent(elements.connectionStatus, connectionMessage(snapshot, selectedInput?.label));
  elements.connectionStatus.setAttribute("data-status", snapshot.connection.status);
  elements.connectButton.disabled = elements.midiInput.value === "" || connected || snapshot.connection.status === "requesting-permission";
  elements.refreshButton.disabled = snapshot.connection.status === "requesting-permission";
  elements.disconnectButton.disabled = !connected;
}

function connectionMessage(snapshot: PracticeSnapshot, selectedLabel: string | undefined): string {
  switch (snapshot.connection.status) {
    case "unsupported":
      return snapshot.inputKind === "native-midi"
        ? "The iPad MIDI bridge is unavailable. The on-screen practice keys still work."
        : "Web MIDI is unavailable in this browser. The on-screen practice keys still work.";
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
  const timed = snapshot.exercise.evaluationMode === "timed-ordered-notes";
  const pulseRunning = snapshot.pulse?.status === "running";
  const mockKeysEnabled = snapshot.inputKind === "mock" && snapshot.connection.status === "connected" && (!timed || pulseRunning);
  const activeNotes = new Set(snapshot.activeNoteNumbers);

  elements.practiceStage.setAttribute("data-session-status", snapshot.sessionStatus);
  elements.feedbackMessage.setAttribute("data-session-status", snapshot.sessionStatus);
  elements.nextExerciseLink.hidden = snapshot.sessionStatus !== "completed";
  renderRecommendation(elements, snapshot);

  for (const [index, event] of snapshot.exercise.expectedEvents.entries()) {
    const state = practiceNoteState(snapshot, index);
    const staffNote = elements.staffNotes.find((candidate) => candidate.eventId === event.id);
    staffNote?.element.setAttribute("data-note-state", state);
    staffNote?.element.setAttribute("data-note-active", activeNotes.has(event.noteNumber) ? "true" : "false");

    const key = elements.keys.find((candidate) => candidate.eventId === event.id);
    if (key === undefined) {
      continue;
    }

    key.element.dataset.noteState = state;
    key.element.disabled = !mockKeysEnabled;
    key.element.setAttribute(
      "aria-label",
      `${formatMidiNote(key.noteNumber)}${state === "expected" ? ", next note" : state === "accepted" ? ", completed" : ""}`,
    );
    key.element.setAttribute("aria-current", state === "expected" ? "true" : "false");
    key.element.setAttribute("aria-pressed", activeNotes.has(key.noteNumber) ? "true" : "false");
  }

  setTextContent(
    elements.nextNote,
    snapshot.sessionStatus === "completed"
      ? "Complete"
      : snapshot.sessionStatus === "interrupted"
        ? "Restart required"
        : nextEvent === undefined
          ? "—"
          : formatMidiNote(nextEvent.noteNumber),
  );
  setTextContent(elements.progressText, `${snapshot.evaluation.nextExpectedIndex} of ${snapshot.exercise.expectedEvents.length} notes`);
  setTextContent(elements.feedbackMessage, feedbackMessage(snapshot, nextEvent?.noteNumber));
  setTextContent(elements.keyboardHelp, keyboardHelpMessage(snapshot, mockKeysEnabled));

  elements.persistenceMessage.hidden = snapshot.persistenceMessage === null;
  setTextContent(elements.persistenceMessage, snapshot.persistenceMessage);
}

function renderRecommendation(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  const recommendation = snapshot.sessionStatus === "completed" ? snapshot.recommendation : null;
  elements.nextStudyRecommendation.hidden = recommendation === null;

  if (recommendation === null) {
    elements.nextExerciseLink.setAttribute("href", "/");
    setTextContent(elements.nextExerciseLabel, "Exercise library");
    setTextContent(elements.nextStudyTitle, null);
    setTextContent(elements.nextStudyReason, null);
    return;
  }

  elements.nextExerciseLink.setAttribute("href", `/practice?exercise=${encodeURIComponent(recommendation.exercise.id)}`);
  setTextContent(elements.nextExerciseLabel, recommendation.kind === "review" ? "Review study" : "Open next study");
  setTextContent(elements.nextStudyKicker, recommendation.kind === "review" ? "Suggested review" : "Suggested next");
  setTextContent(elements.nextStudyTitle, recommendation.exercise.title);
  setTextContent(elements.nextStudyReason, recommendationReason(recommendation));
}

function recommendationReason(recommendation: NonNullable<PracticeSnapshot["recommendation"]>): string {
  switch (recommendation.reason.kind) {
    case "direct-dependent":
      return "Builds directly on the study you just completed.";
    case "prerequisites-practiced": {
      const count = recommendation.reason.prerequisiteExerciseIds.length;
      return `You've completed ${count === 1 ? "its prerequisite study" : "its prerequisite studies"} in this browser.`;
    }
    case "prerequisite-free":
      return "A new foundation study with no prerequisites.";
    case "least-recently-practiced":
      return "You've completed every current study; this one was practiced least recently.";
  }
}

function practiceNoteState(snapshot: PracticeSnapshot, index: number): "accepted" | "expected" | "remaining" {
  if (snapshot.evaluation.completed || index < snapshot.evaluation.nextExpectedIndex) {
    return "accepted";
  }
  return index === snapshot.evaluation.nextExpectedIndex ? "expected" : "remaining";
}

function feedbackMessage(snapshot: PracticeSnapshot, nextNoteNumber: number | undefined): string {
  if (snapshot.sessionStatus === "interrupted") {
    const firstNote = snapshot.exercise.expectedEvents[0]!;
    const pulseError = snapshot.pulse?.status === "error" ? ` ${snapshot.pulse.errorMessage ?? "The practice pulse stopped."}` : "";
    const recovery =
      snapshot.connection.status === "connected"
        ? `Restart from ${formatMidiNote(firstNote.noteNumber)}.`
        : `Reconnect the input, then restart from ${formatMidiNote(firstNote.noteNumber)}.`;
    return `This attempt was interrupted. ${recovery}${pulseError}`;
  }

  if (snapshot.sessionStatus === "completed") {
    const summary = snapshot.evaluation.completionSummary;
    return summary === null
      ? "Sequence complete."
      : [summary.message, ...summary.observations.map((observation) => observation.message), summary.timing?.message]
          .filter((message): message is string => message !== undefined)
          .join(" ");
  }

  if (snapshot.pulse?.status === "error") {
    return `${snapshot.pulse.errorMessage ?? "The practice pulse could not start."} Your note progress is unchanged.`;
  }

  if (snapshot.pulse?.status === "counting-in") {
    const countInBeats = snapshot.exercise.timing?.countInBeats ?? 4;
    const firstNote = formatMidiNote(snapshot.exercise.expectedEvents[0]?.noteNumber ?? 60);
    return `Listen through the ${countInBeats}-beat count-in. Begin with ${firstNote} when the pulse starts.`;
  }

  if (snapshot.pulse?.status === "starting") {
    return "The pulse is starting. Listen for the count-in before you begin.";
  }

  if (snapshot.feedback !== null) {
    if (snapshot.feedback.classification === "correct" && nextNoteNumber !== undefined) {
      return `${snapshot.feedback.message} ${formatMidiNote(nextNoteNumber)} is next.`;
    }
    return snapshot.feedback.message;
  }

  if (snapshot.pulse?.status === "running") {
    return `The pulse is steady at ${snapshot.pulse.tempoBpm} BPM. ${formatMidiNote(
      snapshot.exercise.expectedEvents[0]?.noteNumber ?? 60,
    )} is first.`;
  }

  return `Begin when your input is connected. ${formatMidiNote(snapshot.exercise.expectedEvents[0]?.noteNumber ?? 60)} is first.`;
}

function keyboardHelpMessage(snapshot: PracticeSnapshot, mockKeysEnabled: boolean): string {
  if (snapshot.sessionStatus === "completed") {
    return "Study complete. Restart when you would like to play it again.";
  }

  if (snapshot.sessionStatus === "interrupted") {
    return snapshot.connection.status === "connected"
      ? "Restart before playing this study again."
      : "Reconnect the input, then restart before playing this study again.";
  }

  if (mockKeysEnabled) {
    return "Play these on-screen keys, or use a connected MIDI keyboard.";
  }

  if (snapshot.exercise.evaluationMode === "timed-ordered-notes" && snapshot.connection.status === "connected") {
    if (snapshot.pulse?.status === "starting") {
      return "The pulse is starting. These keys become playable after the count-in.";
    }
    if (snapshot.pulse?.status === "counting-in") {
      return "Listen through the count-in. These keys become playable when the pulse begins.";
    }
    if (snapshot.pulse?.status !== "running") {
      return "Start the count-in to make these keys playable. A connected MIDI keyboard follows the same pulse.";
    }
  }

  return "Connect the on-screen input to make these keys playable, or use a connected MIDI keyboard.";
}

function renderHistory(elements: PracticePageElements, snapshot: PracticeSnapshot): void {
  if (snapshot.historyStatus === "loading") {
    setTextContent(elements.historyCount, "Loading history…");
    setTextContent(elements.historyDetail, "Reading completed attempts from this browser.");
    return;
  }

  if (snapshot.historyStatus === "unavailable") {
    setTextContent(elements.historyCount, "History unavailable");
    setTextContent(elements.historyDetail, "Practice still works; this browser could not read or save local history.");
    return;
  }

  const count = snapshot.history.completedToday;
  setTextContent(elements.historyCount, `${count} ${count === 1 ? "attempt" : "attempts"} completed today`);
  const mostRecent = snapshot.history.mostRecent;
  setTextContent(
    elements.historyDetail,
    mostRecent === null
      ? "No completed attempts in this browser yet."
      : `Most recent completion: ${formatCompletionTime(mostRecent.completedAt)}.${formatHistoryTiming(
          mostRecent.timing,
        )} ${snapshot.history.totalCompleted} total for this exercise.`,
  );
}

function formatHistoryTiming(timing: AttemptTimingSummary | undefined): string {
  if (timing === undefined) {
    return "";
  }

  if (timing.assessedIntervals === 0) {
    return ` At ${timing.tempoBpm} BPM, there was no interval to assess.`;
  }

  const intervalLabel = timing.assessedIntervals === 1 ? "interval stayed" : "intervals stayed";
  return ` At ${timing.tempoBpm} BPM, ${timing.onPulse} of ${timing.assessedIntervals} ${intervalLabel} on the pulse.`;
}

function formatCompletionTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function escapeMarkup(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function setTextContent(element: ElementLike, value: string | null): void {
  const nextValue = value ?? "";
  if (element.textContent !== nextValue) {
    element.textContent = nextValue;
  }
}
