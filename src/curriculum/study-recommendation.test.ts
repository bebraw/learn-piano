import { describe, expect, it } from "vitest";
import type { CompletedAttemptRecord } from "../client/persistence/attempt-repository.js";
import {
  FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID,
  STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/beginner-five-note-exercises.js";
import {
  D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
  D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/d-minor-five-note-exercises.js";
import { EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID, EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID } from "../exercises/library/even-eighth-exercises.js";
import {
  FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID,
  FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/five-four-pulse-exercises.js";
import { exerciseLibrary } from "../exercises/library/index.js";
import {
  MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
  MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/mixed-eighth-pattern-exercises.js";
import {
  OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/offbeat-step-skip-exercises.js";
import {
  ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
  ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
  ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/ordered-chord-tone-exercises.js";
import {
  REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
  REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/repeated-note-exercises.js";
import {
  BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID,
  BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID,
  PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID,
} from "../exercises/library/public-domain-repertoire-exercises.js";
import {
  STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
  STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/steady-quarter-exercises.js";
import {
  STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/steady-broken-chord-exercises.js";
import {
  THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
  THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
} from "../exercises/library/three-four-broken-chord-exercises.js";
import type { Exercise } from "../exercises/types.js";
import { recommendNextStudy, type StudyAttemptEvidence } from "./study-recommendation.js";

describe("recommendNextStudy", () => {
  it("chooses the first prerequisite-free study when history is empty", () => {
    const prerequisite = exercise("prerequisite");
    const blocked = exercise("blocked", [prerequisite.id]);
    const laterRoot = exercise("later-root");

    const recommendation = recommendNextStudy([blocked, prerequisite, laterRoot], [], null);

    expect(recommendation).toEqual({
      kind: "new-study",
      exercise: prerequisite,
      reason: { kind: "prerequisite-free" },
    });
    expect(recommendation?.exercise).toBe(prerequisite);
  });

  it("prefers an eligible direct dependent over an earlier unpracticed root", () => {
    const completedRoot = exercise("completed-root");
    const earlierRoot = exercise("earlier-root");
    const directDependent = exercise("direct-dependent", [completedRoot.id]);

    expect(
      recommendNextStudy(
        [completedRoot, earlierRoot, directDependent],
        [attempt(completedRoot, "2026-08-01T08:00:00.000Z")],
        completedRoot.id,
      ),
    ).toEqual({
      kind: "new-study",
      exercise: directDependent,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [completedRoot.id],
      },
    });
  });

  it("otherwise chooses the first eligible unpracticed study in library order", () => {
    const root = exercise("root");
    const firstDependent = exercise("first-dependent", [root.id]);
    const secondDependent = exercise("second-dependent", [root.id]);

    expect(
      recommendNextStudy([root, firstDependent, secondDependent], [attempt(root, "2026-08-01T08:00:00.000Z")], "unrelated-study"),
    ).toEqual({
      kind: "new-study",
      exercise: firstDependent,
      reason: {
        kind: "prerequisites-practiced",
        prerequisiteExerciseIds: [root.id],
      },
    });
  });

  it("requires current-revision evidence for every prerequisite and ignores unknown attempts", () => {
    const firstPrerequisite = exercise("first-prerequisite", [], 2);
    const secondPrerequisite = exercise("second-prerequisite");
    const dependent = exercise("dependent", [firstPrerequisite.id, secondPrerequisite.id]);
    const attempts: StudyAttemptEvidence[] = [
      attempt(firstPrerequisite, "2026-08-01T08:00:00.000Z", 1),
      attempt(secondPrerequisite, "2026-08-01T08:05:00.000Z"),
      { exerciseId: "unknown", exerciseRevision: 1, completedAt: "2026-08-01T08:10:00.000Z" },
    ];

    expect(recommendNextStudy([firstPrerequisite, secondPrerequisite, dependent], attempts, secondPrerequisite.id)).toEqual({
      kind: "new-study",
      exercise: firstPrerequisite,
      reason: { kind: "prerequisite-free" },
    });
  });

  it("does not use attempt quality or input telemetry to choose a study", () => {
    const root = exercise("root");
    const dependent = exercise("dependent", [root.id]);
    const completedAt = "2026-08-01T08:00:00.000Z";
    const leanEvidence = [attempt(root, completedAt)];
    const enrichedAttempt: CompletedAttemptRecord = {
      schemaVersion: 1,
      id: "telemetry-heavy-attempt",
      exerciseId: root.id,
      exerciseRevision: root.revision,
      startedAt: "2026-08-01T07:59:30.000Z",
      completedAt,
      inputKind: "native-midi",
      status: "completed",
      errorCounts: { outOfOrder: 7, repeated: 5, wrong: 9 },
      timing: {
        tempoBpm: 100,
        assessedIntervals: 4,
        onPulse: 0,
        early: 2,
        late: 2,
        meanAbsoluteErrorMs: 750,
      },
    };

    expect(recommendNextStudy([root, dependent], [enrichedAttempt], root.id)).toEqual(
      recommendNextStudy([root, dependent], leanEvidence, root.id),
    );
  });

  it("uses the latest completion per study and recommends the least-recently practiced study for review", () => {
    const first = exercise("first");
    const second = exercise("second");
    const third = exercise("third");
    const attempts = [
      attempt(first, "2026-08-01T08:00:00.000Z"),
      attempt(first, "2026-08-03T08:00:00.000Z"),
      attempt(second, "2026-08-02T08:00:00.000Z"),
      attempt(third, "2026-08-04T08:00:00.000Z"),
    ];

    expect(recommendNextStudy([first, second, third], attempts, third.id)).toEqual({
      kind: "review",
      exercise: second,
      reason: {
        kind: "least-recently-practiced",
        lastCompletedAt: "2026-08-02T08:00:00.000Z",
      },
    });
  });

  it("uses library order to break equal review timestamps", () => {
    const first = exercise("first");
    const second = exercise("second");
    const completedAt = "2026-08-01T08:00:00.000Z";

    const recommendation = recommendNextStudy([first, second], [attempt(first, completedAt), attempt(second, completedAt)], null);

    expect(recommendation?.kind).toBe("review");
    expect(recommendation?.exercise).toBe(first);
  });

  it("ignores malformed completion timestamps", () => {
    const root = exercise("root");
    const dependent = exercise("dependent", [root.id]);

    expect(
      recommendNextStudy([root, dependent], [{ exerciseId: root.id, exerciseRevision: root.revision, completedAt: "not-a-date" }], root.id),
    ).toEqual({
      kind: "new-study",
      exercise: root,
      reason: { kind: "prerequisite-free" },
    });
  });

  it.each([
    {
      name: "an empty library",
      library: [] as readonly Exercise[],
    },
    {
      name: "duplicate exercise IDs",
      library: [exercise("duplicate"), exercise("duplicate")],
    },
    {
      name: "duplicate prerequisite references",
      library: [exercise("root"), exercise("dependent", ["root", "root"])],
    },
    {
      name: "a missing prerequisite",
      library: [exercise("dependent", ["missing"])],
    },
    {
      name: "a prerequisite cycle",
      library: [exercise("first", ["second"]), exercise("second", ["first"])],
    },
  ])("returns null safely for $name", ({ library }) => {
    expect(recommendNextStudy(library, [], null)).toBeNull();
  });

  it("follows the canonical direct progression after the default study", () => {
    const defaultStudy = exerciseLibrary[0]!;
    const recommendation = recommendNextStudy(exerciseLibrary, [attempt(defaultStudy, "2026-08-01T08:00:00.000Z")], defaultStudy.id);

    expect(recommendation?.kind).toBe("new-study");
    expect(recommendation?.exercise).toBe(exerciseLibrary[1]);
    expect(recommendation?.reason.kind).toBe("direct-dependent");
  });

  it.each([
    {
      patternId: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      combinedId: STEADY_QUARTER_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
    },
    {
      patternId: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      combinedId: STEADY_QUARTER_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
    },
  ])("gates $combinedId on both its untimed pattern and straight-pulse prerequisite", ({ patternId, straightPulseId, combinedId }) => {
    const pattern = requireLibraryExercise(patternId);
    const straightPulse = requireLibraryExercise(straightPulseId);
    const combined = requireLibraryExercise(combinedId);

    const patternOnly = recommendNextStudy(exerciseLibrary, [attempt(pattern, "2026-08-01T08:00:00.000Z")], pattern.id);
    const straightPulseOnly = recommendNextStudy(exerciseLibrary, [attempt(straightPulse, "2026-08-01T08:05:00.000Z")], straightPulse.id);
    expect(patternOnly?.exercise).not.toBe(combined);
    expect(straightPulseOnly?.exercise).not.toBe(combined);

    expect(
      recommendNextStudy(
        exerciseLibrary,
        [attempt(pattern, "2026-08-01T08:00:00.000Z"), attempt(straightPulse, "2026-08-01T08:05:00.000Z")],
        straightPulse.id,
      ),
    ).toEqual({
      kind: "new-study",
      exercise: combined,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [pattern.id, straightPulse.id],
      },
    });
  });

  it.each([
    {
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      evenEighthsId: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
    },
    {
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      evenEighthsId: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $evenEighthsId directly after its straight-pulse prerequisite", ({ straightPulseId, evenEighthsId }) => {
    const straightPulse = requireLibraryExercise(straightPulseId);
    const evenEighths = requireLibraryExercise(evenEighthsId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(straightPulse, "2026-08-01T08:00:00.000Z")], straightPulse.id)).toEqual({
      kind: "new-study",
      exercise: evenEighths,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [straightPulse.id],
      },
    });
  });

  it.each([
    {
      patternId: STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
    },
    {
      patternId: STEP_SKIP_LEFT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $chordTonesId directly after its untimed step-skip prerequisite", ({ patternId, chordTonesId }) => {
    const pattern = requireLibraryExercise(patternId);
    const chordTones = requireLibraryExercise(chordTonesId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(pattern, "2026-08-01T08:00:00.000Z")], pattern.id)).toEqual({
      kind: "new-study",
      exercise: chordTones,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [pattern.id],
      },
    });
  });

  it.each([
    {
      cMajorId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      oppositeCMajorId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
    },
    {
      cMajorId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      oppositeCMajorId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $dMinorId only after its matching C-major chord-tone study", ({ cMajorId, oppositeCMajorId, dMinorId }) => {
    const cMajor = requireLibraryExercise(cMajorId);
    const oppositeCMajor = requireLibraryExercise(oppositeCMajorId);
    const dMinor = requireLibraryExercise(dMinorId);

    expect(
      recommendNextStudy(exerciseLibrary, [attempt(oppositeCMajor, "2026-08-01T08:00:00.000Z")], oppositeCMajor.id)?.exercise,
    ).not.toBe(dMinor);
    expect(recommendNextStudy(exerciseLibrary, [attempt(cMajor, "2026-08-01T08:05:00.000Z")], cMajor.id)).toEqual({
      kind: "new-study",
      exercise: dMinor,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [cMajor.id],
      },
    });
  });

  it.each([
    {
      dMinorChordTonesId: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      oppositeDMinorChordTonesId: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      ascentId: D_MINOR_FIVE_NOTE_ASCENT_RIGHT_HAND_EXERCISE_ID,
    },
    {
      dMinorChordTonesId: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      oppositeDMinorChordTonesId: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      ascentId: D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "recommends $ascentId only after its matching D-minor chord-tone study",
    ({ dMinorChordTonesId, oppositeDMinorChordTonesId, ascentId }) => {
      const dMinorChordTones = requireLibraryExercise(dMinorChordTonesId);
      const oppositeDMinorChordTones = requireLibraryExercise(oppositeDMinorChordTonesId);
      const ascent = requireLibraryExercise(ascentId);

      expect(
        recommendNextStudy(exerciseLibrary, [attempt(oppositeDMinorChordTones, "2026-08-01T08:00:00.000Z")], oppositeDMinorChordTones.id)
          ?.exercise,
      ).not.toBe(ascent);
      expect(recommendNextStudy(exerciseLibrary, [attempt(dMinorChordTones, "2026-08-01T08:05:00.000Z")], dMinorChordTones.id)).toEqual({
        kind: "new-study",
        exercise: ascent,
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [dMinorChordTones.id],
        },
      });
    },
  );

  it.each([
    {
      cMajorId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      brokenChordId: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
    },
    {
      cMajorId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      brokenChordId: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "prioritizes $dMinorId before eligible timed C-major elaboration after the shared chord-tone prerequisite",
    ({ cMajorId, straightPulseId, dMinorId, brokenChordId }) => {
      const cMajor = requireLibraryExercise(cMajorId);
      const straightPulse = requireLibraryExercise(straightPulseId);
      const dMinor = requireLibraryExercise(dMinorId);
      const brokenChord = requireLibraryExercise(brokenChordId);
      const recommendation = recommendNextStudy(
        exerciseLibrary,
        [attempt(cMajor, "2026-08-01T08:00:00.000Z"), attempt(straightPulse, "2026-08-01T08:05:00.000Z")],
        cMajor.id,
      );

      expect(recommendation?.exercise).toBe(dMinor);
      expect(recommendation?.exercise).not.toBe(brokenChord);
      expect(recommendation?.reason).toEqual({ kind: "direct-dependent", prerequisiteExerciseIds: [cMajor.id] });
    },
  );

  it.each([
    {
      chordTonesId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_RIGHT_HAND_EXERCISE_ID,
      brokenChordId: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
    },
    {
      chordTonesId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      dMinorId: ORDERED_D_MINOR_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      straightPulseId: STEADY_QUARTER_LEFT_HAND_EXERCISE_ID,
      brokenChordId: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "gates $brokenChordId on matching ordered chord tones and straight steady quarters",
    ({ chordTonesId, dMinorId, straightPulseId, brokenChordId }) => {
      const chordTones = requireLibraryExercise(chordTonesId);
      const dMinor = requireLibraryExercise(dMinorId);
      const straightPulse = requireLibraryExercise(straightPulseId);
      const brokenChord = requireLibraryExercise(brokenChordId);

      expect(recommendNextStudy(exerciseLibrary, [attempt(chordTones, "2026-08-01T08:00:00.000Z")], chordTones.id)?.exercise).not.toBe(
        brokenChord,
      );
      expect(
        recommendNextStudy(exerciseLibrary, [attempt(straightPulse, "2026-08-01T08:05:00.000Z")], straightPulse.id)?.exercise,
      ).not.toBe(brokenChord);

      expect(
        recommendNextStudy(
          exerciseLibrary,
          [
            attempt(chordTones, "2026-08-01T08:00:00.000Z"),
            attempt(straightPulse, "2026-08-01T08:05:00.000Z"),
            attempt(dMinor, "2026-08-01T08:10:00.000Z"),
          ],
          chordTones.id,
        ),
      ).toEqual({
        kind: "new-study",
        exercise: brokenChord,
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [chordTones.id, straightPulse.id],
        },
      });
    },
  );

  it.each([
    {
      steadyBrokenChordId: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      oppositeSteadyBrokenChordId: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      threeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
    },
    {
      steadyBrokenChordId: STEADY_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      oppositeSteadyBrokenChordId: STEADY_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      threeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "recommends $threeFourBrokenChordId only after its matching steady broken-chord prerequisite",
    ({ steadyBrokenChordId, oppositeSteadyBrokenChordId, threeFourBrokenChordId }) => {
      const steadyBrokenChord = requireLibraryExercise(steadyBrokenChordId);
      const oppositeSteadyBrokenChord = requireLibraryExercise(oppositeSteadyBrokenChordId);
      const threeFourBrokenChord = requireLibraryExercise(threeFourBrokenChordId);

      expect(
        recommendNextStudy(exerciseLibrary, [attempt(oppositeSteadyBrokenChord, "2026-08-01T08:00:00.000Z")], oppositeSteadyBrokenChord.id)
          ?.exercise,
      ).not.toBe(threeFourBrokenChord);
      expect(recommendNextStudy(exerciseLibrary, [attempt(steadyBrokenChord, "2026-08-01T08:05:00.000Z")], steadyBrokenChord.id)).toEqual({
        kind: "new-study",
        exercise: threeFourBrokenChord,
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [steadyBrokenChord.id],
        },
      });
    },
  );

  it.each([
    {
      threeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      oppositeThreeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      fiveFourPulseId: FIVE_FOUR_PULSE_RIGHT_HAND_EXERCISE_ID,
    },
    {
      threeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_LEFT_HAND_EXERCISE_ID,
      oppositeThreeFourBrokenChordId: THREE_FOUR_BROKEN_CHORD_RIGHT_HAND_EXERCISE_ID,
      fiveFourPulseId: FIVE_FOUR_PULSE_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "recommends $fiveFourPulseId only after its matching 3/4 broken-chord prerequisite",
    ({ threeFourBrokenChordId, oppositeThreeFourBrokenChordId, fiveFourPulseId }) => {
      const threeFourBrokenChord = requireLibraryExercise(threeFourBrokenChordId);
      const oppositeThreeFourBrokenChord = requireLibraryExercise(oppositeThreeFourBrokenChordId);
      const fiveFourPulse = requireLibraryExercise(fiveFourPulseId);

      expect(
        recommendNextStudy(
          exerciseLibrary,
          [attempt(oppositeThreeFourBrokenChord, "2026-08-01T08:00:00.000Z")],
          oppositeThreeFourBrokenChord.id,
        )?.exercise,
      ).not.toBe(fiveFourPulse);
      expect(
        recommendNextStudy(exerciseLibrary, [attempt(threeFourBrokenChord, "2026-08-01T08:05:00.000Z")], threeFourBrokenChord.id),
      ).toEqual({
        kind: "new-study",
        exercise: fiveFourPulse,
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [threeFourBrokenChord.id],
        },
      });
    },
  );

  it.each([
    {
      evenEighthsId: EVEN_EIGHTHS_RIGHT_HAND_EXERCISE_ID,
      repeatedNotesId: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
    },
    {
      evenEighthsId: EVEN_EIGHTHS_LEFT_HAND_EXERCISE_ID,
      repeatedNotesId: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
    },
  ])("recommends $repeatedNotesId directly after its even-eighth prerequisite", ({ evenEighthsId, repeatedNotesId }) => {
    const evenEighths = requireLibraryExercise(evenEighthsId);
    const repeatedNotes = requireLibraryExercise(repeatedNotesId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(evenEighths, "2026-08-01T08:00:00.000Z")], evenEighths.id)).toEqual({
      kind: "new-study",
      exercise: repeatedNotes,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [evenEighths.id],
      },
    });
  });

  it.each([
    {
      repeatedNotesId: REPEATED_NOTES_RIGHT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID,
      mixedPatternId: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
    },
    {
      repeatedNotesId: REPEATED_NOTES_LEFT_HAND_EXERCISE_ID,
      chordTonesId: ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID,
      mixedPatternId: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
    },
  ])("gates $mixedPatternId on repeated-note and ordered-chord-tone practice", ({ repeatedNotesId, chordTonesId, mixedPatternId }) => {
    const repeatedNotes = requireLibraryExercise(repeatedNotesId);
    const chordTones = requireLibraryExercise(chordTonesId);
    const mixedPattern = requireLibraryExercise(mixedPatternId);

    expect(recommendNextStudy(exerciseLibrary, [attempt(repeatedNotes, "2026-08-01T08:00:00.000Z")], repeatedNotes.id)?.exercise).not.toBe(
      mixedPattern,
    );
    expect(recommendNextStudy(exerciseLibrary, [attempt(chordTones, "2026-08-01T08:05:00.000Z")], chordTones.id)?.exercise).not.toBe(
      mixedPattern,
    );

    expect(
      recommendNextStudy(
        exerciseLibrary,
        [attempt(repeatedNotes, "2026-08-01T08:00:00.000Z"), attempt(chordTones, "2026-08-01T08:05:00.000Z")],
        repeatedNotes.id,
      ),
    ).toEqual({
      kind: "new-study",
      exercise: mixedPattern,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [repeatedNotes.id, chordTones.id],
      },
    });
  });

  it.each([
    {
      mixedPatternId: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      oppositeMixedPatternId: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      offbeatId: OFFBEAT_STEP_SKIP_RIGHT_HAND_EXERCISE_ID,
    },
    {
      mixedPatternId: MIXED_EIGHTH_PATTERN_LEFT_HAND_EXERCISE_ID,
      oppositeMixedPatternId: MIXED_EIGHTH_PATTERN_RIGHT_HAND_EXERCISE_ID,
      offbeatId: OFFBEAT_STEP_SKIP_LEFT_HAND_EXERCISE_ID,
    },
  ])(
    "recommends $offbeatId only after its matching mixed-pattern prerequisite",
    ({ mixedPatternId, oppositeMixedPatternId, offbeatId }) => {
      const mixedPattern = requireLibraryExercise(mixedPatternId);
      const oppositeMixedPattern = requireLibraryExercise(oppositeMixedPatternId);
      const offbeat = requireLibraryExercise(offbeatId);

      expect(
        recommendNextStudy(exerciseLibrary, [attempt(oppositeMixedPattern, "2026-08-01T08:00:00.000Z")], oppositeMixedPattern.id)?.exercise,
      ).not.toBe(offbeat);
      expect(recommendNextStudy(exerciseLibrary, [attempt(mixedPattern, "2026-08-01T08:05:00.000Z")], mixedPattern.id)).toEqual({
        kind: "new-study",
        exercise: offbeat,
        reason: {
          kind: "direct-dependent",
          prerequisiteExerciseIds: [mixedPattern.id],
        },
      });
    },
  );

  it("recommends the Beethoven arrangement after its right-hand descent prerequisite", () => {
    const beethoven = requireLibraryExercise(BEETHOVEN_ODE_TO_JOY_OPENING_RIGHT_HAND_EXERCISE_ID);
    const library = prerequisiteClosure(beethoven);
    const attempts = completedDependencies(beethoven);

    expect(recommendNextStudy(library, attempts, FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID)).toEqual({
      kind: "new-study",
      exercise: beethoven,
      reason: { kind: "direct-dependent", prerequisiteExerciseIds: [FIVE_NOTE_DESCENT_RIGHT_HAND_EXERCISE_ID] },
    });
  });

  it("gates the Bach arrangement on both right-hand preparation studies", () => {
    const bach = requireLibraryExercise(BACH_INVENTION_1_OPENING_MOTIF_RIGHT_HAND_EXERCISE_ID);
    const library = prerequisiteClosure(bach);

    expect(recommendNextStudy(library, completedDependencies(bach, [ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID]), null)?.exercise).not.toBe(
      bach,
    );
    expect(recommendNextStudy(library, completedDependencies(bach), ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID)).toEqual({
      kind: "new-study",
      exercise: bach,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [STEP_SKIP_RIGHT_HAND_EXERCISE_ID, ORDERED_CHORD_TONES_RIGHT_HAND_EXERCISE_ID],
      },
    });
  });

  it("gates the Pachelbel arrangement on its complete left-hand preparation chain", () => {
    const pachelbel = requireLibraryExercise(PACHELBEL_CANON_GROUND_BASS_LEFT_HAND_EXERCISE_ID);
    const library = prerequisiteClosure(pachelbel);

    expect(
      recommendNextStudy(library, completedDependencies(pachelbel, [D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID]), null)?.exercise,
    ).not.toBe(pachelbel);
    expect(recommendNextStudy(library, completedDependencies(pachelbel), D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID)).toEqual({
      kind: "new-study",
      exercise: pachelbel,
      reason: {
        kind: "direct-dependent",
        prerequisiteExerciseIds: [ORDERED_CHORD_TONES_LEFT_HAND_EXERCISE_ID, D_MINOR_FIVE_NOTE_ASCENT_LEFT_HAND_EXERCISE_ID],
      },
    });
  });
});

function requireLibraryExercise(id: string): Exercise {
  const exercise = exerciseLibrary.find((candidate) => candidate.id === id);
  if (exercise === undefined) {
    throw new Error(`Missing canonical exercise ${id}`);
  }
  return exercise;
}

function prerequisiteClosure(target: Exercise): readonly Exercise[] {
  const includedIds = new Set<string>([target.id]);
  const visit = (exercise: Exercise): void => {
    for (const prerequisiteId of exercise.prerequisites) {
      if (includedIds.has(prerequisiteId)) {
        continue;
      }
      const prerequisite = requireLibraryExercise(prerequisiteId);
      includedIds.add(prerequisite.id);
      visit(prerequisite);
    }
  };
  visit(target);
  return exerciseLibrary.filter(({ id }) => includedIds.has(id));
}

function completedDependencies(target: Exercise, omittedIds: readonly string[] = []): readonly StudyAttemptEvidence[] {
  const omitted = new Set(omittedIds);
  return prerequisiteClosure(target)
    .filter(({ id }) => id !== target.id && !omitted.has(id))
    .map((exercise, index) => attempt(exercise, `2026-08-01T08:${String(index).padStart(2, "0")}:00.000Z`));
}

function exercise(id: string, prerequisites: readonly string[] = [], revision = 1): Exercise {
  return {
    schemaVersion: 1,
    id,
    revision,
    title: id,
    instructions: `Play ${id}.`,
    evaluationMode: "untimed-ordered-notes",
    difficulty: "beginner",
    expectedEvents: [{ id: `${id}-note`, kind: "note", noteNumber: 60, hand: "right" }],
    source: { kind: "original" },
    prerequisites,
    curriculumTags: [],
    repertoireGoalTags: [],
  };
}

function attempt(exercise: Exercise, completedAt: string, exerciseRevision = exercise.revision): StudyAttemptEvidence {
  return {
    exerciseId: exercise.id,
    exerciseRevision,
    completedAt,
  };
}
