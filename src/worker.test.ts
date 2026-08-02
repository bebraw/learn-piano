import { describe, expect, it, vi } from "vitest";
import { defaultExercise, exerciseLibrary } from "./exercises/library";
import { dMinorFiveNoteAscentRightHandExercise } from "./exercises/library/d-minor-five-note-exercises.js";
import { fiveFourPulseRightHandExercise } from "./exercises/library/five-four-pulse-exercises.js";
import { mixedEighthPatternRightHandExercise } from "./exercises/library/mixed-eighth-pattern-exercises";
import { offbeatStepSkipRightHandExercise } from "./exercises/library/offbeat-step-skip-exercises";
import { steadyQuarterStepSkipRightHandExercise } from "./exercises/library/steady-quarter-exercises";
import {
  orderedChordTonesRightHandExercise,
  orderedDMinorChordTonesRightHandExercise,
} from "./exercises/library/ordered-chord-tone-exercises";
import { repeatedNotesRightHandExercise } from "./exercises/library/repeated-note-exercises";
import { bachInvention1OpeningMotifRightHandExercise } from "./exercises/library/public-domain-repertoire-exercises.js";
import { steadyBrokenChordRightHandExercise } from "./exercises/library/steady-broken-chord-exercises.js";
import { threeFourBrokenChordRightHandExercise } from "./exercises/library/three-four-broken-chord-exercises.js";
import { exercisePracticeHref } from "./views/exercise-presentation";
import worker, { handleRequest } from "./worker";

const { stylesheetFixture, readFileMock } = vi.hoisted(() => ({
  stylesheetFixture: ":root{--test-stylesheet-ready:1;}",
  readFileMock: vi.fn(async (stylesheetUrl: URL, encoding: string): Promise<string> => {
    if (!stylesheetUrl.pathname.endsWith("/.generated/browser/styles.css") || encoding !== "utf8") {
      throw new Error(`Unexpected stylesheet read: ${stylesheetUrl.href} (${encoding})`);
    }

    return ":root{--test-stylesheet-ready:1;}";
  }),
}));

vi.mock("node:fs/promises", () => ({ readFile: readFileMock }));

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
    expect(body).toContain("Your local practice");
    expect(body).toContain("Enable JavaScript to read completions saved in this browser.");
    expect(body).toContain("data-home-root");
    expect(body).toContain('type="module" src="/client/main.js"');
    expect(exerciseLibrary).toHaveLength(33);
    expect(body.match(/class="folio-card group"/g)).toHaveLength(exerciseLibrary.length);
    expect(body.match(/data-completion-badge hidden/g)).toHaveLength(exerciseLibrary.length);
    expect(body.match(/data-mode="timed"/g)).toHaveLength(18);
    expect(body.match(/Steady pulse · 60 BPM/g)).toHaveLength(10);
    expect(body).toContain("/api/health");
  });

  it("renders public-domain repertoire provenance from canonical metadata", async () => {
    const response = await handleRequest(
      new Request(`http://example.com${exercisePracticeHref(bachInvention1OpeningMotifRightHandExercise)}`),
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Public-domain learning arrangement");
    expect(body).toContain(bachInvention1OpeningMotifRightHandExercise.source.attribution);
    expect(body).toContain(bachInvention1OpeningMotifRightHandExercise.source.workTitle);
    expect(body).toContain(bachInvention1OpeningMotifRightHandExercise.source.referenceUrl);
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

  it("renders repeated chord tones as event occurrences over one physical C position", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(orderedChordTonesRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · G4 · E4 · C4"');
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body.match(/data-note-number="60"/g)).toHaveLength(1);
    expect(body).toContain('data-note-number="62"\n        data-note-state="idle"');
    expect(body).toContain('data-note-number="65"\n        data-note-state="idle"');
  });

  it("renders the D-minor transfer over a physical D-through-A range", async () => {
    const response = await handleRequest(
      new Request(`http://example.com${exercisePracticeHref(orderedDMinorChordTonesRightHandExercise)}`),
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('aria-label="Pitch order: D4 · F4 · A4 · F4 · D4"');
    expect(body).toContain("Right hand · D–A range");
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body.match(/data-note-number="69"/g)).toHaveLength(1);
    expect(body).toContain('data-note-number="64"\n        data-note-state="idle"');
    expect(body).toContain('data-note-number="67"\n        data-note-state="idle"');
  });

  it("server-renders the complete D-minor five-note position as expected pitches", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(dMinorFiveNoteAscentRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('aria-label="Pitch order: D4 · E4 · F4 · G4 · A4"');
    expect(body).toContain("Right hand · D–A range");
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body).not.toContain('data-note-state="idle"');
    expect(body).toContain('data-note-number="69"\n        data-note-state="remaining"');
  });

  it("renders adjacent repeated notes as separate events over shared physical keys", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(repeatedNotesRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('aria-label="Pitch order: C4 · C4 · D4 · D4 · E4"');
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body.match(/data-practice-key/g)).toHaveLength(3);
    for (const noteNumber of [60, 62, 64]) {
      expect(body.match(new RegExp(`data-note-number="${noteNumber}"`, "g"))).toHaveLength(1);
    }
  });

  it("renders the eight-event mixed pattern over one physical C position", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(mixedEighthPatternRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · D4 · D4 · F4 · G4 · E4 · C4"');
    expect(body.match(/data-staff-note/g)).toHaveLength(8);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body).toContain("Count 1 &amp; 2 &amp; 3 &amp; 4 &amp;.");
  });

  it("server-renders the selected steady broken chord as eight occurrences over five keys", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(steadyBrokenChordRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(steadyBrokenChordRightHandExercise.instructions);
    expect(body).toContain(`data-exercise-id="${steadyBrokenChordRightHandExercise.id}"`);
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · G4 · E4 · C4 · E4 · G4 · E4"');
    expect(body).toContain("Pitch order · One note per beat");
    expect(body).toContain("Steady pulse · 60 BPM");
    expect(body.match(/data-staff-note/g)).toHaveLength(8);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).not.toContain("hidden");
  });

  it("server-renders the selected 3/4 broken chord as seven occurrences over five keys", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(threeFourBrokenChordRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(threeFourBrokenChordRightHandExercise.instructions);
    expect(body).toContain(`data-exercise-id="${threeFourBrokenChordRightHandExercise.id}"`);
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · G4 · C4 · E4 · G4 · C4"');
    expect(body).toContain("After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.");
    expect(body).toContain("Pitch order · One note per beat");
    expect(body).toContain("Steady pulse · 60 BPM");
    expect(body).toContain("60 BPM · 3/4 · Three-beat count-in before your first note.");
    expect(body.match(/data-staff-note/g)).toHaveLength(7);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).not.toContain("hidden");
  });

  it("server-renders the selected 5/4 pulse as six occurrences over five keys", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(fiveFourPulseRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(fiveFourPulseRightHandExercise.instructions);
    expect(body).toContain(`data-exercise-id="${fiveFourPulseRightHandExercise.id}"`);
    expect(body).toContain('aria-label="Pitch order: C4 · D4 · E4 · F4 · G4 · C4"');
    expect(body).toContain("After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.");
    expect(body).toContain("Pitch order · One note per beat");
    expect(body).toContain("Steady pulse · 60 BPM");
    expect(body).toContain("60 BPM · 5/4 · Five-beat count-in before your first note.");
    expect(body.match(/data-staff-note/g)).toHaveLength(6);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
    expect(body.match(/data-pulse-beat/g)).toHaveLength(5);
    expect(body.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).not.toContain("hidden");
  });

  it("renders a selected offbeat study with explicit onset guidance", async () => {
    const response = await handleRequest(new Request(`http://example.com${exercisePracticeHref(offbeatStepSkipRightHandExercise)}`));

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("After the four-beat count-in, play C on beat 1, then E-D-F-G");
    expect(body).toContain('aria-label="Pitch order: C4 · E4 · D4 · F4 · G4"');
    expect(body).toContain("Count 1 &amp; 2 &amp; 3 &amp; 4 &amp;.");
    expect(body).toContain("Pitch order · Downbeat then offbeat onsets");
    expect(body.match(/data-staff-note/g)).toHaveLength(5);
    expect(body.match(/data-practice-key/g)).toHaveLength(5);
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
    const stylesheet = await response.text();
    expect(stylesheet).toBe(stylesheetFixture);
  });
});
