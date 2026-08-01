import { formatMidiNote } from "../exercises/evaluator";
import type { Exercise } from "../exercises/types";
import {
  exercisePracticeHref,
  formatExerciseCategory,
  formatExerciseHand,
  formatExerciseNoteOrder,
  formatExerciseTimingLabel,
} from "./exercise-presentation";
import { escapeHtml, renderAppHeader } from "./shared";

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
      (route) => `<li>
        <a class="footer-utility-link" href="${escapeHtml(route.path)}">
          <span>${escapeHtml(route.path)}</span>
          <span>${escapeHtml(route.purpose)}</span>
        </a>
      </li>`,
    )
    .join("");
  const exerciseList = exercises
    .map((exercise, index) => {
      const handLabel = formatExerciseHand(exercise);
      const selected = exercise.id === defaultExercise.id;
      const timingLabel = formatExerciseTimingLabel(exercise, true);
      return `<li>
        <a
          class="folio-card group"
          data-hand="${handLabel === "Left hand" ? "left" : "right"}"
          data-mode="${exercise.evaluationMode === "timed-ordered-notes" ? "timed" : "untimed"}"
          href="${escapeHtml(exercisePracticeHref(exercise))}"
        >
          <span class="folio-card-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="folio-card-body">
            <span class="app-eyebrow">${escapeHtml(formatExerciseCategory(exercise))} · ${escapeHtml(handLabel)}</span>
            <span class="folio-card-title">${escapeHtml(exercise.title)}</span>
            <span class="folio-card-copy">${escapeHtml(exercise.instructions)}</span>
            <span class="folio-card-sequence" aria-label="Note order: ${escapeHtml(formatExerciseNoteOrder(exercise))}">${escapeHtml(formatExerciseNoteOrder(exercise))}</span>
            <span class="folio-card-timing">${escapeHtml(timingLabel)}</span>
          </span>
          <span class="folio-card-action">${selected ? "Start here" : `${exercise.expectedEvents.length} notes`}<span aria-hidden="true">↗</span></span>
        </a>
      </li>`;
    })
    .join("");
  const heroKeys = [...defaultExercise.expectedEvents]
    .sort((left, right) => left.noteNumber - right.noteNumber)
    .map((event) => `<span><strong>${escapeHtml(formatMidiNote(event.noteNumber))}</strong></span>`)
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
  <body class="app-body">
    <a class="skip-link" href="#main">Skip to main content</a>
    ${renderAppHeader({ actionHref: exercisePracticeHref(defaultExercise), actionLabel: "Begin practice" })}
    <main id="main" class="app-shell pb-10 pt-5 sm:pb-14 sm:pt-8">
      <section class="home-hero app-rise" aria-labelledby="home-heading">
        <div class="home-hero-copy">
          <p class="app-eyebrow app-eyebrow-inverse">Personal practice studio</p>
          <h1 id="home-heading" class="home-title">Piano<br><em>Practice</em></h1>
          <p class="home-intro">Small, focused studies for building calm and reliable movement at the keyboard.</p>
          <div class="mt-7 flex flex-wrap items-center gap-4">
            <a class="app-button app-button-cue" href="${escapeHtml(exercisePracticeHref(defaultExercise))}">Begin today’s study <span aria-hidden="true">→</span></a>
            <span class="home-hero-note">No timer. No score. Just the next note.</span>
          </div>
        </div>
        <div class="hero-score" aria-label="Recommended first exercise">
          <div class="flex items-start justify-between gap-5">
            <div>
              <p class="app-eyebrow">At the bench · Study 01</p>
              <h2 class="hero-score-title">${escapeHtml(defaultExercise.title)}</h2>
            </div>
            <span class="hero-hand-badge">${escapeHtml(formatExerciseHand(defaultExercise))}</span>
          </div>
          <p class="hero-score-task">${escapeHtml(defaultExercise.instructions)}</p>
          <p class="hero-score-sequence" aria-label="Expected notes: ${escapeHtml(formatExerciseNoteOrder(defaultExercise))}">${escapeHtml(formatExerciseNoteOrder(defaultExercise))}</p>
          <div class="hero-keyboard" aria-hidden="true">${heroKeys}</div>
          <div class="hero-score-footer">
            <span>${defaultExercise.expectedEvents.length} notes</span>
            <span>Beginner</span>
            <span>${escapeHtml(formatExerciseTimingLabel(defaultExercise, true))}</span>
          </div>
        </div>
      </section>

      <section class="home-library app-rise" aria-labelledby="library-heading">
        <div class="section-heading-row">
          <div>
            <p class="app-eyebrow">Exercise folio</p>
            <h2 id="library-heading" class="section-title">Choose your next study</h2>
          </div>
          <p class="section-heading-copy">${exercises.length} short patterns for both hands, including pulse and subdivision studies. Each one keeps its own local practice history.</p>
        </div>
        <ul class="folio-grid">${exerciseList}</ul>
      </section>

      <section class="practice-principles" aria-label="Practice approach">
        <div class="principle-block">
          <p class="app-eyebrow">Designed for focus</p>
          <h2>Hear the instruction.<br>See the cue. Play.</h2>
          <p>Use the built-in keys or connect a supported MIDI keyboard. Correct notes stay visible and the next step remains clear.</p>
        </div>
        <div class="principle-block principle-block-muted">
          <p class="app-eyebrow">A useful boundary</p>
          <h2>Pitch and order,<br>without false certainty.</h2>
          <p>This companion can observe MIDI notes and organize practice. It cannot assess posture, tension, fingering, or replace a qualified teacher.</p>
        </div>
        <div class="principle-note">
          <span>Where this can lead</span>
          <p>Notes and reading, rhythm and coordination, patterns and technique, then lawful repertoire pathways toward progressive music, Sibelius, and game music.</p>
        </div>
      </section>
    </main>
    <footer class="app-footer">
      <div class="app-shell flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p><strong>Piano Practice</strong> · Private progress, kept on this device.</p>
        <ul class="footer-utilities">${routeList}</ul>
      </div>
    </footer>
  </body>
</html>`;
}
