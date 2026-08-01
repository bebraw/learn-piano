import { describe, expect, it, vi } from "vitest";
import { handlePracticePageHide } from "./practice-page-lifecycle.js";

describe("handlePracticePageHide", () => {
  it("disconnects without permanent disposal when the page enters the back-forward cache", () => {
    const controller = { disconnect: vi.fn(), dispose: vi.fn() };

    handlePracticePageHide(controller, { persisted: true });

    expect(controller.disconnect).toHaveBeenCalledOnce();
    expect(controller.dispose).not.toHaveBeenCalled();
  });

  it("disposes the practice surface when the page is actually unloaded", () => {
    const controller = { disconnect: vi.fn(), dispose: vi.fn() };

    handlePracticePageHide(controller, { persisted: false });

    expect(controller.dispose).toHaveBeenCalledOnce();
    expect(controller.disconnect).not.toHaveBeenCalled();
  });
});
