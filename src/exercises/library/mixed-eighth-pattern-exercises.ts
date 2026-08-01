import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import { REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID } from "./repeated-note-exercises.js";

interface MixedEighthPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

type MixedEighthPitches = readonly [
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
  MixedEighthPitch,
];

interface MixedEighthPatternDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: MixedEighthPitches;
  readonly prerequisites: readonly [string, string];
}

const MIXED_EIGHTH_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  timingWindowBeats: 0.1,
} as const;

const RIGHT_HAND_MIXED_PATTERN = [
  { eventToken: "c4-start", noteNumber: 60, beatOffset: 0 },
  { eventToken: "e4-up", noteNumber: 64, beatOffset: 0.5 },
  { eventToken: "d4-first", noteNumber: 62, beatOffset: 1 },
  { eventToken: "d4-repeat", noteNumber: 62, beatOffset: 1.5 },
  { eventToken: "f4-up", noteNumber: 65, beatOffset: 2 },
  { eventToken: "g4-apex", noteNumber: 67, beatOffset: 2.5 },
  { eventToken: "e4-return", noteNumber: 64, beatOffset: 3 },
  { eventToken: "c4-close", noteNumber: 60, beatOffset: 3.5 },
] as const satisfies MixedEighthPitches;

const LEFT_HAND_MIXED_PATTERN = [
  { eventToken: "c3-start", noteNumber: 48, beatOffset: 0 },
  { eventToken: "e3-up", noteNumber: 52, beatOffset: 0.5 },
  { eventToken: "d3-first", noteNumber: 50, beatOffset: 1 },
  { eventToken: "d3-repeat", noteNumber: 50, beatOffset: 1.5 },
  { eventToken: "f3-up", noteNumber: 53, beatOffset: 2 },
  { eventToken: "g3-apex", noteNumber: 55, beatOffset: 2.5 },
  { eventToken: "e3-return", noteNumber: 52, beatOffset: 3 },
  { eventToken: "c3-close", noteNumber: 48, beatOffset: 3.5 },
] as const satisfies MixedEighthPitches;

const CURRICULUM_TAGS = [
  "patterns-and-technique.mixed-patterns",
  "patterns-and-technique.step-skip-coordination",
  "patterns-and-technique.chord-tone-patterns",
  "rhythm-and-coordination.even-eighth-note-onsets",
  "rhythm-and-coordination.repeated-note-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
] as const;

function createMixedEighthPatternExercise(definition: MixedEighthPatternDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: MIXED_EIGHTH_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-mixed-eighth-${eventToken}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
      beatOffset,
    })),
    source: {
      kind: "original",
      attribution: "Original exercise created for learn-piano",
    },
    prerequisites: definition.prerequisites,
    curriculumTags: CURRICULUM_TAGS,
    repertoireGoalTags: [],
  });
}

export const MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID = "mixed-eighth-pattern-c-major-right-hand";

export const mixedEighthPatternRightHandExercise = createMixedEighthPatternExercise({
  id: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
  title: "Mixed eighth pattern in C · right hand",
  instructions:
    "After the four-beat count-in, play C-E-D-D-F-G-E-C evenly on the eighth-note grid with your right hand. Keep the repeated D and every step or skip evenly spaced. Count 1 & 2 & 3 & 4 &. Suggested fingering: 1-3-2-2-4-5-3-1.",
  hand: "right",
  pitches: RIGHT_HAND_MIXED_PATTERN,
  prerequisites: [REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
});

export const MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID = "mixed-eighth-pattern-c-major-left-hand";

export const mixedEighthPatternLeftHandExercise = createMixedEighthPatternExercise({
  id: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  title: "Mixed eighth pattern in C · left hand",
  instructions:
    "After the four-beat count-in, play C-E-D-D-F-G-E-C evenly on the eighth-note grid with your left hand. Keep the repeated D and every step or skip evenly spaced. Count 1 & 2 & 3 & 4 &. Suggested fingering: 5-3-4-4-2-1-3-5.",
  hand: "left",
  pitches: LEFT_HAND_MIXED_PATTERN,
  prerequisites: [REPEATED_NOTES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID],
});
