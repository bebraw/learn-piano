import { expect, test, type Page } from "@playwright/test";
import { defaultExercise, exerciseLibrary } from "./exercises/library";
import { ATTEMPT_STORAGE_KEY, type CompletedAttemptRecord } from "./client/persistence/attempt-repository";

function completedAttempt(overrides: Partial<CompletedAttemptRecord> = {}): CompletedAttemptRecord {
  return {
    schemaVersion: 1,
    id: "home-overview-attempt",
    exerciseId: defaultExercise.id,
    exerciseRevision: defaultExercise.revision,
    startedAt: "2026-08-01T08:00:00.000Z",
    completedAt: "2026-08-01T08:01:00.000Z",
    inputKind: "mock",
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
    ...overrides,
  };
}

test("enhances empty local history without restricting the library", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#home-overview-status")).toHaveText(`Saved completion for 0 of ${exerciseLibrary.length} current studies.`);
  await expect(page.locator("#home-overview-details")).toBeVisible();
  await expect(page.locator("#home-overview-study-count")).toHaveText(`0 of ${exerciseLibrary.length}`);
  await expect(page.locator("#home-overview-right-count")).toHaveText("0 of 15");
  await expect(page.locator("#home-overview-left-count")).toHaveText("0 of 15");
  await expect(page.locator("#home-overview-recent")).toBeHidden();
  await expect(page.locator("#home-overview-recommendation-title")).toHaveText(defaultExercise.title);
  await expect(page.locator("#home-overview-recommendation-link")).toHaveAttribute("href", `/practice?exercise=${defaultExercise.id}`);
  await expect(page.locator("[data-completion-badge]:visible")).toHaveCount(0);
  await expect(page.locator(".folio-card")).toHaveCount(exerciseLibrary.length);
  await expect(page.locator("#folio-filters")).toBeVisible();
  await expect(page.locator("#folio-filter-status")).toHaveText(`Showing ${exerciseLibrary.length} of ${exerciseLibrary.length} studies`);
  await expect(page.getByRole("radio", { name: "All" })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Reset filters" })).toBeDisabled();
});

test("filters the complete folio by every matching focus, hand, and timing facet without changing its default", async ({ page }) => {
  const rhythmStudies = exerciseLibrary.filter((exercise) =>
    exercise.curriculumTags.some((tag) => tag.startsWith("rhythm-and-coordination.")),
  );
  const rightHandRhythmStudies = rhythmStudies.filter((exercise) => exercise.expectedEvents.every(({ hand }) => hand === "right"));
  const rightHandPulseGuidedRhythmStudies = rightHandRhythmStudies.filter((exercise) => exercise.evaluationMode === "timed-ordered-notes");
  await page.goto("/");

  await page.getByRole("radio", { name: "Rhythm & coordination" }).check();
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(rhythmStudies.length);
  await expect(page.locator("#folio-filter-status")).toHaveText(`Showing ${rhythmStudies.length} of ${exerciseLibrary.length} studies`);

  await page.getByRole("radio", { name: "Right" }).check();
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(rightHandRhythmStudies.length);
  await expect(page.locator("#folio-filter-status")).toHaveText(
    `Showing ${rightHandRhythmStudies.length} of ${exerciseLibrary.length} studies`,
  );

  await page.getByRole("radio", { name: "Pulse-guided" }).check();
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(rightHandPulseGuidedRhythmStudies.length);
  await expect(page.locator("#folio-filter-status")).toHaveText(
    `Showing ${rightHandPulseGuidedRhythmStudies.length} of ${exerciseLibrary.length} studies`,
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

  const resetButton = page.getByRole("button", { name: "Reset filters" });
  await expect(resetButton).toBeEnabled();
  await resetButton.click();
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(exerciseLibrary.length);
  await expect(page.locator("#folio-filter-status")).toHaveText(`Showing ${exerciseLibrary.length} of ${exerciseLibrary.length} studies`);
  await expect(resetButton).toBeDisabled();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

  await page.getByRole("radio", { name: "Left" }).check();
  await page.getByRole("radio", { name: "Untimed" }).check();
  await page.reload();
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(exerciseLibrary.length);
  await expect(page.getByRole("radio", { name: "All" }).first()).toBeChecked();
  await expect(page.getByRole("radio", { name: "All" }).nth(1)).toBeChecked();
  await expect(page.getByRole("radio", { name: "All" }).last()).toBeChecked();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test("projects retained current-revision history into facts and card badges", async ({ page }) => {
  const currentAttempt = completedAttempt();
  const oldRevisionAttempt = completedAttempt({
    id: "old-revision-attempt",
    exerciseId: exerciseLibrary[1]!.id,
    exerciseRevision: exerciseLibrary[1]!.revision + 1,
    completedAt: "2026-08-01T08:02:00.000Z",
  });
  await page.addInitScript(({ key, serialized }) => window.localStorage.setItem(key, serialized), {
    key: ATTEMPT_STORAGE_KEY,
    serialized: JSON.stringify({ schemaVersion: 1, attempts: [currentAttempt, oldRevisionAttempt] }),
  });

  await page.goto("/");

  await expect(page.locator("#home-overview-status")).toHaveText(`Saved completion for 1 of ${exerciseLibrary.length} current studies.`);
  await expect(page.locator("#home-overview-recent-title")).toHaveText(defaultExercise.title);
  const expectedRecentTime = await page.evaluate(
    (completedAt) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(completedAt)),
    currentAttempt.completedAt,
  );
  await expect(page.locator("#home-overview-recent-time")).toHaveText(expectedRecentTime);
  await expect(page.locator(`[data-exercise-id="${defaultExercise.id}"]`)).toHaveAttribute("data-completed", "true");
  await expect(page.locator(`[data-exercise-id="${defaultExercise.id}"] [data-completion-badge]`)).toHaveText(/Completion saved/);
  await expect(page.locator("[data-completion-badge]:visible")).toHaveCount(1);

  await page.getByRole("radio", { name: "Rhythm & coordination" }).check();
  await expect(page.locator(`[data-exercise-id="${defaultExercise.id}"]`)).toBeHidden();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(`[data-exercise-id="${defaultExercise.id}"] [data-completion-badge]`)).toBeVisible();
});

test("keeps a populated overview contained at desktop, iPad, and narrow widths", async ({ page }) => {
  const currentAttempt = completedAttempt();
  await page.addInitScript(({ key, serialized }) => window.localStorage.setItem(key, serialized), {
    key: ATTEMPT_STORAGE_KEY,
    serialized: JSON.stringify({ schemaVersion: 1, attempts: [currentAttempt] }),
  });

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 1366 },
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#home-overview-status")).toContainText("Saved completion for 1 of");

    const recommendation = page.locator("#home-overview-recommendation");
    const recommendationLink = page.locator("#home-overview-recommendation-link");
    const folioFilters = page.locator("#folio-filters");
    const timingFilter = page.locator(".folio-filter-group-timing");
    const filterReset = page.locator("#folio-filter-reset");
    await recommendation.scrollIntoViewIfNeeded();
    await expect(recommendation).toBeVisible();
    await expect(recommendationLink).toBeVisible();
    await expect(folioFilters).toBeVisible();
    await expect(timingFilter).toBeVisible();
    await expect(filterReset).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    for (const locator of [page.locator(".home-overview"), recommendation, recommendationLink, folioFilters, timingFilter, filterReset]) {
      const box = await locator.boundingBox();
      if (box === null) {
        throw new Error("Expected the overview element to have visible geometry");
      }
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
});

test("fails neutral when browser history cannot be read", async ({ page }) => {
  await page.addInitScript((storageKey) => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function getItem(key: string): string | null {
      if (key === storageKey) {
        throw new DOMException("Storage unavailable", "SecurityError");
      }
      return originalGetItem.call(this, key);
    };
  }, ATTEMPT_STORAGE_KEY);

  await page.goto("/");

  await expect(page.locator("#home-overview-status")).toHaveText("Local practice record unavailable. The exercise library still works.");
  await expect(page.locator("#home-overview-details")).toBeHidden();
  await expect(page.locator("[data-completion-badge]:visible")).toHaveCount(0);
  await expect(page.locator(".folio-card")).toHaveCount(exerciseLibrary.length);
  await expect(page.locator("#folio-filters")).toBeVisible();
  await page.getByRole("radio", { name: "Rhythm & coordination" }).check();
  const rhythmStudyCount = exerciseLibrary.filter((exercise) =>
    exercise.curriculumTags.some((tag) => tag.startsWith("rhythm-and-coordination.")),
  ).length;
  await expect(page.locator("[data-folio-entry]:visible")).toHaveCount(rhythmStudyCount);
  await expect(page.locator("#folio-filter-status")).toHaveText(`Showing ${rhythmStudyCount} of ${exerciseLibrary.length} studies`);
  await expectFallbackOverviewCollapsed(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps the complete server-rendered library usable", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#home-overview-status")).toHaveText("Enable JavaScript to read completions saved in this browser.");
    await expect(page.locator("#home-overview-details")).toBeHidden();
    await expect(page.locator(".folio-card")).toHaveCount(exerciseLibrary.length);
    await expect(page.locator(".folio-card").first()).toHaveAttribute("href", `/practice?exercise=${defaultExercise.id}`);
    await expect(page.locator("#folio-filters")).toBeHidden();
    await expectFallbackOverviewCollapsed(page);
  });
});

async function expectFallbackOverviewCollapsed(page: Page): Promise<void> {
  const overview = await page.locator(".home-overview").boundingBox();
  const intro = await page.locator(".home-overview-intro").boundingBox();
  if (overview === null || intro === null) {
    throw new Error("Expected the fallback overview to have visible geometry");
  }
  expect(Math.abs(overview.width - intro.width)).toBeLessThanOrEqual(2);
}
