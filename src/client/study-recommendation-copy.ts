import type { StudyRecommendation } from "../curriculum/study-recommendation.js";

export interface StudyRecommendationCopy {
  readonly kicker: "Suggested next" | "Suggested review";
  readonly actionLabel: "Open next study" | "Review study";
  readonly reason: string;
}

export function studyRecommendationCopy(recommendation: StudyRecommendation): StudyRecommendationCopy {
  return {
    kicker: recommendation.kind === "review" ? "Suggested review" : "Suggested next",
    actionLabel: recommendation.kind === "review" ? "Review study" : "Open next study",
    reason: recommendationReason(recommendation),
  };
}

function recommendationReason(recommendation: StudyRecommendation): string {
  switch (recommendation.reason.kind) {
    case "direct-dependent":
      return "Builds directly on the study you just completed.";
    case "prerequisites-practiced": {
      const count = recommendation.reason.prerequisiteExerciseIds.length;
      return `You've completed ${count === 1 ? "its prerequisite study" : "its prerequisite studies"} in this browser.`;
    }
    case "prerequisite-free":
      return "A new foundation study with no prerequisites.";
    case "least-recently-practiced":
      return "You've completed every current study; this one was practiced least recently.";
  }
}
