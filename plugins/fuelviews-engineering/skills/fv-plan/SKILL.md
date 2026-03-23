---
name: fv:plan
description: Create a convergent implementation plan with impact discovery and deepening. Use when starting a new task that needs structured planning with review rounds.
argument-hint: "[task description or feature request]"
---

# Create a Convergent Implementation Plan

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

Transform a task description into a structured, reviewed implementation plan using a 9-phase convergent pipeline. Plans undergo up to 4 review rounds with impact discovery and optional deepening (max 2 deepen passes).

### Pipeline Phases

| Phase | Name | Description |
|-------|------|-------------|
| 0 | Setup: Load Context | Read repo truth, active plans, and session state |
| 1 | Setup: Scope & Classify | Classify task, set severity, determine impact depth |
| 2 | Loop: Research | Codebase research and dependency analysis |
| 3 | Loop: Draft Plan | Generate initial plan with tasks, risks, and gates |
| 4 | Loop: Impact Assessment | Run blast-radius and dependency impact analysis |
| 5 | Loop: Review Round | Convergent review with agent panel (max 4 rounds) |
| 6 | Loop: Deepen (optional) | Deepen plan if significant new scope found (max 2) |
| 7 | Finalize: Lock Plan | Lock plan, write frontmatter, generate plan index entry |
| 8 | Finalize: Handoff | Update current-work.md and handoff.md |

### Convergence Rules

- Maximum 4 review rounds per plan
- Mandatory deepen after round 1 if impact assessment reveals significant new scope
- Optional deepen after round 2 if new scope still emerging
- Plan locks when review round produces no P1 or P2 findings
- P1 findings always block lock

## Key References

- [convergent-planning-loop.md](./references/convergent-planning-loop.md)
- [plan-finalization.md](./references/plan-finalization.md)
- [convergence-rules.md](./references/convergence-rules.md)
- [impact-depth-guide.md](./references/impact-depth-guide.md)
- [severity-policy.md](./references/severity-policy.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- scan codebase for patterns and dependencies
- `compound-engineering:review:plan-review-agent` -- review plan structure and completeness

### FV Agents

- `fuelviews-engineering:planning:impact-assessment-agent` -- run blast-radius analysis
- `fuelviews-engineering:planning:convergent-review-agent` -- drive convergent review loop
- `fuelviews-engineering:quality:laravel-quality-agent` -- validate Laravel conventions in plan

## Implementation Status

> Full implementation in Phase 2. This shell defines the pipeline contract and phase inventory.
