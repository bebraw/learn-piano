import type { PracticePulseConfig, PracticePulsePort, PracticePulseState } from "../audio/practice-pulse-port.js";
import { recommendNextStudy, type StudyRecommendation } from "../curriculum/study-recommendation.js";
import { createEvaluationState, evaluateMidiEvent, type EvaluationFeedback, type EvaluationState } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";
import type { MidiInputPort } from "../midi/midi-input-port.js";
import type { MidiConnectionState, MidiInputDevice, NormalizedMidiEvent } from "../midi/types.js";
import type { AttemptInputKind, AttemptRepository, CompletedAttemptRecord } from "./persistence/attempt-repository.js";
import { summarizePracticeHistory, type PracticeHistorySummary } from "./persistence/practice-history.js";

export type PracticeSessionStatus = "ready" | "in-progress" | "completed" | "interrupted";
export type PracticeHistoryStatus = "loading" | "ready" | "unavailable";
export type PracticeRecommendationStatus = "loading" | "ready" | "unavailable";

export interface PracticeSnapshot {
  readonly exercise: Exercise;
  readonly inputKind: AttemptInputKind;
  readonly inputs: readonly MidiInputDevice[];
  readonly connection: MidiConnectionState;
  readonly sessionStatus: PracticeSessionStatus;
  readonly tempoBpm: number | null;
  readonly pulse: PracticePulseState | null;
  readonly evaluation: EvaluationState;
  readonly feedback: EvaluationFeedback | null;
  readonly activeNoteNumbers: readonly number[];
  readonly historyStatus: PracticeHistoryStatus;
  readonly history: PracticeHistorySummary;
  readonly recommendationStatus: PracticeRecommendationStatus;
  readonly recommendation: StudyRecommendation | null;
  readonly persistenceMessage: string | null;
}

export interface PracticeView {
  render(snapshot: PracticeSnapshot): void;
}

export interface PracticeControllerOptions {
  readonly now?: () => Date;
  readonly monotonicNow?: () => number;
  readonly createAttemptId?: () => string;
  readonly createPulse?: (config: PracticePulseConfig) => PracticePulsePort;
  readonly exerciseLibrary?: readonly Exercise[];
}

const EMPTY_HISTORY: PracticeHistorySummary = {
  completedToday: 0,
  totalCompleted: 0,
  mostRecent: null,
  recentEvidence: {
    attemptCount: 0,
    correctionFreeAttempts: 0,
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
    timing: null,
  },
};

export class PracticeController {
  private readonly now: () => Date;
  private readonly monotonicNow: () => number;
  private readonly createAttemptId: () => string;
  private readonly createPulse: ((config: PracticePulseConfig) => PracticePulsePort) | undefined;
  private readonly exerciseLibrary: readonly Exercise[];
  private inputKind: AttemptInputKind = "mock";
  private activePort: MidiInputPort;
  private inputs: readonly MidiInputDevice[] = [];
  private connection: MidiConnectionState;
  private sessionStatus: PracticeSessionStatus = "ready";
  private tempoBpm: number | null;
  private pulse: PracticePulsePort | null = null;
  private pulseState: PracticePulseState | null = null;
  private evaluation: EvaluationState;
  private feedback: EvaluationFeedback | null = null;
  private activeNoteNumbers = new Set<number>();
  private historyStatus: PracticeHistoryStatus = "loading";
  private history = EMPTY_HISTORY;
  private historyRecords: readonly CompletedAttemptRecord[] = [];
  private recommendationStatus: PracticeRecommendationStatus = "loading";
  private recommendationRecords: readonly CompletedAttemptRecord[] = [];
  private latestCompletedAttempt: CompletedAttemptRecord | null = null;
  private persistenceMessage: string | null = null;
  private attemptStartedAt: Date | null = null;
  private latestEventTimestamp: number | null = null;
  private eventTimestampFloor: number | null = null;
  private inputOperationEpoch = 0;
  private removeEventListener: (() => void) | null = null;
  private removeStateListener: (() => void) | null = null;
  private removePulseStateListener: (() => void) | null = null;
  private persistenceWork: Promise<void> = Promise.resolve();
  private disposed = false;

  public constructor(
    private readonly exercise: Exercise,
    private readonly ports: Readonly<Record<AttemptInputKind, MidiInputPort>>,
    private readonly attempts: AttemptRepository,
    private readonly view: PracticeView,
    options: PracticeControllerOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.monotonicNow = options.monotonicNow ?? defaultMonotonicNow;
    this.createAttemptId = options.createAttemptId ?? (() => globalThis.crypto.randomUUID());
    this.createPulse = options.createPulse;
    this.exerciseLibrary = options.exerciseLibrary ?? [exercise];
    this.activePort = ports.mock;
    this.connection = this.activePort.getState();
    this.tempoBpm = exercise.timing?.defaultBpm ?? null;
    this.evaluation = createEvaluationState(exercise, this.tempoBpm ?? undefined);
    this.replacePulse();
  }

  public async initialize(): Promise<void> {
    this.assertActive();
    this.subscribeToActivePort();
    this.subscribeToPulse();
    this.render();

    await Promise.all([this.refreshInputs(), this.loadHistory(), this.loadRecommendationHistory()]);
  }

  public getSnapshot(): PracticeSnapshot {
    const history = this.historyStatus === "ready" ? summarizePracticeHistory(this.historyRecords, this.now()) : this.history;
    const recommendation =
      this.sessionStatus === "completed" && this.recommendationStatus === "ready"
        ? recommendNextStudy(this.exerciseLibrary, this.recommendationEvidence(), this.exercise.id)
        : null;
    return {
      exercise: this.exercise,
      inputKind: this.inputKind,
      inputs: [...this.inputs],
      connection: { ...this.connection },
      sessionStatus: this.sessionStatus,
      tempoBpm: this.tempoBpm,
      pulse: this.pulseState === null ? null : { ...this.pulseState },
      evaluation: this.evaluation,
      feedback: this.feedback,
      activeNoteNumbers: [...this.activeNoteNumbers],
      historyStatus: this.historyStatus,
      history,
      recommendationStatus: this.recommendationStatus,
      recommendation,
      persistenceMessage: this.persistenceMessage,
    };
  }

  public async selectInputKind(kind: AttemptInputKind): Promise<void> {
    this.assertActive();

    if (kind === this.inputKind) {
      await this.refreshInputs();
      return;
    }

    const operationEpoch = ++this.inputOperationEpoch;
    this.interruptInProgressAttempt();
    this.pulse?.stop();
    this.unsubscribeFromActivePort();
    this.activePort.disconnect();
    this.inputKind = kind;
    this.activePort = this.ports[kind];
    this.connection = this.activePort.getState();
    this.inputs = this.activePort.getInputs();
    this.activeNoteNumbers.clear();
    this.subscribeToActivePort();
    this.render();
    await this.refreshInputsFor(this.activePort, operationEpoch);
  }

  public async refreshInputs(): Promise<void> {
    this.assertActive();
    const operationEpoch = ++this.inputOperationEpoch;
    await this.refreshInputsFor(this.activePort, operationEpoch);
  }

  private async refreshInputsFor(port: MidiInputPort, operationEpoch: number): Promise<void> {
    let inputs: readonly MidiInputDevice[];

    try {
      inputs = await port.requestAccess();
    } catch (error: unknown) {
      if (!this.isCurrentInputOperation(port, operationEpoch)) {
        return;
      }
      this.connection = {
        status: "error",
        selectedInputId: null,
        errorMessage: describeError(error, "MIDI access was not available."),
      };
      this.inputs = [];
      this.render();
      return;
    }

    if (!this.isCurrentInputOperation(port, operationEpoch)) {
      return;
    }

    this.inputs = inputs;
    this.connection = port.getState();
    this.render();
  }

  public async connect(inputId: string): Promise<boolean> {
    this.assertActive();
    const operationEpoch = ++this.inputOperationEpoch;
    const port = this.activePort;
    const connected = await port.selectInput(inputId);
    if (!this.isCurrentInputOperation(port, operationEpoch)) {
      return false;
    }

    this.inputs = port.getInputs();
    this.connection = port.getState();
    this.render();
    return connected;
  }

  public disconnect(): void {
    this.assertActive();
    this.inputOperationEpoch += 1;
    this.pulse?.stop();
    this.activePort.disconnect();
  }

  public setTempo(tempoBpm: number): void {
    this.assertActive();
    if (this.exercise.timing === undefined) {
      throw new Error("This exercise does not use a practice tempo");
    }
    if (this.sessionStatus !== "ready" || (this.pulseState?.status !== "stopped" && this.pulseState?.status !== "error")) {
      throw new Error("Restart before changing the practice tempo");
    }

    this.evaluation = createEvaluationState(this.exercise, tempoBpm);
    this.tempoBpm = tempoBpm;
    this.feedback = null;
    this.persistenceMessage = null;
    this.replacePulse();
    this.render();
  }

  public async startPulse(): Promise<boolean> {
    this.assertActive();
    const pulse = this.pulse;
    if (pulse === null || this.connection.status !== "connected" || this.sessionStatus !== "ready") {
      return false;
    }

    await pulse.start();
    if (this.disposed || pulse !== this.pulse) {
      return false;
    }

    this.pulseState = pulse.getState();
    this.render();
    return this.pulseState.status === "starting" || this.pulseState.status === "counting-in" || this.pulseState.status === "running";
  }

  public stopPulse(): void {
    this.assertActive();
    this.pulse?.stop();
    this.interruptInProgressAttempt();
    this.render();
  }

  public restart(): void {
    this.assertActive();
    this.eventTimestampFloor = Math.max(this.latestEventTimestamp ?? Number.NEGATIVE_INFINITY, this.monotonicNow());
    this.evaluation = createEvaluationState(this.exercise, this.tempoBpm ?? undefined);
    this.feedback = null;
    this.sessionStatus = "ready";
    this.attemptStartedAt = null;
    this.activeNoteNumbers.clear();
    this.persistenceMessage = null;
    this.pulse?.stop();
    this.render();
  }

  public async waitForPersistence(): Promise<void> {
    await this.persistenceWork;
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.inputOperationEpoch += 1;
    this.unsubscribeFromActivePort();
    this.unsubscribeFromPulse();
    this.pulse?.dispose();
    for (const port of new Set(Object.values(this.ports))) {
      port.dispose();
    }
  }

  private subscribeToActivePort(): void {
    const port = this.activePort;
    this.removeEventListener = port.onEvent((event) => {
      if (port === this.activePort) {
        this.handleMidiEvent(event);
      }
    });
    this.removeStateListener = port.onStateChange((state) => this.handleConnectionState(port, state));
  }

  private unsubscribeFromActivePort(): void {
    this.removeEventListener?.();
    this.removeStateListener?.();
    this.removeEventListener = null;
    this.removeStateListener = null;
  }

  private subscribeToPulse(): void {
    const pulse = this.pulse;
    if (pulse === null || this.removePulseStateListener !== null) {
      return;
    }

    this.removePulseStateListener = pulse.onStateChange((state) => {
      if (!this.disposed && pulse === this.pulse) {
        this.pulseState = state;
        if (state.status === "error") {
          this.interruptInProgressAttempt();
        }
        this.render();
      }
    });
  }

  private unsubscribeFromPulse(): void {
    this.removePulseStateListener?.();
    this.removePulseStateListener = null;
  }

  private replacePulse(): void {
    const timing = this.exercise.timing;
    const tempoBpm = this.tempoBpm;
    const wasSubscribed = this.removePulseStateListener !== null;
    this.unsubscribeFromPulse();
    this.pulse?.dispose();
    this.pulse = null;
    this.pulseState = null;

    if (timing === undefined || tempoBpm === null || this.createPulse === undefined) {
      return;
    }

    this.pulse = this.createPulse({
      tempoBpm,
      countIn: timing.countInBeats,
      beatsPerMeasure: timing.beatsPerMeasure,
    });
    this.pulseState = this.pulse.getState();
    if (wasSubscribed) {
      this.subscribeToPulse();
    }
  }

  private handleMidiEvent(event: NormalizedMidiEvent): void {
    if (
      this.disposed ||
      this.sessionStatus === "interrupted" ||
      (this.eventTimestampFloor !== null && event.timestamp <= this.eventTimestampFloor)
    ) {
      return;
    }

    this.latestEventTimestamp = Math.max(this.latestEventTimestamp ?? event.timestamp, event.timestamp);

    if (event.type === "note-on") {
      this.activeNoteNumbers.add(event.noteNumber);
    } else {
      this.activeNoteNumbers.delete(event.noteNumber);
    }

    if (this.sessionStatus === "completed") {
      this.render();
      return;
    }

    if (this.exercise.evaluationMode === "timed-ordered-notes" && this.pulseState?.status !== "running") {
      this.render();
      return;
    }

    if (event.type === "note-on" && this.sessionStatus === "ready") {
      this.sessionStatus = "in-progress";
      this.attemptStartedAt = this.now();
    }

    const transition = evaluateMidiEvent(this.exercise, this.evaluation, event);
    this.evaluation = transition.state;
    this.feedback = transition.feedback ?? this.feedback;

    if (transition.completedNow) {
      this.sessionStatus = "completed";
      this.pulse?.stop();
      this.queueCompletedAttempt();
    }

    this.render();
  }

  private handleConnectionState(port: MidiInputPort, state: MidiConnectionState): void {
    if (this.disposed || port !== this.activePort) {
      return;
    }

    const previousConnection = this.connection;
    this.connection = state;
    this.inputs = port.getInputs();
    const inputSourceChanged =
      previousConnection.status === "connected" &&
      (state.status !== "connected" || previousConnection.selectedInputId !== state.selectedInputId);
    if (inputSourceChanged) {
      this.activeNoteNumbers.clear();
      this.interruptInProgressAttempt();
      this.pulse?.stop();
    }
    this.render();
  }

  private interruptInProgressAttempt(): void {
    if (this.sessionStatus !== "in-progress") {
      return;
    }

    this.sessionStatus = "interrupted";
    this.attemptStartedAt = null;
    this.activeNoteNumbers.clear();
  }

  private queueCompletedAttempt(): void {
    const startedAt = this.attemptStartedAt;
    if (startedAt === null) {
      throw new Error("A completed attempt must have a start time");
    }

    const completedAt = this.now();
    const timing = this.evaluation.completionSummary?.timing;
    const record: CompletedAttemptRecord = {
      schemaVersion: 1,
      id: this.createAttemptId(),
      exerciseId: this.exercise.id,
      exerciseRevision: this.exercise.revision,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      inputKind: this.inputKind,
      status: "completed",
      errorCounts: {
        outOfOrder: this.evaluation.counts.outOfOrder,
        repeated: this.evaluation.counts.repeated,
        wrong: this.evaluation.counts.wrong,
      },
      ...(timing === undefined
        ? {}
        : {
            timing: {
              tempoBpm: timing.tempoBpm,
              assessedIntervals: timing.assessedIntervals,
              onPulse: timing.onPulse,
              early: timing.early,
              late: timing.late,
              meanAbsoluteErrorMs: timing.meanAbsoluteErrorMs,
            },
          }),
    };

    this.attemptStartedAt = null;
    this.latestCompletedAttempt = record;
    this.persistenceWork = this.persistenceWork.then(async () => {
      try {
        await this.attempts.save(record);
        this.persistenceMessage = null;
        await Promise.all([this.loadHistory(), this.loadRecommendationHistory()]);
      } catch (error: unknown) {
        this.historyStatus = "unavailable";
        this.persistenceMessage = describeError(error, "The sequence is complete, but history could not be saved in this browser.");
        this.render();
      }
    });
  }

  private async loadHistory(): Promise<void> {
    try {
      const records = await this.attempts.list(this.exercise.id, this.exercise.revision);
      this.historyRecords = records;
      this.history = summarizePracticeHistory(records, this.now());
      this.historyStatus = "ready";
    } catch {
      this.historyRecords = [];
      this.history = EMPTY_HISTORY;
      this.historyStatus = "unavailable";
    }
    this.render();
  }

  private async loadRecommendationHistory(): Promise<void> {
    try {
      const records = await Promise.all(this.exerciseLibrary.map((exercise) => this.attempts.list(exercise.id, exercise.revision)));
      this.recommendationRecords = records.flat();
      this.recommendationStatus = "ready";
    } catch {
      this.recommendationRecords = [];
      this.recommendationStatus = "unavailable";
    }
    this.render();
  }

  private recommendationEvidence(): readonly CompletedAttemptRecord[] {
    const latest = this.latestCompletedAttempt;
    if (latest === null || this.recommendationRecords.some((record) => record.id === latest.id)) {
      return this.recommendationRecords;
    }
    return [latest, ...this.recommendationRecords];
  }

  private render(): void {
    this.view.render(this.getSnapshot());
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("PracticeController has been disposed");
    }
  }

  private isCurrentInputOperation(port: MidiInputPort, operationEpoch: number): boolean {
    return !this.disposed && this.activePort === port && this.inputOperationEpoch === operationEpoch;
  }
}

function defaultMonotonicNow(): number {
  return typeof performance === "undefined" ? 0 : performance.now();
}

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? `${fallback} ${error.message}` : fallback;
}
