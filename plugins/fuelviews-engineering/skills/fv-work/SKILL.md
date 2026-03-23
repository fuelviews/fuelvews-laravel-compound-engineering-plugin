---
name: fv:work
description: Execute implementation from a locked plan with drift monitoring. Use when a plan is locked and ready for implementation.
argument-hint: "[plan file path]"
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

Implement a locked plan task-by-task with incremental commits, drift monitoring against the plan's impact artifact, and Laravel-specific quality gates. The plan must be in `locked` status before work begins. This skill forks CE's `ce:work` pattern and adds plan-awareness, impact monitoring, and fv Laravel review agents.

## Input Document

<input_document> #$ARGUMENTS </input_document>

---

## Phase 1: Quick Start

### 1.1 Resolve Plan File

If `#$ARGUMENTS` is non-empty, treat it as the plan file path. Read the file completely.

If `#$ARGUMENTS` is empty, look for the active plan reference:

1. Read `docs/ai/current-work.md` in the target repo
2. Extract the `plan_file` path from its frontmatter or body
3. If no active plan is found, ask the user: "No active plan found. Provide a plan file path or run /fv:plan first."

### 1.2 Read the Plan

- Read the plan file completely
- Parse YAML frontmatter -- extract `status`, `task_slug`, `severity`, and `impact_artifact` fields
- Read the plan's implementation steps, scope boundaries, deferred-to-implementation questions, and verification criteria
- Check for `Execution note` on each implementation unit -- these carry the plan's execution posture signal (test-first, characterization-first, etc.)

### 1.3 Verify Locked Status

Check the plan's `status` field in YAML frontmatter.

- If `status: locked` -- proceed
- If any other status -- hard-stop with: "Plan must be locked before implementation. Run /fv:plan first."
- If no status field exists -- hard-stop with the same message

### 1.4 Read Latest Impact Artifact

Locate the latest impact artifact for this plan:

1. Check the plan's `impact_artifact` frontmatter field for an explicit path
2. If not present, scan `docs/ai/plans/<task-slug>/` for files matching `impact-*.md`
3. Sort by timestamp descending, read the most recent one
4. If no impact artifact exists, warn the user: "No impact artifact found. Drift monitoring will be limited. Continue anyway?" Proceed only on confirmation.

Extract from the impact artifact:

- **Definite edit set** -- files the plan expects to modify
- **Probable edit set** -- files that may need changes
- **Watchlist** -- files to monitor for unintended side effects
- **Blind spots** -- areas the impact analysis could not fully assess

### 1.5 Ask Clarifying Questions

Review the plan for ambiguity. Check:

- Deferred-to-implementation questions -- note them now so they inform the approach
- Scope boundaries -- explicit non-goals to refer back to if implementation drifts
- Any unclear requirements or conflicting instructions

If anything is ambiguous, ask clarifying questions now. Get user approval to proceed before continuing. Better to ask now than build the wrong thing.

### 1.6 Set Up Branch

Check the current branch and determine how to proceed:

```bash
current_branch=$(git branch --show-current)
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$default_branch" ]; then
  default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
fi
```

**If already on a feature branch** (not the default branch):
- Ask: "Continue working on `[current_branch]`, or create a new branch?"
- If continuing, proceed to step 1.7

**If on the default branch**, offer options:

**Option A: Create a new branch**
```bash
git pull origin [default_branch]
git checkout -b feature-branch-name
```
Use a meaningful name based on the plan (e.g., `feat/user-authentication`, `fix/email-validation`).

**Option B: Use a worktree** (recommended for parallel development)
```bash
skill: git-worktree
```

**Option C: Continue on the default branch**
- Requires explicit user confirmation
- Never commit directly to the default branch without explicit permission

### 1.7 Create Task List

Break the plan's implementation steps into actionable tasks using the platform's task tracking tool.

- Derive tasks from the plan's implementation units, dependencies, files, test targets, and verification criteria
- Carry each unit's `Execution note` into the task when present
- Note each unit's `Patterns to follow` field -- read those files before implementing
- Use each unit's `Verification` field as the primary done signal
- Include dependencies between tasks
- Prioritize based on dependency order
- Include testing tasks alongside implementation tasks

### 1.8 Update Plan Status

Update the plan file's YAML frontmatter:

```
status: locked  ->  status: implementing
```

Commit this status change:
```bash
git add <plan-file>
git commit -m "chore(plan): mark plan as implementing"
```

---

## Phase 2: Execute

### 2.1 Task Execution Loop

For each task in priority order:

```
while tasks remain:
  - Mark task as in_progress
  - Read referenced files from the plan for this task
  - Look for similar patterns in codebase using native file-search and content-search tools
  - Implement following existing conventions and the plan's Patterns to follow
  - Write tests for new functionality
  - Run tests after changes
  - Mark task as completed
  - Check off corresponding item in plan file ([ ] -> [x])
  - Run drift check (see 2.2)
  - Evaluate for incremental commit (see 2.3)
```

When a unit carries an `Execution note`, honor it:
- **Test-first**: write the failing test before implementation; verify the test fails before implementing the fix
- **Characterization-first**: capture existing behavior before changing it
- **No execution note**: proceed pragmatically

Do not write the test and implementation in the same step when working test-first. Skip test-first discipline for trivial renames, pure configuration, and pure styling work.

**System-Wide Test Check** -- Before marking a task done, pause and verify:

| Question | Action |
|----------|--------|
| What fires when this runs? (observers, middleware, event listeners, model events) | Read the actual code for callbacks on models touched, middleware in the request chain, `after_*` hooks. Trace two levels out. |
| Do tests exercise the real chain? | Write at least one integration test using real objects through the full callback/middleware chain. No mocks for interacting layers. |
| Can failure leave orphaned state? (DB rows, cache entries, queued jobs) | Trace the failure path. If state is created before a risky call, test that failure cleans up or that retry is idempotent. |
| What other interfaces expose this? (API routes, Livewire components, Artisan commands) | Use content-search to find the method/behavior in related classes. If parity is needed, add it now. |

**When to skip**: Leaf-node changes with no callbacks, no state persistence, no parallel interfaces. Purely additive helpers and view partials need only a quick confirmation that nothing fires.

### 2.2 Drift Monitoring

After each completed task, compare actual changes against the plan's impact artifact:

1. **Collect touched files** -- list all files modified since the last drift check (or since work started)
2. **Compare against definite edit set** -- files in the definite set that were touched are expected; no action needed
3. **Flag unexpected files** -- files touched that are NOT in the definite or probable edit sets:
   - Warn: "File `[path]` was modified but is not in the plan's impact scope."
   - If more than 2 unexpected files accumulate, escalate the warning
4. **Check for new dependencies** -- if implementation introduces new composer packages, npm packages, or service bindings not anticipated by the plan:
   - Update an impact delta note in `.context/compound-engineering/fv-work/impact-delta.md`
5. **Scope expansion check** -- if any of these conditions are met:
   - 3+ files outside the definite+probable edit sets have been touched
   - A new migration was created that was not in the plan
   - A new service provider or middleware was registered
   - Then ask the user: "Scope expanding beyond plan. Options: (1) Continue -- scope is acceptable, (2) Run /fv:impact to reassess, (3) Pause and adjust plan manually."
   - Proceed only after user decision

### 2.3 Incremental Commits

After completing each task, evaluate whether to commit:

| Commit when... | Do not commit when... |
|----------------|----------------------|
| Logical unit complete (model, service, component) | Small part of a larger unit |
| Tests pass and meaningful progress made | Tests failing |
| About to switch contexts (backend to frontend) | Purely scaffolding with no behavior |
| About to attempt risky or uncertain changes | Would need a "WIP" commit message |

**Heuristic**: "Can I write a commit message that describes a complete, valuable change? If yes, commit."

Commit workflow:
```bash
# 1. Verify tests pass (use project's test command -- e.g., php artisan test, ./vendor/bin/pest)

# 2. Stage only files related to this logical unit
git add <files related to this logical unit>

# 3. Commit with conventional message
git commit -m "feat(scope): description of this unit"
```

Use the plan's implementation unit Goal to inform the commit message. Use `feat:`, `fix:`, `refactor:`, or `test:` prefixes as appropriate.

### 2.4 Follow Existing Patterns

- Read files referenced in the plan's Patterns to follow before implementing each unit
- Match naming conventions exactly
- Reuse existing components, services, and repositories where possible
- Follow project coding standards from AGENTS.md or CLAUDE.md
- When in doubt, use content-search to find similar implementations

### 2.5 Simplify as You Go

After completing every 2-3 related tasks, review recently changed files for simplification:

- Consolidate duplicated patterns
- Extract shared helpers or traits
- Improve code reuse

Do not simplify after every single task -- early patterns may look duplicated but diverge intentionally in later units.

### 2.6 Track Progress

- Keep the task list updated as tasks complete
- Note any blockers or unexpected discoveries
- Create new tasks if scope expands (with user approval)
- Keep user informed of major milestones

---

## Phase 3: Quality Check

### 3.1 Determine Review Panel

Select fv Laravel review agents based on the types of files changed in this implementation. Use native file-search to categorize the diff.

**Always dispatch (mandatory panel members):**

- `fuelviews-engineering:review:php-reviewer` -- PSR-12, type safety, PHP conventions
- `fuelviews-engineering:review:laravel-reviewer` -- Laravel architecture, service patterns, Eloquent usage

**Conditionally dispatch based on changed file types:**

| Condition | Agent |
|-----------|-------|
| Any `.blade.php` files changed | `fuelviews-engineering:review:blade-reviewer` |
| Any `.js`, `.ts`, `.vue` files changed | `fuelviews-engineering:review:javascript-reviewer` |
| Any migration files changed, or raw DB queries added | `fuelviews-engineering:review:postgresql-reviewer` |

**Always dispatch (CE quality):**

- `compound-engineering:review:code-simplicity-reviewer` -- check for unnecessary complexity

Dispatch all selected agents in parallel using the platform's sub-agent or task mechanism. If parallel dispatch is unavailable, run them sequentially.

### 3.2 Synthesize Review Findings

After all review agents complete, dispatch:

- `fuelviews-engineering:workflow:synthesis-agent` -- consolidate all review findings into a unified report with severity classifications (P1, P2, P3)

### 3.3 Address Findings

Triage the synthesized findings:

- **P1 (blocking)**: Fix immediately before proceeding. These are correctness, security, or data-integrity issues.
- **P2 (should fix)**: Fix in this PR unless the user explicitly defers them. These are maintainability or convention violations.
- **P3 (advisory)**: Note for the user. Fix at their discretion.

After fixing P1 and P2 issues, re-run affected review agents to confirm resolution. Do not loop more than twice -- if P1 findings persist after two fix rounds, ask the user how to proceed.

### 3.4 Run Test Suite

Run the full test suite for the target repo:

```bash
# Laravel projects
php artisan test
# or
./vendor/bin/pest
```

If this repo also has `bun test` (for plugin/CLI changes in the compound-engineering repo itself):
```bash
bun test
```

All tests must pass before proceeding. Fix any failures introduced by the implementation.

### 3.5 Final Validation

Verify before shipping:

- [ ] All tasks marked completed in the task list
- [ ] All plan implementation steps checked off (`[x]`)
- [ ] All tests pass
- [ ] No P1 or P2 findings remaining
- [ ] Code follows existing patterns and project conventions
- [ ] Any deferred-to-implementation questions were resolved during execution
- [ ] Scope boundaries from the plan were respected

---

## Phase 4: Ship

### 4.1 Stage and Commit Remaining Changes

If any uncommitted work remains after the quality check and fixes:

```bash
git add <remaining files>
git status
git diff --staged
git commit -m "feat(scope): final implementation with review fixes"
```

### 4.2 Push Branch

```bash
git push -u origin $(git branch --show-current)
```

### 4.3 Create Pull Request

```bash
gh pr create --title "feat(scope): description" --body "$(cat <<'EOF'
## Summary

- What was built
- Key decisions made during implementation

## Plan Reference

- Plan file: `[plan file path]`
- Task slug: `[task slug]`

## Testing

- Tests added/modified
- Manual testing performed

## Review Agent Findings

- Summary of review agent findings and resolutions
- Any P3 items deferred

## Before / After Screenshots

| Before | After |
|--------|-------|
| (include if UI changes) | (include if UI changes) |

EOF
)"
```

For UI changes, capture and upload before/after screenshots. Use the `agent-browser` skill if available to screenshot localhost routes, or ask the user to provide screenshots.

### 4.4 Update Plan Status

Keep the plan status as `implementing` -- do not advance to `synced` or `completed` yet. The plan-sync skill handles reconciliation.

### 4.5 Clean Up Scratch Space

Remove ephemeral work artifacts: `rm -rf .context/compound-engineering/fv-work/`. Do not remove if the user asked to inspect them or another skill still needs them.

### 4.6 Suggest Next Steps

Present the user with recommended follow-up:

1. "Run /fv:plan-sync to reconcile plan artifacts with implementation reality."
2. "Run /fv:review for a full convergent code review if not already satisfied with the quality gate results."
3. If scope expanded: "Consider running /fv:impact to update the impact artifact for the expanded scope."

---

## Key Principles

- **Plan is the source of truth** -- the locked plan defines what to build; drift is monitored and surfaced, not silently accepted
- **Drift awareness over drift prevention** -- not all drift is bad; surface it early and let the user decide whether to accept or reassess
- **Test continuously** -- run tests after each change, fix failures immediately; integration tests prove layers work together, unit tests prove logic in isolation
- **Quality is built in** -- Laravel review agents catch framework-specific issues; P1 findings always block shipping
- **Ship complete features** -- mark all tasks completed before moving on; a finished feature that ships beats a perfect feature that does not

---

## Common Pitfalls

- **Skipping plan verification** -- always confirm `locked` status; implementing against a draft plan causes rework
- **Ignoring drift signals** -- unexpected file modifications often indicate scope creep; surface them early
- **Deferring test failures** -- fix immediately; accumulated failures compound and obscure root causes
- **Over-implementing beyond plan scope** -- check scope boundaries before adding "just one more thing"
- **Skipping the impact artifact read** -- drift monitoring is only as good as its baseline; load the artifact first
- **Running review agents on failing tests** -- fix tests first; review agents produce noise against broken code
