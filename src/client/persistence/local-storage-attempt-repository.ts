import { ATTEMPT_STORAGE_KEY, type AttemptInputKind, type AttemptRepository, type CompletedAttemptRecord } from "./attempt-repository.js";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AttemptEnvelopeV1 {
  readonly schemaVersion: 1;
  readonly attempts: readonly CompletedAttemptRecord[];
}

const DEFAULT_MAX_ATTEMPTS = 100;

export class LocalStorageAttemptRepository implements AttemptRepository {
  public constructor(
    private readonly storage: StorageLike,
    private readonly key = ATTEMPT_STORAGE_KEY,
    private readonly maxAttempts = DEFAULT_MAX_ATTEMPTS,
  ) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new RangeError("maxAttempts must be a positive integer");
    }
  }

  public async list(exerciseId: string, exerciseRevision: number): Promise<readonly CompletedAttemptRecord[]> {
    return this.readAttempts()
      .filter((attempt) => attempt.exerciseId === exerciseId && attempt.exerciseRevision === exerciseRevision)
      .sort(compareNewestFirst);
  }

  public async save(attempt: CompletedAttemptRecord): Promise<void> {
    if (!isCompletedAttemptRecord(attempt)) {
      throw new TypeError("Cannot persist an invalid completed attempt");
    }

    const withoutDuplicate = this.readAttempts().filter((storedAttempt) => storedAttempt.id !== attempt.id);
    const attempts = [...withoutDuplicate, attempt].sort(compareOldestFirst).slice(-this.maxAttempts);
    const envelope: AttemptEnvelopeV1 = { schemaVersion: 1, attempts };
    this.storage.setItem(this.key, JSON.stringify(envelope));
  }

  private readAttempts(): CompletedAttemptRecord[] {
    const serialized = this.storage.getItem(this.key);

    if (serialized === null) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(serialized);
      return readEnvelope(parsed);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return [];
      }

      throw error;
    }
  }
}

function readEnvelope(value: unknown): CompletedAttemptRecord[] {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.attempts)) {
    return [];
  }

  return value.attempts.filter(isCompletedAttemptRecord);
}

function isCompletedAttemptRecord(value: unknown): value is CompletedAttemptRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.exerciseId === "string" &&
    value.exerciseId.length > 0 &&
    isPositiveInteger(value.exerciseRevision) &&
    isIsoDate(value.startedAt) &&
    isIsoDate(value.completedAt) &&
    isAttemptInputKind(value.inputKind) &&
    value.status === "completed" &&
    isErrorCounts(value.errorCounts) &&
    (value.timing === undefined || isTimingSummary(value.timing))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isAttemptInputKind(value: unknown): value is AttemptInputKind {
  return value === "mock" || value === "web-midi" || value === "native-midi";
}

function isErrorCounts(value: unknown): value is CompletedAttemptRecord["errorCounts"] {
  return (
    isRecord(value) && isNonNegativeInteger(value.outOfOrder) && isNonNegativeInteger(value.repeated) && isNonNegativeInteger(value.wrong)
  );
}

function isTimingSummary(value: unknown): value is NonNullable<CompletedAttemptRecord["timing"]> {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.tempoBpm) ||
    !isNonNegativeInteger(value.assessedIntervals) ||
    !isNonNegativeInteger(value.onPulse) ||
    !isNonNegativeInteger(value.early) ||
    !isNonNegativeInteger(value.late) ||
    typeof value.meanAbsoluteErrorMs !== "number" ||
    !Number.isFinite(value.meanAbsoluteErrorMs) ||
    value.meanAbsoluteErrorMs < 0
  ) {
    return false;
  }

  return value.assessedIntervals === value.onPulse + value.early + value.late;
}

function compareNewestFirst(left: CompletedAttemptRecord, right: CompletedAttemptRecord): number {
  return Date.parse(right.completedAt) - Date.parse(left.completedAt);
}

function compareOldestFirst(left: CompletedAttemptRecord, right: CompletedAttemptRecord): number {
  return Date.parse(left.completedAt) - Date.parse(right.completedAt);
}
