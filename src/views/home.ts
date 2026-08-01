import type { Exercise } from "../exercises/types";
import { exercisePracticeHref, formatExerciseCategory, formatExerciseHand, formatExerciseNoteOrder } from "./exercise-presentation";
import { escapeHtml } from "./shared";

const appTitle = "Piano Practice";
const appDescription = "A calm, local-first practice companion for focused exercises, useful feedback, and progress you can understand.";

export function renderHomePage(
  routes: Array<{ path: string; purpose: string }>,
  exercises: readonly Exercise[],
  defaultExercise: Exercise,
): string {
  const routeList = routes
    .filter((route) => route.path !== "/" && route.path !== "/practice")
    .map(
      (route) =>
        `<li>
          <a class="group flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0" href="${escapeHtml(route.path)}">
            <div>
              <span class="text-base font-semibold tracking-[-0.01em] text-app-accent-strong">${escapeHtml(route.path)}</span>
              <p class="mt-2 max-w-2xl leading-7 text-app-text-soft">${escapeHtml(route.purpose)}</p>
            </div>
            <span class="pt-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-app-text-soft transition group-hover:text-app-accent">Open</span>
          </a>
        </li>`,
    )
    .join("");
  const exerciseList = exercises
    .map(
      (exercise) => `<li>
        <a class="group block py-5 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/30" href="${escapeHtml(exercisePracticeHref(exercise))}">
          <span class="flex items-start justify-between gap-4">
            <span>
              <span class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-app-text-soft">${escapeHtml(formatExerciseCategory(exercise))} · ${escapeHtml(formatExerciseHand(exercise))}</span>
              <span class="mt-1.5 block text-xl font-semibold tracking-[-0.025em] text-app-text">${escapeHtml(exercise.title)}</span>
            </span>
            <span class="shrink-0 pt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-app-accent transition group-hover:text-app-accent-strong">${exercise.id === defaultExercise.id ? "Start here" : "Open"}</span>
          </span>
          <span class="mt-2 block text-sm leading-6 text-app-text-soft">${escapeHtml(exercise.instructions)}</span>
          <span class="mt-2 block font-semibold tracking-[0.07em] text-app-accent-strong" aria-label="Note order: ${escapeHtml(formatExerciseNoteOrder(exercise))}">${escapeHtml(formatExerciseNoteOrder(exercise))}</span>
        </a>
      </li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(appDescription)}">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(appTitle)}</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="min-h-screen bg-app-canvas text-app-text antialiased">
    <a class="fixed left-4 top-4 z-10 -translate-y-24 rounded-lg bg-app-text px-4 py-3 font-semibold text-app-canvas transition focus:translate-y-0" href="#main">Skip to main content</a>
    <main id="main" class="mx-auto w-[min(46rem,calc(100vw-2rem))] py-12 sm:py-16">
      <article class="space-y-10">
        <section>
          <p class="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-app-accent">Today at the piano</p>
          <h1 class="max-w-[9ch] text-5xl leading-[0.92] font-semibold tracking-[-0.055em] sm:text-7xl">${escapeHtml(appTitle)}</h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-app-text-soft">${escapeHtml(appDescription)}</p>
        </section>
        <section class="border-y border-app-line/90 py-4">
          <div class="mb-4 flex items-end justify-between gap-4">
            <h2 class="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-app-text-soft">Choose an exercise</h2>
            <p class="text-sm text-app-text-soft">${exercises.length} untimed studies</p>
          </div>
          <ul class="divide-y divide-app-line/90">${exerciseList}</ul>
          <p class="border-t border-app-line/90 pt-4 text-sm leading-6 text-app-text-soft">Play on the built-in practice keys or connect a supported desktop MIDI keyboard. There is no timer and no score.</p>
        </section>
        <section class="space-y-4">
          <div class="border-t border-app-line pt-4">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-app-text-soft">Where this can lead</p>
            <p class="mt-2 leading-7 text-app-text-soft">Notes and reading, rhythm and coordination, patterns and technique, and lawful repertoire pathways toward progressive music, Sibelius, and game music.</p>
          </div>
          <div class="border-t border-app-line pt-4">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-app-text-soft">A useful boundary</p>
            <p class="mt-2 leading-7 text-app-text-soft">This companion can observe MIDI notes and help organize practice. It cannot see physical technique and does not replace a qualified piano teacher.</p>
          </div>
          <div class="border-t border-app-line pt-4">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-app-text-soft">For tooling</p>
            <ul class="divide-y divide-app-line/90">${routeList}</ul>
          </div>
        </section>
      </article>
    </main>
  </body>
</html>`;
}
