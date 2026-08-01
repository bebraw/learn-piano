import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_EVALUATION_MODES,
  EXERCISE_HANDS,
  EXERCISE_SCHEMA_VERSION,
  EXERCISE_SOURCE_KINDS,
  type Exercise,
  type ExerciseDifficulty,
  type ExerciseEvaluationMode,
  type ExerciseExpectedEvent,
  type ExerciseHand,
  type ExerciseSourceKind,
  type ExerciseSourceMetadata,
} from "./types.js";

export interface ExerciseValidationIssue {
  readonly path: string;
  readonly message: string;
}

export class ExerciseValidationError extends Error {
  readonly issues: readonly ExerciseValidationIssue[];

  constructor(issues: readonly ExerciseValidationIssue[]) {
    super(issues.map(({ path, message }) => `${path}: ${message}`).join("; "));
    this.name = "ExerciseValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown, path: string, issues: ExerciseValidationIssue[]): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  issues.push({ path, message: "must be a non-empty string" });
  return "";
}

function readOptionalNonEmptyString(value: unknown, path: string, issues: ExerciseValidationIssue[]): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return readNonEmptyString(value, path, issues);
}

function readPositiveInteger(value: unknown, path: string, issues: ExerciseValidationIssue[]): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  issues.push({ path, message: "must be a positive integer" });
  return 1;
}

function readLiteral<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
  path: string,
  issues: ExerciseValidationIssue[],
): T {
  for (const candidate of values) {
    if (value === candidate) {
      return candidate;
    }
  }

  issues.push({ path, message: `must be one of: ${values.join(", ")}` });
  return fallback;
}

function readStringList(value: unknown, path: string, issues: ExerciseValidationIssue[]): readonly string[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be an array" });
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const [index, item] of value.entries()) {
    const itemPath = `${path}[${index}]`;
    const parsed = readNonEmptyString(item, itemPath, issues);

    if (parsed.length === 0) {
      continue;
    }

    if (seen.has(parsed)) {
      issues.push({ path: itemPath, message: `duplicates ${JSON.stringify(parsed)}` });
      continue;
    }

    seen.add(parsed);
    result.push(parsed);
  }

  return result;
}

function readSource(value: unknown, path: string, issues: ExerciseValidationIssue[]): ExerciseSourceMetadata {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object" });
    return { kind: "original" };
  }

  const kind = readLiteral<ExerciseSourceKind>(value.kind, EXERCISE_SOURCE_KINDS, "original", `${path}.kind`, issues);
  const attribution = readOptionalNonEmptyString(value.attribution, `${path}.attribution`, issues);
  const license = readOptionalNonEmptyString(value.license, `${path}.license`, issues);

  return {
    kind,
    ...(attribution === undefined ? {} : { attribution }),
    ...(license === undefined ? {} : { license }),
  };
}

function readExpectedEvents(value: unknown, path: string, issues: ExerciseValidationIssue[]): readonly ExerciseExpectedEvent[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be an array" });
    return [];
  }

  if (value.length === 0) {
    issues.push({ path, message: "must contain at least one event" });
  }

  const events: ExerciseExpectedEvent[] = [];
  const eventIds = new Set<string>();

  for (const [index, event] of value.entries()) {
    const eventPath = `${path}[${index}]`;
    if (!isRecord(event)) {
      issues.push({ path: eventPath, message: "must be an object" });
      continue;
    }

    const id = readNonEmptyString(event.id, `${eventPath}.id`, issues);
    if (id.length > 0 && eventIds.has(id)) {
      issues.push({ path: `${eventPath}.id`, message: `duplicates event ID ${JSON.stringify(id)}` });
    }
    eventIds.add(id);

    if (event.kind !== "note") {
      issues.push({ path: `${eventPath}.kind`, message: 'must be "note"' });
    }

    let noteNumber = 0;
    if (typeof event.noteNumber === "number" && Number.isInteger(event.noteNumber) && event.noteNumber >= 0 && event.noteNumber <= 127) {
      noteNumber = event.noteNumber;
    } else {
      issues.push({
        path: `${eventPath}.noteNumber`,
        message: "must be an integer from 0 through 127",
      });
    }

    const hand = readLiteral<ExerciseHand>(event.hand, EXERCISE_HANDS, "right", `${eventPath}.hand`, issues);

    events.push({ id, kind: "note", noteNumber, hand });
  }

  return events;
}

export function parseExercise(value: unknown): Exercise {
  if (!isRecord(value)) {
    throw new ExerciseValidationError([{ path: "exercise", message: "must be an object" }]);
  }

  const issues: ExerciseValidationIssue[] = [];
  if (value.schemaVersion !== EXERCISE_SCHEMA_VERSION) {
    issues.push({
      path: "exercise.schemaVersion",
      message: `must be ${EXERCISE_SCHEMA_VERSION}`,
    });
  }

  const exercise: Exercise = {
    schemaVersion: EXERCISE_SCHEMA_VERSION,
    id: readNonEmptyString(value.id, "exercise.id", issues),
    revision: readPositiveInteger(value.revision, "exercise.revision", issues),
    title: readNonEmptyString(value.title, "exercise.title", issues),
    instructions: readNonEmptyString(value.instructions, "exercise.instructions", issues),
    evaluationMode: readLiteral<ExerciseEvaluationMode>(
      value.evaluationMode,
      EXERCISE_EVALUATION_MODES,
      "untimed-ordered-notes",
      "exercise.evaluationMode",
      issues,
    ),
    difficulty: readLiteral<ExerciseDifficulty>(value.difficulty, EXERCISE_DIFFICULTIES, "beginner", "exercise.difficulty", issues),
    expectedEvents: readExpectedEvents(value.expectedEvents, "exercise.expectedEvents", issues),
    source: readSource(value.source, "exercise.source", issues),
    prerequisites: readStringList(value.prerequisites, "exercise.prerequisites", issues),
    curriculumTags: readStringList(value.curriculumTags, "exercise.curriculumTags", issues),
    repertoireGoalTags: readStringList(value.repertoireGoalTags, "exercise.repertoireGoalTags", issues),
  };

  if (issues.length > 0) {
    throw new ExerciseValidationError(issues);
  }

  return exercise;
}

export function parseExerciseLibrary(value: unknown): readonly Exercise[] {
  if (!Array.isArray(value)) {
    throw new ExerciseValidationError([{ path: "library", message: "must be an array" }]);
  }

  const exercises = value.map((exercise) => parseExercise(exercise));
  const exerciseIds = new Set<string>();
  const issues: ExerciseValidationIssue[] = [];

  for (const [index, exercise] of exercises.entries()) {
    if (exerciseIds.has(exercise.id)) {
      issues.push({
        path: `library[${index}].id`,
        message: `duplicates exercise ID ${JSON.stringify(exercise.id)}`,
      });
    }
    exerciseIds.add(exercise.id);
  }

  if (issues.length > 0) {
    throw new ExerciseValidationError(issues);
  }

  return exercises;
}
