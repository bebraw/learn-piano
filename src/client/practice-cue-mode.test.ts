import { describe, expect, it } from "vitest";
import { initializePracticeCueMode } from "./practice-cue-mode.js";

class FakeElement {
  public readonly attributes = new Map<string, string>();

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class FakeToggle extends FakeElement {
  public disabled = true;
  public hidden = true;
  private clickListener: (() => void) | null = null;

  public addEventListener(type: "click", listener: () => void): void {
    if (type === "click") {
      this.clickListener = listener;
    }
  }

  public click(): void {
    this.clickListener?.();
  }
}

describe("initializePracticeCueMode", () => {
  it("starts guided and toggles reading focus only when the complete staff guide is available", () => {
    const root = new FakeElement();
    const toggle = new FakeToggle();

    root.setAttribute("data-cue-mode", "reading-focus");
    toggle.setAttribute("aria-pressed", "true");
    const state = initializePracticeCueMode(root, toggle, true);
    let notifications = 0;
    state.subscribe(() => {
      notifications += 1;
    });

    expect(root.getAttribute("data-cue-mode")).toBe("guided");
    expect(state.getMode()).toBe("guided");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.hidden).toBe(false);
    expect(toggle.disabled).toBe(false);

    toggle.click();
    expect(root.getAttribute("data-cue-mode")).toBe("reading-focus");
    expect(state.getMode()).toBe("reading-focus");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(notifications).toBe(1);

    toggle.click();
    expect(root.getAttribute("data-cue-mode")).toBe("guided");
    expect(state.getMode()).toBe("guided");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(notifications).toBe(2);
  });

  it("fails closed to guided mode when the staff guide is absent or malformed", () => {
    const root = new FakeElement();
    const toggle = new FakeToggle();
    toggle.hidden = false;
    toggle.disabled = false;

    const state = initializePracticeCueMode(root, toggle, false);

    expect(root.getAttribute("data-cue-mode")).toBe("guided");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.hidden).toBe(true);
    expect(toggle.disabled).toBe(true);
    expect(state.getMode()).toBe("guided");

    toggle.click();
    expect(root.getAttribute("data-cue-mode")).toBe("guided");
  });
});
