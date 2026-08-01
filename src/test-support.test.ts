import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ensureGeneratedStylesheet } from "./test-support";

describe("ensureGeneratedStylesheet", () => {
  it("creates a minimal stylesheet when no generated asset exists", () => {
    withTemporaryStylesheet((stylesheetPath) => {
      ensureGeneratedStylesheet(stylesheetPath);

      expect(readFileSync(stylesheetPath, "utf8")).toContain("--color-app-canvas:#f3eee6");
    });
  });

  it("preserves an existing generated stylesheet", () => {
    withTemporaryStylesheet((stylesheetPath) => {
      const generatedStyles = ".piano-key{min-height:10.5rem}";
      ensureGeneratedStylesheet(stylesheetPath);
      writeFileSync(stylesheetPath, generatedStyles, "utf8");

      ensureGeneratedStylesheet(stylesheetPath);

      expect(readFileSync(stylesheetPath, "utf8")).toBe(generatedStyles);
    });
  });
});

function withTemporaryStylesheet(run: (stylesheetPath: string) => void): void {
  const directory = mkdtempSync(join(tmpdir(), "learn-piano-test-support-"));

  try {
    run(join(directory, "nested", "styles.css"));
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}
