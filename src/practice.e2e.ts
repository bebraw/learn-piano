import { expect, test } from "@playwright/test";
import { defaultExercise, exerciseLibrary } from "./exercises/library/index.js";
import { formatMidiNote } from "./exercises/evaluator.js";
import { steadyQuarterRightHandExercise } from "./exercises/library/steady-quarter-exercises.js";
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
    page.getByLabel(`Expected notes: ${defaultExercise.expectedEvents.map(({ noteNumber }) => formatMidiNote(noteNumber)).join(" · ")}`),
  ).toBeVisible();
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

  await context.close();
});

test("completes a selected exercise and reloads its persisted history through mock input", async ({ page }) => {
  const selectedExercise = exerciseLibrary[1]!;
  await page.goto(exercisePracticeHref(selectedExercise));

  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();

  await expect(page.getByLabel("Input method")).toHaveValue("mock");
  await expect(page.getByLabel("Device")).toHaveValue("mock-midi-input");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByText("Connected to Deterministic mock keyboard.")).toBeVisible();

  for (const [index, event] of selectedExercise.expectedEvents.entries()) {
    const noteNumber = event.noteNumber;
    await playNote(page, noteNumber);
    if (index === 0) {
      const nextNote = selectedExercise.expectedEvents[1]?.noteNumber;
      if (nextNote === undefined) {
        throw new Error("The selected canonical exercise requires a second note");
      }
      await expect(page.getByText(`Correct: ${formatMidiNote(noteNumber)}. ${formatMidiNote(nextNote)} is next.`)).toBeVisible();
    }
  }

  await expect(page.getByText("The sequence was correct.")).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: selectedExercise.title })).toBeVisible();
  await expect(page.getByText("1 attempt completed today")).toBeVisible();
  await expect(page.getByText(/Most recent completion:/)).toBeVisible();
});

test("counts in a timed study and persists its MIDI-relative pulse summary", async ({ page }) => {
  await page.goto(exercisePracticeHref(steadyQuarterRightHandExercise));

  const firstEvent = steadyQuarterRightHandExercise.expectedEvents[0];
  if (firstEvent === undefined) {
    throw new Error("The steady-quarter study requires a first event");
  }
  const stage = page.locator("#practice-stage");
  const firstKey = page.locator(`[data-note-number="${firstEvent.noteNumber}"]`);
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

  for (const event of steadyQuarterRightHandExercise.expectedEvents) {
    await playNote(page, event.noteNumber);
  }

  await expect(page.locator("#feedback-message")).toContainText(/intervals stayed on the pulse at 100 BPM/);
  await expect(page.getByText("1 attempt completed today")).toBeVisible();

  const timing = await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value === null ? null : (JSON.parse(value) as { attempts?: Array<{ timing?: Record<string, number> }> }).attempts?.[0]?.timing;
  }, ATTEMPT_STORAGE_KEY);
  expect(timing).toMatchObject({ tempoBpm: 100, assessedIntervals: 4 });
  expect((timing?.onPulse ?? 0) + (timing?.early ?? 0) + (timing?.late ?? 0)).toBe(4);
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
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await playNote(page, secondNote);
  await expect(page.getByText(`1 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();

  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByText(`0 of ${defaultExercise.expectedEvents.length} notes`)).toBeVisible();
  await expect(page.locator(`[data-note-number="${firstNote}"]`)).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("0 attempts completed today")).toBeVisible();
});

async function playNote(page: import("@playwright/test").Page, noteNumber: number): Promise<void> {
  await page.locator(`[data-note-number="${noteNumber}"]`).click();
}

function expectedNoteNumber(index: number): number {
  const event = defaultExercise.expectedEvents[index];
  if (event === undefined) {
    throw new Error(`The canonical exercise has no expected event at index ${index}`);
  }
  return event.noteNumber;
}
