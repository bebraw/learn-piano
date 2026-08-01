import assert from "node:assert/strict";
import test from "node:test";

import { findBrowserCodeViolations } from "./assert-no-worker-client-scripts.mjs";

test("allows empty same-origin external module scripts", () => {
  const sources = [
    '<script type="module" src="/client/main.js"></script>',
    "<script src='./client/main.js' type='MODULE'>\n  </script>",
    '<script async nonce="local" type="module" src="client/main.js"></script>',
  ];

  for (const source of sources) {
    assert.deepEqual(findBrowserCodeViolations(source), []);
  }
});

test("rejects inline script bodies", () => {
  const violations = findBrowserCodeViolations('<script type="module" src="/client/main.js">start()</script>');

  assert.deepEqual(violations, [{ index: 0, name: "inline <script> body" }]);
});

test("rejects module scripts without a literal same-origin source", () => {
  const cases = [
    ['<script type="module"></script>', "<script> tag without src"],
    ['<script type="module" src="https://example.com/client.js"></script>', "non-same-origin <script> src"],
    ['<script type="module" src="//example.com/client.js"></script>', "non-same-origin <script> src"],
    ['<script type="module" src="data:text/javascript,start()"></script>', "non-same-origin <script> src"],
    ['<script type="module" src="&#104;ttps://example.com/client.js"></script>', "non-same-origin <script> src"],
    ['<script type="module" src="${clientSource}"></script>', "non-same-origin <script> src"],
  ];

  for (const [source, expectedName] of cases) {
    assert.equal(findBrowserCodeViolations(source)[0]?.name, expectedName);
  }
});

test("rejects non-module executable script tags", () => {
  const sources = ['<script src="/client/main.js"></script>', '<script type="text/javascript" src="/client/main.js"></script>'];

  for (const source of sources) {
    assert.deepEqual(findBrowserCodeViolations(source), [{ index: 0, name: "non-module <script> tag" }]);
  }
});

test("rejects malformed or unpaired script tags", () => {
  const sources = [
    '<script type="module" src="/client/main.js">',
    '<script type="module" src="/client/main.js" src="/client/other.js"></script>',
    '<script type="module" src=/client/main.js></script>',
  ];

  for (const source of sources) {
    assert.notEqual(findBrowserCodeViolations(source).length, 0);
  }
});

test("rejects inline handlers", () => {
  assert.deepEqual(findBrowserCodeViolations('<button onclick="start()">Start</button>'), [
    { index: 7, name: "inline event handler attribute" },
  ]);
});

test("rejects literal and entity-obfuscated javascript URLs", () => {
  const sources = [
    '<a href="javascript: start()">Start</a>',
    '<a href="jav&#x61;script: start()">Start</a>',
    '<a href="jav&#97;script: start()">Start</a>',
    '<a href="javascript&colon; start()">Start</a>',
    '<a href="java&Tab;script: start()">Start</a>',
    '<a href="java&NewLine;script: start()">Start</a>',
  ];

  for (const source of sources) {
    assert.deepEqual(findBrowserCodeViolations(source), [{ index: 9, name: "javascript: URL" }]);
  }

  assert.deepEqual(findBrowserCodeViolations('<a href="/practice?one=1&amp;two=2">Practice</a>'), []);
});
