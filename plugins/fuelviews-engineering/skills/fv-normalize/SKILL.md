---
name: fv:normalize
description: Normalize a legacy Laravel codebase with tiered automated fixes using Pint, Rector, Larastan, and GitNexus. Use when onboarding to a messy repo or enforcing conventions.
argument-hint: "[--tier 1|2|3|4] [--dry-run] [--install]"
---

# Normalize a Laravel Codebase

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

---

## Input

<normalize_input> #$ARGUMENTS </normalize_input>

Parse flags:
- `--tier N`: Run only the specified tier (1-4). Default: run all tiers sequentially with gates between them.
- `--dry-run`: Preview changes without applying. Applies to all tool invocations.
- `--install`: Jump directly to toolchain installation (Phase 0) then stop.

---

## Phase 0: Toolchain Detection and Installation

Before any normalization, verify the required tools are installed and configured.

### 0a: Detect Installed Tools

Check for each tool in the project:

| Tool | Detection | Required For |
|------|-----------|-------------|
| Laravel Pint | `composer.json` has `laravel/pint` OR `vendor/bin/pint` exists | Tier 1 |
| Rector | `composer.json` has `rector/rector` AND `driftingly/rector-laravel` | Tier 1-2 |
| Larastan/PHPStan | `composer.json` has `larastan/larastan` or `phpstan/phpstan` | Tier 2+ |
| GitNexus | `.gitnexus/` directory exists | Tier 3 |
| ast-grep | `which ast-grep` succeeds | Tier 2-3 |

### 0b: Present Toolchain Status

Present as formatted markdown:

```markdown
## Normalization Toolchain

| Tool | Status | Action |
|------|--------|--------|
| Laravel Pint | installed / missing | -- / install |
| Rector + rector-laravel | installed / missing | -- / install + configure |
| Larastan | installed (level N) / missing | -- / install + baseline |
| GitNexus | indexed (N symbols) / missing | -- / install + index |
| ast-grep | installed / missing | -- / install |
```

### 0c: Offer Installation

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Install all missing tools (recommended)" -- Install and configure everything needed
2. "Install selectively" -- Choose which tools to install
3. "Skip installation" -- Proceed with what's available (some tiers may be skipped)

### 0d: Install Missing Tools (if accepted)

Run installations in order. Each tool gets its own subsection so the user can see progress.

**Laravel Pint** (if missing):
```bash
composer require laravel/pint --dev
```
Then create `pint.json` if it doesn't exist:
```json
{
    "preset": "laravel",
    "rules": {
        "ordered_imports": { "sort_algorithm": "alpha" },
        "no_unused_imports": true,
        "trailing_comma_in_multiline": { "elements": ["arguments", "arrays", "parameters"] }
    }
}
```

**Rector + rector-laravel** (if missing):
```bash
composer require rector/rector driftingly/rector-laravel --dev
```
Then create `rector.php` if it doesn't exist. Detect the Laravel version from `composer.json` and set the appropriate level set:
```php
<?php

use Rector\Config\RectorConfig;
use RectorLaravel\Set\LaravelLevelSetList;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/app',
        __DIR__ . '/routes',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/tests',
    ])
    ->withSkip([
        __DIR__ . '/bootstrap',
        __DIR__ . '/storage',
        __DIR__ . '/vendor',
    ])
    ->withSets([
        LaravelLevelSetList::UP_TO_LARAVEL_120, // adjust based on detected version
    ])
    ->withComposerBased()
    ->withParallel();
```

**Larastan** (if missing):
```bash
composer require larastan/larastan --dev
```
Then create `phpstan.neon` if it doesn't exist:
```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app/
    level: 0
```
Generate initial baseline:
```bash
vendor/bin/phpstan analyse --generate-baseline
```

**GitNexus** (if missing): Defer to the installation flow in `fv:start-session` Step 6.

**ast-grep** (if missing):
```bash
npm install -g @ast-grep/cli
```

After all installations, re-detect and present the updated toolchain status.

If `--install` flag was passed, stop here.

---

## Phase 1: Audit

Before fixing anything, audit the codebase to understand the scope of violations.

### 1a: Run Automated Audit (subagent)

Dispatch a single subagent to audit convention violations. This keeps verbose results out of the orchestrator.

- Task (general-purpose subagent) with: "Audit this Laravel codebase for convention violations."

  Instruct the subagent:

  "Audit the codebase for normalization violations. Use native tools (Glob, Grep, Read), ast-grep, and GitNexus (if available). Do NOT use shell find/grep/wc pipelines.

  **Check these categories:**

  *Formatting (Pint):*
  - Run `vendor/bin/pint --test` to get violation count

  *Rector opportunities:*
  - Run `vendor/bin/rector process --dry-run` to get transformable patterns count
  - If Rector is not installed, use ast-grep to detect:
    - Route string syntax: `ast-grep -p 'Route::$_($_, $_)' --lang php` in routes/ (check for string controller references)
    - Pipe validation: `ast-grep -p '$_->validate([$$$])' --lang php` (check for pipe-delimited strings)
    - Missing return types: `ast-grep -p 'public function $NAME($$$) {' --lang php` (no return type)

  *Naming conventions:*
  - Controllers: check for plural names, non-PascalCase
  - Models: check for plural names
  - Tables: check migration files for non-snake_case or singular table names
  - Routes: check for non-kebab-case URIs
  - Enums: check for non-PascalCase cases

  *Structural:*
  - Fat controllers: controllers > 300 LOC
  - Fat models: models > 500 LOC
  - Inline validation in controllers (not using FormRequests)
  - `env()` calls outside config/
  - `$request->all()` usage (should be `$request->validated()`)
  - Missing policies for models with controllers

  *Static analysis:*
  - If Larastan installed, run `vendor/bin/phpstan analyse --error-format=json` and count errors by level

  **Return format:** Structured audit summary with counts per category. Target under 100 lines."

  **Return contract:** Violation counts per category, top 5 worst files per category, total estimated fix effort. No full file contents.

### 1b: Present Audit Results

Present as formatted markdown:

```markdown
## Normalization Audit

| Category | Violations | Tool | Tier |
|----------|-----------|------|------|
| Formatting (Pint) | <N> files | Pint | 1 |
| Validation syntax (pipes) | <N> | Rector | 1 |
| Route string syntax | <N> | Rector | 2 |
| Missing return types | <N> methods | Rector | 2 |
| Eloquent helper modernization | <N> | Rector | 1 |
| Naming conventions | <N> violations | GitNexus rename | 3 |
| Fat controllers (>300 LOC) | <N> files | Plan-level | 4 |
| Inline validation | <N> controllers | Plan-level | 4 |
| Missing policies | <N> models | Plan-level | 4 |
| PHPStan errors (level 0) | <N> | Larastan | 2 |

### Worst Files
| File | Violations | Categories |
|------|-----------|------------|
| `app/Http/Controllers/X.php` | <N> | fat controller, inline validation, missing return types |

### Estimated Effort
- Tier 1 (automated, zero risk): <N> fixes across <N> files
- Tier 2 (automated, review needed): <N> fixes across <N> files
- Tier 3 (individual impact analysis): <N> renames
- Tier 4 (plan-level refactoring): <N> structural issues
```

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Run all tiers sequentially" -- Full normalization with gates between tiers
2. "Run Tier 1 only" -- Safe automated fixes
3. "Run Tier 1 + 2" -- Automated fixes with review
4. "Just the audit" -- Stop here, I'll fix manually
5. "Generate plan for Tier 4" -- Create `/fv:plan` tasks for structural refactoring

---

## Tier 1: Safe Batch Fixes (Zero Risk)

These changes are mechanical, behavior-preserving, and safe to apply across the entire codebase in one PR.

### 1.1: Pint Formatting Pass

```bash
vendor/bin/pint
```

Report: "<N> files fixed by Pint."

### 1.2: Rector Safe Rules

Run Rector with only the safest Laravel rules:

```bash
vendor/bin/rector process --dry-run
```

Review the dry-run output. If it looks clean:

```bash
vendor/bin/rector process
```

**Safe rules (Tier 1 only):**
- `ValidationRuleArrayStringValueToArrayRector` -- pipe to array validation
- `EloquentOrderByToLatestOrOldestRector` -- `orderBy` to `latest()`/`oldest()`
- `AbortIfRector` -- if/abort to `abort_if()`
- `AnonymousMigrationsRector` -- named to anonymous migrations
- `AssertStatusToAssertMethodRector` -- test assertion modernization
- `RemoveDumpDataDeadCodeRector` -- remove `dd()`, `dump()`

### 1.3: Commit Tier 1

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Commit Tier 1 fixes" -- Stage and commit with message `style: normalize codebase (Pint + Rector Tier 1)`
2. "Review changes first" -- Show `git diff --stat`, let user inspect
3. "Revert" -- `git checkout .` to undo all changes

---

## Tier 2: Automated with Review (Low Risk)

These changes are automated but may have edge cases. Apply in focused PRs, verify with tests.

### 2.1: Return Type Inference

Run Rector strict-only return type rules:

```bash
vendor/bin/rector process --config rector-tier2-types.php
```

Rules:
- `ReturnTypeFromStrictNativeCallRector` -- types from PHP built-in calls
- `ReturnTypeFromStrictScalarReturnExprRector` -- types from literal returns

### 2.2: Route Syntax Modernization

```bash
vendor/bin/rector process routes/ --config rector-tier2-routes.php
```

Rules:
- `RouteActionCallableRector` -- string to tuple notation

Verify after:
```bash
php artisan route:list
```

### 2.3: Eloquent Modernization

Rules:
- `ModelCastsPropertyToCastsMethodRector` -- `$casts` property to `casts()` method
- `UnifyModelDatesWithCastsRector` -- `$dates` to `$casts`
- `OptionalToNullsafeOperatorRector` -- `optional()` to `?->`

### 2.4: PHPStan Level Increment

If Larastan is installed and baseline exists:

```bash
# Try incrementing the level
# Edit phpstan.neon: level: 0 -> level: 1
vendor/bin/phpstan analyse
```

If new errors are manageable (<20), fix them. Otherwise, regenerate baseline at the new level.

### 2.5: Run Tests

```bash
php artisan test
```

If tests fail, revert the failing tier and report which changes broke tests.

### 2.6: Commit Tier 2

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Commit Tier 2 fixes" -- `refactor: add return types, modernize routes and Eloquent (Rector Tier 2)`
2. "Commit in separate PRs" -- One commit per sub-tier (types, routes, Eloquent, PHPStan)
3. "Review changes first"
4. "Revert"

---

## Tier 3: Individual Impact Analysis (Medium Risk)

These changes rename or move code. Each requires impact analysis before execution.

### 3.1: Collect Rename Candidates

From the audit results, collect all naming violations:
- Controllers with wrong casing/plurality
- Models with wrong casing
- Methods not following camelCase
- Relationships with wrong singular/plural

### 3.2: Process Each Rename

For each rename candidate, use GitNexus for safe execution:

```
gitnexus_rename({symbol_name: "OldName", new_name: "NewName", dry_run: true})
```

Review the dry-run preview:
- **Graph edits** (high confidence) -- safe to apply
- **Text search edits** (lower confidence) -- need manual review

Present each rename to the user:

Use **AskUserQuestion** per rename (do NOT proceed without a response):

1. "Apply this rename" -- Run with `dry_run: false`
2. "Skip this rename" -- Move to next
3. "Stop renames" -- Exit Tier 3

If GitNexus is not available, use ast-grep for detection and present renames as manual tasks.

### 3.3: Commit Tier 3

One commit per rename or batch of related renames. Message: `refactor: rename <OldName> to <NewName> for convention compliance`.

---

## Tier 4: Plan-Level Refactoring (High Risk)

These are structural changes that need full planning, impact assessment, and implementation cycles.

### 4.1: Generate Plans

For each structural issue from the audit, offer to create a `/fv:plan` task:

| Issue | Plan Type |
|-------|-----------|
| Fat controllers | `refactor: extract <ControllerName> to service classes` |
| Inline validation | `refactor: extract <ControllerName> validation to FormRequests` |
| Missing policies | `feat: add policies for <ModelName> authorization` |
| `env()` outside config | `refactor: move env() calls to config files` |
| `$request->all()` usage | `refactor: replace $request->all() with $request->validated()` |

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Create plans for all Tier 4 issues" -- Generate one plan per issue category
2. "Create plans selectively" -- Choose which to plan
3. "Skip Tier 4" -- Document issues in audit report only

For each accepted plan, invoke `/fv:plan` with the issue description. The plan skill handles impact assessment, infrastructure discovery, and convergent review.

---

## Phase 2: Summary

Present final normalization summary as formatted markdown:

```markdown
## Normalization Complete

### Changes Applied

| Tier | Fixes | Files | Commits |
|------|-------|-------|---------|
| 1 (formatting + safe rules) | <N> | <N> | <N> |
| 2 (types + routes + Eloquent) | <N> | <N> | <N> |
| 3 (renames) | <N> | <N> | <N> |
| 4 (plans created) | <N> plans | -- | -- |

### Toolchain Configured

| Tool | Status | Config |
|------|--------|--------|
| Pint | active | `pint.json` |
| Rector | active | `rector.php` |
| Larastan | level <N> | `phpstan.neon` (baseline: <N> errors) |
| GitNexus | indexed | `.gitnexus/` |

### Remaining Issues

| Category | Count | Next Step |
|----------|-------|-----------|
| PHPStan baseline errors | <N> | Shrink via Boy Scout Rule |
| Tier 4 plans created | <N> | Run `/fv:work` on each |
| Skipped renames | <N> | Re-run `/fv:normalize --tier 3` |

### CI Recommendations

Add these to your CI pipeline to prevent regression:
- `vendor/bin/pint --test` -- formatting check
- `vendor/bin/phpstan analyse` -- static analysis (baseline prevents noise)
- `vendor/bin/rector process --dry-run` -- catch new Rector violations
```

### Compound Learnings

If any tier revealed surprising findings (unexpected coupling from renames, framework version gotchas, tools that didn't work as expected), offer compounding:

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Compound learnings" -- Capture normalization insights to `docs/solutions/`
2. "Skip" -- No learnings worth documenting

---

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- deep codebase scan when audit reveals unusual patterns
  **Return contract:** Violation counts and worst files only. No full file contents.

### FV Agents

- `fuelviews-engineering:review:laravel-conventions-reviewer` -- can be dispatched for targeted convention audit on specific directories
  **Return contract:** Structured findings list only.

---

## Error Handling

- If `composer require` fails, report the error and suggest manual installation. Continue with available tools.
- If Rector crashes on a file, skip that file and report it. Continue with remaining files.
- If tests fail after a tier, offer to revert that tier's changes. Do not proceed to the next tier.
- If GitNexus rename fails, fall back to presenting the rename as a manual task.
- If `ast-grep` is not installed and GitNexus is not available, Tier 3 becomes a manual todo list.

---

## Tool Selection Rules

- Prefer native tools (Glob, Grep, Read) over shell pipelines for all code exploration
- Do NOT use `find | grep | wc` shell pipelines
- Shell is appropriate for: Pint, Rector, PHPStan, ast-grep, git, composer, npm, artisan
- Each shell command runs one at a time, no chaining
