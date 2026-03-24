---
name: fv:repo-catchup
description: Normalize a legacy Laravel repo with plan classification and doc refresh. Use when onboarding to a new or messy repo that needs docs/ai/ structure and plan inventory.
argument-hint: ""
---

# Normalize and Onboard a Laravel Repository

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

Create a task list for this repo onboarding with items for each phase below. Update task status as each phase completes.

---

## Phase 0: GitNexus Bootstrap (if available)

Before any scanning, check if GitNexus can provide a deep knowledge graph.

### 0a: Check GitNexus Status

Look for `.gitnexus/` in the project root.

- **If `.gitnexus/` exists**: Check freshness by comparing `.gitnexus/` last modified against `git log -1 --format=%ci`. If the index is more than 24 hours older than the latest commit, re-index:
  ```bash
  gitnexus analyze
  ```
- **If `.gitnexus/` does not exist but `gitnexus` is installed** (check `which gitnexus`): Use **AskUserQuestion** (do NOT proceed without a response):
  1. "Index now (recommended)" -- Enables deep dependency analysis, takes 1-5 minutes
  2. "Skip" -- Use file-based scanning only
  If the user chooses to index, run:
  ```bash
  gitnexus analyze
  gitnexus analyze --skills
  ```
  Then add `.gitnexus/` to `.gitignore` if not already present.
- **If GitNexus is not installed** (neither `which gitnexus` nor `npx gitnexus --version` succeeds): Use **AskUserQuestion** (do NOT proceed without a response):
  1. "Install and index now (recommended)" -- Graph-powered code intelligence for dependency tracing, execution flows, architecture docs
  2. "Skip" -- Use file-based scanning only
  If the user chooses to install, run:
  ```bash
  npm install -g gitnexus
  gitnexus analyze
  gitnexus analyze --skills
  claude mcp add gitnexus -- npx -y gitnexus@latest mcp
  gitnexus setup
  ```
  Then add `.gitnexus/` to `.gitignore` if not already present.
  Inform the user: "GitNexus installed. Run `/reload-plugins` to activate MCP tools, then re-run `/fv:repo-catchup` for graph-powered analysis."
  Note: if the user installs but doesn't reload, the MCP tools won't be available in this session. The skill should proceed with file-based scanning and note that GitNexus will enhance future runs after reload.

### 0b: Generate Repo-Specific Skills (if indexed)

If GitNexus index exists (either pre-existing or just created), generate repo-specific skill files:

```bash
gitnexus analyze --skills
```

This creates skill files in `.claude/skills/generated/` that provide repository-aware context supplementing the standard fv skills.

### 0c: Generate Architecture Documentation (if indexed)

Use the `generate_map` MCP prompt to create architecture documentation with mermaid diagrams from the graph. This produces richer output than file-based scanning alone and feeds directly into `architecture.md` and `repo-map.md` scaffolding.

Store the generated architecture documentation in `.context/compound-engineering/fv-repo-catchup/gitnexus-architecture.md` for use in subsequent phases.

### 0d: Read Graph Resources (if indexed)

Read these MCP resources to pre-populate data for later phases:

1. **`gitnexus://repo/{name}/clusters`** -- Functional clusters with cohesion scores. Feeds into repo-map.md (domain directories, module boundaries) and architecture.md (component relationships).
2. **`gitnexus://repo/{name}/processes`** -- All execution flows. Feeds into repo-map.md (entry points, key execution paths) and architecture.md (callback chains, job flows).

Store each resource result in `.context/compound-engineering/fv-repo-catchup/` for reference during scaffolding.

### 0e: Query Key Structures (if indexed)

If the index exists, run targeted queries using the `query` MCP tool to supplement resource data:

1. **Entry points**: `query "entry points and request handling"` -- feeds into repo-map.md
2. **Core models**: `query "database models and relationships"` -- feeds into architecture.md
3. **Event/listener chains**: `query "events listeners observers"` -- feeds into architecture.md callback chains
4. **Job/queue flows**: `query "jobs queues dispatched"` -- feeds into architecture.md

Store each query result in `.context/compound-engineering/fv-repo-catchup/` for reference during scaffolding.

**Set a flag** `$GITNEXUS_AVAILABLE` for subsequent phases to check. When true, phases should prefer GitNexus data over file scanning for accuracy; when false, fall back to the file-based approach.

---

## Phase 1: Scan Repo Structure

### 1a: Detect Project Type

Read the project root for key indicator files:

1. **composer.json** -- If present, read it. Extract:
   - `require.laravel/framework` or `require.illuminate/*` (Laravel detection)
   - `require.php` version constraint
   - All packages in `require` and `require-dev`
2. **package.json** -- If present, read it. Extract frontend tooling (Vite, Mix, Webpack, Tailwind, Alpine, etc.).
3. **artisan** file in project root -- Confirms Laravel project.
4. **.env.example** -- Read to identify database driver, queue driver, cache driver, and other environment configuration.

### 1b: Boost-Enhanced Detection (if available)

If Boost MCP tools are available (check for `laravel-boost` in `composer.json`), use `mcp__laravel-boost__application-info` for accurate package detection -- this returns PHP version, Laravel version, database engine, installed packages with exact versions, and Eloquent model inventory from the running app. Use `mcp__laravel-boost__database-schema` for the complete table/column/index inventory instead of counting migration files. Boost data is authoritative (from the running application) vs. file scanning which may miss dynamic registrations and runtime-resolved packages. If Boost is not available, use the file-based detection below.

### 1c: Detect Laravel Version and Ecosystem

If Laravel is detected, determine the version range from `composer.json`:

- `laravel/framework` version constraint (e.g., `^11.0`)
- Detect key ecosystem packages:

| Package | Detection Key |
|---------|--------------|
| Livewire | `livewire/livewire` |
| Filament | `filament/filament` or `filament/*` |
| Inertia | `inertiajs/inertia-laravel` |
| Jetstream | `laravel/jetstream` |
| Breeze | `laravel/breeze` |
| Sanctum | `laravel/sanctum` |
| Fortify | `laravel/fortify` |
| Horizon | `laravel/horizon` |
| Telescope | `laravel/telescope` |
| Cashier | `laravel/cashier-*` |
| Scout | `laravel/scout` |
| Socialite | `laravel/socialite` |
| Pennant | `laravel/pennant` |
| Octane | `laravel/octane` |
| Pulse | `laravel/pulse` |

Record all detected packages for inclusion in architecture documentation.

### 1d: Detect Directory Patterns

Use file-search tools (Glob in Claude Code, equivalent in other platforms) to detect architectural patterns:

| Pattern | Detection Method |
|---------|-----------------|
| Actions | Directory `app/Actions/` exists |
| Services | Directory `app/Services/` exists |
| Repositories | Directory `app/Repositories/` exists |
| Domain-driven | Directory `app/Domain/` or `src/Domain/` exists |
| DTOs | Directory `app/DTOs/` or `app/DataTransferObjects/` exists |
| Enums | Directory `app/Enums/` exists |
| Events/Listeners | `app/Events/` and `app/Listeners/` both exist |
| Observers | Directory `app/Observers/` exists |
| View Components | Directory `app/View/Components/` exists |
| Livewire Components | Directory `app/Livewire/` or `app/Http/Livewire/` exists |
| Filament Resources | Directory `app/Filament/` exists |
| Policies | Directory `app/Policies/` exists |

### 1e: Collect Key Counts

Gather quantitative data for the repo map:

- Count models: files in `app/Models/`
- Count migrations: files in `database/migrations/`
- Count routes: count route definitions in `routes/web.php`, `routes/api.php`, `routes/console.php`
- Count tests: files in `tests/Unit/` and `tests/Feature/`
- Count controllers: files in `app/Http/Controllers/`
- Count Livewire components: files in `app/Livewire/` (if detected)

### 1f: Deep Analysis (Optional)

If the initial scan reveals an unusually complex layout (>5 non-standard directories under `app/`, or a `src/` directory alongside `app/`), dispatch the CE research agent for deeper analysis:

- Task `compound-engineering:research:repo-research-analyst` with scope: "Map the full directory structure, identify non-standard architectural patterns, and document entry points."

Otherwise, skip this dispatch -- the inline scan is sufficient.

---

## Phase 2: Create/Refresh docs/ai/

### 2a: Check Existing Structure

Determine whether `docs/ai/` already exists:

- If `docs/ai/` does not exist: proceed to full scaffold (2b).
- If `docs/ai/` exists: proceed to refresh mode (2c).

### 2b: Full Scaffold (New Repo)

Create the `docs/ai/` directory and populate from templates:

1. **architecture.md** -- Copy from `templates/repo-layer/architecture.md`. Fill in detected values:
   - Stack section: language, framework version, frontend tools, database driver, queue driver, deployment (leave blank if unknown)
   - **If Boost is available** (Phase 1b): use `mcp__laravel-boost__database-schema` output to populate the Database section with actual tables, columns, indexes, and foreign keys. This is authoritative over migration-file counting. If Boost is not available, document table count from migration files.
   - Key Patterns table: populate from Phase 1d detections
   - **If `$GITNEXUS_AVAILABLE`**: Enrich from Phase 0 data:
     - Use the `generate_map` output from Phase 0c for mermaid diagrams and component relationships
     - Callback/Event Chains section: populate from `gitnexus://repo/{name}/processes` resource (Phase 0d) and `query "events listeners observers"` results (Phase 0e)
     - Functional Clusters: populate from `gitnexus://repo/{name}/clusters` resource (Phase 0d) with cohesion scores
     - Architectural Decisions: note patterns visible in the dependency graph (e.g., "service layer mediates all controller-to-model access")

2. **conventions.md** -- Copy from `templates/repo-layer/conventions.md`. Sample the codebase to detect conventions:
   - Read 3-5 controller files. Note: strict types declaration, return type usage, dependency injection patterns.
   - Read 3-5 model files. Note: casting usage, relationship naming, scope patterns.
   - Read the test directory structure. Note: test naming patterns, base test class usage.
   - Populate only conventions that DIFFER from framework defaults. Do not restate PSR-12 or Laravel basics.

3. **repo-map.md** -- Copy from `templates/repo-layer/repo-map.md`. Fill in:
   - Entry points from route files and artisan commands
   - Domain directories from Phase 1d
   - Configuration wiring from detected config files
   - Test locations from directory scan
   - Key counts from Phase 1e
   - **If `$GITNEXUS_AVAILABLE`**: Replace the basic directory scan with GitNexus-powered data:
     - Entry Points table: use Phase 0e entry point query results and `gitnexus://repo/{name}/processes` resource (Phase 0d) for richer route-to-controller-to-service mapping
     - Domain Directories: augment with cohesion data from `gitnexus://repo/{name}/clusters` resource (Phase 0d) and dependency weight from the knowledge graph
     - Add a "Key Dependency Flows" section: extract the top 5-10 most important execution paths from the processes resource

4. **current-work.md** -- Copy from `templates/current-work.md`. Populate from git context:
   - If the current branch is not `main`/`dev`, infer an active task from the branch name.
   - If `git log --oneline -5` shows recent activity, note the latest work area.
   - Otherwise, leave as blank template.

5. Set `Last verified: YYYY-MM-DD` header in each created file (use today's date).

### 2c: Refresh Mode (Existing docs/ai/)

For each file in `docs/ai/`, read it and verify against current repo state:

1. **architecture.md** -- Compare stack claims against `composer.json` and `package.json`. Flag mismatches. Update package versions if they have changed.
2. **conventions.md** -- Spot-check 2-3 convention claims against actual code. Flag any that no longer hold.
3. **repo-map.md** -- Verify directory listings exist. Check counts against actual file counts. Flag stale entries (directories that no longer exist, counts that are wrong).
4. **current-work.md** -- Check if the referenced plan/branch still exists. Update if stale.

Update `Last verified: YYYY-MM-DD` in each refreshed file.

---

## Phase 3: Plan Inventory

### 3a: Scan for Plan-Like Files

Search for plan-like files in these locations (in priority order):

1. `docs/plans/` -- canonical plan directory
2. `docs/` -- root docs directory
3. Project root -- top-level markdown files that look like plans
4. `.github/` -- sometimes plans live near PR templates

Detection heuristics for plan-like files:

- Filename contains: `plan`, `spec`, `rfc`, `proposal`, `design`, `adr`
- File contains checklist syntax (`- [ ]` or `- [x]`)
- File has YAML frontmatter with `status:` field
- File has sections named "Implementation Steps", "Acceptance Criteria", or "Task"

### 3b: Create/Refresh Plan Index

If `docs/plans/_index.md` does not exist, create it from `templates/plan-index.md`.

If it exists, read it and prepare to update.

### 3c: Classify Plans Using 6-Signal Algorithm

For each plan-like file found in 3a, apply all six classification signals. Each signal produces a score or label. The final classification combines them.

#### Signal 1: Git Recency

Run `git log -1 --format=%ci -- <file>` to get the last modification date.

| Age | Signal |
|-----|--------|
| 0-14 days | `current` |
| 15-60 days | `recent` |
| 61-180 days | `historical` |
| >180 days | `dead` |

#### Signal 2: Content Freshness

Parse checklist items in the file. Calculate completion ratio.

| Ratio | Signal |
|-------|--------|
| 0% (all unchecked) | `not_started` |
| 1-50% | `in_progress` |
| 51-99% | `mostly_complete` |
| 100% | `complete` |
| No checklists | `unknown` |

#### Signal 3: Branch/PR Correlation

Check if a branch or PR references this plan:

1. Extract a likely slug from the filename.
2. Run `git branch --list "*<slug>*"` to find matching branches.
3. If `gh` CLI is available, run `gh pr list --search "<slug>" --state all --limit 5` to find related PRs.

| Condition | Signal |
|-----------|--------|
| Open PR exists | `active_pr` |
| Merged PR exists | `completed_pr` |
| Open branch, no PR | `active_branch` |
| No branch or PR | `no_correlation` |

#### Signal 4: Supersession Detection

Check for explicit supersession:

1. Look for YAML frontmatter `superseded_by:` field.
2. Search for plans with the same feature keyword but a later date prefix in the filename.
3. Check if another plan references this one as "replaced" or "superseded".

| Condition | Signal |
|-----------|--------|
| Explicitly superseded | `superseded` |
| Likely superseded (same feature, later date) | `probably_superseded` |
| No supersession detected | `not_superseded` |

#### Signal 5: Code Reference Validation

Extract file paths mentioned in the plan (in edit sets, implementation steps, or inline code references). Check whether those files still exist in the repo.

| Condition | Signal |
|-----------|--------|
| >80% referenced files exist | `references_valid` |
| 50-80% exist | `references_partially_valid` |
| <50% exist | `references_stale` |
| No file references found | `no_references` |

#### Signal 6: Commit Message Cross-Reference

Search recent commit messages for the plan's slug or title keywords:

Run `git log --oneline --all --grep="<slug>" --since="6 months ago"` and `git log --oneline --all --grep="<title keywords>" --since="6 months ago"`.

| Condition | Signal |
|-----------|--------|
| Commits in last 14 days | `actively_referenced` |
| Commits in last 60 days | `recently_referenced` |
| Older commits only | `historically_referenced` |
| No matching commits | `unreferenced` |

#### Final Classification

Combine the six signals into a final status:

| Final Status | Conditions |
|--------------|------------|
| `active` | Signal 1 is `current` AND (Signal 3 is `active_pr` or `active_branch`) |
| `active` | Signal 2 is `in_progress` AND Signal 1 is `current` or `recent` |
| `complete` | Signal 2 is `complete` AND Signal 3 is `completed_pr` |
| `complete` | Signal 2 is `mostly_complete` AND Signal 3 is `completed_pr` |
| `superseded` | Signal 4 is `superseded` or `probably_superseded` |
| `abandoned` | Signal 1 is `dead` AND Signal 2 is `not_started` or `in_progress` |
| `abandoned` | Signal 1 is `historical` AND Signal 5 is `references_stale` |
| `draft` | Signal 2 is `not_started` AND Signal 1 is `current` or `recent` |
| `needs_human_confirmation` | Signals conflict or no clear classification (e.g., `current` git recency but `complete` content with no matching PR) |

### 3d: Add Frontmatter to Legacy Plans

For any plan-like file that lacks YAML frontmatter, add it:

```yaml
---
title: <inferred from first heading or filename>
status: <classification from 3c>
canonical: <true if active/draft, false if superseded/abandoned/complete>
created_at: <from git log first commit date for the file>
classified_by: fv:repo-catchup
classified_at: YYYY-MM-DD
---
```

Ask the user before modifying files outside of `docs/plans/`. Present the proposed frontmatter and wait for confirmation.

### 3e: Organize Plans

For plans classified as `superseded` or `abandoned`:

1. Check if `docs/plans/archive/` exists. If not, use **AskUserQuestion** (do NOT proceed without a response):
   - "Archive N plans" -- Create `docs/plans/archive/` and move superseded/abandoned plans there
   - "Leave in place" -- Keep files where they are, update index entries with classified status
2. If the user approves archiving, move the files and update the plan index.
3. If the user declines, leave files in place but update their index entries with the classified status.

For plans classified as `needs_human_confirmation`:

- List each plan with its signal breakdown.
- Ask the user to classify each one.
- Do not auto-classify uncertain plans.

### 3f: Update Plan Index

Write all classified plans to `docs/plans/_index.md`:

| Title | File | Status | Canonical | Created | Last Verified | Superseded By | Notes |
|-------|------|--------|-----------|---------|---------------|---------------|-------|

Include the classification source (`fv:repo-catchup`) in the Notes column for newly classified plans.

### 3g: Batch Plan Sync

After classification, sync every qualifying plan. This is a multi-plan operation -- you MUST process ALL qualifying plans, not just the first one.

**Step 1: Build and tier the plan list.**

Scan the classified inventory. Collect every plan where status is NOT `closed`, `archived`, `abandoned`, or `superseded`. Then split into tiers by last modification date (use `git log -1 --format=%ci -- <file>`):

- **Tier 1 (full sync)**: Modified in the last 30 days. These get full sync with git diff, step counting, and drift detection.
- **Tier 2 (lightweight)**: Older than 30 days. These get frontmatter-only sync with checkbox ratio calculation. No git diff or drift detection.

Print the tier split:

```
Plan sync tiers:
  Tier 1 (full sync, last 30 days): N plans
  Tier 2 (lightweight, older): M plans
  Skipped (closed/archived/abandoned): K plans
```

If zero qualifying plans in both tiers, report "No active plans to sync" and skip to Phase 4.

**Step 2: Full sync Tier 1 plans.**

Create one task per Tier 1 plan:

- Task: "Full sync 1/N: <title>"
- Task: "Full sync 2/N: <title>"

Process each task:

1. Mark task in_progress
2. Read the full plan file
3. Determine base branch (from plan frontmatter `branch:` or default `dev`/`main`)
4. Run `git diff --name-only <base>..HEAD`
5. Count checked vs unchecked steps
6. Check if planned files were actually modified
7. Calculate completion percentage
8. Detect drift (unplanned changes, missing expected changes)
9. Update plan frontmatter: `last_synced: YYYY-MM-DD`
10. Mark task completed
11. Report: "Full sync <N>/<total>: <title> -- <completion%>"

**REPEAT until all Tier 1 tasks are completed.**

**Step 3: Lightweight sync Tier 2 plans.**

Process all Tier 2 plans in a single pass (no individual tasks):

1. For each plan, read only YAML frontmatter and count `- [x]` / `- [ ]` occurrences
2. Calculate completion percentage
3. Update frontmatter: `last_synced: YYYY-MM-DD`
4. Report progress every 10 plans: "Lightweight: <N>/<total>..."

**Step 4: Update index and summary.**

After ALL plans (both tiers) are processed, update `docs/plans/_index.md` with new completion percentages.

Present batch summary as formatted markdown:

```markdown
## Batch Plan Sync Complete

### Tier 1 (Full Sync)

| # | Plan | Status | Completion | Drift |
|---|------|--------|------------|-------|
| 1 | <title> | locked | 0% -> 0% | none |
| 2 | <title> | implementing | 30% -> 45% | 2 unplanned |

### Tier 2 (Lightweight)

<M> plans synced, completion percentages updated.

### Totals

| Category | Count |
|----------|-------|
| Full synced | <N> |
| Lightweight | <M> |
| Skipped | <K> |
```

**Step 5: Select active task.**

Use **AskUserQuestion** to present the qualifying plans (do NOT proceed without a response):

Options (dynamically generated from synced plans):
1. "<title> (locked, 0%)"
2. "<title> (implementing, 45%)"
3. "Keep current active task"
4. "Clear active task"

Update `docs/ai/current-work.md` based on the choice.

---

## Phase 4: Identify Risks and Tools

### 4a: Risky Zone Detection

**If `$GITNEXUS_AVAILABLE`**: Use graph-powered analysis via MCP tools for deeper risk detection:

1. **Dead code**: `query` tool with "unreachable functions classes never called" -- find code that has no callers in the graph
2. **Circular dependencies**: `cypher` tool with `MATCH (a)-[:CALLS]->(b)-[:CALLS]->(a) RETURN a, b` -- find mutual dependency cycles
3. **High fan-out**: `context` tool on key service classes -- flag classes called by >10 others (fragile, high blast radius)
4. **Orphaned routes**: Cross-reference `query` tool with "route handlers" against actual route definitions
5. **Hidden coupling**: `impact` tool on core models -- reveal transitive dependencies that file scanning misses

Merge graph results with the file-based scan below. Graph findings take priority for accuracy; file-based findings catch what the graph misses (dynamic dispatch, config-driven behavior).

**File-based scan** (always runs, with or without GitNexus):

| Risk Pattern | Detection Method | Threshold |
|--------------|-----------------|-----------|
| Fat controllers | Read controllers, check line count | >300 LOC |
| God models | Read models, check line count | >500 LOC |
| Raw SQL | Search for `DB::raw(`, `DB::select(`, `DB::statement(` | Any occurrence |
| Missing return types | Sample 5 controller methods | >50% missing |
| No test coverage | Compare `app/` classes against `tests/` files | Classes with no corresponding test |
| Complex migrations | Migrations with >100 LOC or multiple table operations | Any occurrence |
| Tightly coupled services | Classes with >5 constructor dependencies | Any occurrence |

For each risk found, record:

- File path
- Risk type
- Severity (high/medium/low)
- Source: `gitnexus` or `file-scan`
- Brief description

### 4b: Laravel Tool Recommendations

Check for recommended tools that are not yet installed:

#### Boost Detection

If the project is Laravel and `composer.json` does not contain `fuelviews/laravel-boost` or `laravel-boost` in `require` or `require-dev`:

```
SUGGESTION: Laravel Boost is not installed.
Boost provides enhanced artisan commands and development utilities.
Install: composer require fuelviews/laravel-boost --dev
```

Suggest once only. Do not repeat if the user has seen this suggestion in a prior session.

#### GitNexus Detection

If `.gitnexus/` directory does not exist in the project root:

```
SUGGESTION: GitNexus not detected.
GitNexus provides enhanced local-state tracking for impact analysis.
```

#### Larastan/PHPStan Detection

Check `composer.json` for `larastan/larastan`, `phpstan/phpstan`, or `nunomaduro/larastan`.

If not found, check for `phpstan.neon` or `phpstan.neon.dist` in the project root.

```
SUGGESTION: Static analysis not configured.
Consider installing Larastan for Laravel-aware static analysis.
Install: composer require larastan/larastan --dev
```

If PHPStan is installed but no config file exists:

```
SUGGESTION: PHPStan is installed but no configuration file found.
Create phpstan.neon.dist with at least level 5 for meaningful analysis.
```

---

## Phase 5: Verification

This phase applies both to fresh scaffolds (Phase 2b) and refreshed docs (Phase 2c). It validates that the documentation just written or updated is accurate.

### 5a: Cross-Check doc Claims Against Code

For each factual claim in `docs/ai/` files, verify against the actual repo:

1. **Model count** in repo-map.md -- compare against actual file count in `app/Models/`.
2. **Migration count** -- compare against actual count in `database/migrations/`.
3. **Route count** -- compare against actual route definitions.
4. **Controller count** -- compare against actual files in `app/Http/Controllers/`.
5. **Directory references** -- verify each directory listed in repo-map.md actually exists.
6. **Package references** -- verify packages listed in architecture.md appear in `composer.json` or `package.json`.

### 5b: Flag Inaccuracies

For each mismatch found:

```
VERIFICATION MISMATCH:
  File:     docs/ai/repo-map.md
  Claim:    "12 models in app/Models/"
  Reality:  15 files in app/Models/
  Action:   Updated count to 15.
```

Auto-correct simple count mismatches. For structural mismatches (wrong directory names, missing sections), flag and ask the user before correcting.

### 5c: Set Verification Dates

Update `Last verified: YYYY-MM-DD` in all docs/ai/ files that were created or modified.

---

## Phase 6: Output Summary

Present a formatted markdown summary:

```markdown
## Repo Catch-Up Complete

### Project

| Field | Value |
|-------|-------|
| Project | <name from composer.json or directory> |
| Type | <Laravel X.Y / PHP / Unknown> |
| GitNexus | <indexed (N symbols) / not available> |
| Packages | <count> (<key packages>) |
| Patterns | <Actions, Services, Repositories, etc.> |

### Documentation

| Action | File | Details |
|--------|------|---------|
| Created | `docs/ai/architecture.md` | Scaffolded from template |
| Refreshed | `docs/ai/repo-map.md` | N claims verified, M corrected |

### Plans Classified

| Status | Count |
|--------|-------|
| active | <N> |
| complete | <N> |
| superseded | <N> |
| abandoned | <N> |
| draft | <N> |
| uncertain | <N> |

### Risks Found

| Severity | Count | Top Issues |
|----------|-------|------------|
| HIGH | <N> | <brief descriptions> |
| MEDIUM | <N> | |
| LOW | <N> | |

### Verification

| Metric | Count |
|--------|-------|
| Claims checked | <N> |
| Mismatches found | <N> |
| Auto-corrected | <N> |

### Tool Recommendations
- <suggestion or "All recommended tools detected">

### Recommended Next
<see recommendation logic below>
```

### Recommendation Logic

| Condition | Suggestion |
|-----------|------------|
| Active plans found | "Active plans detected. Run `/fv:start-session` to load context and resume work." |
| No active plans, docs healthy | "Repo is onboarded. Run `/fv:plan` to start a new task." |
| Uncertain plans exist | "N plans need human classification. Review the plan index at `docs/plans/_index.md`." |
| High-risk zones found | "High-risk code detected. Consider prioritizing refactoring tasks." |

---

## Key References

- [source-of-truth-order.md](./references/source-of-truth-order.md)
- [convergence-rules.md](./references/convergence-rules.md)
- [severity-policy.md](./references/severity-policy.md)
- [laravel-best-practices.md](./references/laravel-best-practices.md)

---

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- deep scan of repo structure when Phase 1f complexity threshold is met. Not dispatched by default.
  **Return contract:** Return ONLY: directory structure summary, non-standard patterns found, entry points, key architectural decisions. No full file contents or verbose listings.

### FV Agents

No fv-specific agents are required for repo catch-up. All scanning, classification, and scaffolding is performed inline by this skill. The 6-signal classification algorithm is deterministic and does not require agent judgment.

---

## Error Handling

- If `composer.json` cannot be read, set project type to "Unknown" and skip Laravel-specific detection (Phases 1b, 4b Boost/Larastan checks).
- If `package.json` cannot be read, skip frontend tool detection. Note absence in architecture docs.
- If git commands fail, skip git-dependent signals (Signals 1, 3, 6 in plan classification). Classify affected plans as `needs_human_confirmation`.
- If `gh` CLI is not available, skip PR correlation (Signal 3 PR checks). Branch checks still work via git.
- If `docs/plans/` does not exist and no plan-like files are found anywhere, skip Phase 3 entirely and note: "No plan artifacts found."
- If file write fails (permissions), report the error and continue with remaining phases.

---

## Scratch Space

Write intermediate scan results to `.context/compound-engineering/fv-repo-catchup/`. This includes:

- Package detection results
- Directory scan results
- Plan classification signal data
- GitNexus architecture documentation (if generated in Phase 0c)
- GitNexus resource results (if read in Phase 0d)
- GitNexus query results (if generated in Phase 0e)

Clean up after the summary is emitted unless the user requests inspection.
