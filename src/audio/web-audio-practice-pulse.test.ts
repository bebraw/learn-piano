import { afterEach, describe, expect, it, vi } from "vitest";
import type { PracticePulseConfig, PracticePulseState } from "./practice-pulse-port.js";
import {
  WebAudioPracticePulse,
  type PracticePulseAudioContext,
  type PracticePulseRepeatingTimer,
  type PracticePulseScheduledClick,
  type PracticePulseTimerBoundary,
  type WebAudioPracticePulseOptions,
} from "./web-audio-practice-pulse.js";

const FOUR_FOUR_AT_60: PracticePulseConfig = {
  tempoBpm: 60,
  countIn: 4,
  beatsPerMeasure: 4,
};

class FakeScheduledClick implements PracticePulseScheduledClick {
  stopCalls = 0;

  stop(): void {
    this.stopCalls += 1;
  }
}

interface ScheduledCall {
  readonly atTimeSeconds: number;
  readonly accent: boolean;
  readonly click: FakeScheduledClick;
}

class FakeAudioContext implements PracticePulseAudioContext {
  currentTime = 0;
  state = "suspended";
  resumeCalls = 0;
  closeCalls = 0;
  readonly scheduledCalls: ScheduledCall[] = [];
  resumeBehavior: () => Promise<void> = async () => {
    this.state = "running";
  };
  scheduleError: unknown = null;
  closeBehavior: () => Promise<void> = async () => undefined;

  async resume(): Promise<void> {
    this.resumeCalls += 1;
    await this.resumeBehavior();
  }

  scheduleClick(atTimeSeconds: number, accent: boolean): PracticePulseScheduledClick {
    if (this.scheduleError !== null) {
      throw this.scheduleError;
    }
    const click = new FakeScheduledClick();
    this.scheduledCalls.push({ atTimeSeconds, accent, click });
    return click;
  }

  async close(): Promise<void> {
    this.closeCalls += 1;
    await this.closeBehavior();
  }
}

class ManualRepeatingTimer implements PracticePulseRepeatingTimer {
  cancelled = false;

  constructor(readonly callback: () => void) {}

  cancel(): void {
    this.cancelled = true;
  }

  run(): void {
    if (!this.cancelled) {
      this.callback();
    }
  }

  runStaleCallback(): void {
    this.callback();
  }
}

class ManualTimerBoundary implements PracticePulseTimerBoundary {
  readonly timers: ManualRepeatingTimer[] = [];
  readonly intervals: number[] = [];

  repeat(callback: () => void, intervalMs: number): PracticePulseRepeatingTimer {
    const timer = new ManualRepeatingTimer(callback);
    this.timers.push(timer);
    this.intervals.push(intervalMs);
    return timer;
  }

  latest(): ManualRepeatingTimer {
    const timer = this.timers.at(-1);
    if (timer === undefined) {
      throw new Error("Expected a repeating timer.");
    }
    return timer;
  }
}

function testPort(
  context: FakeAudioContext,
  timer: PracticePulseTimerBoundary = new ManualTimerBoundary(),
  config: PracticePulseConfig = FOUR_FOUR_AT_60,
  overrides: WebAudioPracticePulseOptions = {},
): WebAudioPracticePulse {
  return new WebAudioPracticePulse(config, {
    createAudioContext: () => context,
    timer,
    lookaheadSeconds: 0.01,
    schedulerIntervalMs: 20,
    startLatencySeconds: 0,
    ...overrides,
  });
}

function advanceTo(context: FakeAudioContext, timer: ManualRepeatingTimer, timeSeconds: number): void {
  context.currentTime = timeSeconds;
  timer.run();
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolvePromise: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve: () => {
      if (resolvePromise === undefined) {
        throw new Error("Deferred promise was not initialized.");
      }
      resolvePromise();
    },
  };
}

describe("WebAudioPracticePulse", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not create or resume audio before a user-triggered start", async () => {
    const context = new FakeAudioContext();
    const createAudioContext = vi.fn(() => context);
    const port = new WebAudioPracticePulse(FOUR_FOUR_AT_60, { createAudioContext });

    expect(port.getState()).toEqual({
      status: "stopped",
      tempoBpm: 60,
      currentBeat: null,
      countInBeat: null,
      errorMessage: null,
    });
    expect(createAudioContext).not.toHaveBeenCalled();
    expect(context.resumeCalls).toBe(0);

    await port.start();

    expect(createAudioContext).toHaveBeenCalledOnce();
    expect(context.resumeCalls).toBe(1);
    port.dispose();
  });

  it("emits four count-in beats before wrapping running beats by measure", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const states: PracticePulseState[] = [];
    const port = testPort(context, timer);
    port.onStateChange((state) => states.push(state));

    await port.start();
    const scheduler = timer.latest();
    for (let second = 1; second <= 8; second += 1) {
      advanceTo(context, scheduler, second);
    }

    const pulseStates = states.filter((state) => state.countInBeat !== null || state.currentBeat !== null);
    expect(pulseStates.map(({ status, countInBeat, currentBeat }) => ({ status, countInBeat, currentBeat }))).toEqual([
      { status: "counting-in", countInBeat: 1, currentBeat: null },
      { status: "counting-in", countInBeat: 2, currentBeat: null },
      { status: "counting-in", countInBeat: 3, currentBeat: null },
      { status: "counting-in", countInBeat: 4, currentBeat: null },
      { status: "running", countInBeat: null, currentBeat: 1 },
      { status: "running", countInBeat: null, currentBeat: 2 },
      { status: "running", countInBeat: null, currentBeat: 3 },
      { status: "running", countInBeat: null, currentBeat: 4 },
      { status: "running", countInBeat: null, currentBeat: 1 },
    ]);
    expect(context.scheduledCalls.map(({ atTimeSeconds }) => atTimeSeconds)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(context.scheduledCalls.map(({ accent }) => accent)).toEqual([true, false, false, false, true, false, false, false, true]);
    expect(timer.intervals).toEqual([20]);
    port.dispose();
  });

  it("starts immediately on beat one when count-in is disabled", async () => {
    const context = new FakeAudioContext();
    const port = testPort(context, new ManualTimerBoundary(), { ...FOUR_FOUR_AT_60, countIn: 0 });

    await port.start();

    expect(port.getState()).toEqual({
      status: "running",
      tempoBpm: 60,
      currentBeat: 1,
      countInBeat: null,
      errorMessage: null,
    });
    expect(context.scheduledCalls[0]?.accent).toBe(true);
    port.dispose();
  });

  it("does not expose a scheduled count-in beat before its audio boundary", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const port = testPort(context, timer, FOUR_FOUR_AT_60, {
      lookaheadSeconds: 0.1,
      startLatencySeconds: 0.05,
    });

    await port.start();
    const scheduler = timer.latest();

    expect(context.scheduledCalls.map(({ atTimeSeconds }) => atTimeSeconds)).toEqual([0.05]);
    expect(port.getState()).toMatchObject({ status: "starting", countInBeat: null });

    advanceTo(context, scheduler, 0.049);
    expect(port.getState()).toMatchObject({ status: "starting", countInBeat: null });

    advanceTo(context, scheduler, 0.05);
    expect(port.getState()).toMatchObject({ status: "counting-in", countInBeat: 1 });
    port.dispose();
  });

  it("fails an interrupted count-in instead of backfilling missed clicks", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const port = testPort(context, timer, FOUR_FOUR_AT_60, {
      lookaheadSeconds: 0.1,
      startLatencySeconds: 0.05,
    });

    await port.start();
    advanceTo(context, timer.latest(), 2);

    expect(context.scheduledCalls.map(({ atTimeSeconds }) => atTimeSeconds)).toEqual([0.05]);
    expect(port.getState()).toMatchObject({
      status: "error",
      errorMessage: "The count-in was interrupted. Start it again when you are ready.",
    });
    port.dispose();
  });

  it("skips missed running beats without scheduling an audible burst", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const port = testPort(context, timer, { ...FOUR_FOUR_AT_60, countIn: 0 });

    await port.start();
    advanceTo(context, timer.latest(), 5);

    expect(context.scheduledCalls.map(({ atTimeSeconds }) => atTimeSeconds)).toEqual([0, 5]);
    expect(port.getState()).toMatchObject({ status: "running", currentBeat: 2 });
    port.dispose();
  });

  it("uses the configured tempo to place clicks on the audio timeline", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const port = testPort(context, timer, { tempoBpm: 120, countIn: 4, beatsPerMeasure: 3 });

    await port.start();
    const scheduler = timer.latest();
    for (const time of [0.5, 1, 1.5, 2]) {
      advanceTo(context, scheduler, time);
    }

    expect(context.scheduledCalls.map(({ atTimeSeconds }) => atTimeSeconds)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(port.getState().currentBeat).toBe(1);
    port.dispose();
  });

  it("stops the scheduler and pending click nodes and ignores stale callbacks", async () => {
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    const port = testPort(context, timer, FOUR_FOUR_AT_60, {
      lookaheadSeconds: 0.1,
      startLatencySeconds: 0.05,
    });

    await port.start();
    const scheduler = timer.latest();
    const click = context.scheduledCalls[0]?.click;
    port.stop();

    expect(scheduler.cancelled).toBe(true);
    expect(click?.stopCalls).toBe(1);
    expect(port.getState()).toEqual({
      status: "stopped",
      tempoBpm: 60,
      currentBeat: null,
      countInBeat: null,
      errorMessage: null,
    });
    scheduler.runStaleCallback();
    expect(context.scheduledCalls).toHaveLength(1);
    port.dispose();
  });

  it("honors reentrant cancellation before scheduling the rest of a lookahead window", async () => {
    const context = new FakeAudioContext();
    const port = testPort(context, new ManualTimerBoundary(), { tempoBpm: 600, countIn: 4, beatsPerMeasure: 4 }, { lookaheadSeconds: 1 });
    port.onStateChange((state) => {
      if (state.countInBeat === 1) {
        port.stop();
      }
    });

    await port.start();

    expect(context.scheduledCalls).toHaveLength(1);
    expect(context.scheduledCalls[0]?.click.stopCalls).toBe(1);
    expect(port.getState().status).toBe("stopped");
    port.dispose();
  });

  it("cancels a pending resume by epoch without installing a scheduler", async () => {
    const gate = deferred();
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    context.resumeBehavior = async () => {
      await gate.promise;
      context.state = "running";
    };
    const port = testPort(context, timer);

    const firstStart = port.start();
    const duplicateStart = port.start();
    expect(duplicateStart).toBe(firstStart);
    expect(context.resumeCalls).toBe(1);
    port.stop();
    gate.resolve();
    await firstStart;

    expect(context.scheduledCalls).toEqual([]);
    expect(timer.timers).toEqual([]);
    expect(port.getState().status).toBe("stopped");
    port.dispose();
  });

  it("allows a fresh start while a cancelled resume is still settling", async () => {
    const firstGate = deferred();
    const context = new FakeAudioContext();
    const timer = new ManualTimerBoundary();
    let resumeCall = 0;
    context.resumeBehavior = async () => {
      resumeCall += 1;
      if (resumeCall === 1) {
        await firstGate.promise;
      }
      context.state = "running";
    };
    const port = testPort(context, timer);

    const cancelledStart = port.start();
    port.stop();
    await port.start();
    firstGate.resolve();
    await cancelledStart;

    expect(context.resumeCalls).toBe(2);
    expect(context.scheduledCalls).toHaveLength(1);
    expect(timer.timers).toHaveLength(1);
    port.dispose();
  });

  it("reports audio creation, resume, and scheduling failures as recoverable state", async () => {
    const creationFailure = new WebAudioPracticePulse(FOUR_FOUR_AT_60, {
      createAudioContext: () => {
        throw new Error("Audio hardware is unavailable.");
      },
    });
    await expect(creationFailure.start()).resolves.toBeUndefined();
    expect(creationFailure.getState().errorMessage).toBe("Audio hardware is unavailable.");

    const suspendedContext = new FakeAudioContext();
    suspendedContext.resumeBehavior = async () => undefined;
    const resumeFailure = testPort(suspendedContext);
    await resumeFailure.start();
    expect(resumeFailure.getState()).toMatchObject({
      status: "error",
      errorMessage: "Audio playback is still suspended. Tap start again to retry.",
    });

    const scheduleContext = new FakeAudioContext();
    scheduleContext.scheduleError = new Error("Click scheduling failed.");
    const scheduleFailure = testPort(scheduleContext);
    await scheduleFailure.start();
    expect(scheduleFailure.getState()).toMatchObject({ status: "error", errorMessage: "Click scheduling failed." });

    const genericFailure = new WebAudioPracticePulse(FOUR_FOUR_AT_60, {
      createAudioContext: () => {
        throw "not an Error";
      },
    });
    await genericFailure.start();
    expect(genericFailure.getState().errorMessage).toBe("The practice pulse could not start.");

    creationFailure.dispose();
    resumeFailure.dispose();
    scheduleFailure.dispose();
    genericFailure.dispose();
  });

  it("recovers from an error on a later start", async () => {
    const context = new FakeAudioContext();
    context.scheduleError = new Error("Temporary failure");
    const port = testPort(context);

    await port.start();
    expect(port.getState().status).toBe("error");
    context.scheduleError = null;
    await port.start();

    expect(port.getState()).toMatchObject({ status: "counting-in", countInBeat: 1, errorMessage: null });
    expect(context.resumeCalls).toBe(2);
    port.dispose();
  });

  it("fails calmly when timer installation throws and stops the scheduled click", async () => {
    const context = new FakeAudioContext();
    const timer: PracticePulseTimerBoundary = {
      repeat: () => {
        throw new Error("Timer installation failed.");
      },
    };
    const port = testPort(context, timer);

    await port.start();

    expect(port.getState()).toMatchObject({ status: "error", errorMessage: "Timer installation failed." });
    expect(context.scheduledCalls[0]?.click.stopCalls).toBe(1);
    port.dispose();
  });

  it("contains timer and click cleanup failures while stopping", async () => {
    const context = new FakeAudioContext();
    const click: PracticePulseScheduledClick = {
      stop: () => {
        throw new Error("Click already stopped.");
      },
    };
    context.scheduleClick = () => click;
    const timer: PracticePulseTimerBoundary = {
      repeat: () => ({
        cancel: () => {
          throw new Error("Timer already cancelled.");
        },
      }),
    };
    const port = testPort(context, timer);
    await port.start();

    expect(() => port.stop()).not.toThrow();
    expect(port.getState().status).toBe("stopped");
    port.dispose();
  });

  it("sends an initial snapshot, supports unsubscribe, and detaches listeners on dispose", async () => {
    const context = new FakeAudioContext();
    const listener = vi.fn<(state: PracticePulseState) => void>();
    const detachedListener = vi.fn<(state: PracticePulseState) => void>();
    const port = testPort(context);

    port.onStateChange(listener);
    const unsubscribe = port.onStateChange(detachedListener);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ status: "stopped" }));
    unsubscribe();
    await port.start();

    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ countInBeat: 1 }));
    expect(detachedListener).toHaveBeenCalledTimes(1);
    port.dispose();
    expect(port.onStateChange(listener)).toBeTypeOf("function");
    port.stop();
    await port.start();
    port.dispose();
  });

  it("closes audio exactly once on dispose and contains close failures", async () => {
    const context = new FakeAudioContext();
    context.closeBehavior = async () => Promise.reject(new Error("Already closed"));
    const port = testPort(context);
    await port.start();

    expect(() => port.dispose()).not.toThrow();
    port.dispose();
    expect(context.closeCalls).toBe(1);

    const synchronousCloseContext = new FakeAudioContext();
    synchronousCloseContext.close = () => {
      synchronousCloseContext.closeCalls += 1;
      throw new Error("Synchronous close failure");
    };
    const secondPort = testPort(synchronousCloseContext);
    await secondPort.start();
    expect(() => secondPort.dispose()).not.toThrow();
  });

  it.each([
    [{ ...FOUR_FOUR_AT_60, tempoBpm: 0 }, "tempoBpm must be a positive finite number."],
    [{ ...FOUR_FOUR_AT_60, tempoBpm: Number.POSITIVE_INFINITY }, "tempoBpm must be a positive finite number."],
    [{ ...FOUR_FOUR_AT_60, countIn: -1 }, "countIn must be a non-negative integer."],
    [{ ...FOUR_FOUR_AT_60, countIn: 1.5 }, "countIn must be a non-negative integer."],
    [{ ...FOUR_FOUR_AT_60, beatsPerMeasure: 0 }, "beatsPerMeasure must be a positive integer."],
    [{ ...FOUR_FOUR_AT_60, beatsPerMeasure: 1.5 }, "beatsPerMeasure must be a positive integer."],
  ])("rejects invalid pulse config %#", (config, message) => {
    expect(() => new WebAudioPracticePulse(config)).toThrow(message);
  });

  it.each([
    [{ lookaheadSeconds: 0 }, "lookaheadSeconds must be a positive finite number."],
    [{ schedulerIntervalMs: 0 }, "schedulerIntervalMs must be a positive finite number."],
    [{ startLatencySeconds: -1 }, "startLatencySeconds must be a non-negative finite number."],
    [{ startLatencySeconds: Number.NaN }, "startLatencySeconds must be a non-negative finite number."],
  ])("rejects invalid scheduler options %#", (options, message) => {
    expect(() => new WebAudioPracticePulse(FOUR_FOUR_AT_60, options)).toThrow(message);
  });
});

class FakeNativeAudioParam {
  readonly values: { readonly method: "set" | "ramp"; readonly value: number; readonly time: number }[] = [];
  throwOnSet = false;

  setValueAtTime(value: number, time: number): void {
    if (this.throwOnSet) {
      throw new Error("Parameter scheduling failed.");
    }
    this.values.push({ method: "set", value, time });
  }

  exponentialRampToValueAtTime(value: number, time: number): void {
    this.values.push({ method: "ramp", value, time });
  }
}

class FakeNativeOscillator {
  type = "triangle";
  readonly frequency = new FakeNativeAudioParam();
  readonly startTimes: number[] = [];
  readonly stopTimes: (number | undefined)[] = [];
  connectCalls = 0;
  disconnectCalls = 0;
  throwOnImmediateStop = false;
  throwOnDisconnect = false;
  endedListener: (() => void) | null = null;

  connect(): void {
    this.connectCalls += 1;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
    if (this.throwOnDisconnect) {
      throw new Error("Oscillator already disconnected.");
    }
  }

  addEventListener(type: string, listener: () => void, options: { readonly once: boolean }): void {
    expect(type).toBe("ended");
    expect(options).toEqual({ once: true });
    this.endedListener = listener;
  }

  start(time: number): void {
    this.startTimes.push(time);
  }

  stop(time?: number): void {
    this.stopTimes.push(time);
    if (time === undefined && this.throwOnImmediateStop) {
      throw new Error("Oscillator already ended.");
    }
  }
}

class FakeNativeGain {
  readonly gain = new FakeNativeAudioParam();
  connectCalls = 0;
  disconnectCalls = 0;
  throwOnDisconnect = false;

  connect(): void {
    this.connectCalls += 1;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
    if (this.throwOnDisconnect) {
      throw new Error("Gain already disconnected.");
    }
  }
}

class FakeNativeAudioContext {
  static instances: FakeNativeAudioContext[] = [];

  currentTime = 3;
  state = "suspended";
  readonly destination = {};
  readonly oscillators: FakeNativeOscillator[] = [];
  readonly gains: FakeNativeGain[] = [];
  closeCalls = 0;
  failParameterScheduling = false;

  constructor() {
    FakeNativeAudioContext.instances.push(this);
  }

  async resume(): Promise<void> {
    this.state = "running";
  }

  createOscillator(): FakeNativeOscillator {
    const oscillator = new FakeNativeOscillator();
    oscillator.frequency.throwOnSet = this.failParameterScheduling;
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain(): FakeNativeGain {
    const gain = new FakeNativeGain();
    this.gains.push(gain);
    return gain;
  }

  async close(): Promise<void> {
    this.closeCalls += 1;
    this.state = "closed";
  }
}

describe("browser audio boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeNativeAudioContext.instances = [];
  });

  it("creates native Web Audio on start and schedules accented oscillator envelopes", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeNativeAudioContext);
    const port = new WebAudioPracticePulse(FOUR_FOUR_AT_60);

    expect(FakeNativeAudioContext.instances).toHaveLength(0);
    await port.start();

    const context = FakeNativeAudioContext.instances[0];
    const oscillator = context?.oscillators[0];
    const gain = context?.gains[0];
    expect(context).toBeDefined();
    expect(oscillator).toMatchObject({ type: "sine", connectCalls: 1, startTimes: [3.05] });
    expect(oscillator?.stopTimes[0]).toBeCloseTo(3.115);
    expect(oscillator?.frequency.values).toEqual([{ method: "set", value: 1_320, time: 3.05 }]);
    expect(gain?.gain.values).toEqual([
      { method: "set", value: 0.0001, time: 3.05 },
      { method: "ramp", value: 0.28, time: 3.054 },
      { method: "ramp", value: 0.0001, time: 3.105 },
    ]);
    expect(gain?.connectCalls).toBe(1);

    oscillator?.endedListener?.();
    expect(oscillator?.disconnectCalls).toBe(1);
    expect(gain?.disconnectCalls).toBe(1);
    port.dispose();
    expect(context?.closeCalls).toBe(1);
  });

  it("contains native cleanup exceptions when stopping scheduled nodes", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeNativeAudioContext);
    const port = new WebAudioPracticePulse(FOUR_FOUR_AT_60);
    await port.start();
    const context = FakeNativeAudioContext.instances[0];
    const oscillator = context?.oscillators[0];
    const gain = context?.gains[0];
    if (oscillator === undefined || gain === undefined) {
      throw new Error("Expected native click nodes.");
    }
    oscillator.throwOnImmediateStop = true;
    oscillator.throwOnDisconnect = true;
    gain.throwOnDisconnect = true;

    expect(() => port.stop()).not.toThrow();
    expect(oscillator.stopTimes[0]).toBeCloseTo(3.115);
    expect(oscillator.stopTimes[1]).toBeUndefined();
    expect(oscillator.disconnectCalls).toBe(1);
    expect(gain.disconnectCalls).toBe(1);
    port.dispose();
  });

  it("cleans partially created nodes and reports native scheduling errors", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("AudioContext", FakeNativeAudioContext);
    const port = new WebAudioPracticePulse(FOUR_FOUR_AT_60);
    const start = port.start();
    const context = FakeNativeAudioContext.instances[0];
    if (context === undefined) {
      throw new Error("Expected a native audio context.");
    }
    context.failParameterScheduling = true;
    await start;

    // The first oscillator may have been created before the flag changed, so retry
    // after stopping guarantees the failing native path is exercised.
    port.stop();
    await port.start();
    expect(port.getState()).toMatchObject({ status: "error", errorMessage: "Parameter scheduling failed." });
    expect(context.oscillators.at(-1)?.stopTimes).toContain(undefined);
    port.dispose();
  });

  it("reports unsupported Web Audio without throwing from start", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const port = new WebAudioPracticePulse(FOUR_FOUR_AT_60);

    await expect(port.start()).resolves.toBeUndefined();
    expect(port.getState()).toMatchObject({
      status: "error",
      errorMessage: "Web Audio is not supported in this browser.",
    });
    port.dispose();
  });
});
