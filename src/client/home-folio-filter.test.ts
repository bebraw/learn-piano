import { describe, expect, it } from "vitest";
import type { FolioCurriculumFocus, FolioStudyTiming } from "../curriculum/folio-filter.js";
import type { ExerciseHand } from "../exercises/types.js";
import { initializeHomeFolioFilter, type HomeFolioFilterElements } from "./home-folio-filter.js";

class FakeElement {
  public hidden: boolean | string = true;
}

class FakeTextElement extends FakeElement {
  public textContent: string | null = "";
}

class FakeFilterControl {
  public checked = false;
  private readonly listeners: Array<() => void> = [];

  public constructor(public readonly value: string) {}

  public addEventListener(type: "change", listener: () => void): void {
    expect(type).toBe("change");
    this.listeners.push(listener);
  }

  public select(group: readonly FakeFilterControl[]): void {
    for (const control of group) {
      control.checked = control === this;
    }
    for (const listener of this.listeners) {
      listener();
    }
  }
}

class FakeResetControl {
  public disabled = false;
  private readonly listeners: Array<() => void> = [];

  public addEventListener(type: "click", listener: () => void): void {
    expect(type).toBe("click");
    this.listeners.push(listener);
  }

  public click(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

interface FakeStudy {
  readonly element: FakeElement;
  readonly focuses: readonly FolioCurriculumFocus[];
  readonly hand: ExerciseHand;
  readonly timing: FolioStudyTiming;
}

describe("initializeHomeFolioFilter", () => {
  it("opens on the complete folio even when the browser restores stale radio state", () => {
    const page = createElements([study("right", ["notes-and-reading"], "untimed")]);
    page.focusControls[1]!.checked = true;
    page.handControls[2]!.checked = true;
    page.timingControls[2]!.checked = true;
    page.items[0]!.element.hidden = true;

    initializeHomeFolioFilter(page.elements);

    expect(page.root.hidden).toBe(false);
    expect(page.focusControls.map(({ checked }) => checked)).toEqual([true, false, false, false]);
    expect(page.handControls.map(({ checked }) => checked)).toEqual([true, false, false]);
    expect(page.timingControls.map(({ checked }) => checked)).toEqual([true, false, false]);
    expect(page.items[0]!.element.hidden).toBe(false);
    expect(page.status.textContent).toBe("Showing 1 of 1 study");
    expect(page.resetButton.disabled).toBe(true);
  });

  it("composes multi-track focus, hand, and timing filters, then restores every study", () => {
    const page = createElements([
      study("right", ["notes-and-reading", "patterns-and-technique"], "untimed"),
      study("left", ["rhythm-and-coordination", "patterns-and-technique"], "timed"),
      study("right", ["rhythm-and-coordination"], "timed"),
    ]);
    initializeHomeFolioFilter(page.elements);

    page.focusControls[3]!.select(page.focusControls);
    expect(page.items.map(({ element }) => element.hidden)).toEqual([false, false, true]);
    expect(page.status.textContent).toBe("Showing 2 of 3 studies");
    expect(page.resetButton.disabled).toBe(false);

    page.handControls[2]!.select(page.handControls);
    expect(page.items.map(({ element }) => element.hidden)).toEqual([true, false, true]);
    expect(page.status.textContent).toBe("Showing 1 of 3 studies");

    page.timingControls[1]!.select(page.timingControls);
    expect(page.items.every(({ element }) => element.hidden)).toBe(true);
    expect(page.status.textContent).toBe("Showing 0 of 3 studies");

    page.resetButton.click();
    expect(page.items.every(({ element }) => !element.hidden)).toBe(true);
    expect(page.status.textContent).toBe("Showing 3 of 3 studies");
    expect(page.resetButton.disabled).toBe(true);
  });

  it("falls back to the complete folio if a checked control has an unknown value", () => {
    const page = createElements([study("left", ["notes-and-reading"], "untimed"), study("right", ["rhythm-and-coordination"], "timed")]);
    const unknownFocus = new FakeFilterControl("unknown-focus");
    const unknownHand = new FakeFilterControl("unknown-hand");
    const unknownTiming = new FakeFilterControl("unknown-timing");
    page.focusControls.push(unknownFocus);
    page.handControls.push(unknownHand);
    page.timingControls.push(unknownTiming);
    initializeHomeFolioFilter(page.elements);

    unknownFocus.select(page.focusControls);
    unknownHand.select(page.handControls);
    unknownTiming.select(page.timingControls);

    expect(page.items.every(({ element }) => !element.hidden)).toBe(true);
    expect(page.status.textContent).toBe("Showing 2 of 2 studies");
    expect(page.resetButton.disabled).toBe(true);
  });
});

function createElements(items: FakeStudy[]): {
  readonly elements: HomeFolioFilterElements;
  readonly root: FakeElement;
  readonly status: FakeTextElement;
  readonly resetButton: FakeResetControl;
  readonly focusControls: FakeFilterControl[];
  readonly handControls: FakeFilterControl[];
  readonly timingControls: FakeFilterControl[];
  readonly items: FakeStudy[];
} {
  const root = new FakeElement();
  const status = new FakeTextElement();
  const resetButton = new FakeResetControl();
  const focusControls = [
    new FakeFilterControl("all"),
    new FakeFilterControl("notes-and-reading"),
    new FakeFilterControl("rhythm-and-coordination"),
    new FakeFilterControl("patterns-and-technique"),
  ];
  const handControls = [new FakeFilterControl("all"), new FakeFilterControl("right"), new FakeFilterControl("left")];
  const timingControls = [new FakeFilterControl("all"), new FakeFilterControl("untimed"), new FakeFilterControl("timed")];
  const elements: HomeFolioFilterElements = { root, status, resetButton, focusControls, handControls, timingControls, items };
  return { elements, root, status, resetButton, focusControls, handControls, timingControls, items };
}

function study(hand: ExerciseHand, focuses: readonly FolioCurriculumFocus[], timing: FolioStudyTiming): FakeStudy {
  return { element: new FakeElement(), focuses, hand, timing };
}
