export const ATTEMPT_STORAGE_KEY = "learn-piano.completed-attempts.v1";

export interface AttemptErrorCounts {
  readonly outOfOrder: number;
  readonly repeated: number;
  readonly wrong: number;
}

export type AttemptInputKind = "mock" | "web-midi";

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
}

export interface AttemptRepository {
  list(exerciseId: string, exerciseRevision: number): Promise<readonly CompletedAttemptRecord[]>;
  save(attempt: CompletedAttemptRecord): Promise<void>;
}
