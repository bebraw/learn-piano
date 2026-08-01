# Feature: Local Practice Overview

## Blueprint

### Context

The canonical library contains twenty-four short studies, but per-exercise history alone makes it difficult to understand the retained practice record as a whole. The home page needs one calm, local summary that helps the learner resume deliberately without turning completion records into grades, streaks, or mastery claims.

### Architecture

- **Entry point:** The server-rendered `/` document contains the complete exercise library and a progressively enhanced `Your local practice` region.
- **Persistence boundary:** The overview reads through `AttemptRepository`; it does not access or reshape the versioned `localStorage` envelope directly and introduces no new storage key or write path.
- **Evidence boundary:** Only retained completed attempts matching a current canonical exercise ID and revision contribute. Unknown exercises, old revisions, malformed timestamps, incomplete sessions, and evicted records contribute nothing.
- **Coverage summary:** Each current study contributes at most one saved-study completion. Every retained matching attempt completed on the learner's current local calendar day contributes to the today count.
- **Hand summary:** A current study contributes to the right- or left-hand total when its canonical events assign that hand; an event assigned to both contributes to both hand summaries. Coverage for each hand remains unique by study.
- **Recent summary:** The newest valid matching attempt supplies the most-recent study and local completion time. Canonical library order resolves equal timestamps.
- **Recommendation:** The home page reuses the deterministic local `recommendNextStudy` policy with no just-completed in-memory attempt. Empty readable history therefore receives the first prerequisite-free starting study, while complete current coverage receives the least-recently-practiced review.
- **Failure boundary:** The client reads every current exercise history as one overview operation. If any repository read fails, the whole overview becomes unavailable rather than mixing partial facts with apparently authoritative totals.
- **Dependencies:** ADR-049 governs local attempt persistence, ADR-052 governs progressive server rendering, and ADR-056 governs recommendation evidence and copy. No new architecture decision or attempt-schema revision is introduced.

### Accessibility and Progressive Enhancement

- The server response names the local-practice region and explains that JavaScript is required to read browser-saved completions.
- The complete library, default action, exercise titles, instructions, and links remain usable with JavaScript disabled, while loading, ready, and unavailable overview states are enhancements.
- The overview status uses calm polite semantics. Saved-study counts, hand counts, today's completion count, the most recent study, and the recommendation are available as text and never depend on colour alone.
- A completed folio card exposes the text `Completion saved`. Cards without matching evidence receive no negative label and remain equally selectable.
- Loading and unavailable states do not expose placeholder zeroes as learner facts, show a fabricated recommendation, or mark any card complete.

### Anti-Patterns

- Do not call saved completion coverage progress toward mastery, readiness, technique, hand correctness, staff reading, rhythm quality, consistency, or repertoire ability.
- Do not add percentages, progress bars, streaks, ranks, scores, goals, penalties, or completion-based locks.
- Do not count old exercise revisions, unknown IDs, malformed timestamps, failed reads, or transient unsaved completions as retained evidence.
- Do not infer that zero retained matching records means a study was never practiced; history may have been cleared, evicted, revised, or unavailable.
- Do not make the home library dependent on local storage, client JavaScript, or a valid recommendation graph.

## Contract

### Definition of Done

- [ ] `/` server-renders the complete twenty-four-study library and a useful no-JavaScript overview fallback.
- [ ] Readable history renders saved current-study coverage, unique right- and left-hand coverage, today's retained completion count, and the newest matching study when present.
- [ ] Every card whose canonical ID and revision has retained completion evidence displays `Completion saved`; no other card receives a completion or negative-state claim.
- [ ] One deterministic advisory next-study or review action uses the existing current-revision recommendation contract and leaves every library card available.
- [ ] Any history-read failure renders a neutral unavailable message, hides partial facts and recommendation, clears completion badges, and preserves the library.
- [ ] The spec and learner-facing documentation are updated in the same change set.
- [ ] Unit, Worker/view, and browser tests cover the critical states.

### Regression Guardrails

- Study coverage is unique by canonical exercise identity, but today's count includes every retained matching completion.
- The current local calendar day, not UTC date text, defines today's completions.
- A most-recent tie is deterministic and independent of repository iteration order.
- Home recommendation must use the same canonical library, prerequisites, exact-revision evidence, reasons, and practice URLs as completion-page recommendation.
- Storage failure must not render zero coverage, remove a study, redirect a learner, or redefine musical completion.
- The server-rendered page must contain no executable inline browser code.

### Verification

- **Summary tests:** Cover empty history, repeated attempts, unique study/hand coverage, local-day boundaries, newest selection, equal timestamps, unknown IDs, old revisions, invalid dates, and recommendation projection.
- **Repository tests:** Prove one exact-revision read per current exercise and whole-overview rejection when any read fails.
- **View tests:** Cover loading, empty ready, populated ready, review, stale-state reset, and unavailable rendering, including card badges and practice links.
- **Server tests:** Prove the named no-JavaScript state, hidden enhancement regions, canonical card identities and revisions, hidden badges, and same-origin module script.
- **Browser tests:** Prove empty and populated local storage, advisory navigation, exact-revision badge behavior, unavailable storage fallback, and library usability without JavaScript.
- **Coverage target:** All pure summary branches and DOM state transitions remain covered; the browser entry dispatch remains exercised end to end.

### Scenarios

**Scenario: Open the library with no saved current completions**

- Given: browser history is readable and contributes no attempt matching a current exercise revision
- When: the home enhancement loads
- Then: it reports zero of twenty-four saved current studies, hides the most-recent row, shows no completion badges, and suggests the first prerequisite-free study without implying a reset or failure

**Scenario: Summarize repeated practice honestly**

- Given: one current right-hand study has two retained matching completions today and one current left-hand study has one older retained matching completion
- When: the overview summarizes history
- Then: saved-study coverage is two, right-hand coverage is one, left-hand coverage is one, today's count is two, and the newest matching attempt supplies the most-recent row

**Scenario: Ignore stale evidence**

- Given: retained records include an unknown exercise ID and an old revision of a current exercise
- When: the overview loads current coverage and recommendation evidence
- Then: neither record contributes to a count, badge, recent row, prerequisite, or review decision

**Scenario: Review after complete current coverage**

- Given: every current exercise revision has at least one retained completion
- When: the home recommendation runs
- Then: it suggests the least recently completed current study as an advisory review and keeps every other study selectable

**Scenario: One history read fails**

- Given: at least one current exercise history query rejects
- When: the overview enhancement loads
- Then: it says `Local practice record unavailable. The exercise library still works.`, hides all overview facts and recommendation, clears every badge, and leaves the complete library usable

**Scenario: Use the server-rendered library without JavaScript**

- Given: client JavaScript is disabled or unavailable
- When: the learner opens `/`
- Then: the page explains that JavaScript is needed to read saved browser completions while every exercise link, title, instruction, and default practice action remains available
