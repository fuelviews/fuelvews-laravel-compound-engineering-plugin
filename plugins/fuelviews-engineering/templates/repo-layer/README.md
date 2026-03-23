# Repo Layer (docs/ai/)

This directory contains machine-readable context files that coding agents use to understand a repository's structure, conventions, and architecture. These files are maintained by agents and verified periodically to stay in sync with the actual codebase.

## File Roles

| File | Purpose | Update Trigger |
|------|---------|---------------|
| `repo-map.md` | Navigational map of entry points, directories, config, and tests. Self-healing: agents re-verify on each repo catch-up. | Structural changes (new directories, moved files, renamed entry points). |
| `architecture.md` | Stack description, architectural decisions, key patterns, event chains, and external integrations. | New architectural decisions, pattern changes, or integration additions. |
| `conventions.md` | Coding standards that differ from framework defaults. PHP, Laravel, testing, and naming rules. | Convention changes agreed upon by the team. |

## Principles

- **Repo truth over stale docs.** If a file contradicts what the code actually does, the code wins and the file must be updated.
- **Minimal and actionable.** Only include information that changes agent behavior. Do not duplicate framework documentation.
- **Verification dates.** Each file records when it was last verified against the codebase. Stale files (> 14 days unverified) should be re-checked.
