import { describe, expect, it } from "vitest";
import { normalizeMidiMessage } from "./normalize-midi-message.js";
import type { NormalizedMidiEvent, RawMidiMessage } from "./types.js";

describe("normalizeMidiMessage", () => {
  it.each<{
    name: string;
    message: RawMidiMessage;
    expected: NormalizedMidiEvent;
  }>([
    {
      name: "normalizes channel 1 note-on",
      message: { data: [0x90, 60, 72], timestamp: 12.5 },
      expected: {
        type: "note-on",
        channel: 1,
        noteNumber: 60,
        velocity: 72,
        timestamp: 12.5,
      },
    },
    {
      name: "normalizes channel 16 note-on",
      message: { data: [0x9f, 127, 127], timestamp: 13 },
      expected: {
        type: "note-on",
        channel: 16,
        noteNumber: 127,
        velocity: 127,
        timestamp: 13,
      },
    },
    {
      name: "normalizes channel 16 note-off",
      message: { data: new Uint8Array([0x8f, 0, 42]), timestamp: 14 },
      expected: {
        type: "note-off",
        channel: 16,
        noteNumber: 0,
        velocity: 42,
        timestamp: 14,
      },
    },
    {
      name: "turns velocity-zero note-on into note-off",
      message: { data: [0x94, 64, 0], timestamp: 15 },
      expected: {
        type: "note-off",
        channel: 5,
        noteNumber: 64,
        velocity: 0,
        timestamp: 15,
      },
    },
  ])("$name", ({ message, expected }) => {
    expect(normalizeMidiMessage(message)).toEqual(expected);
  });

  it.each<{
    name: string;
    message: RawMidiMessage;
  }>([
    { name: "controller message", message: { data: [0xb0, 7, 100], timestamp: 1 } },
    { name: "pitch bend", message: { data: [0xe0, 0, 64], timestamp: 1 } },
    { name: "system message", message: { data: [0xf8, 0, 0], timestamp: 1 } },
    { name: "truncated note", message: { data: [0x90, 60], timestamp: 1 } },
    { name: "oversized note message", message: { data: [0x90, 60, 72, 0], timestamp: 1 } },
    { name: "negative status", message: { data: [-1, 60, 72], timestamp: 1 } },
    { name: "status above one byte", message: { data: [256, 60, 72], timestamp: 1 } },
    { name: "fractional status", message: { data: [144.5, 60, 72], timestamp: 1 } },
    { name: "negative note", message: { data: [0x90, -1, 72], timestamp: 1 } },
    { name: "note above range", message: { data: [0x90, 128, 72], timestamp: 1 } },
    { name: "fractional note", message: { data: [0x90, 60.5, 72], timestamp: 1 } },
    { name: "negative velocity", message: { data: [0x90, 60, -1], timestamp: 1 } },
    { name: "velocity above range", message: { data: [0x90, 60, 128], timestamp: 1 } },
    { name: "fractional velocity", message: { data: [0x90, 60, 72.5], timestamp: 1 } },
    { name: "negative timestamp", message: { data: [0x90, 60, 72], timestamp: -1 } },
    { name: "infinite timestamp", message: { data: [0x90, 60, 72], timestamp: Infinity } },
    { name: "NaN timestamp", message: { data: [0x90, 60, 72], timestamp: Number.NaN } },
  ])("ignores a malformed or unsupported $name", ({ message }) => {
    expect(normalizeMidiMessage(message)).toBeNull();
  });

  it("accepts zero and finite fractional monotonic timestamps", () => {
    expect(normalizeMidiMessage({ data: [0x90, 60, 1], timestamp: 0 })?.timestamp).toBe(0);
    expect(normalizeMidiMessage({ data: [0x80, 60, 0], timestamp: 0.25 })?.timestamp).toBe(0.25);
  });
});
