import { describe, expect, it } from "vitest";
import { fiveNoteAscentExercise } from "./library/five-note-ascent.js";
import { ExerciseValidationError, parseExercise, parseExerciseLibrary } from "./schema.js";

interface MutableExpectedEvent {
  id: string;
  kind: string;
  noteNumber: number;
  hand: string;
}

interface MutableExerciseDocument {
  schemaVersion: number;
  id: string;
  revision: number;
  title: string;
  instructions: string;
  evaluationMode: string;
  difficulty: string;
  expectedEvents: MutableExpectedEvent[];
  source: { kind: string; attribution?: string; license?: string };
  prerequisites: unknown;
  curriculumTags: unknown;
  repertoireGoalTags: unknown;
}

function createExerciseDocument(): MutableExerciseDocument {
  return {
    schemaVersion: 1,
    id: "test-exercise",
    revision: 1,
    title: "Test exercise",
    instructions: "Play the notes.",
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: [
      { id: "first-note", kind: "note", noteNumber: 60, hand: "right" },
      { id: "second-note", kind: "note", noteNumber: 62, hand: "right" },
    ],
    source: { kind: "original", attribution: "Test suite" },
    prerequisites: [],
    curriculumTags: ["notes-and-reading.keyboard-geography"],
    repertoireGoalTags: [],
  };
}

function expectInvalid(document: unknown, path: string): void {
  try {
    parseExercise(document);
    throw new Error("Expected exercise validation to fail");
  } catch (error) {
    if (!(error instanceof ExerciseValidationError)) {
      throw error;
    }

    expect(error.issues.some((issue) => issue.path === path)).toBe(true);
  }
}

describe("fiveNoteAscentExercise", () => {
  it("defines the canonical first-slice exercise", () => {
    expect(fiveNoteAscentExercise).toMatchObject({
      schemaVersion: 1,
      id: "five-note-ascent-c-major-right-hand",
      revision: 1,
      evaluationMode: "untimed-ordered-notes",
      difficulty: "beginner",
      source: { kind: "original" },
      repertoireGoalTags: [],
    });
    expect(fiveNoteAscentExercise.expectedEvents).toEqual([
      { id: "right-hand-c4", kind: "note", noteNumber: 60, hand: "right" },
      { id: "right-hand-d4", kind: "note", noteNumber: 62, hand: "right" },
      { id: "right-hand-e4", kind: "note", noteNumber: 64, hand: "right" },
      { id: "right-hand-f4", kind: "note", noteNumber: 65, hand: "right" },
      { id: "right-hand-g4", kind: "note", noteNumber: 67, hand: "right" },
    ]);
  });
});

describe("parseExercise", () => {
  it("returns a typed version-1 exercise", () => {
    const exercise = parseExercise(createExerciseDocument());

    expect(exercise.id).toBe("test-exercise");
    expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([60, 62]);
  });

  it("rejects a non-object document", () => {
    expectInvalid(null, "exercise");
  });

  it("rejects an unknown schema version", () => {
    const document = createExerciseDocument();
    document.schemaVersion = 2;

    expectInvalid(document, "exercise.schemaVersion");
  });

  it("rejects an unknown evaluation mode", () => {
    const document = createExerciseDocument();
    document.evaluationMode = "timed-notes";

    expectInvalid(document, "exercise.evaluationMode");
  });

  it("rejects missing exercise and event IDs", () => {
    const document = createExerciseDocument();
    document.id = "";
    document.expectedEvents[0]!.id = "";

    expect(() => parseExercise(document)).toThrow(ExerciseValidationError);
    expectInvalid(document, "exercise.id");
    expectInvalid(document, "exercise.expectedEvents[0].id");
  });

  it("rejects duplicate expected-event IDs", () => {
    const document = createExerciseDocument();
    document.expectedEvents[1]!.id = document.expectedEvents[0]!.id;

    expectInvalid(document, "exercise.expectedEvents[1].id");
  });

  it("rejects an empty expected-event list", () => {
    const document = createExerciseDocument();
    document.expectedEvents = [];

    expectInvalid(document, "exercise.expectedEvents");
  });

  it.each([0, -1, 1.5])("rejects non-positive or fractional revision %s", (revision) => {
    const document = createExerciseDocument();
    document.revision = revision;

    expectInvalid(document, "exercise.revision");
  });

  it.each([-1, 128, 60.5])("rejects out-of-range or fractional MIDI note %s", (noteNumber) => {
    const document = createExerciseDocument();
    document.expectedEvents[0]!.noteNumber = noteNumber;

    expectInvalid(document, "exercise.expectedEvents[0].noteNumber");
  });

  it("rejects invalid hand, event kind, difficulty, and source values", () => {
    const document = createExerciseDocument();
    document.expectedEvents[0]!.hand = "middle";
    document.expectedEvents[0]!.kind = "chord";
    document.difficulty = "impossible";
    document.source.kind = "unknown";

    expect(() => parseExercise(document)).toThrow(ExerciseValidationError);
    expectInvalid(document, "exercise.expectedEvents[0].hand");
    expectInvalid(document, "exercise.expectedEvents[0].kind");
    expectInvalid(document, "exercise.difficulty");
    expectInvalid(document, "exercise.source.kind");
  });

  it("rejects malformed events, source metadata, and string lists", () => {
    const document = createExerciseDocument();
    const malformed = {
      ...document,
      expectedEvents: [null],
      source: null,
      prerequisites: "none",
      curriculumTags: ["valid", "valid", ""],
      repertoireGoalTags: [7],
    };

    expect(() => parseExercise(malformed)).toThrow(ExerciseValidationError);
    expectInvalid(malformed, "exercise.expectedEvents[0]");
    expectInvalid(malformed, "exercise.source");
    expectInvalid(malformed, "exercise.prerequisites");
    expectInvalid(malformed, "exercise.curriculumTags[1]");
    expectInvalid(malformed, "exercise.curriculumTags[2]");
    expectInvalid(malformed, "exercise.repertoireGoalTags[0]");
  });

  it("rejects missing event arrays and blank optional source text", () => {
    const document = createExerciseDocument();
    const malformed = {
      ...document,
      expectedEvents: "notes",
      source: { kind: "licensed", attribution: "", license: "" },
    };

    expectInvalid(malformed, "exercise.expectedEvents");
    expectInvalid(malformed, "exercise.source.attribution");
    expectInvalid(malformed, "exercise.source.license");
  });

  it("allows repeated pitches when event IDs stay distinct", () => {
    const document = createExerciseDocument();
    document.expectedEvents[1]!.noteNumber = 60;
    document.source = { kind: "licensed", license: "Example license" };

    const exercise = parseExercise(document);

    expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual([60, 60]);
    expect(exercise.source).toEqual({ kind: "licensed", license: "Example license" });
  });
});

describe("parseExerciseLibrary", () => {
  it("accepts distinct canonical IDs", () => {
    const first = createExerciseDocument();
    const second = createExerciseDocument();
    second.id = "another-exercise";

    expect(parseExerciseLibrary([first, second]).map(({ id }) => id)).toEqual(["test-exercise", "another-exercise"]);
  });

  it("rejects duplicate canonical IDs even when revisions differ", () => {
    const first = createExerciseDocument();
    const second = createExerciseDocument();
    second.revision = 2;

    expect(() => parseExerciseLibrary([first, second])).toThrow(/duplicates exercise ID/);
  });

  it("rejects a non-array library", () => {
    expect(() => parseExerciseLibrary({})).toThrow(ExerciseValidationError);
  });
});
