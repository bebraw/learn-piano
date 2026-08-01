import XCTest
@testable import LearnPiano

final class AppConfigurationTests: XCTestCase {
    func testAcceptsHTTPSAndRemovesFragments() throws {
        let url = try AppConfigurationStore.validate(" https://Piano.Example.com/practice#private ")
        let comparisonURL = try XCTUnwrap(URL(string: "https://piano.example.com"))

        XCTAssertEqual(url.absoluteString, "https://piano.example.com/practice")
        XCTAssertEqual(AppOrigin(url: url), AppOrigin(url: comparisonURL))
    }

    func testAcceptsOnlyLocalDevelopmentHTTP() throws {
        XCTAssertNoThrow(try AppConfigurationStore.validate("http://piano.local:8787"))
        XCTAssertNoThrow(try AppConfigurationStore.validate("http://192.168.1.40:8787"))
        XCTAssertNoThrow(try AppConfigurationStore.validate("http://172.31.2.3:8787"))
        XCTAssertNoThrow(try AppConfigurationStore.validate("http://[::1]:8787"))
        XCTAssertThrowsError(try AppConfigurationStore.validate("http://example.com")) { error in
            XCTAssertEqual(error as? AppConfigurationError, .insecureRemoteURL)
        }
    }

    func testRejectsAmbiguousPrivateAddressSpellings() {
        XCTAssertThrowsError(try AppConfigurationStore.validate("http://192..168.1.40:8787"))
        XCTAssertThrowsError(try AppConfigurationStore.validate("http://010.0.0.1:8787"))
        XCTAssertThrowsError(try AppConfigurationStore.validate("http://192.168.1.invalid:8787"))
    }

    func testRejectsCredentialsAndUnsupportedSchemes() {
        XCTAssertThrowsError(try AppConfigurationStore.validate("https://user:password@example.com"))
        XCTAssertThrowsError(try AppConfigurationStore.validate("javascript:alert(1)"))
        XCTAssertThrowsError(try AppConfigurationStore.validate(""))
    }

    func testOriginRequiresExactSchemeHostAndPort() throws {
        let configuredURL = try XCTUnwrap(URL(string: "https://piano.example.com/practice"))
        let origin = try XCTUnwrap(AppOrigin(url: configuredURL))

        XCTAssertTrue(origin.contains(try XCTUnwrap(URL(string: "https://piano.example.com/another"))))
        XCTAssertFalse(origin.contains(try XCTUnwrap(URL(string: "http://piano.example.com/another"))))
        XCTAssertFalse(origin.contains(try XCTUnwrap(URL(string: "https://other.example.com/another"))))
        XCTAssertFalse(origin.contains(try XCTUnwrap(URL(string: "https://piano.example.com:8443/another"))))
    }
}

final class NativeMidiCommandRequestTests: XCTestCase {
    func testDecodesSupportedCommands() {
        XCTAssertEqual(NativeMidiCommandRequest(body: ["type": "list-inputs"]), .listInputs)
        XCTAssertEqual(
            NativeMidiCommandRequest(body: ["type": "select-input", "inputId": "coremidi:42"]),
            .selectInput("coremidi:42")
        )
        XCTAssertEqual(NativeMidiCommandRequest(body: ["type": "disconnect"]), .disconnect)
        XCTAssertEqual(
            NativeMidiCommandRequest(body: ["type": "open-bluetooth-settings"]),
            .openBluetoothSettings
        )
    }

    func testRejectsMalformedAndUnsupportedCommands() {
        XCTAssertNil(NativeMidiCommandRequest(body: ["type": "unknown"]))
        XCTAssertNil(NativeMidiCommandRequest(body: ["type": "select-input"]))
        XCTAssertNil(NativeMidiCommandRequest(body: ["type": "select-input", "inputId": " coremidi:42 "]))
        XCTAssertNil(NativeMidiCommandRequest(body: ["type": "select-input", "inputId": String(repeating: "x", count: 257)]))
        XCTAssertNil(NativeMidiCommandRequest(body: ["type": 42]))
        XCTAssertNil(NativeMidiCommandRequest(body: []))
    }

    func testOnlyDisconnectIsAllowedWhileSuspended() {
        XCTAssertTrue(NativeMidiCommandRequest.disconnect.isAllowedWhileSuspended)
        XCTAssertFalse(NativeMidiCommandRequest.listInputs.isAllowedWhileSuspended)
        XCTAssertFalse(NativeMidiCommandRequest.selectInput("coremidi:42").isAllowedWhileSuspended)
        XCTAssertFalse(NativeMidiCommandRequest.openBluetoothSettings.isAllowedWhileSuspended)
    }
}
