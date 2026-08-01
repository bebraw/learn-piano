import { describe, expect, it } from "vitest";
import { defaultExercise, exerciseLibrary } from "../exercises/library/index.js";
import { stepSkipRightHandExercise } from "../exercises/library/beginner-five-note-exercises.js";
import { evenEighthsRightHandExercise } from "../exercises/library/even-eighth-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import { mixedEighthPatternRightHandExercise } from "../exercises/library/mixed-eighth-pattern-exercises.js";
import { offbeatStepSkipRightHandExercise } from "../exercises/library/offbeat-step-skip-exercises.js";
import { orderedChordTonesRightHandExercise } from "../exercises/library/ordered-chord-tone-exercises.js";
import { repeatedNotesRightHandExercise } from "../exercises/library/repeated-note-exercises.js";
import { steadyQuarterStepSkipRightHandExercise } from "../exercises/library/steady-quarter-exercises.js";
import type { Exercise } from "../exercises/types.js";
import { renderPracticePage } from "./practice.js";

describe("renderPracticePage", () => {
  it("renders canonical instructions and a useful no-JavaScript document", () => {
    const html = renderPracticePage(fiveNoteAscentExercise, exerciseLibrary);

    expect(html).toContain("Play C-D-E-F-G in ascending order with your right hand.");
    expect(html).toContain("C4 · D4 · E4 · F4 · G4");
    expect(html).toContain('aria-label="Pitch order: C4 · D4 · E4 · F4 · G4"');
    expect(html).toContain("Treble staff · Pitch guide");
    expect(html).toContain("Pitch order · No fixed rhythm");
    expect(html).toContain("data-staff-pitch-guide");
    expect(html).toContain('data-staff-clef="treble"');
    expect(html.match(/data-staff-note/g)).toHaveLength(5);
    expect(html).toContain(`data-exercise-id="${fiveNoteAscentExercise.id}"`);
    expect(html).toContain(`data-exercise-revision="${fiveNoteAscentExercise.revision}"`);
    expect(html).toContain('data-cue-mode="guided"');
    expect(html.match(/data-practice-key/g)).toHaveLength(5);
    expect(html).toContain('data-note-number="60"');
    expect(html).toContain('data-note-number="67"');
    expect(html).toContain("Live MIDI, note highlighting, and history need JavaScript");
    expect(html).toContain("History requires JavaScript");
    expect(html).toContain("Enable JavaScript to read completed attempts stored in this browser.");
    expect(html).not.toContain(">0 completed today<");
    expect(html).not.toContain("No completed attempts in this browser yet.");
    expect(html).toContain('type="module" src="/client/main.js"');
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
    expect(html).toContain('id="native-midi-input-kind" value="native-midi" hidden disabled');
    expect(html).toContain('id="pair-bluetooth-midi" type="button" hidden');
    const readingFocusToggle = html.match(/<button\s+class="reading-focus-toggle"[\s\S]*?>/)?.[0];
    expect(readingFocusToggle).toBeDefined();
    expect(readingFocusToggle).toContain('id="reading-focus-toggle"');
    expect(readingFocusToggle).toContain('aria-pressed="false"');
    expect(readingFocusToggle).toContain("hidden");
    expect(readingFocusToggle).toContain("disabled");
    expect(readingFocusToggle).not.toContain("data-enhancement");
    expect(html).toContain('<strong class="reading-focus-next-note" id="reading-focus-next-note" aria-hidden="true">On staff</strong>');
    expect(html).toContain('<span class="keyboard-cue-guided">Follow the amber cue</span>');
    expect(html).toContain('<span class="keyboard-cue-reading" aria-hidden="true">Read the staff, then play</span>');
    expect(html).toContain("Choose an exercise");
    expect(html).toContain(`<span class="study-count">${exerciseLibrary.length}</span>`);
    expect(html).toContain('id="practice-stage" class="practice-stage" data-session-status="ready"');
    expect(html).toContain('data-pulse-status="idle"');
    expect(html).toContain('id="next-study-recommendation" hidden');
    expect(html).toContain('id="next-study-title"');
    expect(html).toContain('id="next-study-reason"');
    expect(html).toContain('id="next-exercise" href="/" hidden');
    expect(html).toContain('id="next-exercise-label">Exercise library</span>');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('id="pulse-controls"');
    expect(html).toContain('id="pulse-status"');
    expect(html).toContain('id="pulse-tempo"');
    expect(html).toContain('id="start-pulse" type="button" disabled');
    expect(html).toContain('id="stop-pulse" type="button" disabled');
    expect(html.match(/id="pulse-beat-[1-4]" data-beat-state="idle"/g)).toHaveLength(4);
    expect(html.match(/<option value="(?:40|50|60|70|80|90|100)"/g)).toHaveLength(7);
    expect(html).toContain('<option value="60" selected>60 BPM</option>');
    expect(html.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0]).toContain("hidden");
    expect(html).not.toContain("The next expected key stays lit.");
    expect(exerciseLibrary).toHaveLength(20);
  });

  it("derives the rendered sequence and physical key order from the supplied exercise", () => {
    const shortExercise: Exercise = {
      ...defaultExercise,
      id: "short-test-exercise",
      title: "Descending test",
      instructions: "Play G-E-C with your left hand.",
      expectedEvents: [
        { ...defaultExercise.expectedEvents[4]!, id: "g-first", noteNumber: 67, hand: "left" },
        { ...defaultExercise.expectedEvents[2]!, id: "e-second", noteNumber: 64, hand: "left" },
        { ...defaultExercise.expectedEvents[0]!, id: "c-third", noteNumber: 60, hand: "left" },
      ],
    };

    const html = renderPracticePage(shortExercise, [shortExercise]);

    expect(html).toContain("G4 · E4 · C4");
    expect(html).toContain("Left hand");
    expect(html).toContain("Beginner");
    expect(html).toContain("Descending test 5-key guide");
    expect(html.match(/data-practice-key/g)).toHaveLength(5);
    expect(html.indexOf('data-note-number="60"')).toBeLessThan(html.indexOf('data-note-number="64"'));
    expect(html.indexOf('data-note-number="64"')).toBeLessThan(html.indexOf('data-note-number="67"'));
    expect(html).toContain('id="practice-key-62"');
    expect(html).toContain('id="practice-key-65"');
    expect(html).toContain('data-note-number="62"\n        data-note-state="idle"');
    expect(html).toContain('data-note-number="67"\n        data-note-state="expected"');
  });

  it("keeps staff notes in canonical phrase order when keyboard keys use physical order", () => {
    const html = renderPracticePage(stepSkipRightHandExercise, exerciseLibrary);
    const staffStart = html.indexOf("data-staff-pitch-guide");
    const staffEnd = html.indexOf("</svg>", staffStart);
    const staffMarkup = html.slice(staffStart, staffEnd);

    expect(staffMarkup.indexOf('data-event-id="right-hand-c4"')).toBeLessThan(staffMarkup.indexOf('data-event-id="right-hand-e4"'));
    expect(staffMarkup.indexOf('data-event-id="right-hand-e4"')).toBeLessThan(staffMarkup.indexOf('data-event-id="right-hand-d4"'));
    expect(html.indexOf('id="practice-key-62"')).toBeLessThan(html.indexOf('id="practice-key-64"'));
  });

  it("keeps returning chord tones as five staff events over one five-key C position", () => {
    const html = renderPracticePage(orderedChordTonesRightHandExercise, exerciseLibrary);
    const keyboardStart = html.indexOf('class="practice-keyboard"');
    const keyboardEnd = html.indexOf("</div>", keyboardStart);
    const keyboardMarkup = html.slice(keyboardStart, keyboardEnd);

    expect(html).toContain("C4 · E4 · G4 · E4 · C4");
    expect(keyboardMarkup.match(/data-practice-key/g)).toHaveLength(5);
    expect(keyboardMarkup).not.toContain("data-event-id");
    for (const noteNumber of [60, 62, 64, 65, 67]) {
      expect(keyboardMarkup.match(new RegExp(`data-note-number="${noteNumber}"`, "g"))).toHaveLength(1);
    }
    expect(keyboardMarkup).toContain('data-note-number="60"\n        data-note-state="expected"');
    expect(keyboardMarkup).toContain('data-note-number="62"\n        data-note-state="idle"');
    expect(keyboardMarkup).toContain('data-note-number="65"\n        data-note-state="idle"');
    expect(keyboardMarkup).toContain('aria-label="D4, not in phrase"');
    expect(keyboardMarkup).toContain('aria-label="E4, later in phrase"');
    expect(html.match(/data-staff-note/g)).toHaveLength(5);
    expect(html).toContain('data-event-id="right-hand-chord-tone-c4-start"');
    expect(html).toContain('data-event-id="right-hand-chord-tone-c4-return"');
  });

  it("renders repeated pairs as five staff events over one three-key span", () => {
    const html = renderPracticePage(repeatedNotesRightHandExercise, exerciseLibrary);
    const keyboardStart = html.indexOf('class="practice-keyboard"');
    const keyboardEnd = html.indexOf("</div>", keyboardStart);
    const keyboardMarkup = html.slice(keyboardStart, keyboardEnd);

    expect(html).toContain("C4 · C4 · D4 · D4 · E4");
    expect(keyboardMarkup.match(/data-practice-key/g)).toHaveLength(3);
    for (const noteNumber of [60, 62, 64]) {
      expect(keyboardMarkup.match(new RegExp(`data-note-number="${noteNumber}"`, "g"))).toHaveLength(1);
    }
    expect(html.match(/data-staff-note/g)).toHaveLength(5);
    for (const event of repeatedNotesRightHandExercise.expectedEvents) {
      expect(html).toContain(`data-event-id="${event.id}"`);
    }
  });

  it("renders a full mixed pattern as eight staff events over one five-key position", () => {
    const html = renderPracticePage(mixedEighthPatternRightHandExercise, exerciseLibrary);
    const keyboardStart = html.indexOf('class="practice-keyboard"');
    const keyboardEnd = html.indexOf("</div>", keyboardStart);
    const keyboardMarkup = html.slice(keyboardStart, keyboardEnd);

    expect(html).toContain("C4 · E4 · D4 · D4 · F4 · G4 · E4 · C4");
    expect(html).toContain("Count 1 &amp; 2 &amp; 3 &amp; 4 &amp;.");
    expect(keyboardMarkup.match(/data-practice-key/g)).toHaveLength(5);
    expect(html.match(/data-staff-note/g)).toHaveLength(8);
    for (const event of mixedEighthPatternRightHandExercise.expectedEvents) {
      expect(html).toContain(`data-event-id="${event.id}"`);
    }
  });

  it("renders offbeat guidance separately from the pitch-only staff spacing", () => {
    const html = renderPracticePage(offbeatStepSkipRightHandExercise, exerciseLibrary);

    expect(html).toContain("After the four-beat count-in, play C on beat 1, then E-D-F-G");
    expect(html).toContain("C4 · E4 · D4 · F4 · G4");
    expect(html).toContain(
      '<p class="practice-score-task">After the count-in, play the first note on 1, then place each remaining note on an “and” count between clicks. Count 1 &amp; 2 &amp; 3 &amp; 4 &amp;.</p>',
    );
    expect(html).toContain("Pitch order · Downbeat then offbeat onsets");
    expect(html).toContain("Offbeat grid · 60 BPM");
    expect(html.match(/data-staff-note/g)).toHaveLength(5);
    expect(html.match(/data-practice-key/g)).toHaveLength(5);
    expect(html).not.toContain("After the count-in, follow the study's timing guide.");
  });

  it("marks only the selected exercise as the current catalog link", () => {
    const selectedExercise = exerciseLibrary[3]!;
    const html = renderPracticePage(selectedExercise, exerciseLibrary);

    for (const exercise of exerciseLibrary) {
      const href = `/practice?exercise=${encodeURIComponent(exercise.id)}`;
      const linkStart = html.indexOf(`href="${href}"`);
      const linkEnd = html.indexOf("</a>", linkStart);
      const linkMarkup = html.slice(linkStart, linkEnd);

      expect(linkStart, `missing catalog link for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(linkMarkup.includes('aria-current="page"'), exercise.id).toBe(exercise.id === selectedExercise.id);
    }
  });

  it("renders useful steady-pulse facts and controls for a timed exercise", () => {
    const html = renderPracticePage(steadyQuarterStepSkipRightHandExercise, exerciseLibrary);
    const pulseControls = html.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0];

    expect(pulseControls).toBeDefined();
    expect(pulseControls).not.toContain("hidden");
    expect(html).toContain(steadyQuarterStepSkipRightHandExercise.title);
    expect(html).toContain(steadyQuarterStepSkipRightHandExercise.instructions);
    expect(html).toContain("C4 · E4 · D4 · F4 · G4");
    expect(html).toContain(`href="/practice?exercise=${steadyQuarterStepSkipRightHandExercise.id}"`);
    expect(html).toContain("60 BPM · 4/4 · Four-beat count-in before your first note.");
    expect(html).toContain("After the count-in, place one note on each beat.");
    expect(html).toContain("Pitch order · One note per beat");
    expect(html).toContain("Steady pulse · 60 BPM");
    expect(html).toContain("<span>60 BPM</span><span>4/4</span>");
    expect(html.match(/<select[^>]*id="pulse-tempo"[^>]*>/)?.[0]).toContain("disabled");
    expect(html).not.toContain('id="pulse-status" role="status"');
  });

  it("explains the eighth-note grid and distinguishes it in the exercise catalog", () => {
    const html = renderPracticePage(evenEighthsRightHandExercise, exerciseLibrary);

    expect(html).toContain(
      '<p class="practice-score-task">After the count-in, play on the eighth-note grid: each click is a numbered beat, and the “and” count falls halfway between. Count 1 &amp; 2 &amp; 3.</p>',
    );
    expect(html).toContain("Pitch order · Even eighth-note onsets");
    expect(html).toContain("Eighth-note grid · 60 BPM");
    expect(html).not.toContain("After the count-in, place one note on each beat.");
  });

  it("rejects an empty exercise instead of rendering false completion", () => {
    const emptyExercise = { ...fiveNoteAscentExercise, expectedEvents: [] };
    expect(() => renderPracticePage(emptyExercise, [emptyExercise])).toThrow("requires at least one expected event");
  });

  it("keeps the visible note-name sequence when staff projection is unsupported", () => {
    const unsupportedExercise: Exercise = {
      ...fiveNoteAscentExercise,
      id: "chromatic-test-exercise",
      expectedEvents: [{ ...fiveNoteAscentExercise.expectedEvents[0]!, id: "c-sharp", noteNumber: 61 }],
    };

    const html = renderPracticePage(unsupportedExercise, [unsupportedExercise]);

    expect(html).not.toContain("data-staff-pitch-guide");
    expect(html).toContain('aria-label="Pitch order: C♯4"');
    expect(html).toContain(">C♯4</p>");
  });
});
