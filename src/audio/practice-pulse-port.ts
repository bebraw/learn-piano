export type PracticePulseStatus = "stopped" | "starting" | "counting-in" | "running" | "error";

export interface PracticePulseState {
  readonly status: PracticePulseStatus;
  readonly tempoBpm: number;
  readonly currentBeat: number | null;
  readonly countInBeat: number | null;
  readonly errorMessage: string | null;
}

export interface PracticePulseConfig {
  readonly tempoBpm: number;
  readonly countIn: number;
  readonly beatsPerMeasure: number;
}

export type PracticePulseStateListener = (state: PracticePulseState) => void;
export type PracticePulseUnsubscribe = () => void;

export interface PracticePulsePort {
  getState(): PracticePulseState;
  start(): Promise<void>;
  stop(): void;
  onStateChange(listener: PracticePulseStateListener): PracticePulseUnsubscribe;
  dispose(): void;
}
