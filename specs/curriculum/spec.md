# Feature: Curriculum

## Blueprint

### Context

The learner wants practical technique, reading, rhythm, coordination, harmony, and motivating music without a game-like progression or a rigid conservatory sequence. The curriculum therefore describes four parallel tracks and the competencies that bridge beginner exercises toward long-term repertoire interests. It guides exercise metadata and the current advisory recommendation while leaving pacing and choice with the learner.

### Current Scope

- The four-track curriculum remains a documented domain model and metadata vocabulary rather than a complete planner or adaptive recommendation engine. A first deterministic advisory recommender is implemented over the canonical exercise library and local completion evidence.
- The ten canonical beginner exercises cover right- and left-hand C-position ascents and descents, an untimed C-E-D-F-G step-and-skip pattern for each hand, a straight C-D-E-F-G steady-quarter study for each hand, and a timed C-E-D-F-G step-and-skip study for each hand.
- Ascents and descents support keyboard geography and five-finger-pattern work; step-and-skip variants add interval recognition and focused coordination-pattern practice. Every exercise also presents its supported natural pitches on a pitch-only treble or bass staff guide, giving visual exposure to the current clef positions. The four steady-quarter variants add bounded evidence for a 4/4 quarter-note pulse from 40–100 BPM, while the timed step-and-skip pair combines that pulse with an already-practiced interval pattern. Every variant remains hands-separate work.
- The six pitch-pattern exercises are untimed and provide evidence only for pitch order. The four steady-quarter completions add MIDI onset-interval evidence after the first correct note anchors timing, using a ±0.2-beat tolerance. Hand assignment remains instructional and is not verified by MIDI; seeing the staff guide does not prove that the learner read it, and no result establishes note duration, velocity quality, dynamics, staff-reading mastery, fingering quality, or physical technique.
- Named artists, protected pieces, and game themes are represented only as future repertoire-goal metadata and competency pathways.
- No copyrighted score, MIDI transcription, recording, lyrics, or substantial melodic reproduction is bundled by this slice.
- After a completed practice attempt, the application suggests one next study or review from declared exercise prerequisites, exact-current-revision retained history, and the current in-memory completion. The recommendation is explained and never limits learner choice.

### Future Scope

- Later recommendation versions may use learner-selected goals, recent difficulty, repeated attempts, tempo progression, or track balance only after those evidence and explanation contracts are explicit.
- Later slices may add original or lawfully sourced content for duration, velocity, rests, eighth notes, chords, arpeggios, syncopation, odd meters, hands-together independence, adaptive tempo, phrasing, and pedal coordination.
- Public-domain, licensed, and user-imported material may be added only with explicit source and rights metadata. MusicXML, full notation frameworks, cloud sync, and AI coaching require separate decisions.

### Architecture

- **Parallel tracks:** Curriculum nodes may belong to more than one track. Tracks organize competencies; they do not form four mutually exclusive ladders.
- **Progression unit:** A node has a stable ID, track tags, competency tags, difficulty, prerequisite node or competency IDs, lawful-content metadata, and one or more canonical exercise IDs when exercises exist.
- **Recommendation boundary:** Current recommendation consumes the ordered validated canonical exercise library, declared prerequisite IDs, retained exact-current-revision completed attempts, and an optional just-completed in-memory record. It returns one canonical exercise and structured reason, does not modify evaluator results, and does not invent absent exercises.
- **Learner control:** Recommendations are suggestions. The learner may repeat, skip, change tracks, or choose motivating material without losing progress or being punished.
- **Staff-reading evidence boundary:** The current pitch guide is a presentation aid, not an assessed curriculum result. MIDI completion may support the exercise's existing pitch/order and optional steady-pulse evidence but cannot reveal whether the learner used note names, keyboard cues, memory, or staff positions.
- **Dependencies:** Curriculum references canonical exercise IDs; exercises do not depend on UI or staff position. Recommendation depends on canonical exercise and typed attempt data rather than DOM or storage iteration order, and the curriculum and complete chooser remain usable without recommendation history.

### Track 1: Notes and Reading

This track develops keyboard and notation fluency through:

- keyboard geography
- treble clef
- bass clef
- five-finger positions
- short sight-reading patterns
- interval recognition

The current treble C4-G4 and bass C3-G3 pitch guides introduce the staff positions used by all ten current exercises. They connect visible staff position, note name, and keyboard geography, but the persistent note-name and keyboard cues mean completion is not a sight-reading test. The guide has no duration semantics and does not establish general clef fluency, interval reading, or staff-reading mastery.

### Track 2: Rhythm and Coordination

This track develops pulse and coordination through:

- steady quarter notes
- eighth-note patterns
- rests
- syncopation
- hands separately
- hands together
- later progression through 3/4, 6/8, 5/4, and 7/4

The four current steady-quarter studies offer hands-separate C-D-E-F-G or C-E-D-F-G in 4/4 with a four-beat count-in, quarter-note click, and selectable 40–100 BPM tempo. Their first accepted correct note anchors timing; four later correct-note MIDI timestamp deltas provide on-pulse, early, or late evidence against canonical quarter-beat gaps. The timed step-and-skip pair requires both the matching untimed step-and-skip study and the matching straight steady-quarter study, combining known pitch motion with known pulse behavior without changing the evaluator. Pitch errors do not move the anchor, and Web Audio guides rather than scores. Completion supports only this short steady-quarter competency, not duration, velocity, rests, eighth notes, syncopation, hands together, adaptive tempo, or general rhythm mastery.

### Track 3: Patterns and Technique

This broader technique track develops:

- five-finger patterns
- selected Hanon-style coordination patterns
- major and minor scales
- chord inversions
- arpeggios
- evenness and controlled dynamics

The current library contributes short right- and left-hand five-finger ascents, descents, untimed step-and-skip patterns, straight steady-quarter studies, and timed step-and-skip variants. These establish small pattern choices and bounded quarter-pulse evidence without claiming the duration, velocity, movement, or sustained consistency required for broader technique assessment.

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
- A steady-quarter result can support only its declared hands-separate pulse competency at the selected tempo. It cannot satisfy duration, velocity, subdivision, syncopation, hands-together, adaptive-tempo, or physical-technique competencies.
- The presence of a pitch guide does not change either evidence rule. If a future guide cannot support an exercise's range, spelling, or hands, semantic note text remains available without fabricating notation or negative curriculum evidence.

### Anti-Patterns

- Do not turn four tracks into one mandatory linear course.
- Do not make Hanon or speed drills the definition of piano technique.
- Do not reward excessive repetition, daily streaks, ranks, lives, punitive scores, or comparison with other learners.
- Do not claim a MIDI-only result proves posture, relaxation, fingering, strength, or teacher-level assessment.
- Do not promote visibility of the pitch guide or successful MIDI completion into staff-reading mastery, sight-reading evidence, or proof of clef fluency.
- Do not copy protected repertoire into “inspired-by” exercises through recognizable melodies, substantial passages, transcriptions, recordings, or lyrics.
- Do not assume public-domain status without checking the composition, edition, arrangement, recording, and applicable jurisdiction.
- Do not let recommendation logic bypass canonical exercise IDs, prerequisites, or source metadata.
- Do not derive recommendation order from rendered cards or persisted-record iteration, use error or timing totals as hidden readiness thresholds, or turn advice into exercise locks.
- Do not present the curriculum as a replacement for a qualified piano teacher.

## Contract

### Definition of Done

- [ ] Four parallel tracks and their initial competencies are documented.
- [ ] The ten current exercises are mapped only to keyboard-geography, interval, hands-separate guidance, pattern, and steady-quarter competencies they actually exercise, without claiming the evaluator verifies hand use.
- [ ] The current treble and bass pitch guides are documented as staff-position exposure only, with no duration meaning or staff-reading evidence inferred from completion.
- [ ] The two straight steady-quarter studies require their matching untimed ascents, while each timed step-and-skip study requires its matching untimed step-and-skip and straight steady-quarter studies; all four contribute bounded 4/4 quarter-pulse evidence at the selected 40–100 BPM tempo.
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
- The six untimed exercises must not confer verified hand use, timing, dynamics, staff-reading mastery, pedal, fingering, or physical-technique mastery, even though their staff pitch guides are visible.
- The four timed studies must not confer verified hand use, note duration, velocity, rests, subdivisions, syncopation, hands-together coordination, adaptive-tempo, or broad rhythm mastery.
- Neither timed completion nor untimed completion may satisfy a staff-reading competency without a future reading-focused evidence contract.
- Hanon-style exercises must never become a compulsory whole-curriculum routine.
- Named repertoire goals must not imply bundled or launchable protected content.
- Every launchable curriculum exercise must resolve to a validated canonical exercise and lawful source metadata.
- Prerequisite graphs must remain acyclic and missing references must fail validation.
- Recommendations must be explainable from declared metadata and local evidence, with no remote AI dependency in the live practice loop.
- Recommendation must never confer curriculum mastery, alter evaluator evidence, hide an exercise, or make performance error and timing fields into version-one progression gates.
- Learner choice must remain available without streak loss or punitive progression state.

### Verification

- **Current documentation checks:** Review the track vocabulary, ten-exercise mappings, pitch-guide exposure boundary, steady-quarter evidence boundary, Hanon position, repertoire competency pathways, and explicit current exclusions.
- **Model tests:** Validate IDs, exercise references, prerequisites, cycles, multi-track membership, rights eligibility, exact-revision evidence, and deterministic recommendation tie-breaking.
- **Behavior tests:** Prove that untimed completion updates only supported pitch/pattern competencies, timed completion adds only bounded steady-quarter evidence, timed step-and-skip eligibility requires both declared prerequisites, recommendation ignores performance-quality fields, and missing or evicted history and invalid graphs have a neutral fallback.
- **Coverage target:** When curriculum code exists, all validation failures and recommendation branches remain exercised directly rather than through UI snapshots.

### Scenarios

**Scenario: Classify the current library honestly**

- Given: the learner completes the pitch order for an untimed ascent, descent, or step-and-skip exercise
- When: curriculum evidence is derived from the attempt
- Then: it may support the exercise's keyboard-geography, interval, or pattern competency, but the evaluator does not verify the instructed hand and the result proves no rhythm, dynamics, assessed staff-reading competency, pedaling, fingering, or physical-technique mastery

**Scenario: Use the staff as a pitch-reading bridge**

- Given: a current exercise displays its supported treble or bass pitch guide beside note names and keyboard cues
- When: the learner completes the exercise through MIDI
- Then: the guide has exposed the corresponding staff positions, but the attempt records only its existing pitch/order and optional timing evidence and does not satisfy a staff-reading competency

**Scenario: Record bounded steady-pulse evidence**

- Given: the learner completes a steady-quarter study at a selected tempo from 40 through 100 BPM
- When: its timing summary is mapped to curriculum evidence
- Then: it may support the declared hands-separate steady-quarter competency with on-pulse, early, and late interval evidence, but it does not prove hand use, duration, velocity, subdivisions, syncopation, hands-together playing, adaptive-tempo control, or general rhythm mastery

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
