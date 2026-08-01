import XCTest
@testable import LearnPiano

final class CoreMidiUMPParserTests: XCTestCase {
    func testParsesNoteOnAcrossAllChannels() {
        XCTAssertEqual(
            CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x90, note: 60, velocity: 100)),
            ParsedMidiNoteEvent(type: .noteOn, channel: 1, noteNumber: 60, velocity: 100)
        )
        XCTAssertEqual(
            CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x9f, note: 127, velocity: 127)),
            ParsedMidiNoteEvent(type: .noteOn, channel: 16, noteNumber: 127, velocity: 127)
        )
    }

    func testNormalizesNoteOffAndZeroVelocityNoteOn() {
        XCTAssertEqual(
            CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x82, note: 48, velocity: 64)),
            ParsedMidiNoteEvent(type: .noteOff, channel: 3, noteNumber: 48, velocity: 64)
        )
        XCTAssertEqual(
            CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x94, note: 72, velocity: 0)),
            ParsedMidiNoteEvent(type: .noteOff, channel: 5, noteNumber: 72, velocity: 0)
        )
    }

    func testIgnoresNonNoteChannelVoiceMessagesAndOtherUMPTypes() {
        XCTAssertNil(CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0xb0, note: 7, velocity: 100)))
        XCTAssertNil(CoreMidiUMPParser.parseChannelVoiceWord(0x4090_3c00))
        XCTAssertNil(CoreMidiUMPParser.parseChannelVoiceWord(0x1090_3c64))
    }

    func testRejectsMalformedMidiOneDataBytes() {
        XCTAssertNil(CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x90, note: 128, velocity: 1)))
        XCTAssertNil(CoreMidiUMPParser.parseChannelVoiceWord(midiOneWord(status: 0x90, note: 60, velocity: 255)))
    }

    func testSkipsCompleteUnsupportedUMPMessagesWithoutParsingPayloadWords() {
        let events = CoreMidiUMPParser.parseWordStream([
            0x3010_0000,
            0x2090_3c64,
            midiOneWord(status: 0x91, note: 62, velocity: 80),
            0x4090_4000,
            0x2090_417f,
            midiOneWord(status: 0x82, note: 62, velocity: 20),
        ])

        XCTAssertEqual(
            events,
            [
                ParsedMidiNoteEvent(type: .noteOn, channel: 2, noteNumber: 62, velocity: 80),
                ParsedMidiNoteEvent(type: .noteOff, channel: 3, noteNumber: 62, velocity: 20),
            ]
        )
    }

    func testHandlesTruncatedUnsupportedMessageWithoutReadingPastTheStream() {
        XCTAssertEqual(CoreMidiUMPParser.parseWordStream([0xf000_0000, 0x2090_3c64]), [])
    }

    private func midiOneWord(status: UInt32, note: UInt32, velocity: UInt32) -> UInt32 {
        (0x2 << 28) | (status << 16) | (note << 8) | velocity
    }
}

final class CoreMidiConnectionGateTests: XCTestCase {
    func testRejectsQueuedEventsFromAnOlderConnection() {
        var gate = CoreMidiConnectionGate()
        let firstToken = gate.reserveToken()
        gate.activate(firstToken)
        XCTAssertTrue(gate.accepts(firstToken))

        gate.disconnect()
        let secondToken = gate.reserveToken()
        gate.activate(secondToken)

        XCTAssertFalse(gate.accepts(firstToken))
        XCTAssertTrue(gate.accepts(secondToken))
        XCTAssertFalse(gate.accepts(nil))
    }
}

final class CoreMidiTimestampClampTests: XCTestCase {
    func testKeepsTimestampsNondecreasingAcrossConnections() {
        var clamp = CoreMidiTimestampClamp()

        XCTAssertEqual(clamp.clamp(12.5), 12.5)
        XCTAssertEqual(clamp.clamp(11), 12.5)
        XCTAssertEqual(clamp.clamp(12.5), 12.5)
        XCTAssertEqual(clamp.clamp(14), 14)
    }

    func testUsesPacketHostTimeAndFallsBackOnlyForImmediatePackets() {
        XCTAssertEqual(
            coreMidiTimestampMilliseconds(
                hostTimestamp: 120,
                fallbackMilliseconds: 999,
                hostTimeToMilliseconds: { Double($0) * 2 }
            ),
            240
        )
        XCTAssertEqual(
            coreMidiTimestampMilliseconds(
                hostTimestamp: 0,
                fallbackMilliseconds: 999,
                hostTimeToMilliseconds: { _ in 0 }
            ),
            999
        )
    }
}
