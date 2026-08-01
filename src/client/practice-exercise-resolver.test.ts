import { describe, expect, it } from "vitest";
import { defaultExercise } from "../exercises/library/index.js";
import { resolveRenderedExercise } from "./practice-exercise-resolver.js";

describe("resolveRenderedExercise", () => {
  it("returns the canonical exercise only when both identity fields match", () => {
    expect(resolveRenderedExercise(defaultExercise.id, String(defaultExercise.revision))).toBe(defaultExercise);
  });

  it.each([
    ["an unknown exercise", "missing-exercise", String(defaultExercise.revision)],
    ["a stale revision", defaultExercise.id, String(defaultExercise.revision + 1)],
    ["a missing exercise ID", undefined, String(defaultExercise.revision)],
    ["a missing revision", defaultExercise.id, undefined],
  ])("fails closed for %s", (_case, exerciseId, exerciseRevision) => {
    expect(resolveRenderedExercise(exerciseId, exerciseRevision)).toBeNull();
  });
});
