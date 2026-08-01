# ADR-051: Add a Thin iPad CoreMIDI Wrapper Later

**Status:** Proposed

**Date:** 2026-08-01

## Context

The learner intends to use an iPad with a Bluetooth or USB MIDI keyboard. Ordinary iPad Safari cannot be assumed to provide sufficiently reliable direct MIDI access for the intended experience. At the same time, the browser application should remain independently usable and should not fork its evaluator, exercises, persistence rules, or practice UI for each platform.

The first slice can validate the web domain and desktop Web MIDI path without committing to native packaging or an App Store delivery workflow.

## Decision

When reliable iPad MIDI becomes an implementation priority, add a thin native iPad wrapper around the existing web application. The wrapper will host the web UI in a WKWebView-based container and expose a small Swift/CoreMIDI bridge through `NativeMidiInputPort`.

The bridge will own CoreMIDI discovery, connection lifecycle, and translation into the platform-neutral normalized event and connection-state contract. Exercise evaluation, canonical exercise data, feedback policy, and practice workflows remain in the shared web domain. Native-only UI and duplicated evaluator logic are outside the wrapper's role.

The choice between a minimal direct WKWebView shell and a Capacitor-based container is intentionally deferred until implementation, packaging, and plugin requirements are known. Selecting that delivery mechanism may require a follow-up ADR, but it must preserve this thin-wrapper boundary.

No native project, bridge, or packaging dependency is introduced in the first implementation slice.

## Trigger

The product needs an explicit route to dependable iPad MIDI without making native application work a prerequisite for the first browser-based exercise.

## Consequences

**Positive:**

- CoreMIDI can provide reliable iPad device integration while the practice domain stays shared.
- The web application remains usable and testable without an iPad wrapper.
- Native scope is constrained to hosting, permissions, lifecycle, and MIDI translation.

**Negative:**

- Shipping on iPad will eventually require Swift/native expertise, signing, packaging, and device testing.
- A web-to-native message bridge introduces a security and lifecycle boundary that must be validated carefully.
- WKWebView and browser capability differences may still need narrowly scoped adapter behavior.

**Neutral:**

- This ADR does not choose an App Store distribution model.
- Direct WKWebView and Capacitor remain packaging alternatives under the same domain boundary.

## Alternatives Considered

### Depend On iPad Safari Web MIDI

This avoids native packaging, but it does not provide a reliable enough foundation for the required direct MIDI experience.

### Build A Fully Native iPad Application

This offers maximum platform control, but it duplicates the existing web UI and domain behavior and expands the maintenance surface far beyond MIDI integration.

### Run MIDI Through A Remote Companion Service

A separate desktop or network bridge would add pairing, connectivity, latency, and operational complexity to personal practice. It would also weaken offline use.
