# Piano Practice

Piano Practice is a personal, local-first browser application for focused piano exercises, with a thin native wrapper for dependable MIDI input on iPad. The current vertical slice offers thirty-three studies: thirty original foundations, fifteen per hand, plus beginner Beethoven, intermediate Bach, and advanced Pachelbel public-domain learning arrangements. The original foundations include twelve untimed C-position, chord-tone, and D-minor five-note patterns plus straight steady-quarter, timed step-and-skip, steady broken-chord, 3/4 broken-chord loop, 5/4 pulse, even-eighth, repeated-note, longer mixed-pattern, and offbeat-onset pairs. Every study includes a server-rendered treble or bass pitch guide and immediate deterministic pitch and order feedback; the eighteen timed foundations add bounded onset-timing feedback. Completed-attempt history stays in the current browser or web view. The home page offers transient focus, hand, and timing filters—including an inclusive Repertoire focus—summarizes retained current-study completions, and suggests one explainable next study, while each practice page adds factual pitch-or-order-correction and timing context from its newest saved attempts.

The application runs as a Cloudflare Worker through Wrangler. It renders useful HTML on the server, then progressively enhances the practice page with small typed browser modules. There is no client framework, account, cloud database, generative feedback loop, percentage grade, or streak mechanic.

![Piano Practice application](docs/screenshots/home.png)

## Current Practice Slice

- Choose from thirty-three canonical exercises on the home or practice page, even when JavaScript or MIDI is unavailable.
- On the enhanced home page, narrow the folio by right or left hand, by Notes & reading, Rhythm & coordination, Patterns & technique, or Repertoire, and by Untimed or Pulse-guided practice. A study can appear under every focus represented in its curriculum tags; timing follows its canonical evaluation mode. All three filters compose, reset to the complete folio on reload, and never change history, recommendations, URLs, evidence, or exercise availability.
- On the enhanced home page, read retained exact-current-revision coverage across the library, right- and left-hand saved-study counts, today's retained completions, the most recent study, and one advisory next action. Matching cards say `Completion saved`; percentages, streaks, grades, and mastery claims are deliberately absent. If browser history cannot be read, the overview fails neutral and the complete library remains available.
- Open `/practice` for the default right-hand ascent, or use `?exercise=<id>` to link directly to another exercise.
- Read the current natural-note sequence on a pitch-only staff guide: treble for the right-hand C4-A4 subset and bass for the left-hand C3-A3 subset. Ordered note text remains alongside it as the accessible fallback.
- On a supported staff guide, use the enhanced `Reading focus` presentation to reduce visible instructions, note names, next-pitch text, and the expected-key answer while keeping staff progress, rhythm guidance, keyboard operation, and accessible semantics. The server-rendered default remains fully guided, and the page-local choice resets on navigation or reload.
- Use the on-screen natural-note span for a deterministic hardware-free flow. Full C-position studies show C through G once each, the D-minor studies show D through A, and repeated-pair studies use C through E. Repeated occurrences always reuse the same physical key.
- On a supported desktop browser, select and connect a Web MIDI input.
- On iPadOS 17 or later, use the native wrapper to select one USB or paired Bluetooth CoreMIDI source.
- See the next expected note, accepted notes, active notes, and calm feedback for correct, repeated, out-of-order, and wrong input.
- Practice the paired untimed C-major chord-tone studies as the ordered sequence C-E-G-E-C. Their five event occurrences retain separate progress and staff markers while the on-screen keyboard reuses its C and E controls; the sequence does not ask for simultaneous notes.
- Transfer that familiar shape to the paired untimed D-minor chord-tone studies as D-F-A-F-D. Place five fingers over D-E-F-G-A; the five event and staff occurrences reuse D and F controls while E and G remain playable correction inputs. Each study follows its matching C-major chord-tone completion in the advisory path, but remains freely selectable. Completion proves only ordered pitches—not blocked-chord playing, minor-quality recognition, fingering, hand use, or harmonic understanding.
- Activate every natural key in that position with the paired untimed D-E-F-G-A ascents. The instruction points out the close E-F half-step and suggests one finger per key; each study follows its matching D-minor chord-tone exercise in the advisory path, but remains freely selectable. Completion proves only the ordered five-note fragment—not a complete D-minor scale, half-step recognition, fingering, hand use, evenness, or technique.
- Learn three sourced, project-authored public-domain arrangements at levels relative to the included task: Beethoven's beginner `Ode to Joy` opening, J. S. Bach's intermediate BWV 772 opening motif, and Pachelbel's advanced Canon ground bass. Each is an untimed eight-note excerpt with visible composer, work, adaptation, rights, and a specific public-domain manuscript reference. The app independently encodes the bounded pitch sequence and bundles no third-party score, MIDI, recording, engraving, or editorial fingering; completion proves only that arrangement's pitch order, not the original rhythm, omitted voices, interpretation, or complete work.
- Extend that pattern in the timed C-E-G-E-C-E-G-E steady broken-chord pair. Eight staff occurrences reuse the five C-position controls, the card says `Steady pulse`, the pitch-only staff says `Pitch order · One note per beat`, and recommendation requires both the matching ordered chord-tone and straight steady-quarter studies.
- Regroup familiar chord tones in the timed C-E-G-C-E-G-C 3/4 broken-chord pair. Seven staff occurrences reuse the five C-position controls, a three-beat count-in and three-dot pulse guide wrap through beats 1–3, and the pitch-free task retains `Count 1 2 3, 1 2 3, 1` in Reading Focus. The matching steady broken-chord study is its sole advisory prerequisite.
- Extend the meter path with the timed C-D-E-F-G-C 5/4 pulse pair at offsets 0 through 5. Six staff occurrences reuse the five C-position controls, a five-beat count-in and five-dot pulse guide wrap through beats 1–5, and the pitch-free task retains `Count 1 2 3 4 5, 1` in Reading Focus. The matching 3/4 broken-chord study is its sole advisory prerequisite.
- Practice repeated-note onsets with the timed C-C-D-D-E pair. Five staff events reuse three physical keys, and the matching ascending C-D-E-F-G even-eighth study is its advisory prerequisite.
- Combine steps, skips, and one adjacent repeated pitch in the timed C-E-D-D-F-G-E-C mixed-pattern pair. Its eight events span one complete even-eighth 4/4 grid, and recommendation requires both the matching repeated-note and ordered chord-tone studies.
- Practice original offbeat-onset preparation with the timed C-E-D-F-G pair. The instruction places C on beat 1, then asks for E-D-F-G on the four successive “and” counts at offsets 0.5, 1.5, 2.5, and 3.5. The card says `Offbeat grid`, the pitch-only staff says `Pitch order · Downbeat then offbeat onsets`, and the matching mixed-pattern study is its sole advisory prerequisite.
- For any of the eighteen timed studies, choose 40–100 BPM (60 by default), hear canonical count-in and quarter-note click guidance, and receive “on time,” “early,” or “late” feedback after the first correct note anchors the attempt. Fourteen studies retain a four-beat 4/4 count-in; the 3/4 pair uses three beats and the 5/4 pair uses five, with each audible and visible pulse wrapping at its canonical measure length. Ten `Steady pulse` studies place C-D-E-F-G, C-E-D-F-G, C-E-G-E-C-E-G-E, C-E-G-C-E-G-C, or C-D-E-F-G-C on integer quarter-note offsets with a ±0.2-beat window. Six `Eighth-note grid` studies place C-D-E-F-G, C-C-D-D-E, or C-E-D-D-F-G-E-C on regular half-beat offsets with a ±0.1-beat window. Two `Offbeat grid` studies use the same ±0.1-beat window but place C on the anchor and the four later notes at successive “and” offsets. All eight fractional-position studies keep the audible guide on quarter-note clicks and draw pitch-only staff markers rather than rhythmic notation. Across the full library, twenty-two studies have five events, two have six, two have seven, and seven have eight; the last group includes four original timed patterns and three untimed repertoire arrangements. The ten five-event timed studies assess four intervals, the two six-event 5/4 studies assess five, the two seven-event 3/4 studies assess six, and the four original eight-event timed studies—the mixed-pattern and steady broken-chord pairs—assess seven.
- Restart cleanly after a disconnect or whenever you want to begin again.
- After completion, receive one advisory next-study or review suggestion based on declared prerequisites and retained exact-revision history. The suggestion explains its reason, while the complete exercise library remains available as the override.
- Keep compact completed-attempt history scoped to each exercise ID and revision in a versioned, bounded `localStorage` record. On the practice page, `Recent saved attempts` summarizes no more than the five newest retained matches: attempts completed without pitch or order corrections, non-zero wrong/repeated/out-of-order totals, and saved on-time/early/late interval totals with the number of attempts that supplied timing. It does not average tempo or mean absolute error and does not claim a score, trend, improvement, consistency, or mastery. Timed completions may include their tempo, interval classifications, and mean absolute error; incomplete and interrupted attempts are not saved, and evicted history no longer contributes to home coverage, recent evidence, or recommendations.

The staff guide supports gradual pitch-position reading, but its markers do not encode note duration or a complete score, and MIDI completion cannot establish that the learner read it. Reading focus is a learner-controlled visual presentation, not an assessment: correct feedback avoids revealing the next pitch, while explicit errors may name the actual and expected pitches as a correction, and no focus choice is stored with an attempt. MIDI can confirm note pitch and order for every exercise and assess onset intervals for the eighteen timed studies. For the repertoire sampler it confirms only the independently encoded eight-note arrangement, never the original rhythm, omitted voices, complete work, interpretation, or mastery. Fractional beat offsets locate expected note-ons relative to the first accepted MIDI note; they do not establish how long a note was held, encode rests or written notation, or imply simultaneity. Completing C-C-D-D-E confirms repeated note-on occurrences and their onset placement, not key release, articulation, fingering, relaxation, or physical control. Completing the longer C-E-D-D-F-G-E-C pattern confirms eight ordered onsets and seven MIDI-relative intervals, not duration, release, articulation, fingering, hand use, relaxation, staff reading, or consistent performance across attempts. Completing C-E-G-E-C-E-G-E likewise confirms only eight ordered pitches and seven MIDI-relative onset gaps at whole-beat targets. Its first C is an ungraded anchor and Web Audio is not the evaluation clock, so the result does not prove audible phase, click, downbeat, or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, hand use, relaxation, harmony recognition, staff reading, consistency, or mastery. Completing the 3/4 C-E-G-C-E-G-C loop confirms only seven ordered pitches and six MIDI-relative whole-beat gaps. Its three-beat count-in, beat-1 click accent, visible grouping, and final-C instruction are guidance rather than evaluation evidence, so completion does not prove audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, beat-1 accent or dynamics, duration, release, legato, rests, fingering, hand use, harmony recognition, staff reading, consistency, or mastery. Completing the 5/4 C-D-E-F-G-C phrase confirms only six ordered pitches and five MIDI-relative whole-beat gaps after its ungraded first C. Its five-beat count-in, five visible beats, click accent, grouped count, and final-C instruction are guidance rather than evaluation evidence, so completion does not prove audible phase, downbeat, click or measure alignment, final-C click alignment, 5/4 counting or grouping, accents or dynamics, duration, release, articulation, fingering, declared-hand use, staff reading, physical technique, consistency, or mastery. Completing the offbeat C-E-D-F-G pattern confirms five ordered notes and four later MIDI-relative timing gaps, but the first C is also an ungraded anchor and Web Audio is not the evaluation clock. It therefore does not prove audible downbeat alignment, between-click placement, rests, silence, duration, release, holding, accents, articulation, velocity quality, syncopation, fingering, hand use, reading, relaxation, consistency, or mastery. Likewise, completing untimed C-E-G-E-C or D-F-A-F-D confirms only an ordered pitch pattern; it does not establish blocked-chord playing, major- or minor-quality recognition, harmonic understanding, voicing, or simultaneous performance. Completing D-E-F-G-A confirms only that five-note order, not a complete D-minor scale, half-step recognition, evenness, fingering, or technique. MIDI cannot verify which hand played, assess posture, tension, fingering, velocity quality, or touch, or replace a qualified piano teacher. A recommendation likewise does not mean an exercise was mastered or unlocked; this first version deliberately ignores error totals, timing quality, tempo, and velocity when choosing what to suggest.

## Run Locally

Local development and local CI target macOS.

1. Run `nvm use` to select the Node.js version pinned in `package.json` and mirrored in `.nvmrc`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://127.0.0.1:8787` or go directly to `http://127.0.0.1:8787/practice`.

`npm run build` compiles Tailwind CSS and the typed browser entry point into ignored public assets under `.generated/browser/`. Wrangler runs this build automatically for local development and deployment.

## Input Support

The on-screen input is always the deterministic fallback and is also used by browser tests. Web MIDI is available only where the browser exposes the API and the learner grants access; real-device behavior still depends on the browser, operating system, and keyboard connection.

Ordinary iPad Safari is not treated as a reliable direct MIDI runtime. The `ios/LearnPiano.xcodeproj` wrapper hosts the same deployed HTTPS application in WKWebView and adapts CoreMIDI through `NativeMidiInputPort`; CoreAudioKit provides the system Bluetooth MIDI pairing interface. Native, Web MIDI, and mock events all reach the same exercise, evaluation, session, and persistence code. Native completions are identified as `native-midi` attempts.

## Run On iPad

The native target requires Xcode on macOS and supports iPadOS 17 or later. It uses only Apple frameworks; no Capacitor or native plugin dependency is required.

1. Deploy the Worker to an HTTPS URL that the iPad can reach.
2. Open `ios/LearnPiano.xcodeproj` in Xcode and select the `LearnPiano` scheme.
3. Configure signing and choose a physical iPad target.
4. On first launch, enter the deployed application URL. The `LEARN_PIANO_APP_URL` build setting can provide an initial `LearnPianoAppURL` value in the app's Info.plist instead.
5. Build and run, then choose a USB MIDI source or open the system Bluetooth MIDI pairing interface and select the paired source.

The wrapper restricts main-frame navigation and native bridge messages to the configured origin. HTTPS is required outside validated local-development hosts. Signing, provisioning, deployment, and real USB/Bluetooth device verification remain operator steps; simulator builds do not validate MIDI hardware.

## Architecture

- `src/worker.ts` is the Worker entry point and top-level router.
- `src/views/` renders the home, practice, and fallback documents.
- `src/client/` owns browser composition, session orchestration, DOM projection, and local persistence.
- `src/audio/` owns the guidance-only Web Audio count-in and steady-pulse scheduler.
- `src/notation/` owns the dependency-free pitch-to-staff projection for the current supported guide subset.
- `src/curriculum/` owns deterministic advisory study selection over canonical prerequisites and local completion evidence, plus the inclusive track projection used by the home folio filters.
- `src/midi/` defines the platform-neutral input contract plus Web MIDI and deterministic mock adapters.
- `ios/` contains the iPadOS 17+ WKWebView shell, CoreMIDI service, CoreAudioKit pairing UI, and Swift tests.
- `src/exercises/` contains the validated canonical exercise model and deterministic evaluator.
- `src/api/` contains the JSON health endpoint used by tooling and smoke tests.
- Colocated `*.test.ts` files cover domain and integration behavior; colocated `*.e2e.ts` files cover browser-visible flows.

Each canonical exercise definition is the shared source for rendering, evaluation, fixtures, persisted identity, and prerequisite relationships. Event identity remains occurrence-based for evaluation, semantic note order, and staff progress, while the physical keyboard projects one pitch-keyed control across the exercise's natural-note span. The reversible inline-SVG pitch-guide adapter derives its supported treble and bass positions from the same expected events without adding notation fields, schema versions, or exercise revisions. Reading focus is a transient client presentation available only for a validated supported guide; it changes no exercise, evaluator, attempt, history, or recommendation data. Live evaluation is local and replayable: an identical exercise, selected tempo, and normalized MIDI sequence always yield the same result. Timed studies compare accepted-note MIDI timestamp deltas with canonical beat gaps, including fractional offsets for subdivisions, and apply their own declared timing windows. Count-in length, visible beat indicators, running-beat wrap, meter labels, and click accents derive from each exercise's canonical timing metadata under ADR-060. Their Web Audio count-in and quarter-note metronome guide the learner but are never used as evaluation timestamps. Persisted `onPulse` and internal `on-pulse` names remain compatible with existing attempts; learner-facing feedback calls that result “on time.”

The local recommender uses only canonical library order, prerequisites, retained completions for current exercise revisions, and, on the practice page, the just-completed in-memory attempt. The home overview calls the same policy with retained history only. Recent pitch-or-order-correction and timing aggregates are a separate read-only presentation and never influence this policy. Practice completion can update its suggestion before persistence finishes, then refresh after a successful save. A failed save can leave that transient suggestion on the current page without making it durable; an initial history-read failure or invalid prerequisite graph leaves completion valid and uses the unrestricted exercise library as the neutral fallback.

## Routes

- `GET /` — application overview, progressively enhanced local practice summary, and thirty-three-exercise library
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
- `npm run ios:build` — unsigned generic iOS Simulator build
- `npm run ios:build-for-testing` — unsigned generic iOS Simulator build-for-testing
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

Full score notation, note duration, velocity, rests, syncopation, compound and further irregular meter, simultaneous chord events, hands-together work, adaptive tempo, quality-sensitive recommendations, protected repertoire content, cloud sync, and iPad release distribution remain separate decisions for later slices.
