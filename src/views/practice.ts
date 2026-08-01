import { formatMidiNote } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";
import {
  exercisePracticeHref,
  formatExerciseCategory,
  formatExerciseDifficulty,
  formatExerciseHand,
  formatExerciseNoteOrder,
} from "./exercise-presentation.js";
import { escapeHtml } from "./shared.js";

export function renderPracticePage(exercise: Exercise, exerciseLibrary: readonly Exercise[]): string {
  const firstEvent = exercise.expectedEvents[0];
  if (firstEvent === undefined) {
    throw new Error("A practice page requires at least one expected event");
  }

  const noteSequence = formatExerciseNoteOrder(exercise);
  const handLabel = formatExerciseHand(exercise);
  const categoryLabel = formatExerciseCategory(exercise);
  const difficultyLabel = formatExerciseDifficulty(exercise);
  const guideLabel = `${exercise.expectedEvents.length}-note guide`;
  const pianoKeys = [...exercise.expectedEvents]
    .sort((left, right) => left.noteNumber - right.noteNumber)
    .map((event) => {
      const noteLabel = formatMidiNote(event.noteNumber);
      const isExpected = event.id === firstEvent.id;
      return `<button
        class="piano-key flex min-w-0 flex-col items-center justify-end gap-1 px-2 pb-4"
        id="practice-key-${escapeHtml(event.id)}"
        type="button"
        data-practice-key
        data-event-id="${escapeHtml(event.id)}"
        data-note-number="${event.noteNumber}"
        data-note-state="${isExpected ? "expected" : "remaining"}"
        aria-label="${escapeHtml(noteLabel)}${isExpected ? ", next note" : ""}"
        aria-current="${isExpected ? "true" : "false"}"
        aria-pressed="false"
        disabled
      >
        <span class="text-xl font-semibold tracking-[-0.03em]">${escapeHtml(noteLabel.replace(/-?\d+$/, ""))}</span>
        <span class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-70">${escapeHtml(noteLabel)}</span>
      </button>`;
    })
    .join("");
  const exerciseCatalog = renderExerciseCatalog(exercise, exerciseLibrary);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(`${exercise.title}: ${exercise.instructions}`)}">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(exercise.title)} · Piano Practice</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="min-h-screen bg-app-canvas text-app-text antialiased">
    <a class="fixed left-4 top-4 z-10 -translate-y-24 rounded-lg bg-app-text px-4 py-3 font-semibold text-app-canvas transition focus:translate-y-0" href="#practice-main">Skip to exercise</a>
    <main
      id="practice-main"
      class="mx-auto w-[min(52rem,calc(100vw-2rem))] py-8 sm:py-12"
      data-practice-root
      data-exercise-id="${escapeHtml(exercise.id)}"
      data-exercise-revision="${exercise.revision}"
    >
      <header class="mb-8 border-b border-app-line pb-6 sm:mb-10 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <a class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft transition hover:text-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/30" href="/">Piano Practice</a>
          <p class="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-app-accent">${escapeHtml(categoryLabel)} · Untimed</p>
          <h1 class="mt-3 max-w-[12ch] text-4xl leading-[0.95] font-semibold tracking-[-0.05em] sm:text-6xl">${escapeHtml(exercise.title)}</h1>
        </div>
        <p class="mt-5 max-w-xs text-sm leading-6 text-app-text-soft sm:mt-0 sm:text-right">${escapeHtml(handLabel)} · ${escapeHtml(difficultyLabel)}<br>No timer, score, or speed target</p>
      </header>

      <article class="space-y-8 sm:space-y-10">
        ${exerciseCatalog}

        <section aria-labelledby="instructions-heading">
          <p id="instructions-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">Your task</p>
          <p class="mt-3 max-w-2xl text-2xl leading-9 tracking-[-0.025em] sm:text-3xl sm:leading-10">${escapeHtml(exercise.instructions)}</p>
          <p class="mt-3 font-semibold tracking-[0.08em] text-app-accent-strong" aria-label="Expected notes: ${escapeHtml(noteSequence)}">${escapeHtml(noteSequence)}</p>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-app-text-soft">Play each note once in order. A mistake does not erase correct progress; the next expected note stays highlighted.</p>
        </section>

        <section class="rounded-[1.6rem] border border-app-line/90 bg-app-surface/90 p-4 shadow-panel sm:p-6" aria-labelledby="input-heading">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p id="input-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">Input</p>
              <p id="connection-status" class="mt-2 text-base font-semibold" role="status" aria-live="polite">Live input is not connected.</p>
            </div>
            <span class="rounded-full border border-app-line px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-app-text-soft">Local only</span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2" data-enhancement hidden>
            <label class="text-sm font-semibold" for="input-kind">Input method
              <select class="practice-control mt-2 w-full px-3" id="input-kind">
                <option value="mock">On-screen practice keys</option>
                <option value="web-midi">Web MIDI keyboard</option>
              </select>
            </label>
            <label class="text-sm font-semibold" for="midi-input">Device
              <select class="practice-control mt-2 w-full px-3" id="midi-input" disabled>
                <option value="">Choose an input</option>
              </select>
            </label>
            <div class="flex flex-wrap gap-2 sm:col-span-2">
              <button class="practice-button px-4 text-sm font-semibold" id="connect-input" type="button" disabled>Connect</button>
              <button class="practice-button practice-button-secondary px-4 text-sm font-semibold" id="refresh-inputs" type="button">Refresh inputs</button>
              <button class="practice-button practice-button-secondary px-4 text-sm font-semibold" id="disconnect-input" type="button" disabled>Disconnect</button>
            </div>
          </div>
          <p class="mt-4 text-sm leading-6 text-app-text-soft" id="javascript-status">Live MIDI, note highlighting, and history need JavaScript. The exercise instructions above remain available.</p>
        </section>

        <section aria-labelledby="keyboard-heading">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p id="keyboard-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">${escapeHtml(guideLabel)}</p>
              <p class="mt-2 text-lg"><span class="text-app-text-soft">Next note:</span> <strong id="next-note">${escapeHtml(formatMidiNote(firstEvent.noteNumber))}</strong></p>
            </div>
            <p id="progress-text" class="text-sm text-app-text-soft">0 of ${exercise.expectedEvents.length} notes</p>
          </div>
          <div class="practice-keyboard grid gap-1.5 rounded-[1.4rem] border border-app-line bg-app-ink-faint p-2 sm:gap-2.5 sm:p-3" aria-label="${escapeHtml(exercise.title)} note guide">
            ${pianoKeys}
          </div>
          <p class="mt-3 text-center text-xs leading-5 text-app-text-soft" id="keyboard-help">Connect the on-screen input to make these keys playable, or use a connected MIDI keyboard.</p>
        </section>

        <section class="border-y border-app-line py-5" aria-labelledby="feedback-heading">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p id="feedback-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">Feedback</p>
              <p id="feedback-message" class="mt-2 max-w-2xl text-xl leading-8 tracking-[-0.02em]" role="status" aria-live="polite">Begin when your input is connected. ${escapeHtml(formatMidiNote(firstEvent.noteNumber))} is first.</p>
              <p id="persistence-message" class="mt-2 text-sm leading-6 text-app-text-soft" role="status" aria-live="polite" hidden></p>
            </div>
            <button class="practice-button practice-button-secondary px-4 text-sm font-semibold" id="restart-exercise" type="button" data-enhancement hidden>Restart</button>
          </div>
        </section>

        <section aria-labelledby="history-heading">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p id="history-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">Practice history</p>
              <p id="history-count" class="mt-2 text-2xl font-semibold tracking-[-0.035em]">History requires JavaScript</p>
            </div>
            <p class="text-xs uppercase tracking-[0.16em] text-app-text-soft">Stored in this browser</p>
          </div>
          <p id="history-detail" class="mt-3 text-sm leading-6 text-app-text-soft" role="status" aria-live="polite">Enable JavaScript to read completed attempts stored in this browser.</p>
        </section>

        <footer class="border-t border-app-line pt-5 text-sm leading-6 text-app-text-soft">
          MIDI can confirm pitch and order here. It cannot assess posture, tension, fingering, or replace feedback from a qualified teacher.
        </footer>
      </article>
    </main>
    <script type="module" src="/client/main.js"></script>
  </body>
</html>`;
}

function renderExerciseCatalog(selectedExercise: Exercise, exerciseLibrary: readonly Exercise[]): string {
  const items = exerciseLibrary
    .map((exercise) => {
      const selected = exercise.id === selectedExercise.id;
      return `<li>
        <a
          class="exercise-link block rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/35${selected ? " border-app-accent/35 bg-app-accent-ghost" : " border-app-line/80 bg-white/45 hover:border-app-accent/30 hover:bg-white/70"}"
          href="${escapeHtml(exercisePracticeHref(exercise))}"
          ${selected ? 'aria-current="page"' : ""}
        >
          <span class="flex items-start justify-between gap-3">
            <span class="font-semibold tracking-[-0.01em]">${escapeHtml(exercise.title)}</span>
            <span class="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-app-text-soft">${selected ? "Current" : escapeHtml(formatExerciseHand(exercise))}</span>
          </span>
          <span class="mt-1.5 block text-xs leading-5 text-app-text-soft" aria-label="Note order: ${escapeHtml(formatExerciseNoteOrder(exercise))}">${escapeHtml(formatExerciseNoteOrder(exercise))}</span>
        </a>
      </li>`;
    })
    .join("");

  return `<nav class="border-b border-app-line pb-8" aria-labelledby="exercise-library-heading">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 id="exercise-library-heading" class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-app-text-soft">Choose an exercise</h2>
      <p class="text-xs text-app-text-soft">${exerciseLibrary.length} available · progress kept per exercise</p>
    </div>
    <ul class="grid gap-2 sm:grid-cols-2">${items}</ul>
  </nav>`;
}
