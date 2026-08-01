import {
  DEFAULT_FOLIO_FILTER,
  isFolioCurriculumFocus,
  isFolioFocusFilter,
  isFolioHandFilter,
  matchesFolioFilter,
  type FolioCurriculumFocus,
} from "../curriculum/folio-filter.js";
import type { ExerciseHand } from "../exercises/types.js";

interface VisibilityElementLike {
  hidden: boolean | string;
}

interface TextElementLike extends VisibilityElementLike {
  textContent: string | null;
}

interface FilterControlLike {
  readonly value: string;
  checked: boolean;
  addEventListener(type: "change", listener: () => void): void;
}

interface ResetControlLike {
  disabled: boolean;
  addEventListener(type: "click", listener: () => void): void;
}

export interface HomeFolioFilterItemElements {
  readonly element: VisibilityElementLike;
  readonly focuses: readonly FolioCurriculumFocus[];
  readonly hand: ExerciseHand;
}

export interface HomeFolioFilterElements {
  readonly root: VisibilityElementLike;
  readonly status: TextElementLike;
  readonly resetButton: ResetControlLike;
  readonly focusControls: readonly FilterControlLike[];
  readonly handControls: readonly FilterControlLike[];
  readonly items: readonly HomeFolioFilterItemElements[];
}

export function collectHomeFolioFilterElements(pageDocument: Document): HomeFolioFilterElements {
  const items = [...pageDocument.querySelectorAll<HTMLElement>("[data-folio-entry]")].map((element): HomeFolioFilterItemElements => {
    const hand = readExerciseHand(element.dataset.hand);
    const focuses = (element.dataset.focuses ?? "").split(" ").filter(isFolioCurriculumFocus);
    return { element, focuses, hand };
  });

  return {
    root: requireElement(pageDocument, "folio-filters", HTMLElement),
    status: requireElement(pageDocument, "folio-filter-status", HTMLElement),
    resetButton: requireElement(pageDocument, "folio-filter-reset", HTMLButtonElement),
    focusControls: [...pageDocument.querySelectorAll<HTMLInputElement>("[data-folio-focus-filter]")],
    handControls: [...pageDocument.querySelectorAll<HTMLInputElement>("[data-folio-hand-filter]")],
    items,
  };
}

export function initializeHomeFolioFilter(elements: HomeFolioFilterElements): void {
  const render = (): void => {
    const selectedFocus = elements.focusControls.find((control) => control.checked)?.value;
    const selectedHand = elements.handControls.find((control) => control.checked)?.value;
    const filter = {
      focus: selectedFocus !== undefined && isFolioFocusFilter(selectedFocus) ? selectedFocus : DEFAULT_FOLIO_FILTER.focus,
      hand: selectedHand !== undefined && isFolioHandFilter(selectedHand) ? selectedHand : DEFAULT_FOLIO_FILTER.hand,
    };
    let visibleCount = 0;

    for (const item of elements.items) {
      const visible = matchesFolioFilter(item, filter);
      item.element.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    }

    const studyLabel = elements.items.length === 1 ? "study" : "studies";
    setTextContent(elements.status, `Showing ${visibleCount} of ${elements.items.length} ${studyLabel}`);
    elements.resetButton.disabled = filter.focus === DEFAULT_FOLIO_FILTER.focus && filter.hand === DEFAULT_FOLIO_FILTER.hand;
  };

  const reset = (): void => {
    selectDefault(elements.focusControls, DEFAULT_FOLIO_FILTER.focus);
    selectDefault(elements.handControls, DEFAULT_FOLIO_FILTER.hand);
    render();
  };

  for (const control of [...elements.focusControls, ...elements.handControls]) {
    control.addEventListener("change", render);
  }
  elements.resetButton.addEventListener("click", reset);

  reset();
  elements.root.hidden = false;
}

function selectDefault(controls: readonly FilterControlLike[], defaultValue: string): void {
  for (const control of controls) {
    control.checked = control.value === defaultValue;
  }
}

function readExerciseHand(value: string | undefined): ExerciseHand {
  if (value === "left" || value === "right" || value === "both") {
    return value;
  }
  throw new Error("Home folio entry has an invalid hand");
}

function requireElement<T extends HTMLElement>(pageDocument: Document, id: string, elementType: { new (): T }): T {
  const element = pageDocument.getElementById(id);
  if (!(element instanceof elementType)) {
    throw new Error(`Home page is missing #${id}`);
  }
  return element;
}

function setTextContent(element: TextElementLike, value: string): void {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}
