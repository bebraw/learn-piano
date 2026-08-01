import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function ensureGeneratedStylesheet(stylesheetPath = join(".generated", "browser", "styles.css")): void {
  if (existsSync(stylesheetPath)) {
    return;
  }

  mkdirSync(dirname(stylesheetPath), { recursive: true });
  writeFileSync(stylesheetPath, ":root{--color-app-canvas:#f3eee6;}", "utf8");
}
