export const EXERCISE_SCHEMA_VERSION = 1 as const;

export const EXERCISE_EVALUATION_MODES = ["untimed-ordered-notes"] as const;
export const EXERCISE_HANDS = ["left", "right", "both"] as const;
export const EXERCISE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const EXERCISE_SOURCE_KINDS = ["original", "public-domain", "licensed", "user-provided"] as const;

export type ExerciseSchemaVersion = typeof EXERCISE_SCHEMA_VERSION;
export type ExerciseEvaluationMode = (typeof EXERCISE_EVALUATION_MODES)[number];
export type ExerciseHand = (typeof EXERCISE_HANDS)[number];
export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];
export type ExerciseSourceKind = (typeof EXERCISE_SOURCE_KINDS)[number];

export interface ExerciseSourceMetadata {
  readonly kind: ExerciseSourceKind;
  readonly attribution?: string;
  readonly license?: string;
}

export interface NoteExerciseEvent {
  readonly id: string;
  readonly kind: "note";
  readonly noteNumber: number;
  readonly hand: ExerciseHand;
}

export type ExerciseExpectedEvent = NoteExerciseEvent;

export interface Exercise {
  readonly schemaVersion: ExerciseSchemaVersion;
  readonly id: string;
  readonly revision: number;
  readonly title: string;
  readonly instructions: string;
  readonly evaluationMode: ExerciseEvaluationMode;
  readonly difficulty: ExerciseDifficulty;
  readonly expectedEvents: readonly ExerciseExpectedEvent[];
  readonly source: ExerciseSourceMetadata;
  readonly prerequisites: readonly string[];
  readonly curriculumTags: readonly string[];
  readonly repertoireGoalTags: readonly string[];
}
