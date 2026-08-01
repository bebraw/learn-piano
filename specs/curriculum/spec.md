# Feature: Curriculum

## Blueprint

### Context

The learner wants practical technique, reading, rhythm, coordination, harmony, and motivating music without a game-like progression or a rigid conservatory sequence. The curriculum therefore describes four parallel tracks and the competencies that bridge beginner exercises toward long-term repertoire interests. It guides exercise metadata and future recommendations while leaving pacing and choice with the learner.

### Current First-Slice Scope

- The curriculum is a documented domain model and metadata vocabulary, not a fully implemented planner or adaptive recommendation engine.
- The six canonical beginner exercises cover right- and left-hand C-position ascents and descents plus a C-E-D-F-G step-and-skip pattern for each hand.
- Ascents and descents support keyboard geography and five-finger-pattern work; step-and-skip variants add interval recognition and focused coordination-pattern practice. Left- and right-hand variants remain hands-separate work.
- Every current exercise is untimed. Completion is evidence only for pitch order; the hand assignment is instructional and not verified by MIDI. A result does not establish pulse, evenness, dynamics, staff reading, fingering quality, or physical technique.
- Named artists, protected pieces, and game themes are represented only as future repertoire-goal metadata and competency pathways.
- No copyrighted score, MIDI transcription, recording, lyrics, or substantial melodic reproduction is bundled by this slice.

### Future Scope

- A deterministic recommender may use completed attempts, declared prerequisites, recent difficulty, and learner choice to suggest one appropriate next exercise.
- Later slices may add original or lawfully sourced content for timing, count-in, scales, chords, arpeggios, syncopation, odd meters, hand independence, phrasing, and pedal coordination.
- Public-domain, licensed, and user-imported material may be added only with explicit source and rights metadata. MusicXML, notation frameworks, cloud sync, and AI coaching require separate decisions.

### Architecture

- **Parallel tracks:** Curriculum nodes may belong to more than one track. Tracks organize competencies; they do not form four mutually exclusive ladders.
- **Progression unit:** A node has a stable ID, track tags, competency tags, difficulty, prerequisite node or competency IDs, lawful-content metadata, and one or more canonical exercise IDs when exercises exist.
- **Recommendation boundary:** Future recommendation consumes curriculum metadata and local attempt summaries. It does not modify evaluator results or invent exercises whose data is absent.
- **Learner control:** Recommendations are suggestions. The learner may repeat, skip, change tracks, or choose motivating material without losing progress or being punished.
- **Dependencies:** Curriculum references canonical exercise IDs; exercises do not depend on UI position. Attempt history may inform future recommendations but curriculum remains usable without history.

### Track 1: Notes and Reading

This track develops keyboard and notation fluency through:

- keyboard geography
- treble clef
- bass clef
- five-finger positions
- short sight-reading patterns
- interval recognition

The four ascent and descent exercises establish keyboard geography in right-hand C4-G4 and left-hand C3-G3 positions. The two step-and-skip exercises introduce neighboring-step and skip recognition by sound and key position. None claims to teach staff reading until notation is actually introduced.

### Track 2: Rhythm and Coordination

This track develops pulse and coordination through:

- steady quarter notes
- eighth-note patterns
- rests
- syncopation
- hands separately
- hands together
- later progression through 3/4, 6/8, 5/4, and 7/4

The current library offers both hands separately, but timing, metronome behavior, and hands-together coordination remain future work. Untimed completion must not be interpreted as rhythm mastery.

### Track 3: Patterns and Technique

This broader technique track develops:

- five-finger patterns
- selected Hanon-style coordination patterns
- major and minor scales
- chord inversions
- arpeggios
- evenness and controlled dynamics

The current library contributes short right- and left-hand five-finger ascents, descents, and step-and-skip patterns. These establish small pattern choices without claiming the timing, velocity, or movement evidence required for broader technique assessment.

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
- A future recommender should prefer the smallest useful next step and identify why it was suggested.
- Recent difficulty may lead to a simpler prerequisite, hands-separate variant, or repeat; consistent success may open a modest increase in complexity.
- Recommendations must avoid streak pressure, punitive regression, opaque scores, or claims of mastery based on one attempt.
- If no eligible next exercise exists, the system offers a known review choice or explains the gap instead of fabricating content.

### Edge Cases

- Curriculum validation rejects duplicate node IDs, missing exercise references, unknown prerequisite references, and prerequisite cycles.
- A node can appear in several tracks without being duplicated or producing conflicting progress records.
- Missing local history yields neutral beginner or learner-selected choices, not a negative assessment.
- A repertoire goal without lawful exercise content remains visible as a goal but cannot be launched as an exercise.
- A learner may choose a harder or personally motivating node; the system can show prerequisites without blocking access unless a later safety or content constraint is documented.
- An untimed exercise result cannot satisfy a timing-specific, velocity-specific, pedaling, staff-reading, or hands-together competency.

### Anti-Patterns

- Do not turn four tracks into one mandatory linear course.
- Do not make Hanon or speed drills the definition of piano technique.
- Do not reward excessive repetition, daily streaks, ranks, lives, punitive scores, or comparison with other learners.
- Do not claim a MIDI-only result proves posture, relaxation, fingering, strength, or teacher-level assessment.
- Do not copy protected repertoire into “inspired-by” exercises through recognizable melodies, substantial passages, transcriptions, recordings, or lyrics.
- Do not assume public-domain status without checking the composition, edition, arrangement, recording, and applicable jurisdiction.
- Do not let recommendation logic bypass canonical exercise IDs, prerequisites, or source metadata.
- Do not present the curriculum as a replacement for a qualified piano teacher.

## Contract

### Definition of Done

- [ ] Four parallel tracks and their initial competencies are documented.
- [ ] The six current exercises are mapped only to keyboard-geography, interval, hands-separate guidance, and pattern competencies they actually exercise, without claiming the evaluator verifies hand use.
- [ ] Hanon-style work remains a selective part of Patterns and Technique with explicit health and scope limitations.
- [ ] Long-term repertoire interests are represented as competency pathways and metadata only.
- [ ] Curriculum and exercise references use stable canonical IDs.
- [ ] Rights/source metadata gates launchable content.
- [ ] Future recommendation rules remain deterministic, explainable, local-first, and learner-overridable.
- [ ] The spec is updated in the same change set when tracks, progression, or recommendation contracts change.
- [ ] Validation tests cover references, cycles, multi-track membership, and content eligibility when curriculum runtime data is introduced.

### Regression Guardrails

- Notes and Reading, Rhythm and Coordination, Patterns and Technique, and Repertoire Pathways must remain parallel available tracks.
- The six untimed exercises must not confer verified hand use, timing, dynamics, staff-reading, pedal, fingering, or physical-technique mastery.
- Hanon-style exercises must never become a compulsory whole-curriculum routine.
- Named repertoire goals must not imply bundled or launchable protected content.
- Every launchable curriculum exercise must resolve to a validated canonical exercise and lawful source metadata.
- Prerequisite graphs must remain acyclic and missing references must fail validation.
- Recommendations must be explainable from declared metadata and local evidence, with no remote AI dependency in the live practice loop.
- Learner choice must remain available without streak loss or punitive progression state.

### Verification

- **Current documentation checks:** Review the track vocabulary, six-exercise mappings, Hanon position, repertoire competency pathways, and explicit first-slice exclusions.
- **Future model tests:** Validate IDs, exercise references, prerequisites, cycles, multi-track membership, rights eligibility, and deterministic recommendation tie-breaking.
- **Behavior tests:** Prove that an untimed completion updates only supported competencies and that missing history or eligible content has a neutral fallback.
- **Coverage target:** When curriculum code exists, all validation failures and recommendation branches remain exercised directly rather than through UI snapshots.

### Scenarios

**Scenario: Classify the current library honestly**

- Given: the learner completes the pitch order for an untimed ascent, descent, or step-and-skip exercise
- When: curriculum evidence is derived from the attempt
- Then: it may support the exercise's keyboard-geography, interval, or pattern competency, but the evaluator does not verify the instructed hand and the result proves no rhythm, dynamics, staff reading, pedaling, fingering, or physical-technique mastery

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

**Scenario: Recommendation has no eligible new exercise**

- Given: no uncompleted exercise satisfies the learner's current prerequisites and lawful-content rules
- When: a future recommendation is requested
- Then: the system suggests a known review option or explains the gap rather than inventing or unlocking unsupported content

**Scenario: Curriculum contains a prerequisite cycle**

- Given: two or more curriculum nodes depend on each other transitively
- When: curriculum data is validated
- Then: validation fails before recommendation or launch
