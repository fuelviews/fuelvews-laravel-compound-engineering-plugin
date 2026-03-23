---
name: fv:repo-catchup
description: Normalize a legacy Laravel repo with plan classification and doc refresh. Use when onboarding to a new or messy repo that needs docs/ai/ structure and plan inventory.
---

# Normalize and Onboard a Laravel Repository

## Interaction Method

When this skill needs to ask the user a blocking question, use the platform's question tool:

- Claude Code: `AskUserQuestion`
- Codex: `request_user_input`
- Gemini: `ask_user`
- Fallback: present numbered options and wait for user reply

## Task Tracking

When creating or updating tasks, use the platform's task tools:

- Claude Code: `TaskCreate` / `TaskUpdate` / `TaskList`
- Codex: `update_plan`
- Fallback: maintain progress in structured text

## Overview

Scan a Laravel repository, create or refresh the `docs/ai/` structure, classify existing plan artifacts, add frontmatter to legacy plans, and identify risky zones. Use this when onboarding to a repo for the first time or when repo documentation has fallen out of sync with reality.

### Key Behaviors

1. **Repo Structure Scan** -- Use native file-search tools (e.g., Glob in Claude Code) to inventory the repo: routes, models, migrations, config, tests, packages, and any existing `docs/` or `docs/ai/` content.
2. **docs/ai/ Scaffold** -- Create or refresh the `docs/ai/` directory with:
   - `fuelviews-engineering.local.md` -- repo-specific plugin configuration
   - `current-work.md` -- active task tracker
   - `handoff.md` -- session handoff document
   - `plans/` directory with index
3. **Plan Classification** -- Find existing plan-like documents anywhere in the repo. Classify each as: active, completed, abandoned, or draft. Move or link them into `docs/ai/plans/` if appropriate.
4. **Legacy Frontmatter** -- Add YAML frontmatter to legacy plan files that lack it (status, created date, task slug).
5. **Risky Zone Detection** -- Identify areas of the codebase that are high-risk for changes: no test coverage, complex migrations, tightly coupled services, raw SQL, missing type hints.
6. **Laravel Tool Detection** -- Detect which Laravel ecosystem tools are in use: Livewire, FilamentPHP, Horizon, Telescope, Sanctum, Fortify, Jetstream, Cashier, Scout, etc. Record findings in the local config.
7. **Periodic Doc Verification** -- When invoked on an already-onboarded repo, verify that `docs/ai/` files are consistent with current repo state and flag stale entries.

### Output

Results are written to `docs/ai/` files directly. A summary report is presented to the user listing:
- Files created or updated
- Plans classified (with status)
- Risky zones identified
- Laravel tools detected

## Key References

- [repo-truth-loading-order.md](./references/repo-truth-loading-order.md)
- [docs-ai-scaffold.md](./references/docs-ai-scaffold.md)
- [plan-classification-rules.md](./references/plan-classification-rules.md)
- [laravel-tool-detection.md](./references/laravel-tool-detection.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- deep scan of repo structure, dependencies, and patterns
- `compound-engineering:docs:documentation-agent` -- generate or refresh documentation scaffolds

### FV Agents

- `fuelviews-engineering:research:repo-onboarding-agent` -- orchestrate scan, classify, and scaffold workflow
- `fuelviews-engineering:quality:laravel-quality-agent` -- detect Laravel tools and risky zones

## Implementation Status

> Full implementation in Phase 2. This shell defines the onboarding contract and scan inventory.
