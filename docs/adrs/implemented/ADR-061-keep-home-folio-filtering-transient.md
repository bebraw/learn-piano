# ADR-061: Keep Home Folio Filtering Transient and Inclusive

**Status:** Implemented

**Date:** 2026-08-01

## Context

The canonical library now contains twenty-six studies across both hands and several parallel curriculum tracks. The complete home folio remains freely selectable, but scanning every card makes it harder to choose a relevant study. Canonical exercises already carry hand and multi-track curriculum metadata, so a discovery aid can reuse established facts without introducing learner-profile or progression data.

Filtering has architectural choices that affect later work. It could be server-driven through URLs, persisted as a browser preference, derived from one displayed category, or kept as page-local progressive enhancement. URL or storage state would make the filter a durable input with navigation and migration contracts. A single-category projection would contradict the curriculum rule that one study may belong to several parallel tracks. Server-only filtering would also weaken the complete no-JavaScript folio baseline established by ADR-052.

## Decision

Keep home-folio filtering as transient typed client enhancement over canonical exercise metadata:

- Server-render every canonical study link in canonical library order. Render the filter controls hidden until enhancement initializes, so the no-JavaScript document exposes the complete folio rather than non-functional controls.
- Project focus membership from every canonical curriculum-tag prefix matching Notes & reading, Rhythm & coordination, or Patterns & technique. A multi-track study appears under every matching focus; focus is not an exclusive category.
- Project hand membership from canonical event hands. Right- or left-hand studies match their declared hand, while a both-hands study matches both participating-hand filters, consistent with overview hand summaries.
- Compose focus and hand as an intersection, hide only unmatched home list items, and preserve the relative order and DOM identity of visible cards.
- Initialize All/All on every page load and provide an explicit reset. Do not store filter state, put it in the URL, or treat it as a learner goal.
- Keep filtering independent from local-history reads, completion badges, overview totals, recommendation eligibility and order, practice-page selection, evaluation, and attempt persistence.
- Omit Repertoire Pathways from the current control until lawful launchable exercises can match it. Unknown future tracks remain visible under All.

This decision extends ADR-052's lightweight progressive-enhancement boundary and leaves ADR-056's recommendation inputs unchanged.

## Trigger

The library has become broad enough that learner-controlled discovery needs more structure, while existing canonical hand and curriculum metadata can support that structure without adding product state.

## Consequences

**Positive:**

- Learners can narrow a large folio without losing the unrestricted starting view.
- Multi-track curriculum meaning remains honest and inclusive.
- The full server document, practice URLs, recommendations, and local evidence stay stable.
- No dependency, storage migration, exercise revision, or framework is required.

**Negative:**

- A filter selection cannot be bookmarked, shared, or restored after navigation.
- Adding a new launchable curriculum track requires an explicit control and copy update.
- The server and client share a small rendered metadata contract for hand and focus membership.

**Neutral:**

- Filtering changes presentation only; it creates no evidence that a learner chose, attempted, or completed a curriculum focus.
- Current cards may match several focus options, so filtered counts are intentionally non-additive across focuses.
- The practice-page chooser remains unfiltered in this slice.

## Alternatives Considered

### Use Only The First Displayed Curriculum Tag

This would be simple, but it would assign each study one misleading exclusive category and hide valid multi-track membership already represented in canonical metadata.

### Persist The Last Filter Or Put It In The URL

Durable state could restore or share a view, but it would add preference, navigation, parsing, and compatibility contracts before the learner has asked for saved goals. The neutral complete folio is safer on every load.

### Filter On The Server

Query-driven server filtering could produce smaller responses, but the current library is compact and must stay completely usable without JavaScript or stateful navigation. Client enhancement can hide existing cards without duplicating the canonical route.

### Keep The Unfiltered Grid Only

This preserves the fewest concepts, but twenty-six similar cards already make deliberate browsing costly. The existing metadata provides a bounded improvement without introducing planning or progression behavior.
