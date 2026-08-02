import { describe, expect, it } from "vitest";
import {
  isFolioCurriculumFocus,
  isFolioFocusFilter,
  isFolioHandFilter,
  isFolioStudyTiming,
  isFolioTimingFilter,
  matchesFolioFilter,
  projectFolioCurriculumFocuses,
  projectFolioStudyTiming,
} from "./folio-filter.js";

describe("projectFolioCurriculumFocuses", () => {
  it("projects every known curriculum prefix once in display order", () => {
    expect(
      projectFolioCurriculumFocuses([
        "patterns-and-technique.five-finger-patterns",
        "notes-and-reading.keyboard-geography",
        "patterns-and-technique.step-skip-coordination",
        "rhythm-and-coordination.hands-separately",
        "repertoire.public-domain",
      ]),
    ).toEqual(["notes-and-reading", "rhythm-and-coordination", "patterns-and-technique", "repertoire"]);
  });

  it("ignores unrelated metadata while accepting a track-level tag", () => {
    expect(projectFolioCurriculumFocuses(["repertoire-pathways.future-goal", "notes-and-reading"])).toEqual(["notes-and-reading"]);
  });
});

describe("projectFolioStudyTiming", () => {
  it("maps canonical evaluation modes to learner-facing timing membership", () => {
    expect(projectFolioStudyTiming("untimed-ordered-notes")).toBe("untimed");
    expect(projectFolioStudyTiming("timed-ordered-notes")).toBe("timed");
  });
});

describe("matchesFolioFilter", () => {
  const rightHandStudy = {
    hand: "right",
    focuses: ["notes-and-reading", "patterns-and-technique"],
    timing: "untimed",
  } as const;

  it("shows every study for the default filters", () => {
    expect(matchesFolioFilter(rightHandStudy, { focus: "all", hand: "all", timing: "all" })).toBe(true);
  });

  it("matches every active focus, hand, and timing facet", () => {
    expect(matchesFolioFilter(rightHandStudy, { focus: "patterns-and-technique", hand: "right", timing: "untimed" })).toBe(true);
    expect(matchesFolioFilter(rightHandStudy, { focus: "rhythm-and-coordination", hand: "right", timing: "untimed" })).toBe(false);
    expect(matchesFolioFilter(rightHandStudy, { focus: "notes-and-reading", hand: "left", timing: "untimed" })).toBe(false);
    expect(matchesFolioFilter(rightHandStudy, { focus: "notes-and-reading", hand: "right", timing: "timed" })).toBe(false);
  });

  it("includes a both-hands study under either participating hand", () => {
    const bothHandsStudy = { hand: "both", focuses: ["rhythm-and-coordination"], timing: "timed" } as const;

    expect(matchesFolioFilter(bothHandsStudy, { focus: "rhythm-and-coordination", hand: "right", timing: "timed" })).toBe(true);
    expect(matchesFolioFilter(bothHandsStudy, { focus: "rhythm-and-coordination", hand: "left", timing: "timed" })).toBe(true);
  });

  it("keeps a study with no current focus under All only", () => {
    const futureTrackStudy = { hand: "right", focuses: [], timing: "untimed" } as const;

    expect(matchesFolioFilter(futureTrackStudy, { focus: "all", hand: "all", timing: "all" })).toBe(true);
    expect(matchesFolioFilter(futureTrackStudy, { focus: "notes-and-reading", hand: "all", timing: "all" })).toBe(false);
  });
});

describe("folio filter value guards", () => {
  it("accepts only rendered focus, hand, timing, and curriculum-focus values", () => {
    expect(isFolioFocusFilter("all")).toBe(true);
    expect(isFolioFocusFilter("notes-and-reading")).toBe(true);
    expect(isFolioFocusFilter("repertoire")).toBe(true);
    expect(isFolioFocusFilter("repertoire-pathways")).toBe(false);
    expect(isFolioHandFilter("left")).toBe(true);
    expect(isFolioHandFilter("both")).toBe(false);
    expect(isFolioStudyTiming("untimed")).toBe(true);
    expect(isFolioStudyTiming("all")).toBe(false);
    expect(isFolioTimingFilter("timed")).toBe(true);
    expect(isFolioTimingFilter("pulse-guided")).toBe(false);
    expect(isFolioCurriculumFocus("patterns-and-technique")).toBe(true);
    expect(isFolioCurriculumFocus("all")).toBe(false);
  });
});
