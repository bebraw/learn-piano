import { describe, expect, it } from "vitest";
import type { CompletedAttemptRecord } from "./attempt-repository.js";
import { LocalStorageAttemptRepository } from "./local-storage-attempt-repository.js";

class MemoryStorage {
  public readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const firstAttempt = createAttempt({ id: "attempt-1", completedAt: "2026-08-01T08:05:00.000Z" });

describe("LocalStorageAttemptRepository", () => {
  it("returns empty history when nothing has been stored", async () => {
    const repository = new LocalStorageAttemptRepository(new MemoryStorage());

    await expect(repository.list(firstAttempt.exerciseId, firstAttempt.exerciseRevision)).resolves.toEqual([]);
  });

  it("persists a completed attempt and returns it after a new repository is created", async () => {
    const storage = new MemoryStorage();
    await new LocalStorageAttemptRepository(storage).save(firstAttempt);

    const attempts = await new LocalStorageAttemptRepository(storage).list(firstAttempt.exerciseId, firstAttempt.exerciseRevision);

    expect(attempts).toEqual([firstAttempt]);
  });

  it("keeps one record when the same completion is saved more than once", async () => {
    const repository = new LocalStorageAttemptRepository(new MemoryStorage());

    await repository.save(firstAttempt);
    await repository.save(firstAttempt);

    await expect(repository.list(firstAttempt.exerciseId, firstAttempt.exerciseRevision)).resolves.toEqual([firstAttempt]);
  });

  it("filters other exercise identities and orders matching records newest first", async () => {
    const repository = new LocalStorageAttemptRepository(new MemoryStorage());
    const newer = createAttempt({ id: "attempt-2", completedAt: "2026-08-01T09:05:00.000Z" });
    const otherExercise = createAttempt({ id: "attempt-3", exerciseId: "other-exercise" });
    const otherRevision = createAttempt({ id: "attempt-4", exerciseRevision: 2 });

    await repository.save(newer);
    await repository.save(otherExercise);
    await repository.save(otherRevision);
    await repository.save(firstAttempt);

    await expect(repository.list(firstAttempt.exerciseId, firstAttempt.exerciseRevision)).resolves.toEqual([newer, firstAttempt]);
    await expect(repository.list(firstAttempt.exerciseId, otherRevision.exerciseRevision)).resolves.toEqual([otherRevision]);
  });

  it("ignores malformed JSON, unsupported envelopes, and invalid records", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageAttemptRepository(storage, "attempts");

    storage.setItem("attempts", "not json");
    await expect(repository.list(firstAttempt.exerciseId, 1)).resolves.toEqual([]);

    storage.setItem("attempts", JSON.stringify({ schemaVersion: 2, attempts: [firstAttempt] }));
    await expect(repository.list(firstAttempt.exerciseId, 1)).resolves.toEqual([]);

    storage.setItem(
      "attempts",
      JSON.stringify({ schemaVersion: 1, attempts: [firstAttempt, { ...firstAttempt, id: "", status: "failed" }] }),
    );
    await expect(repository.list(firstAttempt.exerciseId, 1)).resolves.toEqual([firstAttempt]);
  });

  it("bounds retained history and rejects invalid configuration or records", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageAttemptRepository(storage, "attempts", 1);
    const newer = createAttempt({ id: "attempt-2", completedAt: "2026-08-01T09:05:00.000Z" });

    await repository.save(firstAttempt);
    await repository.save(newer);

    await expect(repository.list(firstAttempt.exerciseId, 1)).resolves.toEqual([newer]);
    expect(() => new LocalStorageAttemptRepository(storage, "attempts", 0)).toThrow(RangeError);
    await expect(repository.save({ ...firstAttempt, exerciseRevision: 0 })).rejects.toThrow(TypeError);
  });

  it("surfaces storage access and quota failures to the controller boundary", async () => {
    const storage = {
      getItem(): string | null {
        throw new DOMException("Blocked", "SecurityError");
      },
      setItem(): void {
        throw new DOMException("Full", "QuotaExceededError");
      },
    };
    const repository = new LocalStorageAttemptRepository(storage);

    await expect(repository.list(firstAttempt.exerciseId, 1)).rejects.toThrow("Blocked");

    const writeOnlyFailure = new LocalStorageAttemptRepository({
      getItem: () => null,
      setItem: storage.setItem,
    });
    await expect(writeOnlyFailure.save(firstAttempt)).rejects.toThrow("Full");
  });
});

function createAttempt(overrides: Partial<CompletedAttemptRecord>): CompletedAttemptRecord {
  return {
    schemaVersion: 1,
    id: "attempt",
    exerciseId: "five-note-ascent-c-major-right-hand",
    exerciseRevision: 1,
    startedAt: "2026-08-01T08:00:00.000Z",
    completedAt: "2026-08-01T08:01:00.000Z",
    inputKind: "mock",
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
    ...overrides,
  };
}
