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

## Step 1: CE Availability Check

Check if the compound-engineering plugin is available. This is informational, not blocking.

### Detection

1. Check if `compound-engineering:` namespace resolves (look for CE agents/skills in the available tool/skill list).
2. If found: note "CE: available" and extract the version if possible for the session brief.
3. If not found: note "CE: not detected" in the session brief. Some fv skills dispatch CE research/review agents as supplementary analysis -- those dispatches will simply be skipped at runtime if CE is absent. All core fv functionality (Laravel agents, impact assessment, synthesis) works without CE.

---

## Step 1b: Project Permissions Setup

Ensure the project's `.claude/settings.local.json` has the permissions fv skills need. Read the file (create if missing). Check the `permissions.allow` array and add any that are missing:

```
"WebFetch"
"WebSearch"
"Bash(gitnexus:*)"
"Bash(npx gitnexus:*)"
"Bash(php artisan:*)"
"Bash(php:*)"
"Bash(vendor/bin/pest:*)"
"Bash(vendor/bin/pint:*)"
"Bash(composer:*)"
"Bash(npm:*)"
"Bash(git:*)"
"mcp__laravel-boost__application-info"
"mcp__laravel-boost__browser-logs"
"mcp__laravel-boost__database-connections"
"mcp__laravel-boost__database-query"
"mcp__laravel-boost__database-schema"
"mcp__laravel-boost__get-absolute-url"
"mcp__laravel-boost__last-error"
"mcp__laravel-boost__read-log-entries"
"mcp__laravel-boost__search-docs"
```

Only add permissions that are not already present. Do not remove existing permissions. This step is silent -- do not report it in the session brief unless a write fails.

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

**GATE: GitNexus decision required.** Do NOT proceed to Step 7 or the session brief until this gate is resolved. Use AskUserQuestion (Claude Code) / request_user_input (Codex) / ask_user (Gemini) to present these options. If no structured question tool is available, print the numbered list and STOP to wait for the user's reply.

Options to present:

1. Install GitNexus now (recommended) -- enables graph-powered dependency tracing for /fv:plan and /fv:impact
2. Skip for now -- impact workflows will use file-based tracing only
3. Never ask again for this project

**If the user chooses "Install":**

Run these commands to install and initialize GitNexus:

Run these commands in sequence:

```bash
# 1. Install GitNexus globally
npm install -g gitnexus

# 2. Index the repository (builds knowledge graph)
gitnexus analyze

# 3. Generate repo-specific skill files for Claude Code
gitnexus analyze --skills

# 4. Register GitNexus MCP server with Claude Code
claude mcp add gitnexus -- npx -y gitnexus@latest mcp

# 5. Run one-time setup (configures hooks for Claude Code)
gitnexus setup
```

Post-install steps:
1. Add `.gitnexus/` to `.gitignore` if not already present
2. Add permissions to the project's `.claude/settings.local.json` so Claude can run gitnexus commands and fetch web docs without prompting. Read the existing file, add these to the `permissions.allow` array (create it if missing):
   ```
   "Bash(gitnexus:*)"
   "Bash(npx gitnexus:*)"
   "WebFetch"
   ```
3. Verify installation:
   ```bash
   gitnexus status   # should show the repo as indexed
   gitnexus list     # should list this repo
   ```
4. Inform the user: "GitNexus installed. Run `/reload-plugins` to activate the MCP server."

After reload, the following MCP tools become available to all fv skills:
- `list_repos`, `query`, `context`, `impact`, `detect_changes`, `rename`, `cypher`
- Resources: `gitnexus://repo/{name}/context`, `gitnexus://repo/{name}/processes`, `gitnexus://repo/{name}/clusters`
- Prompts: `detect_impact` (pre-commit analysis), `generate_map` (architecture docs)

The `--skills` flag generates repo-specific skill files in `.claude/skills/generated/` that provide repository-aware context supplementing the standard fv skills.

**If the user chooses "Skip":**

Record the skip for this session only. Downstream skills will fall back to file-based tracing.

**If the user chooses "Never ask":**

Write to `docs/ai/conventions.md` (create if missing):

```yaml
gitnexus: declined
gitnexus_decided_at: YYYY-MM-DD
```

### If Present

**Always re-index at session start.** Run this every time to ensure the knowledge graph reflects the current codebase:

```bash
npx gitnexus analyze
```

This is fast for incremental updates (only processes changed files). It ensures all downstream skills (fv:plan, fv:impact, fv:review) have a fresh graph to query.

**Version check**: Run `gitnexus --version` and compare against the latest available:

```bash
npm view gitnexus version
```

If a newer version is available, inform the user:

```
GitNexus update available: vX.Y.Z -> vA.B.C
Run: npm update -g gitnexus
```

After confirming the index is fresh, read the `gitnexus://repo/{name}/context` resource to retrieve index stats (symbol count, staleness, available tools). Include these stats in the session brief:

```
GitNexus:  available (N symbols, indexed YYYY-MM-DD, vX.Y.Z)
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

Check if `docs/ai/conventions.md` contains `boost: declined`. If declined previously, skip silently.

**GATE: Boost decision required for Laravel projects.** Use the platform's blocking question tool (AskUserQuestion in Claude Code). Do NOT skip this prompt.

Options to present:

1. Install Boost now (recommended) -- provides MCP tools for database schema, doc search, error logs, and accurate app info
2. Skip for now
3. Never ask again for this project

**If the user chooses "Install":**

Run the Boost installation:

```bash
composer require laravel/boost --dev
php artisan boost:install
```

The `boost:install` command is interactive -- it configures MCP server, installs AI guidelines, and sets up agent skills. Let the user interact with the installer prompts.

Post-install steps:
1. Verify `.mcp.json` now contains the `laravel-boost` MCP server entry
2. Add `"laravel-boost"` to `enabledMcpjsonServers` in `.claude/settings.local.json` if not already present
3. Run `php artisan boost:update` to ensure guidelines are current
4. Inform the user: "Boost installed. Run `/reload-plugins` to activate the MCP tools."

**If the user chooses "Skip":**

Record the skip for this session only.

**If the user chooses "Never ask":**

Write to `docs/ai/conventions.md` (create if missing):

```yaml
boost: declined
boost_decided_at: YYYY-MM-DD
```

### If Present

**Update check**: Run Boost update to ensure guidelines and skills match the current Laravel ecosystem:

```bash
php artisan boost:update
```

Report the result: "Boost guidelines updated" or "Boost guidelines already current."

**Version check**: Compare the installed Boost version from `composer.json` against latest:

```bash
composer show laravel/boost --latest --format=json 2>/dev/null
```

If a newer version is available, inform the user:

```
Boost update available: vX.Y.Z -> vA.B.C
Run: composer update laravel/boost
```

Then use the `mcp__laravel-boost__application-info` tool to retrieve accurate stack data from the running application:
- PHP version, Laravel version, database engine
- Installed ecosystem packages with exact versions
- Eloquent model inventory

This data is more reliable than parsing `composer.json` because it reflects the actual running environment. Feed Boost's application-info output into the session brief's Environment section (Step 8) for accurate version reporting. If the Boost MCP tool call fails, fall back to `composer.json` parsing.

Also note that Boost's `mcp__laravel-boost__search-docs` tool (17,000+ docs from Laravel, Filament, Livewire, Pest, Tailwind) is available for downstream skills (`/fv:plan`, `/fv:work`, `/fv:review`).

Note "Boost: available" for the session brief.

---

## Step 8: Output Session Brief

Present a structured summary of everything detected. Use this exact format:

```
=== Fuelviews Engineering Session ===

Environment:
  Branch:    <current branch>
  Repo Type: <Laravel|PHP|Unknown> (<framework version if detected>)
  CE:        <available (vX.Y.Z) | not detected>
  GitNexus:  <available|installed (this session)|declined|skipped>
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
- There are no hard failures. All steps degrade gracefully -- missing components are reported as warnings, not blockers.

---

## Scratch Space

If this skill needs to store intermediate state (e.g., freshness check results across multiple files), use `.context/compound-engineering/fv-start-session/`. Clean up after the session brief is emitted.
