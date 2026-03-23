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

Create a task list for this session initialization with items for each step below. Update task status as each step completes.

---

## Step 1: CE Dependency Gate

This gate is mandatory. Do not proceed to any subsequent step if it fails.

### Detection Strategy

**In repo/dev mode** (plugin source is available locally):

1. Check for the directory `plugins/compound-engineering/` relative to the plugin root.
2. If not found, check for a sibling directory `../compound-engineering/` relative to this plugin's location.

**On converted targets** (installed via marketplace or converter):

1. Attempt to resolve the `compound-engineering:` namespace by dispatching a no-op agent reference (e.g., reference `compound-engineering:research:repo-research-analyst` and observe whether the namespace resolves).

### On Failure

If neither detection method finds the compound-engineering plugin, emit this blocking error and STOP immediately:

```
FATAL: fv requires the compound-engineering plugin.
Install it before using any fv:* skill.
Session initialization aborted.
```

Do not continue to Step 2 or any later step. The session cannot proceed without CE.

### On Success

Record the detection path (local directory or namespace resolution) for inclusion in the session brief. If the plugin directory was found locally, read `plugins/compound-engineering/.claude-plugin/plugin.json` to extract the CE version string for reporting.

---

## Step 2: Repo Truth Loading

Load repo truth documents in the canonical trust hierarchy order defined in [source-of-truth-order.md](./references/source-of-truth-order.md). Read each file that exists; skip gracefully if absent (missing files are handled in Step 3).

### Loading Order

Read these files sequentially. Each layer adds context that may inform interpretation of later layers.

**Layer A -- Repo Instructions:**

1. Read `CLAUDE.md` in the project root (may contain `@AGENTS.md` reference).
2. Read `AGENTS.md` in the project root if referenced or present.

**Layer B -- Local Plugin Config:**

3. Check for `fuelviews-engineering.local.md` in the project root. If present, read it. This file contains repo-specific overrides and plugin configuration.

**Layer C -- docs/ai/ Subset (in priority order):**

4. `docs/ai/conventions.md` -- team-agreed coding conventions (trust rank 6)
5. `docs/ai/architecture.md` -- documented system architecture (trust rank 7)
6. `docs/ai/repo-map.md` -- directory and component map (trust rank 9)
7. `docs/ai/handoffs/latest.md` -- most recent session handoff
8. `docs/ai/current-work.md` -- active task tracker

**Layer D -- Plan Artifacts:**

9. `docs/plans/_index.md` -- plan inventory and status index
10. If `_index.md` references an active plan file (status: `active`, `implementing`, or `locked`), read that plan file.

**Layer E -- Git Context:**

11. Determine the current branch name and recent commit history (last 5 commits) using git commands. This is trust rank 10 context -- useful for understanding intent but not authoritative over code.

---

## Step 3: Repo Layer Health Detection

After loading, assess the health of the repo's documentation layer.

### Check 1: docs/ai/ Directory Existence

If `docs/ai/` does not exist at all, report:

```
WARNING: docs/ai/ directory not found.
This repo has no structured documentation layer.
Recommended: Run /fv:repo-catchup to set up repo layer.
```

Skip the remaining health checks (they all depend on docs/ai/ existing).

### Check 2: Key File Inventory

Check for the presence of each key file. Report missing files as warnings:

| File | Purpose | Severity if Missing |
|------|---------|---------------------|
| `docs/ai/conventions.md` | Coding conventions | WARNING -- conventions unknown |
| `docs/ai/architecture.md` | System architecture | WARNING -- architecture undocumented |
| `docs/ai/repo-map.md` | Component map | WARNING -- no component index |
| `docs/ai/current-work.md` | Active task state | INFO -- no active work tracked |

### Check 3: Plan Index

Check for `docs/plans/_index.md`. If missing:

```
WARNING: docs/plans/_index.md not found. Plan inventory unavailable.
```

### Output

Collect all warnings into a list for inclusion in the session brief (Step 8).

---

## Step 4: Active Task Detection

Identify whether there is an active task in progress.

### Detection Sources

1. **current-work.md**: If `docs/ai/current-work.md` was loaded in Step 2, extract:
   - Task title
   - Associated plan path
   - Branch name
   - Current status (e.g., implementing, paused, blocked)

2. **Plan index**: If `docs/plans/_index.md` was loaded, scan for plans with status `implementing` or `locked`. For each match, extract the plan title and file path.

3. **Branch heuristic**: If no task is found via docs, check the current git branch name. If it follows a pattern like `feature/*`, `fix/*`, or `task/*`, note it as a possible active task with no associated plan.

### Output

If an active task is found, format:

```
Active Task: <title>
  Plan: <path or "none">
  Branch: <branch>
  Status: <status>
```

If multiple active plans are found, list all of them and flag this as unusual:

```
WARNING: Multiple active plans detected. Consider closing or pausing stale plans.
```

If no active task is detected, note: "No active task detected."

---

## Step 5: Reference Freshness Check

Check the `Last verified` dates in docs/ai/ files to detect stale documentation.

### Detection Method

For each file in `docs/ai/` that was successfully loaded in Step 2, search for a line matching the pattern:

```
Last verified: YYYY-MM-DD
```

Also check YAML frontmatter for `last_verified:` or `updated:` date fields.

### Freshness Thresholds

| Age | Action |
|-----|--------|
| 0-14 days | OK -- no action |
| 15-30 days | WARN -- "docs/ai/<file> last verified <N> days ago. Consider refreshing." |
| >30 days | BLOCK -- "docs/ai/<file> is critically stale (last verified <N> days ago). Run /fv:repo-catchup to refresh before proceeding with plan work." |

### Missing Dates

If a file has no `Last verified` or equivalent date field, treat it as a warning:

```
WARNING: docs/ai/<file> has no verification date. Freshness unknown.
```

### Output

Collect freshness results into a list. If any file triggers BLOCK, include it prominently in the session brief with a recommendation to run `/fv:repo-catchup`.

---

## Step 6: GitNexus Availability

Check whether the GitNexus local-state tooling is available in the repository.

### Detection

Look for a `.gitnexus/` directory in the project root.

### If Missing

Check if `docs/ai/conventions.md` contains `gitnexus: declined`. If declined previously, skip silently.

If not previously declined, ask the user (using the platform's blocking question tool):

```
GitNexus enhances impact analysis with graph-powered dependency tracing.
It is not installed in this repo.

1. Install GitNexus now (recommended)
2. Skip for now
3. Never ask again for this project
```

**If the user chooses "Install":**

Run these commands to install and initialize GitNexus:

```bash
npm install -g gitnexus@1
gitnexus analyze
```

This creates `.gitnexus/` in the project root and registers the repo in `~/.gitnexus/registry.json`.

Post-install steps:
1. Add `.gitnexus/` to `.gitignore` if not already present
2. Enable the GitNexus MCP server by editing the project's `.claude/settings.local.json` to add `"gitnexus"` to the `enabledMcpjsonServers` array (or create the file if missing):
   ```json
   {
     "enabledMcpjsonServers": ["gitnexus"]
   }
   ```
3. Verify by checking `.gitnexus/` exists and the MCP server responds

After installation, the `fuelviews-engineering:workflow:impact-assessment-agent` will automatically use GitNexus MCP tools (`impact`, `context`, `query`, `detect_changes`) for graph-powered dependency tracing during `/fv:plan` and `/fv:impact` workflows.

**If the user chooses "Skip":**

Record the skip for this session only. Downstream skills will fall back to file-based tracing.

**If the user chooses "Never ask":**

Write to `docs/ai/conventions.md` (create if missing):

```yaml
gitnexus: declined
gitnexus_decided_at: YYYY-MM-DD
```

### If Present

Check if the index is stale: compare `.gitnexus/` last modified against `git log -1 --format=%ci`. If the git repo has commits newer than the index, suggest re-indexing:

```bash
gitnexus analyze
```

Note "GitNexus: available" (or "GitNexus: available (stale index)") for the session brief.

---

## Step 7: Boost Availability (Laravel Projects Only)

This check applies only to Laravel projects. Skip entirely for non-Laravel repos.

### Laravel Detection

Read `composer.json` in the project root. Check the `require` section for `laravel/framework`. If not present, skip this step entirely.

### Boost Detection

If the project is Laravel, check `composer.json` for `laravel-boost` (or `fuelviews/laravel-boost`) in both `require` and `require-dev`.

### If Missing

Report once:

```
INFO: Laravel project detected but laravel-boost is not installed.
Boost provides enhanced artisan commands and development utilities.
(Recording this suggestion -- will not ask again this session.)
```

### If Present

Note "Boost: available" for the session brief.

---

## Step 8: Output Session Brief

Present a structured summary of everything detected. Use this exact format:

```
=== Fuelviews Engineering Session ===

Environment:
  Branch:    <current branch>
  Repo Type: <Laravel|PHP|Unknown> (<framework version if detected>)
  CE:        <version or "detected (version unknown)">
  GitNexus:  <available|not detected>
  Boost:     <available|not installed|N/A (not Laravel)>

Active Task:
  <task summary from Step 4, or "None detected">

Warnings:
  <list of warnings from Steps 3, 4, 5, or "None">

Blockers:
  <list of blocking issues from Step 5, or "None">

Recommended Next:
  <see recommendation logic below>
```

### Recommendation Logic

Determine the recommended next command based on session state:

| Condition | Recommendation |
|-----------|---------------|
| docs/ai/ missing entirely | `/fv:repo-catchup` -- "Set up repo documentation layer first." |
| Any reference file triggers BLOCK (>30 days stale) | `/fv:repo-catchup` -- "Refresh stale documentation before planning." |
| Active task with status `implementing` | `/fv:work` -- "Resume work on: <task title>" |
| Active task with status `locked` | `/fv:work` -- "Plan is locked and ready for implementation: <task title>" |
| No active task, repo layer healthy | `/fv:plan` -- "Ready for new work. Describe a task to plan." |
| Multiple conditions match | List all applicable recommendations in priority order (blockers first). |

---

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- use for deep repo structure scanning if initial file reads reveal an unusually complex or unfamiliar project layout. Not dispatched by default; dispatch only when Step 2 loading reveals insufficient context to assess repo health.

### FV Agents

No fv-specific agents are required for session initialization. All detection and loading is performed inline by this skill.

---

## Error Handling

- If `CLAUDE.md` / `AGENTS.md` cannot be read, warn but continue (the repo may not have them).
- If `composer.json` cannot be read, skip Laravel-specific checks (Steps 7) and set repo type to "Unknown".
- If git commands fail, set branch to "unknown" and skip git-based heuristics.
- The only hard failure is the CE Dependency Gate (Step 1). All other failures degrade gracefully.

---

## Scratch Space

If this skill needs to store intermediate state (e.g., freshness check results across multiple files), use `.context/compound-engineering/fv-start-session/`. Clean up after the session brief is emitted.
