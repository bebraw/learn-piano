import type { Exercise } from "../exercises/types.js";

export interface StudyAttemptEvidence {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly completedAt: string;
}

export type NewStudyRecommendationReason =
  | {
      readonly kind: "direct-dependent";
      readonly prerequisiteExerciseIds: readonly string[];
    }
  | {
      readonly kind: "prerequisites-practiced";
      readonly prerequisiteExerciseIds: readonly string[];
    }
  | {
      readonly kind: "prerequisite-free";
    };

export type StudyRecommendation =
  | {
      readonly kind: "new-study";
      readonly exercise: Exercise;
      readonly reason: NewStudyRecommendationReason;
    }
  | {
      readonly kind: "review";
      readonly exercise: Exercise;
      readonly reason: {
        readonly kind: "least-recently-practiced";
        readonly lastCompletedAt: string;
      };
    };

interface LatestCompletion {
  readonly completedAt: string;
  readonly timestamp: number;
}

export function recommendNextStudy(
  exercises: readonly Exercise[],
  attempts: readonly StudyAttemptEvidence[],
  justCompletedExerciseId: string | null,
): StudyRecommendation | null {
  const exercisesById = validateExerciseGraph(exercises);
  if (exercisesById === null || exercises.length === 0) {
    return null;
  }

  const latestCompletions = collectLatestCompletions(exercisesById, attempts);
  const eligibleExercises = exercises.filter(
    (exercise) =>
      !latestCompletions.has(exercise.id) && exercise.prerequisites.every((prerequisiteId) => latestCompletions.has(prerequisiteId)),
  );

  if (eligibleExercises.length > 0) {
    const directDependent =
      justCompletedExerciseId === null
        ? undefined
        : eligibleExercises.find((exercise) => exercise.prerequisites.includes(justCompletedExerciseId));
    const exercise = directDependent ?? eligibleExercises[0]!;

    return {
      kind: "new-study",
      exercise,
      reason:
        directDependent !== undefined
          ? {
              kind: "direct-dependent",
              prerequisiteExerciseIds: [...exercise.prerequisites],
            }
          : exercise.prerequisites.length === 0
            ? { kind: "prerequisite-free" }
            : {
                kind: "prerequisites-practiced",
                prerequisiteExerciseIds: [...exercise.prerequisites],
              },
    };
  }

  if (latestCompletions.size !== exercises.length) {
    return null;
  }

  let reviewExercise = exercises[0]!;
  let reviewCompletion = latestCompletions.get(reviewExercise.id)!;

  for (const exercise of exercises.slice(1)) {
    const completion = latestCompletions.get(exercise.id)!;
    if (completion.timestamp < reviewCompletion.timestamp) {
      reviewExercise = exercise;
      reviewCompletion = completion;
    }
  }

  return {
    kind: "review",
    exercise: reviewExercise,
    reason: {
      kind: "least-recently-practiced",
      lastCompletedAt: reviewCompletion.completedAt,
    },
  };
}

function validateExerciseGraph(exercises: readonly Exercise[]): ReadonlyMap<string, Exercise> | null {
  const exercisesById = new Map<string, Exercise>();

  for (const exercise of exercises) {
    if (exercisesById.has(exercise.id) || new Set(exercise.prerequisites).size !== exercise.prerequisites.length) {
      return null;
    }
    exercisesById.set(exercise.id, exercise);
  }

  for (const exercise of exercises) {
    if (exercise.prerequisites.some((prerequisiteId) => !exercisesById.has(prerequisiteId))) {
      return null;
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(exerciseId: string): boolean {
    if (visiting.has(exerciseId)) {
      return false;
    }
    if (visited.has(exerciseId)) {
      return true;
    }

    visiting.add(exerciseId);
    const exercise = exercisesById.get(exerciseId)!;
    for (const prerequisiteId of exercise.prerequisites) {
      if (!visit(prerequisiteId)) {
        return false;
      }
    }
    visiting.delete(exerciseId);
    visited.add(exerciseId);
    return true;
  }

  return exercises.every((exercise) => visit(exercise.id)) ? exercisesById : null;
}

function collectLatestCompletions(
  exercisesById: ReadonlyMap<string, Exercise>,
  attempts: readonly StudyAttemptEvidence[],
): ReadonlyMap<string, LatestCompletion> {
  const latestCompletions = new Map<string, LatestCompletion>();

  for (const attempt of attempts) {
    const exercise = exercisesById.get(attempt.exerciseId);
    const timestamp = Date.parse(attempt.completedAt);
    if (exercise === undefined || exercise.revision !== attempt.exerciseRevision || !Number.isFinite(timestamp)) {
      continue;
    }

    const previous = latestCompletions.get(exercise.id);
    if (previous === undefined || timestamp > previous.timestamp) {
      latestCompletions.set(exercise.id, { completedAt: attempt.completedAt, timestamp });
    }
  }

  return latestCompletions;
}
