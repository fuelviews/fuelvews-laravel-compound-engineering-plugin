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

### 1b: Detect Laravel Version and Ecosystem

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

### 1c: Detect Directory Patterns

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

### 1d: Collect Key Counts

Gather quantitative data for the repo map:

- Count models: files in `app/Models/`
- Count migrations: files in `database/migrations/`
- Count routes: count route definitions in `routes/web.php`, `routes/api.php`, `routes/console.php`
- Count tests: files in `tests/Unit/` and `tests/Feature/`
- Count controllers: files in `app/Http/Controllers/`
- Count Livewire components: files in `app/Livewire/` (if detected)

### 1e: Deep Analysis (Optional)

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
   - Key Patterns table: populate from Phase 1c detections

2. **conventions.md** -- Copy from `templates/repo-layer/conventions.md`. Sample the codebase to detect conventions:
   - Read 3-5 controller files. Note: strict types declaration, return type usage, dependency injection patterns.
   - Read 3-5 model files. Note: casting usage, relationship naming, scope patterns.
   - Read the test directory structure. Note: test naming patterns, base test class usage.
   - Populate only conventions that DIFFER from framework defaults. Do not restate PSR-12 or Laravel basics.

3. **repo-map.md** -- Copy from `templates/repo-layer/repo-map.md`. Fill in:
   - Entry points from route files and artisan commands
   - Domain directories from Phase 1c
   - Configuration wiring from detected config files
   - Test locations from directory scan
   - Key counts from Phase 1d

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

1. Check if `docs/plans/archive/` exists. If not, ask the user: "Found N superseded/abandoned plans. Create `docs/plans/archive/` and move them there? (y/n)"
2. If the user approves, move the files and update the plan index.
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

---

## Phase 4: Identify Risks and Tools

### 4a: Risky Zone Detection

Scan the codebase for patterns that indicate high-risk areas:

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

Print a structured summary to the terminal:

```
=== Repo Catch-Up Complete ===

Project:    <project name from composer.json or directory name>
Type:       <Laravel X.x | PHP | Unknown>
Packages:   <count detected> (<key packages listed>)
Patterns:   <detected patterns: Actions, Services, Repositories, etc.>

Docs Created:
  - <file path>

Docs Refreshed:
  - <file path> (N claims verified, M corrected)

Plans Classified:
  | Status     | Count |
  |------------|-------|
  | active     | N     |
  | complete   | N     |
  | superseded | N     |
  | abandoned  | N     |
  | draft      | N     |
  | uncertain  | N     |

Risks Found:
  HIGH:   N
  MEDIUM: N
  LOW:    N
  - <top 3 risks listed>

Tool Recommendations:
  - <suggestion or "All recommended tools detected">

Verification:
  Claims checked: N
  Mismatches found: M
  Auto-corrected: K

Suggested Next:
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

- `compound-engineering:research:repo-research-analyst` -- deep scan of repo structure when Phase 1e complexity threshold is met. Not dispatched by default.

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

Clean up after the summary is emitted unless the user requests inspection.
