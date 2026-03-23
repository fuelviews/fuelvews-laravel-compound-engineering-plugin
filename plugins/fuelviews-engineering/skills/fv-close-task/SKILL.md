---
name: fv:close-task
description: Close a task with blocking gates on unresolved P1s and stale sync. Use when finishing a task to verify all gates pass and generate handoff.
argument-hint: "[task slug or plan path]"
---

# Close a Task with Gate Verification

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

Verify all closure gates pass for a task, then generate a final handoff summary. Blocks closure if the plan is not synced, P1 findings remain unresolved, or handoff documentation is stale.

### Blocking Gates

All gates must pass before a task can be closed:

| Gate | Condition | Remediation |
|------|-----------|-------------|
| Plan Synced | Last sync timestamp is after last commit | Run `fv:plan-sync` |
| No Unresolved P1s | All P1 findings resolved or explicitly accepted | Address P1s or use `fv:review` |
| Handoff Updated | `current-work.md` reflects final state | Run `fv:plan-sync` |
| Tests Pass | Test suite passes (if applicable) | Fix failing tests |

### Key Behaviors

1. **Gate Check** -- Evaluate all blocking gates. If any fail, report which gates failed and suggest the remediation action. Do not proceed past failed gates without explicit user override.
2. **User Override** -- If gates fail, ask the user whether to override (with warning) or remediate first. Log overrides in the closure artifact.
3. **Closure Summary** -- Generate a summary of the task: what was planned, what was implemented, any drift, and final review status.
4. **Handoff Generation** -- Update `docs/ai/handoff.md` with closure summary for the next session or developer.
5. **Worktree Cleanup Suggestion** -- If the task was implemented in a worktree, suggest cleanup commands but do not execute them without user confirmation.

### Closure Artifact

Write to `docs/ai/plans/<task-slug>/closure-<timestamp>.md`:
- Gate results (pass/fail/override)
- Implementation summary
- Remaining notes or follow-up items

## Key References

- [closure-gates.md](./references/closure-gates.md)
- [handoff-format.md](./references/handoff-format.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- verify implementation state for gate checks

### FV Agents

- `fuelviews-engineering:workflow:closure-gate-agent` -- evaluate blocking gates and produce closure artifact

## Implementation Status

> Full implementation in Phase 2. This shell defines the gate contract and closure workflow.
