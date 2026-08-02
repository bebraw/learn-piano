import { parseExercise } from "../schema.js";
import type { Exercise, ExerciseDifficulty, ExerciseHand, NoteExerciseEvent } from "../types.js";
import { FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "./beginner-five-note-exercises.js";
import { D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID } from "./d-minor-five-note-exercises.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";

interface PublicDomainRepertoireDefinition {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly difficulty: ExerciseDifficulty;
  readonly hand: Exclude<ExerciseHand, "both">;
  readonly pitches: readonly number[];
  readonly eventPrefix: string;
  readonly attribution: string;
  readonly workTitle: string;
  readonly license: string;
  readonly referenceUrl: string;
  readonly adaptationNote: string;
  readonly prerequisites: readonly string[];
  readonly curriculumTags: readonly string[];
}

function createPublicDomainRepertoireExercise(definition: PublicDomainRepertoireDefinition): Exercise {
  return parseExercise({
    schemaVersion: 1,
    id: definition.id,
    revision: 1,
    title: definition.title,
    instructions: definition.instructions,
    evaluationMode: "untimed-ordered-notes",
    difficulty: definition.difficulty,
    expectedEvents: definition.pitches.map((noteNumber, index): NoteExerciseEvent => ({
      id: `${definition.eventPrefix}-${String(index + 1).padStart(2, "0")}`,
      kind: "note",
      noteNumber,
      hand: definition.hand,
    })),
    source: {
      kind: "public-domain",
      attribution: definition.attribution,
      workTitle: definition.workTitle,
      license: definition.license,
      referenceUrl: definition.referenceUrl,
      adaptationNote: definition.adaptationNote,
    },
    prerequisites: definition.prerequisites,
    curriculumTags: definition.curriculumTags,
    repertoireGoalTags: [],
  });
}

export const BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID = "beethoven-ode-to-joy-opening-right-hand";

export const beethovenOdeToJoyOpeningRightHandExercise = createPublicDomainRepertoireExercise({
  id: BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID,
  title: "Ode to Joy opening · right hand",
  instructions:
    "Learn the first eight melody notes in C with your right hand: E-E-F-G-G-F-E-D. This beginner learning arrangement is untimed and checks pitch order only. Suggested fingering: 3-3-4-5-5-4-3-2.",
  difficulty: "beginner",
  hand: "right",
  pitches: [64, 64, 65, 67, 67, 65, 64, 62],
  eventPrefix: "beethoven-ode-to-joy-opening-right-hand",
  attribution: "Ludwig van Beethoven",
  workTitle: "Symphony No. 9 in D minor, Op. 125, fourth movement",
  license: "Public-domain 1824 holograph manuscript; project-authored learning arrangement",
  referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN756658373",
  adaptationNote:
    "Independent right-hand learning arrangement of the opening eight melody notes, transposed to C major; original rhythm and accompaniment are omitted.",
  prerequisites: [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID],
  curriculumTags: [
    "repertoire.public-domain",
    "notes-and-reading.keyboard-geography",
    "patterns-and-technique.repeated-note-control",
    "rhythm-and-coordination.hands-separately",
  ],
});

export const PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID = "pachelbel-canon-ground-bass-left-hand";

export const pachelbelCanonGroundBassLeftHandExercise = createPublicDomainRepertoireExercise({
  id: PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID,
  title: "Canon ground bass · left hand",
  instructions:
    "Learn the eight-note ground bass in C with your left hand: C-G-A-E-F-C-F-G. This advanced learning arrangement is untimed and checks pitch order only. Suggested fingering: 5-2-1-3-2-5-2-1.",
  difficulty: "advanced",
  hand: "left",
  pitches: [48, 55, 57, 52, 53, 48, 53, 55],
  eventPrefix: "pachelbel-canon-ground-bass-left-hand",
  attribution: "Johann Pachelbel",
  workTitle: "Canon and Gigue in D major, P.37",
  license: "Public-domain ca. 1838–42 manuscript; project-authored learning arrangement",
  referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN728499177",
  adaptationNote:
    "Independent left-hand learning arrangement of the eight-note ground bass, transposed from D major to C major; continuo realization, upper voices, and original rhythm are omitted.",
  prerequisites: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID],
  curriculumTags: [
    "repertoire.public-domain",
    "notes-and-reading.keyboard-geography",
    "notes-and-reading.interval-recognition",
    "patterns-and-technique.broken-chord-patterns",
    "rhythm-and-coordination.hands-separately",
  ],
});

export const BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID = "bach-invention-1-opening-motif-right-hand";

export const bachInvention1OpeningMotifRightHandExercise = createPublicDomainRepertoireExercise({
  id: BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID,
  title: "Invention No. 1 motif · right hand",
  instructions:
    "Learn the opening upper-voice motif from BWV 772 with your right hand: C-D-E-F-D-E-C-G. This intermediate learning arrangement is untimed and checks pitch order only. Suggested fingering: 1-2-3-4-2-3-1-5.",
  difficulty: "intermediate",
  hand: "right",
  pitches: [60, 62, 64, 65, 62, 64, 60, 67],
  eventPrefix: "bach-invention-1-opening-motif-right-hand",
  attribution: "Johann Sebastian Bach",
  workTitle: "Invention No. 1 in C major, BWV 772",
  license: "Public-domain ca. 1724 manuscript; project-authored learning arrangement",
  referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN79687395X",
  adaptationNote:
    "Independent right-hand learning arrangement of the opening eight-note upper-voice motif, placed in the app's C4-G4 range; the opening rest, second voice, ornaments, and original rhythm are omitted.",
  prerequisites: [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
  curriculumTags: [
    "repertoire.public-domain",
    "notes-and-reading.interval-recognition",
    "patterns-and-technique.step-skip-coordination",
    "rhythm-and-coordination.hands-separately",
  ],
});
