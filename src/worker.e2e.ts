import { expect, test } from "@playwright/test";
import { dMinorFiveNoteAscentRightHandExercise } from "./exercises/library/d-minor-five-note-exercises.js";
import { evenEighthsRightHandExercise } from "./exercises/library/even-eighth-exercises.js";
import { fiveFourPulseRightHandExercise } from "./exercises/library/five-four-pulse-exercises.js";
import { exerciseLibrary } from "./exercises/library/index.js";
import { mixedEighthPatternRightHandExercise } from "./exercises/library/mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipRightHandExercise } from "./exercises/library/offbeat-step-skip-exercises.js";
import {
  orderedChordTonesRightHandExercise,
  orderedDMinorChordTonesRightHandExercise,
} from "./exercises/library/ordered-chord-tone-exercises.js";
import { repeatedNotesRightHandExercise } from "./exercises/library/repeated-note-exercises.js";
import {
  bachInvention1OpeningMotifRightHandExercise,
  beethovenOdeToJoyOpeningRightHandExercise,
  pachelbelCanonGroundBassLeftHandExercise,
} from "./exercises/library/public-domain-repertoire-exercises.js";
import { steadyBrokenChordRightHandExercise } from "./exercises/library/steady-broken-chord-exercises.js";
import { steadyQuarterStepSkipRightHandExercise } from "./exercises/library/steady-quarter-exercises.js";
import { threeFourBrokenChordRightHandExercise } from "./exercises/library/three-four-broken-chord-exercises.js";
import { exercisePracticeHref } from "./views/exercise-presentation.js";

test("renders the piano practice home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Piano Practice" })).toBeVisible();
  await expect(page.getByText("Small, focused studies for building calm and reliable movement at the keyboard.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose your next study" })).toBeVisible();
  const exerciseFolio = page.locator(".folio-grid");
  expect(exerciseLibrary).toHaveLength(33);
  await expect(exerciseFolio.locator('a[href^="/practice?exercise="]')).toHaveCount(exerciseLibrary.length);
  await expect(exerciseFolio.locator('[data-mode="timed"]')).toHaveCount(18);
  await expect(
    page.getByText("33 focused studies and repertoire excerpts for both hands, including pulse and subdivision work."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(evenEighthsRightHandExercise.title) })).toContainText("Eighth-note grid · 60 BPM");
  await expect(page.getByRole("link", { name: new RegExp(orderedChordTonesRightHandExercise.title) })).toContainText("Untimed");
  await expect(page.getByRole("link", { name: new RegExp(orderedDMinorChordTonesRightHandExercise.title) })).toContainText("Untimed");
  await expect(page.getByRole("link", { name: new RegExp(dMinorFiveNoteAscentRightHandExercise.title) })).toContainText("Untimed");
  await expect(page.getByRole("link", { name: new RegExp(repeatedNotesRightHandExercise.title) })).toContainText(
    "Eighth-note grid · 60 BPM",
  );
  await expect(page.getByRole("link", { name: new RegExp(mixedEighthPatternRightHandExercise.title) })).toContainText(
    "Eighth-note grid · 60 BPM",
  );
  await expect(page.getByRole("link", { name: new RegExp(offbeatStepSkipRightHandExercise.title) })).toContainText("Offbeat grid · 60 BPM");
  await expect(page.getByRole("link", { name: new RegExp(steadyBrokenChordRightHandExercise.title) })).toContainText(
    "Steady pulse · 60 BPM",
  );
  await expect(page.getByRole("link", { name: new RegExp(threeFourBrokenChordRightHandExercise.title) })).toContainText(
    "Steady pulse · 60 BPM · 3/4",
  );
  await expect(page.getByRole("link", { name: new RegExp(fiveFourPulseRightHandExercise.title) })).toContainText(
    "Steady pulse · 60 BPM · 5/4",
  );
  for (const exercise of exerciseLibrary) {
    await expect(page.getByRole("link", { name: new RegExp(exercise.title) })).toBeVisible();
  }
  for (const exercise of [
    beethovenOdeToJoyOpeningRightHandExercise,
    pachelbelCanonGroundBassLeftHandExercise,
    bachInvention1OpeningMotifRightHandExercise,
  ]) {
    await expect(page.getByRole("link", { name: new RegExp(exercise.title) })).toContainText(exercise.source.attribution!);
  }
  await expect(page.locator('a[href="/api/health"]').first()).toBeVisible();
});

test("renders a sourced Bach learning arrangement", async ({ page }) => {
  const exercise = bachInvention1OpeningMotifRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  const source = page.getByLabel("Repertoire source and arrangement");
  await expect(source).toContainText("Public-domain learning arrangement");
  await expect(source).toContainText(exercise.source.attribution!);
  await expect(source).toContainText(exercise.source.workTitle!);
  await expect(source).toContainText(exercise.source.adaptationNote!);
  await expect(source.getByRole("link", { name: "Reference score" })).toHaveAttribute("href", exercise.source.referenceUrl!);
  await expect(page.locator("[data-staff-note]")).toHaveCount(8);
});

test("shows steady-pulse facts and controls only for timed studies", async ({ page }) => {
  const untimedExercise = exerciseLibrary.find((exercise) => exercise.evaluationMode === "untimed-ordered-notes");
  expect(untimedExercise).toBeDefined();

  await page.goto(exercisePracticeHref(steadyQuarterStepSkipRightHandExercise));

  await expect(page.getByRole("heading", { level: 1, name: steadyQuarterStepSkipRightHandExercise.title })).toBeVisible();
  await expect(page.getByText(steadyQuarterStepSkipRightHandExercise.instructions)).toBeVisible();
  await expect(page.getByLabel("Pitch order: C4 · E4 · D4 · F4 · G4")).toBeVisible();
  await expect(page.locator("#pulse-controls")).toBeVisible();
  await expect(page.locator("#pulse-status")).toContainText(/60 BPM.*4-beat count-in/);
  await expect(page.locator("#pulse-tempo")).toHaveValue("60");
  await expect(page.locator("#pulse-tempo option")).toHaveCount(7);
  await expect(page.locator('[id^="pulse-beat-"]')).toHaveCount(4);

  await page.goto(exercisePracticeHref(untimedExercise!));

  await expect(page.locator("#pulse-controls")).toBeHidden();
});

test("describes the even-eighth grid without implying one note per click", async ({ page }) => {
  await page.goto(exercisePracticeHref(evenEighthsRightHandExercise));

  await expect(page.getByRole("heading", { level: 1, name: evenEighthsRightHandExercise.title })).toBeVisible();
  await expect(page.locator(".practice-score-task")).toHaveText(
    "After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 & 2 & 3.",
  );
  await expect(page.getByText("Pitch order · Even eighth-note onsets")).toBeVisible();
  await expect(page.locator('a[aria-current="page"] .study-link-mode')).toHaveText("Eighth-note grid · 60 BPM");
  await expect(page.getByText("place one note on each beat")).toHaveCount(0);
});

test("serves the health endpoint", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({
    ok: true,
    name: "learn-piano-worker",
    routes: ["/", "/practice", "/api/health"],
  });
});

test("serves the generated stylesheet", async ({ request }) => {
  const response = await request.get("/styles.css");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/css");
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");

  const stylesheet = await response.text();
  expect(stylesheet).toContain("--color-app-canvas:#ebe9e0");
  expect(stylesheet).toContain(".piano-key");
  expect(stylesheet).toContain(".reading-focus-toggle");
  expect(stylesheet).toContain(".practice-page[data-cue-mode=reading-focus]");
});
