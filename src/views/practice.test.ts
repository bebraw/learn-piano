import { describe, expect, it } from "vitest";
import { defaultExercise, exerciseLibrary } from "../exercises/library/index.js";
import { stepSkipRightHandExercise } from "../exercises/library/beginner-five-note-exercises.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
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
    expect(html).toContain("Choose an exercise");
    expect(html).toContain(`<span class="study-count">${exerciseLibrary.length}</span>`);
    expect(html).toContain('id="practice-stage" class="practice-stage" data-session-status="ready"');
    expect(html).toContain('data-pulse-status="idle"');
    expect(html).toContain('id="next-exercise"');
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
    expect(exerciseLibrary).toHaveLength(8);
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
    expect(html).toContain("Descending test 3-note guide");
    expect(html.match(/data-practice-key/g)).toHaveLength(3);
    expect(html.indexOf('data-note-number="60"')).toBeLessThan(html.indexOf('data-note-number="64"'));
    expect(html.indexOf('data-note-number="64"')).toBeLessThan(html.indexOf('data-note-number="67"'));
    expect(html).toContain('data-event-id="g-first"\n        data-note-number="67"\n        data-note-state="expected"');
  });

  it("keeps staff notes in canonical phrase order when keyboard keys use physical order", () => {
    const html = renderPracticePage(stepSkipRightHandExercise, exerciseLibrary);
    const staffStart = html.indexOf("data-staff-pitch-guide");
    const staffEnd = html.indexOf("</svg>", staffStart);
    const staffMarkup = html.slice(staffStart, staffEnd);

    expect(staffMarkup.indexOf('data-event-id="right-hand-c4"')).toBeLessThan(staffMarkup.indexOf('data-event-id="right-hand-e4"'));
    expect(staffMarkup.indexOf('data-event-id="right-hand-e4"')).toBeLessThan(staffMarkup.indexOf('data-event-id="right-hand-d4"'));
    expect(html.indexOf('id="practice-key-right-hand-d4"')).toBeLessThan(html.indexOf('id="practice-key-right-hand-e4"'));
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
    const timedExercise = exerciseLibrary.find((exercise) => exercise.evaluationMode === "timed-ordered-notes");
    expect(timedExercise).toBeDefined();

    const html = renderPracticePage(timedExercise!, exerciseLibrary);
    const pulseControls = html.match(/<section\s+id="pulse-controls"[\s\S]*?>/)?.[0];

    expect(pulseControls).toBeDefined();
    expect(pulseControls).not.toContain("hidden");
    expect(html).toContain("60 BPM · 4/4 · Four-beat count-in before your first note.");
    expect(html).toContain("After the count-in, place one note on each beat.");
    expect(html).toContain("Pitch order · One note per beat");
    expect(html).toContain("Steady pulse · 60 BPM");
    expect(html).toContain("<span>60 BPM</span><span>4/4</span>");
    expect(html.match(/<select[^>]*id="pulse-tempo"[^>]*>/)?.[0]).toContain("disabled");
    expect(html).not.toContain('id="pulse-status" role="status"');
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
