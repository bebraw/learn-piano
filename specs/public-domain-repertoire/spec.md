# Feature: Public-Domain Repertoire Sampler

## Blueprint

### Context

The learner wants recognizable music alongside technical studies. The first repertoire slice must include genuine Bach and other composers at distinct arrangement-relative levels while respecting the difference between a public-domain composition and a potentially protected edition, arrangement, MIDI transcription, or recording.

The current engine evaluates ordered note-on events and can display a bounded natural-note, single-hand pitch guide. It does not represent a complete score, duration, rests, articulation, dynamics, pedal, simultaneous voices, verified hand use, or interpretation. This feature therefore ships short learning arrangements rather than claiming to contain or assess whole works.

### Current Repertoire

| Level        | Canonical exercise                          | Project arrangement                                          | Public-domain reference                                                                                              |
| ------------ | ------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Beginner     | `beethoven-ode-to-joy-opening-right-hand`   | Right-hand C-major opening: E4-E4-F4-G4-G4-F4-E4-D4          | [Public-domain holograph manuscript, 1824](https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN756658373) |
| Intermediate | `bach-invention-1-opening-motif-right-hand` | Right-hand C-position opening motif: C4-D4-E4-F4-D4-E4-C4-G4 | [Public-domain manuscript, ca. 1724](https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN79687395X)       |
| Advanced     | `pachelbel-canon-ground-bass-left-hand`     | Left-hand C-major ground bass: C3-G3-A3-E3-F3-C3-F3-G3       | [Public-domain manuscript, ca. 1838–42](https://digital.staatsbibliothek-berlin.de/werkansicht/?PPN=PPN728499177)    |

The Beethoven melody is independently reduced to its first eight pitches and transposed to C major. The Pachelbel ground bass is independently transposed from D major to C major. The Bach upper-voice motif is independently placed in the current C4-G4 learning range. All three omit original rhythm and are evaluated as untimed pitch order only.

The level rubric is local to these arrangements: beginner uses repeated and neighboring notes inside a compact melody, intermediate adds direction changes and step-skip recall, and advanced uses the left hand across C3-A3 with repeated fourth- and fifth-sized relocations. These labels do not grade the complete works.

The rights review uses the European Commission's [life-plus-70 public-domain guidance](https://intellectual-property-helpdesk.ec.europa.eu/news-events/news/public-domain-2020-11-19_en) for the initial Finland/EU target and score pages that identify public-domain manuscripts or editions. The repository does not copy score files, recordings, MIDI files, engraving, editorial fingering, or source-site assets. Distribution into another jurisdiction requires rechecking both the composition and the selected source.

### Architecture

- **Canonical data:** The sampler consists of schema-version-1, revision-1 exercises in the existing validated library. Every event has a distinct occurrence ID and one instructional hand.
- **Source provenance:** `public-domain` source metadata requires attribution, original work title, rights note, HTTPS reference URL, and adaptation note. These optional schema-version-1 fields remain omitted from existing original exercises.
- **Presentation:** Home cards expose Repertoire, arrangement-relative level, composer attribution, and a public-domain learning-arrangement label. Practice pages additionally show the original work identity, adaptation boundary, rights note, and reference-score link in server HTML.
- **Curriculum:** Each exercise begins with `repertoire.public-domain` and may retain other honest preparation tags. Repertoire is an inclusive folio focus, so an excerpt can also match Notes & reading or Patterns & technique.
- **Progression:** Every sampler entry has advisory prerequisites from the original foundation library. The learner can still open any excerpt directly; prerequisites affect only explainable recommendation order.
- **Evidence:** Completion records use the existing exercise ID and revision and prove only the eight-note order. Difficulty, attribution, and public-domain status create no additional performance evidence.
- **Dependencies:** ADR-064 owns the rights/content boundary. ADR-053 continues to own canonical identity and source metadata, ADR-061 owns transient filtering, and ADR-055 owns the reversible pitch-only notation adapter.

### Anti-Patterns

- Do not call a bounded arrangement the full song, score, or complete performance.
- Do not infer that a composer's public-domain status also frees a modern edition, arrangement, recording, fingering, or MIDI transcription.
- Do not copy recognizable protected repertoire into a supposedly original exercise.
- Do not describe completion as proof of original rhythm, duration, phrasing, dynamics, articulation, pedal, fingering, hand use, reading, interpretation, or mastery.
- Do not use the commonly misattributed BWV Anh. 114 Minuet as a J. S. Bach work.
- Do not use the sampler's level labels as universal grades for the complete original works.

## Contract

### Definition of Done

- [ ] The canonical library contains the three exact eight-note arrangements and retains the existing thirty original foundation studies unchanged.
- [ ] The arrangements are labelled beginner, intermediate, and advanced relative to their bounded learning tasks.
- [ ] Every public-domain source passes the provenance validation contract and renders its source and adaptation details before JavaScript.
- [ ] Every arrangement remains freely selectable, has at least one advisory prerequisite, and appears under the Repertoire folio focus.
- [ ] All three receive a complete supported staff guide and physical-key projection without accidentals, mixed hands, or guessed notation.
- [ ] Completion and history retain the existing pitch/order-only evidence boundary.
- [ ] No third-party score, MIDI, audio, font, or image asset is added to the repository or runtime.
- [ ] Unit, view, and browser tests cover canonical data, provenance validation, Repertoire filtering, source rendering, direct access, and the no-JavaScript baseline.

### Regression Guardrails

- The original thirty-study split—fifteen per hand, twelve untimed, and eighteen timed—must remain testable independently from the expanded catalog total.
- Repertoire exercises must remain after the original foundations in canonical order so existing default and equal-priority recommendation behavior stays stable.
- Missing or unsafe public-domain provenance must fail canonical parsing rather than render an unverified launchable exercise.
- External reference links must be HTTPS, escaped, and non-essential to practice-page operation.
- Source metadata and difficulty must not enter attempt identity, evaluation, timing summaries, or mastery claims.
- A future full-score or licensed-content feature must use an explicit architecture decision rather than silently widening these learning arrangements.

### Verification

- **Library tests:** Exact IDs, revisions, pitches, hands, levels, sources, tags, and prerequisites for all three arrangements; stable original-foundation counts and ordering.
- **Schema tests:** Complete public-domain provenance parses; missing required fields, blank fields, and non-HTTPS reference URLs fail at their exact paths.
- **Projection tests:** Repertoire prefix projection remains inclusive with every other matching curriculum track.
- **View tests:** Cards and practice pages render composer, level, public-domain arrangement label, original work, adaptation note, and safe source link.
- **Browser tests:** Repertoire filtering shows exactly the sampler, reset restores the complete library, direct practice routes stay usable without JavaScript, and the layout remains contained.
- **Quality target:** The baseline quality gate remains green with high source coverage and no new dependency or generated asset.

### Scenarios

**Scenario: Choose genuine Bach**

- Given: the learner selects the Repertoire focus
- When: the sampler is shown
- Then: it includes J. S. Bach's BWV 772 opening motif with Bach attribution, its intermediate learning-arrangement level, and no misattributed Minuet

**Scenario: Inspect the rights and arrangement boundary**

- Given: the learner opens a sampler practice page without JavaScript
- When: the server document renders
- Then: it names the composer and original work, says the composition is public domain, explains the independent bounded arrangement, and links to the reference score

**Scenario: Complete an excerpt honestly**

- Given: the learner plays the eight canonical notes in order
- When: the existing evaluator completes the attempt
- Then: the app records that exercise revision's pitch-order completion without claiming the whole work, original rhythm, fingering, hand use, interpretation, or mastery

**Scenario: Preserve learner choice**

- Given: an excerpt's advisory prerequisites have no saved completion
- When: the learner opens its direct practice URL
- Then: the complete exercise remains playable and recommendation metadata neither locks nor hides it
