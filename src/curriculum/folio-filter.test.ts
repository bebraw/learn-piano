import { describe, expect, it } from "vitest";
import {
  isFolioCurriculumFocus,
  isFolioFocusFilter,
  isFolioHandFilter,
  matchesFolioFilter,
  projectFolioCurriculumFocuses,
} from "./folio-filter.js";

describe("projectFolioCurriculumFocuses", () => {
  it("projects every known curriculum prefix once in display order", () => {
    expect(
      projectFolioCurriculumFocuses([
        "patterns-and-technique.five-finger-patterns",
        "notes-and-reading.keyboard-geography",
        "patterns-and-technique.step-skip-coordination",
        "rhythm-and-coordination.hands-separately",
      ]),
    ).toEqual(["notes-and-reading", "rhythm-and-coordination", "patterns-and-technique"]);
  });

  it("ignores unrelated metadata while accepting a track-level tag", () => {
    expect(projectFolioCurriculumFocuses(["repertoire-pathways.future-goal", "notes-and-reading"])).toEqual(["notes-and-reading"]);
  });
});

describe("matchesFolioFilter", () => {
  const rightHandStudy = {
    hand: "right",
    focuses: ["notes-and-reading", "patterns-and-technique"],
  } as const;

  it("shows every study for the default filters", () => {
    expect(matchesFolioFilter(rightHandStudy, { focus: "all", hand: "all" })).toBe(true);
  });

  it("matches any projected focus and composes it with hand", () => {
    expect(matchesFolioFilter(rightHandStudy, { focus: "patterns-and-technique", hand: "right" })).toBe(true);
    expect(matchesFolioFilter(rightHandStudy, { focus: "rhythm-and-coordination", hand: "right" })).toBe(false);
    expect(matchesFolioFilter(rightHandStudy, { focus: "notes-and-reading", hand: "left" })).toBe(false);
  });

  it("includes a both-hands study under either participating hand", () => {
    const bothHandsStudy = { hand: "both", focuses: ["rhythm-and-coordination"] } as const;

    expect(matchesFolioFilter(bothHandsStudy, { focus: "rhythm-and-coordination", hand: "right" })).toBe(true);
    expect(matchesFolioFilter(bothHandsStudy, { focus: "rhythm-and-coordination", hand: "left" })).toBe(true);
  });

  it("keeps a study with no current focus under All only", () => {
    const futureTrackStudy = { hand: "right", focuses: [] } as const;

    expect(matchesFolioFilter(futureTrackStudy, { focus: "all", hand: "all" })).toBe(true);
    expect(matchesFolioFilter(futureTrackStudy, { focus: "notes-and-reading", hand: "all" })).toBe(false);
  });
});

describe("folio filter value guards", () => {
  it("accepts only rendered focus, hand, and curriculum-focus values", () => {
    expect(isFolioFocusFilter("all")).toBe(true);
    expect(isFolioFocusFilter("notes-and-reading")).toBe(true);
    expect(isFolioFocusFilter("repertoire-pathways")).toBe(false);
    expect(isFolioHandFilter("left")).toBe(true);
    expect(isFolioHandFilter("both")).toBe(false);
    expect(isFolioCurriculumFocus("patterns-and-technique")).toBe(true);
    expect(isFolioCurriculumFocus("all")).toBe(false);
  });
});
