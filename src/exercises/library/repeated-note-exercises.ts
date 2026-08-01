import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import { EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID } from "./even-eighth-exercises.js";

interface RepeatedNotePitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

interface RepeatedNoteExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: readonly [RepeatedNotePitch, RepeatedNotePitch, RepeatedNotePitch, RepeatedNotePitch, RepeatedNotePitch];
  readonly prerequisite: string;
}

const REPEATED_NOTE_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  timingWindowBeats: 0.1,
} as const;

const RIGHT_HAND_REPEATED_PAIRS = [
  { eventToken: "c4-first", noteNumber: 60, beatOffset: 0 },
  { eventToken: "c4-second", noteNumber: 60, beatOffset: 0.5 },
  { eventToken: "d4-first", noteNumber: 62, beatOffset: 1 },
  { eventToken: "d4-second", noteNumber: 62, beatOffset: 1.5 },
  { eventToken: "e4", noteNumber: 64, beatOffset: 2 },
] as const;

const LEFT_HAND_REPEATED_PAIRS = [
  { eventToken: "c3-first", noteNumber: 48, beatOffset: 0 },
  { eventToken: "c3-second", noteNumber: 48, beatOffset: 0.5 },
  { eventToken: "d3-first", noteNumber: 50, beatOffset: 1 },
  { eventToken: "d3-second", noteNumber: 50, beatOffset: 1.5 },
  { eventToken: "e3", noteNumber: 52, beatOffset: 2 },
] as const;

const CURRICULUM_TAGS = [
  "patterns-and-technique.repeated-note-control",
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.repeated-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

function createRepeatedNoteExercise(definition: RepeatedNoteExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: REPEATED_NOTE_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-repeated-note-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
      beatOffset,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: [definition.prerequisite],
    curriculumTags: CURRICULUM_TAGS,
    repertoireGoalTags: [],
  });
}

export const REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID = "repeated-note-eighths-c-major-right-hand";

export const repeatedNotesRightHandExercise = createRepeatedNoteExercise({
  id: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
  title: "Repeated pairs in C · right hand",
  instructions:
    "After the four-beat count-in, press C twice, then D twice, and finish on E with your right hand. Keep all five presses evenly spaced on the eighth-note grid; count 1 & 2 & 3. Suggested fingering: 1-1-2-2-3.",
  hand: "right",
  pitches: RIGHT_HAND_REPEATED_PAIRS,
  prerequisite: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
});

export const REPEATED_NOTES_LEFT_HAND_EXERCISE_ID = "repeated-note-eighths-c-major-left-hand";

export const repeatedNotesLeftHandExercise = createRepeatedNoteExercise({
  id: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
  title: "Repeated pairs in C · left hand",
  instructions:
    "After the four-beat count-in, press C twice, then D twice, and finish on E with your left hand. Keep all five presses evenly spaced on the eighth-note grid; count 1 & 2 & 3. Suggested fingering: 5-5-4-4-3.",
  hand: "left",
  pitches: LEFT_HAND_REPEATED_PAIRS,
  prerequisite: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
});
