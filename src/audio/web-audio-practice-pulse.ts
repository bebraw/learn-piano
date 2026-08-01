import type {
  PracticePulseConfig,
  PracticePulsePort,
  PracticePulseState,
  PracticePulseStateListener,
  PracticePulseUnsubscribe,
} from "./practice-pulse-port.js";

export interface PracticePulseScheduledClick {
  stop(): void;
}

export interface PracticePulseAudioContext {
  readonly currentTime: number;
  readonly state: string;
  resume(): Promise<void>;
  scheduleClick(atTimeSeconds: number, accent: boolean): PracticePulseScheduledClick;
  close(): Promise<void>;
}

export type PracticePulseAudioContextFactory = () => PracticePulseAudioContext;

export interface PracticePulseRepeatingTimer {
  cancel(): void;
}

export interface PracticePulseTimerBoundary {
  repeat(callback: () => void, intervalMs: number): PracticePulseRepeatingTimer;
}

export interface WebAudioPracticePulseOptions {
  readonly createAudioContext?: PracticePulseAudioContextFactory;
  readonly timer?: PracticePulseTimerBoundary;
  readonly lookaheadSeconds?: number;
  readonly schedulerIntervalMs?: number;
  readonly startLatencySeconds?: number;
}

interface ScheduledClickRecord {
  readonly click: PracticePulseScheduledClick;
  readonly endsAtSeconds: number;
}

interface PendingStart {
  readonly epoch: number;
  readonly promise: Promise<void>;
}

const DEFAULT_LOOKAHEAD_SECONDS = 0.1;
const DEFAULT_SCHEDULER_INTERVAL_MS = 25;
const DEFAULT_START_LATENCY_SECONDS = 0.05;
const CLICK_LIFETIME_SECONDS = 0.08;

function copyState(state: PracticePulseState): PracticePulseState {
  return { ...state };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "The practice pulse could not start.";
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

function validateConfig(config: PracticePulseConfig): void {
  assertPositiveFinite(config.tempoBpm, "tempoBpm");
  if (!Number.isInteger(config.countIn) || config.countIn < 0) {
    throw new RangeError("countIn must be a non-negative integer.");
  }
  if (!Number.isInteger(config.beatsPerMeasure) || config.beatsPerMeasure <= 0) {
    throw new RangeError("beatsPerMeasure must be a positive integer.");
  }
}

function validateOptions(options: WebAudioPracticePulseOptions): void {
  if (options.lookaheadSeconds !== undefined) {
    assertPositiveFinite(options.lookaheadSeconds, "lookaheadSeconds");
  }
  if (options.schedulerIntervalMs !== undefined) {
    assertPositiveFinite(options.schedulerIntervalMs, "schedulerIntervalMs");
  }
  if (options.startLatencySeconds !== undefined && (!Number.isFinite(options.startLatencySeconds) || options.startLatencySeconds < 0)) {
    throw new RangeError("startLatencySeconds must be a non-negative finite number.");
  }
}

class BrowserScheduledClick implements PracticePulseScheduledClick {
  private stopped = false;

  constructor(
    private readonly oscillator: OscillatorNode,
    private readonly gain: GainNode,
  ) {}

  stop(): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    try {
      this.oscillator.stop();
    } catch {
      // The oscillator may already have ended; disconnecting still releases it.
    }
    this.disconnect();
  }

  disconnect(): void {
    try {
      this.oscillator.disconnect();
    } catch {
      // Best-effort cleanup for platform nodes that already disconnected.
    }
    try {
      this.gain.disconnect();
    } catch {
      // Best-effort cleanup for platform nodes that already disconnected.
    }
  }
}

class BrowserPulseAudioContext implements PracticePulseAudioContext {
  constructor(private readonly context: AudioContext) {}

  get currentTime(): number {
    return this.context.currentTime;
  }

  get state(): string {
    return this.context.state;
  }

  resume(): Promise<void> {
    return this.context.resume();
  }

  scheduleClick(atTimeSeconds: number, accent: boolean): PracticePulseScheduledClick {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const click = new BrowserScheduledClick(oscillator, gain);
    const duration = accent ? 0.055 : 0.04;
    const peakGain = accent ? 0.28 : 0.16;

    try {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(accent ? 1_320 : 950, atTimeSeconds);
      gain.gain.setValueAtTime(0.0001, atTimeSeconds);
      gain.gain.exponentialRampToValueAtTime(peakGain, atTimeSeconds + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, atTimeSeconds + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.addEventListener("ended", () => click.disconnect(), { once: true });
      oscillator.start(atTimeSeconds);
      oscillator.stop(atTimeSeconds + duration + 0.01);
      return click;
    } catch (error: unknown) {
      click.stop();
      throw error;
    }
  }

  close(): Promise<void> {
    return this.context.close();
  }
}

function createBrowserAudioContext(): PracticePulseAudioContext {
  if (typeof AudioContext === "undefined") {
    throw new Error("Web Audio is not supported in this browser.");
  }

  return new BrowserPulseAudioContext(new AudioContext());
}

const browserTimer: PracticePulseTimerBoundary = {
  repeat(callback, intervalMs) {
    const handle = globalThis.setInterval(callback, intervalMs);
    return {
      cancel: () => globalThis.clearInterval(handle),
    };
  },
};

export class WebAudioPracticePulse implements PracticePulsePort {
  private readonly createAudioContext: PracticePulseAudioContextFactory;
  private readonly timerBoundary: PracticePulseTimerBoundary;
  private readonly lookaheadSeconds: number;
  private readonly schedulerIntervalMs: number;
  private readonly startLatencySeconds: number;
  private readonly listeners = new Set<PracticePulseStateListener>();
  private readonly scheduledClicks = new Set<ScheduledClickRecord>();
  private readonly secondsPerBeat: number;
  private state: PracticePulseState;
  private context: PracticePulseAudioContext | null = null;
  private scheduler: PracticePulseRepeatingTimer | null = null;
  private pendingStart: PendingStart | null = null;
  private pulseStartTime = 0;
  private nextClickTime = 0;
  private nextPulseIndex = 0;
  private presentedPulseIndex = -1;
  private epoch = 0;
  private disposed = false;

  constructor(
    private readonly config: PracticePulseConfig,
    options: WebAudioPracticePulseOptions = {},
  ) {
    validateConfig(config);
    validateOptions(options);
    this.createAudioContext = options.createAudioContext ?? createBrowserAudioContext;
    this.timerBoundary = options.timer ?? browserTimer;
    this.lookaheadSeconds = options.lookaheadSeconds ?? DEFAULT_LOOKAHEAD_SECONDS;
    this.schedulerIntervalMs = options.schedulerIntervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS;
    this.startLatencySeconds = options.startLatencySeconds ?? DEFAULT_START_LATENCY_SECONDS;
    this.secondsPerBeat = 60 / config.tempoBpm;
    this.state = {
      status: "stopped",
      tempoBpm: config.tempoBpm,
      currentBeat: null,
      countInBeat: null,
      errorMessage: null,
    };
  }

  getState(): PracticePulseState {
    return copyState(this.state);
  }

  start(): Promise<void> {
    if (this.disposed) {
      return Promise.resolve();
    }

    if (this.pendingStart !== null && this.pendingStart.epoch === this.epoch) {
      return this.pendingStart.promise;
    }

    if (this.state.status === "starting" || this.state.status === "counting-in" || this.state.status === "running") {
      return Promise.resolve();
    }

    const epoch = ++this.epoch;
    const promise = this.beginStart(epoch);
    this.pendingStart = { epoch, promise };
    void promise.finally(() => {
      if (this.pendingStart?.promise === promise) {
        this.pendingStart = null;
      }
    });
    return promise;
  }

  stop(): void {
    if (this.disposed) {
      return;
    }

    this.epoch += 1;
    this.cancelSchedule();
    this.setState({
      status: "stopped",
      tempoBpm: this.config.tempoBpm,
      currentBeat: null,
      countInBeat: null,
      errorMessage: null,
    });
  }

  onStateChange(listener: PracticePulseStateListener): PracticePulseUnsubscribe {
    if (this.disposed) {
      return () => undefined;
    }

    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.epoch += 1;
    this.cancelSchedule();
    const context = this.context;
    this.context = null;
    this.listeners.clear();
    if (context !== null) {
      try {
        void context.close().catch(() => undefined);
      } catch {
        // Closing is best effort after the adapter has detached.
      }
    }
  }

  private async beginStart(epoch: number): Promise<void> {
    try {
      const context = this.context ?? this.createContext();
      this.setState({
        status: "starting",
        tempoBpm: this.config.tempoBpm,
        currentBeat: null,
        countInBeat: null,
        errorMessage: null,
      });
      await context.resume();
      if (!this.isCurrent(epoch)) {
        return;
      }
      if (context.state !== "running") {
        throw new Error("Audio playback is still suspended. Tap start again to retry.");
      }

      this.cancelSchedule();
      this.nextPulseIndex = 0;
      this.presentedPulseIndex = -1;
      this.pulseStartTime = context.currentTime + this.startLatencySeconds;
      this.nextClickTime = this.pulseStartTime;
      this.scheduleWindow(epoch);
      if (!this.isCurrent(epoch)) {
        return;
      }
      this.scheduler = this.timerBoundary.repeat(() => this.scheduleWindow(epoch), this.schedulerIntervalMs);
    } catch (error: unknown) {
      this.fail(epoch, error);
    }
  }

  private createContext(): PracticePulseAudioContext {
    const context = this.createAudioContext();
    this.context = context;
    return context;
  }

  private scheduleWindow(epoch: number): void {
    if (!this.isCurrent(epoch) || this.context === null) {
      return;
    }

    try {
      const currentTime = this.context.currentTime;
      this.releaseElapsedClicks(currentTime);
      this.skipMissedClicks(currentTime);
      const windowEnd = currentTime + this.lookaheadSeconds;
      while (this.isCurrent(epoch) && this.nextClickTime <= windowEnd) {
        this.scheduleNextClick(this.context);
        this.presentReachedPulse(currentTime);
      }
      if (this.isCurrent(epoch)) {
        this.presentReachedPulse(currentTime);
      }
    } catch (error: unknown) {
      this.fail(epoch, error);
    }
  }

  private scheduleNextClick(context: PracticePulseAudioContext): void {
    const pulseIndex = this.nextPulseIndex;
    const { countInBeat, currentBeat } = this.beatAt(pulseIndex);
    const accent = (countInBeat ?? currentBeat) === 1;
    const click = context.scheduleClick(this.nextClickTime, accent);
    this.scheduledClicks.add({
      click,
      endsAtSeconds: this.nextClickTime + CLICK_LIFETIME_SECONDS,
    });
    this.nextPulseIndex += 1;
    this.nextClickTime += this.secondsPerBeat;
  }

  private skipMissedClicks(currentTime: number): void {
    while (this.nextClickTime < currentTime) {
      if (this.nextPulseIndex < this.config.countIn) {
        throw new Error("The count-in was interrupted. Start it again when you are ready.");
      }

      this.nextPulseIndex += 1;
      this.nextClickTime += this.secondsPerBeat;
    }
  }

  private presentReachedPulse(currentTime: number): void {
    if (currentTime < this.pulseStartTime || this.nextPulseIndex === 0) {
      return;
    }

    const reachedPulseIndex = Math.floor((currentTime - this.pulseStartTime) / this.secondsPerBeat);
    const latestScheduledOrSkippedIndex = this.nextPulseIndex - 1;
    const pulseIndex = Math.min(reachedPulseIndex, latestScheduledOrSkippedIndex);
    if (pulseIndex <= this.presentedPulseIndex) {
      return;
    }

    this.presentedPulseIndex = pulseIndex;
    const { countInBeat, currentBeat } = this.beatAt(pulseIndex);
    this.setState({
      status: countInBeat === null ? "running" : "counting-in",
      tempoBpm: this.config.tempoBpm,
      currentBeat,
      countInBeat,
      errorMessage: null,
    });
  }

  private beatAt(pulseIndex: number): { readonly countInBeat: number | null; readonly currentBeat: number | null } {
    const countInBeat = pulseIndex < this.config.countIn ? pulseIndex + 1 : null;
    const runningIndex = pulseIndex - this.config.countIn;
    const currentBeat = countInBeat === null ? (runningIndex % this.config.beatsPerMeasure) + 1 : null;
    return { countInBeat, currentBeat };
  }

  private releaseElapsedClicks(currentTime: number): void {
    for (const record of this.scheduledClicks) {
      if (record.endsAtSeconds <= currentTime) {
        this.scheduledClicks.delete(record);
      }
    }
  }

  private fail(epoch: number, error: unknown): void {
    if (!this.isCurrent(epoch)) {
      return;
    }

    this.epoch += 1;
    this.cancelSchedule();
    this.setState({
      status: "error",
      tempoBpm: this.config.tempoBpm,
      currentBeat: null,
      countInBeat: null,
      errorMessage: errorMessage(error),
    });
  }

  private cancelSchedule(): void {
    try {
      this.scheduler?.cancel();
    } catch {
      // Cancellation must not mask the state transition that requested it.
    }
    this.scheduler = null;
    for (const record of this.scheduledClicks) {
      try {
        record.click.stop();
      } catch {
        // Click cleanup is best effort after its schedule has been invalidated.
      }
    }
    this.scheduledClicks.clear();
  }

  private isCurrent(epoch: number): boolean {
    return !this.disposed && epoch === this.epoch;
  }

  private setState(state: PracticePulseState): void {
    this.state = copyState(state);
    for (const listener of Array.from(this.listeners)) {
      listener(copyState(state));
    }
  }
}
