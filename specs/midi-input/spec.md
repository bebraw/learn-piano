# Feature: MIDI Input

## Blueprint

### Context

The practice experience needs reliable note input from a Roland GO:PIANO 61 without coupling musical behavior to one browser API. Desktop browsers may provide Web MIDI, ordinary iPad Safari may not, and automated tests must work without physical hardware. A platform-neutral input boundary keeps practice and evaluation code independent of those platform differences while a thin native shell supplies dependable iPad input.

### Current First-Slice Scope

- A `MidiInputPort` boundary exposes input availability, device selection, connection state, normalized note events, and cleanup.
- `WebMidiInputPort` adapts supported desktop Web MIDI implementations.
- `NativeMidiInputPort` adapts the validated WKWebView bridge supplied by the iPadOS 17-or-later shell.
- `MockMidiInputPort` replays deterministic fixtures and makes the whole practice flow usable without a keyboard.
- The native shell discovers USB and Bluetooth sources through CoreMIDI, exposes exactly one selected source at a time, and opens Apple's CoreAudioKit Bluetooth MIDI pairing interface on request.
- The selected device and its current state are visible to the learner.
- Only channel note-on and note-off messages affect the exercise. Other MIDI messages are ignored safely.
- System-exclusive access, output devices, pedals, aftertouch, pitch bend, timing evaluation, and multi-device aggregation are outside this slice.

### Future Scope

- Computer-keyboard or on-screen development input may implement the same boundary.
- Pedal and other controller events may be added as new normalized event variants only when an exercise contract needs them.
- Native packaging distribution, signing automation, and broader platform UI remain separate from the MIDI adapter boundary.

### Architecture

- **Entry points:** The practice controller depends on `MidiInputPort`; platform bootstrap code chooses the native, Web MIDI, or mock adapter. Domain evaluation never calls `navigator.requestMIDIAccess()` or a WKWebView handler directly.
- **Port lifecycle:** A port reports capability, enumerates inputs when authorized, explicitly opens one selected input before reporting it connected, emits connection changes and normalized events, and releases its platform listeners and best-effort closes owned inputs when switched, disconnected, or disposed. The latest selection or lifecycle action wins when asynchronous platform work settles out of order.
- **Native bridge:** On the configured application origin, `NativeMidiInputPort` sends validated list, select, disconnect, and Bluetooth-pairing commands through the `learnPianoMidi` WKWebView reply handler. Native state and note updates return through the `learn-piano-native-midi` custom event. Both Swift and TypeScript reject unknown message kinds, invalid states, malformed device options, invalid identifiers, and out-of-range note data.
- **Native source ownership:** CoreMIDI connects at most one selected source to the owned input port. Selecting another source first disconnects the old source; disconnect and disposal remove the active connection before publishing state. Late packets from a replaced source cannot reach the session.
- **Native hosting boundary:** The iPad shell accepts an HTTPS application URL and restricts main-frame navigation and bridge handling to its configured origin. Plain HTTP is allowed only for validated local-development hosts. The bridge is not exposed to a redirected, embedded, or otherwise untrusted document.
- **Bluetooth pairing:** Bluetooth discovery and pairing use the system CoreAudioKit interface. Pairing does not silently select a source; the learner still explicitly chooses one of the CoreMIDI sources returned after the system UI closes.
- **Connection states:** The observable model distinguishes unsupported, idle, requesting permission, connected, disconnected, and error states. A permission denial or missing API is not presented as a device disconnection.
- **Normalized note event:** Each event is a discriminated `note-on` or `note-off` value containing a one-based MIDI channel from 1 through 16, a MIDI note number from 0 through 127, a velocity from 0 through 127, and a finite monotonic timestamp in milliseconds.
- **Timestamp contract:** Timestamps measure ordering and elapsed time within a runtime, not wall-clock time. Each adapter emits a non-decreasing event sequence from one monotonic clock domain. Mock taps without an explicit timestamp use an injectable runtime monotonic clock and advance strictly past the last emitted event; fixtures retain explicit deterministic timestamps.
- **Raw-message normalization:** Status `0x9n` with non-zero velocity becomes note-on, status `0x8n` becomes note-off, and status `0x9n` with zero velocity becomes note-off with velocity zero. The wire channel nibble `0..15` is exposed as channel `1..16`.
- **Device identity:** Device options expose a stable adapter-provided identifier and a human-readable label. Musical code treats the identifier as opaque.
- **Dependencies:** The Web adapter alone depends on Web MIDI. The native adapter alone depends on the validated WKWebView bridge, while the Swift shell owns WKWebView, CoreMIDI, and CoreAudioKit. The mock adapter depends only on replayable fixture data. Practice sessions and performance evaluation consume normalized events, never raw browser messages, bridge payloads, or CoreMIDI packets.

### Edge Cases

- An unsupported or malformed message produces no normalized event and does not stop later valid messages.
- A truncated note message, out-of-range data byte, or non-finite timestamp is rejected at the boundary instead of leaking a partial event.
- A browser event with a nullable MIDI payload or port is ignored safely.
- Selecting a different input detaches and best-effort closes the previous input before opening and attaching the new one. An open failure is reported as a recoverable error.
- A permission request or input selection that finishes after a newer selection, disconnect, or disposal must not attach listeners or restore a stale connection.
- Disconnecting the active device updates connection state immediately and removes its event listener. It does not synthesize note-off events or claim that an in-progress exercise completed.
- Reconnecting or selecting the same input repeatedly remains idempotent: one physical message results in one normalized event.
- Late events from an input that has been replaced, disconnected, or disposed are ignored.
- An empty device list is a valid state. The mock adapter remains available for the first-slice browser flow.
- A permission rejection is recoverable through another explicit connection attempt and must not cause an unhandled rejection.
- An absent or malformed native reply is reported as a recoverable error and cannot fabricate a device, connection, or note event.
- A bridge command from a document outside the configured application origin is rejected without calling CoreMIDI or opening native UI.
- A main-frame navigation outside the configured origin is cancelled; redirects do not silently broaden the trusted origin.
- Closing Bluetooth pairing with no connected device leaves the previous explicit selection state intact and permits another pairing attempt.
- Native source add/remove notifications refresh availability without silently selecting a replacement for a disconnected source.

### Anti-Patterns

- Do not expose browser-native MIDI event objects outside the adapter.
- Do not branch evaluator or exercise logic on Web MIDI, CoreMIDI, or mock-specific details.
- Do not request system-exclusive MIDI access for this feature.
- Do not turn note-on velocity zero into a zero-velocity note-on.
- Do not use wall-clock time as the normalized performance timestamp.
- Do not register anonymous listeners that cannot be removed, or reconnect by stacking another listener on the same device.
- Do not silently choose a different hardware device after the selected device disconnects.
- Do not treat Web MIDI availability as proof that the learner granted permission or that a device is connected.
- Do not expose the native bridge to arbitrary web origins or allow unrestricted main-frame navigation.
- Do not trust bridge data merely because it came from Swift or TypeScript; validate at both sides of the boundary.
- Do not connect several CoreMIDI sources to one logical `MidiInputPort` or silently aggregate their events.
- Do not reproduce evaluation, exercise, feedback, session, or persistence logic in Swift.
- Do not require the native wrapper for the standalone browser application.

## Contract

### Definition of Done

- [ ] The practice domain consumes input only through `MidiInputPort`.
- [ ] Web MIDI, native MIDI, and deterministic mock adapters satisfy the same observable lifecycle and event contract.
- [ ] A learner can inspect available inputs, choose one, and distinguish connection, disconnection, unsupported, and error states.
- [ ] Note-on, note-off, and note-on with velocity zero normalize according to this spec.
- [ ] Unsupported and malformed messages are ignored without crashing the input stream.
- [ ] Device switching, disconnection, reconnection, and disposal clean up listeners.
- [ ] Replayable fixtures use deterministic monotonic timestamps.
- [ ] The spec is updated in the same change set when the boundary or normalized event model changes.
- [ ] Unit and browser tests cover the critical lifecycle and normalization behavior.
- [ ] The native shell targets iPadOS 17 or later, loads only a configured HTTPS application origin, and restricts navigation and bridge handling to that origin.
- [ ] CoreMIDI exposes USB and paired Bluetooth sources with one explicit active selection, while CoreAudioKit provides Bluetooth pairing UI.
- [ ] Swift and TypeScript reject malformed bridge commands, replies, state, inputs, and note events.

### Regression Guardrails

- Domain modules must remain free of direct Web MIDI types and browser capability checks.
- The normalized channel, note, velocity, and timestamp ranges must remain explicit and validated.
- Note-on with velocity zero must continue to be indistinguishable from note-off to downstream evaluation.
- Unsupported MIDI messages must never advance an exercise or terminate event delivery.
- A disconnected or replaced device must stop delivering events.
- Stale asynchronous permission and selection results must never restore a connection after switch, disconnect, or disposal.
- Reconnection must never multiply event delivery.
- Mock fixtures must exercise the same normalized-event path used by hardware input.
- Native iPad input must remain an adapter behind `MidiInputPort`, not a second practice or evaluation implementation.
- The native bridge must remain unavailable to documents outside the configured application origin.
- CoreMIDI must have at most one connected selected source for the logical port.
- Native attempts must travel through the same controller and persistence path as Web MIDI and mock attempts.
- The browser application must continue to start and practice without native globals.

### Verification

- **Unit tests:** Table-driven raw-message normalization tests for note-on, note-off, velocity-zero note-off, all channel boundaries, malformed input, unknown statuses, and deterministic timestamps.
- **Lifecycle tests:** Port contract tests for device selection, explicit opening and closing, out-of-order asynchronous completion, disconnect, reconnect, repeated connect, input replacement, nullable browser payloads, late events, and listener disposal.
- **Bridge tests:** TypeScript tests cover valid replies and pushed events plus absent handlers, rejected commands, malformed payloads, invalid state transitions, stale operations, and disposal. Pure Swift tests cover command decoding, origin policy, raw-packet normalization, stale source-generation rejection, timestamp clamping, and invalid payload rejection; live CoreMIDI endpoint lifecycle remains part of physical-device verification.
- **Browser tests:** Playwright drives the practice page through `MockMidiInputPort`; a physical keyboard is not required by CI.
- **Operator verification:** Build with Xcode, sign for a physical iPadOS 17-or-later device, configure a deployed HTTPS application URL, and verify both USB and Bluetooth hardware. Simulator success is not evidence of CoreMIDI hardware behavior.
- **Coverage target:** Every normalization branch and every listener-ownership transition remains exercised.

### Scenarios

**Scenario: Normalize a played note**

- Given: the selected device sends channel 1 note-on for MIDI note 60 with velocity 72
- When: the adapter receives the raw message
- Then: it emits one normalized note-on containing channel 1, note 60, velocity 72, and the message's monotonic timestamp

**Scenario: Normalize velocity-zero note-on**

- Given: the selected device sends note-on for MIDI note 60 with velocity zero
- When: the adapter normalizes the message
- Then: it emits note-off rather than note-on

**Scenario: Ignore an unsupported message**

- Given: the selected device sends a controller or other unsupported MIDI message
- When: the adapter receives it
- Then: no normalized note event is emitted and a later valid note remains deliverable

**Scenario: Device disconnects during practice**

- Given: a session is in progress through a selected hardware input
- When: that device disconnects
- Then: the port reports disconnected, detaches its listener, and emits no fabricated musical event

**Scenario: Device reconnects**

- Given: a previously disconnected input becomes available again
- When: the learner reconnects it and plays one note
- Then: exactly one normalized event is delivered for that note

**Scenario: Browser has no Web MIDI**

- Given: the practice page runs in a browser without Web MIDI support
- When: input capability is initialized
- Then: hardware input is reported as unsupported without hiding the exercise, and the deterministic mock path remains usable

**Scenario: Port is disposed**

- Given: a connected port has active platform listeners
- When: the practice surface is torn down
- Then: all owned listeners are removed and subsequent platform callbacks deliver no normalized events

**Scenario: Select an iPad MIDI source**

- Given: the trusted application is running in the native wrapper and CoreMIDI lists two sources
- When: the learner selects the second source
- Then: any previous source is disconnected, exactly that source becomes active, and its validated packets reach the existing session as normalized events

**Scenario: Pair a Bluetooth keyboard**

- Given: the native wrapper is running on an iPad and no Bluetooth source is yet paired
- When: the learner opens Bluetooth MIDI pairing
- Then: the system CoreAudioKit interface is presented, and any newly available source can be selected explicitly after pairing

**Scenario: Reject an untrusted bridge caller**

- Given: the web view is asked to navigate or send a bridge command from outside the configured application origin
- When: the shell evaluates that request
- Then: it cancels the navigation or rejects the command without changing CoreMIDI state

**Scenario: Reject a malformed native event**

- Given: a native custom event has an unknown kind or an out-of-range channel, note, velocity, or timestamp
- When: `NativeMidiInputPort` validates it
- Then: no normalized event is emitted, the adapter remains usable, and a later valid event is still deliverable
