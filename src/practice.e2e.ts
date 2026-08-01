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

  const alternateExercise = exerciseLibrary[2]!;
  await page.getByRole("link", { name: new RegExp(alternateExercise.title) }).click();
  await expect(page.getByRole("heading", { level: 1, name: alternateExercise.title })).toBeVisible();
  await expect(page.getByText(alternateExercise.instructions)).toBeVisible();
  await expect(exerciseChooser.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(exerciseChooser.getByRole("link", { name: new RegExp(alternateExercise.title) })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-staff-pitch-guide]")).toHaveAttribute("data-staff-clef", "bass");

  await context.close();
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
  await expect(stage).toHaveAttribute("data-pulse-status", "running", { timeout: 5_000 });
  await expect(firstKey).toBeEnabled();

  for (const event of evenEighthsRightHandExercise.expectedEvents) {
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

  await page.evaluate(
    (events) => {
      for (const event of events) {
        window.dispatchEvent(new CustomEvent("learn-piano-native-midi", { detail: { type: "midi-event", event } }));
      }
    },
    defaultExercise.expectedEvents.map((event, index) => ({
      type: "note-on",
      channel: 1,
      noteNumber: event.noteNumber,
      velocity: 72,
      timestamp: index + 1,
    })),
  );

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

function expectedNoteNumber(index: number): number {
  const event = defaultExercise.expectedEvents[index];
  if (event === undefined) {
    throw new Error(`The canonical exercise has no expected event at index ${index}`);
  }
  return event.noteNumber;
}
