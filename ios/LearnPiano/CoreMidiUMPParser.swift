import Foundation

struct ParsedMidiNoteEvent: Equatable, Sendable {
    let type: MidiBridgeEventType
    let channel: Int
    let noteNumber: Int
    let velocity: Int
}

enum CoreMidiUMPParser {
    private static let midiOneChannelVoiceMessageType: UInt32 = 0x2
    private static let noteOffStatus: UInt32 = 0x8
    private static let noteOnStatus: UInt32 = 0x9

    static func parseChannelVoiceWord(_ word: UInt32) -> ParsedMidiNoteEvent? {
        let messageType = (word >> 28) & 0x0f
        guard messageType == midiOneChannelVoiceMessageType else {
            return nil
        }

        let status = (word >> 20) & 0x0f
        guard status == noteOnStatus || status == noteOffStatus else {
            return nil
        }

        let channel = Int((word >> 16) & 0x0f) + 1
        let noteNumber = Int((word >> 8) & 0xff)
        let velocity = Int(word & 0xff)
        guard noteNumber <= 127, velocity <= 127 else {
            return nil
        }
        let type: MidiBridgeEventType = status == noteOffStatus || velocity == 0 ? .noteOff : .noteOn

        return ParsedMidiNoteEvent(
            type: type,
            channel: channel,
            noteNumber: noteNumber,
            velocity: velocity
        )
    }

    static func parseWordStream<S: Collection>(_ words: S) -> [ParsedMidiNoteEvent] where S.Element == UInt32 {
        var events: [ParsedMidiNoteEvent] = []
        var index = words.startIndex

        while index != words.endIndex {
            let word = words[index]
            if let event = parseChannelVoiceWord(word) {
                events.append(event)
            }

            let remainingWordCount = words.distance(from: index, to: words.endIndex)
            let messageWordCount = min(umpWordCount(for: word), remainingWordCount)
            words.formIndex(&index, offsetBy: messageWordCount)
        }

        return events
    }

    private static func umpWordCount(for firstWord: UInt32) -> Int {
        switch (firstWord >> 28) & 0x0f {
        case 0x3, 0x4, 0x8, 0x9, 0xa:
            2
        case 0xb, 0xc:
            3
        case 0x5, 0xd, 0xe, 0xf:
            4
        default:
            1
        }
    }
}
