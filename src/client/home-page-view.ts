import type { PracticeOverview } from "./persistence/practice-overview.js";
import { exercisePracticeHref } from "../views/exercise-presentation.js";
import { studyRecommendationCopy } from "./study-recommendation-copy.js";

interface AttributeElementLike {
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
}

interface ElementLike extends AttributeElementLike {
  hidden: boolean | string;
  textContent: string | null;
}

export interface HomeFolioCardElements {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly element: ElementLike;
  readonly completionBadge: ElementLike;
}

export interface HomePageElements {
  readonly status: ElementLike;
  readonly details: ElementLike;
  readonly studyCount: ElementLike;
  readonly rightCount: ElementLike;
  readonly leftCount: ElementLike;
  readonly todayCount: ElementLike;
  readonly recent: ElementLike;
  readonly recentTitle: ElementLike;
  readonly recentTime: ElementLike;
  readonly recommendation: ElementLike;
  readonly recommendationKicker: ElementLike;
  readonly recommendationTitle: ElementLike;
  readonly recommendationReason: ElementLike;
  readonly recommendationLink: ElementLike;
  readonly folioCards: readonly HomeFolioCardElements[];
}

export interface HomePageView {
  renderLoading(): void;
  renderReady(overview: PracticeOverview): void;
  renderUnavailable(): void;
}

export function collectHomePageElements(pageDocument: Document): HomePageElements {
  const folioCards = [...pageDocument.querySelectorAll<HTMLElement>("[data-exercise-id][data-exercise-revision]")].map(
    (element): HomeFolioCardElements => {
      const exerciseId = element.getAttribute("data-exercise-id");
      const exerciseRevision = Number(element.getAttribute("data-exercise-revision"));
      const completionBadge = element.querySelector<HTMLElement>("[data-completion-badge]");
      if (exerciseId === null || !Number.isInteger(exerciseRevision) || exerciseRevision < 1 || completionBadge === null) {
        throw new Error("Home page has an invalid exercise card");
      }
      return { exerciseId, exerciseRevision, element, completionBadge };
    },
  );

  return {
    status: requireElement(pageDocument, "home-overview-status"),
    details: requireElement(pageDocument, "home-overview-details"),
    studyCount: requireElement(pageDocument, "home-overview-study-count"),
    rightCount: requireElement(pageDocument, "home-overview-right-count"),
    leftCount: requireElement(pageDocument, "home-overview-left-count"),
    todayCount: requireElement(pageDocument, "home-overview-today-count"),
    recent: requireElement(pageDocument, "home-overview-recent"),
    recentTitle: requireElement(pageDocument, "home-overview-recent-title"),
    recentTime: requireElement(pageDocument, "home-overview-recent-time"),
    recommendation: requireElement(pageDocument, "home-overview-recommendation"),
    recommendationKicker: requireElement(pageDocument, "home-overview-recommendation-kicker"),
    recommendationTitle: requireElement(pageDocument, "home-overview-recommendation-title"),
    recommendationReason: requireElement(pageDocument, "home-overview-recommendation-reason"),
    recommendationLink: requireElement(pageDocument, "home-overview-recommendation-link"),
    folioCards,
  };
}

export function createHomePageView(
  elements: HomePageElements,
  formatCompletedAt: (value: string) => string = formatCompletionDateTime,
): HomePageView {
  return {
    renderLoading(): void {
      renderUnavailableDetails(elements);
      setTextContent(elements.status, "Reading saved completions…");
    },

    renderReady(overview): void {
      renderUnavailableDetails(elements);
      setTextContent(
        elements.status,
        `Saved completion for ${overview.completedStudies} of ${overview.totalStudies} current ${overview.totalStudies === 1 ? "study" : "studies"}.`,
      );
      setTextContent(elements.studyCount, `${overview.completedStudies} of ${overview.totalStudies}`);
      setTextContent(elements.rightCount, `${overview.rightHand.completed} of ${overview.rightHand.total}`);
      setTextContent(elements.leftCount, `${overview.leftHand.completed} of ${overview.leftHand.total}`);
      setTextContent(elements.todayCount, String(overview.completedToday));
      elements.details.hidden = false;

      if (overview.mostRecent !== null) {
        setTextContent(elements.recentTitle, overview.mostRecent.exercise.title);
        setTextContent(elements.recentTime, formatCompletedAt(overview.mostRecent.attempt.completedAt));
        elements.recent.hidden = false;
      }

      if (overview.recommendation !== null) {
        const copy = studyRecommendationCopy(overview.recommendation);
        setTextContent(elements.recommendationKicker, copy.kicker);
        setTextContent(elements.recommendationTitle, overview.recommendation.exercise.title);
        setTextContent(elements.recommendationReason, copy.reason);
        setTextContent(elements.recommendationLink, copy.actionLabel);
        elements.recommendationLink.setAttribute("href", exercisePracticeHref(overview.recommendation.exercise));
        elements.recommendation.hidden = false;
      }

      const completedStudyRevisions = new Map(
        overview.completedStudyIdentities.map(({ exerciseId, exerciseRevision }) => [exerciseId, exerciseRevision]),
      );
      for (const card of elements.folioCards) {
        if (completedStudyRevisions.get(card.exerciseId) === card.exerciseRevision) {
          card.element.setAttribute("data-completed", "true");
          card.completionBadge.hidden = false;
        }
      }
    },

    renderUnavailable(): void {
      renderUnavailableDetails(elements);
      setTextContent(elements.status, "Local practice record unavailable. The exercise library still works.");
    },
  };
}

function renderUnavailableDetails(elements: HomePageElements): void {
  elements.status.hidden = false;
  elements.details.hidden = true;
  elements.recent.hidden = true;
  elements.recommendation.hidden = true;
  setTextContent(elements.studyCount, null);
  setTextContent(elements.rightCount, null);
  setTextContent(elements.leftCount, null);
  setTextContent(elements.todayCount, null);
  setTextContent(elements.recentTitle, null);
  setTextContent(elements.recentTime, null);
  setTextContent(elements.recommendationKicker, null);
  setTextContent(elements.recommendationTitle, null);
  setTextContent(elements.recommendationReason, null);
  setTextContent(elements.recommendationLink, null);
  elements.recommendationLink.setAttribute("href", "/");
  for (const card of elements.folioCards) {
    card.element.removeAttribute("data-completed");
    card.completionBadge.hidden = true;
  }
}

function formatCompletionDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function requireElement(pageDocument: Document, id: string): HTMLElement {
  const element = pageDocument.getElementById(id);
  if (element === null) {
    throw new Error(`Home page is missing #${id}`);
  }
  return element;
}

function setTextContent(element: ElementLike, value: string | null): void {
  const nextValue = value ?? "";
  if (element.textContent !== nextValue) {
    element.textContent = nextValue;
  }
}
