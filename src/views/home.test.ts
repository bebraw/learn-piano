import { describe, expect, it } from "vitest";
import { exampleRoutes } from "../app-routes";
import { projectFolioCurriculumFocuses } from "../curriculum/folio-filter";
import { defaultExercise, exerciseLibrary } from "../exercises/library";
import { evenEighthsLeftHandExercise, evenEighthsRightHandExercise } from "../exercises/library/even-eighth-exercises";
import { fiveFourPulseLeftHandExercise, fiveFourPulseRightHandExercise } from "../exercises/library/five-four-pulse-exercises.js";
import {
  mixedEighthPatternLeftHandExercise,
  mixedEighthPatternRightHandExercise,
} from "../exercises/library/mixed-eighth-pattern-exercises";
import { offbeatStepSkipLeftHandExercise, offbeatStepSkipRightHandExercise } from "../exercises/library/offbeat-step-skip-exercises";
import { repeatedNotesLeftHandExercise, repeatedNotesRightHandExercise } from "../exercises/library/repeated-note-exercises";
import {
  steadyBrokenChordLeftHandExercise,
  steadyBrokenChordRightHandExercise,
} from "../exercises/library/steady-broken-chord-exercises.js";
import {
  steadyQuarterStepSkipLeftHandExercise,
  steadyQuarterStepSkipRightHandExercise,
} from "../exercises/library/steady-quarter-exercises";
import {
  threeFourBrokenChordLeftHandExercise,
  threeFourBrokenChordRightHandExercise,
} from "../exercises/library/three-four-broken-chord-exercises.js";
import { exercisePracticeHref } from "./exercise-presentation";
import { renderHomePage } from "./home";

describe("renderHomePage", () => {
  it("renders the piano practice entry point and stylesheet wiring", () => {
    const html = renderHomePage(exampleRoutes, exerciseLibrary, defaultExercise);

    expect(exerciseLibrary).toHaveLength(28);
    expect(html).toContain("Personal practice studio");
    expect(html).toContain("Choose your next study");
    expect(html).toContain("28 short patterns for both hands, including pulse and subdivision studies.");
    expect(html).toContain("Begin today’s study");
    expect(html).toContain("A calm, local-first practice companion");
    expect(html).toContain("Your local practice");
    expect(html).toContain("Enable JavaScript to read completions saved in this browser.");
    expect(html).toContain('id="home-overview-status"');
    expect(html).toContain('id="home-overview-details" class="home-overview-details" hidden');
    expect(html).toContain('id="home-overview-recent" class="home-overview-recent" hidden');
    expect(html).toContain('id="home-overview-recommendation" class="home-overview-recommendation" hidden');
    expect(html).toContain('class="folio-filters" id="folio-filters" data-enhancement hidden');
    expect(html).toContain("<legend>Focus</legend>");
    expect(html).toContain("<legend>Hand</legend>");
    expect(html).toContain('id="folio-filter-status" role="status" aria-live="polite"');
    expect(html).toContain(`Showing ${exerciseLibrary.length} of ${exerciseLibrary.length} studies`);
    expect(html.match(/data-folio-focus-filter/g)).toHaveLength(4);
    expect(html.match(/data-folio-hand-filter/g)).toHaveLength(3);
    expect(html.match(/aria-controls="folio-grid" checked/g)).toHaveLength(2);
    expect(html.match(/data-folio-entry/g)).toHaveLength(exerciseLibrary.length);
    expect(html).not.toContain("Piano practice companion overview");
    expect(html).not.toContain("Untimed exercises for both hands and varied note order");
    expect(html).toContain("JSON health endpoint for tooling and smoke tests");
    for (const exercise of exerciseLibrary) {
      const cardStart = html.indexOf(`data-exercise-id="${exercise.id}"`);
      const entryStart = html.lastIndexOf("<li data-folio-entry", cardStart);
      const entryEnd = html.indexOf("</li>", cardStart);
      const entry = html.slice(entryStart, entryEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(entry).toContain(exercise.title);
      expect(entry).toContain(`href="${exercisePracticeHref(exercise)}"`);
      expect(entry).toContain(`data-exercise-id="${exercise.id}"`);
      expect(entry).toContain(`data-exercise-revision="${exercise.revision}"`);
      expect(entry).toContain(`data-focuses="${projectFolioCurriculumFocuses(exercise.curriculumTags).join(" ")}"`);
    }
    expect(html).toContain("cannot assess posture, tension, fingering, or replace a qualified teacher");
    expect(html).toContain('class="home-hero');
    expect(html).toContain('class="folio-grid" id="folio-grid"');
    expect(html.match(/data-mode="timed"/g)).toHaveLength(18);
    expect(html.match(/Steady pulse · 60 BPM/g)).toHaveLength(10);
    for (const exercise of [
      steadyQuarterStepSkipRightHandExercise,
      steadyQuarterStepSkipLeftHandExercise,
      steadyBrokenChordRightHandExercise,
      steadyBrokenChordLeftHandExercise,
    ]) {
      const cardStart = html.indexOf(`href="${exercisePracticeHref(exercise)}"`);
      const cardEnd = html.indexOf("</a>", cardStart);
      const card = html.slice(cardStart, cardEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(card).toContain(exercise.title);
      expect(card).toContain(exercise.instructions);
      expect(card).toContain("Steady pulse · 60 BPM · 4/4");
    }
    for (const exercise of [threeFourBrokenChordRightHandExercise, threeFourBrokenChordLeftHandExercise]) {
      const cardStart = html.indexOf(`href="${exercisePracticeHref(exercise)}"`);
      const cardEnd = html.indexOf("</a>", cardStart);
      const card = html.slice(cardStart, cardEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(card).toContain(exercise.title);
      expect(card).toContain(exercise.instructions);
      expect(card).toContain("Steady pulse · 60 BPM · 3/4");
    }
    for (const exercise of [fiveFourPulseRightHandExercise, fiveFourPulseLeftHandExercise]) {
      const cardStart = html.indexOf(`href="${exercisePracticeHref(exercise)}"`);
      const cardEnd = html.indexOf("</a>", cardStart);
      const card = html.slice(cardStart, cardEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(card).toContain(exercise.title);
      expect(card).toContain(exercise.instructions);
      expect(card).toContain("Steady pulse · 60 BPM · 5/4");
    }
    for (const exercise of [
      evenEighthsRightHandExercise,
      evenEighthsLeftHandExercise,
      repeatedNotesRightHandExercise,
      repeatedNotesLeftHandExercise,
      mixedEighthPatternRightHandExercise,
      mixedEighthPatternLeftHandExercise,
    ]) {
      const cardStart = html.indexOf(`href="${exercisePracticeHref(exercise)}"`);
      const cardEnd = html.indexOf("</a>", cardStart);
      const card = html.slice(cardStart, cardEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(card).toContain("Eighth-note grid · 60 BPM · 4/4");
      expect(card).not.toContain("Steady pulse · 60 BPM");
    }
    for (const exercise of [offbeatStepSkipRightHandExercise, offbeatStepSkipLeftHandExercise]) {
      const cardStart = html.indexOf(`href="${exercisePracticeHref(exercise)}"`);
      const cardEnd = html.indexOf("</a>", cardStart);
      const card = html.slice(cardStart, cardEnd);

      expect(cardStart, `missing folio card for ${exercise.id}`).toBeGreaterThanOrEqual(0);
      expect(card).toContain("Offbeat grid · 60 BPM · 4/4");
      expect(card).not.toContain("Eighth-note grid · 60 BPM");
    }
    expect(html).not.toContain("Six short patterns");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
    expect(html).toContain(`<meta name="description" content="A calm, local-first practice companion`);
    expect(html).toContain('<meta name="color-scheme" content="light">');
    expect(html).toContain('href="#main">Skip to main content</a>');
    expect(html).toContain('<main id="main" class="app-shell pb-10 pt-5 sm:pb-14 sm:pt-8" data-home-root>');
    expect(html.match(/data-completion-badge hidden/g)).toHaveLength(exerciseLibrary.length);
    expect(html).toContain('<script type="module" src="/client/main.js"></script>');
    expect(html).not.toContain("Stryker was here!");
    expect(html.match(/<li\b/g)).toHaveLength(exerciseLibrary.length + 1);
  });
});
