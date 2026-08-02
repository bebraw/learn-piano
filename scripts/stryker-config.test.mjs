import assert from "node:assert/strict";
import test from "node:test";

import strykerConfig from "../stryker.config.mjs";

test("keeps the calibrated mutation thresholds and browser-independent runtime scope", () => {
  assert.deepEqual(strykerConfig.thresholds, {
    high: 90,
    low: 80,
    break: 65,
  });
  assert.deepEqual(strykerConfig.mutate, ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts", "!src/**/*.e2e.ts", "!src/client/main.ts"]);
});
