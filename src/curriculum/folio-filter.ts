import type { ExerciseHand } from "../exercises/types.js";

export const FOLIO_CURRICULUM_FOCUSES = [
  { id: "notes-and-reading", label: "Notes & reading" },
  { id: "rhythm-and-coordination", label: "Rhythm & coordination" },
  { id: "patterns-and-technique", label: "Patterns & technique" },
] as const;

export const FOLIO_FOCUS_FILTERS = [{ id: "all", label: "All" }, ...FOLIO_CURRICULUM_FOCUSES] as const;
export const FOLIO_HAND_FILTERS = [
  { id: "all", label: "All" },
  { id: "right", label: "Right" },
  { id: "left", label: "Left" },
] as const;

export type FolioCurriculumFocus = (typeof FOLIO_CURRICULUM_FOCUSES)[number]["id"];
export type FolioFocusFilter = (typeof FOLIO_FOCUS_FILTERS)[number]["id"];
export type FolioHandFilter = (typeof FOLIO_HAND_FILTERS)[number]["id"];

export interface FolioFilterState {
  readonly focus: FolioFocusFilter;
  readonly hand: FolioHandFilter;
}

export interface FolioFilterableStudy {
  readonly focuses: readonly FolioCurriculumFocus[];
  readonly hand: ExerciseHand;
}

export const DEFAULT_FOLIO_FILTER: FolioFilterState = { focus: "all", hand: "all" };

export function projectFolioCurriculumFocuses(curriculumTags: readonly string[]): readonly FolioCurriculumFocus[] {
  return FOLIO_CURRICULUM_FOCUSES.filter(({ id }) => curriculumTags.some((tag) => tag === id || tag.startsWith(`${id}.`))).map(
    ({ id }) => id,
  );
}

export function matchesFolioFilter(study: FolioFilterableStudy, filter: FolioFilterState): boolean {
  const matchesFocus = filter.focus === "all" || study.focuses.includes(filter.focus);
  const matchesHand = filter.hand === "all" || study.hand === filter.hand || study.hand === "both";
  return matchesFocus && matchesHand;
}

export function isFolioFocusFilter(value: string): value is FolioFocusFilter {
  return FOLIO_FOCUS_FILTERS.some(({ id }) => id === value);
}

export function isFolioHandFilter(value: string): value is FolioHandFilter {
  return FOLIO_HAND_FILTERS.some(({ id }) => id === value);
}

export function isFolioCurriculumFocus(value: string): value is FolioCurriculumFocus {
  return FOLIO_CURRICULUM_FOCUSES.some(({ id }) => id === value);
}
