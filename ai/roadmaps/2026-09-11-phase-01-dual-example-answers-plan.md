# Phase 1 Plan: Dual-Example Answers

Date: 2026-09-11

See `ai/roadmaps/2026-09-11-phase-01-dual-example-answers-roadmap.md` for the step-by-step implementation roadmap.
See `ai/roadmaps/2026-09-11-high-level-plan-stage-2.md` Milestone 2 for how this phase sits in Stage 2.

## Engineering Philosophy
**Avoid over-engineering, cruft, and legacy-compatibility features.**

This is a clean-start project with no existing users, no existing data, and no migration debt. Every layer of abstraction must earn its place. If a simpler approach works, use it. Delete code freely. Build for what's needed now, not for hypothetical future requirements.

## Context
Students reported that coding and layout answers regurgitate the lecture's scenario (for example, code that generates random foods) instead of teaching a pattern they can reuse on homework. That behavior matches the current system prompt in `backend/answer.py`, which tells the model to answer from transcript excerpts. Conceptual IS3600 questions are already eval'd; this failure mode is not.

## Goal
When a student asks how to write code, a structure, or a layout, the answer should briefly name what the lecture demonstrated, then give a generic reusable example. Sources (video + timestamp) stay attached. Other questions stay tightly grounded.

## Scope

### In scope
- Prompt change in `backend/answer.py` `SYSTEM_PROMPT`.
- Dual-example trigger is that prompt instruction, not an intent classifier or a second model.
- "Layout" includes code structure, viz/dashboard layout, and similar "show me how to set this up" asks — not only Python.
- Keep `scripts/run_eval.py` on the same prompt by importing `SYSTEM_PROMPT` from `backend/answer.py` (the script already has a stale copy).
- Add 2–4 coding/layout questions to `tests/eval_questions.json`. DATA2100 Python basics (`IntroToLists`, `ICA_PythonBasics`, `IntroToProgramming`, loops/conditionals) are the first set.
- A short manual checklist in the eval report or beside those questions. Keyword-only eval will not catch "still using foods as the template."

### Out of scope
- Follow-up thread UI or `/ask` history (Phase 2).
- Rendering markdown in the UI (Phase 2). Leave markdown in the model output — do not add a "do not use asterisks" prompt rule. Dual examples need fenced code.
- Changing retrieval, chunking, or the chat model.
- Broad eval expansion across SQL/Excel/all courses.
- Inventing examples when retrieval returns no relevant chunks — still say so.

## Prompt Design

Keep the existing grounded-assistant rules. Add a dual-example instruction. Suggested addition (wording may be tightened in implementation, not expanded):

```
When the student asks how to write code, a structure, or a layout:
1. Briefly name the scenario the lecture used (so they can find it in the video).
2. Then give a generic reusable example that is not that lecture domain, unless they asked for that scenario.
Do not let a lecture-specific domain (foods, a named demo dataset, etc.) become the student's template.
For other questions, stay tightly grounded in the excerpts and do not invent extra examples.
```

Do not add a classifier, a special `/ask` flag, or a second prompt path.

## Eval Design

Keyword overlap is not enough. For each new coding/layout question, reviewers check:

| Check | Pass |
| --- | --- |
| Answer names what the lecture used as its example | |
| Generic example is present and is not that same domain | |
| Sources include at least one video + timestamp | |
| Answer is still a study aid, not a full homework dump | |

Keep the existing eight IS3600 questions. They are the regression set: dual-example wording must not make conceptual answers ramble or invent.

## Files expected to change

| File | Change |
| --- | --- |
| `backend/answer.py` | Extend `SYSTEM_PROMPT` |
| `scripts/run_eval.py` | Import `SYSTEM_PROMPT` from `answer.py`; drop the duplicated string |
| `tests/eval_questions.json` | Add 2–4 coding/layout questions |

No schema changes. No new dependencies. No frontend changes.

## Assumptions
- `run_eval.py` can import from `backend` the same way other scripts already reach project code, or it can add the backend path. Prefer import over a third copy of the prompt.
- DATA2100 Python transcripts are already in the live index.

## Deliverables
- [ ] Updated production prompt
- [ ] Eval runner uses that prompt
- [ ] Coding/layout questions + manual checklist
- [ ] Regression pass on the existing IS3600 set
