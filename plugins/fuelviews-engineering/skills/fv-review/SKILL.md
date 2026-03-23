---
name: fv:review
description: Run convergent code review with Laravel-specific agents. Use after implementation to review code changes against plan and impact artifacts.
argument-hint: "[PR number, branch name, or 'latest'] [--serial]"
---

# Convergent Code Review with Laravel Agents

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

Run a multi-agent convergent code review against the current diff, comparing implementation to plan and impact artifacts. Laravel-specific agents are mandatory panel members. The review converges when no new P1 or P2 findings remain across rounds.

### Key References

- [convergence-rules.md](./references/convergence-rules.md)
- [severity-policy.md](./references/severity-policy.md)
- [laravel-best-practices.md](./references/laravel-best-practices.md)

### Severity Classification

| Severity | Criteria | Blocks Merge |
|----------|----------|--------------|
| P1 | Correctness, security, data loss, broken business logic | Yes |
| P2 | Performance, convention violation, missing error handling, test gaps | No (tracked) |
| P3 | Style, naming, minor optimization, documentation | No |

---

## Phase 1: Review Target Setup

### Parse Review Target

<review_target> #$ARGUMENTS </review_target>

Determine the review target from the argument:

1. **Numeric value** -- treat as PR number. Fetch PR metadata via `gh pr view <number> --json title,body,files,headRefName,baseRefName,labels,url`.
2. **GitHub URL** -- extract PR number from URL, then fetch metadata as above.
3. **Branch name** -- resolve to local branch. Compute diff against the base branch (main/master/dev).
4. **`latest`** -- find the most recent open PR authored by the current user via `gh pr list --author @me --limit 1 --json number`.
5. **Empty** -- use the current branch. Compute diff against the base branch.

### Branch Context Check

Determine the current branch via git. If the review target is on a different branch:

- Ask the user: "Review target is on branch `<target>` but you are on `<current>`. Switch to target branch using the `git-worktree` skill for isolated review?"
- If user accepts, load the `git-worktree` skill with the target branch name.
- If user declines, proceed on the current branch (user may have the code locally already).

### Load Artifacts

Search for related plan and impact artifacts:

1. **Plan artifact**: Search `docs/plans/` for a file matching the task slug, PR title keywords, or branch name. If found, load its frontmatter and task list for drift detection.
2. **Impact artifact**: Search `docs/plans/` or `docs/ai/` for an impact assessment file associated with the same task. If found, load the blast-radius map and dependency list.
3. If neither artifact exists, proceed without them. Note their absence in the final output.

### Collect Changed Files

Gather the list of changed files for conditional agent selection:

- For a PR: use the files list from `gh pr view --json files`.
- For a branch diff: use the native file-search/diff tool or `git diff --name-only <base>...HEAD`.

Record the file extensions and paths for use in agent panel assembly.

---

## Phase 2: Load Review Agent Panel

### Read Custom Configuration

Read `fuelviews-engineering.local.md` in the project root. If found, check for a `review_agents` key in YAML frontmatter. If the markdown body contains review context, pass it to each agent as additional instructions.

If the file does not exist, skip configuration loading and use the default panel below.

### Default Agent Panel

#### Mandatory Agents (always run, cannot be removed)

These agents run on every review regardless of configuration:

- `fuelviews-engineering:review:laravel-reviewer`
- `fuelviews-engineering:review:php-reviewer`
- `fuelviews-engineering:review:blade-reviewer`

#### Default Agents (run unless explicitly removed via .local.md)

- `fuelviews-engineering:review:laravel-conventions-reviewer`
- `fuelviews-engineering:review:laravel-performance-reviewer`
- `compound-engineering:review:code-simplicity-reviewer`
- `compound-engineering:review:security-sentinel`

#### Conditional Agents (auto-added based on changed files)

Evaluate the changed file list and add agents when criteria match:

| Condition | Files Matching | Agent Added |
|-----------|---------------|-------------|
| TypeScript changes | `*.ts`, `*.tsx` | `compound-engineering:review:kieran-typescript-reviewer` |
| Migration changes | `database/migrations/*.php`, `*.sql` | `compound-engineering:review:data-integrity-guardian` |
| JS / Livewire changes | `*.js`, `*.vue`, `*livewire*.php`, `resources/js/**` | `fuelviews-engineering:review:javascript-reviewer` |
| Deploy-risk changes | `composer.json`, `composer.lock`, `.env.example`, `config/*.php`, `routes/*.php`, `Dockerfile`, `docker-compose*`, `.github/workflows/*` | `compound-engineering:review:deployment-verification-agent` |
| PostgreSQL-heavy changes | Migration files with raw SQL, `DB::` facade usage, query builder joins/unions, stored procedure references | `fuelviews-engineering:review:postgresql-reviewer` |

Multiple conditions may fire. Add all matching agents; deduplication prevents double-dispatch.

### Mandatory Set Enforcement

If `fuelviews-engineering.local.md` defines a custom `review_agents` list that omits any of the three mandatory agents (`laravel-reviewer`, `php-reviewer`, `blade-reviewer`):

1. Warn the user: "Mandatory review agents were missing from your custom panel and have been restored: [list]."
2. Add the missing agents back to the panel.

### Assemble Final Panel

Merge mandatory + default (or custom) + conditional agents into the final panel. Record the total agent count.

---

## Phase 3: Execution Mode Selection

Determine how to dispatch agents:

| Condition | Mode | Behavior |
|-----------|------|----------|
| `--serial` flag passed | Serial | Run agents one at a time, wait for each to complete |
| Agent count <= 5 | Parallel | Dispatch all agents simultaneously via Task tool |
| Agent count > 5 | Serial (auto) | Switch to serial and inform user: "Running review agents in serial mode (6+ agents configured). Pass without `--serial` to try parallel for smaller panels." |

In serial mode, collect each agent's findings before dispatching the next. In parallel mode, collect all findings after all agents complete.

---

## Phase 4: Convergent Review Loop

Maximum 4 rounds. Track state:

```
round_number: 1
convergence_status: pending
consecutive_p3_only_rounds: 0
total_findings: []
resolved_findings: []
excluded_findings: []
```

### Round Focus Escalation

| Round | Depth Level | Focus |
|-------|-------------|-------|
| 1 | Broad | All P1/P2/P3 findings across all changed files |
| 2 | Interaction | Cross-file effects, event chains, service boundaries |
| 3 | System-wide | Error propagation, state lifecycle, legacy coupling |
| 4 | Adversarial | P1 risks only, challenge prior P2 severities upward |

### Round Execution

For each round:

#### Step A: Dispatch Review Agents

Dispatch all panel agents with the following context:

- PR diff (or branch diff)
- Plan artifact (if loaded) -- task list, scope, constraints
- Impact artifact (if loaded) -- blast-radius map, dependency chain
- Round number and focus level
- Prior round findings summary (compressed per progressive summarization rules)

Use the execution mode determined in Phase 3 (parallel or serial).

For parallel dispatch:
```
For each agent in final_panel:
  Task {agent-namespace}(diff + plan context + impact context + round focus)
```

For serial dispatch:
```
For each agent in final_panel:
  1. Task {agent-namespace}(diff + plan context + impact context + round focus)
  2. Wait for completion
  3. Collect findings
  4. Proceed to next agent
```

#### Step B: Collect Findings

Gather all agent responses. Normalize each finding to the standard format:

- Finding ID: `FV-RNNN` (R = round number, NNN = sequence starting at 001)
- Severity: P1 / P2 / P3
- Confidence: definite / probable / possible / blind_spot
- Affected files: list of file paths
- Evidence summary: one paragraph max
- Source agent: fully-qualified agent namespace
- Prior-round lineage: if related to an earlier finding

#### Step C: Synthesis and Deduplication

Dispatch `fuelviews-engineering:workflow:synthesis-agent` with all collected findings from this round plus prior round findings.

The synthesis agent applies 3-layer deduplication:

1. **Exact match**: Same file, same line range, same finding type. Merge, keep highest severity.
2. **Semantic overlap**: Different files but same root cause. Merge into single finding, reference all affected files.
3. **Subsumption**: One finding is a strict subset of another. Keep the broader finding, attach the narrower as evidence.

Output: deduplicated finding set with unique IDs, severities, and evidence.

#### Step D: Impact Re-assessment

Dispatch `fuelviews-engineering:workflow:impact-assessment-agent` to evaluate:

- Areas newly touched that were not in the original impact artifact
- Cross-cutting concerns surfaced by review findings
- Dependency chains that extend beyond the original blast radius

Record any impact misses for the final output.

#### Step E: Present Findings and Apply Fixes

Present the synthesized findings to the user grouped by severity:

**P1 -- Critical (blocks merge)**
List all P1 findings with evidence, affected files, and suggested fix.

**P2 -- Important (should fix)**
List all P2 findings with evidence and recommended action.

**P3 -- Minor (optional)**
List P3 findings briefly.

For P1 and P2 findings:
- Ask the user which findings to fix, exclude, or defer (P2 only).
- Apply fixes for accepted P1 and P2 findings. Use the native file-edit tool to make changes.
- For excluded findings, record the exclusion with rationale per the exclusion handling rules in [severity-policy.md](./references/severity-policy.md).
- Only users can exclude P1 findings. Agents may suggest but not execute P1 exclusions.

#### Step F: Plan Drift Detection

If a plan artifact was loaded, compare the current implementation against the plan:

- Check off completed plan tasks that the implementation satisfies.
- Flag tasks that were planned but not implemented (missing scope).
- Flag implemented changes that were not in the plan (scope creep).
- Record plan deltas for the final output.

#### Step G: Evaluate Convergence

Apply convergence guards:

**HAS_CONVERGED** -- Stop (converged):
- This round produced zero new P1 or P2 findings.
- All prior P1 findings have been addressed or excluded.
- Transition to Phase 5 (Output).

**P3-only convergence** -- Stop:
- This round and the previous round both produced only P3 findings (no new P1 or P2).
- `consecutive_p3_only_rounds >= 2` triggers stop.
- Transition to Phase 5 (Output).

**FORCE_STOP** -- Stop (max rounds):
- `round_number >= 4` regardless of findings.
- Transition to Phase 5 (Output) with a note that max rounds were reached.

**CONTEXT_PRESSURE** -- Stop (budget):
- If estimated next-round token cost would exceed 80% of model context window.
- Transition to Phase 5 (Output) with a `truncated` flag.

**Continue** -- Next round:
- New actionable P1 or P2 findings remain.
- Increment `round_number`.
- Apply progressive summarization to prior round findings:
  - Round N-2 and older: compress to finding ID + severity + one-line summary
  - Round N-1: kept at full fidelity
  - Current round: full fidelity
- Proceed to Step A with the next round's focus level.

#### Step H: Update State

```
round_number += 1
Update consecutive_p3_only_rounds (reset to 0 if P1/P2 found, increment if P3 only)
Append new findings to total_findings
Move fixed findings to resolved_findings
Move excluded findings to excluded_findings
```

---

## Phase 5: Output

### Protected Artifacts

Never flag the following paths for deletion, removal, or gitignore:

- `docs/plans/*.md` -- Plan files from `/fv:plan`
- `docs/ai/*.md` -- AI workflow artifacts
- `docs/handoffs/*.md` -- Handoff documents

If any review agent flagged files in these directories, discard that finding during synthesis.

### Final Report Structure

Present the review summary with these sections:

#### Review Summary

- Total rounds completed: N (converged / max rounds / truncated)
- Agents dispatched: list of all agents with namespaces
- Total findings: N (P1: X, P2: Y, P3: Z)

#### Resolved Findings

List each resolved finding with:
- Finding ID and original severity
- Description
- Fix applied (file path and change summary)

#### Excluded Findings

List each excluded finding with:
- Finding ID and original severity
- Reason for exclusion
- Who approved the exclusion

#### Open Findings

List any findings that remain unresolved:
- P1 findings: prominently marked with blocking status
- P2 findings: marked as tracked, include deferral rationale if deferred
- P3 findings: listed for reference

#### Plan Deltas (if plan artifact was loaded)

- Tasks completed by implementation
- Tasks missing from implementation
- Scope added beyond plan

#### Impact Misses

- Areas touched during implementation not covered by the original impact artifact
- New dependency chains discovered during review

### Merge Recommendation

Evaluate merge readiness:

- **If P1 findings remain open**: "P1 findings remain. Do not merge until resolved."
- **If P2 findings are deferred**: "P2 findings deferred with rationale. Merge is permitted but track the deferrals."
- **If clean**: "Review converged. No blocking findings. Safe to merge."

### Suggested Next Steps

Based on review outcome, suggest one of:

- If plan artifact exists and deltas were found: "Run `/fv:plan-sync` to reconcile plan with implementation."
- If impact misses were found: "Run `/fv:impact` to update the blast-radius assessment."
- If clean and ready: "Proceed with merge. Run `/fv:close-task` after merge to finalize."
- If P1 remains: "Resolve the P1 findings listed above, then re-run `/fv:review` for a follow-up pass."

---

## Appendix: Configuration Reference

### fuelviews-engineering.local.md Format

```yaml
---
review_agents:
  mandatory:
    - fuelviews-engineering:review:laravel-reviewer
    - fuelviews-engineering:review:php-reviewer
    - fuelviews-engineering:review:blade-reviewer
  default:
    - fuelviews-engineering:review:laravel-conventions-reviewer
    - fuelviews-engineering:review:laravel-performance-reviewer
    - compound-engineering:review:code-simplicity-reviewer
    - compound-engineering:review:security-sentinel
  disabled:
    - compound-engineering:review:code-simplicity-reviewer  # example: disable a default agent
---

Additional review context here is passed to every agent as supplementary instructions.
```

### Convergence Parameters

| Parameter | Value |
|-----------|-------|
| Max review rounds | 4 |
| Convergence signal | 0 new P1/P2 findings |
| P3-only auto-stop | 2 consecutive P3-only rounds |
| Context pressure threshold | 80% window utilization |
| Max findings per round before compression | 50 |

### Finding ID Format

```
FV-RNNN

FV   = Fuelviews prefix
R    = Round number (1-4)
NNN  = Sequence number within round (001-999)
```

Examples: `FV-1001` (first finding, round 1), `FV-2015` (fifteenth finding, round 2), `FV-4001` (first finding, round 4).
