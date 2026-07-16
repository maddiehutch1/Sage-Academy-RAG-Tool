# Phase 5 Roadmap: Validation and Refinement

Date: 2026-07-10

## Steps
1. [x] Prepare a small set of realistic student questions that reflect the expected use cases.
   - tests/eval_questions.json: 8 questions covering cloud models, AWS services, pricing, compute, and course tools.
2. [x] Run those questions through the retrieval and answer flow.
   - scripts/run_eval.py: runs all questions end-to-end, scores distances, checks keyword coverage, saves a timestamped Markdown report to tests/eval_results/.
3. [x] Review the matched chunks and the returned answer for relevance and grounding.
   - Initial eval (2026-07-15) showed 2 weak retrieval flags (q07, q08) — both caused by only 1 lecture being indexed.
   - Root cause: 52 SRT files had no companion .json sidecar, so ingest.py silently skipped them all.
4. [x] Adjust chunk size, overlap, retrieval count, and prompt wording where needed.
   - Fix: generated JSON sidecar files for all 52 missing transcripts (IS 3600 lectures 1, 3–29; DATA 2100 all lectures).
   - Re-ran ingest.py — all 53 lectures now indexed across both courses.
   - Re-ran eval (2026-07-16): 0 weak retrieval flags. q07 improved from 0.5523 to 0.4121; q08 from 0.6276 to 0.4909.
5. [x] Fix major issues in the output contract or UI presentation.
   - No output contract changes needed. The UI was already working end-to-end from Phase 4.
6. [x] Capture unresolved issues and decide what should be deferred to later phases.
   - q04 (on-demand vs reserved) answer quality is slightly conservative with the expanded corpus — top chunk distance stayed at 0.54. Deferred to Phase 6 if prompt tuning is desired.
   - q08 keyword coverage is 1/4 (only 'tools' matched) though distance is acceptable. Not a retrieval failure — the best grounded answer is a course overview, not a specific tool list.
   - DATA 2100 questions are not yet in the eval set. Phase 6 could extend eval_questions.json to cover data, SQL, and Python topics from that course.

## Implementation Notes
- Keep the validation loop small and practical.
- Focus on the biggest quality issues rather than polishing for edge cases.
- Avoid introducing more complexity unless it directly improves the demo.

## Output
A more dependable prototype that is better aligned with real student questions.
