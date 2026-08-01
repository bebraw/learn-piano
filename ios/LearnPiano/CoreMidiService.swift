import CoreMIDI
import Darwin
import Foundation

enum CoreMidiServiceError: Error, Equatable, LocalizedError, Sendable {
    case disposed
    case clientCreationFailed(OSStatus)
    case inputPortCreationFailed(OSStatus)
    case sourceUnavailable(String)
    case connectionReferenceCreationFailed(String)
    case connectionFailed(inputId: String, status: OSStatus)

    var errorDescription: String? {
        switch self {
        case .disposed:
            "CoreMIDI service has been disposed."
        case let .clientCreationFailed(status):
            "CoreMIDI client creation failed (OSStatus \(status))."
        case let .inputPortCreationFailed(status):
            "CoreMIDI input port creation failed (OSStatus \(status))."
        case let .sourceUnavailable(inputId):
            "MIDI input \"\(inputId)\" is not available."
        case let .connectionReferenceCreationFailed(inputId):
            "MIDI input \"\(inputId)\" could not be prepared for connection."
        case let .connectionFailed(inputId, status):
            "MIDI input \"\(inputId)\" could not be connected (OSStatus \(status))."
        }
    }
}

struct CoreMidiServiceCallbacks: Sendable {
    let devicesChanged: @Sendable ([MidiBridgeDevice]) -> Void
    let stateChanged: @Sendable (MidiBridgeConnectionState) -> Void
    let eventReceived: @Sendable (MidiBridgeEvent) -> Void

    init(
        devicesChanged: @escaping @Sendable ([MidiBridgeDevice]) -> Void = { _ in },
        stateChanged: @escaping @Sendable (MidiBridgeConnectionState) -> Void = { _ in },
        eventReceived: @escaping @Sendable (MidiBridgeEvent) -> Void = { _ in }
    ) {
        self.devicesChanged = devicesChanged
        self.stateChanged = stateChanged
        self.eventReceived = eventReceived
    }
}

struct CoreMidiConnectionGate: Sendable {
    private(set) var activeToken: UInt?
    private var nextToken: UInt = 1

    mutating func reserveToken() -> UInt {
        let token = nextToken
        nextToken &+= 1
        if nextToken == 0 {
            nextToken = 1
        }
        return token
    }

    mutating func activate(_ token: UInt) {
        activeToken = token
    }

    mutating func disconnect() {
        activeToken = nil
    }

    func accepts(_ token: UInt?) -> Bool {
        token != nil && token == activeToken
    }
}

struct CoreMidiTimestampClamp: Sendable {
    private var lastTimestamp: Double?

    mutating func clamp(_ candidate: Double) -> Double {
        let timestamp = max(candidate, lastTimestamp ?? candidate)
        lastTimestamp = timestamp
        return timestamp
    }
}

func coreMidiTimestampMilliseconds(
    hostTimestamp: UInt64,
    fallbackMilliseconds: Double,
    hostTimeToMilliseconds: (UInt64) -> Double
) -> Double {
    guard hostTimestamp != 0 else {
        return fallbackMilliseconds
    }
    return hostTimeToMilliseconds(hostTimestamp)
}

private enum CoreMidiHostClock {
    private static let millisecondsPerTick: Double = {
        var timebase = mach_timebase_info_data_t()
        mach_timebase_info(&timebase)
        return Double(timebase.numer) / Double(timebase.denom) / 1_000_000
    }()

    static func milliseconds(for hostTimestamp: UInt64) -> Double {
        Double(hostTimestamp) * millisecondsPerTick
    }
}

// CoreMIDI handles and all mutable service state are isolated to stateQueue.
// The realtime callback copies value types before it enters that queue.
final class CoreMidiService: @unchecked Sendable {
    private static let maximumPublishedSources = 128
    private static let maximumDisplayNameLength = 256

    private struct Source: Equatable {
        let device: MidiBridgeDevice
        let endpoint: MIDIEndpointRef
    }

    private struct ReceivedNoteEvent: Sendable {
        let event: ParsedMidiNoteEvent
        let hostTimestamp: UInt64
    }

    private let stateQueue = DispatchQueue(label: "app.learn-piano.core-midi.state", qos: .userInitiated)
    private let stateQueueKey = DispatchSpecificKey<Void>()
    private let callbackQueue: DispatchQueue
    private let callbacks: CoreMidiServiceCallbacks
    private let uptimeMilliseconds: @Sendable () -> Double

    private var client = MIDIClientRef()
    private var inputPort = MIDIPortRef()
    private var sources: [Source] = []
    private var currentState = MidiBridgeConnectionState.idle
    private var selectedEndpoint: MIDIEndpointRef?
    private var connectionGate = CoreMidiConnectionGate()
    private var timestampClamp = CoreMidiTimestampClamp()
    private var callbackGeneration = 0
    private var hasStarted = false
    private var isDisposed = false

    init(
        callbackQueue: DispatchQueue = .main,
        callbacks: CoreMidiServiceCallbacks = CoreMidiServiceCallbacks(),
        uptimeMilliseconds: @escaping @Sendable () -> Double = {
            ProcessInfo.processInfo.systemUptime * 1_000
        }
    ) {
        self.callbackQueue = DispatchQueue(
            label: "app.learn-piano.core-midi.callbacks",
            target: callbackQueue
        )
        self.callbacks = callbacks
        self.uptimeMilliseconds = uptimeMilliseconds
        stateQueue.setSpecific(key: stateQueueKey, value: ())
    }

    deinit {
        dispose()
    }

    var devices: [MidiBridgeDevice] {
        onStateQueue {
            sources.map(\.device)
        }
    }

    var state: MidiBridgeConnectionState {
        onStateQueue {
            currentState
        }
    }

    func start() throws {
        try onStateQueue {
            guard !isDisposed else {
                throw CoreMidiServiceError.disposed
            }
            guard !hasStarted else {
                return
            }
            try startOnStateQueue()
        }
    }

    func selectSource(id: String) throws {
        try onStateQueue {
            guard !isDisposed else {
                throw CoreMidiServiceError.disposed
            }
            if !hasStarted {
                try startOnStateQueue()
            }

            refreshSources(forceCallback: false)
            guard let source = sources.first(where: { $0.device.id == id }) else {
                disconnectSelectedEndpoint()
                let error = CoreMidiServiceError.sourceUnavailable(id)
                setErrorState(error, selectedInputId: id)
                throw error
            }

            if selectedEndpoint == source.endpoint, currentState.status == .connected {
                setState(
                    MidiBridgeConnectionState(
                        status: .connected,
                        selectedInputId: id,
                        errorMessage: nil
                    )
                )
                return
            }

            disconnectSelectedEndpoint()
            let connectionToken = connectionGate.reserveToken()
            // CoreMIDI treats connRefCon as opaque. The nonzero generation is
            // passed through but never dereferenced, so stale callbacks can be
            // rejected even when reconnecting the same endpoint.
            guard let connectionReference = UnsafeMutableRawPointer(bitPattern: connectionToken) else {
                let error = CoreMidiServiceError.connectionReferenceCreationFailed(id)
                setErrorState(error, selectedInputId: id)
                throw error
            }
            let connectionStatus = MIDIPortConnectSource(
                inputPort,
                source.endpoint,
                connectionReference
            )
            guard connectionStatus == noErr else {
                let error = CoreMidiServiceError.connectionFailed(
                    inputId: id,
                    status: connectionStatus
                )
                setErrorState(error, selectedInputId: id)
                throw error
            }

            selectedEndpoint = source.endpoint
            connectionGate.activate(connectionToken)
            setState(
                MidiBridgeConnectionState(
                    status: .connected,
                    selectedInputId: id,
                    errorMessage: nil
                )
            )
        }
    }

    func disconnect() {
        onStateQueue {
            guard !isDisposed else {
                return
            }

            let selectedInputId = currentState.selectedInputId
            disconnectSelectedEndpoint()
            setState(
                MidiBridgeConnectionState(
                    status: selectedInputId == nil ? .idle : .disconnected,
                    selectedInputId: selectedInputId,
                    errorMessage: nil
                )
            )
        }
    }

    func dispose() {
        onStateQueue {
            guard !isDisposed else {
                return
            }

            isDisposed = true
            callbackGeneration += 1
            disconnectSelectedEndpoint()
            if inputPort != MIDIPortRef() {
                MIDIPortDispose(inputPort)
                inputPort = MIDIPortRef()
            }
            if client != MIDIClientRef() {
                MIDIClientDispose(client)
                client = MIDIClientRef()
            }
            sources = []
            hasStarted = false
        }
    }

    private func startOnStateQueue() throws {
        var createdClient = MIDIClientRef()
        let clientStatus = MIDIClientCreateWithBlock(
            "Learn Piano CoreMIDI" as CFString,
            &createdClient
        ) { [weak self] _ in
            self?.scheduleSetupRefresh()
        }
        guard clientStatus == noErr else {
            let error = CoreMidiServiceError.clientCreationFailed(clientStatus)
            setErrorState(error)
            throw error
        }

        var createdPort = MIDIPortRef()
        let portStatus = MIDIInputPortCreateWithProtocol(
            createdClient,
            "Learn Piano MIDI Input" as CFString,
            ._1_0,
            &createdPort
        ) { [weak self] eventList, connectionReference in
            self?.receive(
                eventList: eventList,
                connectionReference: connectionReference
            )
        }
        guard portStatus == noErr else {
            MIDIClientDispose(createdClient)
            let error = CoreMidiServiceError.inputPortCreationFailed(portStatus)
            setErrorState(error)
            throw error
        }

        client = createdClient
        inputPort = createdPort
        hasStarted = true
        refreshSources(forceCallback: true)
        setState(.idle)
    }

    private func scheduleSetupRefresh() {
        stateQueue.async { [weak self] in
            guard let self, !self.isDisposed, self.hasStarted else {
                return
            }

            self.refreshSources(forceCallback: false)
            self.disconnectMissingSelectedSource()
        }
    }

    private func receive(
        eventList: UnsafePointer<MIDIEventList>,
        connectionReference: UnsafeMutableRawPointer?
    ) {
        // The event-list storage is valid only for this high-priority callback.
        // Copy only normalized note values here; clocks, state, and UI delivery
        // stay on ordinary dispatch queues.
        var parsedEvents: [ReceivedNoteEvent] = []
        for packet in eventList.unsafeSequence() {
            parsedEvents.append(
                contentsOf: CoreMidiUMPParser.parseWordStream(packet.words()).map {
                    ReceivedNoteEvent(event: $0, hostTimestamp: packet.pointee.timeStamp)
                }
            )
        }
        guard !parsedEvents.isEmpty else {
            return
        }
        let receivedEvents = parsedEvents
        let connectionToken = connectionReference.map { UInt(bitPattern: $0) }

        stateQueue.async { [weak self] in
            guard let self,
                  !self.isDisposed,
                  self.selectedEndpoint != nil,
                  self.connectionGate.accepts(connectionToken)
            else {
                return
            }

            for receivedEvent in receivedEvents {
                let parsedEvent = receivedEvent.event
                let candidateTimestamp = coreMidiTimestampMilliseconds(
                    hostTimestamp: receivedEvent.hostTimestamp,
                    fallbackMilliseconds: self.uptimeMilliseconds(),
                    hostTimeToMilliseconds: CoreMidiHostClock.milliseconds
                )
                let timestamp = self.timestampClamp.clamp(candidateTimestamp)
                self.publishEvent(
                    MidiBridgeEvent(
                        type: parsedEvent.type,
                        channel: parsedEvent.channel,
                        noteNumber: parsedEvent.noteNumber,
                        velocity: parsedEvent.velocity,
                        timestamp: timestamp
                    ),
                    connectionToken: connectionToken
                )
            }
        }
    }

    private func refreshSources(forceCallback: Bool) {
        let refreshedSources = enumerateSources()
        guard forceCallback || refreshedSources != sources else {
            return
        }

        sources = refreshedSources
        publishDevices(refreshedSources.map(\.device))
    }

    private func enumerateSources() -> [Source] {
        var discovered: [Source] = []
        var seenIds = Set<String>()

        for index in 0..<MIDIGetNumberOfSources() {
            let endpoint = MIDIGetSource(index)
            guard endpoint != MIDIEndpointRef(),
                  let uniqueId = integerProperty(kMIDIPropertyUniqueID, of: endpoint)
            else {
                continue
            }

            let id = "coremidi:\(uniqueId)"
            guard seenIds.insert(id).inserted else {
                continue
            }

            let displayName = stringProperty(kMIDIPropertyDisplayName, of: endpoint)
                ?? stringProperty(kMIDIPropertyName, of: endpoint)
                ?? "MIDI Input \(uniqueId)"
            discovered.append(
                Source(
                    device: MidiBridgeDevice(
                        id: id,
                        label: String(displayName.prefix(Self.maximumDisplayNameLength))
                    ),
                    endpoint: endpoint
                )
            )
            if discovered.count == Self.maximumPublishedSources {
                break
            }
        }

        return discovered
    }

    private func integerProperty(_ property: CFString, of object: MIDIObjectRef) -> Int32? {
        var value = Int32()
        guard MIDIObjectGetIntegerProperty(object, property, &value) == noErr else {
            return nil
        }
        return value
    }

    private func stringProperty(_ property: CFString, of object: MIDIObjectRef) -> String? {
        var unmanagedValue: Unmanaged<CFString>?
        guard MIDIObjectGetStringProperty(object, property, &unmanagedValue) == noErr,
              let value = unmanagedValue?.takeRetainedValue() as String?
        else {
            return nil
        }
        let trimmedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedValue.isEmpty ? nil : trimmedValue
    }

    private func disconnectMissingSelectedSource() {
        guard let selectedInputId = currentState.selectedInputId,
              let selectedEndpoint,
              !sources.contains(where: {
                  $0.device.id == selectedInputId && $0.endpoint == selectedEndpoint
              })
        else {
            return
        }

        disconnectSelectedEndpoint()
        setState(
            MidiBridgeConnectionState(
                status: .disconnected,
                selectedInputId: selectedInputId,
                errorMessage: nil
            )
        )
    }

    private func disconnectSelectedEndpoint() {
        connectionGate.disconnect()
        if let selectedEndpoint, inputPort != MIDIPortRef() {
            MIDIPortDisconnectSource(inputPort, selectedEndpoint)
        }
        selectedEndpoint = nil
    }

    private func setErrorState(_ error: CoreMidiServiceError, selectedInputId: String? = nil) {
        setState(
            MidiBridgeConnectionState(
                status: .error,
                selectedInputId: selectedInputId,
                errorMessage: error.localizedDescription
            )
        )
    }

    private func setState(_ state: MidiBridgeConnectionState) {
        currentState = state
        publishState(state)
    }

    private func publishDevices(_ devices: [MidiBridgeDevice]) {
        let generation = callbackGeneration
        callbackQueue.async { [weak self, callbacks] in
            self?.onStateQueue {
                guard let self, !self.isDisposed, self.callbackGeneration == generation else {
                    return
                }
                callbacks.devicesChanged(devices)
            }
        }
    }

    private func publishState(_ state: MidiBridgeConnectionState) {
        let generation = callbackGeneration
        callbackQueue.async { [weak self, callbacks] in
            self?.onStateQueue {
                guard let self, !self.isDisposed, self.callbackGeneration == generation else {
                    return
                }
                callbacks.stateChanged(state)
            }
        }
    }

    private func publishEvent(_ event: MidiBridgeEvent, connectionToken: UInt?) {
        let generation = callbackGeneration
        callbackQueue.async { [weak self, callbacks] in
            self?.onStateQueue {
                guard let self,
                      !self.isDisposed,
                      self.callbackGeneration == generation,
                      self.connectionGate.accepts(connectionToken)
                else {
                    return
                }
                callbacks.eventReceived(event)
            }
        }
    }

    private func onStateQueue<T>(_ operation: () throws -> T) rethrows -> T {
        if DispatchQueue.getSpecific(key: stateQueueKey) != nil {
            return try operation()
        }
        return try stateQueue.sync(execute: operation)
    }
}
