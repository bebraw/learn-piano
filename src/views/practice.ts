import { formatMidiNote } from "../exercises/evaluator.js";
import type { Exercise } from "../exercises/types.js";
import {
  exercisePracticeHref,
  formatExerciseCategory,
  formatExerciseDifficulty,
  formatExerciseHand,
  formatExerciseNoteOrder,
  formatExerciseTimingLabel,
  formatPracticeKeyboardNoteLabel,
  getExerciseRhythmPresentation,
  projectPracticeKeyboardNotes,
} from "./exercise-presentation.js";
import { escapeHtml, renderAppHeader } from "./shared.js";
import { renderStaffPitchGuide } from "./staff-pitch-guide.js";

export function renderPracticePage(exercise: Exercise, exerciseLibrary: readonly Exercise[]): string {
  const firstEvent = exercise.expectedEvents[0];
  if (firstEvent === undefined) {
    throw new Error("A practice page requires at least one expected event");
  }

  const noteSequence = formatExerciseNoteOrder(exercise);
  const handLabel = formatExerciseHand(exercise);
  const categoryLabel = formatExerciseCategory(exercise);
  const difficultyLabel = formatExerciseDifficulty(exercise);
  const rhythm = getExerciseRhythmPresentation(exercise);
  const timing = getExerciseTiming(exercise);
  const tempoOptions = renderTempoOptions(timing?.defaultBpm ?? 60);
  const timingStatus =
    timing === null
      ? "This study does not use a pulse guide."
      : `${timing.defaultBpm} BPM · ${timing.beatsPerMeasure}/${timing.beatUnit} · Four-beat count-in before your first note.`;
  const expectedPitches = new Set(exercise.expectedEvents.map(({ noteNumber }) => noteNumber));
  const keyboardNotes = projectPracticeKeyboardNotes(exercise);
  const pianoKeys = keyboardNotes
    .map((noteNumber, index) => {
      const noteLabel = formatMidiNote(noteNumber);
      const isExpected = noteNumber === firstEvent.noteNumber;
      const noteState = isExpected ? "expected" : expectedPitches.has(noteNumber) ? "remaining" : "idle";
      const nextNoteNumber = keyboardNotes[index + 1];
      const hasBlackKeyAfter = nextNoteNumber !== undefined && hasSharpBetween(noteNumber, nextNoteNumber);
      return `<button
        class="piano-key"
        id="practice-key-${noteNumber}"
        type="button"
        data-practice-key
        data-note-number="${noteNumber}"
        data-note-state="${noteState}"
        ${hasBlackKeyAfter ? 'data-black-key-after="true"' : ""}
        aria-label="${escapeHtml(formatPracticeKeyboardNoteLabel(noteNumber, noteState))}"
        aria-current="${isExpected ? "true" : "false"}"
        aria-pressed="false"
        disabled
      >
        <span class="piano-key-note">${escapeHtml(noteLabel.replace(/-?\d+$/, ""))}</span>
        <span class="piano-key-label">${escapeHtml(noteLabel)}</span>
      </button>`;
    })
    .join("");
  const staffPitchGuide = renderStaffPitchGuide(exercise);
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
  <body class="app-body">
    <a class="skip-link" href="#practice-main">Skip to exercise</a>
    ${renderAppHeader({ actionHref: "/", actionLabel: "Exercise library" })}
    <main
      id="practice-main"
      class="app-shell practice-page"
      data-practice-root
      data-exercise-id="${escapeHtml(exercise.id)}"
      data-exercise-revision="${exercise.revision}"
    >
      <header class="practice-heading app-rise">
        <div>
          <p class="app-eyebrow"><a href="/">Exercise folio</a> <span aria-hidden="true">/</span> ${escapeHtml(categoryLabel)}</p>
          <h1>${escapeHtml(exercise.title)}</h1>
          <p class="practice-heading-copy">${escapeHtml(exercise.instructions)}</p>
        </div>
        <div class="practice-meta" aria-label="Exercise details">
          <span>${escapeHtml(handLabel)}</span>
          <span>${escapeHtml(difficultyLabel)}</span>
          ${
            timing === null
              ? "<span>Untimed</span>"
              : `<span>${timing.defaultBpm} BPM</span><span>${timing.beatsPerMeasure}/${timing.beatUnit}</span>`
          }
        </div>
      </header>

      <div class="practice-layout">
        <div class="practice-workspace">
          <section id="practice-stage" class="practice-stage" data-session-status="ready" data-pulse-status="idle" aria-labelledby="stage-heading">
            <div class="practice-stage-toolbar">
              <div>
                <p class="app-eyebrow app-eyebrow-inverse" id="stage-heading">Live study</p>
                <p class="practice-cue"><span>Next note</span> <strong id="next-note">${escapeHtml(formatMidiNote(firstEvent.noteNumber))}</strong></p>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <a class="connection-chip" href="#input-setup">
                  <span aria-hidden="true"></span>
                  <strong id="connection-status" data-status="idle" role="status" aria-live="polite">Live input is not connected.</strong>
                </a>
                <p id="progress-text" class="progress-chip">0 of ${exercise.expectedEvents.length} notes</p>
              </div>
            </div>

            <div class="practice-score">
              <p class="practice-score-label">Your phrase</p>
              <p class="practice-score-task">${escapeHtml(rhythm.practiceTask)}</p>
              ${staffPitchGuide}
              <p class="practice-score-sequence" aria-label="Pitch order: ${escapeHtml(noteSequence)}">${escapeHtml(noteSequence)}</p>
            </div>

            <section
              id="pulse-controls"
              class="pulse-controls"
              aria-labelledby="pulse-heading"
              ${timing === null ? "hidden" : ""}
            >
              <div class="pulse-summary">
                <div class="pulse-beats" aria-hidden="true">
                  <span id="pulse-beat-1" data-beat-state="idle"></span>
                  <span id="pulse-beat-2" data-beat-state="idle"></span>
                  <span id="pulse-beat-3" data-beat-state="idle"></span>
                  <span id="pulse-beat-4" data-beat-state="idle"></span>
                </div>
                <div>
                  <p class="app-eyebrow" id="pulse-heading">Steady pulse</p>
                  <p class="pulse-status" id="pulse-status">${escapeHtml(timingStatus)}</p>
                </div>
              </div>
              <div class="pulse-actions">
                <label class="tempo-control" for="pulse-tempo">
                  <span>Tempo</span>
                  <select class="practice-control" id="pulse-tempo" aria-describedby="pulse-status" disabled>
                    ${tempoOptions}
                  </select>
                </label>
                <button class="app-button app-button-dark" id="start-pulse" type="button" disabled>Start pulse</button>
                <button class="app-button app-button-outline" id="stop-pulse" type="button" disabled>Stop pulse</button>
              </div>
            </section>

            <div class="keyboard-case">
              <div class="keyboard-case-topline">
                <span>${escapeHtml(handLabel)} · C position</span>
                <span>Follow the amber cue</span>
              </div>
              <div class="practice-keyboard" aria-label="${escapeHtml(exercise.title)} ${keyboardNotes.length}-key guide">
                ${pianoKeys}
              </div>
              <p class="keyboard-help" id="keyboard-help">Connect the on-screen input to make these keys playable, or use a connected MIDI keyboard.</p>
            </div>

            <div class="feedback-dock">
              <div class="feedback-mark" aria-hidden="true"><span></span></div>
              <div class="min-w-0 flex-1">
                <p class="app-eyebrow app-eyebrow-inverse">Live coaching</p>
                <p id="feedback-message" class="feedback-message" data-session-status="ready" role="status" aria-live="polite">Begin when your input is connected. ${escapeHtml(formatMidiNote(firstEvent.noteNumber))} is first.</p>
                <p id="persistence-message" class="persistence-message" role="status" aria-live="polite" hidden></p>
                <div class="next-study-recommendation" id="next-study-recommendation" hidden>
                  <p class="next-study-kicker" id="next-study-kicker">Suggested next</p>
                  <p class="next-study-copy"><strong id="next-study-title"></strong> <span id="next-study-reason"></span></p>
                </div>
              </div>
              <div class="feedback-actions">
                <button class="app-button app-button-quiet" id="restart-exercise" type="button" data-enhancement hidden>Restart</button>
                <a class="app-button app-button-cue" id="next-exercise" href="/" hidden><span id="next-exercise-label">Exercise library</span> <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </section>
        </div>

        <aside class="practice-rail" aria-label="Practice tools">
          <section class="rail-panel" id="input-setup" aria-labelledby="input-heading">
            <div class="rail-panel-heading">
              <div>
                <p class="app-eyebrow">Instrument</p>
                <h2 id="input-heading">Input setup</h2>
              </div>
              <span class="local-badge">On device</span>
            </div>
            <div class="input-controls" data-enhancement hidden>
              <label for="input-kind">Input method
                <select class="practice-control" id="input-kind">
                  <option value="mock">On-screen practice keys</option>
                  <option value="web-midi">Web MIDI keyboard</option>
                  <option id="native-midi-input-kind" value="native-midi" hidden disabled>iPad MIDI keyboard</option>
                </select>
              </label>
              <label for="midi-input">Device
                <select class="practice-control" id="midi-input" disabled>
                  <option value="">Choose an input</option>
                </select>
              </label>
              <div class="input-actions">
                <button class="app-button app-button-dark" id="connect-input" type="button" disabled>Connect</button>
                <button class="app-button app-button-outline" id="refresh-inputs" type="button">Refresh</button>
                <button class="app-button app-button-outline input-action-wide" id="pair-bluetooth-midi" type="button" hidden>Pair Bluetooth MIDI</button>
                <button class="app-button app-button-outline input-action-wide" id="disconnect-input" type="button" disabled>Disconnect</button>
              </div>
            </div>
            <p class="javascript-note" id="javascript-status">Live MIDI, note highlighting, and history need JavaScript. The exercise instructions and keyboard guide remain available.</p>
          </section>

          ${exerciseCatalog}

          <section class="rail-panel history-panel" aria-labelledby="history-heading">
            <div class="rail-panel-heading">
              <div>
                <p class="app-eyebrow">Today</p>
                <h2 id="history-heading">Practice history</h2>
              </div>
              <span class="history-lock" aria-label="Stored in this browser">Local</span>
            </div>
            <p id="history-count" class="history-count">History requires JavaScript</p>
            <p id="history-detail" class="history-detail" role="status" aria-live="polite">Enable JavaScript to read completed attempts stored in this browser.</p>
          </section>

          <p class="practice-boundary">MIDI can confirm pitch and order here. It cannot assess posture, tension, fingering, or replace a qualified teacher.</p>
        </aside>
      </div>
    </main>
    <script type="module" src="/client/main.js"></script>
  </body>
</html>`;
}

function renderExerciseCatalog(selectedExercise: Exercise, exerciseLibrary: readonly Exercise[]): string {
  const items = exerciseLibrary
    .map((exercise, index) => {
      const selected = exercise.id === selectedExercise.id;
      return `<li>
        <a
          class="study-link${selected ? " study-link-current" : ""}"
          href="${escapeHtml(exercisePracticeHref(exercise))}"
          ${selected ? 'aria-current="page"' : ""}
        >
          <span class="study-link-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="min-w-0">
            <span class="study-link-title">${escapeHtml(exercise.title)}</span>
            <span class="study-link-notes" aria-label="Note order: ${escapeHtml(formatExerciseNoteOrder(exercise))}">${escapeHtml(formatExerciseNoteOrder(exercise))}</span>
            <span class="study-link-mode">${escapeHtml(formatExerciseTimingLabel(exercise))}</span>
          </span>
        </a>
      </li>`;
    })
    .join("");

  return `<nav class="rail-panel study-navigation" aria-label="Choose an exercise">
    <div class="rail-panel-heading">
      <div>
        <p class="app-eyebrow">Exercise folio</p>
        <h2 id="exercise-library-heading">Change study</h2>
      </div>
      <span class="study-count">${exerciseLibrary.length}</span>
    </div>
    <ul class="study-list">${items}</ul>
  </nav>`;
}

function hasSharpBetween(noteNumber: number, nextNoteNumber: number): boolean {
  return nextNoteNumber - noteNumber === 2 && [0, 2, 5, 7, 9].includes(noteNumber % 12);
}

function getExerciseTiming(exercise: Exercise): NonNullable<Exercise["timing"]> | null {
  if (exercise.evaluationMode === "untimed-ordered-notes") {
    return null;
  }
  if (exercise.timing === undefined) {
    throw new Error(`Timed exercise ${exercise.id} requires timing metadata`);
  }
  return exercise.timing;
}

function renderTempoOptions(defaultBpm: number): string {
  return [40, 50, 60, 70, 80, 90, 100]
    .map((bpm) => `<option value="${bpm}"${bpm === defaultBpm ? " selected" : ""}>${bpm} BPM</option>`)
    .join("");
}
