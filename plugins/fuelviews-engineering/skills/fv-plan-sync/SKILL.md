---
name: fv:plan-sync
description: Reconcile plan artifacts against implementation reality. Use after work/review cycles to sync plan state with actual code changes.
argument-hint: "[task slug or plan path]"
---

# Reconcile Plan Against Implementation

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

Compare a plan's task list and scope against the actual implementation state, then update drifted sections to reflect reality. This keeps plan artifacts useful as living documentation rather than stale snapshots.

### Key Behaviors

1. **Plan Resolution** -- Locate the plan by task slug or path. Read its task list, scope boundaries, and impact artifact.
2. **Implementation Scan** -- Compare plan tasks against actual commits and file changes since the plan was locked:
   - Tasks marked complete but not implemented
   - Tasks not in the plan but implemented (scope additions)
   - Tasks implemented differently than planned (drift)
3. **Drift Reconciliation** -- For each drifted item, update the plan to reflect actual implementation. Mark scope additions as "unplanned" with rationale if available from commit messages.
4. **Plan Index Sync** -- Update the plan index entry with current completion percentage and sync timestamp.
5. **Handoff Update** -- Refresh `docs/ai/current-work.md` and `docs/ai/handoff.md` with synced plan state.

### Sync Artifact

Write sync results to `docs/ai/plans/<task-slug>/sync-<timestamp>.md` containing:
- Items synced (with before/after)
- Unplanned additions flagged
- Remaining incomplete tasks

## Key References

- [plan-sync-rules.md](./references/plan-sync-rules.md)
- [handoff-format.md](./references/handoff-format.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- scan recent commits and file changes for drift detection

### FV Agents

- `fuelviews-engineering:workflow:plan-sync-agent` -- orchestrate comparison and reconciliation logic

## Implementation Status

> Full implementation in Phase 2. This shell defines the sync contract and drift reconciliation model.
