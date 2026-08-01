# ADR-059: Keep Reading Focus Transient And Presentational

**Status:** Implemented

**Date:** 2026-08-01

## Context

The server-rendered practice page deliberately exposes complete instructions, ordered note text, note names, a next-pitch cue, and an amber expected-key cue. Those aids make every supported exercise understandable without JavaScript and provide an accessible fallback, but a learner who is ready to rely more heavily on the staff needs a way to reduce the visible answers without creating a second exercise or losing the on-screen input.

The current staff adapter validates only a narrow, single-hand natural-note subset. A reading-focused presentation is truthful only when that supported guide is present. MIDI evaluation can still observe pitch, order, and optional onset timing, but it cannot reveal whether the learner read the staff instead of recalling the phrase, using assistive semantics, or following another cue.

Persisting a reduced-cue preference could make a later page unexpectedly difficult, while encoding it in exercise identity, attempt history, or recommendation evidence would overstate a presentation choice as a different musical task or assessed result.

## Decision

Add a learner-controlled `Reading focus` presentation to the progressively enhanced practice page. The server-rendered and no-JavaScript default remains `Guided`, with the complete instructions and cues visible. Client enhancement offers the toggle only after validating that the selected exercise has a supported staff pitch guide.

In reading focus, visually suppress the selected exercise instructions and ordered sequence, textual next-pitch answer, staff and physical-key pitch labels, and the amber expected-key answer. Preserve their semantic or ARIA equivalents so controls, pitch order, and current state remain available to assistive technology. Keep physical-key focus indication and pressed state visible, keep occurrence-based staff progress visible, and retain progress count, count-in, rhythm guidance, timing state, error correction, and completion behavior.

Project correct feedback without naming the played or next pitch while reading focus is active. Explicit wrong, repeated, or out-of-order feedback may name the actual and expected pitches because correction is more useful than preserving the challenge after an error. This is a presentation projection only; the evaluator's structured feedback facts remain unchanged.

The learner may toggle either presentation before or during an attempt. The choice survives an in-page restart but is held only in the current page instance. Exercise navigation, a browser reload, or a new page returns to the guided server default. Do not put reading-focus state in a URL, exercise document, attempt record, history, recommendation evidence, browser storage, or native wrapper state.

Reading focus does not change exercise schema, canonical identity or revision, evaluator behavior, completion, timing, persistence, history, prerequisites, curriculum evidence, or recommendation. Completion while reading focus was visible must not claim staff-reading, sight-reading, clef, fingering, hand-use, or notation mastery.

This decision extends ADR-052's server-rendered progressive-enhancement boundary, ADR-055's reversible staff presentation, and ADR-058's separation of canonical occurrences from physical-key controls. It does not supersede any of them.

## Trigger

The supported pitch guide now provides enough visual staff context for a first reduced-cue practice option without expanding the exercise or evaluator domains.

## Consequences

**Positive:**

- The learner can choose a more staff-centered visual task without losing the dependable guided default or creating duplicate exercises.
- The feature composes with every currently supported exercise, input adapter, timing mode, progress projection, and local history path.
- Keeping semantic labels preserves control meaning and assistive access while visual cues are reduced.
- Transient state avoids migrations, stale preferences, and hidden changes to exercise or attempt identity.

**Negative:**

- Client presentation code and CSS must coordinate several reduced-cue surfaces without hiding focus, pressed state, progress, or correction feedback.
- Because semantic equivalents remain available, reading focus is a sighted visual aid rather than an equivalent hidden-answer mode for every assistive-technology workflow.
- A learner can reveal cues at any time, and an error may reveal the correction; the mode is unsuitable as secure assessment evidence.
- Reloading or navigating intentionally discards the learner's selection.

**Neutral:**

- The server response continues to contain the full canonical instructions, guide, and semantic sequence.
- Reading focus adds no exercise, attempt, preference, storage, analytics, or curriculum record.
- The pitch-only guide still contains no written-duration, rest, articulation, voice, or full-score semantics.

## Alternatives Considered

### Create Reading-Specific Exercise Revisions

Separate exercise IDs or revisions could encode hidden cues, but the expected events and learning task do not change. Duplicate identity would fragment history and recommendations while turning a reversible view choice into canonical domain data.

### Persist The Choice In Browser Storage

Persistence could save one click, but it could also hide essential guidance unexpectedly on the next exercise or visit. It would introduce another local-data lifecycle without improving evaluation evidence.

### Select Reading Focus Through The URL Or Server

A query parameter could produce a server-rendered reduced-cue page, but the no-JavaScript baseline must stay completely understandable and accessible. It would also make shared links encode a transient personal challenge setting.

### Remove Hidden Cues From The Accessibility Tree

Removing pitch labels and state semantics would make the visual challenge stricter, but would weaken keyboard and assistive-technology use. Accessibility meaning takes precedence over treating this learner-controlled aid as an assessment.

### Hide The Physical Keyboard Entirely

Removing the keyboard would eliminate an answer source, but it would also remove the deterministic on-screen input and its focus and pressed feedback. Suppressing its visible pitch and expected-state answers preserves that input path.
