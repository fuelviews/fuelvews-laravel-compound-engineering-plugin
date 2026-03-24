---
title: Align fv plugin with official Claude Code docs patterns
type: refactor
status: drafting
date: 2026-03-23
---

# Align fv Plugin with Official Claude Code Docs Patterns

## Overview

Audit of the official Claude Code skills, subagents, and plugins documentation revealed 7 gaps between our fv plugin implementation and the recommended patterns. This plan fixes each one.

## Problem Statement

| Gap | Impact | Source |
|-----|--------|--------|
| SKILL.md files exceed 500 lines | Full content loads into context on invocation. Large skills waste tokens. | [skills.md](https://code.claude.com/docs/en/skills.md): "Keep SKILL.md under 500 lines" |
| No `allowed-tools` on read-only skills | Skills like fv:impact can accidentally write/edit when they should be diagnostic-only | skills.md: `allowed-tools` frontmatter field |
| No `skills` preloading on review agents | Each agent re-reads reference files at runtime instead of having them injected at startup | [sub-agents.md](https://code.claude.com/docs/en/sub-agents.md): `skills` frontmatter field |
| No `${CLAUDE_SKILL_DIR}` usage | Skills reference scripts/files with hardcoded relative paths | skills.md: available string substitutions |
| Background agents need pre-approved permissions | `run_in_background: true` agents auto-deny non-approved permissions | sub-agents.md: background subagent behavior |
| Infrastructure discovery not using `context: fork` | Heavy discovery dispatched as inline Task instead of isolated forked skill | skills.md: `context: fork` pattern |
| No `effort` level on agents/skills | Missing opportunity to route lighter work to faster processing | sub-agents.md: `effort` frontmatter field |

## Proposed Solution

### 1. Split oversized SKILL.md files into SKILL.md + references

**Current state (line counts):**

| Skill | Lines | Over 500? |
|-------|-------|-----------|
| fv-plan | ~1150 | Yes — needs splitting |
| fv-review | ~620 | Yes — needs splitting |
| fv-work | ~530 | Borderline — split if easy |
| fv-repo-catchup | ~730 | Yes — needs splitting |
| fv-normalize | ~520 | Borderline |
| fv-start-session | ~490 | OK |
| fv-plan-sync | ~410 | OK |
| fv-close-task | ~400 | OK |
| fv-impact | ~200 | OK |
| fv-brainstorm | ~260 | OK |

**Split strategy for fv-plan (largest — ~1150 lines):**

Move these sections to reference files in `skills/fv-plan/references/`:

| Section | Move to | Lines saved |
|---------|---------|-------------|
| Plan templates (MINIMAL/MORE/A LOT) | `references/plan-templates.md` | ~250 |
| Infrastructure discovery categories + reuse check rules | `references/infrastructure-reuse-rules.md` | ~150 |
| Presentation format templates (markdown tables) | `references/presentation-formats.md` | ~100 |
| Issue creation section | `references/issue-creation.md` | ~50 |
| Convergent loop error recovery table | `references/error-recovery.md` | ~30 |

SKILL.md keeps: phase structure, gates, AskUserQuestion calls, agent dispatch instructions, return contracts. Link to references: `For plan templates, see [plan-templates.md](references/plan-templates.md)`.

**Split strategy for fv-review (~620 lines):**

| Section | Move to | Lines saved |
|---------|---------|-------------|
| Todo file template and naming conventions | `references/todo-conventions.md` | ~80 |
| Conditional agent criteria tables | `references/conditional-agents.md` | ~50 |

**Split strategy for fv-repo-catchup (~730 lines):**

| Section | Move to | Lines saved |
|---------|---------|-------------|
| 6-signal classification algorithm | `references/plan-classification.md` | ~120 |
| Batch plan sync tiers | `references/batch-sync.md` | ~80 |
| Risk detection patterns table | `references/risk-patterns.md` | ~40 |

After splitting, verify each SKILL.md is under 500 lines.

### 2. Add `allowed-tools` to read-only skills

Skills that should NOT modify files need tool restrictions:

| Skill | Should allow | Rationale |
|-------|-------------|-----------|
| `fv:impact` | `Read, Grep, Glob, Bash(git *), Bash(ast-grep *)` | Diagnostic only — must not edit plan or code |
| `fv:start-session` | `Read, Grep, Glob, Bash(git *), Bash(composer *), Bash(npm *), Bash(php *), Bash(which *), Bash(herd *), Bash(gitnexus *)` | Detection and setup — writes only to settings files |

Skills that need full tool access (fv:plan, fv:work, fv:review, fv:normalize, fv:repo-catchup, fv:plan-sync, fv:close-task) should NOT have `allowed-tools` — they need Write/Edit for artifacts.

### 3. Add `skills` preloading to review agents

Instead of instructing each review agent to "read references/spatie-laravel.md", preload the references as skills in the agent frontmatter. The full content is injected at startup — no runtime file reading needed.

Create lightweight wrapper skills for the references:

**`skills/laravel-conventions-ref/SKILL.md`:**
```yaml
---
name: laravel-conventions-ref
description: Spatie + alexeymezenin Laravel conventions reference
user-invocable: false
---
```
Content: the contents of `references/spatie-laravel.md` + `references/laravel-best-practices.md`

**`skills/severity-policy-ref/SKILL.md`:**
```yaml
---
name: severity-policy-ref
description: P1/P2/P3 severity definitions for review agents
user-invocable: false
---
```
Content: the contents of `references/severity-policy.md`

Then update review agents:
```yaml
---
name: laravel-reviewer
description: Reviews Laravel code for architecture and conventions
skills:
  - laravel-conventions-ref
  - severity-policy-ref
---
```

**Impact:** Eliminates the "instruct each agent to read reference files" pattern. References are injected once at agent startup. Agents no longer need runtime file reads for references. The `user-invocable: false` flag keeps these out of the `/` menu.

**Tradeoff:** Each agent's context grows by the reference content size. But this is the same content they were reading anyway — now it's guaranteed to load instead of depending on the agent following instructions.

### 4. Use `${CLAUDE_SKILL_DIR}` for script references

Any skill that references bundled scripts or files should use `${CLAUDE_SKILL_DIR}` instead of relative paths. This is relevant for:

- fv:normalize (references process.mjs scripts when script-first is implemented)
- Any future skills with bundled scripts

Currently no fv skills have bundled scripts, so this is a convention to establish:

Add to `AGENTS.md` plugin instructions:
```
When referencing scripts or files bundled with a skill, use `${CLAUDE_SKILL_DIR}`
for path resolution. Example: `bash ${CLAUDE_SKILL_DIR}/scripts/process.mjs`
```

### 5. Pre-approve permissions for background agents

The docs say: "Before launching [background subagents], Claude Code prompts for any tool permissions the subagent will need, ensuring it has the necessary approvals upfront."

Our `run_in_background: true` dispatches in fv:plan (Phase 1.3) and fv:review (last agents) need the orchestrating skill to note which permissions the background agents need:

**fv:plan Phase 1.3 (external research — background):**
```
Tools needed: Read, Grep, Glob, WebFetch, WebSearch
```

**fv:review last agents (agent-native + learnings — background):**
```
Tools needed: Read, Grep, Glob
```

Add a note after each `run_in_background: true` dispatch: "Ensure these tools are pre-approved before launching: [list]."

### 6. Use `context: fork` for infrastructure discovery

The infrastructure discovery in fv:plan Phase 1.1d is dispatched as a general-purpose Task. It should be a skill with `context: fork` for better isolation:

**Create `skills/fv-infra-discovery/SKILL.md`:**
```yaml
---
name: fv-infra-discovery
description: Discover reusable infrastructure in the codebase
context: fork
agent: Explore
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(ast-grep *), Bash(git *)
---
```

Content: the infrastructure discovery instructions currently inline in fv:plan Phase 1.1d.

Then fv:plan Phase 1.1d becomes: "Invoke the `fv-infra-discovery` skill with the feature description."

**Benefits:**
- Isolated context — verbose query results don't pollute orchestrator
- `Explore` agent type — fast, read-only, uses Haiku by default
- `allowed-tools` prevents accidental writes during discovery
- Reusable — fv:work could also invoke it for pre-creation checks

### 7. Add `effort` levels to agents and skills

Use the `effort` frontmatter to route lighter work to faster processing:

| Agent/Skill | Effort | Rationale |
|-------------|--------|-----------|
| Review agents (all) | `high` | Code review needs thoroughness |
| impact-assessment-agent | `high` | Blast radius analysis needs depth |
| synthesis-agent | `medium` | Dedup is structured, not creative |
| fv:start-session | `medium` | Detection and setup, not analysis |
| fv:impact | `high` | Needs thorough tracing |
| fv:normalize (Tier 1-2) | `medium` | Automated tool execution |
| fv:normalize (Tier 3-4) | `high` | Requires judgment |

## Files Changed

| File | Action |
|------|--------|
| `skills/fv-plan/SKILL.md` | Split to <500 lines, add infra-discovery skill invocation |
| `skills/fv-plan/references/plan-templates.md` | **NEW** — extracted from SKILL.md |
| `skills/fv-plan/references/infrastructure-reuse-rules.md` | **NEW** — extracted from SKILL.md |
| `skills/fv-plan/references/presentation-formats.md` | **NEW** — extracted from SKILL.md |
| `skills/fv-plan/references/issue-creation.md` | **NEW** — extracted from SKILL.md |
| `skills/fv-review/SKILL.md` | Split to <500 lines |
| `skills/fv-review/references/todo-conventions.md` | **NEW** — extracted |
| `skills/fv-repo-catchup/SKILL.md` | Split to <500 lines |
| `skills/fv-repo-catchup/references/plan-classification.md` | **NEW** — extracted |
| `skills/fv-repo-catchup/references/batch-sync.md` | **NEW** — extracted |
| `skills/fv-impact/SKILL.md` | Add `allowed-tools` frontmatter |
| `skills/fv-start-session/SKILL.md` | Add `allowed-tools` frontmatter |
| `skills/laravel-conventions-ref/SKILL.md` | **NEW** — preloadable reference skill |
| `skills/severity-policy-ref/SKILL.md` | **NEW** — preloadable reference skill |
| `skills/fv-infra-discovery/SKILL.md` | **NEW** — forked discovery skill |
| All 8 review agents | Add `skills` preloading, add `effort` level |
| `agents/workflow/synthesis-agent.md` | Add `effort: medium` |
| `agents/workflow/impact-assessment-agent.md` | Add `effort: high` |
| `AGENTS.md` | Add `${CLAUDE_SKILL_DIR}` convention |
| `README.md` | Update skill count |

## Acceptance Criteria

- [ ] No SKILL.md file exceeds 500 lines
- [ ] All extracted content linked from SKILL.md via `[file.md](references/file.md)` syntax
- [ ] `fv:impact` has `allowed-tools` restricting to read-only
- [ ] Review agents use `skills` field to preload references
- [ ] `fv-infra-discovery` skill exists with `context: fork` and `agent: Explore`
- [ ] Background agent dispatches note required pre-approved permissions
- [ ] `effort` levels set on all agents and applicable skills
- [ ] `${CLAUDE_SKILL_DIR}` convention documented in AGENTS.md
- [ ] `bun test` passes
- [ ] `bun run release:validate` passes

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Splitting SKILL.md breaks phase flow | Keep phase structure in SKILL.md. Only move templates, tables, and reference content to sub-files. |
| Preloaded skills increase agent context size | Same content was being read at runtime anyway. Now it's guaranteed to load instead of optional. |
| `allowed-tools` on fv:impact blocks needed tools | Audit all tools fv:impact actually uses before restricting. Include Bash for git and ast-grep. |
| `context: fork` changes infra discovery behavior | Explore agent is read-only by default. The discovery subagent was already instructed to be read-only. No behavior change. |

## Sequencing

Independent of the token consolidation plan and the quality audit plan. Can ship as its own PR.

## References

- [Claude Code Skills docs](https://code.claude.com/docs/en/skills.md)
- [Claude Code Subagents docs](https://code.claude.com/docs/en/sub-agents.md)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference.md)
