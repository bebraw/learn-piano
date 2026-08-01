import { expect, test } from "@playwright/test";
import { defaultExercise, exerciseLibrary } from "./exercises/library/index.js";
import { formatMidiNote } from "./exercises/evaluator.js";
import { evenEighthsRightHandExercise } from "./exercises/library/even-eighth-exercises.js";
import { orderedChordTonesRightHandExercise } from "./exercises/library/ordered-chord-tone-exercises.js";
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

test("keeps the staff pitch guide inside the practice stage on desktop, iPad, and narrow screens", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1194, height: 834 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/practice");

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

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText(/Most recent completion:/)).toBeVisible();
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
