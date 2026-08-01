import { recommendNextStudy, type StudyRecommendation } from "../../curriculum/study-recommendation.js";
import type { Exercise, ExerciseHand } from "../../exercises/types.js";
import { isCanonicalIsoTimestamp, type AttemptRepository, type CompletedAttemptRecord } from "./attempt-repository.js";

export interface PracticeOverviewHandSummary {
  readonly completed: number;
  readonly total: number;
}

export interface PracticeOverviewMostRecent {
  readonly exercise: Exercise;
  readonly attempt: CompletedAttemptRecord;
}

export interface PracticeOverviewCompletedStudy {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
}

export interface PracticeOverview {
  readonly totalStudies: number;
  readonly completedStudyIdentities: readonly PracticeOverviewCompletedStudy[];
  readonly completedStudies: number;
  readonly rightHand: PracticeOverviewHandSummary;
  readonly leftHand: PracticeOverviewHandSummary;
  readonly completedToday: number;
  readonly mostRecent: PracticeOverviewMostRecent | null;
  readonly recommendation: StudyRecommendation | null;
}

interface MatchingAttempt {
  readonly attempt: CompletedAttemptRecord;
  readonly exercise: Exercise;
  readonly exerciseIndex: number;
  readonly completedTimestamp: number;
}

export async function loadPracticeOverview(
  repository: AttemptRepository,
  exercises: readonly Exercise[],
  now: Date = new Date(),
): Promise<PracticeOverview> {
  const histories = await Promise.all(exercises.map((exercise) => repository.list(exercise.id, exercise.revision)));

  return summarizePracticeOverview(exercises, histories.flat(), now);
}

export function summarizePracticeOverview(
  exercises: readonly Exercise[],
  attempts: readonly CompletedAttemptRecord[],
  now: Date,
): PracticeOverview {
  const canonicalExercises = new Map<string, { readonly exercise: Exercise; readonly index: number }>();
  exercises.forEach((exercise, index) => {
    if (!canonicalExercises.has(exercise.id)) {
      canonicalExercises.set(exercise.id, { exercise, index });
    }
  });

  const matchingAttempts: MatchingAttempt[] = [];
  for (const attempt of attempts) {
    const canonical = canonicalExercises.get(attempt.exerciseId);
    if (
      canonical === undefined ||
      canonical.exercise.revision !== attempt.exerciseRevision ||
      !isCanonicalIsoTimestamp(attempt.completedAt)
    ) {
      continue;
    }
    const completedTimestamp = Date.parse(attempt.completedAt);

    matchingAttempts.push({
      attempt,
      exercise: canonical.exercise,
      exerciseIndex: canonical.index,
      completedTimestamp,
    });
  }

  const completedExerciseIds = new Set(matchingAttempts.map(({ exercise }) => exercise.id));
  const completedStudyIdentities = [...canonicalExercises.values()]
    .filter(({ exercise }) => completedExerciseIds.has(exercise.id))
    .map(({ exercise }) => ({ exerciseId: exercise.id, exerciseRevision: exercise.revision }));
  const rightHand = summarizeHand(exercises, completedExerciseIds, "right");
  const leftHand = summarizeHand(exercises, completedExerciseIds, "left");
  const mostRecent = findMostRecent(matchingAttempts);

  return {
    totalStudies: exercises.length,
    completedStudyIdentities,
    completedStudies: completedStudyIdentities.length,
    rightHand,
    leftHand,
    completedToday: matchingAttempts.filter(({ completedTimestamp }) => isSameLocalDay(new Date(completedTimestamp), now)).length,
    mostRecent: mostRecent === null ? null : { exercise: mostRecent.exercise, attempt: mostRecent.attempt },
    recommendation: recommendNextStudy(
      exercises,
      matchingAttempts.map(({ attempt }) => attempt),
      null,
    ),
  };
}

function summarizeHand(
  exercises: readonly Exercise[],
  completedExerciseIds: ReadonlySet<string>,
  hand: Exclude<ExerciseHand, "both">,
): PracticeOverviewHandSummary {
  const studies = exercises.filter((exercise) => exerciseIncludesHand(exercise, hand));

  return {
    completed: studies.filter((exercise) => completedExerciseIds.has(exercise.id)).length,
    total: studies.length,
  };
}

function exerciseIncludesHand(exercise: Exercise, hand: Exclude<ExerciseHand, "both">): boolean {
  return exercise.expectedEvents.some((event) => event.hand === hand || event.hand === "both");
}

function findMostRecent(attempts: readonly MatchingAttempt[]): MatchingAttempt | null {
  let mostRecent: MatchingAttempt | null = null;

  for (const attempt of attempts) {
    if (
      mostRecent === null ||
      attempt.completedTimestamp > mostRecent.completedTimestamp ||
      (attempt.completedTimestamp === mostRecent.completedTimestamp && attempt.exerciseIndex < mostRecent.exerciseIndex)
    ) {
      mostRecent = attempt;
    }
  }

  return mostRecent;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}
