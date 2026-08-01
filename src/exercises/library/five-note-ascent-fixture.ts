import { createRawNoteTapMessages, type RawMidiFixture } from "../../midi/fixtures/raw-midi-fixtures.js";
import { fiveNoteAscentExercise } from "./five-note-ascent.js";

export interface ExerciseRawMidiFixture extends RawMidiFixture {
  readonly exerciseId: string;
  readonly exerciseRevision: number;
  readonly noteNumbers: readonly number[];
}

const noteNumbers = fiveNoteAscentExercise.expectedEvents.map(({ noteNumber }) => noteNumber);

export const ascendingFiveNoteRawFixture: ExerciseRawMidiFixture = {
  id: "ascending-c4-to-g4",
  label: "Canonical five-note ascent note taps",
  exerciseId: fiveNoteAscentExercise.id,
  exerciseRevision: fiveNoteAscentExercise.revision,
  noteNumbers,
  messages: createRawNoteTapMessages(noteNumbers),
};
