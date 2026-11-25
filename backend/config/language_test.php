<?php

/*
 * The AMUD level exam.
 *
 * There is one exam per CEFR level, not one adaptive test. A candidate whose
 * certificate says B1 sits the B1 exam, and the exam answers a single
 * question: does this candidate really hold the level on their certificate?
 * Each level's blueprint fixes the sections, the kind of task in each, how
 * many, how long, and how many words — modelled on the Goethe/telc exam of
 * the same level, since that is the format German employers already trust.
 *
 * Everything here is data so calibration (milestone 5: certified candidates
 * take the matching exam) can tune it without a deploy of code.
 */

return [
    /** v1 is German only; the schema already carries the language. */
    'languages' => ['de'],

    'levels' => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],

    // Product policy, pending calibration against human-rated exams.
    // Only passing the examined level establishes it; failed tasks award no lower level.
    'pass_mark' => 60,
    'may_be_higher' => 85,

    /*
     * Exams whose result an administrator must approve before it is published.
     * Measured against MERLIN rated learner texts (docs/LANGUAGE_TEST_SCORING.md),
     * the AI writing grader passed only 1 of 5 genuine B2 and 1 of 5 genuine C1
     * texts, and could not separate B1 from B2 writing. C2 was never measured
     * and is harder still. A1–B1 results are published automatically.
     */
    'review_levels' => ['B2', 'C1', 'C2'],

    /** Inconsistent AI gradings are retried; no uncertain mark is published. */
    'grading_disagreement' => 15,

    'retake_cooldown_days' => 30,

    /** Phase 1 runs in this order; the live oral is Phase 2. */
    'phase_one_sections' => ['reading', 'listening', 'read_aloud', 'writing'],
    'phase_two_sections' => ['oral'],

    /*
     * Every task type the bank and the exam runner understand.
     *
     *  - family decides the shape of an item's content (and which JSON schema
     *    the generator asks Gemini for): `questions` items carry a stimulus
     *    and keyed questions; `form` a stimulus and keyed fields; `read_aloud`
     *    a reference text; `writing` and `oral` a task the AI grades.
     *  - scoring: `key` is graded by code against the answer key, `alignment`
     *    by comparing the transcript to the reference text, `rubric` by Gemini.
     */
    'task_types' => [
        'true_false' => ['family' => 'questions', 'scoring' => 'key', 'skills' => ['reading', 'listening'],
            'brief' => 'Statements about the text; each is richtig (true) or falsch (false).'],
        'multiple_choice' => ['family' => 'questions', 'scoring' => 'key', 'skills' => ['reading', 'listening'],
            'brief' => 'Questions about the text, each with three options a/b/c and exactly one correct.'],
        'matching' => ['family' => 'questions', 'scoring' => 'key', 'skills' => ['reading', 'listening'],
            'brief' => 'Several short situations or people, and a shared list of short texts/ads (more options than situations, one may be "x" = none fits). Each situation is matched to one option.'],
        'gap_text' => ['family' => 'questions', 'scoring' => 'key', 'skills' => ['reading'],
            'brief' => 'A text with numbered gaps ([1], [2] …). Each gap is a question whose options are the candidate words/phrases; exactly one fits grammatically and in meaning.'],
        'form_fill' => ['family' => 'form', 'scoring' => 'key', 'skills' => ['writing'],
            'brief' => 'A short text about a person, and a simple form (5 fields such as name, age, city, profession, day) to fill in with information from the text.'],
        'read_aloud' => ['family' => 'read_aloud', 'scoring' => 'alignment', 'skills' => ['read_aloud'],
            'brief' => 'A text the candidate reads aloud. Natural, everyday German at the level, with words a learner at this level should be able to pronounce.'],
        'short_message' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'A short personal message (SMS, note, postcard) answering a situation, covering the listed content points.'],
        'informal_email' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'An informal email to a friend or colleague responding to a situation, covering the listed content points.'],
        'formal_note' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'A short formal message (to a manager, landlord, teacher, authority): apologise, ask, cancel or request.'],
        'opinion_text' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'A forum post or opinion text reacting to a statement, giving and justifying an opinion with examples.'],
        'argumentative_text' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'A structured argumentative text weighing pros and cons of an issue and reaching a reasoned conclusion.'],
        'reformulation' => ['family' => 'writing', 'scoring' => 'rubric', 'skills' => ['writing'],
            'brief' => 'Rewrite a given text for a different audience or register (e.g. informal notes into a formal letter), keeping all information.'],
        'oral_introduction' => ['family' => 'oral', 'scoring' => 'rubric', 'skills' => ['oral'],
            'brief' => 'Introduce yourself following the listed points (name, origin, job, languages, hobbies …).'],
        'oral_situation' => ['family' => 'oral', 'scoring' => 'rubric', 'skills' => ['oral'],
            'brief' => 'An everyday or workplace situation the candidate must react to out loud: ask, arrange, explain, solve a problem.'],
        'oral_presentation' => ['family' => 'oral', 'scoring' => 'rubric', 'skills' => ['oral'],
            'brief' => 'A short presentation on a topic, following the listed structure points (experience, situation in home country, pros/cons, own opinion).'],
        'oral_discussion' => ['family' => 'oral', 'scoring' => 'rubric', 'skills' => ['oral'],
            'brief' => 'A position to take and defend on a debatable question, anticipating counter-arguments.'],
    ],

    /*
     * What a candidate at each level can do, condensed from the CEFR global
     * scale. Fed to the item generator (so the content is pitched right) and,
     * later, to the graders (so a B1 answer is judged as a B1 answer).
     */
    'descriptors' => [
        'A1' => 'Understands and uses familiar everyday expressions and very basic phrases. Can introduce themself, ask and answer simple questions about personal details. Vocabulary: very frequent words. Grammar: present tense, simple main clauses.',
        'A2' => 'Understands sentences and frequent expressions about immediate needs (family, shopping, work, local area). Communicates in simple routine tasks. Grammar: Perfekt, modal verbs, simple subordinate clauses with weil/dass.',
        'B1' => 'Understands the main points of clear standard input on familiar matters (work, school, leisure). Deals with most travel situations, describes experiences, events, hopes and gives brief reasons and explanations. Grammar: all common tenses, subordinate clauses, Konjunktiv II for politeness.',
        'B2' => 'Understands the main ideas of complex texts on concrete and abstract topics, including technical discussion in their field. Interacts with fluency and spontaneity; produces clear, detailed text and explains a viewpoint giving advantages and disadvantages. Grammar: passive, complex connectors, nominal style begins.',
        'C1' => 'Understands demanding, longer texts and recognises implicit meaning. Expresses ideas fluently and spontaneously, uses language flexibly for social, academic and professional purposes. Produces well-structured, detailed text on complex subjects.',
        'C2' => 'Understands virtually everything heard or read. Summarises information from different sources, reconstructing arguments coherently. Expresses themself spontaneously, very fluently and precisely, differentiating finer shades of meaning.',
    ],

    /*
     * The CEFR scale for each language criterion the graders rate, condensed
     * from the CEFR (2001 / Companion Volume 2020) analytic scales. The grader
     * places the answer on these scales first and the score follows from that
     * level (ProductiveGrader::band), so "meets B1" means what the CEFR says,
     * errors included, and not an examiner's private idea of a clean answer.
     */
    'criterion_scales' => [
        'grammar' => [
            'A1' => 'Limited control of a few simple structures and memorised patterns.',
            'A2' => 'Uses some simple structures correctly but still systematically makes basic mistakes (verb forms, word order, endings, articles); the meaning is usually clear.',
            'B1' => 'Reasonably accurate with frequent patterns in familiar situations. Errors still occur, including noticeable ones (endings, word order, prepositions), but rarely obscure the message.',
            'B2' => 'Good grammatical control; occasional slips and non-systematic errors may occur, but they do not cause misunderstanding.',
            'C1' => 'Consistently high grammatical accuracy; errors are rare and hard to spot.',
            'C2' => 'Consistent grammatical control of complex language, even while attention is elsewhere.',
        ],
        'vocabulary' => [
            'A1' => 'A basic repertoire of isolated words and phrases for concrete personal details.',
            'A2' => 'Enough vocabulary for routine everyday needs on familiar topics; wrong word choices and invented forms are frequent but meaning is recoverable.',
            'B1' => 'Enough vocabulary to manage most everyday and work topics, with some circumlocution; errors appear when expressing more complex thoughts.',
            'B2' => 'A good range for general and own-field topics; varies formulation to avoid repetition; some incorrect word choice occurs without hindering communication.',
            'C1' => 'A broad repertoire including idiomatic expressions; gaps are bridged readily; only occasional minor slips.',
            'C2' => 'A very broad, precise repertoire including idiom and colloquialism, used consistently correctly and appropriately.',
        ],
        'coherence' => [
            'A1' => 'Links words or groups of words with very basic connectors like "und", "dann".',
            'A2' => 'Links simple sentences with frequent connectors like "und", "aber", "weil".',
            'B1' => 'Links a series of shorter, simple elements into a connected, linear text.',
            'B2' => 'Uses a range of connectors to produce clear, coherent text; a longer text may still jump.',
            'C1' => 'Clear, smoothly flowing, well-structured text with controlled use of organisational patterns and cohesive devices.',
            'C2' => 'Coherent, cohesive text making full use of a wide variety of organisational patterns and cohesive devices.',
        ],
        'fluency' => [
            'A1' => 'Very short, isolated, mainly memorised utterances, with much pausing to search for words.',
            'A2' => 'Makes themself understood in short utterances, though pauses, false starts and reformulation are very evident.',
            'B1' => 'Keeps going comprehensibly, although pausing for grammatical and lexical planning and repair is very evident in longer stretches.',
            'B2' => 'Produces stretches of language at a fairly even tempo; may hesitate while searching for expressions but with few noticeably long pauses.',
            'C1' => 'Fluent and spontaneous, almost effortless; only a conceptually difficult subject hinders a smooth flow.',
            'C2' => 'Speaks at length with a natural, effortless, unhesitating flow.',
        ],
        'pronunciation' => [
            'A1' => 'A very limited repertoire, understood with some effort by listeners used to speakers of the same background.',
            'A2' => 'Generally clear enough to be understood, though listeners need to ask for repetition from time to time.',
            'B1' => 'Generally intelligible; the accent is evident and some words are mispronounced, but this does not prevent understanding.',
            'B2' => 'Clear pronunciation and intonation for most purposes; an accent remains but does not affect intelligibility.',
            'C1' => 'Varies intonation and stress to express finer shades of meaning; any accent does not affect intelligibility.',
            'C2' => 'Full control of stress, intonation and sounds to convey precise meaning; any accent never affects intelligibility.',
        ],
    ],

    /** Sector tags an item may carry so the content can lean towards the candidate's trade. */
    'sectors' => ['general', 'care', 'construction', 'hospitality', 'logistics', 'industry'],

    /*
     * The six exams. Per section: minutes (whole section), and tasks — each
     * task is one bank item of that type. `questions` is how many keyed
     * questions a `questions`/`form` item must carry; `words` is the length
     * of the stimulus or reference text (reading/listening/read-aloud) or of
     * the expected answer (writing). Oral tasks carry their own timers.
     * Listening `plays` is how many times each clip may be played.
     */
    'blueprints' => [
        'A1' => [
            'reading' => ['minutes' => 12, 'tasks' => [
                ['task_type' => 'true_false', 'questions' => 5, 'words' => [60, 110], 'stimulus' => 'Signs, notices and a short personal note or email.'],
                ['task_type' => 'matching', 'questions' => 5, 'words' => [80, 140], 'stimulus' => 'Five short situations and seven short ads or signs.'],
            ]],
            'listening' => ['minutes' => 12, 'plays' => 2, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 4, 'words' => [50, 100], 'stimulus' => 'Short everyday dialogues (shop, station, phone).'],
                ['task_type' => 'true_false', 'questions' => 4, 'words' => [40, 90], 'stimulus' => 'Short public announcements.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [20, 35], 'stimulus' => '3–4 short, simple sentences about everyday life.'],
            ]],
            'writing' => ['minutes' => 15, 'tasks' => [
                ['task_type' => 'form_fill', 'questions' => 5, 'words' => [50, 90], 'stimulus' => 'A short text about a person and a registration form.'],
                ['task_type' => 'short_message', 'words' => [25, 40], 'stimulus' => 'Write a short message to a friend covering three points.'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_introduction', 'prep_seconds' => 30, 'answer_seconds' => 45],
                ['task_type' => 'oral_situation', 'prep_seconds' => 30, 'answer_seconds' => 45, 'stimulus' => 'A simple everyday request or question.'],
            ]],
        ],

        'A2' => [
            'reading' => ['minutes' => 15, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 5, 'words' => [150, 220], 'stimulus' => 'A short newspaper item or simple article.'],
                ['task_type' => 'matching', 'questions' => 5, 'words' => [120, 200], 'stimulus' => 'Five situations and seven short ads, notices or information boards.'],
            ]],
            'listening' => ['minutes' => 15, 'plays' => 2, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 5, 'words' => [80, 140], 'stimulus' => 'Phone messages and announcements.'],
                ['task_type' => 'true_false', 'questions' => 5, 'words' => [120, 200], 'stimulus' => 'A conversation between two people about everyday plans.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [40, 60], 'stimulus' => 'A short paragraph about daily life or work.'],
            ]],
            'writing' => ['minutes' => 15, 'tasks' => [
                ['task_type' => 'short_message', 'words' => [40, 60], 'stimulus' => 'A message or invitation covering three points.'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_introduction', 'prep_seconds' => 30, 'answer_seconds' => 60],
                ['task_type' => 'oral_situation', 'prep_seconds' => 30, 'answer_seconds' => 60, 'stimulus' => 'Arrange something simple (an appointment, a meeting, a purchase).'],
            ]],
        ],

        'B1' => [
            'reading' => ['minutes' => 20, 'tasks' => [
                ['task_type' => 'true_false', 'questions' => 6, 'words' => [220, 320], 'stimulus' => 'A blog entry or personal account.'],
                ['task_type' => 'multiple_choice', 'questions' => 5, 'words' => [250, 350], 'stimulus' => 'A press article on a familiar topic.'],
                ['task_type' => 'matching', 'questions' => 6, 'words' => [200, 320], 'stimulus' => 'Six people looking for something and eight short ads.'],
            ]],
            'listening' => ['minutes' => 20, 'plays' => 2, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 5, 'words' => [150, 250], 'stimulus' => 'Short radio pieces and announcements.'],
                ['task_type' => 'true_false', 'questions' => 6, 'words' => [250, 380], 'stimulus' => 'A longer conversation between two people about work or plans.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [70, 90], 'stimulus' => 'A paragraph about a workplace or social topic.'],
            ]],
            'writing' => ['minutes' => 25, 'tasks' => [
                ['task_type' => 'informal_email', 'words' => [80, 110], 'stimulus' => 'Reply to a friend covering three points.'],
                ['task_type' => 'formal_note', 'words' => [40, 60], 'stimulus' => 'A short formal message (apologise, cancel or request).'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_presentation', 'prep_seconds' => 30, 'answer_seconds' => 90],
                ['task_type' => 'oral_situation', 'prep_seconds' => 30, 'answer_seconds' => 75, 'stimulus' => 'React to a workplace situation and propose what to do.'],
            ]],
        ],

        'B2' => [
            'reading' => ['minutes' => 25, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 6, 'words' => [400, 550], 'stimulus' => 'A longer press article on a social or professional topic.'],
                ['task_type' => 'gap_text', 'questions' => 6, 'words' => [180, 260], 'stimulus' => 'A formal letter or email with gaps testing connectors and grammar.'],
                ['task_type' => 'matching', 'questions' => 6, 'words' => [300, 450], 'stimulus' => 'Several opinions (forum posts) matched to statements.'],
            ]],
            'listening' => ['minutes' => 25, 'plays' => 1, 'tasks' => [
                ['task_type' => 'true_false', 'questions' => 6, 'words' => [300, 450], 'stimulus' => 'An interview with an expert or professional.'],
                ['task_type' => 'multiple_choice', 'questions' => 6, 'words' => [350, 500], 'stimulus' => 'A radio discussion with several speakers.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [100, 130], 'stimulus' => 'A text containing numbers, dates and compound nouns.'],
            ]],
            'writing' => ['minutes' => 30, 'tasks' => [
                ['task_type' => 'opinion_text', 'words' => [150, 200], 'stimulus' => 'A forum post reacting to a statement, with reasons and examples.'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_presentation', 'prep_seconds' => 30, 'answer_seconds' => 105],
                ['task_type' => 'oral_discussion', 'prep_seconds' => 30, 'answer_seconds' => 90],
            ]],
        ],

        'C1' => [
            'reading' => ['minutes' => 30, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 7, 'words' => [550, 750], 'stimulus' => 'A complex article with implicit attitudes and opinions.'],
                ['task_type' => 'gap_text', 'questions' => 8, 'words' => [250, 350], 'stimulus' => 'A formal text with gaps testing precise vocabulary and collocations.'],
            ]],
            'listening' => ['minutes' => 25, 'plays' => 1, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 7, 'words' => [450, 650], 'stimulus' => 'A lecture or expert talk.'],
                ['task_type' => 'true_false', 'questions' => 6, 'words' => [400, 600], 'stimulus' => 'A discussion with several speakers holding differing views.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [120, 150], 'stimulus' => 'A formal text (report, official letter, professional article).'],
            ]],
            'writing' => ['minutes' => 40, 'tasks' => [
                ['task_type' => 'argumentative_text', 'words' => [220, 280], 'stimulus' => 'A structured argumentative text on a social or professional issue.'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_presentation', 'prep_seconds' => 30, 'answer_seconds' => 120],
                ['task_type' => 'oral_discussion', 'prep_seconds' => 30, 'answer_seconds' => 120],
            ]],
        ],

        'C2' => [
            'reading' => ['minutes' => 35, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 8, 'words' => [700, 900], 'stimulus' => 'An academic, essayistic or literary text.'],
                ['task_type' => 'gap_text', 'questions' => 10, 'words' => [300, 400], 'stimulus' => 'A demanding text with gaps testing idiom and fine distinctions of meaning.'],
            ]],
            'listening' => ['minutes' => 30, 'plays' => 1, 'tasks' => [
                ['task_type' => 'multiple_choice', 'questions' => 8, 'words' => [600, 800], 'stimulus' => 'A dense debate or radio feature.'],
                ['task_type' => 'true_false', 'questions' => 7, 'words' => [500, 700], 'stimulus' => 'An interview with nuanced, partly implicit positions.'],
            ]],
            'read_aloud' => ['minutes' => 3, 'tasks' => [
                ['task_type' => 'read_aloud', 'words' => [140, 170], 'stimulus' => 'A specialised or literary text.'],
            ]],
            'writing' => ['minutes' => 45, 'tasks' => [
                ['task_type' => 'reformulation', 'words' => [120, 170], 'stimulus' => 'Turn informal notes into a formal letter.'],
                ['task_type' => 'argumentative_text', 'words' => [250, 320], 'stimulus' => 'An essay on an abstract question.'],
            ]],
            'oral' => ['tasks' => [
                ['task_type' => 'oral_presentation', 'prep_seconds' => 30, 'answer_seconds' => 120],
                ['task_type' => 'oral_discussion', 'prep_seconds' => 30, 'answer_seconds' => 120, 'stimulus' => 'A nuanced debate on an abstract topic.'],
            ]],
        ],
    ],

    /** How many complete, non-overlapping exams the bank should hold per level before launch. */
    'target_exams_per_level' => 2,
];
