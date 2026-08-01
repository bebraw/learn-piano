import { describe, expect, it } from "vitest";
import { exerciseLibrary } from "./library/index.js";
import { fiveNoteAscentExercise } from "./library/five-note-ascent.js";
import { ExerciseValidationError, parseExercise, parseExerciseLibrary } from "./schema.js";

interface MutableExpectedEvent {
  id: string;
  kind: string;
  noteNumber: number;
  hand: string;
  beatOffset?: number;
}

interface MutableExerciseTiming {
  defaultBpm: number;
  minBpm: number;
  maxBpm: number;
  beatsPerMeasure: number;
  beatUnit: number;
  countInBeats: number;
  timingWindowBeats: number;
}

interface MutableExerciseDocument {
  schemaVersion: number;
  id: string;
  revision: number;
  title: string;
  instructions: string;
  evaluationMode: string;
  timing?: MutableExerciseTiming;
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

function createTimedExerciseDocument(): MutableExerciseDocument {
  const document = createExerciseDocument();
  document.evaluationMode = "timed-ordered-notes";
  document.timing = {
    defaultBpm: 60,
    minBpm: 40,
    maxBpm: 100,
    beatsPerMeasure: 4,
    beatUnit: 4,
    countInBeats: 4,
    timingWindowBeats: 0.2,
  };
  document.expectedEvents[0]!.beatOffset = 0;
  document.expectedEvents[1]!.beatOffset = 1;
  return document;
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
    expect(exercise.timing).toBeUndefined();
    expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([undefined, undefined]);
  });

  it("returns timing and beat offsets for a timed version-1 exercise", () => {
    const exercise = parseExercise(createTimedExerciseDocument());

    expect(exercise.evaluationMode).toBe("timed-ordered-notes");
    expect(exercise.timing).toEqual({
      defaultBpm: 60,
      minBpm: 40,
      maxBpm: 100,
      beatsPerMeasure: 4,
      beatUnit: 4,
      countInBeats: 4,
      timingWindowBeats: 0.2,
    });
    expect(exercise.expectedEvents.map(({ beatOffset }) => beatOffset)).toEqual([0, 1]);
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

  it("requires timing metadata and beat offsets for timed exercises", () => {
    const document = createExerciseDocument();
    document.evaluationMode = "timed-ordered-notes";

    expectInvalid(document, "exercise.timing");
    expectInvalid(document, "exercise.expectedEvents[0].beatOffset");
    expectInvalid(document, "exercise.expectedEvents[1].beatOffset");
  });

  it("forbids timing metadata and beat offsets for untimed exercises", () => {
    const document = createExerciseDocument();
    document.timing = createTimedExerciseDocument().timing!;
    document.expectedEvents[0]!.beatOffset = 0;

    expectInvalid(document, "exercise.timing");
    expectInvalid(document, "exercise.expectedEvents[0].beatOffset");
  });

  it.each([
    ["defaultBpm", 0],
    ["defaultBpm", 60.5],
    ["minBpm", Number.NaN],
    ["minBpm", 40.5],
    ["maxBpm", Number.POSITIVE_INFINITY],
    ["maxBpm", 100.5],
    ["beatsPerMeasure", 3.5],
    ["beatUnit", 0],
    ["countInBeats", -1],
    ["timingWindowBeats", -0.1],
  ] as const)("rejects invalid timed metadata %s=%s", (field, value) => {
    const document = createTimedExerciseDocument();
    document.timing![field] = value;

    expectInvalid(document, `exercise.timing.${field}`);
  });

  it("requires the default tempo to remain inside an ordered tempo range", () => {
    const reversedRange = createTimedExerciseDocument();
    reversedRange.timing!.minBpm = 110;
    expectInvalid(reversedRange, "exercise.timing.minBpm");

    const outOfRangeDefault = createTimedExerciseDocument();
    outOfRangeDefault.timing!.defaultBpm = 120;
    expectInvalid(outOfRangeDefault, "exercise.timing.defaultBpm");
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])("rejects invalid timed beat offset %s", (beatOffset) => {
    const document = createTimedExerciseDocument();
    document.expectedEvents[1]!.beatOffset = beatOffset;

    expectInvalid(document, "exercise.expectedEvents[1].beatOffset");
  });

  it("requires timed events to start at beat zero and increase strictly", () => {
    const nonzeroStart = createTimedExerciseDocument();
    nonzeroStart.expectedEvents[0]!.beatOffset = 0.5;
    expectInvalid(nonzeroStart, "exercise.expectedEvents[0].beatOffset");

    const repeatedBeat = createTimedExerciseDocument();
    repeatedBeat.expectedEvents[1]!.beatOffset = 0;
    expectInvalid(repeatedBeat, "exercise.expectedEvents[1].beatOffset");

    const decreasingBeat = createTimedExerciseDocument();
    decreasingBeat.expectedEvents.push({ id: "third-note", kind: "note", noteNumber: 64, hand: "right", beatOffset: 0.5 });
    expectInvalid(decreasingBeat, "exercise.expectedEvents[2].beatOffset");
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

  it("leaves prerequisite graph validation to the complete library boundary", () => {
    const document = createExerciseDocument();
    document.prerequisites = [document.id, "not-in-this-document"];

    expect(parseExercise(document).prerequisites).toEqual(["test-exercise", "not-in-this-document"]);
  });
});

describe("parseExerciseLibrary", () => {
  it("accepts distinct canonical IDs", () => {
    const first = createExerciseDocument();
    const second = createExerciseDocument();
    second.id = "another-exercise";

    expect(parseExerciseLibrary([first, second]).map(({ id }) => id)).toEqual(["test-exercise", "another-exercise"]);
  });

  it("accepts the current canonical library and independent prerequisite DAGs", () => {
    expect(parseExerciseLibrary(exerciseLibrary).map(({ id }) => id)).toEqual(exerciseLibrary.map(({ id }) => id));

    const firstRoot = createExerciseDocument();
    firstRoot.id = "first-root";
    const firstChild = createExerciseDocument();
    firstChild.id = "first-child";
    firstChild.prerequisites = [firstRoot.id];
    const firstGrandchild = createExerciseDocument();
    firstGrandchild.id = "first-grandchild";
    firstGrandchild.prerequisites = [firstChild.id];
    const secondRoot = createExerciseDocument();
    secondRoot.id = "second-root";
    const secondChild = createExerciseDocument();
    secondChild.id = "second-child";
    secondChild.prerequisites = [secondRoot.id];

    expect(parseExerciseLibrary([firstGrandchild, secondChild, firstRoot, secondRoot, firstChild]).map(({ id }) => id)).toEqual([
      "first-grandchild",
      "second-child",
      "first-root",
      "second-root",
      "first-child",
    ]);
  });

  it("rejects duplicate canonical IDs even when revisions differ", () => {
    const first = createExerciseDocument();
    const second = createExerciseDocument();
    second.revision = 2;

    expect(() => parseExerciseLibrary([first, second])).toThrow(/duplicates exercise ID/);
  });

  it("rejects unknown prerequisite IDs at their library positions", () => {
    const document = createExerciseDocument();
    document.prerequisites = ["missing-exercise"];

    expectLibraryIssue([document], "library[0].prerequisites[0]", 'references unknown exercise ID "missing-exercise"');
  });

  it("rejects a self prerequisite as a cycle", () => {
    const document = createExerciseDocument();
    document.prerequisites = [document.id];

    expectLibraryIssue([document], "library[0].prerequisites[0]", 'creates a prerequisite cycle: "test-exercise" -> "test-exercise"');
  });

  it("rejects transitive prerequisite cycles at the edge that closes the cycle", () => {
    const first = createExerciseDocument();
    first.id = "exercise-a";
    first.prerequisites = ["exercise-b"];
    const second = createExerciseDocument();
    second.id = "exercise-b";
    second.prerequisites = ["exercise-c"];
    const third = createExerciseDocument();
    third.id = "exercise-c";
    third.prerequisites = ["exercise-a"];

    expectLibraryIssue(
      [first, second, third],
      "library[2].prerequisites[0]",
      'creates a prerequisite cycle: "exercise-a" -> "exercise-b" -> "exercise-c" -> "exercise-a"',
    );
  });

  it("rejects a non-array library", () => {
    expect(() => parseExerciseLibrary({})).toThrow(ExerciseValidationError);
  });
});

function expectLibraryIssue(library: unknown, path: string, message: string): void {
  try {
    parseExerciseLibrary(library);
    throw new Error("Expected exercise library validation to fail");
  } catch (error) {
    if (!(error instanceof ExerciseValidationError)) {
      throw error;
    }

    expect(error.issues).toContainEqual({ path, message });
  }
}
