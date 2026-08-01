# Feature: Worker Application Shell

## Blueprint

### Context

The repository has evolved from a runnable template stub into a personal piano-practice application while retaining the lightweight Cloudflare Worker baseline. The shell must serve a useful server-rendered eighteen-exercise library, a stable health route, and same-origin generated assets without turning practice into a client framework application.

### Architecture

- **Entry point:** Wrangler starts `src/worker.ts`, which owns top-level routing.
- **Source layout:** `src/api/` contains API handlers, `src/views/` contains HTML renderers, and browser behavior remains in typed modules under `src/client/`.
- **Routes:** `/` renders the application overview and eighteen-exercise library, `/practice` renders the canonical default, `/practice?exercise=<id>` renders an exact library selection, `/api/health` returns stable JSON, and unknown paths or supplied exercise IDs return a non-indexable 404 document.
- **Asset pipeline:** `src/tailwind-input.css` and the browser TypeScript graph compile into `.generated/browser/`. Selective Worker-first routing preserves the `/styles.css` response contract, while Wrangler's static asset binding serves `/client/*.js` directly.
- **Rendering boundary:** The Worker provides the document shell and meaningful initial content. Small same-origin ESM modules progressively enhance interactive practice behavior.
- **Guidance boundary:** Every practice response is fully guided and meaningful before enhancement. Reading focus is an optional client-only presentation after supported staff validation; it never changes routing, response identity, canonical exercise content, or the no-JavaScript contract.
- **Visual-system boundary:** Server-rendered views share the responsive practice-desk shell and token-driven visual system from `src/tailwind-input.css`. The active practice surface leads the document hierarchy; setup, exercise selection, history, and utility routes remain supporting content without changing the semantic order when the layout stacks.
- **Client code boundary:** Worker-rendered HTML may reference typed same-origin module files but must not embed executable browser code, event-handler attributes, JavaScript URLs, remote scripts, or classic scripts.
- **Web response baseline:** HTML responses include a restrictive same-origin CSP, a narrow Permissions Policy that allows MIDI only for the same origin, a referrer policy, MIME-sniffing protection, and no-store caching. Rendered pages include baseline metadata and keyboard bypass navigation.
- **Dependencies:** Wrangler provides the Worker runtime; Tailwind and TypeScript build public assets; Vitest and Playwright verify module and browser behavior.

### Anti-Patterns

- Do not collapse routing, API handling, HTML views, browser orchestration, and musical domain behavior into the Worker entry point.
- Do not make the home or practice document dependent on client JavaScript for its essential meaning.
- Do not server-render reading focus as the default, expose a non-functional toggle without JavaScript, or remove guided semantic content from the response.
- Do not edit generated files in `.generated/browser/` by hand or treat them as source.
- Do not serve executable client code from untyped strings in Worker views.
- Do not add inline scripts, inline event handlers, JavaScript URLs, remote scripts, or classic scripts to Worker-rendered HTML.
- Do not loosen the CSP or Permissions Policy implicitly when adding assets, frames, forms, or browser capabilities.
- Do not add persistence, authentication, or analytics to the Worker merely because the browser application has local history.

## Contract

### Definition of Done

- [ ] Wrangler starts the application without additional scaffolding.
- [ ] `/` returns the current Piano Practice overview and visible links to all eighteen canonical exercises.
- [ ] `/practice` returns useful canonical default-exercise content before client enhancement.
- [ ] The practice response remains fully guided, while supported client enhancement may expose a transient reading-focus toggle without adding a route, query parameter, or alternate document identity.
- [ ] Home, practice, and not-found documents share the finished application identity, responsive layout rules, and accessible interaction sizing rather than presenting disconnected prototype screens.
- [ ] The practice document keeps the active score, keyboard, cue, and feedback visually primary at desktop and iPad sizes, then stacks supporting setup, chooser, and history content after the stage on narrow screens.
- [ ] `?exercise=<id>` selects each known exercise server-side, while unknown, empty, or duplicated supplied parameters return `404`.
- [ ] `/api/health` returns stable JSON for smoke tests and tooling.
- [ ] The build emits the stylesheet and typed browser ESM under `.generated/browser/`.
- [ ] HTML and stylesheet responses retain the documented security headers.
- [ ] Automated module and browser tests cover critical routing and rendering behavior.
- [ ] This spec changes with the application-shell contract.

### Regression Guardrails

- `GET /` must return HTML with the Piano Practice heading and visible links to all eighteen exercises.
- `GET /practice` must include the default exercise title, instructions, expected note sequence, limitation text, server-rendered chooser, and same-origin module entry point.
- Reading-focus enhancement must leave that guided response content and canonical identity intact; navigation or reload creates a new guided document and no Worker state persists the choice.
- `GET /practice?exercise=<id>` must keep the URL selection, rendered content, and embedded canonical identity aligned without client JavaScript.
- A present but empty or unknown exercise ID, or a duplicated exercise parameter, must return `404` rather than fall back to the default.
- `GET /styles.css` and generated `/client/*.js` paths must resolve through the runtime used by browser tests.
- Worker and view files must remain free of inline executable browser code.
- The worker-client guard must reject inline, remote, classic, malformed, and entity-obfuscated script paths while accepting the narrow same-origin module form.
- `GET /api/health` must return HTTP 200 JSON with `ok: true` and the current application name.
- Unknown routes must return HTTP 404 and remain non-indexable.
- HTML responses must retain `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and the documented Content Security Policy.
- Home and practice pages must retain descriptions, colour-scheme declarations, and skip links.
- Responsive presentation must preserve the server-rendered heading, landmark, and focus order; CSS must not make input setup, exercise selection, or history precede the active practice stage semantically.

### Verification

- **Unit and integration tests:** colocated Vitest files under `src/**/*.test.ts` cover routing, response headers, rendered content, and domain-to-view composition.
- **Tooling tests:** `scripts/assert-no-worker-client-scripts.test.mjs` exercises accepted and rejected browser-code shapes.
- **Browser tests:** colocated Playwright files under `src/**/*.e2e.ts` cover the home library, generated assets, health route, default and selected no-JavaScript guided practice documents, transient reading-focus enhancement, and other enhanced practice flows.
- **Coverage target:** Worker, API, view, and non-DOM browser modules remain above repository coverage thresholds.

### Scenarios

**Scenario: Learner opens the application**

- Given: the Worker is running locally
- When: the learner visits `/`
- Then: they see the Piano Practice overview and can open any of the eighteen beginner exercises

**Scenario: Exercise document loads without enhancement**

- Given: client scripting is unavailable
- When: the learner visits `/practice`
- Then: the default exercise title, instructions, notes, eighteen-exercise chooser, and limitation text remain visible

**Scenario: Client offers reading focus without changing the route**

- Given: the guided practice document contains a validated supported staff guide and client scripting runs
- When: enhancement initializes and the learner selects reading focus
- Then: the URL and canonical server content remain unchanged while only the documented visual cues are reduced for that page instance

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
