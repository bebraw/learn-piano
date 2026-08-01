import { describe, expect, it } from "vitest";
import { fiveNoteDescentRightHandExercise } from "../exercises/library/beginner-five-note-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import type { CompletedAttemptRecord } from "./persistence/attempt-repository.js";
import type { PracticeOverview } from "./persistence/practice-overview.js";
import { createHomePageView, type HomeFolioCardElements, type HomePageElements } from "./home-page-view.js";

class FakeElement {
  public hidden = true;
  public textContent: string | null = "";
  public readonly attributes = new Map<string, string>();

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

interface FakeCard {
  readonly element: FakeElement;
  readonly badge: FakeElement;
  readonly projection: HomeFolioCardElements;
}

interface FakePage {
  readonly elements: HomePageElements;
  readonly status: FakeElement;
  readonly details: FakeElement;
  readonly studyCount: FakeElement;
  readonly rightCount: FakeElement;
  readonly leftCount: FakeElement;
  readonly todayCount: FakeElement;
  readonly recent: FakeElement;
  readonly recentTitle: FakeElement;
  readonly recentTime: FakeElement;
  readonly recommendation: FakeElement;
  readonly recommendationKicker: FakeElement;
  readonly recommendationTitle: FakeElement;
  readonly recommendationReason: FakeElement;
  readonly recommendationLink: FakeElement;
  readonly cards: readonly FakeCard[];
}

describe("createHomePageView", () => {
  it("renders a readable loading state without exposing stale details", () => {
    const page = createElements();
    page.details.hidden = false;
    page.recent.hidden = false;
    page.recommendation.hidden = false;
    page.cards[0]!.element.setAttribute("data-completed", "true");
    page.cards[0]!.badge.hidden = false;

    createHomePageView(page.elements).renderLoading();

    expect(page.status.textContent).toBe("Reading saved completions…");
    expect(page.status.hidden).toBe(false);
    expect(page.details.hidden).toBe(true);
    expect(page.recent.hidden).toBe(true);
    expect(page.recommendation.hidden).toBe(true);
    expect(page.cards[0]!.element.getAttribute("data-completed")).toBeNull();
    expect(page.cards.every(({ badge }) => badge.hidden)).toBe(true);
  });

  it("renders current-study counts, a recent completion, a next study, and exact card markers", () => {
    const page = createElements();
    const view = createHomePageView(page.elements, (value) => `Local ${value}`);

    view.renderReady(
      overview({
        completedStudyIdentities: [{ exerciseId: fiveNoteAscentExercise.id, exerciseRevision: fiveNoteAscentExercise.revision }],
        completedStudies: 1,
        rightHand: { completed: 1, total: 12 },
        leftHand: { completed: 0, total: 12 },
        completedToday: 2,
        mostRecent: { exercise: fiveNoteAscentExercise, attempt: attempt() },
        recommendation: {
          kind: "new-study",
          exercise: fiveNoteDescentRightHandExercise,
          reason: { kind: "direct-dependent", prerequisiteExerciseIds: [fiveNoteAscentExercise.id] },
        },
      }),
    );

    expect(page.status.textContent).toBe("Saved completion for 1 of 24 current studies.");
    expect(page.details.hidden).toBe(false);
    expect(page.studyCount.textContent).toBe("1 of 24");
    expect(page.rightCount.textContent).toBe("1 of 12");
    expect(page.leftCount.textContent).toBe("0 of 12");
    expect(page.todayCount.textContent).toBe("2");
    expect(page.recent.hidden).toBe(false);
    expect(page.recentTitle.textContent).toBe(fiveNoteAscentExercise.title);
    expect(page.recentTime.textContent).toBe(`Local ${attempt().completedAt}`);
    expect(page.recommendation.hidden).toBe(false);
    expect(page.recommendationKicker.textContent).toBe("Suggested next");
    expect(page.recommendationTitle.textContent).toBe(fiveNoteDescentRightHandExercise.title);
    expect(page.recommendationReason.textContent).toBe("Builds directly on the study you just completed.");
    expect(page.recommendationLink.textContent).toBe("Open next study");
    expect(page.recommendationLink.getAttribute("href")).toBe(
      `/practice?exercise=${encodeURIComponent(fiveNoteDescentRightHandExercise.id)}`,
    );
    expect(page.cards[0]!.element.getAttribute("data-completed")).toBe("true");
    expect(page.cards[0]!.badge.hidden).toBe(false);
    expect(page.cards[0]!.badge.textContent).toBe("Completion saved");
    expect(page.cards[1]!.element.getAttribute("data-completed")).toBeNull();
    expect(page.cards[1]!.badge.hidden).toBe(true);
  });

  it("does not mark a rendered card from a different exercise revision", () => {
    const page = createElements();
    const staleCard = { ...page.cards[0]!.projection, exerciseRevision: fiveNoteAscentExercise.revision + 1 };
    const view = createHomePageView({ ...page.elements, folioCards: [staleCard, page.cards[1]!.projection] });

    view.renderReady(
      overview({
        completedStudyIdentities: [{ exerciseId: fiveNoteAscentExercise.id, exerciseRevision: fiveNoteAscentExercise.revision }],
        completedStudies: 1,
      }),
    );

    expect(page.cards[0]!.element.getAttribute("data-completed")).toBeNull();
    expect(page.cards[0]!.badge.hidden).toBe(true);
  });

  it("keeps an empty readable history neutral while offering a prerequisite-free study", () => {
    const page = createElements();

    createHomePageView(page.elements).renderReady(
      overview({
        recommendation: {
          kind: "new-study",
          exercise: fiveNoteAscentExercise,
          reason: { kind: "prerequisite-free" },
        },
      }),
    );

    expect(page.status.textContent).toBe("Saved completion for 0 of 24 current studies.");
    expect(page.studyCount.textContent).toBe("0 of 24");
    expect(page.rightCount.textContent).toBe("0 of 12");
    expect(page.leftCount.textContent).toBe("0 of 12");
    expect(page.todayCount.textContent).toBe("0");
    expect(page.recent.hidden).toBe(true);
    expect(page.recommendation.hidden).toBe(false);
    expect(page.recommendationKicker.textContent).toBe("Suggested next");
    expect(page.recommendationReason.textContent).toBe("A new foundation study with no prerequisites.");
    expect(page.cards.every(({ badge }) => badge.hidden)).toBe(true);
  });

  it("renders an explainable review after every current study has a saved completion", () => {
    const page = createElements();

    createHomePageView(page.elements).renderReady(
      overview({
        completedStudyIdentities: [
          { exerciseId: fiveNoteAscentExercise.id, exerciseRevision: fiveNoteAscentExercise.revision },
          { exerciseId: fiveNoteDescentRightHandExercise.id, exerciseRevision: fiveNoteDescentRightHandExercise.revision },
        ],
        completedStudies: 24,
        rightHand: { completed: 12, total: 12 },
        leftHand: { completed: 12, total: 12 },
        recommendation: {
          kind: "review",
          exercise: fiveNoteAscentExercise,
          reason: { kind: "least-recently-practiced", lastCompletedAt: attempt().completedAt },
        },
      }),
    );

    expect(page.recommendationKicker.textContent).toBe("Suggested review");
    expect(page.recommendationLink.textContent).toBe("Review study");
    expect(page.recommendationReason.textContent).toBe("You've completed every current study; this one was practiced least recently.");
  });

  it("clears a ready projection when local history becomes unavailable", () => {
    const page = createElements();
    const view = createHomePageView(page.elements);
    view.renderReady(
      overview({
        completedStudyIdentities: [{ exerciseId: fiveNoteAscentExercise.id, exerciseRevision: fiveNoteAscentExercise.revision }],
        completedStudies: 1,
        mostRecent: { exercise: fiveNoteAscentExercise, attempt: attempt() },
        recommendation: {
          kind: "new-study",
          exercise: fiveNoteDescentRightHandExercise,
          reason: { kind: "prerequisites-practiced", prerequisiteExerciseIds: [fiveNoteAscentExercise.id] },
        },
      }),
    );

    view.renderUnavailable();

    expect(page.status.textContent).toBe("Local practice record unavailable. The exercise library still works.");
    expect(page.details.hidden).toBe(true);
    expect(page.recent.hidden).toBe(true);
    expect(page.recentTitle.textContent).toBe("");
    expect(page.recentTime.textContent).toBe("");
    expect(page.recommendation.hidden).toBe(true);
    expect(page.recommendationTitle.textContent).toBe("");
    expect(page.recommendationReason.textContent).toBe("");
    expect(page.recommendationLink.textContent).toBe("");
    expect(page.recommendationLink.getAttribute("href")).toBe("/");
    expect(page.cards.every(({ element }) => element.getAttribute("data-completed") === null)).toBe(true);
    expect(page.cards.every(({ badge }) => badge.hidden && badge.textContent === "Completion saved")).toBe(true);
  });
});

function createElements(): FakePage {
  const status = new FakeElement();
  const details = new FakeElement();
  const studyCount = new FakeElement();
  const rightCount = new FakeElement();
  const leftCount = new FakeElement();
  const todayCount = new FakeElement();
  const recent = new FakeElement();
  const recentTitle = new FakeElement();
  const recentTime = new FakeElement();
  const recommendation = new FakeElement();
  const recommendationKicker = new FakeElement();
  const recommendationTitle = new FakeElement();
  const recommendationReason = new FakeElement();
  const recommendationLink = new FakeElement();
  const cards = [card(fiveNoteAscentExercise.id), card(fiveNoteDescentRightHandExercise.id)];
  const elements: HomePageElements = {
    status,
    details,
    studyCount,
    rightCount,
    leftCount,
    todayCount,
    recent,
    recentTitle,
    recentTime,
    recommendation,
    recommendationKicker,
    recommendationTitle,
    recommendationReason,
    recommendationLink,
    folioCards: cards.map(({ projection }) => projection),
  };
  return {
    elements,
    status,
    details,
    studyCount,
    rightCount,
    leftCount,
    todayCount,
    recent,
    recentTitle,
    recentTime,
    recommendation,
    recommendationKicker,
    recommendationTitle,
    recommendationReason,
    recommendationLink,
    cards,
  };
}

function card(exerciseId: string): FakeCard {
  const element = new FakeElement();
  const badge = new FakeElement();
  badge.textContent = "Completion saved";
  return {
    element,
    badge,
    projection: { exerciseId, exerciseRevision: 1, element, completionBadge: badge },
  };
}

function overview(overrides: Partial<PracticeOverview> = {}): PracticeOverview {
  return {
    totalStudies: 24,
    completedStudyIdentities: [],
    completedStudies: 0,
    rightHand: { completed: 0, total: 12 },
    leftHand: { completed: 0, total: 12 },
    completedToday: 0,
    mostRecent: null,
    recommendation: null,
    ...overrides,
  };
}

function attempt(): CompletedAttemptRecord {
  return {
    schemaVersion: 1,
    id: "attempt-1",
    exerciseId: fiveNoteAscentExercise.id,
    exerciseRevision: fiveNoteAscentExercise.revision,
    startedAt: "2026-08-01T07:59:00.000Z",
    completedAt: "2026-08-01T08:00:00.000Z",
    inputKind: "mock",
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
  };
}
