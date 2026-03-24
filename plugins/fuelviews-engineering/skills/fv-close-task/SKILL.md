---
name: fv:close-task
description: Close a task with blocking gates on unresolved P1s and stale sync. Use when finishing a task to verify all gates pass and generate handoff.
argument-hint: "[plan file path]"
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

Create a task list for this closure operation with items for each step below. Update task status as each step completes.

---

## Input

<close_task_input> #$ARGUMENTS </close_task_input>

## Step 1: Resolve Plan

Determine which plan to close from the argument above. Exactly one of these applies:

1. **Explicit path** (argument contains a file path) -- Read the plan artifact directly. Derive the task slug from the filename.
2. **Task slug** (no path separators, no file extension) -- Search `docs/plans/` for a file containing the slug (e.g., `docs/plans/*<slug>*.md`). If not found, report an error and stop.
3. **No argument** -- Read `docs/ai/current-work.md` and extract the plan path from the `Plan:` field. If `current-work.md` does not exist or has no plan path, ask the user which plan to close.

Set `$PLAN_PATH` and `$SLUG`. Read the plan file and parse its YAML frontmatter.

---

## Step 2: Blocking Gates

All gates MUST pass before the task can be closed. If ANY gate fails, this skill MUST refuse to proceed. Do not offer overrides for blocking gates.

### Gate 1: Plan Status is `synced`

Read the plan's YAML frontmatter `status:` field.

- **Pass:** `status: synced`
- **Fail:** Any other value

On failure, report:

```
GATE FAILED: Plan status is "<current status>", expected "synced".
Action: Run /fv:plan-sync to reconcile the plan against implementation.
```

### Gate 2: No Unresolved P1 Findings

Scan for P1 findings in these locations:

1. The plan's `excluded_findings:` frontmatter field -- check for any P1-severity items.
2. The plan's `## Review Deltas` section -- look for findings labeled P1.
3. Review artifacts at `docs/plans/<slug>/review-*.md` or `docs/ai/plans/<slug>/review-*.md` -- scan for P1-severity findings without a `resolution:` field.

- **Pass:** No unresolved P1 findings found in any location.
- **Fail:** One or more unresolved P1 findings exist.

On failure, report each unresolved P1:

```
GATE FAILED: Unresolved P1 findings detected.

  P1: <finding description> (source: <file path>)
  P1: <finding description> (source: <file path>)

Action: Address each P1 finding, then run /fv:review to verify resolution.
```

### Gate 3: Handoff is Current

Check that `docs/handoffs/latest.md` (fall back to `docs/ai/handoff.md`) has been updated after the plan's `last_synced` date.

Detection method: compare the file's last git commit timestamp against the plan's `last_synced:` frontmatter value. If the handoff has no git history (new file), check its `Last verified:` header or creation timestamp.

- **Pass:** Handoff was modified at or after the plan's last sync.
- **Fail:** Handoff predates the last plan sync, or handoff file does not exist.

On failure, report:

```
GATE FAILED: Handoff documentation is stale or missing.
Action: Run /fv:plan-sync to update handoff, or manually update docs/handoffs/latest.md.
```

### Gate Summary

After evaluating all gates, present as formatted markdown:

```markdown
## Close-Task Gates

| Gate | Result |
|------|--------|
| Plan status == synced | PASS / FAIL |
| No unresolved P1s | PASS / FAIL |
| Handoff is current | PASS / FAIL |
```

If ANY gate shows FAIL, list all failures with their remediation actions and STOP. Do not proceed to Step 3.

---

## Dual Enforcement Notice

This skill's close-task gates are ALSO enforced independently by the hook system defined in `hooks/hooks.json`. The `Stop` hook reads the plan's YAML frontmatter directly and checks `status: synced` and unresolved P1 findings. This dual enforcement ensures that:

1. If this skill is run explicitly, gates are checked here in Step 2.
2. If a session ends without running this skill, the Stop hook catches unsynced or P1-blocked plans.

The hook operates independently -- it reads plan frontmatter on its own and does not trust this skill's self-report. This means a plan that fails gates will be caught even if a user tries to bypass this skill.

---

## Step 3: Verification Checks

These are non-blocking checks. Failures produce warnings but do not prevent closure.

### Check 0: GitNexus Process Coverage (if available)

If `.gitnexus/` exists in the project root, run `detect_changes` on the full branch diff (`$BASE_REF..HEAD`) to get the list of all affected processes. Compare the affected processes against the plan's impact artifact and implementation steps. Flag any process that appears in the impact but has no corresponding code change -- this indicates a gap where a known dependency was not addressed. If GitNexus is not available, fall back to the file-based checks below.

### Check 1: Plan Sync Completeness

Re-verify that the plan's implementation steps match reality:

- Count checked (`[x]`) vs unchecked (`[ ]`) steps in `## Implementation Steps`.
- If any steps remain unchecked, warn: "N implementation steps are still unchecked. These will be recorded as incomplete in the closure summary."

### Check 2: Current Work Reflects Final State

Read `docs/ai/current-work.md`. Verify:

- The **Plan** field matches `$PLAN_PATH`.
- The **Status** field is not `blocked`.

If current-work.md is inconsistent, warn but continue.

### Check 3: Uncommitted Changes

Run `git status --porcelain` to detect uncommitted changes.

- If uncommitted changes exist, warn:

```
WARNING: Uncommitted changes detected.
  <list of modified/untracked files>
Consider committing or stashing before closing.
```

This does not block closure but is recorded in the closure summary.

---

## Step 4: Generate Closure Summary

Build a closure summary from the plan and git history.

### 4a: What Was Accomplished

Extract from the plan:

- Task title and goal from `## Task` and `## Goal` sections.
- Completed implementation steps (checked items from `## Implementation Steps`).
- Acceptance criteria status (checked items from `## Acceptance Criteria`).

### 4b: Commits Made

Run `git log --oneline $BASE_REF..HEAD` (where `$BASE_REF` is derived the same way as in fv:plan-sync Step 2). Collect commit hashes and messages.

If `$BASE_REF` cannot be determined, use the plan's `created_at` date to filter commits: `git log --oneline --after=<created_at>`.

### 4c: Files Changed

Run `git diff --name-only $BASE_REF` to get the final list of changed files. Group by directory for readability.

### 4d: What's Next

Determine follow-up work:

1. Check the plan's `## Deferred/Excluded Items` table. List any items with a `Revisit Trigger` that may now apply.
2. Check `## Risks` for any risks flagged during sync that were not fully mitigated.
3. If the plan references related plans in the plan index, note them as potential next tasks.

---

## Step 5: Update Plan Status

Update the plan artifact at `$PLAN_PATH`:

- Set frontmatter `status: closed`
- Set frontmatter `closed_at: YYYY-MM-DD`
- Preserve all other frontmatter fields

---

## Step 6: Update Downstream Artifacts

### 6a: Plan Index

Read `docs/plans/_index.md`. Update the row matching `$SLUG`:

- **Status** column to `complete`
- **Last Verified** column to today's date

### 6b: Clear Current Work

Update `docs/ai/current-work.md` to indicate no active task:

- **Title:** (none)
- **Plan:** (none)
- **Branch:** <current branch>
- **Status:** idle

Clear the **Progress**, **Current Context**, **Blockers**, and **Files Currently Being Modified** sections. Leave **Mistakes to Avoid** intact -- these persist across tasks.

### 6c: Update Handoff

Update `docs/handoffs/latest.md` (or `docs/ai/handoff.md`) with the closure summary from Step 4. This becomes the final session handoff for this task.

---

## Step 7: Worktree Cleanup

If the current working directory is inside a git worktree (detect via `git rev-parse --git-common-dir` differing from `git rev-parse --git-dir`):

1. Report the worktree path and associated branch.
2. Suggest cleanup commands but do NOT execute them:

```
This task was implemented in a worktree.

Worktree: <path>
Branch:   <branch>

To clean up after merging:
  git worktree remove <path>
  git branch -d <branch>

Run these manually after your PR is merged.
```

If not in a worktree, skip this step silently.

---

## Step 8: Output Closure Report

Present the closure report as formatted markdown:

```markdown
## Task Closed

| Field | Value |
|-------|-------|
| Plan | `<plan path>` |
| Slug | `<slug>` |
| Status | closed |
| Closed | YYYY-MM-DD |

### Gates

| Gate | Result |
|------|--------|
| Plan synced | PASS |
| No unresolved P1s | PASS |
| Handoff current | PASS |

### Accomplished
- <accomplishment from plan>

### Commits (<N>)

| Hash | Message |
|------|---------|
| `<hash>` | <message> |

### Files Changed (<N>)
<grouped file list>

### Incomplete Steps (<N>)
- <step description>

### Warnings
<list or "None">

### Follow-Up
- <deferred item or next task>

### Recommended Next
<see recommendation logic below>
```

### Recommendation Logic

| Condition | Suggestion |
|-----------|------------|
| Deferred items exist | "Consider planning deferred items: `/fv:plan <description>`" |
| Related plans in index | "Related plan found: `<plan title>`. Run `/fv:start-session` to load context." |
| No follow-up identified | "No pending follow-up. Run `/fv:start-session` when starting new work." |

---

## Step 9: Compound Learnings

The task is complete — this is the best moment to capture institutional knowledge while the context is fresh.

### 9a: Detect Compoundable Insights

Review the full task lifecycle for learnings worth documenting:

- **Resolved P1/P2 findings** from the plan's Review Deltas — what was discovered and how it was resolved
- **Drift detected during plan-sync** — what the plan got wrong and why
- **Blind spots that materialized** — impact assessment gaps that became real issues
- **Infrastructure discovered during implementation** — existing services/models/patterns that weren't in the plan but should have been
- **Workarounds or gotchas** — framework bugs, undocumented behavior, version-specific issues hit during `/fv:work`
- **Approach changes** — if the implementation diverged significantly from the plan, why?
- **Deferred items with useful context** — items deferred during review that future plans should know about

If NONE of these signals are present (clean task, plan matched reality), skip compounding silently and proceed to the recommendation.

### 9b: Offer Compounding

If signals are present, use **AskUserQuestion** (do NOT proceed without a response):

1. "Compound learnings now" -- Capture insights into `docs/solutions/` for future plans to learn from
2. "Skip" -- Nothing worth documenting this time

### 9c: Run Compounding (if accepted)

Load the `ce:compound` skill (or `compound-docs` skill) from compound-engineering. Pass:

- The plan artifact path and closure summary
- The specific signals detected in 9a (resolved findings, drift, blind spots, workarounds)
- The task's Review Deltas section (contains the full finding-resolution history)

The compounding skill writes a categorized solution document to `docs/solutions/` with YAML frontmatter (tags, category, module, symptom, root_cause) so future `learnings-researcher` runs in `/fv:plan` Phase 1.1 can find it.

**Return contract:** The compounding skill writes to disk directly. Confirm the file path to the user.

---

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- verify implementation state for gate checks when the diff is large and manual verification would be error-prone
  **Return contract:** Return ONLY: gate-relevant findings (file change classification, P1 resolution status). No full file contents.

### FV Agents

No fv-specific agents are dispatched. Gate evaluation and closure summary generation are deterministic operations performed inline by this skill.

---

## Error Handling

- If the plan file cannot be read, report the error and stop. Cannot close a task without its plan.
- If git commands fail, degrade gracefully: skip commit history and file change sections but still attempt gate checks from plan frontmatter alone.
- If `docs/plans/_index.md` does not exist, warn but continue (skip index update).
- If `docs/ai/current-work.md` does not exist, warn but continue (skip current-work clearing).
- If the handoff file does not exist, create one from the template at `templates/handoff.md` and populate it with the closure summary.

---

## Scratch Space

If this skill needs intermediate state (e.g., gate check results, parsed findings), use `.context/compound-engineering/fv-close-task/`. Clean up after the closure report is emitted.
