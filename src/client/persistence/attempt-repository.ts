export const ATTEMPT_STORAGE_KEY = "learn-piano.completed-attempts.v1";

export interface AttemptErrorCounts {
  readonly outOfOrder: number;
  readonly repeated: number;
  readonly wrong: number;
}

export interface AttemptTimingSummary {
  readonly tempoBpm: number;
  readonly assessedIntervals: number;
  readonly onPulse: number;
  readonly early: number;
  readonly late: number;
  readonly meanAbsoluteErrorMs: number;
}

export type AttemptInputKind = "mock" | "web-midi" | "native-midi";

export interface CompletedAttemptRecord {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly inputKind: AttemptInputKind;
  readonly status: "completed";
  readonly errorCounts: AttemptErrorCounts;
  readonly timing?: AttemptTimingSummary;
}

export interface AttemptRepository {
  list(exerciseId: string, exerciseRevision: number): Promise<readonly CompletedAttemptRecord[]>;
  save(attempt: CompletedAttemptRecord): Promise<void>;
}

export function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}
