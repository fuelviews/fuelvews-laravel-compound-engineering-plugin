---
name: fv:start-session
description: Initialize a Fuelviews Engineering session. Use when starting work on a Laravel project to load repo truth, detect CE dependency, check reference freshness, and identify active tasks.
---

# Initialize a Fuelviews Engineering Session

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

Bootstrap a Fuelviews Engineering session by verifying the environment, loading repo truth in source-of-truth order, and surfacing active work context. This is the entry point for all fv:* workflows.

### Key Behaviors

1. **CE Dependency Gate** -- Hard-fail if compound-engineering plugin is not detected. All fv skills depend on CE infrastructure.
2. **Repo Truth Loading** -- Read repo truth documents in source-of-truth order: `CLAUDE.md` / `AGENTS.md`, then `docs/ai/fuelviews-engineering.local.md`, then `docs/ai/current-work.md`, then `docs/ai/handoff.md`.
3. **Repo Layer Health** -- Detect whether `docs/ai/` structure exists; report missing or stale files.
4. **Active Task Detection** -- Identify the current task/plan from `current-work.md` and any in-progress plan artifacts.
5. **Reference Freshness** -- Check that key reference files are not stale relative to the codebase.
6. **Tool Availability** -- Check for GitNexus and Boost availability; report but do not block if absent.

## Key References

- [fuelviews-engineering.local.md](./references/fuelviews-engineering.local.md)
- [repo-truth-loading-order.md](./references/repo-truth-loading-order.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:codebase-researcher` -- scan repo structure and detect conventions

### FV Agents

- `fuelviews-engineering:workflow:session-bootstrap-agent` -- orchestrate session initialization sequence

## Implementation Status

> Full implementation in Phase 2. This shell defines the contract and entry points.
