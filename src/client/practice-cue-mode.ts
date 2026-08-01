export type PracticeCueMode = "guided" | "reading-focus";

export interface PracticeCueModeState {
  getMode(): PracticeCueMode;
  subscribe(listener: () => void): void;
}

interface CueModeRoot {
  setAttribute(name: string, value: string): void;
}

interface CueModeToggle {
  disabled: boolean;
  hidden: boolean | string;
  addEventListener(type: "click", listener: () => void): void;
  setAttribute(name: string, value: string): void;
}

export function initializePracticeCueMode(root: CueModeRoot, toggle: CueModeToggle, hasCompleteStaffGuide: boolean): PracticeCueModeState {
  let mode: PracticeCueMode = "guided";
  const listeners = new Set<() => void>();

  const render = (): void => {
    root.setAttribute("data-cue-mode", mode);
    toggle.setAttribute("aria-pressed", mode === "reading-focus" ? "true" : "false");
    for (const listener of listeners) {
      listener();
    }
  };

  render();
  toggle.hidden = !hasCompleteStaffGuide;
  toggle.disabled = !hasCompleteStaffGuide;

  if (!hasCompleteStaffGuide) {
    return createState();
  }

  toggle.addEventListener("click", () => {
    mode = mode === "guided" ? "reading-focus" : "guided";
    render();
  });

  return createState();

  function createState(): PracticeCueModeState {
    return {
      getMode: () => mode,
      subscribe(listener): void {
        listeners.add(listener);
      },
    };
  }
}
