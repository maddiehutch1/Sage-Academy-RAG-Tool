# Phase 1 Roadmap: Dual-Example Answers

Date: 2026-09-11
Updated: 2026-09-12

See `ai/roadmaps/complete/2026-09-11-phase-01-dual-example-answers-plan.md` for goal, decisions, and exit criteria.

**Avoid over-engineering, cruft, and legacy-compatibility features.** This phase is a prompt change plus a small eval addition. Do not add an intent classifier, a second model, or a new endpoint.

## Steps

1. [x] Extend `SYSTEM_PROMPT` in `backend/answer.py`.
   - Keep the existing grounded-assistant rules (use the excerpts, infer when reasonable, do not refuse when the answer is in the context, stay concise).
   - Add the dual-example instruction from the Phase 1 plan: lecture scenario first, then a generic reusable example; other questions stay tightly grounded.
   - Do not branch `generate_answer` on question type.

2. [x] Point `scripts/run_eval.py` at the same prompt.
   - Import `SYSTEM_PROMPT` from `backend/answer.py`.
   - Delete the duplicated prompt string in the eval script (it is already out of date).
   - Confirm a single eval question still runs after the import.

3. [x] Add 2–4 coding/layout questions to `tests/eval_questions.json`.
   - Prefer DATA2100 Python: lists, basics, loops, conditionals / "how do I write this" asks.
   - Include at least one question in the spirit of the student complaint (give me a Python example / layout, not the lecture's demo domain).
   - Keep `expected_keywords` for retrieval smoke, but do not treat keyword hits as proof of dual-example quality.

4. [x] Add a manual dual-example checklist.
   - For each new question: lecture domain named; generic example is not that domain; sources present; answer is still a study aid.
   - Record the checklist result in the eval report notes or a short section at the bottom of the new report.

5. [x] Regression check.
   - Run `python scripts/run_eval.py` against the Render index (`DATABASE_URL` in `.env`).
   - Existing q01–q08 (IS3600) still retrieve and answer in the previous style — no extra invented examples, sources still attached.
   - Prompt verified via eval import of production `SYSTEM_PROMPT`. Local `/ask` was not running at the time of close.

## Implementation Notes
- One prompt, one `generate_answer` path. No `if is_coding`.
- Do not change `temperature`, `CHAT_MODEL`, or retrieval.
- If a coding question retrieves nothing, keep the existing soft no-content response. Dual-example does not apply when there is no lecture to cite.
- "Layout" is handled by the same instruction (dashboard layout, code structure, "how do I set this up"), not a separate prompt.
- Do not tell the model to avoid markdown. Raw `*` in the UI is a Phase 2 display bug; stripping markdown would make code examples worse.

## Output
Coding and layout answers that cite the lecture, name its scenario, and then give a generic example a student can reuse — without changing the rest of the Q&A contract.
