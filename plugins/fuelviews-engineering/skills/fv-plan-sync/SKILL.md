---
name: fv:plan-sync
description: Reconcile plan artifacts against implementation reality. Use after work/review cycles to sync plan state with actual code changes.
argument-hint: "[plan file path]"
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

Create a task list for this sync operation with items for each step below. Update task status as each step completes.

---

## Input

<plan_sync_input> #$ARGUMENTS </plan_sync_input>

## Step 1: Resolve Plan

Determine which plan to sync from the argument above. Exactly one of these applies:

1. **Explicit path** (argument contains a file path) -- Read the plan artifact directly. Derive the task slug from the filename.
2. **Task slug** (no path separators, no file extension) -- Look up `docs/plans/<slug>.plan.md`. If not found, report an error and stop.
3. **No argument** -- Read `docs/ai/current-work.md` and extract the plan path from the `Plan:` field. If `current-work.md` does not exist or has no plan path, ask the user which plan to sync.

Set `$PLAN_PATH` and `$SLUG`. Read the plan file and parse its YAML frontmatter.

### Validation

- The plan must exist and be readable.
- The plan frontmatter `status:` must be one of: `locked`, `implementing`, `synced`. If status is `draft`, refuse with: "Plan is still in draft. Run `/fv:plan` to finalize before syncing."
- If status is `closed`, refuse with: "Plan is already closed. No sync needed."

---

## Step 2: Determine Base Branch

Identify the comparison base for detecting what changed during implementation.

1. Read the plan's frontmatter for a `branch:` field. If present, use the branch it was created from (typically `dev` or `main`).
2. If no `branch:` field, check the current git branch. If the branch follows `feature/*`, `fix/*`, or `task/*` patterns, determine the merge target from git: run `git merge-base HEAD dev` (fall back to `git merge-base HEAD main` if `dev` does not exist).
3. If no merge base can be determined, ask the user for the base branch.

Set `$BASE_REF` to the resolved merge-base commit.

---

## Step 3: Compare Plan vs Reality

### 3a: Extract Plan Tasks

Read the plan's `## Implementation Steps` section. Parse each checklist item (`- [ ]` or `- [x]`) into a list of tasks with:

- Task description
- Checked status (plan says complete or not)
- Associated files if mentioned in the task text

### 3b: Collect Actual Changes

Gather implementation evidence:

1. Run `git diff --name-only $BASE_REF` to get the list of files actually modified.
2. Run `git log --oneline $BASE_REF..HEAD` to get commits made during implementation.
3. For each file in the plan's `## Definite Edit Set` or `## Files Currently Being Modified` (from current-work.md), check whether it appears in the actual diff.

### 3c: Classify Differences

Produce four categories:

| Category | Description |
|----------|-------------|
| **Completed** | Plan task checked AND corresponding file changes exist in git diff |
| **Incomplete** | Plan task unchecked AND no corresponding changes found |
| **Drift: Unplanned Changes** | Files modified in git diff that do NOT appear in the plan's edit set or implementation steps |
| **Drift: Missing Changes** | Files listed in plan's edit set that have NO corresponding git changes |

For each drifted item, check commit messages for rationale. If a commit message references a plan task or provides context, capture it.

---

## Step 4: Update Plan Artifact

Apply changes to the plan file at `$PLAN_PATH`.

### 4a: Update Implementation Steps

- Check off (`- [x]`) any step whose corresponding changes are confirmed in the git diff.
- Leave unchecked (`- [ ]`) any step with no confirmed changes.
- Do NOT uncheck a step that was already marked complete -- if the plan says done but git disagrees, add a note rather than unchecking.

### 4b: Update Edit Set

If the plan has a definite edit set section:

- Add any unplanned files that appeared in the git diff. Mark them with `(unplanned)`.
- Note files that were in the edit set but have no changes as `(pending)`.

### 4c: Update Review Deltas

Append a new sync delta section to `## Review Deltas`:

```markdown
### Sync YYYY-MM-DD

- Completed N of M implementation steps
- Unplanned changes: <list of files or "none">
- Missing expected changes: <list of files or "none">
- Scope drift: <brief description or "none detected">
```

### 4d: Update Risks

If unplanned changes touch high-risk areas (as defined in [source-of-truth-order.md](./references/source-of-truth-order.md) -- e.g., migrations, middleware, route definitions), add a new risk entry to the `## Risks` table.

### 4e: Update Frontmatter

Update the plan's YAML frontmatter:

- Set `status: synced`
- Set `pipeline_phase:` to the current phase value (preserve existing if already set)
- Add or update `last_synced: YYYY-MM-DD`

---

## Step 5: Sync Downstream Artifacts

### 5a: Plan Index

Read `docs/plans/_index.md`. Find the row matching `$SLUG` or `$PLAN_PATH`. Update:

- **Status** column to `synced`
- **Last Verified** column to today's date

If no matching row exists, add one.

### 5b: Current Work

Read `docs/ai/current-work.md`. Update:

- **Status** field to reflect current progress
- **Progress** checklist to mirror the plan's updated implementation steps
- **Files Currently Being Modified** table to reflect actual changes from git diff

### 5c: Handoff

Read `docs/handoffs/latest.md` (fall back to `docs/ai/handoff.md` if the former does not exist). Update:

- **What Was Accomplished** with a summary of the sync findings
- **Current State** with branch name, commit count, and uncommitted change status
- **Recommended Next Steps** with appropriate suggestions based on sync results

If the handoff file does not exist, create it from the template at `templates/handoff.md`.

---

## Step 6: Output Summary

Print a structured summary to the terminal:

```
=== Plan Sync Complete ===

Plan:       <plan path>
Slug:       <slug>
Status:     synced
Base:       <base ref>

Progress:   N/M steps complete (XX%)

Completed Steps:
  - <step description>

Incomplete Steps:
  - <step description>

Drift Detected:
  Unplanned changes: N files
    - <file path> (reason from commit if available)
  Missing expected:  N files
    - <file path>

Artifacts Updated:
  - <plan path>
  - docs/plans/_index.md
  - docs/ai/current-work.md
  - docs/handoffs/latest.md

Suggested Next:
  <see recommendation logic below>
```

### Recommendation Logic

| Condition | Suggestion |
|-----------|------------|
| All steps complete, no drift | "Run `/fv:close-task` to finalize this task." |
| All steps complete, drift present | "Run `/fv:review` to review unplanned changes before closing." |
| Steps incomplete, no drift | "Run `/fv:work` to continue implementation." |
| Steps incomplete, significant drift | "Review drift items. Consider updating the plan with `/fv:plan` before continuing." |

---

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- scan recent commits and file changes for drift detection when the diff is large (>20 files changed) and manual classification would be error-prone

### FV Agents

No fv-specific agents are dispatched. Plan-sync logic is performed inline by this skill. The reconciliation is deterministic (plan vs git diff) and does not require agent judgment.

---

## Error Handling

- If the plan file cannot be read, report the error and stop. Do not attempt to sync without a plan.
- If `git diff` or `git log` commands fail, report the git error and stop. Sync requires git context.
- If `docs/plans/_index.md` does not exist, warn but continue (skip the index update).
- If `docs/ai/current-work.md` does not exist, warn but continue (skip the current-work update).
- If `docs/handoffs/latest.md` does not exist AND `docs/ai/handoff.md` does not exist, create a new handoff from the template.

---

## Scratch Space

If this skill needs intermediate state (e.g., parsed diff results, task classification lists), use `.context/compound-engineering/fv-plan-sync/`. Clean up after the sync summary is emitted.
