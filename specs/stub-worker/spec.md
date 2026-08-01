# Feature: Worker Application Shell

## Blueprint

### Context

The repository has evolved from a runnable template stub into a personal piano-practice application while retaining the lightweight Cloudflare Worker baseline. The shell must serve a useful server-rendered six-exercise library, a stable health route, and same-origin generated assets without turning practice into a client framework application.

### Architecture

- **Entry point:** Wrangler starts `src/worker.ts`, which owns top-level routing.
- **Source layout:** `src/api/` contains API handlers, `src/views/` contains HTML renderers, and browser behavior remains in typed modules under `src/client/`.
- **Routes:** `/` renders the application overview and six-exercise library, `/practice` renders the canonical default, `/practice?exercise=<id>` renders an exact library selection, `/api/health` returns stable JSON, and unknown paths or supplied exercise IDs return a non-indexable 404 document.
- **Asset pipeline:** `src/tailwind-input.css` and the browser TypeScript graph compile into `.generated/browser/`. Selective Worker-first routing preserves the `/styles.css` response contract, while Wrangler's static asset binding serves `/client/*.js` directly.
- **Rendering boundary:** The Worker provides the document shell and meaningful initial content. Small same-origin ESM modules progressively enhance interactive practice behavior.
- **Client code boundary:** Worker-rendered HTML may reference typed same-origin module files but must not embed executable browser code, event-handler attributes, JavaScript URLs, remote scripts, or classic scripts.
- **Web response baseline:** HTML responses include a restrictive same-origin CSP, a narrow Permissions Policy that allows MIDI only for the same origin, a referrer policy, MIME-sniffing protection, and no-store caching. Rendered pages include baseline metadata and keyboard bypass navigation.
- **Dependencies:** Wrangler provides the Worker runtime; Tailwind and TypeScript build public assets; Vitest and Playwright verify module and browser behavior.

### Anti-Patterns

- Do not collapse routing, API handling, HTML views, browser orchestration, and musical domain behavior into the Worker entry point.
- Do not make the home or practice document dependent on client JavaScript for its essential meaning.
- Do not edit generated files in `.generated/browser/` by hand or treat them as source.
- Do not serve executable client code from untyped strings in Worker views.
- Do not add inline scripts, inline event handlers, JavaScript URLs, remote scripts, or classic scripts to Worker-rendered HTML.
- Do not loosen the CSP or Permissions Policy implicitly when adding assets, frames, forms, or browser capabilities.
- Do not add persistence, authentication, or analytics to the Worker merely because the browser application has local history.

## Contract

### Definition of Done

- [ ] Wrangler starts the application without additional scaffolding.
- [ ] `/` returns the current Piano Practice overview and visible links to all six canonical exercises.
- [ ] `/practice` returns useful canonical default-exercise content before client enhancement.
- [ ] `?exercise=<id>` selects each known exercise server-side, while unknown, empty, or duplicated supplied parameters return `404`.
- [ ] `/api/health` returns stable JSON for smoke tests and tooling.
- [ ] The build emits the stylesheet and typed browser ESM under `.generated/browser/`.
- [ ] HTML and stylesheet responses retain the documented security headers.
- [ ] Automated module and browser tests cover critical routing and rendering behavior.
- [ ] This spec changes with the application-shell contract.

### Regression Guardrails

- `GET /` must return HTML with the Piano Practice heading and visible links to all six exercises.
- `GET /practice` must include the default exercise title, instructions, expected note sequence, limitation text, server-rendered chooser, and same-origin module entry point.
- `GET /practice?exercise=<id>` must keep the URL selection, rendered content, and embedded canonical identity aligned without client JavaScript.
- A present but empty or unknown exercise ID, or a duplicated exercise parameter, must return `404` rather than fall back to the default.
- `GET /styles.css` and generated `/client/*.js` paths must resolve through the runtime used by browser tests.
- Worker and view files must remain free of inline executable browser code.
- The worker-client guard must reject inline, remote, classic, malformed, and entity-obfuscated script paths while accepting the narrow same-origin module form.
- `GET /api/health` must return HTTP 200 JSON with `ok: true` and the current application name.
- Unknown routes must return HTTP 404 and remain non-indexable.
- HTML responses must retain `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and the documented Content Security Policy.
- Home and practice pages must retain descriptions, colour-scheme declarations, and skip links.

### Verification

- **Unit and integration tests:** colocated Vitest files under `src/**/*.test.ts` cover routing, response headers, rendered content, and domain-to-view composition.
- **Tooling tests:** `scripts/assert-no-worker-client-scripts.test.mjs` exercises accepted and rejected browser-code shapes.
- **Browser tests:** colocated Playwright files under `src/**/*.e2e.ts` cover the home library, generated assets, health route, default and selected no-JavaScript practice documents, and enhanced practice flows.
- **Coverage target:** Worker, API, view, and non-DOM browser modules remain above repository coverage thresholds.

### Scenarios

**Scenario: Learner opens the application**

- Given: the Worker is running locally
- When: the learner visits `/`
- Then: they see the Piano Practice overview and can open any of the six beginner exercises

**Scenario: Exercise document loads without enhancement**

- Given: client scripting is unavailable
- When: the learner visits `/practice`
- Then: the default exercise title, instructions, notes, six-exercise chooser, and limitation text remain visible

**Scenario: Learner follows a direct exercise link**

- Given: the selected ID belongs to the canonical library
- When: the learner visits `/practice?exercise=<id>` without client scripting
- Then: the matching exercise and chooser selection are server-rendered and remain usable

**Scenario: Learner requests an unknown exercise**

- Given: the exercise query is present but empty, unknown, or duplicated
- When: the learner visits `/practice?exercise=<invalid-id>`
- Then: the Worker returns a non-indexable `404` instead of silently serving the default

**Scenario: Browser requests generated assets**

- Given: the Worker build has completed
- When: the browser requests `/styles.css` and `/client/main.js`
- Then: it receives the generated same-origin assets used by the enhanced practice page

**Scenario: Tooling checks application health**

- Given: the Worker is running locally
- When: a tool requests `/api/health`
- Then: it receives a stable JSON response with `ok: true`

**Scenario: Unknown route**

- Given: the Worker is running locally
- When: a request hits an undefined route
- Then: the Worker returns HTTP 404 with a non-indexable HTML response
