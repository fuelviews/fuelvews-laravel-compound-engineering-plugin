---
title: Consolidate fuelviews-engineering plugin to reduce token usage
type: refactor
status: drafting
date: 2026-03-23
deepened_at: 2026-03-23
reviewed_at: 2026-03-23
---

# Consolidate fuelviews-engineering Plugin to Reduce Token Usage

## Overview

Merge high-overlap fv review agents to reduce parallel dispatch count and token burn. Ship in one PR.

## Problem Statement

- **5 mandatory + 2 conditional fv review agents** dispatched per review round, plus 5 CE agents
- **~40% content overlap** between `laravel-performance-reviewer` and `postgresql-reviewer` (N+1, chunking, `->select()`, job config)
- **Synthesis agent wastes tokens** deduplicating overlapping findings from agents that check the same things

Note: `postgresql-reviewer` and `laravel-codebase-health-reviewer` are conditional (migrations only), not mandatory. The "8 agents" framing in the prior draft was misleading.

## Proposed Solution

Two agent merges + mechanical consequences. One PR.

### 1. Merge `performance-reviewer` + `postgresql-reviewer` into `laravel-data-reviewer`

**Why:** ~40% overlapping content across N+1 detection, chunking, `->select()`, job config.

**Merged structure:**
- Section A: Query & Runtime Performance (always runs) -- `preventLazyLoading()`, `withCount()`/`withSum()`, caching, chunking, `->select()`, Livewire `#[Computed]`, `exists()`, `loadMissing()`
- Section B: Migration & Database Safety (skip if no migration files in changeset) -- `CREATE INDEX CONCURRENTLY`, three-step columns, `lock_timeout`, GIN/partial/expression indexes, transaction boundaries
- Section C: Job Database Safety -- `$tries`, `$backoff`, `ShouldBeUnique`, `WithoutOverlapping`, `afterCommit`, idempotent design

**Dispatch mode:** Mandatory (always runs). Section A applies to all PRs. Section B is conditional within the agent: "If no migration files in changeset, skip Section B."

Use markdown headers for section boundaries (not XML tags -- unnecessary complexity per review feedback).

### 2. Merge `conventions-reviewer` into `laravel-reviewer`

**Why:** Conventions is the lowest-severity agent (almost all P3). Naming tables and syntax preferences are a natural sub-section of Laravel architecture.

**Merged structure:** Add `## Naming & Convention Checks` section to `laravel-reviewer` covering controller/route/model/table naming, relationship naming, validation syntax, helper preferences. Preserve naming convention tables as quick-reference.

Architecture rules take precedence over conventions (P1-P2 vs P3). If a controller has both a naming issue and an architectural issue, report both.

### 3. Delete "This agent does NOT cover" routing tables

**Why:** These cross-reference lists exist because over-specialization required routing tables to prevent overlap. With fewer, broader agents, the routing tables are unnecessary. The synthesis agent already handles dedup with its 3-layer protocol.

Remove "Scope / This agent does NOT cover / Overlap resolution" sections from all agents. Keep a brief one-line scope statement at the top of each agent instead.

## Agent Dispatch Before/After

### Before:
**Mandatory (5 fv):** laravel-reviewer, laravel-conventions-reviewer, laravel-performance-reviewer, php-reviewer, blade-reviewer
**Conditional (2 fv):** postgresql-reviewer (migrations), laravel-codebase-health-reviewer (migrations)
**Standard (5 CE):** architecture-strategist, security-sentinel, code-simplicity-reviewer, pattern-recognition-specialist, performance-oracle

### After:
**Mandatory (4 fv):** laravel-reviewer (includes conventions), laravel-data-reviewer (includes performance + postgresql), php-reviewer, blade-reviewer
**Conditional (1 fv):** laravel-codebase-health-reviewer (migrations), javascript-reviewer (JS/Livewire files)
**Standard (5 CE):** unchanged

**-1 mandatory fv dispatch. -1 conditional fv dispatch. Stays under serial-mode threshold for fv-only agents.**

## Files Changed

| File | Action |
|------|--------|
| `agents/review/laravel-reviewer.md` | Add conventions section, remove verbose scope/defers-to |
| `agents/review/laravel-data-reviewer.md` | **NEW** -- merge of performance + postgresql, deduped |
| `agents/review/laravel-performance-reviewer.md` | **DELETE** |
| `agents/review/postgresql-reviewer.md` | **DELETE** |
| `agents/review/laravel-conventions-reviewer.md` | **DELETE** |
| `agents/review/php-reviewer.md` | Update defers-to refs (remove old agent names) |
| `agents/review/blade-reviewer.md` | Update defers-to refs |
| `agents/review/javascript-reviewer.md` | Update defers-to refs |
| `agents/review/laravel-codebase-health-reviewer.md` | Update defers-to refs |
| `agents/workflow/synthesis-agent.md` | Update hardcoded agent name refs in examples |
| `agents/workflow/impact-assessment-agent.md` | Update any agent refs |
| `skills/fv-plan/SKILL.md` | Update dispatch list (Phase 3.1) |
| `skills/fv-review/SKILL.md` | Update mandatory/conditional agent lists |
| `skills/fv-work/SKILL.md` | Update quality check agent list |
| `README.md` | Update agent count (10 -> 8), agent tables, template count (6 -> 9) |

## Acceptance Criteria

- [ ] Review agent count reduced from 8 to 6 (6 review + 2 workflow = 8 total)
- [ ] `laravel-reviewer` includes all conventions checks (naming tables, validation syntax, helpers)
- [ ] `laravel-data-reviewer` covers all performance + postgresql concerns without duplication
- [ ] `laravel-data-reviewer` is mandatory dispatch, with Section B conditional on migration files
- [ ] All remaining agents' defers-to sections updated to reference new names
- [ ] Synthesis agent examples updated with new agent names
- [ ] Merged agents include routing examples covering all absorbed scenarios
- [ ] `fv:review`, `fv:plan`, `fv:work` dispatch lists updated
- [ ] README agent count and tables match actual files
- [ ] README template count updated (6 -> 9)
- [ ] `bun test` passes
- [ ] `bun run release:validate` passes

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Merged agents too large | `laravel-reviewer` ~460 lines, `laravel-data-reviewer` ~450 lines after dedup. Manageable. |
| Lost specialization | No checklist items deleted -- only deduplicated. Every check from merged agents preserved. |
| Broken agent references | Grep all files for `laravel-performance-reviewer`, `laravel-conventions-reviewer`, `postgresql-reviewer` after merge. 15+ files need updating. |
| Synthesis agent confusion | Update synthesis-agent examples and known-agent references. |

## Deferred (separate PRs if needed)

| Item | Why deferred |
|------|-------------|
| Protocol extraction to shared reference | CE chose not to do this. Maintenance win is real but 6 agents is trivial to maintain inline. Revisit if agent count grows. |
| Description trimming (avg 197 -> 150 chars) | Using <50% of description budget. ~330 chars total savings. Trim opportunistically when touching files. |
| Script-first processing for fv:impact, fv:plan-sync, fv:repo-catchup | Different optimization for different skills. Separate plan. Highest potential (60-75% token reduction) but most implementation work. |
| Wire orphaned references | They cost zero tokens when orphaned. Delete clearly unused ones; leave the rest. |
| Merge planning references (convergent-planning-loop + plan-finalization) | Organizational cleanup, not token reduction. One consumer. |

## References

- Prior art: `docs/plans/2026-02-08-refactor-reduce-plugin-context-token-usage-plan.md`
- Script-first architecture: `docs/solutions/skill-design/script-first-skill-architecture.md`
- System prompt design: `plugins/compound-engineering/skills/agent-native-architecture/references/system-prompt-design.md`

## Review Feedback (2026-03-23)

Three parallel reviewers (DHH, Kieran, Simplicity) converged on:
- Items 1+2 are correct, ship them
- Protocol extraction, script-first, description trimming are scope creep or premature -- defer
- 3-phase rollout unnecessary -- one PR
- Mandatory vs conditional agent count was misstated (fixed above)
- 15+ files with stale agent name references were missing from change list (fixed above)
- Synthesis agent examples contain hardcoded old agent names (added to change list)
- DHH pushed for 8->4 (absorb codebase-health too) -- deferred for now, revisit after shipping the core merge
