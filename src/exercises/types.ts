export const EXERCISE_SCHEMA_VERSION = 1 as const;

export const EXERCISE_EVALUATION_MODES = ["untimed-ordered-notes", "timed-ordered-notes"] as const;
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
  readonly beatOffset?: number;
}

export type ExerciseExpectedEvent = NoteExerciseEvent;

export interface ExerciseTiming {
  readonly defaultBpm: number;
  readonly minBpm: number;
  readonly maxBpm: number;
  readonly beatsPerMeasure: number;
  readonly beatUnit: number;
  readonly countInBeats: number;
  readonly timingWindowBeats: number;
}

export const DEFAULT_TIMED_EXERCISE_TIMING = {
  defaultBpm: 60,
  minBpm: 40,
  maxBpm: 100,
  beatsPerMeasure: 4,
  beatUnit: 4,
  countInBeats: 4,
  timingWindowBeats: 0.2,
} as const satisfies ExerciseTiming;

export interface Exercise {
  readonly schemaVersion: ExerciseSchemaVersion;
  readonly id: string;
  readonly revision: number;
  readonly title: string;
  readonly instructions: string;
  readonly evaluationMode: ExerciseEvaluationMode;
  readonly timing?: ExerciseTiming;
  readonly difficulty: ExerciseDifficulty;
  readonly expectedEvents: readonly ExerciseExpectedEvent[];
  readonly source: ExerciseSourceMetadata;
  readonly prerequisites: readonly string[];
  readonly curriculumTags: readonly string[];
  readonly repertoireGoalTags: readonly string[];
}
