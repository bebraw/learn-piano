import { describe, expect, it } from "vitest";
import { exampleRoutes } from "../app-routes";
import { defaultExercise, exerciseLibrary } from "../exercises/library";
import { exercisePracticeHref } from "./exercise-presentation";
import { renderHomePage } from "./home";

describe("renderHomePage", () => {
  it("renders the piano practice entry point and stylesheet wiring", () => {
    const html = renderHomePage(exampleRoutes, exerciseLibrary, defaultExercise);

    expect(html).toContain("Choose an exercise");
    expect(html).toContain(`${exerciseLibrary.length} untimed studies`);
    expect(html).toContain("A calm, local-first practice companion");
    expect(html).not.toContain("Piano practice companion overview");
    expect(html).not.toContain("Untimed exercises for both hands and varied note order");
    expect(html).toContain("JSON health endpoint for tooling and smoke tests");
    for (const exercise of exerciseLibrary) {
      expect(html).toContain(exercise.title);
      expect(html).toContain(`href="${exercisePracticeHref(exercise)}"`);
    }
    expect(html).toContain("does not replace a qualified piano teacher");
    expect(html).toContain('rel="stylesheet" href="/styles.css"');
    expect(html).toContain(`<meta name="description" content="A calm, local-first practice companion`);
    expect(html).toContain('<meta name="color-scheme" content="light">');
    expect(html).toContain('href="#main">Skip to main content</a>');
    expect(html).toContain('<main id="main"');
    expect(html).not.toContain("Stryker was here!");
    expect(html.match(/<li>/g)).toHaveLength(exerciseLibrary.length + 1);
  });
});
