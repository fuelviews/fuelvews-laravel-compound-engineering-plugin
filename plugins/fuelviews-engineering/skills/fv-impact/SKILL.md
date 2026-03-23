---
name: fv:impact
description: Run a standalone impact assessment diagnostic. Use when checking blast radius, verifying scope drift, or comparing approaches without modifying a plan.
argument-hint: "[task slug or plan path]"
---

# Standalone Impact Assessment

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

Run an impact assessment as a standalone diagnostic without entering the full planning pipeline. Useful for checking blast radius before committing to an approach, verifying scope drift mid-implementation, or comparing alternative approaches side by side.

### Key Behaviors

1. **Input Resolution** -- Accept a task slug (matched against plan index) or an explicit plan file path. If neither provided, ask the user.
2. **Depth Selection** -- Determine impact depth from the task's severity classification or allow the user to override (shallow, standard, deep).
3. **Impact Analysis** -- Run the impact-assessment-agent at the specified depth against the current codebase state.
4. **Output** -- Write impact artifact to `docs/ai/plans/<task-slug>/impact-<timestamp>.md`. Do not modify the plan itself.
5. **Comparison Mode** -- If a previous impact artifact exists for the same task, produce a delta summary highlighting new or resolved blast-radius items.

### Depth Levels

| Depth | Scope | When to Use |
|-------|-------|-------------|
| shallow | Direct file and class dependencies | Quick sanity check |
| standard | + route/config/migration impacts | Default for most tasks |
| deep | + cross-package, queue, event chain | High-severity or unfamiliar code |

## Key References

- [impact-depth-guide.md](./references/impact-depth-guide.md)
- [severity-policy.md](./references/severity-policy.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- map dependency graph for impact scope

### FV Agents

- `fuelviews-engineering:planning:impact-assessment-agent` -- execute impact analysis at specified depth

## Implementation Status

> Full implementation in Phase 2. This shell defines the diagnostic contract and depth model.
