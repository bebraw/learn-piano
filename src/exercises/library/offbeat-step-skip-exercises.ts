import { parseExercise } from "../schema.js";
import { DEFAULT_TIMED_EXERCISE_TIMING, type Exercise, type ExerciseHand } from "../types.js";
import {
  MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
} from "./mixed-eighth-pattern-exercises.js";

interface OffbeatStepSkipPitch {
  readonly eventToken: string;
  readonly noteNumber: number;
  readonly beatOffset: number;
}

type OffbeatStepSkipPitches = readonly [
  OffbeatStepSkipPitch,
  OffbeatStepSkipPitch,
  OffbeatStepSkipPitch,
  OffbeatStepSkipPitch,
  OffbeatStepSkipPitch,
];

interface OffbeatStepSkipExerciseDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly hand: ExerciseHand;
  readonly pitches: OffbeatStepSkipPitches;
  readonly prerequisite: string;
}

const OFFBEAT_STEP_SKIP_TIMING = {
  ...DEFAULT_TIMED_EXERCISE_TIMING,
  timingWindowBeats: 0.1,
} as const;

const RIGHT_HAND_OFFBEAT_STEP_SKIP = [
  { eventToken: "c4-anchor", noteNumber: 60, beatOffset: 0 },
  { eventToken: "e4-first-offbeat", noteNumber: 64, beatOffset: 0.5 },
  { eventToken: "d4-second-offbeat", noteNumber: 62, beatOffset: 1.5 },
  { eventToken: "f4-third-offbeat", noteNumber: 65, beatOffset: 2.5 },
  { eventToken: "g4-fourth-offbeat", noteNumber: 67, beatOffset: 3.5 },
] as const satisfies OffbeatStepSkipPitches;

const LEFT_HAND_OFFBEAT_STEP_SKIP = [
  { eventToken: "c3-anchor", noteNumber: 48, beatOffset: 0 },
  { eventToken: "e3-first-offbeat", noteNumber: 52, beatOffset: 0.5 },
  { eventToken: "d3-second-offbeat", noteNumber: 50, beatOffset: 1.5 },
  { eventToken: "f3-third-offbeat", noteNumber: 53, beatOffset: 2.5 },
  { eventToken: "g3-fourth-offbeat", noteNumber: 55, beatOffset: 3.5 },
] as const satisfies OffbeatStepSkipPitches;

const CURRICULUM_TAGS = [
  "rhythm-and-coordination.offbeat-onsets",
  "rhythm-and-coordination.subdivision",
  "rhythm-and-coordination.hands-separately",
  "patterns-and-technique.step-skip-coordination",
  "notes-and-reading.interval-recognition",
] as const;

function createOffbeatStepSkipExercise(definition: OffbeatStepSkipExerciseDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "timed-ordered-notes",
    timing: OFFBEAT_STEP_SKIP_TIMING,
    difficulty: "beginner",
    expectedEvents: definition.pitches.map(({ eventToken, noteNumber, beatOffset }) => ({
      id: `${definition.hand}-hand-offbeat-step-skip-${eventToken}`,
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

export const OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID = "offbeat-step-skip-c-major-right-hand";

export const offbeatStepSkipRightHandExercise = createOffbeatStepSkipExercise({
  id: OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
  title: "Offbeat step and skip in C · right hand",
  instructions:
    "After the four-beat count-in, play C on beat 1, then E-D-F-G on the four “and” counts between quarter-note clicks with your right hand. Count 1 & 2 & 3 & 4 &. Suggested fingering: 1-3-2-4-5.",
  hand: "right",
  pitches: RIGHT_HAND_OFFBEAT_STEP_SKIP,
  prerequisite: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
});

export const OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID = "offbeat-step-skip-c-major-left-hand";

export const offbeatStepSkipLeftHandExercise = createOffbeatStepSkipExercise({
  id: OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  title: "Offbeat step and skip in C · left hand",
  instructions:
    "After the four-beat count-in, play C on beat 1, then E-D-F-G on the four “and” counts between quarter-note clicks with your left hand. Count 1 & 2 & 3 & 4 &. Suggested fingering: 5-3-4-2-1.",
  hand: "left",
  pitches: LEFT_HAND_OFFBEAT_STEP_SKIP,
  prerequisite: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
});
