# ADR-048: Use a Platform-Neutral MIDI Input Boundary

**Status:** Implemented

**Date:** 2026-08-01

## Context

The first practice experience needs MIDI input in desktop browsers, deterministic input in automated tests, and a path to native CoreMIDI on iPad. Web MIDI is useful where available, but its browser APIs, permission flow, and device objects are not a stable cross-platform domain contract. Ordinary iPad Safari also cannot be assumed to expose the required MIDI integration.

If exercise evaluation or practice UI code depends directly on Web MIDI, adding a native bridge later would duplicate domain behavior and make browser tests depend on physical hardware or browser-specific objects.

## Decision

The practice domain will consume MIDI through a platform-neutral `MidiInputPort` boundary.

Adapters own platform-specific discovery, selection, permission, explicit input opening, best-effort closing, disconnection, and listener cleanup. They enforce latest-intent semantics so asynchronous permission or selection work cannot restore a stale connection after a switch, disconnect, or disposal. They emit the same explicit normalized note-on and note-off event types, including MIDI channel, note number, velocity, and a monotonic timestamp. Raw browser or native MIDI objects do not cross the boundary, and unsupported messages do not become domain events.

The initial implementations are `WebMidiInputPort` for supported browsers and `MockMidiInputPort` for development and tests. A future `NativeMidiInputPort` can translate a native bridge into the same contract. Reconnection must not create duplicate delivery, and the port must expose connection-state changes so interruption is observable outside an adapter.

## Trigger

The first MIDI-backed exercise must work with Web MIDI and deterministic fixtures while preserving a viable iPad architecture.

## Consequences

**Positive:**

- Exercise evaluation and UI orchestration remain independent of Web MIDI and CoreMIDI APIs.
- Automated browser flows can run without hardware, permissions, or nondeterministic device timing.
- Normalization, lifecycle cleanup, and reconnection behavior have one explicit adapter contract.
- A native iPad adapter can be added without forking the exercise domain.

**Negative:**

- The boundary and normalization layer add code beyond a direct `navigator.requestMIDIAccess()` integration.
- Platform capabilities that do not fit the shared event model need deliberate contract evolution.

**Neutral:**

- Web MIDI remains the initial real-device implementation where the browser supports it.
- Optional computer-keyboard or on-screen input can implement the same boundary later.

## Alternatives Considered

### Call Web MIDI Directly From The Practice Controller

This is smaller for one browser, but it couples domain behavior to browser permissions, raw messages, and device lifecycles. It also leaves no clean seam for deterministic tests or CoreMIDI.

### Normalize Events Inside Each Consumer

This keeps adapters thin but duplicates MIDI parsing and lifecycle assumptions across the evaluator and UI, increasing the chance of inconsistent handling for velocity-zero note-off, channels, and unsupported messages.

### Build The First Slice Around A Native Bridge

This would address iPad earlier, but it would make native packaging a prerequisite for a browser application and substantially expand the first slice.
