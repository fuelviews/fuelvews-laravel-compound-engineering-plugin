---
name: fv:plan
description: Create a convergent implementation plan with impact discovery and deepening. Use when starting a new task that needs structured planning with review rounds.
argument-hint: "[task description or --resume <plan-path>]"
---

# Create a Convergent Implementation Plan

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

Create a top-level task for the pipeline and a sub-task for each phase. Update status as phases complete.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

If the feature description above is empty, ask the user: "What would you like to plan? Describe the task, feature, or change."

Do not proceed until a clear task description is provided.

## Resume Detection

If the argument starts with `--resume`, treat this as a pipeline continuation:

1. Extract the plan file path from the argument (e.g., `--resume docs/plans/my-task.plan.md`).
2. Read the plan file and parse its YAML frontmatter.
3. Extract state fields: `pipeline_phase`, `review_rounds_completed`, `convergence_round`, `deepen_count`, `status`.
4. If `status` is `locked`, refuse: "Plan is locked and immutable. Use `/fv:plan --resume <path>` with `--unlock` to request more review, or start a new plan."
5. If `status` is `parked`, set `status: reviewing` and continue from the recorded phase.
6. Hydrate prior-round findings at the compression level indicated by `context_budget.compression_level` in frontmatter. See [Progressive Summarization](#progressive-summarization-between-rounds).
7. Re-evaluate the last gate if `last_gate` is set but the next phase group has not started.
8. Jump to the phase recorded in `pipeline_phase`. If within the loop group (phases 2-6), re-enter at that exact phase.

## Key References

- [convergent-planning-loop.md](./references/convergent-planning-loop.md) -- phase grouping, gates, checkpoint/resume, progressive summarization
- [convergence-rules.md](./references/convergence-rules.md) -- state machine, guards, dedup, budget
- [plan-finalization.md](./references/plan-finalization.md) -- Phase 7-8 details, lock rules, post-pipeline options
- [severity-policy.md](./references/severity-policy.md) -- P1/P2/P3 definitions, escalation, exclusion handling
- [impact-depth-guide.md](./references/impact-depth-guide.md) -- depth levels by round, confidence classification
- [source-of-truth-order.md](./references/source-of-truth-order.md) -- trust hierarchy for conflict resolution

---

# Setup Group (Phases 0-1)

## Phase 0: Task Intake

Update plan frontmatter: `pipeline_phase: 0`.

### 0.1 Normalize Task Statement

Parse the user's request into a single imperative task statement. Strip conversational filler. The statement must answer: "What change is being made and why?"

### 0.2 Generate Task Slug

Convert the task statement into a slug for file naming.

Validation pattern: `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$`

Rules:
- Lowercase alphanumeric and hyphens only.
- Must start and end with an alphanumeric character.
- 2-80 characters.
- Descriptive enough to identify the task from a directory listing.

If the generated slug fails validation, ask the user for a corrected slug.

### 0.3 Load Repo Truth

Load repo truth documents in the order defined by [source-of-truth-order.md](./references/source-of-truth-order.md):

1. Read `CLAUDE.md` / `AGENTS.md` (project conventions).
2. Read `docs/ai/conventions.md` (team coding conventions).
3. Read `docs/ai/architecture.md` (system architecture).
4. Read `docs/ai/repo-map.md` (directory and component map).
5. Read `docs/ai/current-work.md` (active task context).
6. Read `docs/plans/_index.md` (existing plan inventory).

### 0.4 Detect Repo Layer

Check for the presence of the `docs/ai/` structure. Specifically verify these files exist:
- `docs/ai/conventions.md`
- `docs/ai/architecture.md`
- `docs/ai/repo-map.md`

If any are missing, ask the user:
> "The repo layer is incomplete (missing: [list]). Options:
> 1. Auto-scaffold missing files with minimal templates
> 2. Run `/fv:repo-catchup` to populate from codebase analysis
> 3. Continue without repo layer (planning quality may be reduced)"

Wait for the user's choice before proceeding.

### 0.5 Worktree Decision

Ask the user: "Create a git worktree for this task? (Recommended for non-trivial changes.)"

If yes, load the `git-worktree` skill from compound-engineering to create and switch to the worktree. Pass the task slug as the worktree name.

### 0.6 Create Plan File

Create the plan artifact at `docs/plans/<task-slug>.plan.md` using the [plan-artifact template](./templates/plan-artifact.md).

Populate frontmatter:
```yaml
title: <task statement>
status: drafting
canonical: true
task_slug: <slug>
pipeline_phase: 0
review_rounds_completed: 0
convergence_round: 0
deepen_count: 0
max_review_rounds: 4
excluded_findings: []
created_at: <today ISO-8601>
locked_at: null
last_gate: null
gate_failures: []
findings_summary:
  p1: 0
  p2: 0
  p3: 0
  resolved: 0
  excluded: 0
context_budget:
  used_pct: 0
  compression_level: none
```

Fill in the Task and Goal sections from the normalized task statement.

## Phase 1: Initial Impact (Round 0)

Update plan frontmatter: `pipeline_phase: 1`.

### 1.1 Broad Impact Discovery

Dispatch the impact assessment agent at depth `broad`:

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with:
  - Task description (normalized statement from Phase 0)
  - Depth: `broad`
  - Target: enumerate top-level affected artifacts per [impact-depth-guide.md](./references/impact-depth-guide.md) Round 0 targets

### 1.2 Write Initial Impact Artifact

Create the impact artifact at `docs/plans/<task-slug>.impact.md` using the [impact-artifact template](./templates/impact-artifact.md).

Populate:
- `round: 0`
- `depth: broad`
- Confidence summary counts from the agent's output
- Definite edit set, definite read set, watchlist, blind spots

### 1.3 Link Impact to Plan

Add the impact artifact path to the plan's "Impact References" section.

### GATE: setup-complete

Evaluate before entering the loop group:

- [ ] Plan file exists at `docs/plans/<task-slug>.plan.md` with valid YAML frontmatter.
- [ ] Initial impact artifact exists with a non-empty file list (at least one entry in definite edit set or watchlist).
- [ ] Plan status is `drafting`.

If the gate fails:
1. Log the failure reason in plan frontmatter under `gate_failures`.
2. Return to the phase that can resolve the failure (Phase 0 for missing plan, Phase 1 for empty impact).
3. After 2 consecutive failures of the same gate, escalate to the user.

On pass, update frontmatter: `last_gate: setup-complete`.

---

# Convergent Loop Group (Phases 2-6)

The loop implements the state machine defined in [convergence-rules.md](./references/convergence-rules.md):
`INIT -> DISPATCH -> COLLECT -> SYNTHESIZE -> EVALUATE -> (DISPATCH | DEEPEN | REPORT)`

Each iteration through phases 2-6 constitutes one review round. The loop runs until EVALUATE transitions to REPORT.

## Phase 2: Plan Draft / Revision (INIT + Research)

Update plan frontmatter: `pipeline_phase: 2`.

### 2.1 Research (parallel dispatch)

Run these agents in parallel:

- Task `compound-engineering:research:repo-research-analyst` with: task description, impact file list, repo conventions
- Task `compound-engineering:research:learnings-researcher` with: task description, affected file paths

### 2.2 Conditional External Research

Evaluate whether external research is warranted. Trigger if ANY:
- Impact assessment flagged security-sensitive paths (auth, payment, encryption)
- Task involves unfamiliar packages or APIs not represented in the codebase
- User explicitly requests deeper research
- Task touches external service integration points

If triggered, run in parallel:
- Task `compound-engineering:research:best-practices-researcher` with: task description, technology stack
- Task `compound-engineering:research:framework-docs-researcher` with: task description, framework version

### 2.3 Generate or Revise Plan

On first pass (round 0): generate plan v1 by populating the plan artifact sections:
- Architecture Decisions (from research + impact)
- Implementation Steps (ordered, with file references)
- Test Plan (unit, feature, integration scope)
- Risks (from impact blind spots and research findings)
- Acceptance Criteria (derived from task statement + research)

On subsequent passes (round 1+): revise the existing plan by incorporating review findings. Append changes to the "Review Deltas" section under the current round heading. Do not overwrite prior round deltas.

Set plan `status: reviewing` after first draft is complete.

## Phase 3: Plan Review (DISPATCH + COLLECT)

Update plan frontmatter: `pipeline_phase: 3`.

### 3.1 Dispatch Review Panel

Launch the review panel in parallel. The curated subset for planning reviews:

- Task `compound-engineering:review:architecture-strategist` with: plan artifact, impact artifact
- Task `fuelviews-engineering:review:laravel-reviewer` with: plan artifact, affected file paths
- Task `compound-engineering:review:security-sentinel` with: plan artifact, security-sensitive paths
- Task `compound-engineering:review:code-simplicity-reviewer` with: plan artifact, implementation steps

Each agent returns findings in the format: finding ID, severity (P1/P2/P3), confidence, affected files, evidence summary.

### 3.2 Collect and Normalize

Gather all agent responses. Normalize each finding to the standard format per [convergence-rules.md](./references/convergence-rules.md) dedup output:
- Finding ID: `FV-<round><sequence>` (e.g., `FV-1001`)
- Severity: P1 / P2 / P3 per [severity-policy.md](./references/severity-policy.md)
- Confidence: definite / probable / possible / blind_spot
- Affected files (list)
- Evidence summary (one paragraph max)
- Prior-round lineage (if merged from earlier findings)

## Phase 4: Synthesis (SYNTHESIZE)

Update plan frontmatter: `pipeline_phase: 4`.

### 4.1 Dispatch Synthesis

- Task `fuelviews-engineering:workflow:synthesis-agent` with: all collected findings from Phase 3, prior-round compressed findings, plan artifact

The synthesis agent performs 3-layer deduplication (exact, semantic, subsumption) per [convergence-rules.md](./references/convergence-rules.md).

### 4.2 Apply Escalation Rules

Apply automatic escalation rules from [severity-policy.md](./references/severity-policy.md) (P3 -> P2 and P2 -> P1).

### 4.3 Update Plan and Frontmatter

Write synthesis results to the plan artifact under the current round's "Review Deltas" section.

Update frontmatter `findings_summary`:
```yaml
findings_summary:
  p1: <count>
  p2: <count>
  p3: <count>
  resolved: <count>
  excluded: <count>
```

Update `context_budget.used_pct` with estimated context utilization.

## Phase 5: Impact Assessment (per round depth)

Update plan frontmatter: `pipeline_phase: 5`.

### 5.1 Determine Depth

Select depth based on the current round per [impact-depth-guide.md](./references/impact-depth-guide.md):

| Round | Depth Level | Focus |
|-------|-------------|-------|
| 1 | plan-aware | Plan dependency graph, explicit dependencies |
| 2 | deep-wiring | Cross-file interaction, event chains, cache paths |
| 3 | deep-legacy | Error propagation, state lifecycle, legacy code |
| 4 | contract-validation | Final verification of all prior findings |

### 5.2 Run Impact Assessment

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with:
  - Current plan artifact
  - Review findings from Phase 4
  - Prior impact artifact
  - Depth: as determined in 5.1

### 5.3 Update Impact Artifact

Append new round data to the impact artifact. Update:
- Confidence summary counts
- New entries in edit set, read set, watchlist, blind spots
- "What Changed Since Prior Round" section
- Update impact frontmatter: `round`, `depth`, `previous_round`

## Phase 6: Convergence Check (EVALUATE)

Update plan frontmatter: `pipeline_phase: 6`.

### 6.1 Read Synthesis Output

From the Phase 4 synthesis results, extract:
- `new_p1_count`: P1 findings first seen this round
- `new_p2_count`: P2 findings first seen this round
- `new_actionable_count`: `new_p1_count + new_p2_count`
- `total_resolved`: findings resolved across all rounds
- `consecutive_p3_only`: count of consecutive rounds with only P3 (or zero) new findings

### 6.2 Evaluate Guards

Apply guards from [convergence-rules.md](./references/convergence-rules.md) in priority order:

**FORCE_STOP** (highest priority):
- `convergence_round >= 4` (max rounds reached)
- `context_budget.used_pct >= 80` (context pressure)
- User explicitly requested stop
- Agent returned a fatal error

If FORCE_STOP: set `convergence_state: REPORT`, exit loop -> Phase 7. If context pressure triggered, set a `truncated: true` flag in frontmatter.

**HAS_CONVERGED**:
- `new_actionable_count == 0` (no new P1 or P2 findings)
- All prior P1 findings addressed or acknowledged in plan
- No unresolved blind spots flagged as high-risk

If HAS_CONVERGED: set `convergence_state: REPORT`, exit loop -> Phase 7.

**NEEDS_DEEPENING**:
- `deepen_count < 2`
- MANDATORY after round 1: always deepen to stress-test assumptions, compare approaches, explore hidden risks
- OPTIONAL after round 2: only if the last round produced 2+ new findings at `probable` or higher confidence AND at least one finding references a file not yet reviewed at `deep-wiring` depth or greater
- After round 3+: no deepening (rounds 3-4 are already at deep depth)

If NEEDS_DEEPENING: go to [Phase 6.3 Deepen](#63-deepen-conditional).

**CAN_DISPATCH**:
- `convergence_round < 4`
- At least one agent role has unreviewed scope
- Context budget has capacity for another round

If CAN_DISPATCH: increment `convergence_round`, update `review_rounds_completed`, go back to Phase 3.

If none of the above apply (should not happen): escalate to user with current state.

### 6.3 Deepen (conditional)

Execute only when EVALUATE transitions to DEEPEN.

Purpose by round:
- **After round 1 (mandatory):** Stress-test assumptions from the initial review. Compare alternative approaches. Explore risks the broad scan may have missed. Challenge the plan's architecture decisions.
- **After round 2 (optional):** Dive into material new scope discovered in round 2. Trace newly-discovered interaction paths to their endpoints.

Actions:
1. Identify deepen targets: findings with `probable` or higher confidence that reference files not yet reviewed at the next depth level.
2. Run targeted research on deepen targets using `compound-engineering:research:repo-research-analyst`.
3. Update the plan with deepened sections: expanded risk analysis, alternative approaches evaluated, hidden dependencies surfaced.
4. Increment `deepen_count` in frontmatter.
5. Return to Phase 3 (DISPATCH) for the next review round.

### 6.4 Checkpoint

At every exit from Phase 6, update frontmatter:
```yaml
pipeline_phase: <next phase>
review_rounds_completed: <count>
convergence_round: <count>
deepen_count: <count>
context_budget:
  used_pct: <estimated>
  compression_level: <level>
```

### GATE: loop-exit

Evaluate before entering the finalize group:

- [ ] Convergence state is REPORT (via HAS_CONVERGED, FORCE_STOP, or CONTEXT_PRESSURE).
- [ ] All P1 findings are addressed or acknowledged in the plan.
- [ ] Round counter and deepen counter recorded in frontmatter.

If the gate fails:
1. Log the failure in `gate_failures`.
2. If unaddressed P1s remain, return to Phase 3 for a forced review round.
3. After 2 consecutive failures, escalate to the user.

On pass, update frontmatter: `last_gate: loop-exit`.

---

# Finalize Group (Phases 7-8)

## Phase 7: Final Impact (Contract Validation)

Update plan frontmatter: `pipeline_phase: 7`.

Full details in [plan-finalization.md](./references/plan-finalization.md).

### 7.1 Re-verify P1 Findings

For each P1 finding:
- Confirm it is resolved (plan includes a fix) OR acknowledged (exclusion recorded with rationale per [severity-policy.md](./references/severity-policy.md)).
- If neither: block finalization. Return to Phase 3 with a forced round 4.

### 7.2 Re-verify P2 Findings

For each P2 finding:
- Confirm it is resolved, acknowledged, or explicitly deferred.
- Deferred P2s require a rationale and must appear in the watchlist.

### 7.3 Contract Validation

Run the impact assessment agent at depth `contract-validation`:

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with:
  - Final plan artifact
  - All findings (at compressed level per budget)
  - Depth: `contract-validation`

Verify all contract types per [plan-finalization.md](./references/plan-finalization.md): interface, route, policy, migration, and event contracts.

### 7.4 Validate Test Coverage Intent

- Every P1 fix references which test file will cover it.
- Every new public method has a test intent note (the test need not exist yet).

### 7.5 Update Findings

Mark re-verified findings as `confirmed` or `stale`. Move stale findings to `stale_findings` in frontmatter.

### GATE: lock-ready

Evaluate before Phase 8:

- [ ] Zero unresolved P1 findings.
- [ ] All P2 findings resolved, acknowledged, or deferred with rationale.
- [ ] Contract validation complete with no new P1 issues.
- [ ] Test coverage intent documented for all P1 fixes.

If new P1 issues are discovered during contract validation, return to Phase 2 (loop re-entry) with the round counter continuing from where it left off.

On pass, update frontmatter: `last_gate: lock-ready`.

## Phase 8: Plan Lock

Update plan frontmatter: `pipeline_phase: 8`.

Full details in [plan-finalization.md](./references/plan-finalization.md).

### 8.1 Lock the Plan

Set frontmatter:
```yaml
status: locked
locked_at: <current ISO-8601 timestamp>
```

### 8.2 Write Final Watchlist and Blind Spots

Collect watchlist and blind spots per [plan-finalization.md](./references/plan-finalization.md). The watchlist includes unresolved blind spots, deferred P2 findings, surveillance items, and external dependency risks. The blind spots section lists each blind-spot-confidence finding with ID, source files, why static analysis could not resolve it, and recommended verification approach.

### 8.3 Update Plan Index

Update `docs/plans/_index.md` using the [plan-index template](./templates/plan-index.md). Add or update the row for this plan with status `locked`, lock date, findings counts, and round count.

### 8.4 Update Current Work

Update `docs/ai/current-work.md` using the [current-work template](./templates/current-work.md). Set plan reference to the locked plan path, status to `ready-for-implementation`, and include watchlist count.

### 8.5 Verify Artifact Integrity

Run final integrity checks per [plan-finalization.md](./references/plan-finalization.md): valid frontmatter, finding ID consistency, summary count accuracy, lock state.

### 8.6 Output Summary

Report to the user:
- Locked plan path: `docs/plans/<task-slug>.plan.md`
- Final impact path: `docs/plans/<task-slug>.impact.md`
- Task slug: `<task-slug>`
- Rounds completed: `<count>`
- Findings summary: P1/P2/P3 counts
- Watchlist items: `<count>`
- Blind spots: `<count>`

Suggest next step: "Plan is locked. Run `/fv:work` to begin implementation."

---

# Checkpoint and Resume Protocol

At every phase boundary, update plan frontmatter with current state:

```yaml
pipeline_phase: <current>
review_rounds_completed: <count>
convergence_round: <count>
deepen_count: <count>
context_budget:
  used_pct: <estimated percentage>
  compression_level: <none | compressed | ultra-compressed | minimal>
```

### Context Pressure Checkpoint

If `context_budget.used_pct > 80%` at any phase boundary:

1. Perform emergency summarization of all prior-round findings.
2. Write full findings to the plan artifact on disk (preserving fidelity).
3. Update frontmatter with current state.
4. Set `status: parked`.
5. Instruct the user: "Context budget exceeded 80%. State has been checkpointed. Re-invoke with `--resume docs/plans/<task-slug>.plan.md` to continue."

### User Interruption

If the user interrupts mid-pipeline:
1. Save current state to frontmatter immediately.
2. Set `status: parked`.
3. Report the checkpoint phase and how to resume.

---

# Progressive Summarization Between Rounds

Context budget dictates how much prior-round data is carried forward. See [convergent-planning-loop.md](./references/convergent-planning-loop.md) for full details.

Apply the compression matrix from [convergent-planning-loop.md](./references/convergent-planning-loop.md): full -> compressed -> ultra-compressed -> minimal as rounds advance. Current round always gets full fidelity.

At end of each round (after Phase 4 synthesis):

1. Write full findings to the plan artifact on disk. Append, never overwrite prior rounds.
2. Generate the compressed version for next-round context loading.
3. Update `context_budget.compression_level` in frontmatter.
4. If compressed output still exceeds budget, escalate compression one level.

---

# Loop Invariants

These must hold true at every phase boundary within the convergent loop:

1. `pipeline_phase` in frontmatter matches actual execution phase.
2. `convergence_round` never decreases.
3. `deepen_count` never exceeds 2.
4. Every finding has a unique ID (format `FV-RNNN`) that persists across rounds.
5. No finding is deleted -- only resolved, excluded, or subsumed.
6. Context budget `used_pct` never exceeds 80% entering a new phase (CONTEXT_PRESSURE fires before that).

---

# Error Recovery

| Failure Mode | Recovery Action |
|---|---|
| Agent timeout during COLLECT | Retry once, then mark agent scope as skipped |
| Frontmatter parse error | Attempt YAML repair, escalate if ambiguous |
| Context budget exceeded mid-phase | Emergency summarize, continue phase |
| Conflicting findings (same ID, different severity) | Keep higher severity, log conflict |
| User interrupts mid-loop | Save state to frontmatter, set status=parked |
| Gate fails 2x consecutively | Escalate to user with failure details |
