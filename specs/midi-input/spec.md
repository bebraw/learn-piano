# Feature: MIDI Input

## Blueprint

### Context

The practice experience needs reliable note input from a Roland GO:PIANO 61 without coupling musical behavior to one browser API. Desktop browsers may provide Web MIDI, ordinary iPad Safari may not, and automated tests must work without physical hardware. A platform-neutral input boundary keeps practice and evaluation code independent of those platform differences.

### Current First-Slice Scope

- A `MidiInputPort` boundary exposes input availability, device selection, connection state, normalized note events, and cleanup.
- `WebMidiInputPort` adapts supported desktop Web MIDI implementations.
- `MockMidiInputPort` replays deterministic fixtures and makes the whole practice flow usable without a keyboard.
- The selected device and its current state are visible to the learner.
- Only channel note-on and note-off messages affect the exercise. Other MIDI messages are ignored safely.
- System-exclusive access, output devices, pedals, aftertouch, pitch bend, timing evaluation, and multi-device aggregation are outside this slice.

### Future Scope

- `NativeMidiInputPort` may adapt a thin iPad WKWebView or Capacitor wrapper backed by Swift and CoreMIDI.
- Computer-keyboard or on-screen development input may implement the same boundary.
- Pedal and other controller events may be added as new normalized event variants only when an exercise contract needs them.
- Native-wrapper adoption requires its proposed architecture decision to be accepted and implemented; the browser application must remain independently usable.

### Architecture

- **Entry points:** The practice controller depends on `MidiInputPort`; platform bootstrap code chooses the Web MIDI or mock adapter. Domain evaluation never calls `navigator.requestMIDIAccess()` directly.
- **Port lifecycle:** A port reports capability, enumerates inputs when authorized, explicitly opens one selected input before reporting it connected, emits connection changes and normalized events, and releases its platform listeners and best-effort closes owned inputs when switched, disconnected, or disposed. The latest selection or lifecycle action wins when asynchronous platform work settles out of order.
- **Connection states:** The observable model distinguishes unsupported, idle, requesting permission, connected, disconnected, and error states. A permission denial or missing API is not presented as a device disconnection.
- **Normalized note event:** Each event is a discriminated `note-on` or `note-off` value containing a one-based MIDI channel from 1 through 16, a MIDI note number from 0 through 127, a velocity from 0 through 127, and a finite monotonic timestamp in milliseconds.
- **Timestamp contract:** Timestamps measure ordering and elapsed time within a runtime, not wall-clock time. Each adapter emits a non-decreasing event sequence from one monotonic clock domain. Mock taps without an explicit timestamp use an injectable runtime monotonic clock and advance strictly past the last emitted event; fixtures retain explicit deterministic timestamps.
- **Raw-message normalization:** Status `0x9n` with non-zero velocity becomes note-on, status `0x8n` becomes note-off, and status `0x9n` with zero velocity becomes note-off with velocity zero. The wire channel nibble `0..15` is exposed as channel `1..16`.
- **Device identity:** Device options expose a stable adapter-provided identifier and a human-readable label. Musical code treats the identifier as opaque.
- **Dependencies:** The Web adapter alone depends on Web MIDI. The mock adapter depends only on replayable fixture data. Practice sessions and performance evaluation consume normalized events, never raw `MIDIMessageEvent` objects.

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

### Anti-Patterns

- Do not expose browser-native MIDI event objects outside the adapter.
- Do not branch evaluator or exercise logic on Web MIDI, CoreMIDI, or mock-specific details.
- Do not request system-exclusive MIDI access for this feature.
- Do not turn note-on velocity zero into a zero-velocity note-on.
- Do not use wall-clock time as the normalized performance timestamp.
- Do not register anonymous listeners that cannot be removed, or reconnect by stacking another listener on the same device.
- Do not silently choose a different hardware device after the selected device disconnects.
- Do not treat Web MIDI availability as proof that the learner granted permission or that a device is connected.

## Contract

### Definition of Done

- [ ] The practice domain consumes input only through `MidiInputPort`.
- [ ] Web MIDI and deterministic mock adapters satisfy the same observable lifecycle and event contract.
- [ ] A learner can inspect available inputs, choose one, and distinguish connection, disconnection, unsupported, and error states.
- [ ] Note-on, note-off, and note-on with velocity zero normalize according to this spec.
- [ ] Unsupported and malformed messages are ignored without crashing the input stream.
- [ ] Device switching, disconnection, reconnection, and disposal clean up listeners.
- [ ] Replayable fixtures use deterministic monotonic timestamps.
- [ ] The spec is updated in the same change set when the boundary or normalized event model changes.
- [ ] Unit and browser tests cover the critical lifecycle and normalization behavior.

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

### Verification

- **Unit tests:** Table-driven raw-message normalization tests for note-on, note-off, velocity-zero note-off, all channel boundaries, malformed input, unknown statuses, and deterministic timestamps.
- **Lifecycle tests:** Port contract tests for device selection, explicit opening and closing, out-of-order asynchronous completion, disconnect, reconnect, repeated connect, input replacement, nullable browser payloads, late events, and listener disposal.
- **Browser tests:** Playwright drives the practice page through `MockMidiInputPort`; a physical keyboard is not required by CI.
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
