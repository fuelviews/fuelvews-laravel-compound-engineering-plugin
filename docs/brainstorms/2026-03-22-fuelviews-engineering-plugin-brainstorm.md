# Fuelviews Engineering Plugin Brainstorm

**Date:** 2026-03-22
**Status:** Complete
**Origin:** User-provided master plan (24 sections)

---

## What We're Building

Fuelviews Engineering (fv) is a forked Compound Engineering workflow plugin for Claude Code, built as `plugins/fuelviews-engineering/` in this repo alongside the existing `compound-engineering` plugin.

It makes AI-assisted development more reliable in large, messy, long-lived Laravel repos by adding:

- **Layered impact discovery** with uncertainty tracking (definite/probable/possible/blind spot)
- **Convergent planning and review** (max 4 rounds, evidence-based stop conditions)
- **Repo-layer truth** (docs/ai/, plans/, handoffs/) that carries memory between sessions
- **Laravel-specific quality checks** (dead code, DRY, convention enforcement, Boost awareness)
- **Legacy repo catch-up** for normalizing old repos with scattered plans and stale docs
- **Worktree-based task isolation** via adapter contract
- **GitNexus knowledge graph integration** from Phase 1 for deeper code discovery

The goal: make the system itself carry memory, enforce planning quality, reduce drift, and keep future sessions from starting blind.

---

## Why This Approach

CE is a mature multi-agent workflow system (25+ agents, 44+ skills) but lacks:
- Impact discovery and blast-radius tracking
- Convergent review loops with stop conditions
- Laravel/PHP-specific intelligence
- Repo-layer truth that persists across sessions
- Legacy repo normalization
- Explicit plan-to-reality reconciliation

Forking as a new plugin in the same repo gives us full control over workflow skills while sharing infrastructure (CLI, converters, marketplace tooling) and making it easy to pull upstream CE improvements selectively.

---

## Key Decisions

### 1. Fork Strategy: New plugin in this repo
- Create `plugins/fuelviews-engineering/` alongside `compound-engineering`
- Full ownership of skills, agents, hooks, templates
- Share repo infrastructure (CLI, marketplace metadata, converters)
- Can selectively pull CE improvements

### 2. Build Order: Section 22 sequence, build everything
1. Master repo/base/plugin scaffolds
2. Active plan + impact artifact schemas
3. /fv:plan internal planning phases
4. /fv:plan-sync
5. /fv:review convergence model
6. /fv:repo-catchup
7. Laravel checks
8. Worktree adapter integration
9. Boost-aware enhancements

### 3. Impact Artifacts: Separate file, linked from plan
- `plans/active/<slug>.impact.md` alongside `<slug>.plan.md`
- Plan references impact, impact updates independently each round
- Clean separation of concerns, easier to diff round-over-round
- Each impact includes: discovery round, confidence summary, edit/read/watch sets, blind spots, evidence notes, risks

### 4. Laravel Quality: Mandatory in pipeline + standalone
- Laravel checks run automatically during /fv:plan and /fv:review rounds
- Also available as standalone agents for ad-hoc diagnostics
- Covers: dead/unused code, DRY violations, convention enforcement, best practices

### 5. Agent Reuse: Curate from CE
- Keep agents relevant to Laravel/PHP/JS/TS work
- Drop Ruby/Python-specific agents (dhh-rails-reviewer, kieran-rails-reviewer, kieran-python-reviewer, lint)
- Add new fv-specific agents: Laravel conventions reviewer, impact assessment agent, dead/unused reviewer, etc.

### 6. Repo Bootstrap: Prompt user on first use
- When /fv:plan or /fv:start-session detects missing repo layer, ask user:
  - Auto-scaffold minimum structure, or
  - Run full /fv:repo-catchup
- Never silently create structure, never block without offering setup

### 7. Spatie Guidelines: Fetch and distill into references
- Fetch Spatie guidelines (Laravel, security, JS, AI)
- Distill key rules into reference markdown files
- Laravel-focused agents and skills load these references
- Keep authoritative without bloating every prompt

### 8. Naming Convention: Colon separator
- Commands: /fv:plan, /fv:work, /fv:review, /fv:start-session, /fv:repo-catchup, etc.
- Agents: fuelviews-engineering:<category>:<agent-name>
- Consistent with CE ecosystem conventions

### 9. Knowledge Graph: GitNexus from Phase 1
- Integrate GitNexus from the start as the primary graph/index layer
- Impact assessments query the knowledge graph for deeper code discovery
- Enriches grep/glob/bash calls with knowledge graph context via MCP tools + PreToolUse hooks

---

## Commands Overview

| Command | Purpose |
|---------|---------|
| /fv:start-session | Hydrate context, detect repo health, recommend next step |
| /fv:plan | Full planning pipeline with impact discovery and convergent review |
| /fv:impact | Standalone blast-radius diagnostic tool |
| /fv:work | Implement against locked plan, monitor drift |
| /fv:review | Convergent code review with impact every round |
| /fv:plan-sync | Reconcile plan with implementation and review outcomes |
| /fv:compound | Capture reusable learnings and patterns |
| /fv:close-task | Final closure check, verify sync and handoff |
| /fv:repo-catchup | Normalize legacy repo structure and docs |

---

## Planning Pipeline (Phases)

0. Task intake (normalize request, create task record, load repo truth)
1. Initial impact (broad discovery, entry points, edit/read/watch sets, risks, blind spots)
2. Plan v1 (first concrete implementation approach)
3. Plan review round 1 (pressure-test with reviewers, find P1-P3 issues)
4. Impact assessment round 1 (plan-aware dependency discovery)
5. Deepen-plan (stress-test assumptions, explore alternatives)
6. Plan review rounds 2-4 (max 4 total, impact every round, stop on convergence)
7. Finalized-plan deepest impact (contract validation)
8. Plan lock (freeze as implementation contract)

---

## Review Pipeline

- Max 4 review rounds
- Impact assessment every round, deeper each round
- Each round: inspect diff vs plan, identify P1-P3, apply fixes, run impact, update plan if drifted
- Stop on convergence (no new actionable findings)
- Output: resolved findings, open excluded findings, plan deltas, impact misses

---

## Impact Discovery Categories

| Category | Meaning |
|----------|---------|
| Definite | Confirmed through evidence |
| Probable | Strong indicators, not yet confirmed |
| Possible | Weak indicators, needs investigation |
| Blind spot | Unknown unknowns, flagged for awareness |

---

## Severity Policy

- **P1:** Correctness/security/data-loss/broken-behavior
- **P2:** Architecture/maintainability/test gaps with material risk
- **P3:** Consistency/simplification/DRY/best-practice improvements
- Fix P1-P3 by default; user may exclude specific findings
- Exclusions stored structurally, not raised repeatedly

---

## Source-of-Truth Order

1. Repo CLAUDE.md
2. docs/ai/current-work.md
3. plans/_index.md
4. Active canonical plan
5. Active impact artifact
6. docs/handoffs/latest.md
7. docs/ai/architecture.md
8. docs/ai/conventions.md
9. docs/ai/repo-map.md
10. ADRs / decisions
11. Archived plans (only when needed for history)

---

## New Agents Needed

### Review agents (language/framework-specific)
- **PHP reviewer** - PSR-12 compliance, type safety, modern PHP patterns, error handling, performance
- **Laravel reviewer** - fat controllers, business logic placement, policy/validation layers, service providers, Eloquent patterns, middleware
- **Blade reviewer** - template hygiene, component usage, XSS prevention, logic leaking into views, Livewire/Alpine integration
- **JavaScript reviewer** - ES module patterns, Alpine.js/Livewire interop, async handling, DOM manipulation safety
- **PostgreSQL reviewer** - query performance, index usage, migration safety, N+1 detection, transaction boundaries, JSON column patterns

### Review agents (quality-focused)
- **Laravel conventions reviewer** - Spatie-informed conventions, route/controller/model naming, config patterns
- **Laravel best practices reviewer** - community best practices from alexeymezenin/laravel-best-practices
- **Laravel dead/unused reviewer** - orphaned actions, stale jobs/listeners/views, dead helpers, unused routes
- **Laravel DRY reviewer** - repeated validation, authorization, query fragments, orchestration across user/admin flows

### Workflow agents
- **Impact assessment agent** - evidence-based scope discovery and blast-radius mapping
- **Synthesis agent** - dedupe findings across reviewers, synthesize severity and next actions

---

## Refined Decisions

### 10. Boost Integration: Extend with fv sections
- fv can append fv-specific sections to Boost-generated files (clearly delimited with markers)
- If Boost is not installed but repo supports it, suggest once on first /fv:start-session or /fv:repo-catchup
- Record the user's yes/no decision in docs/ai/conventions.md so it's never asked again

### 11. Worktree Adapter: Wrap custom scripts
- User has custom shell scripts exposing: create, list, switch, remove
- fv adapter wraps these four operations
- /fv:plan prompts user on whether to create a worktree for this task
- Choice is recorded in the plan artifact
- /fv:work operates in the correct worktree context
- /fv:close-task suggests cleanup/merge/archive

### 12. GitNexus: Full integration from Phase 1
- **Rebuild strategy:** Continuous file watcher (GitNexus watches for changes and incrementally updates)
- **Passive enrichment:** PreToolUse hooks enrich all grep/glob/bash calls with graph context for all agents
- **Active queries:** Impact assessment agent makes direct MCP tool calls for deeper dependency/blast-radius analysis
- Both layers active simultaneously for maximum coverage

### 13. Hook Enforcement: Warn at boundaries, block on close
- **Freshness warnings:** Only at workflow boundaries (/fv:review, /fv:close-task, /fv:plan-sync), not mid-work
- **Blocking gate:** Only /fv:close-task blocks if plan isn't synced, handoff isn't updated, or unresolved P1s exist
- **All other commands:** Warn only, never block
- This avoids alert fatigue during iterative work while ensuring the exit gate enforces quality

---

### 14. Multi-Repo: Full orchestration
- fv tracks plans and impact across related repos (app + package forks + original packages)
- Handles the common Fuelviews workflow: Laravel app depends on owned packages and package forks in separate repos
- Phase 3 build priority (after core single-repo workflow is solid)

### 15. Boost Section Delimiters: HTML comment markers
- Use `<!-- fv:start -->` / `<!-- fv:end -->` in Boost-generated files
- Invisible in rendered markdown, clear in source
- Standard pattern for tool-managed sections

### 16. GitNexus Setup: Recommend + offer to install
- /fv:start-session detects GitNexus is missing, explains value, offers to install
- Record decision in docs/ai/conventions.md (like Boost)
- Never auto-install without consent

---

## All Decisions Summary

| # | Topic | Decision |
|---|-------|----------|
| 1 | Fork strategy | New plugin in this repo (plugins/fuelviews-engineering/) |
| 2 | Build order | Section 22 sequence, build everything |
| 3 | Impact artifacts | Separate file linked from plan |
| 4 | Laravel quality | Mandatory in pipeline + standalone agents |
| 5 | Agent reuse | Curate from CE (drop Ruby/Python-specific) |
| 6 | Repo bootstrap | Prompt user to choose on first use |
| 7 | Spatie guidelines | Fetch and distill into agent/skill references |
| 8 | Naming | fv:plan, fv:work, fv:review (colon separator) |
| 9 | Knowledge graph | GitNexus from Phase 1 |
| 10 | Boost integration | Extend with fv sections (<!-- markers -->) |
| 11 | Worktree adapter | Wrap custom create/list/switch/remove scripts |
| 12 | GitNexus integration | Continuous watcher + PreToolUse hooks + direct MCP queries |
| 13 | Hook enforcement | Warn at boundaries, block only on /fv:close-task |
| 14 | Multi-repo | Full orchestration (app + packages + forks) |
| 15 | Boost delimiters | <!-- fv:start --> / <!-- fv:end --> |
| 16 | GitNexus setup | Recommend + offer to install, record decision |

---

## Next Steps

Run `/workflows:plan` to create the implementation plan following the Section 22 build order.
