import Foundation
import WebKit

enum NativeMidiCommandRequest: Equatable {
    case listInputs
    case selectInput(String)
    case disconnect
    case openBluetoothSettings

    init?(body: Any) {
        guard let body = body as? [String: Any], let type = body["type"] as? String else {
            return nil
        }

        switch type {
        case "list-inputs":
            self = .listInputs
        case "select-input":
            guard let inputId = body["inputId"] as? String,
                  !inputId.isEmpty,
                  inputId.count <= 256,
                  inputId == inputId.trimmingCharacters(in: .whitespacesAndNewlines)
            else {
                return nil
            }
            self = .selectInput(inputId)
        case "disconnect":
            self = .disconnect
        case "open-bluetooth-settings":
            self = .openBluetoothSettings
        default:
            return nil
        }
    }

    var isAllowedWhileSuspended: Bool {
        self == .disconnect
    }
}

@MainActor
final class NativeMidiBridge: NSObject, WKScriptMessageHandlerWithReply {
    static let handlerName = "learnPianoMidi"
    static let eventName = "learn-piano-native-midi"

    private weak var webView: WKWebView?
    private let allowedOrigin: AppOrigin
    private let presentBluetoothSettings: () -> Bool
    private var isSuspended = false

    private lazy var midiService = CoreMidiService(
        callbackQueue: .main,
        callbacks: CoreMidiServiceCallbacks(
            devicesChanged: { [weak self] _ in
                Task { @MainActor [weak self] in
                    self?.pushState()
                }
            },
            stateChanged: { [weak self] _ in
                Task { @MainActor [weak self] in
                    self?.pushState()
                }
            },
            eventReceived: { [weak self] event in
                Task { @MainActor [weak self] in
                    self?.push(event: event)
                }
            }
        )
    )

    init(allowedOrigin: AppOrigin, presentBluetoothSettings: @escaping () -> Bool) {
        self.allowedOrigin = allowedOrigin
        self.presentBluetoothSettings = presentBluetoothSettings
        super.init()
    }

    func attach(to webView: WKWebView) {
        self.webView = webView
    }

    func dispose() {
        midiService.dispose()
        webView = nil
    }

    func disconnectForBackground() {
        isSuspended = true
        midiService.disconnect()
    }

    func resumeAfterBackground() {
        isSuspended = false
        pushState()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage,
        replyHandler: @escaping @MainActor @Sendable (Any?, String?) -> Void
    ) {
        guard isTrusted(message) else {
            replyHandler(isolatedFailureResponse(message: "The native MIDI bridge is unavailable for this page."), nil)
            return
        }
        guard let command = NativeMidiCommandRequest(body: message.body) else {
            replyHandler(failureResponse(message: "The native MIDI request was invalid."), nil)
            return
        }
        guard !isSuspended || command.isAllowedWhileSuspended else {
            replyHandler(isolatedFailureResponse(message: "MIDI is paused while Piano Practice is in the background."), nil)
            return
        }

        do {
            switch command {
            case .listInputs:
                try midiService.start()
                replyHandler(response(ok: true), nil)
            case let .selectInput(inputId):
                try midiService.selectSource(id: inputId)
                replyHandler(response(ok: true), nil)
            case .disconnect:
                midiService.disconnect()
                replyHandler(response(ok: true), nil)
            case .openBluetoothSettings:
                let opened = presentBluetoothSettings()
                replyHandler(
                    opened
                        ? response(ok: true)
                        : failureResponse(message: "Bluetooth MIDI settings are already open."),
                    nil
                )
            }
        } catch {
            replyHandler(failureResponse(message: calmMessage(for: error)), nil)
        }
    }

    private func isTrusted(_ message: WKScriptMessage) -> Bool {
        guard message.frameInfo.isMainFrame, message.webView === webView else {
            return false
        }

        let origin = message.frameInfo.securityOrigin
        let scheme = origin.protocol.lowercased()
        let defaultPort = scheme == "https" ? 443 : 80
        let port = origin.port == 0 ? defaultPort : origin.port
        return scheme == allowedOrigin.scheme
            && origin.host.lowercased() == allowedOrigin.host
            && port == allowedOrigin.port
    }

    private func response(ok: Bool, errorMessage: String? = nil) -> [String: Any] {
        return [
            "ok": ok,
            "inputs": midiService.devices.map(deviceObject),
            "state": stateObject(midiService.state, replacingErrorWith: errorMessage),
        ]
    }

    private func failureResponse(message: String) -> [String: Any] {
        response(ok: false, errorMessage: message)
    }

    private func isolatedFailureResponse(message: String) -> [String: Any] {
        [
            "ok": false,
            "inputs": [],
            "state": [
                "status": MidiBridgeConnectionStatus.error.rawValue,
                "selectedInputId": NSNull(),
                "errorMessage": message,
            ],
        ]
    }

    private func deviceObject(_ device: MidiBridgeDevice) -> [String: Any] {
        ["id": device.id, "label": device.label]
    }

    private func stateObject(
        _ state: MidiBridgeConnectionState,
        replacingErrorWith errorMessage: String? = nil
    ) -> [String: Any] {
        let selectedInputId: Any
        if let value = state.selectedInputId {
            selectedInputId = value
        } else {
            selectedInputId = NSNull()
        }

        let renderedErrorMessage: Any
        if let value = errorMessage ?? state.errorMessage {
            renderedErrorMessage = value
        } else {
            renderedErrorMessage = NSNull()
        }

        return [
            "status": errorMessage == nil ? state.status.rawValue : MidiBridgeConnectionStatus.error.rawValue,
            "selectedInputId": selectedInputId,
            "errorMessage": renderedErrorMessage,
        ]
    }

    private func pushState() {
        push(
            payload: [
                "type": "state-change",
                "inputs": midiService.devices.map(deviceObject),
                "state": stateObject(midiService.state),
            ]
        )
    }

    private func push(event: MidiBridgeEvent) {
        push(
            payload: [
                "type": "midi-event",
                "event": [
                    "type": event.type.rawValue,
                    "channel": event.channel,
                    "noteNumber": event.noteNumber,
                    "velocity": event.velocity,
                    "timestamp": event.timestamp,
                ],
            ]
        )
    }

    private func push(payload: [String: Any]) {
        guard let webView,
              let currentURL = webView.url,
              allowedOrigin.contains(currentURL)
        else {
            return
        }

        Task { @MainActor [weak webView] in
            _ = try? await webView?.callAsyncJavaScript(
                "window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));",
                arguments: ["eventName": Self.eventName, "payload": payload],
                in: nil,
                contentWorld: .page
            )
        }
    }

    private func calmMessage(for error: Error) -> String {
        let message = error.localizedDescription
            .unicodeScalars
            .map { CharacterSet.controlCharacters.contains($0) ? " " : String($0) }
            .joined()
            .split(whereSeparator: \Character.isWhitespace)
            .joined(separator: " ")
        guard !message.isEmpty else {
            return "The native MIDI request could not be completed."
        }
        return message.count <= 160 ? message : String(message.prefix(159)) + "…"
    }
}
