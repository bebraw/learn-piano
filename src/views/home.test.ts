import { describe, expect, it } from "vitest";
import { exampleRoutes } from "../app-routes";
import { defaultExercise, exerciseLibrary } from "../exercises/library";
import { exercisePracticeHref } from "./exercise-presentation";
import { renderHomePage } from "./home";

describe("renderHomePage", () => {
  it("renders the piano practice entry point and stylesheet wiring", () => {
    const html = renderHomePage(exampleRoutes, exerciseLibrary, defaultExercise);

    expect(exerciseLibrary).toHaveLength(8);
    expect(html).toContain("Personal practice studio");
    expect(html).toContain("Choose your next study");
    expect(html).toContain("8 short patterns for both hands, including steady-pulse studies.");
    expect(html).toContain("Begin today’s study");
    expect(html).toContain("A calm, local-first practice companion");
    expect(html).not.toContain("Piano practice companion overview");
    expect(html).not.toContain("Untimed exercises for both hands and varied note order");
    expect(html).toContain("JSON health endpoint for tooling and smoke tests");
    for (const exercise of exerciseLibrary) {
      expect(html).toContain(exercise.title);
      expect(html).toContain(`href="${exercisePracticeHref(exercise)}"`);
    }
    expect(html).toContain("cannot assess posture, tension, fingering, or replace a qualified teacher");
    expect(html).toContain('class="home-hero');
    expect(html).toContain('class="folio-grid"');
    expect(html.match(/data-mode="timed"/g)).toHaveLength(2);
    expect(html.match(/Steady pulse · 60 BPM/g)).toHaveLength(2);
    expect(html).not.toContain("Six short patterns");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
    expect(html).toContain(`<meta name="description" content="A calm, local-first practice companion`);
    expect(html).toContain('<meta name="color-scheme" content="light">');
    expect(html).toContain('href="#main">Skip to main content</a>');
    expect(html).toContain('<main id="main"');
    expect(html).not.toContain("Stryker was here!");
    expect(html.match(/<li>/g)).toHaveLength(exerciseLibrary.length + 1);
  });
});
