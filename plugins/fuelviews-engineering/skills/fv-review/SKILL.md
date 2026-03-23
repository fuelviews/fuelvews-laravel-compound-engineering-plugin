---
name: fv:review
description: Run convergent code review with Laravel-specific agents. Use after implementation to review code changes against plan and impact artifacts.
---

# Convergent Code Review with Laravel Agents

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

Run a multi-agent convergent code review against the current diff, comparing implementation to the plan and impact artifacts. Laravel-specific agents are mandatory panel members. The review converges when no P1 or P2 findings remain.

### Key Behaviors

1. **Agent Panel Loading** -- Load the review agent panel from `docs/ai/fuelviews-engineering.local.md` if it defines a custom panel. Otherwise use the default panel: CE code-review-agent + fv Laravel agents.
2. **Review Rounds** -- Maximum 4 rounds with convergence check after each:
   - Round 1: Full panel review of all changes
   - Rounds 2-4: Re-review only unresolved findings and new changes
   - Converge when round produces no P1 or P2 findings
3. **Mandatory FV Agents** -- Laravel quality and convention agents always participate regardless of custom panel configuration.
4. **P1 Blocking** -- Any unresolved P1 finding blocks merge recommendation. The skill surfaces P1s prominently and asks the user for resolution.
5. **Output** -- Write review artifact to `docs/ai/plans/<task-slug>/review-<timestamp>.md` with findings, resolutions, and convergence status.

### Severity Classification

| Severity | Impact | Blocks Merge |
|----------|--------|--------------|
| P1 | Correctness, security, data loss | Yes |
| P2 | Performance, maintainability | No (but tracked) |
| P3 | Style, naming, minor improvements | No |

## Key References

- [convergence-rules.md](./references/convergence-rules.md)
- [severity-policy.md](./references/severity-policy.md)
- [laravel-review-rules.md](./references/laravel-review-rules.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:review:code-review-agent` -- general code review (correctness, architecture)
- `compound-engineering:review:security-review-agent` -- security-focused review pass

### FV Agents

- `fuelviews-engineering:quality:laravel-quality-agent` -- Laravel conventions, PSR-12, SOLID
- `fuelviews-engineering:quality:laravel-test-agent` -- test coverage and test quality review
- `fuelviews-engineering:review:convergent-review-agent` -- drive multi-round convergence loop

## Implementation Status

> Full implementation in Phase 2. This shell defines the review panel contract and convergence rules.
