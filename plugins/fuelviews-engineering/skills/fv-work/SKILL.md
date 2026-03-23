---
name: fv:work
description: Execute implementation from a locked plan with drift monitoring. Use when a plan is locked and ready for implementation.
argument-hint: "[task slug or plan path]"
---

# Execute Implementation from a Locked Plan

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

Implement a locked plan task-by-task with incremental commits, drift monitoring, and Laravel quality checks. The plan must be in `locked` status before work begins.

### Key Behaviors

1. **Plan Verification** -- Read the locked plan and its latest impact artifact. Hard-fail if plan status is not `locked`.
2. **Task Loop** -- Iterate through plan tasks in order:
   - Implement the task
   - Run Laravel quality checks (PSR-12, type safety, test coverage)
   - Create an incremental commit with a conventional message
   - Mark task complete in plan tracking
3. **Drift Monitoring** -- After each task, compare implementation against plan scope. Flag if implementation is diverging from planned blast radius.
4. **Quality Gates** -- Dispatch fv Laravel quality agents after each logical unit of work. P1 quality findings pause the loop and ask the user how to proceed.
5. **Worktree Awareness** -- If operating in a git worktree, respect worktree boundaries. Do not commit to the wrong branch.

### Commit Convention

Each incremental commit follows the project's conventional commit format:
- `feat:` / `fix:` / `refactor:` / `test:` as appropriate
- Reference the task slug in the commit body when useful

## Key References

- [drift-monitoring.md](./references/drift-monitoring.md)
- [laravel-quality-rules.md](./references/laravel-quality-rules.md)
- [incremental-commit-policy.md](./references/incremental-commit-policy.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- verify implementation context before each task
- `compound-engineering:review:code-review-agent` -- lightweight review on each commit

### FV Agents

- `fuelviews-engineering:quality:laravel-quality-agent` -- PSR-12, type safety, and convention checks
- `fuelviews-engineering:workflow:drift-monitor-agent` -- compare implementation against plan scope
- `fuelviews-engineering:quality:laravel-test-agent` -- verify test coverage for implemented code

## Implementation Status

> Full implementation in Phase 2. This shell defines the work loop contract and quality gates.
