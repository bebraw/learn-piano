import { describe, expect, it } from "vitest";
import { defaultExercise, exerciseLibrary } from "../exercises/library/index.js";
import { fiveNoteAscentExercise } from "../exercises/library/five-note-ascent.js";
import type { Exercise } from "../exercises/types.js";
import { renderPracticePage } from "./practice.js";

describe("renderPracticePage", () => {
  it("renders canonical instructions and a useful no-JavaScript document", () => {
    const html = renderPracticePage(fiveNoteAscentExercise, exerciseLibrary);

    expect(html).toContain("Play C-D-E-F-G in ascending order with your right hand.");
    expect(html).toContain("C4 · D4 · E4 · F4 · G4");
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
    expect(html).toContain('id="next-exercise"');
    expect(html).toContain('aria-current="page"');
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

  it("rejects an empty exercise instead of rendering false completion", () => {
    const emptyExercise = { ...fiveNoteAscentExercise, expectedEvents: [] };
    expect(() => renderPracticePage(emptyExercise, [emptyExercise])).toThrow("requires at least one expected event");
  });
});
