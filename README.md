# Piano Practice

Piano Practice is a personal, local-first browser application for focused piano exercises. The current vertical slice offers six untimed beginner studies: right- and left-hand C-position ascents and descents plus a step-and-skip pattern for each hand. It gives immediate deterministic feedback and remembers completed attempts in the current browser.

The application runs as a Cloudflare Worker through Wrangler. It renders useful HTML on the server, then progressively enhances the practice page with small typed browser modules. There is no client framework, account, cloud database, generative feedback loop, timer, score, or streak mechanic.

![Piano Practice application](docs/screenshots/home.png)

## Current Practice Slice

- Choose from six canonical exercises on the home or practice page, even when JavaScript or MIDI is unavailable.
- Open `/practice` for the default right-hand ascent, or use `?exercise=<id>` to link directly to another exercise.
- Use the five on-screen practice keys for a deterministic hardware-free flow.
- On a supported desktop browser, select and connect a Web MIDI input.
- See the next expected note, accepted notes, active notes, and calm feedback for correct, repeated, out-of-order, and wrong input.
- Restart cleanly after a disconnect or whenever you want to begin again.
- Keep compact completed-attempt history scoped to each exercise ID and revision in a versioned `localStorage` record. Incomplete and interrupted attempts are not saved.

MIDI can confirm note pitch and order for these exercises. It cannot verify which hand played, assess posture, tension, fingering, or touch, or replace a qualified piano teacher.

## Run Locally

Local development and local CI target macOS.

1. Run `nvm use` to select the Node.js version pinned in `package.json` and mirrored in `.nvmrc`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://127.0.0.1:8787` or go directly to `http://127.0.0.1:8787/practice`.

`npm run build` compiles Tailwind CSS and the typed browser entry point into ignored public assets under `.generated/browser/`. Wrangler runs this build automatically for local development and deployment.

## Input Support

The on-screen input is always the deterministic fallback and is also used by browser tests. Web MIDI is available only where the browser exposes the API and the learner grants access; real-device behavior still depends on the browser, operating system, and keyboard connection.

Ordinary iPad Safari is not treated as a reliable direct MIDI runtime. The domain depends on a platform-neutral `MidiInputPort`, so a later thin WKWebView/CoreMIDI wrapper can supply the same normalized events without forking exercise or evaluation behavior. That native wrapper is proposed, not implemented.

## Architecture

- `src/worker.ts` is the Worker entry point and top-level router.
- `src/views/` renders the home, practice, and fallback documents.
- `src/client/` owns browser composition, session orchestration, DOM projection, and local persistence.
- `src/midi/` defines the platform-neutral input contract plus Web MIDI and deterministic mock adapters.
- `src/exercises/` contains the validated canonical exercise model and deterministic evaluator.
- `src/api/` contains the JSON health endpoint used by tooling and smoke tests.
- Colocated `*.test.ts` files cover domain and integration behavior; colocated `*.e2e.ts` files cover browser-visible flows.

Each canonical exercise definition is the shared source for rendering, evaluation, fixtures, and persisted identity. Live evaluation is local and replayable: an identical exercise and normalized MIDI sequence always yields the same result.

## Routes

- `GET /` — application overview and six-exercise beginner library
- `GET /practice` — the default right-hand C4-to-G4 ascent
- `GET /practice?exercise=<id>` — a selected canonical exercise; unknown IDs return `404`
- `GET /styles.css` and `GET /client/*.js` — generated same-origin browser assets
- `GET /api/health` — stable JSON health response

## Verification

- `npm run quality:gate:fast` — formatting, lint, types, browser-code guard, tooling tests, dependency audit, and unit coverage
- `npm run quality:gate` — the baseline gate plus Playwright browser tests
- `npm run ci:local` — the containerized GitHub Actions workflow for workflow-sensitive or full-readiness changes
- `npm test` — colocated Vitest unit and integration tests
- `npm run e2e` — Playwright browser tests
- `npm run typecheck` — TypeScript 7 project checks
- `npm run build` — stylesheet and browser ESM build
- `npm run mutation` — full local mutation test run

The repo-managed pre-push hook runs affected-file guardrails after `npm install`. Install the pinned Playwright browser with `npm run playwright:install` when needed. See `docs/development.md` for the complete workflow, Agent CI setup, and write boundaries.

## Documentation Contract

The repo vendors ASDLC reference material under `.asdlc/`. Repo-specific truth lives in `ARCHITECTURE.md`, `specs/`, and `docs/adrs/`: generated code still has to implement those documents, and passing CI alone is not sufficient.

- Development and local CI: `docs/development.md`
- Architecture decisions: `docs/adrs/README.md`
- Living feature specs: `specs/README.md`
- Agent rules: `AGENTS.md`
- Reusable capability kits: `.capabilities/`
- Portable template maintenance packs: `.template/updates/`

The application screenshot is committed at `docs/screenshots/home.png` and refreshed manually after material UI changes; screenshot capture is not part of CI.

## Next Slice

The recommended next slice is a count-in, metronome, and explicit timing/tempo evaluation contract, followed by an original steady-pulse Rhythm and Coordination exercise. Notation libraries, protected repertoire content, cloud sync, and native iPad packaging remain separate decisions.
