# Language exam scoring

Scoring policy version 2 establishes only the level at which a complete exam was taken. A low percentage on a B1 exam does not establish A2 or A1. An unsuccessful A1 exam returns **A1 not demonstrated**, with no awarded level.

- Reading and listening use correct answers divided by the number of keyed questions.
- Every writing and oral task must reach the configured pass mark (currently 60). The section reports its lowest task score. A successful introduction or form cannot conceal an unsuccessful situation or message.
- Writing and oral responses need two complete AI gradings. Their scores must be within 15 points, agree on pass/fail, and agree on speech, language and relevance checks. Task achievement is scored 0–100 on content alone and caps the grading; it never raises the score.
- Each language criterion (writing: coherence, vocabulary, grammar; oral: fluency, vocabulary, grammar, pronunciation) is first placed on its CEFR scale (`criterion_scales` in `config/language_test.php`), then scored inside that level's band on this exam: one level above 85–100, at level 60–84, one below 40–59, lower 0–39. The code holds the score inside the band of the stated level. A grading's score is the mean of the language criteria, capped by task achievement. Before this, the grader judged whether an answer "meets the standard" and failed 3 of 4 MERLIN texts that trained raters had placed at the exam level.
- Incomplete, malformed or inconsistent grading is retried by the queue. Exhausted retries produce a technical failure, never a partial awarded level.
- Reading aloud gives diagnostic feedback about text matching and estimated clarity. Speech-recognition confidence is not a calibrated pronunciation or CEFR measurement and does not raise the speaking score.
- The camera oral stays at the exam level, even after unsuccessful Phase 1 tasks. A lower level requires a separate complete exam. After an unsuccessful result and the normal cooldown, candidates may choose another available level without editing their certificate.
- B2, C1 and C2 results wait for an administrator (`review_levels` in `config/language_test.php`; see the measurements below). The AI's level is stored as `ai_cefr`, but the candidate sees only "under review", and nothing reaches the profile or recruiter search. The administrator either approves the AI's level, with an optional note, or publishes a corrected one, with a required reason. The candidate is notified when the result is published.
- Complete A1–B1 results publish automatically. Unsuccessful results have no `final_cefr` and no AMUD validated-level badge. Certificates remain displayed, with confirmation false after an unsuccessful exam. Admin corrections remain optional, require reasons, and can record that no level was demonstrated.

The upgrade reassesses old automatic results from their stored responses. Explicit admin corrections are preserved, along with original sitting dates. No AI calls are made by the migration.

## Measured against rated learner texts (2026-11-25)

The writing grader was run once per text on MERLIN German learner texts (CC BY-SA), which trained raters had placed on the CEFR. A text was graded at its exam level and counted as "should pass" when the raters' overall level was at least that level. MERLIN has no task sheets, so the tasks were rebuilt from their titles. Free-tier quota limited the runs to 49 gradings across three models (`gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-3-flash-preview`).

| Exam | At-level or stronger texts passed | Weaker texts failed |
|---|---|---|
| A1 | 6 / 8 | — |
| A2 | 3 / 4 | 3 / 4 |
| B1 | 4 / 6 | 6 / 6 |
| B2 | 1 / 5 | 6 / 6 |
| C1 | 1 / 5 | 4 / 4 |

The older "meets the standard" prompt passed 1 of 5 such texts. At B2 and C1 the models still place each criterion about one level below the raters. B1-rated and B2-rated texts receive overlapping scores on the B2 exam, so a lower cut score would pass weaker texts as often as genuine ones. Adding written rater-practice guidance to the prompt did not change the results (6 of 9 correct both ways on the same model and texts). For this reason B2 and above are held for administrator review. A wrong AI estimate at these levels remains likely until the grader is recalibrated on a paid key with a larger sample, or a stronger model separates these levels.

## Validation still required

These rules prevent specific false passes; they do not establish psychometric validity. The thresholds, shortest task lengths, question bank difficulty, AI rubric and weakest-task aggregation are product policies awaiting calibration. Two calls to the same model are repeated estimates, not independent expert examiners.

Before claiming CEFR accuracy, assemble a consented dataset covering A1–C2, with real writing and speech rated independently by qualified examiners. Include borderline performances, accents, background noise, missing and off-topic responses. Compare skill and overall pass decisions on held-out examples; report false-pass and false-fail rates, agreement by level, subgroup results and stability across repeated runs. Set cut scores from those results and repeat validation after changing the model, prompts, bank or scoring policy. Synthetic strong/weak examples and passing software tests are insufficient for that claim.
