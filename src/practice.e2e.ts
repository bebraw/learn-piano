import { expect, test } from "@playwright/test";
import { defaultExercise, exerciseLibrary } from "./exercises/library/index.js";
import { formatMidiNote } from "./exercises/evaluator.js";
import { dMinorFiveNoteAscentRightHandExercise } from "./exercises/library/d-minor-five-note-exercises.js";
import { evenEighthsRightHandExercise } from "./exercises/library/even-eighth-exercises.js";
import { fiveFourPulseRightHandExercise } from "./exercises/library/five-four-pulse-exercises.js";
import { mixedEighthPatternRightHandExercise } from "./exercises/library/mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipRightHandExercise } from "./exercises/library/offbeat-step-skip-exercises.js";
import {
  orderedChordTonesRightHandExercise,
  orderedDMinorChordTonesRightHandExercise,
} from "./exercises/library/ordered-chord-tone-exercises.js";
import { repeatedNotesRightHandExercise } from "./exercises/library/repeated-note-exercises.js";
import { bachInvention1OpeningMotifRightHandExercise } from "./exercises/library/public-domain-repertoire-exercises.js";
import { steadyBrokenChordRightHandExercise } from "./exercises/library/steady-broken-chord-exercises.js";
import { threeFourBrokenChordRightHandExercise } from "./exercises/library/three-four-broken-chord-exercises.js";
import { ATTEMPT_STORAGE_KEY } from "./client/persistence/attempt-repository.js";
import { exercisePracticeHref } from "./views/exercise-presentation.js";

test("keeps the exercise useful without JavaScript", async ({ baseURL, browser }) => {
  if (baseURL === undefined) {
    throw new Error("Playwright baseURL is required");
  }

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/practice`);

  await expect(page.getByRole("heading", { level: 1, name: defaultExercise.title })).toBeVisible();
  await expect(page.getByText(defaultExercise.instructions)).toBeVisible();
  const exerciseChooser = page.getByRole("navigation", { name: "Choose an exercise" });
  await expect(
    page.getByLabel(`Pitch order: ${defaultExercise.expectedEvents.map(({ noteNumber }) => formatMidiNote(noteNumber)).join(" · ")}`),
  ).toBeVisible();
  const pitchGuide = page.locator("[data-staff-pitch-guide]");
  await expect(pitchGuide).toBeVisible();
  await expect(pitchGuide).toHaveAttribute("aria-hidden", "true");
  await expect(pitchGuide).toHaveAttribute("data-staff-clef", "treble");
  await expect(page.locator(`#staff-note-${defaultExercise.expectedEvents[0]!.id}`)).toHaveAttribute("data-note-state", "expected");
  await expect(exerciseChooser.getByRole("link")).toHaveCount(exerciseLibrary.length);
  await expect(exerciseChooser.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(exerciseChooser.getByRole("link", { name: new RegExp(defaultExercise.title) })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Live MIDI, note highlighting, and history need JavaScript.")).toBeVisible();
  await expect(page.getByText("History requires JavaScript")).toBeVisible();
  await expect(page.getByText("Enable JavaScript to read completed attempts stored in this browser.")).toBeVisible();
  await expect(page.locator("#reading-focus-toggle")).toBeHidden();

  const alternateExercise = exerciseLibrary[2]!;
  await page.getByRole("link", { name: new RegExp(alternateExercise.title) }).click();
  await expect(page.getByRole("heading", { level: 1, name: alternateExercise.title })).toBeVisible();
  await expect(page.getByText(alternateExercise.instructions)).toBeVisible();
  await expect(exerciseChooser.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(exerciseChooser.getByRole("link", { name: new RegExp(alternateExercise.title) })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-staff-pitch-guide]")).toHaveAttribute("data-staff-clef", "bass");

  await context.close();
});

test("keeps sourced repertoire useful without JavaScript", async ({ baseURL, browser }) => {
  if (baseURL === undefined) {
    throw new Error("Playwright baseURL is required");
  }

  const exercise = bachInvention1OpeningMotifRightHandExercise;
  const source = exercise.source;
  if (source.workTitle === undefined || source.referenceUrl === undefined) {
    throw new Error("The Bach repertoire fixture requires complete source metadata");
  }

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}${exercisePracticeHref(exercise)}`);

  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(page.getByText(exercise.instructions)).toBeVisible();
  await expect(page.getByLabel("Repertoire source and arrangement")).toContainText(source.workTitle);
  await expect(page.getByRole("link", { name: /Reference score/ })).toHaveAttribute("href", source.referenceUrl);
  await expect(page.locator("[data-staff-note]")).toHaveCount(8);
  await expect(page.getByRole("navigation", { name: "Choose an exercise" }).getByRole("link")).toHaveCount(exerciseLibrary.length);
  await expect(page.getByText("Live MIDI, note highlighting, and history need JavaScript.")).toBeVisible();

  await context.close();
});

test("fails closed to guided practice when the rendered staff guide is incomplete", async ({ page }) => {
  await page.route("**/client/main.js", async (route) => {
    await page.evaluate(() => {
      document.querySelector("[data-staff-note]")?.remove();
    });
    await route.continue();
  });

  await page.goto("/practice");

  await expect(page.locator("#practice-main")).toHaveAttribute("data-cue-mode", "guided");
  await expect(page.locator("#reading-focus-toggle")).toBeHidden();
  await expect(page.locator("#reading-focus-toggle")).toBeDisabled();
  await expect(page.locator("[data-staff-pitch-guide]")).toBeHidden();
  await expect(page.getByText(defaultExercise.instructions)).toBeVisible();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await playNote(page, expectedNoteNumber(0));
  await expect(page.locator("#feedback-message")).toHaveText("Correct: C4. D4 is next.");
});

test("keeps Reading Focus transient while preserving staff progress and accessible cues", async ({ page }) => {
  await page.goto("/practice");

  const practiceRoot = page.locator("#practice-main");
  const toggle = page.getByRole("button", { name: "Reading focus" });
  const nextNote = page.locator("#next-note");
  const visibleReadingCue = page.locator(".reading-focus-next-note");
  const exerciseInstructions = page.locator(".practice-heading-copy");
  const scoreSequence = page.locator(".practice-score-sequence");
  const currentStudySequence = page.locator(".study-link-current .study-link-notes");
  const firstStaffLabel = page.locator(".staff-pitch-note-label").first();
  const firstStaffNote = page.locator(`#staff-note-${defaultExercise.expectedEvents[0]!.id}`);
  const secondStaffNote = page.locator(`#staff-note-${defaultExercise.expectedEvents[1]!.id}`);
  const firstKey = page.locator(`[data-practice-key][data-note-number="${expectedNoteNumber(0)}"]`);
  const secondKey = page.locator(`[data-practice-key][data-note-number="${expectedNoteNumber(1)}"]`);
  const firstKeyName = firstKey.locator(".piano-key-note");
  const feedback = page.locator("#feedback-message");

  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "guided");
  await expect(firstKey).toHaveAttribute("aria-label", "C4, next note");
  await expect(firstKey).toHaveAttribute("aria-current", "true");
  expect(await firstKey.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");

  await toggle.click();

  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "reading-focus");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await expect(nextNote).toHaveCSS("position", "absolute");
  await expect(nextNote).toHaveCSS("width", "1px");
  await expect(exerciseInstructions).toHaveCSS("position", "absolute");
  await expect(exerciseInstructions).toHaveCSS("width", "1px");
  await expect(visibleReadingCue).toBeVisible();
  await expect(visibleReadingCue).toHaveText("On staff");
  await expect(scoreSequence).toHaveCSS("position", "absolute");
  await expect(scoreSequence).toHaveAttribute("aria-label", "Pitch order: C4 · D4 · E4 · F4 · G4");
  await expect(currentStudySequence).toHaveCSS("position", "absolute");
  await expect(firstStaffLabel).toHaveCSS("opacity", "0");
  await expect(firstKeyName).toHaveCSS("opacity", "0");
  await expect(firstKey).toHaveCSS("transform", "none");
  expect(await keyVisualTreatment(firstKey)).toEqual(await keyVisualTreatment(secondKey));
  await expect(firstKey).toHaveAttribute("aria-label", "C4, next note");
  await expect(firstKey).toHaveAttribute("aria-current", "true");
  await expect(feedback).toHaveText("Begin when your input is connected. Read the highlighted staff note, then play.");

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await firstKey.focus();
  await page.keyboard.press("Tab");
  await expect(secondKey).toBeFocused();
  expect(await secondKey.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await playNote(page, expectedNoteNumber(1));
  await expect(feedback).toHaveText("You played D4 before C4. C4 is next.");
  await expect(feedback).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "expected");

  await playNote(page, expectedNoteNumber(0));
  await expect(feedback).toHaveText("Correct. Read the next highlighted staff note.");
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "accepted");
  await expect(secondStaffNote).toHaveAttribute("data-note-state", "expected");
  await expect(page.getByText(`1 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();

  await toggle.click();
  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "guided");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(nextNote).toBeVisible();
  await expect(feedback).toHaveText("Correct: C4. D4 is next.");
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "accepted");
  await expect(secondStaffNote).toHaveAttribute("data-note-state", "expected");

  await toggle.click();
  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "reading-focus");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(feedback).toHaveText("Correct. Read the next highlighted staff note.");
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "accepted");
  await expect(secondStaffNote).toHaveAttribute("data-note-state", "expected");

  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(visibleReadingCue).toHaveText("Restart required");
  await expect(feedback).toHaveText(
    "This attempt was interrupted. Reconnect the input, then restart from the first highlighted staff note.",
  );
  await expect(feedback).not.toContainText(/C4|D4/);
  await page.getByRole("button", { name: "Connect", exact: true }).click();

  await page.getByRole("button", { name: "Restart" }).click();
  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "reading-focus");
  await expect(visibleReadingCue).toHaveText("On staff");
  await expect(page.getByText(`0 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();

  for (const event of defaultExercise.expectedEvents) {
    await playNote(page, event.noteNumber);
  }
  await expect(visibleReadingCue).toHaveText("Complete");
  await expect(feedback).toHaveText("The sequence was correct.");

  await page.reload();
  await expect(page.getByRole("button", { name: "Reading focus" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#practice-main")).toHaveAttribute("data-cue-mode", "guided");
  await expect(page.locator("#next-note")).toBeVisible();
});

test("keeps the eight-event staff pitch guide inside the practice stage on desktop, iPad, and narrow screens", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1194, height: 834 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(exercisePracticeHref(mixedEighthPatternRightHandExercise));

    const layout = await page.locator("[data-staff-pitch-guide]").evaluate((guide) => {
      const stage = guide.closest("#practice-stage");
      if (stage === null) {
        throw new Error("The staff pitch guide must stay inside the practice stage");
      }

      const guideBox = guide.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      return {
        documentFits: document.documentElement.scrollWidth <= window.innerWidth,
        guideFitsStage: guideBox.left >= stageBox.left && guideBox.right <= stageBox.right,
        guideHasArea: guideBox.width > 0 && guideBox.height > 0,
      };
    });

    expect(layout, `${viewport.width}×${viewport.height}`).toEqual({
      documentFits: true,
      guideFitsStage: true,
      guideHasArea: true,
    });
  }
});

test("reuses physical keys for returning chord tones and reloads persisted history", async ({ page }) => {
  const selectedExercise = orderedChordTonesRightHandExercise;
  await page.goto(exercisePracticeHref(selectedExercise));

  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();

  const staffNotes = selectedExercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  const cKey = page.locator('[data-practice-key][data-note-number="60"]');
  const dKey = page.locator('[data-practice-key][data-note-number="62"]');
  const eKey = page.locator('[data-practice-key][data-note-number="64"]');
  const fKey = page.locator('[data-practice-key][data-note-number="65"]');
  const gKey = page.locator('[data-practice-key][data-note-number="67"]');

  await expect(page.locator("[data-practice-key]")).toHaveCount(5);
  for (const key of [cKey, dKey, eKey, fKey, gKey]) {
    await expect(key).toHaveCount(1);
  }
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "expected");
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "remaining");
  await expect(dKey).toHaveAttribute("data-note-state", "idle");
  await expect(fKey).toHaveAttribute("data-note-state", "idle");

  await expect(page.getByLabel("Input method")).toHaveValue("mock");
  await expect(page.getByLabel("Device")).toHaveValue("mock-midi-input");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByText("Connected to Deterministic mock keyboard.")).toBeVisible();

  await playNote(page, 62);
  await expect(page.getByText("You played D4. C4 is next.")).toBeVisible();
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 60);
  await expect(page.getByText("Correct: C4. E4 is next.")).toBeVisible();
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "expected");
  await expect(cKey).toHaveAttribute("data-note-state", "remaining");
  await expect(eKey).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 64);
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[2]!).toHaveAttribute("data-note-state", "expected");
  await expect(eKey).toHaveAttribute("data-note-state", "remaining");
  await expect(gKey).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 67);
  await expect(staffNotes[2]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[3]!).toHaveAttribute("data-note-state", "expected");
  await expect(gKey).toHaveAttribute("data-note-state", "accepted");
  await expect(eKey).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 64);
  await expect(staffNotes[3]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[4]!).toHaveAttribute("data-note-state", "expected");
  await expect(eKey).toHaveAttribute("data-note-state", "accepted");
  await expect(cKey).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 60);

  await expect(page.locator("#feedback-message")).toHaveText("Sequence complete. One note did not match the sequence.");
  await expect(page.getByText("5 of 5 notes")).toBeVisible();
  await expect(cKey).toHaveAttribute("data-note-state", "accepted");
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText("The newest retained completion for this revision.")).toBeVisible();
  await expect(page.getByText("0 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
  await expect(page.getByText("Saved corrections: 1 wrong note.", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText(/Most recent completion:/)).toBeVisible();
  await expect(page.getByText("0 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
});

test("transfers ordered chord tones to D minor through the widened staff range", async ({ page }) => {
  const selectedExercise = orderedDMinorChordTonesRightHandExercise;
  await page.goto(exercisePracticeHref(selectedExercise));

  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();
  await expect(page.getByLabel("Pitch order: D4 · F4 · A4 · F4 · D4")).toBeVisible();
  await expect(page.getByText("Right hand · D–A range")).toBeVisible();
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);
  for (const noteNumber of [62, 64, 65, 67, 69]) {
    await expect(page.locator(`[data-practice-key][data-note-number="${noteNumber}"]`)).toHaveCount(1);
  }
  await expect(page.locator('[data-practice-key][data-note-number="64"]')).toHaveAttribute("data-note-state", "idle");
  await expect(page.locator('[data-practice-key][data-note-number="67"]')).toHaveAttribute("data-note-state", "idle");
  await expect(page.locator("[data-staff-note]")).toHaveCount(5);
  await expect(page.locator(`#staff-note-${selectedExercise.expectedEvents[2]!.id}`)).toContainText("A4");

  const readingFocus = page.getByRole("button", { name: "Reading focus" });
  await expect(readingFocus).toBeVisible();
  await readingFocus.click();
  await expect(page.locator("[data-practice-root]")).toHaveAttribute("data-cue-mode", "reading-focus");

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  const staffNotes = selectedExercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  await playNote(page, 62);
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "accepted");
  await expect(page.locator('[data-practice-key][data-note-number="65"]')).toHaveAttribute("data-note-state", "expected");
  await playNote(page, 65);
  await playNote(page, 69);
  await expect(staffNotes[3]!).toHaveAttribute("data-note-state", "expected");
  await expect(page.locator('[data-practice-key][data-note-number="65"]')).toHaveAttribute("data-note-state", "expected");
  await playNote(page, 65);
  await expect(page.locator('[data-practice-key][data-note-number="62"]')).toHaveAttribute("data-note-state", "expected");
  await playNote(page, 62);

  await expect(page.locator("#feedback-message")).toHaveText("The sequence was correct.");
  await expect(page.getByText("1 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
  const storedAttempt = await page.evaluate((storageKey) => {
    const serialized = localStorage.getItem(storageKey);
    if (serialized === null) {
      return null;
    }
    const parsed = JSON.parse(serialized) as { attempts: Array<Record<string, unknown>> };
    return parsed.attempts[0] ?? null;
  }, ATTEMPT_STORAGE_KEY);
  expect(storedAttempt).toMatchObject({
    exerciseId: selectedExercise.id,
    exerciseRevision: selectedExercise.revision,
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
  });
  expect(storedAttempt).not.toHaveProperty("timing");

  await page.reload();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText("1 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
});

test("completes and persists the untimed D-minor five-note ascent", async ({ page }) => {
  const selectedExercise = dMinorFiveNoteAscentRightHandExercise;
  await page.goto(exercisePracticeHref(selectedExercise));

  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();
  await expect(page.getByLabel("Pitch order: D4 · E4 · F4 · G4 · A4")).toBeVisible();
  await expect(page.getByText("Right hand · D–A range")).toBeVisible();
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);
  await expect(page.locator("[data-staff-note]")).toHaveCount(5);
  await expect(page.locator('[data-practice-key][data-note-state="idle"]')).toHaveCount(0);
  await expect(page.locator('[data-practice-key][data-note-number="62"]')).toHaveAttribute("data-note-state", "expected");
  for (const noteNumber of [64, 65, 67, 69]) {
    await expect(page.locator(`[data-practice-key][data-note-number="${noteNumber}"]`)).toHaveAttribute("data-note-state", "remaining");
  }
  const practiceRoot = page.locator("#practice-main");
  const readingFocusToggle = page.getByRole("button", { name: "Reading focus" });
  const exerciseInstructions = page.locator(".practice-heading-copy");
  await expect(readingFocusToggle).toBeVisible();
  await readingFocusToggle.click();
  await expect(practiceRoot).toHaveAttribute("data-cue-mode", "reading-focus");
  await expect(readingFocusToggle).toHaveAttribute("aria-pressed", "true");
  await expect(exerciseInstructions).toHaveCSS("position", "absolute");
  await expect(exerciseInstructions).toHaveCSS("width", "1px");
  await expect(page.getByText("Right hand · D–A range")).toBeVisible();

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  const staffNotes = selectedExercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  await playNote(page, 62);
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "expected");
  await expect(page.locator('[data-practice-key][data-note-number="64"]')).toHaveAttribute("data-note-state", "expected");
  for (const noteNumber of [64, 65, 67, 69]) {
    await playNote(page, noteNumber);
  }

  await expect(page.locator("#feedback-message")).toHaveText("The sequence was correct.");
  await expect(page.getByText("1 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
  const storedAttempt = await page.evaluate((storageKey) => {
    const serialized = localStorage.getItem(storageKey);
    if (serialized === null) {
      return null;
    }
    const parsed = JSON.parse(serialized) as { attempts: Array<Record<string, unknown>> };
    return parsed.attempts[0] ?? null;
  }, ATTEMPT_STORAGE_KEY);
  expect(storedAttempt).toMatchObject({
    exerciseId: selectedExercise.id,
    exerciseRevision: selectedExercise.revision,
    status: "completed",
    errorCounts: { outOfOrder: 0, repeated: 0, wrong: 0 },
  });
  expect(storedAttempt).not.toHaveProperty("timing");

  await page.reload();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText("1 of 1 completed without pitch or order corrections.", { exact: false })).toBeVisible();
});

test("counts in an even-eighth study and persists its MIDI-relative timing summary", async ({ page }) => {
  await page.goto(exercisePracticeHref(evenEighthsRightHandExercise));
  await page.getByRole("button", { name: "Reading focus" }).click();

  const firstEvent = evenEighthsRightHandExercise.expectedEvents[0];
  if (firstEvent === undefined) {
    throw new Error("The even-eighth study requires a first event");
  }
  const stage = page.locator("#practice-stage");
  const firstKey = page.locator(`[data-practice-key][data-note-number="${firstEvent.noteNumber}"]`);
  await expect(page.locator("#pulse-controls")).toBeVisible();
  await expect(page.locator("#pulse-tempo")).toHaveValue("60");
  await expect(page.getByRole("button", { name: "Start pulse" })).toBeDisabled();

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await expect(page.locator("#pulse-status")).toContainText("Ready at 100 BPM");

  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(stage).toHaveAttribute("data-pulse-status", /starting|counting-in/);
  await expect(firstKey).toBeDisabled();
  await expect(stage).toHaveAttribute("data-pulse-status", "counting-in");
  await expect(page.locator("#feedback-message")).toHaveText(
    "Listen through the 4-beat count-in. Begin with the highlighted staff note when the pulse starts.",
  );
  await expect(page.locator("#feedback-message")).not.toContainText(formatMidiNote(firstEvent.noteNumber));
  await expect(stage).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });
  await expect(firstKey).toBeEnabled();

  await playNote(page, firstEvent.noteNumber);
  await expect(page.locator("#feedback-message")).toHaveText("Correct. Pulse timing starts here. Read the next highlighted staff note.");

  for (const event of evenEighthsRightHandExercise.expectedEvents.slice(1)) {
    await playNote(page, event.noteNumber);
  }

  await expect(page.locator("#feedback-message")).toContainText(/The sequence was correct\..*intervals were on time at 100 BPM/);
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText("1 of 1 completed without pitch or order corrections.", { exact: true })).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{ exerciseId?: string; exerciseRevision?: number; timing?: Record<string, number> }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({
    exerciseId: evenEighthsRightHandExercise.id,
    exerciseRevision: evenEighthsRightHandExercise.revision,
    timing: { tempoBpm: 100, assessedIntervals: 4 },
  });
  expect(Object.keys(attempt ?? {}).sort()).toEqual(
    [
      "completedAt",
      "errorCounts",
      "exerciseId",
      "exerciseRevision",
      "id",
      "inputKind",
      "schemaVersion",
      "startedAt",
      "status",
      "timing",
    ].sort(),
  );
  expect((attempt?.timing?.onPulse ?? 0) + (attempt?.timing?.early ?? 0) + (attempt?.timing?.late ?? 0)).toBe(4);
  const timing = attempt?.timing;
  if (timing === undefined) {
    throw new Error("The timed completion requires saved timing evidence");
  }
  await expect(
    page.getByText(
      `Across 1 of 1 attempt with saved timing: ${timing.assessedIntervals} assessed intervals · ${timing.onPulse} on time · ${timing.early} early · ${timing.late} late.`,
      { exact: true },
    ),
  ).toBeVisible();
});

test("advances adjacent repeated-note occurrences over shared physical keys", async ({ page }) => {
  const exercise = repeatedNotesRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  const staffNotes = exercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  const cKey = page.locator('[data-practice-key][data-note-number="60"]');
  const dKey = page.locator('[data-practice-key][data-note-number="62"]');

  await expect(page.locator("[data-practice-key]")).toHaveCount(3);
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "expected");
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "remaining");

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });

  await playNote(page, 60);
  await expect(staffNotes[0]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "expected");
  await expect(cKey).toHaveAttribute("data-note-state", "expected");
  await expect(cKey).toHaveAttribute("aria-label", "C4, next note");

  await playNote(page, 60);
  await expect(staffNotes[1]!).toHaveAttribute("data-note-state", "accepted");
  await expect(staffNotes[2]!).toHaveAttribute("data-note-state", "expected");
  await expect(cKey).toHaveAttribute("data-note-state", "accepted");
  await expect(dKey).toHaveAttribute("data-note-state", "expected");

  await playNote(page, 62);
  await playNote(page, 62);
  await playNote(page, 64);

  await expect(page.getByText("5 of 5 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  const storedExerciseId = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null ? null : (JSON.parse(value) as { attempts?: Array<{ exerciseId?: string }> }).attempts?.[0]?.exerciseId;
  }, ATTEMPT_STORAGE_KEY);
  expect(storedExerciseId).toBe(exercise.id);
});

test("completes and persists an eight-onset mixed pattern", async ({ page }) => {
  const exercise = mixedEighthPatternRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(page.locator(".practice-score-task")).toContainText("Count 1 & 2 & 3 & 4 &.");
  await expect(page.locator("[data-staff-note]")).toHaveCount(8);
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);

  const staffNotes = exercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  const dKey = page.locator('[data-practice-key][data-note-number="62"]');

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });

  for (const [index, event] of exercise.expectedEvents.entries()) {
    await playNote(page, event.noteNumber);
    await expect(staffNotes[index]!).toHaveAttribute("data-note-state", "accepted");
    if (index === 2) {
      await expect(staffNotes[3]!).toHaveAttribute("data-note-state", "expected");
      await expect(dKey).toHaveAttribute("data-note-state", "expected");
    }
  }

  await expect(page.getByText("8 of 8 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{ exerciseId?: string; timing?: { assessedIntervals?: number } }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({
    exerciseId: exercise.id,
    timing: { assessedIntervals: 7 },
  });
});

test("completes and persists the eight-onset steady broken chord", async ({ page }) => {
  const exercise = steadyBrokenChordRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  const instructions = page.locator(".practice-heading-copy");
  const task = page.locator(".practice-score-task");
  const sequence = page.locator(".practice-score-sequence");
  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(page.locator('a[aria-current="page"] .study-link-mode')).toHaveText("Steady pulse · 60 BPM");
  await expect(instructions).toBeVisible();
  await expect(task).toHaveText("After the count-in, place one note on each beat.");
  await expect(task).toBeHidden();
  await expect(page.getByText("Pitch order · One note per beat")).toBeVisible();
  await expect(page.locator("[data-staff-note]")).toHaveCount(8);
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);

  await page.getByRole("button", { name: "Reading focus" }).click();
  await expect(instructions).toHaveCSS("position", "absolute");
  await expect(instructions).toHaveCSS("width", "1px");
  await expect(sequence).toHaveCSS("position", "absolute");
  await expect(task).toBeVisible();

  const staffNotes = exercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });

  for (const [index, event] of exercise.expectedEvents.entries()) {
    await playNote(page, event.noteNumber);
    await expect(staffNotes[index]!).toHaveAttribute("data-note-state", "accepted");
  }

  await expect(page.getByText("8 of 8 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{ exerciseId?: string; timing?: { assessedIntervals?: number } }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({
    exerciseId: exercise.id,
    timing: { assessedIntervals: 7 },
  });
});

test("completes and persists the seven-note broken chord in three-four", async ({ page }) => {
  const exercise = threeFourBrokenChordRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(page.locator(".practice-meta span")).toHaveText(["Right hand", "Beginner", "60 BPM", "3/4"]);
  await expect(page.locator("#pulse-status")).toHaveText("Ready at 60 BPM. Start the 3-beat count-in when you are settled.");
  await expect(page.locator(".practice-score-task")).toHaveText(
    "After the three-beat count-in, place one note on each beat. Count 1 2 3, 1 2 3, 1.",
  );
  await expect(page.getByText("Pitch order · One note per beat")).toBeVisible();
  const pulseBeats = page.locator("[data-pulse-beat]");
  await expect(pulseBeats).toHaveCount(3);
  const pulseBeatSizes = await pulseBeats.evaluateAll((beats) =>
    beats.map((beat) => {
      const { width, height } = beat.getBoundingClientRect();
      return { width, height };
    }),
  );
  expect(pulseBeatSizes.every(({ width, height }) => width > 0 && height > 0)).toBe(true);
  expect(new Set(pulseBeatSizes.map(({ width, height }) => `${width}:${height}`)).size).toBe(1);
  await expect(page.locator("[data-staff-note]")).toHaveCount(7);
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);

  const staffNotes = exercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });

  for (const [index, event] of exercise.expectedEvents.entries()) {
    await playNote(page, event.noteNumber);
    await expect(staffNotes[index]!).toHaveAttribute("data-note-state", "accepted");
  }

  await expect(page.getByText("7 of 7 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{
              exerciseId?: string;
              exerciseRevision?: number;
              inputKind?: string;
              timing?: { tempoBpm?: number; assessedIntervals?: number; onPulse?: number; early?: number; late?: number };
            }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({
    exerciseId: exercise.id,
    exerciseRevision: exercise.revision,
    inputKind: "mock",
    timing: { tempoBpm: 100, assessedIntervals: 6 },
  });
  expect((attempt?.timing?.onPulse ?? 0) + (attempt?.timing?.early ?? 0) + (attempt?.timing?.late ?? 0)).toBe(6);
});

test("completes and persists the six-note pulse in five-four", async ({ page }) => {
  const exercise = fiveFourPulseRightHandExercise;
  await page.goto(exercisePracticeHref(exercise));

  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(page.locator(".practice-meta span")).toHaveText(["Right hand", "Beginner", "60 BPM", "5/4"]);
  await expect(page.locator("#pulse-status")).toHaveText("Ready at 60 BPM. Start the 5-beat count-in when you are settled.");
  const instructions = page.locator(".practice-heading-copy");
  const task = page.locator(".practice-score-task");
  await expect(task).toHaveText("After the five-beat count-in, place one note on each beat. Count 1 2 3 4 5, 1.");
  await expect(task).toBeHidden();
  await expect(page.getByText("Pitch order · One note per beat")).toBeVisible();
  const pulseBeats = page.locator("[data-pulse-beat]");
  await expect(pulseBeats).toHaveCount(5);
  const pulseBeatSizes = await pulseBeats.evaluateAll((beats) =>
    beats.map((beat) => {
      const { width, height } = beat.getBoundingClientRect();
      return { width, height };
    }),
  );
  expect(pulseBeatSizes.every(({ width, height }) => width > 0 && height > 0)).toBe(true);
  expect(new Set(pulseBeatSizes.map(({ width, height }) => `${width}:${height}`)).size).toBe(1);
  await expect(page.locator("[data-staff-note]")).toHaveCount(6);
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);

  await page.getByRole("button", { name: "Reading focus" }).click();
  await expect(instructions).toHaveCSS("position", "absolute");
  await expect(instructions).toHaveCSS("width", "1px");
  await expect(task).toBeVisible();

  const staffNotes = exercise.expectedEvents.map((event) => page.locator(`#staff-note-${event.id}`));
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });
  await expect(page.locator("#pulse-beat-5")).toHaveAttribute("data-beat-state", "active", { timeout: 4_000 });
  await expect(page.locator("#pulse-beat-1")).toHaveAttribute("data-beat-state", "active", { timeout: 1_500 });

  for (const [index, event] of exercise.expectedEvents.entries()) {
    await playNote(page, event.noteNumber);
    await expect(staffNotes[index]!).toHaveAttribute("data-note-state", "accepted");
  }

  await expect(page.getByText("6 of 6 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{
              exerciseId?: string;
              exerciseRevision?: number;
              inputKind?: string;
              timing?: { tempoBpm?: number; assessedIntervals?: number; onPulse?: number; early?: number; late?: number };
            }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({
    exerciseId: exercise.id,
    exerciseRevision: exercise.revision,
    inputKind: "mock",
    timing: { tempoBpm: 100, assessedIntervals: 5 },
  });
  expect((attempt?.timing?.onPulse ?? 0) + (attempt?.timing?.early ?? 0) + (attempt?.timing?.late ?? 0)).toBe(5);
});

test("keeps offbeat count guidance visible in Reading Focus and persists completion", async ({ page }) => {
  const exercise = offbeatStepSkipRightHandExercise;
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(exercisePracticeHref(exercise));

  const instructions = page.locator(".practice-heading-copy");
  const task = page.locator(".practice-score-task");
  const sequence = page.locator(".practice-score-sequence");
  await expect(page.getByRole("heading", { level: 1, name: exercise.title })).toBeVisible();
  await expect(instructions).toBeVisible();
  await expect(task).toHaveText(
    "After the count-in, play the first note on 1, then place each remaining note on an “and” count between clicks. Count 1 & 2 & 3 & 4 &.",
  );
  await expect(task).toBeHidden();
  await expect(page.getByText("Pitch order · Downbeat then offbeat onsets")).toBeVisible();
  await expect(page.locator("[data-staff-note]")).toHaveCount(5);
  await expect(page.locator("[data-practice-key]")).toHaveCount(5);

  await page.getByRole("button", { name: "Reading focus" }).click();
  await expect(instructions).toHaveCSS("position", "absolute");
  await expect(instructions).toHaveCSS("width", "1px");
  await expect(sequence).toHaveCSS("position", "absolute");
  await expect(task).toBeVisible();

  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("#pulse-tempo").selectOption("100");
  await page.getByRole("button", { name: "Start pulse" }).click();
  await expect(page.locator("#practice-stage")).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });

  for (const event of exercise.expectedEvents) {
    await playNote(page, event.noteNumber);
  }

  await expect(page.getByText("5 of 5 notes")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const attempt = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null
      ? null
      : (
          JSON.parse(value) as {
            attempts?: Array<{
              exerciseId?: string;
              timing?: { assessedIntervals?: number; onPulse?: number; early?: number; late?: number };
            }>;
          }
        ).attempts?.[0];
  }, ATTEMPT_STORAGE_KEY);
  expect(attempt).toMatchObject({ exerciseId: exercise.id, timing: { assessedIntervals: 4 } });
  expect((attempt?.timing?.onPulse ?? 0) + (attempt?.timing?.early ?? 0) + (attempt?.timing?.late ?? 0)).toBe(4);
});

test("uses the injected iPad bridge through the shared practice flow", async ({ page }) => {
  await page.addInitScript(() => {
    const input = { id: "coremidi:61", label: "GO:PIANO 61" };
    let state: { status: string; selectedInputId: string | null; errorMessage: string | null } = {
      status: "idle",
      selectedInputId: null,
      errorMessage: null,
    };

    const handler = {
      async postMessage(command: { type: string; inputId?: string }): Promise<unknown> {
        if (command.type === "select-input" && command.inputId === input.id) {
          state = { status: "connected", selectedInputId: input.id, errorMessage: null };
        } else if (command.type === "disconnect") {
          state = { status: "disconnected", selectedInputId: state.selectedInputId, errorMessage: null };
        }
        return { ok: true, inputs: [input], state };
      },
    };

    Object.defineProperty(window, "webkit", {
      configurable: true,
      value: { messageHandlers: { learnPianoMidi: handler } },
    });
  });
  await page.goto("/practice");

  await expect(page.getByLabel("Input method")).toHaveValue("native-midi");
  await expect(page.getByLabel("Device")).toHaveValue("coremidi:61");
  await expect(page.getByRole("button", { name: "Pair Bluetooth MIDI" })).toBeVisible();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByText("Connected to GO:PIANO 61.")).toBeVisible();
  await page.getByRole("button", { name: "Reading focus" }).click();

  const firstEvent = defaultExercise.expectedEvents[0]!;
  const firstKey = page.locator(`[data-practice-key][data-note-number="${firstEvent.noteNumber}"]`);
  const nextKey = page.locator(`[data-practice-key][data-note-number="${defaultExercise.expectedEvents[1]!.noteNumber}"]`);
  await page.evaluate(
    (event) => {
      window.dispatchEvent(new CustomEvent("learn-piano-native-midi", { detail: { type: "midi-event", event } }));
    },
    {
      type: "note-on",
      channel: 1,
      noteNumber: firstEvent.noteNumber,
      velocity: 72,
      timestamp: 1,
    },
  );

  await expect(firstKey).toHaveAttribute("aria-pressed", "true");
  await expect(firstKey).toHaveCSS("border-color", "rgb(223, 131, 94)");
  await expect(firstKey).toHaveCSS("background-color", "rgb(242, 199, 179)");
  expect(await keyVisualTreatment(firstKey)).not.toEqual(await keyVisualTreatment(nextKey));
  await expect(page.locator("#feedback-message")).toHaveText("Correct. Read the next highlighted staff note.");

  await page.evaluate(
    (events) => {
      for (const event of events) {
        window.dispatchEvent(new CustomEvent("learn-piano-native-midi", { detail: { type: "midi-event", event } }));
      }
    },
    [
      {
        type: "note-off",
        channel: 1,
        noteNumber: firstEvent.noteNumber,
        velocity: 0,
        timestamp: 1.5,
      },
      ...defaultExercise.expectedEvents.slice(1).map((event, index) => ({
        type: "note-on",
        channel: 1,
        noteNumber: event.noteNumber,
        velocity: 72,
        timestamp: index + 2,
      })),
    ],
  );

  await expect(firstKey).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("The sequence was correct.")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  const suggestedExercise = exerciseLibrary[1]!;
  await expect(page.locator("#next-study-title")).toHaveText(suggestedExercise.title);
  await expect(page.locator("#next-study-reason")).toHaveText("Builds directly on the study you just completed.");
  await expect(page.getByRole("link", { name: "Open next study" })).toHaveAttribute("href", exercisePracticeHref(suggestedExercise));
  const storedInputKind = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null ? null : (JSON.parse(value) as { attempts?: Array<{ inputKind?: string }> }).attempts?.[0]?.inputKind;
  }, ATTEMPT_STORAGE_KEY);
  expect(storedInputKind).toBe("native-midi");
});

test("shows correction feedback and requires restart after an interruption", async ({ page }) => {
  await page.goto("/practice");
  await page.getByRole("button", { name: "Connect", exact: true }).click();

  const firstNote = expectedNoteNumber(0);
  const secondNote = expectedNoteNumber(1);
  const thirdNote = expectedNoteNumber(2);
  const firstStaffNote = page.locator(`#staff-note-${defaultExercise.expectedEvents[0]!.id}`);
  const secondStaffNote = page.locator(`#staff-note-${defaultExercise.expectedEvents[1]!.id}`);
  await playNote(page, firstNote);
  await playNote(page, firstNote);
  await expect(page.getByText(`You repeated ${formatMidiNote(firstNote)}. ${formatMidiNote(secondNote)} is next.`)).toBeVisible();
  await playNote(page, thirdNote);
  await expect(
    page.getByText(`You played ${formatMidiNote(thirdNote)} before ${formatMidiNote(secondNote)}. ${formatMidiNote(secondNote)} is next.`),
  ).toBeVisible();

  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(
    page.getByText(`This attempt was interrupted. Reconnect the input, then restart from ${formatMidiNote(firstNote)}.`),
  ).toBeVisible();
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "accepted");
  await expect(secondStaffNote).toHaveAttribute("data-note-state", "expected");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await playNote(page, secondNote);
  await expect(page.getByText(`1 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();

  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByText(`0 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();
  await expect(page.locator(`[data-practice-key][data-note-number="${firstNote}"]`)).toHaveAttribute("aria-current", "true");
  await expect(firstStaffNote).toHaveAttribute("data-note-state", "expected");
  await expect(secondStaffNote).toHaveAttribute("data-note-state", "remaining");
  await expect(page.getByText("0 attempts completed today")).toBeVisible();
});

async function playNote(page: import("@playwright/test").Page, noteNumber: number): Promise<void> {
  await page.locator(`[data-practice-key][data-note-number="${noteNumber}"]`).click();
}

async function keyVisualTreatment(key: import("@playwright/test").Locator): Promise<Record<string, string>> {
  return key.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.background,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
    };
  });
}

function expectedNoteNumber(index: number): number {
  const event = defaultExercise.expectedEvents[index];
  if (event === undefined) {
    throw new Error(`The canonical exercise has no expected event at index ${index}`);
  }
  return event.noteNumber;
}
