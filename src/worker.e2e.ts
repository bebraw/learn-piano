import { expect, test } from "@playwright/test";
import { exerciseLibrary } from "./exercises/library/index.js";

test("renders the piano practice home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Piano Practice" })).toBeVisible();
  await expect(page.getByText("Small, focused studies for building calm and reliable movement at the keyboard.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose your next study" })).toBeVisible();
  const exerciseFolio = page.locator(".folio-grid");
  await expect(exerciseFolio.locator('a[href^="/practice?exercise="]')).toHaveCount(exerciseLibrary.length);
  for (const exercise of exerciseLibrary) {
    await expect(page.getByRole("link", { name: new RegExp(exercise.title) })).toBeVisible();
  }
  await expect(page.locator('a[href="/api/health"]').first()).toBeVisible();
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
});
