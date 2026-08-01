# Feature: Curriculum

## Blueprint

### Context

The learner wants practical technique, reading, rhythm, coordination, harmony, and motivating music without a game-like progression or a rigid conservatory sequence. The curriculum therefore describes four parallel tracks and the competencies that bridge beginner exercises toward long-term repertoire interests. It guides exercise metadata and the current advisory recommendation while leaving pacing and choice with the learner.

### Current Scope

- The four-track curriculum remains a documented domain model and metadata vocabulary rather than a complete planner or adaptive recommendation engine. A first deterministic advisory recommender is implemented over the canonical exercise library and local completion evidence.
- The thirty canonical beginner exercises, fifteen per hand, cover C-position ascents and descents, untimed C-E-D-F-G step-and-skip patterns, untimed C-E-G-E-C C-major and D-F-A-F-D D-minor ordered chord-tone patterns, untimed D-E-F-G-A D-minor five-note ascents, straight C-D-E-F-G steady-quarter studies, timed C-E-D-F-G step-and-skip studies, C-D-E-F-G even-eighth onset studies, C-C-D-D-E repeated-note onset studies, C-E-D-D-F-G-E-C mixed-pattern onset studies, C-E-D-F-G offbeat-onset studies, C-E-G-E-C-E-G-E steady broken-chord studies, C-E-G-C-E-G-C broken-chord loops in 3/4, and C-D-E-F-G-C five-count pulse studies in 5/4.
- Ascents and descents support keyboard geography and five-finger-pattern work; step-and-skip variants add interval recognition and focused coordination-pattern practice. The C-major chord-tone pair adds a small pitch-membership pattern while preserving individual-note order; the D-minor chord-tone pair transfers that contour into D position and introduces A plus explicit minor-chord vocabulary without assessing harmony recognition. Each D-minor chord-tone study follows its matching C-major chord-tone completion and precedes later timed C-major elaboration in canonical priority. The matching D-minor five-note ascent then activates E and G, adds `patterns-and-technique.minor-scale-preparation`, and names the E-F half-step as instruction without assessing scale construction, interval recognition, or technique. Every exercise also presents its supported natural pitches on a pitch-only treble or bass staff guide, giving visual exposure to the current clef positions. Ten steady-pulse variants add bounded evidence for quarter-note gaps from 40–100 BPM: six use 4/4, two introduce 3/4 guidance, and two introduce 5/4 guidance. The timed step-and-skip pair combines its pulse with previously completed interval-pattern evidence when reached through recommendation; each ascending even-eighth study follows its matching straight steady-quarter completion; each repeated-note study follows its matching ascending even-eighth completion; each mixed-pattern study follows both its matching repeated-note and C-major ordered chord-tone completions; each offbeat study follows its matching mixed pattern; each steady broken-chord study follows both its matching C-major ordered chord-tone and straight steady-quarter completions in that canonical prerequisite order; each 3/4 broken-chord loop follows its matching steady broken-chord completion; and each 5/4 pulse study follows only its matching 3/4 broken-chord completion. Every variant remains hands-separate work and freely selectable.
- On a validated supported staff guide, the learner may choose a transient reading-focus presentation that reduces visible note-name and expected-key answers. It is optional presentation practice, not a separate curriculum node, prerequisite, completion kind, saved preference, or assessed reading result.
- The enhanced home folio may narrow the complete server-rendered library by right or left hand and by the current Notes & reading, Rhythm & coordination, or Patterns & technique track prefixes. Every matching tag prefix contributes, so multi-track studies remain visible under each relevant focus. This transient projection is browsing help rather than a planner, goal, category assignment, recommendation input, or progress signal.
- The twelve pitch-pattern exercises are untimed and provide evidence only for pitch order. The four ordered chord-tone studies may support chord-tone-pattern and interval-recognition exposure; the D-minor chord-tone pair additionally carries `patterns-and-technique.minor-chord-vocabulary`, but completion does not prove simultaneous chord playing, major- or minor-quality recognition, harmonic understanding, voicing, fingering, or hand use. The D-minor ascent pair may support keyboard-geography, interval-recognition, five-finger-pattern, minor-scale-preparation, and hands-separate exposure from metadata, but D-E-F-G-A completion proves neither a complete D-minor scale nor half-step recognition, scale construction, fingering, evenness, hand use, or technique. The ten steady-pulse completions add MIDI onset-interval evidence after the first correct note anchors timing, using a ±0.2-beat tolerance. The straight and timed step-and-skip pairs contain five notes at offsets 0 through 4; the steady broken-chord pair contains eight unique events for C-E-G-E-C-E-G-E at offsets 0 through 7 and assesses seven MIDI-relative gaps; the 3/4 pair contains seven unique events for C-E-G-C-E-G-C at offsets 0 through 6 and assesses six; and the 5/4 pair contains six unique events for C-D-E-F-G-C at offsets 0 through 5 and assesses five. The ascending even-eighth and repeated-note pairs use offsets 0, 0.5, 1, 1.5, and 2 with a ±0.1-beat tolerance while the learner subdivides a quarter-note click; the mixed-pattern pair extends that regular grid through 3.5 and assesses seven intervals; the offbeat pair uses 0, 0.5, 1.5, 2.5, and 3.5 and assesses four later gaps from its first accepted MIDI note. Repeated-note completion supports only ordered repeated note-on and onset-placement evidence. Mixed-pattern completion supports only its ordered C-E-D-D-F-G-E-C pitches and onset placement. Offbeat completion supports only C-E-D-F-G pitch order and four MIDI-relative timing gaps; it cannot prove audible downbeat or between-click alignment. Steady broken-chord completion supports only its eight ordered pitches and seven MIDI-relative timing gaps; it cannot prove audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, declared-hand use, relaxation, harmony recognition, staff reading, consistency, or mastery. The 3/4 loop completion supports only seven ordered pitches and six MIDI-relative whole-beat gaps; its canonical meter, three-beat count-in, pulse wrap, beat-1 accent, count grouping, and final-C instruction do not prove audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, accent or dynamics, duration, release, legato, rests, fingering, hand use, harmony recognition, staff reading, consistency, or mastery. The 5/4 completion supports only six ordered pitches and five MIDI-relative whole-beat gaps; its canonical meter, five-beat count-in, five-beat visible and audible wrap, beat-1 accent, count grouping, and final-C instruction do not prove audible phase, downbeat, click or measure alignment, 5/4 understanding, counting or grouping, accent or dynamics, duration, release, articulation, fingering, declared-hand use, staff reading, physical technique, consistency, or mastery. No current completion establishes silence, holding, accents, syncopation, physical control, or any other excluded competency. Hand assignment remains instructional and is not verified by MIDI; seeing the staff guide does not prove that the learner read it, and no result establishes dynamics, staff-reading mastery, or physical technique.
- Named artists, protected pieces, and game themes are represented only as future repertoire-goal metadata and competency pathways.
- No copyrighted score, MIDI transcription, recording, lyrics, or substantial melodic reproduction is bundled by this slice.
- After a completed practice attempt, the application suggests one next study or review from declared exercise prerequisites, exact-current-revision retained history, and the current in-memory completion. The recommendation is explained and never limits learner choice.

### Future Scope

- Later recommendation versions may use learner-selected goals, recent difficulty, repeated attempts, tempo progression, or track balance only after those evidence and explanation contracts are explicit.
- Later slices may add original or lawfully sourced content for duration, velocity, rests, tuplets, simultaneous chord playing, broader arpeggios, syncopation, compound or irregular meters, hands-together independence, adaptive tempo, phrasing, and pedal coordination.
- Public-domain, licensed, and user-imported material may be added only with explicit source and rights metadata. MusicXML, full notation frameworks, cloud sync, and AI coaching require separate decisions.

### Architecture

- **Parallel tracks:** Curriculum nodes may belong to more than one track. Tracks organize competencies; they do not form four mutually exclusive ladders.
- **Progression unit:** A node has a stable ID, track tags, competency tags, difficulty, prerequisite node or competency IDs, lawful-content metadata, and one or more canonical exercise IDs when exercises exist.
- **Recommendation boundary:** Current recommendation consumes the ordered validated canonical exercise library, declared prerequisite IDs, retained exact-current-revision completed attempts, and an optional just-completed in-memory record. It returns one canonical exercise and structured reason, does not modify evaluator results, and does not invent absent exercises.
- **Learner control:** Recommendations are suggestions. The learner may repeat, skip, change tracks, or choose motivating material without losing progress or being punished.
- **Folio projection boundary:** Home focus filters consume every matching canonical curriculum-tag prefix, preserve multi-track membership and canonical library order, reset to All/All on every load, and change no curriculum, attempt, recommendation, or evidence state.
- **Staff-reading evidence boundary:** The current pitch guide and optional reading-focus presentation are presentation aids, not assessed curriculum results. MIDI completion may support the exercise's existing pitch/order and optional steady-pulse evidence but cannot reveal whether the learner used note names, hidden accessible semantics, memory, or staff positions. Reading-focus state is not stored with the attempt or supplied to recommendation.
- **Meter-guidance boundary:** Under ADR-060, canonical timing metadata drives count-in length, visible beat count, running-beat wrap, meter labels, and click accents. Those audio and presentation facts guide practice but do not enter curriculum evidence; the evaluator retains only MIDI-relative onset gaps.
- **Dependencies:** Curriculum references canonical exercise IDs; exercises do not depend on UI or staff position. Recommendation depends on canonical exercise and typed attempt data rather than DOM or storage iteration order, and the curriculum and complete chooser remain usable without recommendation history.

### Track 1: Notes and Reading

This track develops keyboard and notation fluency through:

- keyboard geography
- treble clef
- bass clef
- five-finger positions
- short sight-reading patterns
- interval recognition

The current treble subset through C4-A4 and bass subset through C3-A3 cover the staff positions used by all thirty current exercises; the repeated-note pair uses only C through E, the existing C-position studies use at most C through G, and the D-minor chord-tone and five-note ascent pairs use D through A. They connect visible staff position, note name, and keyboard geography. A learner may temporarily hide several visible answers with reading focus, but can reveal them at any time, receives explicit pitch correction after an error, and retains accessible semantic equivalents; completion therefore remains neither a sight-reading test nor reading evidence. Repeated markers in the ordered chord-tone, repeated-note, mixed-pattern, steady broken-chord, 3/4 broken-chord, and 5/4 pulse studies remain occurrence-based and add neither chord, duration, articulation, nor meter notation. The offbeat markers remain equally presentation-spaced and do not draw their timing gaps. The guide has no duration semantics and does not establish general clef fluency, interval reading, rhythmic-notation reading, or staff-reading mastery.

### Track 2: Rhythm and Coordination

This track develops pulse and coordination through:

- steady quarter notes
- eighth-note patterns
- rests
- syncopation
- hands separately
- hands together
- current introductions to 3/4 and 5/4, with later progression through 6/8 and 7/4

The eighteen current timed studies offer hands-separate C-D-E-F-G, C-E-D-F-G, C-C-D-D-E, C-E-D-D-F-G-E-C, C-E-G-E-C-E-G-E, C-E-G-C-E-G-C, or C-D-E-F-G-C with a selectable 40–100 BPM tempo and quarter-note click. Fourteen use 4/4 with a four-beat count-in; the C-E-G-C-E-G-C pair uses 3/4 with a three-beat count-in, three-beat visible and audible pulse wrap, and count `1 2 3, 1 2 3, 1`; and the C-D-E-F-G-C pair uses 5/4 with a five-beat count-in, five-beat visible and audible pulse wrap, and count `1 2 3 4 5, 1`. Their first accepted correct note anchors timing; the ten five-note timed studies assess four later correct-note MIDI timestamp deltas, the two six-note 5/4 studies assess five, the two seven-note 3/4 studies assess six, and the four eight-note studies—the mixed-pattern and steady broken-chord pairs—assess seven. The resulting internal `on-pulse`, early, or late evidence compares MIDI-relative gaps with canonical beat gaps and is presented to the learner as on time, early, or late. The timed step-and-skip pair names both the matching untimed step-and-skip and straight steady-quarter studies as advisory prerequisites. The ascending even-eighth pair requires only the matching straight steady-quarter completion; the repeated-note pair requires only the matching ascending even-eighth completion; the mixed-pattern pair requires both the matching repeated-note and ordered chord-tone completions; the offbeat pair requires only the matching mixed-pattern completion; the steady broken-chord pair requires, in canonical order, the matching ordered chord-tone and straight steady-quarter completions; the 3/4 pair requires only the matching steady broken-chord completion; and the 5/4 pair requires only the matching 3/4 completion. Ten studies use integer steady-quarter grids with a proportional ±0.2-beat window, six use a regular eighth grid, and the offbeat pair targets the anchor plus four successive “and” positions; all eight fractional-position studies use a proportional ±0.1-beat window. Pitch errors do not move the anchor, and Web Audio guides rather than scores. Because MIDI and audio clocks remain separate, offbeat, steady broken-chord, 3/4 loop, and 5/4 pulse results do not prove audible phase, downbeat, click, accent, grouping, or measure alignment. Completion supports only the declared short steady-quarter, even-eighth, repeated-note-onset, mixed-pattern-onset, MIDI-relative offbeat-onset, ordered steady broken-chord, 3/4-guided whole-beat-gap, or 5/4-guided whole-beat-gap practice, not meter understanding or counting, rests, silence, release, duration, holding, legato, accents, articulation, dynamics or velocity quality, fingering, declared-hand use, relaxation, harmony recognition, reading, physical technique, consistency, syncopation, hands together, adaptive tempo, written-rhythm reading, mastery, or general rhythm competence.

### Track 3: Patterns and Technique

This broader technique track develops:

- five-finger patterns
- selected Hanon-style coordination patterns
- major and minor scales
- chord inversions
- arpeggios
- evenness and controlled dynamics

The current library contributes short right- and left-hand five-finger ascents and descents, untimed step-and-skip, C-E-G-E-C chord-tone, D-F-A-F-D minor chord-tone, and D-E-F-G-A minor five-note patterns, straight steady-quarter studies, timed step-and-skip variants, even-eighth onset studies, repeated-note onset pairs, C-E-D-D-F-G-E-C mixed-pattern pairs, C-E-D-F-G offbeat-onset pairs, C-E-G-E-C-E-G-E steady broken-chord pairs, C-E-G-C-E-G-C broken-chord loops with 3/4 guidance, and C-D-E-F-G-C five-count patterns with 5/4 guidance. These establish small pattern choices and bounded pulse, subdivision, repeated-onset, mixed-onset, MIDI-relative offbeat-onset, ordered broken-chord-onset, or whole-beat-gap evidence without claiming complete-scale knowledge, simultaneous chord execution, harmony recognition, audible meter performance, 5/4 understanding or counting, or the rests, silence, release, duration, holding, legato, accents, articulation, dynamics or velocity quality, syncopation, fingering, hand use, relaxation, reading, movement, physical technique, mastery, and sustained consistency required for broader technique assessment.

Hanon-style patterns are optional tools for coordination, even timing, hand synchronization, controlled velocity, relaxed movement, and gradual tempo development. They do not define the whole curriculum. Progressions should favor short, focused variants such as right hand untimed, left hand untimed, hands separately with pulse, hands together slowly, even-velocity mode, quiet controlled mode, transposition, and evidence of consistent hand-leading or volume imbalance.

The curriculum must not prescribe daily completion of every Hanon exercise, speed for its own sake, excessive repetition, playing through tension, or the claim that mechanical repetition alone produces complete technique. MIDI may reveal timing or velocity patterns but cannot prove relaxation, finger strength, or healthy movement.

### Track 4: Repertoire Pathways

Repertoire pathways connect motivating goals to original, public-domain, licensed, or user-provided preparatory work:

- **“Square Hammer” pathway:** repeated-chord rhythm, syncopation, steady pulse, minor-key chord vocabulary, voicing changes, and hand coordination.
- **Progressive rock and metal interests:** original material may develop odd-meter pulse, repeated-note control, syncopation, octave movement, chord vocabulary, arpeggios, and hand independence without imitating protected melodies or distinctive passages from Dream Theater, Opeth, Iron Maiden, Ghost, Haken, Leprous, Liquid Tension Experiment, Judas Priest, Riverside, or Symphony X.
- **Dream Theater “Octavarium” goal:** selected passages remain goal metadata; preparatory nodes may develop scales, arpeggios, hand independence, tempo control, and odd-meter fluency without reproducing the keyboard solo.
- **Sibelius pathway:** “Romance,” “Valse triste,” and “The Spruce” remain goal metadata until a lawful edition or user-provided material is available. Preparatory competencies include lyrical phrasing, balance, arpeggiated accompaniment, pedal coordination, voicing, and controlled dynamics.
- **The Legend of Zelda pathway:** themes remain goal metadata. Original preparatory work may develop melody with accompaniment, interval reading, phrasing, broken chords, and meter changes without reproducing protected themes.

Source status must be verified for the intended jurisdiction and edition; a composer, work, or game being familiar or old does not by itself authorize bundled content.

### Progression and Recommendation Rules

- Prerequisites express needed competencies, not mandatory time served or a single global level.
- Difficulty is descriptive and may vary by tempo, hand assignment, rhythmic complexity, range, or coordination demand.
- A prerequisite is satisfied for recommendation only by a retained completion whose exercise ID and revision match the current canonical prerequisite exactly, or by the current page's just-completed matching record.
- Each `steady-quarter-broken-chord-c-major-*` study declares its matching `ordered-chord-tones-c-major-*` study first and matching `steady-quarter-c-major-*` study second. Both exact-current-revision completions are required for recommendation eligibility, and completing either prerequisite can make the broken-chord study an eligible direct dependent only when the other is already satisfied.
- Each `ordered-chord-tones-d-minor-*` study declares only its matching `ordered-chord-tones-c-major-*` study. Exact-current-revision same-hand completion makes the D-minor transfer eligible; its canonical placement immediately after the C-major pair gives that transfer priority when a just-completed C-major study has multiple eligible direct dependents.
- Each `five-note-ascent-d-minor-*` study declares only its matching `ordered-chord-tones-d-minor-*` study. Exact-current-revision same-hand completion makes the five-note ascent an eligible direct dependent; opposite-hand evidence does not, and either ascent remains freely selectable without prerequisite history.
- Each `three-four-broken-chord-c-major-*` study declares only its matching `steady-quarter-broken-chord-c-major-*` study. That exact-current-revision completion makes the 3/4 loop an eligible direct dependent without turning the prerequisite into mastery evidence.
- Each `five-four-pulse-c-major-*` study declares only its matching `three-four-broken-chord-c-major-*` study. That matching-hand exact-current-revision completion makes the 5/4 pulse study an eligible direct dependent; opposite-hand or unrelated completion evidence does not, and the study remains freely selectable without it.
- After completion, prefer the first eligible uncompleted direct dependent of the just-completed exercise. Every prerequisite on the candidate must be satisfied; sharing only that prerequisite is insufficient.
- If no direct dependent qualifies, suggest the first eligible uncompleted exercise in canonical library order. With readable empty current history, this is the first prerequisite-free exercise.
- If all current exercises have matching completion evidence, suggest the exercise practiced least recently; canonical library order resolves equal completion timestamps.
- Error counts, timing classifications, tempo, velocity, and input kind do not affect this first recommendation version. A completion is evidence of sequence completion, not mastery or quality.
- Missing prerequisite references, prerequisite cycles, unavailable history, or an unresolved candidate yield no recommendation and a neutral complete-library fallback.
- Recommendations identify why they were suggested and avoid streak pressure, punitive regression, opaque scores, unlock language, or mastery claims. The learner may always select, repeat, or skip any exercise.

### Edge Cases

- Curriculum validation rejects duplicate node IDs, missing exercise references, unknown prerequisite references, and prerequisite cycles.
- A node can appear in several tracks without being duplicated or producing conflicting progress records.
- Readable history with no current-revision evidence yields the first prerequisite-free beginner study; unavailable history yields the complete learner-selected library, never a negative assessment.
- An attempt for an old exercise revision does not satisfy the current revision's prerequisite or completed status.
- Bounded local retention may evict an old completion; once absent, it no longer contributes evidence and an earlier exercise may be suggested without describing lost mastery or regression.
- A history read failure, missing prerequisite reference, or direct or transitive prerequisite cycle leaves recommendation unavailable while preserving the learner's selected exercise and complete chooser.
- A repertoire goal without lawful exercise content remains visible as a goal but cannot be launched as an exercise.
- A learner may choose a harder or personally motivating node; the system can show prerequisites without blocking access unless a later safety or content constraint is documented.
- An untimed exercise result cannot satisfy a timing-specific, velocity-specific, pedaling, staff-reading, or hands-together competency.
- A steady-quarter result can support only its declared hands-separate pitch-order and MIDI-relative pulse competencies at the selected tempo. The steady broken-chord pair adds only eight ordered C-E-G-E-C-E-G-E pitches and seven relative gaps at offsets 0 through 7 with a ±0.2-beat window. The 3/4 pair adds only seven ordered C-E-G-C-E-G-C pitches and six relative whole-beat gaps at offsets 0 through 6 with the same tolerance; neither its canonical meter nor its three-beat audio and visual guidance can establish audible phase, downbeat, click or measure alignment, 3/4 counting or grouping, beat-1 accent or dynamics, duration, release, legato, rests, fingering, declared-hand use, relaxation, harmony recognition, staff reading, consistency, mastery, hands-together, adaptive-tempo, or physical-technique competencies. The 5/4 pair adds only six ordered C-D-E-F-G-C pitches and five relative whole-beat gaps at offsets 0 through 5; its canonical meter, five-beat count-in, visible and audible wrap, instruction grouping, and final-C cue cannot establish 5/4 understanding, counting or grouping, audible phase, downbeat, click or measure alignment, accent or dynamics, duration, release, articulation, fingering, declared-hand use, staff reading, physical technique, consistency, or mastery.
- An even-eighth, repeated-note, mixed-pattern, or offbeat result can support only its declared hands-separate fractional-onset competency at the selected tempo. Repeated-note metadata may additionally identify the practiced adjacent-pitch pattern, mixed-pattern metadata may identify the practiced C-E-D-D-F-G-E-C order, and offbeat metadata may identify the guided C-E-D-F-G onset pattern. Because the first accepted note anchors MIDI time independently from Web Audio, no offbeat result establishes audible phase. Fractional offsets and note-ons do not support rests, silence, release, duration, holding, accents, articulation, velocity quality, fingering, declared-hand use, relaxation, reading, consistency, written notation, syncopation, simultaneity, hands-together, adaptive-tempo, mastery, or physical-technique competencies.
- The presence of a pitch guide does not change either evidence rule. If a future guide cannot support an exercise's range, spelling, or hands, semantic note text remains available without fabricating notation or negative curriculum evidence.

### Anti-Patterns

- Do not turn four tracks into one mandatory linear course.
- Do not make Hanon or speed drills the definition of piano technique.
- Do not reward excessive repetition, daily streaks, ranks, lives, punitive scores, or comparison with other learners.
- Do not claim a MIDI-only result proves posture, relaxation, fingering, strength, or teacher-level assessment.
- Do not promote visibility of the pitch guide or successful MIDI completion into staff-reading mastery, sight-reading evidence, or proof of clef fluency.
- Do not promote use of reading focus into a curriculum node, prerequisite, recommendation signal, saved achievement, or evidence that visible staff positions caused the correct performance.
- Do not copy protected repertoire into “inspired-by” exercises through recognizable melodies, substantial passages, transcriptions, recordings, or lyrics.
- Do not assume public-domain status without checking the composition, edition, arrangement, recording, and applicable jurisdiction.
- Do not let recommendation logic bypass canonical exercise IDs, prerequisites, or source metadata.
- Do not derive recommendation order from rendered cards or persisted-record iteration, use error or timing totals as hidden readiness thresholds, or turn advice into exercise locks.
- Do not present the curriculum as a replacement for a qualified piano teacher.

## Contract

### Definition of Done

- [ ] Four parallel tracks and their initial competencies are documented.
- [ ] The thirty current exercises—fifteen per hand, twelve untimed, and eighteen timed—are mapped only to keyboard-geography, interval, hands-separate guidance, pattern, ordered chord-tone, minor-chord-vocabulary and minor-scale-preparation exposure, steady-quarter, steady broken-chord onset, 3/4-guided whole-beat-gap, 5/4-guided whole-beat-gap, even-eighth, repeated-note onset, mixed-pattern onset, and MIDI-relative offbeat-onset competencies they actually exercise, without claiming the evaluator verifies complete-scale knowledge, half-step recognition, harmony recognition, audible phase, downbeat, accent, grouping, measure alignment, meter understanding or counting, hand use, or physical technique.
- [ ] The current treble and bass pitch guides are documented as staff-position exposure only, with no duration meaning or staff-reading evidence inferred from completion.
- [ ] Reading focus is documented as an optional transient presentation that changes no exercise, attempt, competency, prerequisite, history, or recommendation evidence.
- [ ] The home folio exposes transient inclusive filters for the three current launchable track prefixes and right/left hand while the complete canonical library remains freely selectable by default and without JavaScript.
- [ ] The eighteen timed studies comprise fourteen in 4/4, two in 3/4, and two in 5/4. The two straight steady-quarter studies require their matching untimed ascents, while each timed step-and-skip study requires its matching untimed step-and-skip and straight steady-quarter studies; those four five-note studies and the two eight-note steady broken-chord studies contribute bounded 4/4 quarter-pulse evidence at the selected 40–100 BPM tempo with a ±0.2-beat window. Each 3/4 broken-chord loop requires only its matching steady broken-chord study and uses the same tolerance for seven events at offsets 0–6 with a three-beat count-in. Each 5/4 pulse study requires only its matching 3/4 broken-chord study and uses the same tolerance for six C-D-E-F-G-C events at offsets 0–5 with a five-beat count-in. Each ascending even-eighth study requires only its matching straight steady-quarter study, each repeated-note study requires only its matching ascending even-eighth study, each mixed-pattern study requires both its matching repeated-note and ordered chord-tone studies, and each offbeat study requires only its matching mixed pattern. Ten studies use the integer steady-pulse grid, six use the regular eighth grid, and two use the downbeat-then-offbeat pattern; all eight fractional-position studies use a ±0.1-beat window. The ten five-note timed studies assess four intervals, the two six-note 5/4 studies assess five, the two seven-note 3/4 studies assess six, and the four eight-note studies—the mixed-pattern and steady broken-chord pairs—assess seven.
- [ ] Each C-major ordered chord-tone study requires only its matching untimed step-and-skip study. Each D-minor chord-tone study requires only its matching C-major chord-tone study and additionally carries `patterns-and-technique.minor-chord-vocabulary`; all four retain chord-tone-pattern, interval-recognition, and hands-separate tags without creating simultaneous-chord, chord-quality-recognition, or harmony-assessment evidence. Each D-minor five-note ascent requires only its matching D-minor chord-tone study and carries, in order, keyboard-geography, interval-recognition, five-finger-pattern, minor-scale-preparation, and hands-separate tags without creating complete-scale, half-step-recognition, fingering, evenness, hand-use, or technique evidence.
- [ ] `steady-quarter-broken-chord-c-major-right-hand` and `steady-quarter-broken-chord-c-major-left-hand` each declare the matching ordered chord-tone study followed by the matching straight steady-quarter study as prerequisites and carry `patterns-and-technique.broken-chord-patterns`, `patterns-and-technique.chord-tone-patterns`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, and `notes-and-reading.interval-recognition`.
- [ ] `three-four-broken-chord-c-major-right-hand` and `three-four-broken-chord-c-major-left-hand` each declare only the matching steady broken-chord study as prerequisite and carry `rhythm-and-coordination.three-four-meter`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, `patterns-and-technique.broken-chord-patterns`, `patterns-and-technique.chord-tone-patterns`, and `notes-and-reading.interval-recognition`.
- [ ] `five-four-pulse-c-major-right-hand` and `five-four-pulse-c-major-left-hand` each declare only the matching 3/4 broken-chord study as prerequisite, remain freely selectable without it, use C-D-E-F-G-C at offsets 0–5, and carry, in order, `rhythm-and-coordination.five-four-meter`, `rhythm-and-coordination.steady-quarter-notes`, `rhythm-and-coordination.hands-separately`, `notes-and-reading.keyboard-geography`, and `patterns-and-technique.five-finger-patterns`.
- [ ] Hanon-style work remains a selective part of Patterns and Technique with explicit health and scope limitations.
- [ ] Long-term repertoire interests are represented as competency pathways and metadata only.
- [ ] Curriculum and exercise references use stable canonical IDs.
- [ ] Rights/source metadata gates launchable content.
- [ ] Current recommendation rules remain deterministic, explainable, local-first, exact-revision scoped, and learner-overridable.
- [ ] Eligible direct dependents, eligible canonical-order fallback, empty-history start, all-completed review, invalid graph, and unavailable storage behavior match the study-recommendation contract.
- [ ] The spec is updated in the same change set when tracks, progression, or recommendation contracts change.
- [ ] Validation tests cover references, cycles, multi-track membership, and content eligibility when curriculum runtime data is introduced.

### Regression Guardrails

- Notes and Reading, Rhythm and Coordination, Patterns and Technique, and Repertoire Pathways must remain parallel available tracks.
- Home focus filtering must preserve multi-track membership, canonical order, and learner choice; it must not turn track tags into exclusive categories, saved goals, readiness gates, or recommendation evidence.
- The twelve untimed exercises must not confer verified hand use, timing, dynamics, staff-reading mastery, pedal, fingering, or physical-technique mastery, even though their staff pitch guides are visible. The four ordered chord-tone studies also must not confer simultaneous chord, voicing, chord-quality recognition, harmonic understanding, or harmony-recognition mastery. The D-minor ascent pair must not confer complete-scale knowledge, half-step recognition, scale construction, evenness, or technique mastery.
- The eighteen timed studies must not confer audible downbeat or measure alignment, between-click placement, verified hand use, rests, silence, key release, note duration, holding, legato, accents, articulation, dynamics or velocity quality, fingering, relaxation, harmony recognition, staff reading, physical technique, consistency, written-notation reading, syncopation, hands-together coordination, adaptive tempo, or broad rhythm or technique mastery. Only the eight fractional-position studies may support their declared onset-subdivision competencies; the repeated-note pair adds only adjacent repeated-onset pattern evidence, the mixed-pattern pair adds only its ordered-pitch and onset evidence, the offbeat pair adds only its guided pattern plus four MIDI-relative post-anchor timing facts, the steady broken-chord pair adds only eight ordered pitches plus seven MIDI-relative post-anchor timing facts, the 3/4 pair adds only seven ordered pitches plus six MIDI-relative whole-beat timing facts rather than evidence of 3/4 counting, grouping, accent, or audible alignment, and the 5/4 pair adds only six ordered pitches plus five MIDI-relative whole-beat timing facts rather than evidence of 5/4 understanding, counting, grouping, accent, dynamics, or audible alignment.
- Neither timed completion nor untimed completion may satisfy a staff-reading competency without a future reading-focused evidence contract.
- Reading-focus use must not satisfy that future-evidence requirement: the current toggle is not recorded and cannot establish which cue the learner used.
- Hanon-style exercises must never become a compulsory whole-curriculum routine.
- Named repertoire goals must not imply bundled or launchable protected content.
- Every launchable curriculum exercise must resolve to a validated canonical exercise and lawful source metadata.
- Prerequisite graphs must remain acyclic and missing references must fail validation.
- Recommendations must be explainable from declared metadata and local evidence, with no remote AI dependency in the live practice loop.
- Recommendation must never confer curriculum mastery, alter evaluator evidence, hide an exercise, or make performance error and timing fields into version-one progression gates.
- Learner choice must remain available without streak loss or punitive progression state.

### Verification

- **Current documentation checks:** Review the track vocabulary, inclusive home-folio projection, thirty-exercise mappings, C-major and D-minor ordered chord tones, D-minor five-note ascents, repeated-note, mixed-pattern, offbeat-onset, steady broken-chord, 3/4 broken-chord loop, 5/4 pulse, pitch-guide, and transient reading-focus exposure boundaries, steady-pulse and fractional-onset evidence boundaries, Hanon position, repertoire competency pathways, and explicit current exclusions.
- **Model tests:** Validate IDs, exercise references, prerequisites, cycles, multi-track membership, rights eligibility, exact-revision evidence, and deterministic recommendation tie-breaking.
- **Behavior tests:** Prove that untimed completion updates only supported pitch/pattern competencies; timed completion adds only its bounded steady-quarter, steady broken-chord, 3/4-guided whole-beat-gap, 5/4-guided whole-beat-gap, even-eighth, repeated-note, mixed-pattern, or MIDI-relative offbeat-onset evidence; D-minor ascent eligibility requires the matching-hand D-minor chord-tone completion and rejects opposite-hand evidence; timed step-and-skip eligibility requires both declared prerequisites; ascending even-eighth eligibility requires the matching steady-quarter completion; repeated-note eligibility requires the matching ascending even-eighth completion; mixed-pattern eligibility requires both matching repeated-note and ordered chord-tone completions; offbeat eligibility requires the matching mixed-pattern completion; steady broken-chord eligibility requires the matching ordered chord-tone and straight steady-quarter completions in canonical declaration order; 3/4-loop eligibility requires the matching steady broken-chord completion; 5/4 eligibility requires the matching-hand 3/4 completion and rejects opposite-hand evidence; eligible D-minor ascent, steady, 3/4, and 5/4 studies participate in direct-dependent selection while remaining freely selectable; recommendation ignores performance-quality fields; and missing or evicted history and invalid graphs have a neutral fallback.
- **Coverage target:** When curriculum code exists, all validation failures and recommendation branches remain exercised directly rather than through UI snapshots.

### Scenarios

**Scenario: Classify the current library honestly**

- Given: the learner completes the pitch order for an untimed ascent, descent, or step-and-skip exercise
- When: curriculum evidence is derived from the attempt
- Then: it may support the exercise's keyboard-geography, interval, or pattern competency, but the evaluator does not verify the instructed hand and the result proves no rhythm, dynamics, assessed staff-reading competency, pedaling, fingering, or physical-technique mastery

**Scenario: Record ordered chord-tone preparation honestly**

- Given: the learner completes `ordered-chord-tones-c-major-right-hand` as C4-E4-G4-E4-C4
- When: curriculum evidence is derived from the attempt
- Then: it may support ordered chord-tone-pattern and interval-recognition exposure, but it proves no simultaneous chord, harmony-recognition, voicing, fingering, or hand-use competency

**Scenario: Suggest chord tones after step-and-skip preparation**

- Given: `step-skip-c-major-right-hand` has exact-current-revision completion evidence
- When: recommendation considers `ordered-chord-tones-c-major-right-hand`
- Then: the ordered chord-tone study is eligible from that sole prerequisite while remaining freely selectable without it

**Scenario: Transfer the familiar shape to minor chord tones**

- Given: `ordered-chord-tones-c-major-right-hand` has exact-current-revision completion evidence
- When: recommendation considers `ordered-chord-tones-d-minor-right-hand`
- Then: D-F-A-F-D is the first eligible same-hand direct dependent in canonical order, while completion of it can support only ordered minor-chord-tone vocabulary exposure and proves no chord-quality recognition or harmonic understanding

**Scenario: Activate the D-minor five-note position honestly**

- Given: `ordered-chord-tones-d-minor-right-hand` has exact-current-revision completion evidence
- When: recommendation considers `five-note-ascent-d-minor-right-hand` and the learner later completes D-E-F-G-A
- Then: the ascent is an eligible same-hand direct dependent and may support its declared minor-scale-preparation exposure, while completion proves no complete D-minor scale, half-step recognition, scale construction, fingering, evenness, hand use, or technique

**Scenario: Use the staff as a pitch-reading bridge**

- Given: a current exercise displays its supported treble or bass pitch guide beside note names and keyboard cues
- When: the learner completes the exercise through MIDI
- Then: the guide has exposed the corresponding staff positions, but the attempt records only its existing pitch/order and optional timing evidence and does not satisfy a staff-reading competency

**Scenario: Reduce cues without creating reading evidence**

- Given: the learner completes a current exercise with reading focus active
- When: curriculum evidence and recommendation consume the completion
- Then: they receive the same pitch/order and optional timing facts as guided practice, with no reading-focus record, prerequisite, mastery claim, or recommendation difference

**Scenario: Record bounded steady-pulse evidence**

- Given: the learner completes a steady-quarter study at a selected tempo from 40 through 100 BPM
- When: its timing summary is mapped to curriculum evidence
- Then: it may support the declared hands-separate steady-quarter competency with internal `on-pulse`, early, and late interval evidence, but it does not prove hand use, duration, velocity, subdivisions, syncopation, hands-together playing, adaptive-tempo control, or general rhythm mastery

**Scenario: Record bounded even-eighth onset evidence**

- Given: the learner completes `even-eighths-c-major-right-hand` at a selected tempo from 40 through 100 BPM
- When: its timing summary is mapped to curriculum evidence
- Then: it may support the declared hands-separate half-beat onset-subdivision competency with on-time, early, and late interval evidence, but it does not prove duration, rests, written notation, hand use, velocity, syncopation, simultaneity, or general rhythm mastery

**Scenario: Record repeated-note onset evidence honestly**

- Given: the learner completes `repeated-note-eighths-c-major-right-hand` as C4-C4-D4-D4-E4 at a selected tempo
- When: curriculum evidence is derived from the attempt
- Then: it may support the declared repeated-note-onset pattern and half-beat placement, but it proves no key release, duration, articulation, fingering, relaxation, hand use, or physical control

**Scenario: Combine repeated and chord-tone foundations honestly**

- Given: the learner completes `mixed-eighth-pattern-c-major-right-hand` as C4-E4-D4-D4-F4-G4-E4-C4 after the matching repeated-note and ordered chord-tone studies
- When: curriculum evidence is derived from its eight ordered onsets and seven assessed intervals
- Then: it may support the declared mixed-pattern and half-beat-placement practice, but it proves no duration, release, articulation, fingering, declared-hand use, relaxation, reading, consistency, mastery, or physical control

**Scenario: Record offbeat-onset practice honestly**

- Given: the learner completes `offbeat-step-skip-c-major-right-hand` as C4-E4-D4-F4-G4 at offsets 0, 0.5, 1.5, 2.5, and 3.5
- When: curriculum evidence is derived from its five ordered notes and four assessed intervals
- Then: it may support the declared guided offbeat-onset pattern and MIDI-relative gap practice, but it proves no audible downbeat or between-click alignment, rests, silence, release, duration, holding, accents, articulation, velocity quality, syncopation, fingering, declared-hand use, reading, relaxation, consistency, mastery, or physical control

**Scenario: Record steady broken-chord practice honestly**

- Given: the learner completes `steady-quarter-broken-chord-c-major-right-hand` as C4-E4-G4-E4-C4-E4-G4-E4 at offsets 0 through 7 with a ±0.2-beat window
- When: curriculum evidence is derived from its eight unique ordered events and seven assessed MIDI-relative intervals
- Then: it may support only that ordered-pitch and steady-gap practice, but it proves no audible phase or measure alignment, duration, release, legato, rests, articulation, dynamics or velocity quality, fingering, declared-hand use, relaxation, harmony recognition, staff reading, consistency, or mastery

**Scenario: Introduce 3/4 without overstating evidence**

- Given: the learner completes `three-four-broken-chord-c-major-right-hand` as C4-E4-G4-C4-E4-G4-C4 at offsets 0 through 6 with a three-beat count-in
- When: curriculum evidence is derived from its seven ordered events and six assessed MIDI-relative intervals
- Then: it may support only the declared broken-chord loop and whole-beat-gap practice, while the count-in, pulse wrap, beat-1 click accent, grouped count, and final-C instruction prove no audible alignment, 3/4 counting or grouping, learner accent, dynamics, duration, fingering, hand use, harmony recognition, reading, consistency, or mastery

**Scenario: Introduce 5/4 without overstating evidence**

- Given: the learner completes `five-four-pulse-c-major-right-hand` as C4-D4-E4-F4-G4-C4 at offsets 0 through 5 with a five-beat count-in
- When: curriculum evidence is derived from its six ordered events and five assessed MIDI-relative intervals
- Then: it may support only that C-position sequence and whole-beat-gap practice, while the canonical meter, count-in, five visible beats, audio wrap, click accent, count instruction, and final-C cue prove no 5/4 understanding, counting or grouping, audible phase, downbeat, click or measure alignment, performed accent or dynamics, duration, release, articulation, fingering, declared-hand use, staff reading, physical technique, consistency, or mastery

**Scenario: Require both steady broken-chord foundations**

- Given: `steady-quarter-broken-chord-c-major-right-hand` declares `ordered-chord-tones-c-major-right-hand` first and `steady-quarter-c-major-right-hand` second
- When: recommendation has exact-current-revision completion evidence for only one prerequisite
- Then: the broken-chord study is ineligible; after both are satisfied it can be selected as an eligible direct dependent of the just-completed prerequisite while remaining freely selectable throughout

**Scenario: Continue from a steady broken chord into 3/4 guidance**

- Given: `steady-quarter-broken-chord-c-major-right-hand` has exact-current-revision completion evidence
- When: recommendation considers `three-four-broken-chord-c-major-right-hand`
- Then: the 3/4 loop is eligible as a direct dependent from that sole prerequisite, remains freely selectable without it, and receives no meter-readiness or mastery claim

**Scenario: Continue from matching 3/4 into 5/4 guidance**

- Given: `three-four-broken-chord-c-major-right-hand` has exact-current-revision completion evidence
- When: recommendation considers `five-four-pulse-c-major-right-hand`
- Then: the 5/4 study is eligible as a direct dependent from that sole matching-hand prerequisite, remains freely selectable without it, rejects the opposite-hand 3/4 completion as prerequisite evidence, and receives no meter-readiness or mastery claim

**Scenario: Combine a known pattern with a known pulse**

- Given: the learner has exact-current-revision completions for one hand's untimed step-and-skip and straight steady-quarter studies
- When: recommendation considers the matching timed step-and-skip study
- Then: that study is eligible as a direct combination of the two declared prerequisites while remaining freely selectable before either completion

**Scenario: Move between parallel tracks**

- Given: the learner recently practiced a Notes and Reading exercise
- When: they choose an available Patterns and Technique or Rhythm and Coordination exercise
- Then: the curriculum permits the change without resetting progress or applying a penalty

**Scenario: Use a Hanon-style pattern selectively**

- Given: a short coordination pattern is available
- When: it is placed in the curriculum
- Then: it appears within Patterns and Technique with a focused goal, gradual progression, and reminders against tension and excessive repetition

**Scenario: Show a protected repertoire goal**

- Given: “Square Hammer,” “Octavarium,” a Sibelius piece, or a Zelda theme is listed as a long-term goal
- When: the pathway is displayed before lawful exercise content exists
- Then: it shows prerequisite competencies and goal metadata but offers no unlicensed score, MIDI, audio, lyrics, or substantial melody

**Scenario: Recommend a direct next study**

- Given: the learner just completed the current revision of an exercise and the first uncompleted direct dependent has every prerequisite satisfied
- When: recommendation is requested
- Then: the direct dependent is suggested with an explanation that it builds on the completed study, while every other exercise remains selectable

**Scenario: Review after completing the library**

- Given: every current exercise revision has retained completion evidence
- When: recommendation is requested
- Then: the exercise whose newest matching completion is oldest is suggested for review, with canonical library order breaking timestamp ties

**Scenario: Ignore quality fields in the first recommender**

- Given: two histories have the same completion identities and timestamps but different error counts, timing classifications, tempo, or input kinds
- When: each history is evaluated
- Then: both produce the same recommendation because this version does not infer readiness or mastery from performance quality

**Scenario: Retained evidence disappears**

- Given: a prior exact-revision completion was evicted from bounded local history
- When: recommendation is requested again
- Then: the missing completion no longer satisfies a prerequisite and the learner receives a neutral available choice without regression or lost-mastery language

**Scenario: Curriculum contains a prerequisite cycle**

- Given: two or more curriculum nodes depend on each other transitively
- When: curriculum data is validated
- Then: validation fails before recommendation, no partial route is guessed, and direct exercise choice remains available
