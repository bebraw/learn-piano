import type { Exercise } from "../exercises/types.js";
import { projectStaffPitchGuide } from "../notation/staff-pitch-guide.js";
import { escapeHtml } from "./shared.js";

export function renderStaffPitchGuide(exercise: Exercise): string {
  const guide = projectStaffPitchGuide(exercise.expectedEvents);
  if (guide === null) {
    return "";
  }

  const staffLines = guide.staffLines
    .map(
      ({ x1, x2, y }) =>
        `<line class="staff-pitch-line" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" vector-effect="non-scaling-stroke"></line>`,
    )
    .join("");
  const notes = guide.notes
    .map(({ eventId, label, x, y, ledgerLines }, index) => {
      const ledgerLineMarkup = ledgerLines
        .map(
          ({ x1, x2, y: ledgerY }) =>
            `<line class="staff-pitch-ledger" x1="${x1}" x2="${x2}" y1="${ledgerY}" y2="${ledgerY}" vector-effect="non-scaling-stroke"></line>`,
        )
        .join("");
      const noteState = index === 0 ? "expected" : "remaining";

      return `<g
        class="staff-pitch-note"
        id="staff-note-${escapeHtml(eventId)}"
        data-staff-note
        data-event-id="${escapeHtml(eventId)}"
        data-note-state="${noteState}"
        data-note-active="false"
      >
        ${ledgerLineMarkup}
        <ellipse class="staff-pitch-note-halo" cx="${x}" cy="${y}" rx="18" ry="13"></ellipse>
        <ellipse class="staff-pitch-notehead" cx="${x}" cy="${y}" rx="10.5" ry="7"></ellipse>
        <text class="staff-pitch-note-label" x="${x}" y="150" text-anchor="middle">${escapeHtml(label)}</text>
      </g>`;
    })
    .join("");
  const rhythmLabel = formatRhythmLabel(exercise);
  const clefGlyph = guide.clef === "treble" ? "𝄞" : "𝄢";

  return `<figure class="staff-pitch-guide">
    <figcaption class="staff-pitch-guide-caption">
      <span>${escapeHtml(guide.clefLabel)} staff · Pitch guide</span>
      <span>${rhythmLabel}</span>
    </figcaption>
    <svg
      class="staff-pitch-guide-canvas"
      data-staff-pitch-guide
      data-staff-clef="${guide.clef}"
      viewBox="0 0 ${guide.viewBox.width} ${guide.viewBox.height}"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g class="staff-pitch-lines">${staffLines}</g>
      <text class="staff-pitch-clef" x="88" y="${guide.clef === "treble" ? 104 : 91}" text-anchor="middle">${clefGlyph}</text>
      <g class="staff-pitch-notes">${notes}</g>
    </svg>
  </figure>`;
}

function formatRhythmLabel(exercise: Exercise): string {
  if (exercise.evaluationMode === "untimed-ordered-notes") {
    return "Pitch order · No fixed rhythm";
  }

  const usesUnitBeatOffsets = exercise.expectedEvents.every((event, index) => event.beatOffset === index);
  return usesUnitBeatOffsets ? "Pitch order · One note per beat" : "Pitch order · Timing shown separately";
}
