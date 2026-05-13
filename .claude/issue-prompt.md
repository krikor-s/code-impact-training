# Claude Code Issue Workflow Prompt

Reusable template for working a GitHub issue with Claude Code. Replace
`<NUMBER>` with the issue number you're working, then paste into Claude
Code.

The prompt is intentionally strict about Git operations: Claude Code
creates the branch and writes the code, but never commits, pushes, or
opens PRs. Those stay manual so the developer reviews every diff
before it leaves the working tree.

---

Work on issue #<NUMBER> in the `krikor-s/code-impact-training` repo.

**Setup steps — do these in order, stop if any fail:**

1. Run `gh issue view <NUMBER>` and read the full description + acceptance criteria
2. Run `git status` — confirm I'm on `main` with a clean working tree. If not, STOP.
3. Run `git pull` to make sure main is up to date
4. Create a branch named `feat/<NUMBER>-<short-kebab-description>` where the description is 2-4 words from the issue title (e.g. `feat/37-jwt-utility`). Use `git checkout -b`.

**Implementation:**

- Read the AC carefully and implement exactly what it asks for, nothing more
- Backend conventions: Express + TS at `backend/`, Vitest for tests, 3-layer pattern (route → controller → service), utilities at `backend/src/utils/`
- Frontend conventions: React + Vite + Tailwind at `frontend/`, Vitest for tests
- If the issue is a backend utility, write Vitest tests alongside it and run them before stopping
- If anything in the AC is ambiguous, STOP and ask before implementing

**Constraints:**

- Do NOT commit. Do NOT push. Do NOT open a PR. The developer does all Git operations after reviewing the diff.
- Do NOT modify files outside the scope of this issue
- Use the existing code style of the repo

When done, summarize what changed and report the current branch name.

---

## Notes on the workflow

- The `chore` and `docs` prefixes are also valid branch types — adjust the branch name pattern if the issue isn't a feature
- After Claude Code finishes, the developer runs `git status` and `git diff`, reads every line, then commits manually with a Conventional Commits message
- Branch links to the issue form automatically when the PR is opened with `Closes #<NUMBER>` in the body
