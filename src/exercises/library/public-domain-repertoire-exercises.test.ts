import { describe, expect, it } from "vitest";
import { projectStaffPitchGuide } from "../../notation/staff-pitch-guide.js";
import { FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID, STEP_SKIP_RIGHT_HAND_EXERCISE_ID } from "./beginner-five-note-exercises.js";
import { D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID } from "./d-minor-five-note-exercises.js";
import { ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID } from "./ordered-chord-tone-exercises.js";
import {
  BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID,
  BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID,
  PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID,
  bachInvention1OpeningMotifRightHandExercise,
  beethovenOdeToJoyOpeningRightHandExercise,
  pachelbelCanonGroundBassLeftHandExercise,
} from "./public-domain-repertoire-exercises.js";

describe("public-domain repertoire sampler", () => {
  it.each([
    {
      exercise: beethovenOdeToJoyOpeningRightHandExercise,
      id: BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID,
      difficulty: "beginner",
      attribution: "Ludwig van Beethoven",
      workTitle: "Symphony No. 9 in D minor, Op. 125, fourth movement",
      license: "Public-domain 1824 holograph manuscript; project-authored learning arrangement",
      referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN756658373",
      adaptationNote:
        "Independent right-hand learning arrangement of the opening eight melody notes, transposed to C major; original rhythm and accompaniment are omitted.",
      pitches: [64, 64, 65, 67, 67, 65, 64, 62],
      prerequisites: [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID],
      curriculumTags: [
        "repertoire.public-domain",
        "notes-and-reading.keyboard-geography",
        "patterns-and-technique.repeated-note-control",
        "rhythm-and-coordination.hands-separately",
      ],
    },
    {
      exercise: pachelbelCanonGroundBassLeftHandExercise,
      id: PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID,
      difficulty: "advanced",
      attribution: "Johann Pachelbel",
      workTitle: "Canon and Gigue in D major, P.37",
      license: "Public-domain ca. 1838–42 manuscript; project-authored learning arrangement",
      referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN728499177",
      adaptationNote:
        "Independent left-hand learning arrangement of the eight-note ground bass, transposed from D major to C major; continuo realization, upper voices, and original rhythm are omitted.",
      pitches: [48, 55, 57, 52, 53, 48, 53, 55],
      prerequisites: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID],
      curriculumTags: [
        "repertoire.public-domain",
        "notes-and-reading.keyboard-geography",
        "notes-and-reading.interval-recognition",
        "patterns-and-technique.broken-chord-patterns",
        "rhythm-and-coordination.hands-separately",
      ],
    },
    {
      exercise: bachInvention1OpeningMotifRightHandExercise,
      id: BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID,
      difficulty: "intermediate",
      attribution: "Johann Sebastian Bach",
      workTitle: "Invention No. 1 in C major, BWV 772",
      license: "Public-domain ca. 1724 manuscript; project-authored learning arrangement",
      referenceUrl: "https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN79687395X",
      adaptationNote:
        "Independent right-hand learning arrangement of the opening eight-note upper-voice motif, placed in the app's C4-G4 range; the opening rest, second voice, ornaments, and original rhythm are omitted.",
      pitches: [60, 62, 64, 65, 62, 64, 60, 67],
      prerequisites: [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
      curriculumTags: [
        "repertoire.public-domain",
        "notes-and-reading.interval-recognition",
        "patterns-and-technique.step-skip-coordination",
        "rhythm-and-coordination.hands-separately",
      ],
    },
  ] as const)("defines the bounded $attribution learning arrangement", ({ exercise, ...expected }) => {
    expect(exercise).toMatchObject({
      schemaVersion: 1,
      id: expected.id,
      revision: 1,
      evaluationMode: "untimed-ordered-notes",
      difficulty: expected.difficulty,
      source: {
        kind: "public-domain",
        attribution: expected.attribution,
        workTitle: expected.workTitle,
        license: expected.license,
        referenceUrl: expected.referenceUrl,
      },
      prerequisites: expected.prerequisites,
      repertoireGoalTags: [],
    });
    expect(exercise.curriculumTags).toEqual(expected.curriculumTags);
    expect(exercise.expectedEvents.map(({ noteNumber }) => noteNumber)).toEqual(expected.pitches);
    expect(exercise.expectedEvents).toHaveLength(8);
    expect(new Set(exercise.expectedEvents.map(({ id }) => id))).toHaveLength(8);
    expect(exercise.source.adaptationNote).toBe(expected.adaptationNote);
  });

  it("keeps every arrangement inside the supported pitch-only staff subset", () => {
    for (const exercise of [
      beethovenOdeToJoyOpeningRightHandExercise,
      pachelbelCanonGroundBassLeftHandExercise,
      bachInvention1OpeningMotifRightHandExercise,
    ]) {
      const guide = projectStaffPitchGuide(exercise.expectedEvents);
      expect(guide?.notes).toHaveLength(8);
      expect(guide?.notes.map(({ noteNumber }) => noteNumber)).toEqual(exercise.expectedEvents.map(({ noteNumber }) => noteNumber));
    }
  });

  it("states the omitted musical dimensions instead of claiming a complete performance", () => {
    expect(beethovenOdeToJoyOpeningRightHandExercise.source.adaptationNote).toContain("original rhythm and accompaniment are omitted");
    expect(pachelbelCanonGroundBassLeftHandExercise.source.adaptationNote).toContain("upper voices");
    expect(bachInvention1OpeningMotifRightHandExercise.source.adaptationNote).toContain("second voice");
  });
});
