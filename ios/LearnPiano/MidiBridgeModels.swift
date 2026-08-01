import Foundation

struct MidiBridgeDevice: Codable, Equatable, Sendable {
    let id: String
    let label: String
}

enum MidiBridgeEventType: String, Codable, Equatable, Sendable {
    case noteOn = "note-on"
    case noteOff = "note-off"
}

struct MidiBridgeEvent: Codable, Equatable, Sendable {
    let type: MidiBridgeEventType
    let channel: Int
    let noteNumber: Int
    let velocity: Int
    let timestamp: Double
}

enum MidiBridgeConnectionStatus: String, Codable, Equatable, Sendable {
    case idle
    case connected
    case disconnected
    case error
}

struct MidiBridgeConnectionState: Codable, Equatable, Sendable {
    let status: MidiBridgeConnectionStatus
    let selectedInputId: String?
    let errorMessage: String?

    static let idle = MidiBridgeConnectionState(
        status: .idle,
        selectedInputId: nil,
        errorMessage: nil
    )
}
