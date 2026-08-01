import { parseExercise } from "../schema.js";

export const FIVE_NOTE_ASCENT_EXERCISE_ID = "five-note-ascent-c-major-right-hand";

export const fiveNoteAscentExercise = parseExercise({
  schemaVersion: 1,
  id: FIVE_NOTE_ASCENT_EXERCISE_ID,
  revision: 1,
  title: "Five-note ascent in C · right hand",
  instructions: "Play C-D-E-F-G in ascending order with your right hand. Suggested fingering: 1-2-3-4-5.",
  evaluationMode: "untimed-ordered-notes",
  difficulty: "beginner",
  expectedEvents: [
    { id: "right-hand-c4", kind: "note", noteNumber: 60, hand: "right" },
    { id: "right-hand-d4", kind: "note", noteNumber: 62, hand: "right" },
    { id: "right-hand-e4", kind: "note", noteNumber: 64, hand: "right" },
    { id: "right-hand-f4", kind: "note", noteNumber: 65, hand: "right" },
    { id: "right-hand-g4", kind: "note", noteNumber: 67, hand: "right" },
  ],
  source: {
    kind: "original",
    attribution: "Original exercise created for learn-piano",
  },
  prerequisites: [],
  curriculumTags: ["notes-and-reading.keyboard-geography", "patterns-and-technique.five-finger-patterns"],
  repertoireGoalTags: [],
});
