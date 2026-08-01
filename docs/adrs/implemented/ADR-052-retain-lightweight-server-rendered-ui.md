# ADR-052: Retain a Lightweight Server-Rendered UI

**Status:** Implemented

**Date:** 2026-08-01

## Context

The repository already serves HTML from a Cloudflare Worker, uses shared view helpers and Tailwind for presentation, and rejects executable browser code embedded in rendered markup. The first practice slice needs device selection, live note highlighting, local persistence, and history updates, but those interactions do not require a client application framework or a single-page application architecture.

Replacing the existing shell would add a rendering model, dependency graph, hydration or routing conventions, and generated boilerplate before the product has component complexity that justifies them. The exercise instructions must also remain visible when JavaScript is unavailable.

## Decision

Retain the Cloudflare Worker and server-rendered HTML as the application shell. Practice routes render useful semantic page content on the server, including instructions and initial state that do not depend on client execution.

Use small typed client-side TypeScript modules for progressive enhancement such as MIDI connection, live highlighting, evaluation feedback, and local history. Keep executable client code out of rendered HTML, preserve the existing Tailwind pipeline, and keep musical domain logic independent from DOM components.

Do not introduce React, Vue, Svelte, an SPA router, or a hydration framework in the initial application. Reconsidering a framework requires evidence that repeated interactive component or state-coordination needs outweigh the template's lightweight baseline and requires a superseding ADR.

## Trigger

The piano practice page introduces the first substantial client interaction and makes the rendering boundary an explicit architectural choice.

## Consequences

**Positive:**

- The application preserves the repository's existing Worker, response, and styling conventions.
- Core instructions and navigation remain available without JavaScript.
- The client download and dependency surface stay small and easy to prune.
- Domain tests do not need a component framework or browser renderer.

**Negative:**

- The project must define modest DOM update and cleanup conventions itself.
- Highly interactive future notation or editing features may eventually expose limits in manual DOM modules.
- Server and client boundaries require care to avoid duplicating canonical data.

**Neutral:**

- Progressive enhancement still permits substantial local interaction after the page loads.
- This decision does not prohibit a future notation renderer or narrowly scoped custom element when separately justified.

## Alternatives Considered

### Adopt React, Vue, Or Svelte Now

These frameworks offer mature component and state ecosystems, but the first slice does not need enough UI composition to justify replacing the established rendering model and adding framework-specific tooling.

### Convert The Application To A Client-Rendered SPA

An SPA would centralize browser state, but it weakens the no-JavaScript baseline and duplicates routing and document-shell responsibilities already handled by the Worker.

### Keep The Page Entirely Server-Driven

Full request-response interaction cannot provide responsive MIDI feedback or local browser-only device access. Typed progressive enhancement is required even though the document shell remains server-rendered.
