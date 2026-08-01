import { describe, expect, it } from "vitest";
import { defaultExercise, exerciseLibrary } from "./exercises/library";
import { steadyQuarterStepSkipRightHandExercise } from "./exercises/library/steady-quarter-exercises";
import { exercisePracticeHref } from "./views/exercise-presentation";
import worker, { handleRequest } from "./worker";
import { ensureGeneratedStylesheet } from "./test-support";

ensureGeneratedStylesheet();

describe("worker", () => {
  it("renders the piano practice home page", async () => {
    const response = await handleRequest(new Request("http://example.com/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    const body = await response.text();
    expect(body).toContain("Piano Practice");
    expect(body).toContain(exercisePracticeHref(defaultExercise));
    expect(body).toContain("Choose your next study");
    expect(exerciseLibrary).toHaveLength(10);
    expect(body.match(/class="folio-card group"/g)).toHaveLength(exerciseLibrary.length);
    expect(body.match(/data-mode="timed"/g)).toHaveLength(4);
    expect(body).toContain("/api/health");
  });

  it("renders canonical practice instructions before enhancement", async () => {
    const response = await handleRequest(new Request("http://example.com/practice"));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Play C-D-E-F-G in ascending order with your right hand.");
    expect(body).toContain('type="module" src="/client/main.js"');
    expect(body).toContain('data-note-number="60"');
    expect(body).toContain("data-staff-pitch-guide");
    expect(body).toContain('data-staff-clef="treble"');
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body).toContain('aria-label="Pitch order: C4 · D4 · E4 · F4 · G4"');
    expect(body).toContain('id="pulse-controls"');
    expect(body.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).toContain("hidden");
  });

  it("selects a canonical exercise from the query string", async () => {
    const selectedExercise = exerciseLibrary[1]!;
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(selectedExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(selectedExercise.instructions);
    expect(body).toContain(`data-exercise-id="${selectedExercise.id}"`);
    expect(body).toContain('aria-current="page"');
  });

  it("renders steady-pulse controls and timing facts for a timed exercise", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(steadyQuarterStepSkipRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(steadyQuarterStepSkipRightHandExercise.instructions);
    expect(body).toContain(`data-exercise-id="${steadyQuarterStepSkipRightHandExercise.id}"`);
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · D4 · F4 · G4"');
    expect(body.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).not.toContain("hidden");
    expect(body).toContain('id="pulse-tempo"');
    expect(body).toContain("60 BPM · 4/4 · Four-beat count-in before your first note.");
  });

  it("returns not found for an unknown, empty, or ambiguous exercise id", async () => {
    const unknown = await handleRequest(new Request("http://example.com/practice?exercise=not-in-the-library"));
    const empty = await handleRequest(new Request("http://example.com/practice?exercise="));
    const duplicate = await handleRequest(
      new Request(`http://example.com/practice?exercise=${defaultExercise.id}&exercise=${exerciseLibrary[1]!.id}`),
    );

    expect(unknown.status).toBe(404);
    expect(await unknown.text()).toContain("exercise=not-in-the-library");
    expect(empty.status).toBe(404);
    expect(duplicate.status).toBe(404);
  });

  it("returns a JSON health response", async () => {
    const response = await handleRequest(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: "learn-piano-worker",
      routes: ["/", "/practice", "/api/health"],
    });
  });

  it("returns a not found page for unknown routes", async () => {
    const response = await handleRequest(new Request("http://example.com/missing"));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");

    const body = await response.text();
    expect(body).toContain("Not Found");
    expect(body).toContain("/missing");
  });

  it("exposes the same behavior through the worker fetch entrypoint", async () => {
    const response = await worker.fetch(new Request("http://example.com/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("serves generated styles", async () => {
    const response = await handleRequest(new Request("http://example.com/styles.css"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.text()).resolves.toContain("--color-app-canvas:#ebe9e0");
  });
});
