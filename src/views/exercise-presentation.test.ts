import { describe, expect, it } from "vitest";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import type { Exercise } from "../exercises/types.js";
import {
  exercisePracticeHref,
  formatExerciseCategory,
  formatExerciseDifficulty,
  formatExerciseHand,
  formatExerciseNoteOrder,
} from "./exercise-presentation.js";

describe("exercise presentation", () => {
  it("derives labels and links from canonical exercise data", () => {
    expect(exercisePracticeHref(fiveNoteAscentExercise)).toBe("/practice?exercise=five-note-ascent-c-major-right-hand");
    expect(formatExerciseNoteOrder(fiveNoteAscentExercise)).toBe("C4 · D4 · E4 · F4 · G4");
    expect(formatExerciseHand(fiveNoteAscentExercise)).toBe("Right hand");
    expect(formatExerciseCategory(fiveNoteAscentExercise)).toBe("Notes and reading");
    expect(formatExerciseDifficulty(fiveNoteAscentExercise)).toBe("Beginner");
  });

  it("handles left-hand, both-hands, and fallback category labels", () => {
    const leftHand: Exercise = {
      ...fiveNoteAscentExercise,
      id: "left hand/one",
      curriculumTags: ["sight-reading.steps"],
      expectedEvents: fiveNoteAscentExercise.expectedEvents.map((event) => ({ ...event, hand: "left" })),
    };
    const bothHands: Exercise = {
      ...leftHand,
      expectedEvents: [leftHand.expectedEvents[0]!, { ...leftHand.expectedEvents[1]!, hand: "right" }],
    };

    expect(exercisePracticeHref(leftHand)).toBe("/practice?exercise=left%20hand%2Fone");
    expect(formatExerciseHand(leftHand)).toBe("Left hand");
    expect(formatExerciseHand(bothHands)).toBe("Both hands");
    expect(formatExerciseCategory(leftHand)).toBe("Sight reading");
  });

  it("uses a calm fallback when curriculum tags are absent", () => {
    expect(formatExerciseCategory({ ...fiveNoteAscentExercise, curriculumTags: [] })).toBe("Focused practice");
    expect(
      formatExerciseHand({
        ...fiveNoteAscentExercise,
        expectedEvents: [{ ...fiveNoteAscentExercise.expectedEvents[0]!, hand: "both" }],
      }),
    ).toBe("Both hands");
  });
});
