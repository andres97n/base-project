# Plans

This folder is the project's durable memory: what was investigated, what was decided and why, and what remains to be done. It is not user-facing reference documentation — that's `docs/architecture.md`, `docs/database.md`, and `docs/api.md`, plus `CLAUDE.md` for conventions.

- **[project-knowledge.md](./project-knowledge.md)** — accumulated findings from auditing this codebase: non-obvious behaviors, decisions made and their rationale, and traps a new contributor will hit. Read this before making architectural changes.
- **[roadmap.md](./roadmap.md)** — deferred work, organized by risk/priority, with the reasoning for each item and where to start.

Update these when you investigate something non-obvious or defer work deliberately — not on every change. Routine edits belong in commit messages and the reference docs, not here.
