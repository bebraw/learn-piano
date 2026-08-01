# Feature: Exercise Folio Filter

## Blueprint

### Context

The home folio contains thirty freely selectable studies. That breadth supports both hands, two keyboard positions, several curriculum tracks, and untimed or pulse-guided practice, but scanning every card makes it harder to choose a relevant study. The learner needs a calm way to narrow the existing folio without turning parallel curriculum tags into exclusive categories or any filter choice into a saved preference or progression gate.

### Architecture

- **Server-first library:** `/` server-renders every canonical exercise link in canonical order. The filter controls are enhancement-only and hidden until the typed browser module initializes.
- **Focus projection:** A study matches Notes & reading, Rhythm & coordination, or Patterns & technique when any canonical `curriculumTags` entry uses that track prefix. All matching prefixes are retained, so one study may appear under several focuses.
- **Hand projection:** Right and Left match the canonical event-hand projection already shown on each card. A future both-hands study matches both participating-hand filters, consistent with the local overview's hand summaries.
- **Timing projection:** `untimed-ordered-notes` maps to `Untimed`; `timed-ordered-notes` maps to the learner-facing `Pulse-guided` option because every current timed study offers count-in and pulse guidance. This projection reads canonical evaluation mode rather than card copy.
- **Filter state:** Focus, hand, and timing compose as an intersection. All/All/All is the default on every page load, and Reset filters restores that state.
- **Presentation boundary:** Filtering hides unmatched home-folio list items only. It does not reorder cards, edit canonical metadata, change practice URLs, affect the practice-page chooser, or alter completion badges.
- **Curriculum boundary:** Focus is a browsing aid over the current three launchable track prefixes. It does not expose Repertoire Pathways before lawful launchable exercises carry that metadata, and it does not make tracks mutually exclusive.
- **Evidence boundary:** Filter state is not persisted and never enters attempts, local history, the practice overview, recommendation eligibility, review selection, evaluation, or mastery claims.
- **Dependencies:** ADR-061 records this transient, inclusive projection and extends the progressive-rendering boundary of ADR-052 without changing ADR-056 recommendation policy. The slice introduces no dependency, storage key, schema revision, or exercise revision.

### Accessibility and Progressive Enhancement

- Focus, Hand, and Timing are separate labelled radio groups with native keyboard behavior and visible focus treatment.
- A polite status reports `Showing N of 30 studies`; Reset filters remains explicit and is disabled at All/All/All.
- Hidden cards are removed from layout and interaction by the native `hidden` state. The canonical order of visible cards remains unchanged.
- Without JavaScript, the controls stay hidden and all thirty links, titles, instructions, and completion-independent content remain usable.
- Local-history loading or failure does not disable the filter. Filtering does not remove or recreate completion badges when cards are hidden and shown.

### Anti-Patterns

- Do not call Focus a mutually exclusive category or derive it only from a card's first displayed curriculum tag.
- Do not infer timing membership from learner-facing prose, tempo labels, beat offsets, or rendered card position; use canonical evaluation mode.
- Do not describe `Pulse-guided` as proof that a learner followed the count-in, click, downbeat, or meter.
- Do not persist filter choices, add them to URLs, or use them as implicit learner goals.
- Do not hide studies by default, lock unmatched studies, penalize resets, or change recommendation order.
- Do not make the complete server-rendered library depend on JavaScript, local storage, or overview success.
- Do not add a Repertoire filter until lawful current exercises can actually match it.

## Contract

### Definition of Done

- [ ] `/` retains all thirty canonical links in server HTML and renders hidden enhancement controls for three curriculum focuses, right- and left-hand narrowing, and untimed or pulse-guided timing.
- [ ] Enhancement opens at All/All/All, reports the complete count, and resets restored browser form state to that neutral default.
- [ ] Every focus match considers all canonical curriculum-tag prefixes, allowing multi-track studies to appear under every relevant focus.
- [ ] Right and Left include canonical studies assigned to that hand plus future both-hands studies in which that hand participates.
- [ ] Untimed and Pulse-guided match canonical evaluation modes and never reinterpret timing evidence or exercise availability.
- [ ] Focus, hand, and timing filters compose without changing canonical order, card content, completion markers, recommendations, or practice routes.
- [ ] Reset filters restores every study and becomes disabled again.
- [ ] JavaScript-disabled and storage-unavailable paths retain the complete usable folio.
- [ ] Unit, server-render, and browser tests cover projection, composition, reset, reload, badge preservation, and no-JavaScript fallback.

### Regression Guardrails

- All/All/All must remain the initial state after navigation or reload, regardless of browser-restored radio values.
- Multi-track membership must be inclusive and deterministic in the display order Notes & reading, Rhythm & coordination, Patterns & technique.
- A selected focus plus hand plus timing means every active condition, not any one condition.
- A both-hands study must match both participating-hand filters so folio discovery and overview hand summaries share one membership meaning.
- Filtering must not mutate the DOM identity used by local completion badges or recommendation links.
- Unknown future curriculum prefixes must remain available under All rather than making a study inaccessible.
- No filter interaction may write local storage or change exercise, attempt, overview, or recommendation contracts.

### Verification

- **Projection tests:** Cover multi-prefix projection, duplicate-prefix collapse, unknown metadata, filter composition, and inclusive both-hands behavior.
- **Client tests:** Cover neutral initialization, stale form-state reset, focus/hand/timing composition, count copy, unknown-control fallback, and explicit reset.
- **Server tests:** Prove all canonical cards and focus, hand, and timing metadata remain in HTML while controls begin hidden.
- **Browser tests:** Prove focus, hand, and timing counts, three-way composition, reset, reload default, badge preservation, storage-failure independence, responsive containment, and the complete no-JavaScript fallback.
- **Manual check:** Inspect the refreshed home screenshot at desktop width and confirm the filter reads as a supporting folio tool rather than the page's primary action.

### Scenarios

**Scenario: Narrow by a multi-track focus**

- Given: one study carries both Notes & reading and Patterns & technique tags
- When: the learner selects either matching focus
- Then: the study remains visible in canonical order without being assigned one exclusive category

**Scenario: Compose focus, hand, and timing**

- Given: the folio contains right- and left-hand Rhythm & coordination studies
- When: the learner selects Rhythm & coordination, Right, and Pulse-guided
- Then: only right-hand pulse-guided rhythm studies remain visible and the status reports the matching count

**Scenario: Separate pitch-order and pulse-guided work**

- Given: the canonical folio contains untimed and timed evaluation modes
- When: the learner selects Untimed or Pulse-guided
- Then: only the matching canonical studies remain visible without changing their evidence, availability, or order

**Scenario: Restore the neutral folio**

- Given: one or more filters are active
- When: the learner selects Reset filters or reloads the page
- Then: All/All/All is selected, all thirty studies are visible, and no preference has been stored

**Scenario: Browse without enhancement**

- Given: JavaScript is disabled or browser storage is unavailable
- When: the learner opens `/`
- Then: every canonical study remains visible and selectable; JavaScript-disabled pages hide the non-functional controls, while storage failure affects only the local overview
