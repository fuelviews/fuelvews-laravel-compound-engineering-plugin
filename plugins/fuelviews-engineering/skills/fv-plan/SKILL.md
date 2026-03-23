---
name: fv:plan
description: Create a convergent implementation plan with impact discovery, Laravel-focused review, and deepening. Use when starting a new task that needs structured planning.
argument-hint: "[feature description, bug report, or improvement idea] [--resume <plan-path>] [--auto]"
---

# Create a Convergent Implementation Plan

## Introduction

**Note: The current year is 2026.** Use this when dating plans and searching for recent documentation.

Transform feature descriptions, bug reports, or improvement ideas into well-structured markdown plan files that follow project conventions and best practices. This skill extends CE's planning workflow with a convergent review loop, impact discovery, and Laravel-focused quality review. Plans are iteratively refined through review rounds until findings converge (zero new P1/P2 issues) or a maximum round count is reached.

## Key References

- [convergent-planning-loop.md](./references/convergent-planning-loop.md) -- phase grouping, gates, checkpoint/resume, progressive summarization
- [convergence-rules.md](./references/convergence-rules.md) -- state machine, guards, dedup, budget
- [plan-finalization.md](./references/plan-finalization.md) -- Phase 7-8 details, lock rules, post-pipeline options
- [severity-policy.md](./references/severity-policy.md) -- P1/P2/P3 definitions, escalation, exclusion handling
- [impact-depth-guide.md](./references/impact-depth-guide.md) -- depth levels by round, confidence classification
- [source-of-truth-order.md](./references/source-of-truth-order.md) -- trust hierarchy for conflict resolution

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

**If the feature description above is empty, ask the user:** "What would you like to plan? Please describe the feature, bug fix, or improvement you have in mind."

Do not proceed until you have a clear feature description from the user.

## Execution Mode

Parse flags from the arguments:

- **`--auto`**: Autonomous mode. Skip all user interaction gates. Auto-accept findings, auto-continue through rounds, auto-lock when converged.
- **`--resume <plan-path>`**: Pipeline continuation. See [Resume Detection](#resume-detection).
- **Default (no flag)**: Collaborative mode. Present findings and ask for user input at every gate.

Set `$AUTO_MODE` based on whether `--auto` is present in the arguments.

## Resume Detection

If the argument starts with `--resume`, treat this as a pipeline continuation:

1. Extract the plan file path from the argument.
2. Read the plan file and parse its YAML frontmatter.
3. Extract state fields: `pipeline_phase`, `review_rounds_completed`, `convergence_round`, `deepen_count`, `status`.
4. If `status` is `locked`, refuse: "Plan is locked and immutable. Start a new plan or use `--unlock`."
5. If `status` is `parked`, set `status: reviewing` and continue from the recorded phase.
6. Hydrate prior-round findings at the compression level indicated by `context_budget.compression_level`.
7. Re-evaluate the last gate if `last_gate` is set but the next phase group has not started.
8. Jump to the phase recorded in `pipeline_phase`. If within the loop group (phases 2-6), re-enter at that exact phase.

---

# Setup Group (Phases 0-1)

## Phase 0: Task Intake

Update plan frontmatter: `pipeline_phase: 0`.

### 0.1 Idea Refinement

<thinking>
Check for existing requirements docs first. If found, use as foundation. Otherwise, refine through dialogue.
</thinking>

**Check for requirements document first:**

Look for recent requirements documents in `docs/brainstorms/` matching this feature. Use the native file-search/glob tool (e.g., Glob in Claude Code) to find files matching `docs/brainstorms/*-requirements.md`.

**Relevance criteria:** Topic matches the feature description, created within 14 days, prefer most recent.

**If a relevant requirements document exists:**
1. Read the source document thoroughly -- every section matters
2. Announce: "Found source document from [date]: [topic]. Using as foundation for planning."
3. Extract and carry forward ALL key decisions, rationale, constraints, requirements, open questions, success criteria, and dependencies
4. Skip the refinement questions -- the source document already answered WHAT to build
5. Reference specific decisions with `(see origin: <source-path>)` throughout the plan
6. Do not omit source content -- scan each section before finalizing to verify nothing was dropped
7. If `Resolve Before Planning` contains items, stop and direct the user to resume `/ce:brainstorm`

**If multiple source documents could match:**
Use **AskUserQuestion** to ask which to use.

**If no requirements document found, refine through dialogue:**

Refine the idea using **AskUserQuestion**:
- Ask questions one at a time to understand the idea fully
- Prefer multiple choice when natural options exist
- Focus on: purpose, constraints, success criteria
- Continue until the idea is clear OR user says "proceed"

**Gather signals for research decision during refinement:**
- **User's familiarity**: Do they know the codebase patterns?
- **User's intent**: Speed vs thoroughness?
- **Topic risk**: Security, payments, external APIs, data migrations, auth/policies, Eloquent relationships, queue jobs, Livewire state are high-risk
- **Uncertainty level**: Is the approach clear or open-ended?

**Even if the description seems detailed, ask at least one clarifying question.** Suggested:
- "Priority: speed or thoroughness?"
- "Any problematic areas you already know about?"
- "One PR or incremental PRs?"
- "Any constraints (deadline, deploy freeze, related work)?"

After at least one question, offer: "I have a clear picture. Ready to proceed with research?"

**Skip option:** If the feature description is already detailed and accompanied by a source document, offer:
"Your description is clear. Should I proceed with research, or would you like to refine it further?"

### 0.2 Normalize Task Statement

Parse the refined request into a single imperative task statement answering: "What change is being made and why?"

### 0.3 Generate Task Slug

Convert to slug. Validation: `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$`. Lowercase alphanumeric and hyphens, 2-80 chars, descriptive.

### 0.4 Load Repo Truth

Load repo truth in order per [source-of-truth-order.md](./references/source-of-truth-order.md):
1. `CLAUDE.md` / `AGENTS.md`
2. `docs/ai/conventions.md`
3. `docs/ai/architecture.md`
4. `docs/ai/repo-map.md`
5. `docs/ai/current-work.md`
6. `docs/plans/_index.md`

### 0.5 Detect Repo Layer

Verify `docs/ai/conventions.md`, `docs/ai/architecture.md`, `docs/ai/repo-map.md` exist. If any missing, ask the user:
> "Repo layer incomplete (missing: [list]). Options:
> 1. Auto-scaffold missing files
> 2. Run `/fv:repo-catchup`
> 3. Continue without (reduced quality)"

### 0.6 Worktree Decision

Ask: "Create a git worktree for this task? (Recommended for non-trivial changes.)"

If yes, load the `git-worktree` skill from compound-engineering. Pass task slug as worktree name.

### 0.7 Create Plan File

<thinking>
The frontmatter tracks convergent loop state so resume works correctly.
</thinking>

Create the plan at `docs/plans/<date>-<type>-<task-slug>-plan.md`. Determine daily sequence number by scanning `docs/plans/` for today's date pattern, incrementing to 3-digit zero-padded (001, 002, etc.).

Populate frontmatter:

```yaml
---
title: <task statement>
type: [feat|fix|refactor]
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
origin: docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md  # omit if none
findings_summary:
  p1: 0
  p2: 0
  p3: 0
  resolved: 0
  excluded: 0
context_budget:
  used_pct: 0
  compression_level: none
---
```

Fill in Task and Goal sections from the normalized task statement.

## Phase 1: Local Research + Initial Impact

Update plan frontmatter: `pipeline_phase: 1`.

### 1.1 Local Research (parallel dispatch)

<thinking>
Understand the project's conventions, existing patterns, and documented learnings. This is fast and local -- it informs whether external research is needed.
</thinking>

Run these agents **in parallel**:

- Task `compound-engineering:research:repo-research-analyst` with: technology, architecture, patterns, {feature_description}
- Task `compound-engineering:research:learnings-researcher` with: feature_description

**What to look for:**
- **Repo research:** technology stack/versions, architectural patterns, implementation patterns
- **Learnings:** documented solutions in `docs/solutions/` (gotchas, patterns, lessons learned)

### 1.1b Boost Documentation Research (if available)

If Boost MCP tools are available (check `composer.json` for `laravel-boost`), use `mcp__laravel-boost__search-docs` to query Laravel, Filament, Livewire, Pest, and Tailwind documentation for relevant patterns.

### 1.1c Documentation Verification via context7 (if available)

Use the context7 MCP tool (`resolve-library-id` then `query-docs`) to fetch current documentation for frameworks/libraries the task touches. This ensures the plan references current APIs, not deprecated patterns.

### 1.2 Research Decision

Based on signals from Phase 0.1 and findings from Phase 1.1:

**High-risk -- always research:** Security, payments, external APIs, data privacy, auth/policies, Eloquent relationship changes, queue/job changes, Livewire state, middleware ordering, service provider boot sequences.

**Strong local context -- skip:** Codebase has good patterns, AGENTS.md has guidance, Boost/context7 already provided relevant docs.

**Uncertainty -- research:** User is exploring, codebase has no examples, new technology.

Announce the decision. User can redirect if needed.

### 1.3 External Research (conditional)

Only run if Phase 1.2 indicates value. Run in parallel:
- Task `compound-engineering:research:best-practices-researcher` with: feature_description
- Task `compound-engineering:research:framework-docs-researcher` with: feature_description

### 1.4 Consolidate Research

Consolidate all findings: relevant file paths (e.g., `app/Services/UserService.php:42`), institutional learnings from `docs/solutions/`, Boost/context7 results, external docs/URLs, related issues/PRs, AGENTS.md conventions.

**Optional validation:** Briefly summarize findings and ask if anything looks off or missing.

### 1.5 Broad Impact Discovery

<thinking>
Before planning, understand the blast radius. Broad impact scan identifies affected files, components, and tests.
</thinking>

Dispatch the impact assessment agent at depth `broad`:

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with:
  - Task description (normalized statement)
  - Depth: `broad`
  - Target: top-level affected artifacts per [impact-depth-guide.md](./references/impact-depth-guide.md) Round 0
  - GitNexus: if `.gitnexus/` exists, pass `gitnexus_available: true` for graph-powered tracing

### 1.6 Write Initial Impact Artifact

Create `docs/impact/<task-slug>.md` with frontmatter (`title`, `task_slug`, `round: 0`, `depth: broad`, `previous_round: null`) and sections: Confidence Summary, Definite Edit Set, Definite Read Set, Watchlist, Blind Spots, Evidence Notes, Tests Impacted, Risks, What Changed Since Prior Round.

### 1.7 Present Impact to User

**GATE: User must see initial impact before planning begins.**

Present the impact summary:

```
=== Initial Impact Assessment (Broad) ===

Confidence Summary:
  Definite:   <count> files
  Probable:   <count> files
  Possible:   <count> files
  Blind spots: <count>

Key files that WILL need changes:
  - <file> -- <reason>
  - <file> -- <reason>

Watchlist (may need changes):
  - <file> -- <condition>

Blind spots (cannot trace automatically):
  - <description>

Does this scope look right?

1. Yes -- proceed to planning with this scope
2. The scope is missing something (I'll describe what)
3. The scope is too broad -- narrow it down
4. Run a deeper impact assessment before planning
```

Wait for the user's response. Adjust scope as directed.

### 1.8 Link Impact to Plan

Add the impact artifact path to the plan's "Impact References" section.

### GATE: setup-complete

- [ ] Plan file exists with valid YAML frontmatter
- [ ] Impact artifact exists with non-empty file list
- [ ] Plan status is `drafting`

**User interaction rule:** Every GATE in the convergent loop MUST use the platform's blocking question tool. Never auto-select or skip a user gate.

On fail: log in `gate_failures`, return to resolving phase, escalate after 2 consecutive failures.
On pass: `last_gate: setup-complete`.

---

# Convergent Loop Group (Phases 2-6)

The loop implements the state machine in [convergence-rules.md](./references/convergence-rules.md):
`INIT -> DISPATCH -> COLLECT -> SYNTHESIZE -> EVALUATE -> (DISPATCH | DEEPEN | REPORT)`

Each iteration = one review round. Loop runs until EVALUATE transitions to REPORT.

## Phase 2: Plan Draft / Revision (INIT + Research)

Update plan frontmatter: `pipeline_phase: 2`.

### 2.1 SpecFlow Analysis

- Task `compound-engineering:workflow:spec-flow-analyzer` with: feature_description, research_findings

Incorporate identified gaps or edge cases.

### 2.2 Choose Implementation Detail Level

Select detail level based on complexity. All templates share the same frontmatter schema and end with `## Review Deltas` (populated by the convergent loop).

**Shared frontmatter for all detail levels:**

```yaml
---
title: [Issue Title]
type: [feat|fix|refactor]
status: drafting
canonical: true
task_slug: <slug>
pipeline_phase: 2
review_rounds_completed: 0
convergence_round: 0
deepen_count: 0
max_review_rounds: 4
date: YYYY-MM-DD
origin: <brainstorm path or omit>
excluded_findings: []
findings_summary:
  p1: 0
  p2: 0
  p3: 0
  resolved: 0
  excluded: 0
context_budget:
  used_pct: 0
  compression_level: none
---
```

#### MINIMAL (Quick Issue)

**Best for:** Simple bugs, small improvements, clear features

**Body sections:**

```markdown
# [Issue Title]

[Brief problem/feature description]

## Acceptance Criteria

- [ ] Core requirement 1
- [ ] Core requirement 2

## Context

[Any critical information]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources

- **Origin document:** [path](path) -- if from brainstorm, otherwise omit
- Related issue: #[issue_number]

## Review Deltas

<!-- Populated by convergent review loop -->
```

#### MORE (Standard Issue)

**Best for:** Most features, complex bugs, team collaboration

**Body sections (adds to MINIMAL):**

```markdown
# [Issue Title]

## Overview

[Comprehensive description]

## Problem Statement / Motivation

[Why this matters]

## Proposed Solution

[High-level approach]

## Technical Considerations

- Architecture impacts
- Performance implications
- Security considerations

## System-Wide Impact

- **Interaction graph**: [What callbacks/middleware/observers fire?]
- **Error propagation**: [How do errors flow across layers?]
- **State lifecycle risks**: [Can partial failure leave inconsistent state?]
- **API surface parity**: [Other interfaces needing the same change?]
- **Integration test scenarios**: [Cross-layer scenarios unit tests miss]

## Acceptance Criteria

- [ ] Detailed requirement 1
- [ ] Testing requirements

## Success Metrics

[How we measure success]

## Dependencies & Risks

[What could block or complicate this]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources & References

- **Origin document:** [path](path) -- if from brainstorm
- Similar implementations: [file_path:line_number]
- Best practices: [documentation_url]

## Review Deltas

<!-- Populated by convergent review loop -->
```

#### A LOT (Comprehensive Issue)

**Best for:** Major features, architectural changes, complex integrations

**Body sections (adds to MORE):**

```markdown
# [Issue Title]

## Overview

[Executive summary]

## Problem Statement

[Detailed problem analysis]

## Proposed Solution

[Comprehensive solution design]

## Technical Approach

### Architecture
[Detailed technical design]

### Implementation Phases

#### Phase 1: [Foundation]
- Tasks, success criteria, estimated effort

#### Phase 2: [Core Implementation]
- Tasks, success criteria, estimated effort

#### Phase 3: [Polish & Optimization]
- Tasks, success criteria, estimated effort

## Alternative Approaches Considered

[Other solutions evaluated and why rejected]

## System-Wide Impact

### Interaction Graph
[Chain reaction map: callbacks, middleware, observers, event handlers. Trace 2+ levels deep.]

### Error & Failure Propagation
[Trace errors from lowest layer up. Exception classes, retry conflicts, silent failures.]

### State Lifecycle Risks
[Partial failure scenarios: orphaned rows, stale caches, duplicate records.]

### API Surface Parity
[All interfaces exposing equivalent functionality. Which need updating.]

### Integration Test Scenarios
[3-5 cross-layer scenarios unit tests with mocks would miss.]

## Acceptance Criteria

### Functional Requirements
- [ ] Detailed functional criteria

### Non-Functional Requirements
- [ ] Performance targets
- [ ] Security requirements

### Quality Gates
- [ ] Test coverage requirements
- [ ] Code review approval

## Success Metrics

[Detailed KPIs and measurement methods]

## Dependencies & Prerequisites

[Detailed dependency analysis]

## Risk Analysis & Mitigation

[Comprehensive risk assessment]

## Future Considerations

[Extensibility and long-term vision]

## Documentation Plan

[What docs need updating]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources & References

### Origin
- **Origin document:** [path](path) -- key decisions carried forward: [list]

### Internal References
- Architecture decisions: [file_path:line_number]
- Similar features: [file_path:line_number]

### External References
- Framework documentation: [url]
- Best practices guide: [url]

### Related Work
- Previous PRs: #[pr_numbers]
- Related issues: #[issue_numbers]

## Review Deltas

<!-- Populated by convergent review loop -->
```

For code examples, use PHP with Laravel conventions (e.g., `app/Services/ExampleService.php`).

### 2.3 Generate or Revise Plan

<thinking>
On first pass, generate from scratch. On revision, incorporate review findings without overwriting prior deltas.
</thinking>

**Round 0 (first pass):** Populate architecture decisions, implementation steps (with file references from impact edit set), test plan, risks (from blind spots + research), acceptance criteria.

**Round 1+ (revision):** Incorporate review findings. Append to "Review Deltas" under current round heading. Never overwrite prior round deltas.

**Formatting rules:**
- Clear heading hierarchy (##, ###)
- Code examples with syntax highlighting
- Task lists (- [ ]) for trackable items
- Collapsible `<details>` for lengthy content
- File names in code examples and todo lists
- ERD mermaid diagrams for model changes

**Origin cross-check (if from requirements doc):** Verify every key decision is reflected, approach matches, constraints captured, open questions flagged, `origin:` frontmatter correct, Sources section includes origin.

Set plan `status: reviewing` after first draft.

### 2.4 Write Plan File

**REQUIRED:** Write the plan to disk before presenting options. Use the Write tool to save to `docs/plans/YYYY-MM-DD-NNN-<type>-<descriptive-name>-plan.md`. Confirm the path.

**Pipeline mode:** If invoked from an automated workflow (LFG, SLFG, or any `disable-model-invocation` context), skip all AskUserQuestion calls and proceed automatically.

### 2.5 Present Plan to User

**GATE: User must review the plan before entering the review loop.**

Present a summary of the generated/revised plan:

```
=== Plan Draft (Round <N>) ===

Task: <task title>
Slug: <task-slug>

Architecture Decisions: <count>
Implementation Steps: <count>
Tests Planned: <count>
Risks Identified: <count>
Impact: <definite edit count> files definite, <probable count> probable

Key decisions:
  - <decision 1>
  - <decision 2>

Implementation approach:
  <brief summary>

What would you like to do?

1. Looks good -- proceed to review
2. I have changes (describe what to adjust)
3. Start over with a different approach
```

Wait for the user's response.

- If "Proceed": continue to Phase 3 (review).
- If "Changes": apply feedback, update plan, re-present.
- If "Start over": discard draft, return to Phase 2.3 with new direction.

## Phase 3: Plan Review (DISPATCH + COLLECT)

Update plan frontmatter: `pipeline_phase: 3`.

### 3.0 Framework Version Resolution

Determine framework versions via Boost `mcp__laravel-boost__application-info` or by parsing `composer.json`/`package.json`. Construct version context string: "Review context: Laravel X.Y, PHP X.Y, Filament X.Y, Livewire X.Y, Tailwind X.Y" (only present frameworks). Pass to every review agent.

### 3.1 Dispatch Review Panel

<thinking>
The review panel combines CE's architecture and security reviewers with fv's Laravel-specific reviewer. Broad coverage, focused enough to converge quickly.
</thinking>

Launch in parallel:

- Task `fuelviews-engineering:review:laravel-reviewer` with: plan artifact, affected files, version context
- Task `compound-engineering:review:architecture-strategist` with: plan artifact, impact artifact, version context
- Task `compound-engineering:review:security-sentinel` with: plan artifact, security-sensitive paths, version context
- Task `compound-engineering:review:code-simplicity-reviewer` with: plan artifact, implementation steps, version context

Each agent returns: finding ID, severity (P1/P2/P3), confidence, affected files, evidence summary.

### 3.2 Collect and Normalize

Normalize each finding per [convergence-rules.md](./references/convergence-rules.md):
- Finding ID: `FV-<round><sequence>` (e.g., `FV-1001`)
- Severity: P1 / P2 / P3 per [severity-policy.md](./references/severity-policy.md)
- Confidence: definite / probable / possible / blind_spot
- Affected files, evidence summary (one paragraph max), prior-round lineage

## Phase 4: Synthesis (SYNTHESIZE)

Update plan frontmatter: `pipeline_phase: 4`.

### 4.1 Dispatch Synthesis

- Task `fuelviews-engineering:workflow:synthesis-agent` with: all Phase 3 findings, prior-round compressed findings, plan artifact

3-layer dedup (exact, semantic, subsumption) per [convergence-rules.md](./references/convergence-rules.md).

### 4.2 Apply Escalation Rules

Apply escalation from [severity-policy.md](./references/severity-policy.md) (P3 -> P2, P2 -> P1).

### 4.3 Update Plan and Frontmatter

Write synthesis results to "Review Deltas" section. Update `findings_summary` and `context_budget.used_pct`.

### 4.4 Present Findings to User

**GATE: User must review findings before the loop continues.**

Present the synthesis summary:

```
=== Plan Review Round <N> Findings ===

P1 (blocking): <count>
  - <finding summary>
P2 (should address): <count>
  - <finding summary>
P3 (minor): <count>

What would you like to do?

1. Accept all findings and continue to next round
2. Exclude specific findings (I'll ask which ones)
3. Stop review here and lock the plan as-is
4. Adjust the plan based on these findings before continuing
```

Wait for the user's response before proceeding.

- If "Accept all": incorporate findings, continue to Phase 5.
- If "Exclude": ask which, record in `excluded_findings` with rationale, continue.
- If "Stop": jump to Phase 7. Warn if unresolved P1s exist.
- If "Adjust": let user describe changes, update plan, continue to Phase 5.

Only users can exclude P1 findings. P2/P3 exclusions require user confirmation.

## Phase 5: Impact Assessment (per round depth)

Update plan frontmatter: `pipeline_phase: 5`.

### 5.1 Determine Depth

| Round | Depth Level | Focus |
|-------|-------------|-------|
| 1 | plan-aware | Plan dependency graph, explicit dependencies |
| 2 | deep-wiring | Cross-file interaction, event chains, cache paths |
| 3 | deep-legacy | Error propagation, state lifecycle, legacy code |
| 4 | contract-validation | Final verification of all prior findings |

### 5.2 Run Impact Assessment

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with: plan, review findings, prior impact, depth per 5.1, GitNexus (if available; use `detect_changes` at deep-wiring+)

### 5.3 Update Impact Artifact

Append new round data: confidence counts, new entries in edit/read/watchlist/blind spots, "What Changed" section, update frontmatter `round`/`depth`/`previous_round`.

### 5.4 Present Impact Delta to User

If the impact assessment discovered new scope (new files, blind spots, or confidence changes), present the delta:

```
=== Impact Update (Round <N>, depth: <depth>) ===

Changes since last round:
  New definite files: <count>
  New probable files: <count>
  New blind spots: <count>
  Resolved blind spots: <count>

New discoveries:
  - <file/component> -- <reason>

Does the expanding scope look correct?

1. Continue -- scope is tracking correctly
2. Some of these are out of scope (I'll specify which)
3. This is getting too broad -- let's narrow and lock
```

If no new scope was discovered (counts unchanged), skip this gate and proceed silently.

## Phase 6: Convergence Check (EVALUATE)

Update plan frontmatter: `pipeline_phase: 6`.

### 6.1 Read Synthesis Output

Extract: `new_p1_count`, `new_p2_count`, `new_actionable_count`, `total_resolved`, `consecutive_p3_only`.

### 6.2 Evaluate Guards

Apply in priority order per [convergence-rules.md](./references/convergence-rules.md):

**FORCE_STOP** (highest priority):
- `convergence_round >= 4` (max rounds reached)
- `context_budget.used_pct >= 80` (context pressure)
- User explicitly requested stop
- Agent returned a fatal error

If FORCE_STOP: set `convergence_state: REPORT`, exit loop -> Phase 7. If context pressure triggered, set `truncated: true`.

**HAS_CONVERGED**:
- `new_actionable_count == 0` (no new P1 or P2 findings)
- All prior P1 findings addressed or acknowledged
- No unresolved blind spots flagged as high-risk

If HAS_CONVERGED: exit loop -> Phase 7.

**NEEDS_DEEPENING**:
- `deepen_count < 2`
- MANDATORY after round 1: always deepen to stress-test assumptions
- OPTIONAL after round 2: only if 2+ new probable+ findings referencing unreviewed files
- After round 3+: no deepening (already at deep depth)

If NEEDS_DEEPENING: go to Phase 6.3.

**CAN_DISPATCH**:
- `convergence_round < 4`, unreviewed scope exists, budget available

If CAN_DISPATCH: increment `convergence_round`, go to Phase 3.

### 6.3 Deepen (conditional)

**After round 1 (mandatory):** Stress-test assumptions, compare alternatives, explore hidden risks, challenge architecture decisions.
**After round 2 (optional):** Trace newly-discovered interaction paths to endpoints.

Actions:
1. Identify deepen targets (probable+ confidence, unreviewed at next depth)
2. Run `compound-engineering:research:repo-research-analyst` on targets
3. Update plan: expanded risk analysis, alternatives evaluated, hidden dependencies surfaced
4. Increment `deepen_count`

**GATE: Present deepen results.**

```
=== Deepen Pass <deepen_count> Results ===

New risks discovered: <count>
Alternative approaches evaluated: <count>
Hidden dependencies surfaced: <count>

Key findings:
  - <finding summary>
  - <finding summary>

What would you like to do?

1. Continue to next review round with deepened plan
2. Adjust the plan based on these findings first
3. Stop deepening and lock the plan as-is
```

Wait for the user's response.

- If "Continue": return to Phase 3 for next review round.
- If "Adjust": let user describe changes, update plan, return to Phase 3.
- If "Stop": jump to Phase 7. Warn if unresolved P1s exist.

### 6.4 Checkpoint

Update frontmatter: `pipeline_phase`, `review_rounds_completed`, `convergence_round`, `deepen_count`, `context_budget`.

### GATE: loop-exit

- [ ] Convergence state is REPORT
- [ ] All P1 findings addressed or acknowledged
- [ ] Counters recorded in frontmatter

On fail: log, force review round for unaddressed P1s, escalate after 2 failures.
On pass: `last_gate: loop-exit`.

---

# Finalize Group (Phases 7-8)

## Phase 7: Final Impact (Contract Validation)

Update plan frontmatter: `pipeline_phase: 7`. Full details in [plan-finalization.md](./references/plan-finalization.md).

### 7.1 Re-verify P1 Findings

Each P1 must be resolved or acknowledged with exclusion rationale per [severity-policy.md](./references/severity-policy.md). If not: block, return to Phase 3 forced round.

### 7.2 Re-verify P2 Findings

Each P2 must be resolved, acknowledged, or deferred with rationale (deferred P2s go to watchlist).

### 7.3 Contract Validation

- Task `fuelviews-engineering:workflow:impact-assessment-agent` at depth `contract-validation` with: final plan, all findings, GitNexus (`impact` on every symbol, `cypher` for custom queries if available)

Verify: interface, route, policy, migration, and event contracts per [plan-finalization.md](./references/plan-finalization.md).

### 7.4 Validate Test Coverage Intent

Every P1 fix references its covering test file. Every new public method has a test intent note.

### 7.5 Update Findings

Mark as `confirmed` or `stale`. Move stale to `stale_findings` in frontmatter.

### GATE: lock-ready

- [ ] Zero unresolved P1
- [ ] All P2 resolved/acknowledged/deferred
- [ ] Contract validation complete, no new P1
- [ ] Test coverage intent documented

New P1 from contract validation: return to Phase 2 (loop re-entry). On pass: `last_gate: lock-ready`.

## Phase 8: Plan Lock

Update plan frontmatter: `pipeline_phase: 8`. Full details in [plan-finalization.md](./references/plan-finalization.md).

### 8.1 Lock

Set `status: locked`, `locked_at: <ISO-8601>`.

### 8.2 Watchlist and Blind Spots

Collect per [plan-finalization.md](./references/plan-finalization.md): unresolved blind spots, deferred P2s, surveillance items, external dependency risks. Blind spots include ID, source files, why unresolvable, verification approach.

### 8.3 Update Plan Index

Update `docs/plans/_index.md` row: title, file, status `locked`, lock date, findings counts, round count.

### 8.4 Update Current Work

Update `docs/ai/current-work.md`: active task, progress checkboxes, files table, plan reference, status `ready-for-implementation`, watchlist count.

### 8.5 Verify Artifact Integrity

Check: valid frontmatter, finding ID consistency, summary count accuracy, lock state.

### 8.6 Output Summary

Report to the user:
- Locked plan path: `docs/plans/<date>-<type>-<task-slug>-plan.md`
- Final impact path: `docs/impact/<task-slug>.md`
- Task slug: `<task-slug>`
- Rounds completed: `<count>`
- Findings summary: P1/P2/P3 counts
- Watchlist items: `<count>`
- Blind spots: `<count>`

## Post-Generation Options

After locking the plan, use **AskUserQuestion**: "Plan locked at `docs/plans/<filename>`. What would you like to do next?"

**Options:**
1. **Open in editor** -- Run `open docs/plans/<filename>.md`
2. **Run `/deepen-plan`** -- Enhance sections with parallel research agents
3. **Review and refine** -- Load the `document-review` skill
4. **Start `/fv:work`** -- Begin implementation
5. **Create Issue** -- Push to project tracker (GitHub/Linear)

Based on selection:
- **Open in editor** -- Open the file in the user's default editor
- **`/deepen-plan`** -- Call /deepen-plan with the plan file path
- **Review and refine** -- Load `document-review` skill
- **`/fv:work`** -- Call /fv:work with the plan file path
- **Create Issue** -- See [Issue Creation](#issue-creation) below
- **Other** (automatically provided) -- Accept free text for rework

Loop back to options after changes until user selects a final action.

## Issue Creation

When user selects "Create Issue", detect their project tracker from AGENTS.md:

1. **Check for tracker preference** in AGENTS.md (global or project). Fall back to CLAUDE.md:
   - Look for `project_tracker: github` or `project_tracker: linear`

2. **If GitHub:**
   ```bash
   gh issue create --title "<type>: <title>" --body-file <plan_path>
   ```

3. **If Linear:**
   ```bash
   linear issue create --title "<title>" --description "$(cat <plan_path>)"
   ```

4. **If no tracker configured:**
   Ask user: "Which project tracker do you use? (GitHub/Linear/Other)"
   Suggest adding `project_tracker:` to AGENTS.md.

5. **After creation:** Display the issue URL, offer `/fv:work`.

---

# Checkpoint and Resume Protocol

At every phase boundary, update frontmatter: `pipeline_phase`, `review_rounds_completed`, `convergence_round`, `deepen_count`, `context_budget` (used_pct, compression_level).

### Context Pressure Checkpoint

If `used_pct > 80%`: emergency summarize, write full findings to disk, set `status: parked`, instruct user to `--resume`.

### User Interruption

Save state to frontmatter, set `status: parked`, report checkpoint phase and resume instructions.

---

# Progressive Summarization Between Rounds

Apply compression matrix from [convergent-planning-loop.md](./references/convergent-planning-loop.md): full -> compressed -> ultra-compressed -> minimal as rounds advance. Current round always gets full fidelity.

After each round (post Phase 4): write full findings to disk (append, never overwrite), generate compressed version, update `compression_level`, escalate if still over budget.

---

# Loop Invariants

1. `pipeline_phase` matches actual execution phase.
2. `convergence_round` never decreases.
3. `deepen_count` never exceeds 2.
4. Every finding has unique ID (`FV-RNNN`) persisting across rounds.
5. No finding deleted -- only resolved, excluded, or subsumed.
6. `used_pct` never exceeds 80% entering a new phase.

---

# Error Recovery

| Failure Mode | Recovery Action |
|---|---|
| Agent timeout during COLLECT | Retry once, then mark scope as skipped |
| Frontmatter parse error | Attempt YAML repair, escalate if ambiguous |
| Context budget exceeded mid-phase | Emergency summarize, continue phase |
| Conflicting findings (same ID, different severity) | Keep higher severity, log conflict |
| User interrupts mid-loop | Save state, set status=parked |
| Gate fails 2x consecutively | Escalate to user with failure details |

NEVER CODE! Just research and write the plan.
