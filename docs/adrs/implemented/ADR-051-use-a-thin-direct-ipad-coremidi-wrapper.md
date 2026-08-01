# ADR-051: Use a Thin Direct iPad CoreMIDI Wrapper

**Status:** Implemented

**Date:** 2026-08-01

## Context

The learner intends to use an iPad with a Bluetooth or USB MIDI keyboard. Ordinary iPad Safari cannot be assumed to provide sufficiently reliable direct MIDI access for the intended experience. At the same time, the browser application must remain independently usable and must not fork its evaluator, exercises, persistence rules, or practice UI for each platform.

The wrapper needs only a small amount of native behavior: host the existing HTTPS application, discover and select MIDI sources, present Apple's Bluetooth MIDI pairing UI, and translate CoreMIDI packets into the normalized web-domain contract. No third-party native plugin or broader hybrid-application framework is required for that boundary.

## Decision

Implement a thin iPadOS 17-or-later shell directly with Swift, WKWebView, CoreMIDI, and CoreAudioKit. Choose the direct WKWebView shell over Capacitor because the required bridge and platform UI can be implemented with Apple frameworks alone; adding a plugin runtime and dependency graph would not improve the current boundary.

The shell loads a configurable HTTPS application URL. Main-frame navigation and native bridge messages are restricted to that configured origin. The Swift and TypeScript sides both validate bridge commands, replies, pushed state, and normalized note-event payloads before acting on them.

CoreMIDI owns discovery and the exact one-source lifecycle for USB and Bluetooth MIDI sources. CoreAudioKit supplies the system Bluetooth MIDI pairing interface. The bridge exposes source listing, explicit selection, disconnect, Bluetooth pairing, connection-state updates, and normalized note events to `NativeMidiInputPort`. Switching, disconnecting, or disposing removes the previous source before another can deliver events.

The existing web domain remains authoritative. Exercise data, evaluation, practice-session transitions, feedback, and persistence are not reimplemented in Swift. Native completions flow through the same session controller and are recorded with the `native-midi` adapter kind. The browser application continues to run as a standalone application through mock input and Web MIDI where supported.

Signing, choosing a deployed application URL, installing on a physical iPad, and validating real USB and Bluetooth devices remain explicit operator steps rather than repository automation.

## Trigger

The product now requires dependable iPad MIDI input while preserving the browser application and its tested domain behavior as the shared implementation.

## Consequences

**Positive:**

- CoreMIDI provides the iPad device boundary while the practice domain and browser experience stay shared.
- The direct shell uses only Apple frameworks and adds no native plugin or package dependency.
- Origin checks, payload validation, and exact listener ownership make the web-to-native boundary explicit and testable.
- USB discovery and the system Bluetooth pairing interface are available behind the same `MidiInputPort` contract.

**Negative:**

- Building and running the wrapper requires macOS, Xcode, signing configuration, and an iPadOS 17-or-later target.
- A web-to-native message bridge remains a security and lifecycle boundary that must be maintained on both sides.
- Real-device USB and Bluetooth behavior cannot be established by simulator or browser CI alone.

**Neutral:**

- The wrapper hosts a configured deployed HTTPS application rather than packaging a second copy of the practice domain.
- App Store distribution, provisioning policy, and release automation remain outside this decision.

## Alternatives Considered

### Depend On iPad Safari Web MIDI

This avoids native packaging, but it does not provide a reliable enough foundation for the required direct MIDI experience.

### Use Capacitor

Capacitor would provide a hybrid runtime and plugin model, but this wrapper needs only WKWebView, a narrow message bridge, and Apple MIDI frameworks. It would add dependencies and another lifecycle layer without removing the custom CoreMIDI boundary.

### Build A Fully Native iPad Application

This offers maximum platform control, but it duplicates the existing web UI and domain behavior and expands the maintenance surface far beyond MIDI integration.

### Run MIDI Through A Remote Companion Service

A separate desktop or network bridge would add pairing, connectivity, latency, and operational complexity to personal practice. It would also weaken offline use.
