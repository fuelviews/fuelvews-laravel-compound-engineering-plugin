---
title: "feat: Fuelviews Engineering Plugin"
type: feat
date: 2026-03-22
origin: docs/brainstorms/2026-03-22-fuelviews-engineering-plugin-brainstorm.md
master_plan: MASTER-PLAN.md
review_round: 3
review_findings_applied: true
deepened: true
deepened_date: 2026-03-22
deepening_notes: "Added agent structural skeleton, impact tracing chain, convergent state machine, Laravel checklists, plugin architecture details. Full research in Appendix A."
---

# feat: Fuelviews Engineering Plugin

## Overview

Build the Fuelviews Engineering (fv) plugin as `plugins/fuelviews-engineering/` in this repo, forking Compound Engineering's workflow with stronger planning, convergent review, layered impact discovery, Laravel-specific quality checks, repo-layer truth, worktree isolation, and GitNexus knowledge graph integration.

This plugin requires CE to be installed alongside it. fv owns its own skills and new agents but references CE's research, design, and workflow agents directly via the `compound-engineering:` namespace, avoiding duplication and maintenance drift.

## Problem Statement

CE is a mature multi-agent workflow (29 agents, 43 skills) but lacks:

1. **Impact discovery** - No blast-radius tracking, no dependency tracing, no uncertainty classification
2. **Convergent review** - No max-round limits, no stop conditions, no plan reconciliation per round
3. **Repo-layer truth** - No standardized docs/ai/ structure for session continuity
4. **Laravel intelligence** - No PHP/Laravel/Blade/PostgreSQL reviewers, no convention enforcement
5. **Legacy catch-up** - No way to normalize old repos with scattered plans and stale docs
6. **Plan lifecycle** - No plan lock, no plan sync, no plan-to-reality reconciliation
7. **Task isolation** - No worktree integration in the workflow
8. **Graph-powered discovery** - No knowledge graph integration for deeper code analysis

## Proposed Solution

Fork CE's workflow skills with fv-specific enhancements, organized into four implementation phases:

- **Phase 1: Scaffold and Baseline** - Plugin structure, artifact schemas, templates, Spatie references, new agents
- **Phase 2: Workflow Intelligence** - All 8 skills with full planning/review/impact pipelines
- **Phase 3a: Core Hardening** - GitNexus deep integration, worktree adapter, hook enforcement, improved synthesis
- **Phase 3b: Extended Hardening** - Multi-repo orchestration, Boost awareness, deeper repo archaeology

## Technical Approach

### Architecture

```
plugins/fuelviews-engineering/
  .claude-plugin/
    plugin.json                    # Plugin manifest (includes mcpServers)
  agents/
    review/                        # 8 new review agents
    workflow/                      # 2 new workflow agents
  skills/
    fv-start-session/SKILL.md      # name: fv:start-session
    fv-plan/SKILL.md               # name: fv:plan (includes deepening)
    fv-impact/SKILL.md             # name: fv:impact
    fv-work/SKILL.md               # name: fv:work
    fv-review/SKILL.md             # name: fv:review
    fv-plan-sync/SKILL.md          # name: fv:plan-sync
    fv-close-task/SKILL.md         # name: fv:close-task
    fv-repo-catchup/SKILL.md       # name: fv:repo-catchup
  hooks/
    hooks.json                     # SessionStart, workflow boundary checks
  templates/
    repo-layer/                    # docs/ai/ scaffold templates
    plan-artifact.md               # Plan frontmatter template
    impact-artifact.md             # Impact artifact template
    plan-index.md                  # plans/_index.md template
    current-work.md                # docs/ai/current-work.md template
    handoff.md                     # docs/handoffs/latest.md template
  references/
    spatie-laravel.md              # Distilled Spatie Laravel guidelines
    spatie-security.md             # Distilled Spatie security guidelines
    spatie-javascript.md           # Distilled Spatie JS guidelines
    spatie-ai.md                   # Distilled Spatie AI guidelines
    laravel-best-practices.md      # Distilled alexeymezenin/laravel-best-practices
    impact-depth-guide.md          # Impact assessment depth per round
    convergence-rules.md           # Planning/review convergence logic
    severity-policy.md             # P1/P2/P3 definitions and exclusion rules
    source-of-truth-order.md       # Canonical trust hierarchy
  AGENTS.md
  README.md
  CLAUDE.md                        # Shim -> AGENTS.md
```

### Skill Naming Convention

Skill directories use hyphens: `fv-plan/`, `fv-review/`, `fv-start-session/`.
Skill frontmatter `name:` uses colons: `fv:plan`, `fv:review`, `fv:start-session`.

This follows CE's convention where directory `ce-plan/` has frontmatter `name: ce:plan`.

### Agent Strategy

**CE agents referenced directly** (not copied). fv skills call CE agents using the `compound-engineering:` namespace. This avoids duplication and gets automatic CE improvements. Requires CE plugin installed alongside fv.

CE agents used by fv skills:

| Agent | Namespace | Used by |
|-------|-----------|---------|
| architecture-strategist | compound-engineering:review: | fv:plan, fv:review |
| security-sentinel | compound-engineering:review: | fv:plan, fv:review |
| performance-oracle | compound-engineering:review: | fv:review |
| code-simplicity-reviewer | compound-engineering:review: | fv:plan, fv:review, fv:work |
| data-integrity-guardian | compound-engineering:review: | fv:review |
| pattern-recognition-specialist | compound-engineering:review: | fv:review |
| kieran-typescript-reviewer | compound-engineering:review: | fv:review (conditional: .ts/.tsx in changeset) |
| data-migration-expert | compound-engineering:review: | fv:review (conditional) |
| deployment-verification-agent | compound-engineering:review: | fv:review (conditional) |
| schema-drift-detector | compound-engineering:review: | fv:review (conditional) |
| julik-frontend-races-reviewer | compound-engineering:review: | fv:review (conditional) |
| repo-research-analyst | compound-engineering:research: | fv:plan |
| learnings-researcher | compound-engineering:research: | fv:plan, fv:review |
| best-practices-researcher | compound-engineering:research: | fv:plan (conditional) |
| framework-docs-researcher | compound-engineering:research: | fv:plan (conditional) |
| git-history-analyzer | compound-engineering:research: | fv:repo-catchup |
| issue-intelligence-analyst | compound-engineering:research: | fv:repo-catchup |
| spec-flow-analyzer | compound-engineering:workflow: | fv:plan |
| bug-reproduction-validator | compound-engineering:workflow: | fv:work |

CE agents NOT used by fv (Ruby/Python/Every-specific):

| Agent | Reason |
|-------|--------|
| dhh-rails-reviewer | Rails-specific |
| kieran-rails-reviewer | Rails-specific |
| kieran-python-reviewer | Python-specific |
| lint | Ruby/ERB-specific |
| ankane-readme-writer | Ruby gem-specific |
| pr-comment-resolver | Rebuild fv-specific version if needed |
| agent-native-reviewer | Not relevant to Laravel workflow |
| design-implementation-reviewer | Figma-specific, defer until needed |
| design-iterator | Figma-specific, defer until needed |
| figma-design-sync | Figma-specific, defer until needed |

**New fv-specific agents** (owned by this plugin):

| Agent | Category | Purpose |
|-------|----------|---------|
| php-reviewer | review | PSR-12, type safety, modern PHP patterns, error handling |
| laravel-reviewer | review | Fat controllers, service boundaries, Eloquent, middleware, policies |
| blade-reviewer | review | Template hygiene, component usage, XSS, Livewire/Alpine integration |
| javascript-reviewer | review | Alpine.js, Livewire interop, async handling, DOM safety |
| postgresql-reviewer | review | Query performance, indexes, N+1, transactions, JSON columns, migrations |
| laravel-conventions-reviewer | review | Spatie + alexeymezenin conventions, naming, config patterns, best practices |
| laravel-codebase-health-reviewer | review | Dead/unused code, orphaned actions, stale jobs/views, DRY violations, repeated logic |
| laravel-performance-reviewer | review | Eloquent eager loading, query optimization, cache strategy, queue performance, Livewire rendering, config/route caching |
| impact-assessment-agent | workflow | Evidence-based scope discovery, blast-radius mapping, GitNexus queries |
| synthesis-agent | workflow | Dedupe findings across reviewers, synthesize severity, next-action recommendations. Runs in both fv:plan and fv:review pipelines. |

**Total: 10 new agents + 19 CE agents referenced = 29 agents available.**

> **Implementation detail:** All agents follow the structural skeleton and standardized findings schema defined in Appendix A.1. Dispatch strategy: batch 3-4, artifact-backed mode under context pressure.

### Per-Project Agent Configuration

Users can configure which agents run during `/fv:review` by creating a `fuelviews-engineering.local.md` file in the project root. This follows CE's `compound-engineering.local.md` pattern. If absent, the full default panel is used.

**Minimum required agent set** (cannot be removed via .local.md): `laravel-reviewer`, `php-reviewer`, `blade-reviewer`. These cover the core Laravel security surface (mass assignment, XSS, policy enforcement). If .local.md omits any, emit a warning and add them back. CE's `security-sentinel` is available as an optional generic web security check but is not mandatory (it is Rails/JS-focused). Only agents from `compound-engineering:` and `fuelviews-engineering:` namespaces are allowed.

### Artifact Schemas

**Plan artifact** (`docs/plans/<task-slug>.plan.md`):

```yaml
---
title: <task title>
status: draft | in_review | deepening | locked | implementing | synced | closed
canonical: true
task_slug: <slug>
review_rounds_completed: 0
max_review_rounds: 4
excluded_findings: []
created_at: YYYY-MM-DD
locked_at: null
---
```

**Frontmatter validation rules:** Status transitions must follow the lifecycle order (draft -> in_review -> deepening -> locked -> implementing -> synced -> closed). Skills must reject out-of-order transitions. `review_rounds_completed` must be integer 0-4. `task_slug` must match `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$`. `excluded_findings` entries must include finding ID, author, timestamp, and reason.

Sections: task, goal, acceptance criteria, architecture decisions, implementation steps, test plan, risks, review deltas, impact references, deferred/excluded items.

**Impact artifact** (`docs/plans/<task-slug>.impact.md`):

```yaml
---
title: "Impact: <task title>"
task_slug: <slug>
round: 0
depth: broad | plan-aware | deep-wiring | deep-legacy | contract-validation
previous_round: null
---
```

Sections: confidence summary (definite/probable/possible/blind spot), definite edit set, definite read set, watchlist, blind spots, evidence notes, tests impacted, risks, what changed since prior round.

> **Implementation detail:** Confidence classification rules, Laravel dependency tracing chain (10 steps), GitNexus MCP tool inventory, and delta tracking format are in Appendix A.2. Each artifact tracks round-over-round deltas with "New Since RN?" columns and confidence count changes.

**Plan index** (`docs/plans/_index.md`):

Table with: title, file, status, canonical, created, last_verified, superseded_by, notes.

> **Note:** MASTER-PLAN.md uses hyphen naming (`/fv-plan`) and `plans/active/` paths. The canonical conventions are: colon naming (`/fv:plan`) and `docs/plans/` flat paths. MASTER-PLAN.md should be reconciled in Phase 1. The `references/source-of-truth-order.md` must explicitly state `docs/plans/_index.md` as the canonical path.

### Implementation Phases

#### Phase 1: Scaffold and Baseline

**Goal:** Usable plugin skeleton with all structural components in place.

##### 1.0 Extend release infrastructure

- [ ] Add `"fuelviews-engineering"` to `ReleaseComponent` union in `src/release/types.ts`
- [ ] Add `getFuelviewsEngineeringCounts()` function (or generalize to `getPluginCounts(name)`) in `src/release/metadata.ts`
- [ ] Add fv paths to `syncReleaseMetadata()` in `scripts/release/validate.ts`
- [ ] Add cross-plugin agent reference validation: parse fv SKILL.md files for `compound-engineering:*` references and verify each resolves to an actual agent file under `plugins/compound-engineering/agents/`
- [ ] Add generic plugin content validation: YAML frontmatter format for agents, `name:` frontmatter for skills
- [ ] Verify `bun run release:validate` catches fv-specific issues (not just CE). Script must check both CE and fv independently, reporting per-plugin counts and drift. Drift in either plugin fails validation.

##### 1.1 Plugin scaffold

- [ ] Create `plugins/fuelviews-engineering/` directory structure
- [ ] Create `.claude-plugin/plugin.json` manifest with `mcpServers` key (context7 + GitNexus MCP config)
- [ ] Create `AGENTS.md` with fv-specific plugin development rules and skill naming convention
- [ ] Create `CLAUDE.md` shim referencing AGENTS.md
- [ ] Create `README.md` with component inventory (10 agents, 8 skills, 9 references, 6 templates)
- [ ] Update `.claude-plugin/marketplace.json` to register fv plugin
- [ ] Reconcile MASTER-PLAN.md: naming (`/fv-plan` -> `/fv:plan`), paths (`plans/active/` -> `docs/plans/`), frontmatter schema (`converged` -> removed, `excluded_improvements` -> `excluded_findings`, add `task_slug`/`locked_at`/`deepening` status), mark `/fv-compound` as deferred
- [ ] Create `.mcp.json` at plugin root for MCP servers requiring API key headers (following CE's dual-file pattern)
- [ ] Run `bun run release:validate` to verify registration (now validates fv too)

##### 1.2 Create new fv agents

- [ ] `agents/review/php-reviewer.md`
- [ ] `agents/review/laravel-reviewer.md`
- [ ] `agents/review/blade-reviewer.md`
- [ ] `agents/review/javascript-reviewer.md`
- [ ] `agents/review/postgresql-reviewer.md`
- [ ] `agents/review/laravel-conventions-reviewer.md` (loads spatie-laravel + laravel-best-practices refs)
- [ ] `agents/review/laravel-codebase-health-reviewer.md` (covers dead/unused + DRY violations)
- [ ] `agents/review/laravel-performance-reviewer.md` (Eloquent, caching, queues, Livewire rendering)
- [ ] `agents/workflow/impact-assessment-agent.md`
- [ ] `agents/workflow/synthesis-agent.md`

> **Implementation detail:** Full checklists with code examples for all 8 review agents are in Appendix A.3. These will be used directly when authoring agent .md files in Phase 1.2.

##### 1.3 Fetch and distill guidelines

- [ ] Fetch https://spatie.be/guidelines/laravel -> `references/spatie-laravel.md`
- [ ] Fetch https://spatie.be/guidelines/security -> `references/spatie-security.md`
- [ ] Fetch https://spatie.be/guidelines/javascript -> `references/spatie-javascript.md`
- [ ] Fetch https://spatie.be/guidelines/ai -> `references/spatie-ai.md`
- [ ] Fetch https://github.com/alexeymezenin/laravel-best-practices -> `references/laravel-best-practices.md`
- [ ] Each reference: under 500 lines, imperative voice, concrete code examples or anti-patterns for every rule

##### 1.4 Create reference documents

- [ ] `references/impact-depth-guide.md` - Impact assessment depth per round (0-4)
- [ ] `references/convergence-rules.md` - Planning/review stop conditions, re-run conditions, max rounds
- [ ] `references/severity-policy.md` - P1/P2/P3 definitions, exclusion handling, structural storage
- [ ] `references/source-of-truth-order.md` - Canonical trust hierarchy (11 levels)

##### 1.5 Create artifact templates

- [ ] `templates/plan-artifact.md` - Plan frontmatter + section skeleton
- [ ] `templates/impact-artifact.md` - Impact frontmatter + section skeleton
- [ ] `templates/plan-index.md` - docs/plans/_index.md table format
- [ ] `templates/current-work.md` - docs/ai/current-work.md format
- [ ] `templates/handoff.md` - docs/handoffs/latest.md format
- [ ] `templates/repo-layer/` - Full docs/ai/ scaffold (README, architecture, conventions, repo-map)

##### 1.6 Scaffold all 8 skill directories

- [ ] `skills/fv-start-session/SKILL.md` (minimal shell, name: fv:start-session)
- [ ] `skills/fv-plan/SKILL.md` (minimal shell, name: fv:plan -- includes deepening phases)
- [ ] `skills/fv-impact/SKILL.md` (minimal shell, name: fv:impact)
- [ ] `skills/fv-work/SKILL.md` (minimal shell, name: fv:work)
- [ ] `skills/fv-review/SKILL.md` (minimal shell, name: fv:review)
- [ ] `skills/fv-plan-sync/SKILL.md` (minimal shell, name: fv:plan-sync)
- [ ] `skills/fv-close-task/SKILL.md` (minimal shell, name: fv:close-task)
- [ ] `skills/fv-repo-catchup/SKILL.md` (minimal shell, name: fv:repo-catchup)

> **Implementation detail:** MCP config formats, all 13 hook events, hooks.json format, and release infrastructure extension steps are in Appendix A.4. Key learnings: routine PRs should NOT cut releases (docs/solutions/plugin-versioning-requirements.md), use `-beta` suffix for experimental skills (docs/solutions/skill-design/beta-skills-framework.md).

> **MCP config decision:** Use both `plugin.json` `mcpServers` key AND `.mcp.json` at plugin root (following CE's actual pattern). `.mcp.json` handles API key headers via env vars that `plugin.json` cannot express.

**Phase 1 success criteria:**
- [ ] `bun run release:validate` passes
- [ ] All 10 agents have valid YAML frontmatter
- [ ] All 8 skills have valid SKILL.md with correct name: frontmatter
- [ ] Plugin appears in marketplace.json
- [ ] References are under 500 lines each with concrete examples
- [ ] GitNexus MCP configured in plugin.json mcpServers

---

#### Phase 2: Workflow Intelligence

**Goal:** Real, repeatable workflow with all 8 skills fully functional.

##### 2.1 Active plan + impact artifact schemas

- [ ] Finalize plan artifact schema with all frontmatter fields
- [ ] Finalize impact artifact schema with depth levels and round tracking
- [ ] Create plan index format with classification buckets
- [ ] Document artifact lifecycle (draft -> in_review -> deepening -> locked -> implementing -> synced -> closed)

##### 2.2 /fv:plan (full planning pipeline)

The most complex skill. Includes deepening (no separate fv:deepen-plan skill). Internal phases organized into three groups.

**Execution model:** Single invocation runs all phases 0-8. The convergent loop (phases 2-6) iterates within the same session. Phase 5 (deepen) runs up to 2 times maximum -- once after round 1, and optionally again after round 2 if significant new scope was discovered. To mitigate context window exhaustion from cumulative agent outputs, extract the convergent loop logic into `references/convergent-planning-loop.md` and finalization into `references/plan-finalization.md`. The SKILL.md itself orchestrates and links to references.

**Agent scope boundaries for Eloquent overlap:** `laravel-reviewer` owns architectural layering (fat models, wrong layer). `laravel-conventions-reviewer` owns naming and structural conventions. `laravel-performance-reviewer` owns runtime characteristics (N+1, eager loading). Each agent's AGENT.md must define explicit scope boundaries.

**Convergence responsibility:** The synthesis-agent dedupes and prioritizes findings. The skill orchestrator makes convergence decisions (stop/continue) using synthesis output. The synthesis-agent does not decide convergence.

> **Implementation detail:** Full state machine (INIT -> DISPATCH -> COLLECT -> SYNTHESIZE -> EVALUATE -> [DEEPEN | DISPATCH | REPORT]), guards, round-specific focus escalation, convergence tiers, context budget management, and 3-layer dedup are in Appendix A.5 and will be authored as `references/convergence-rules.md` in Phase 1.4.
>
> **Key design points:** Max 4 review rounds. Max 2 deepen rounds. Stop on zero new P1/P2 findings. DEEPEN state triggers after round 1 (`round == 1 AND deepen_count < 2`), and optionally after round 2 if material new scope was discovered (`round == 2 AND deepen_count < 2 AND significant_new_scope`). Review focus labels (broad/interaction/system-wide/adversarial) describe reviewer scope, NOT impact depth levels (broad/plan-aware/deep-wiring/deep-legacy/contract-validation) -- these are separate scales.
>
> **Checkpoint/resume:** If context pressure exceeds threshold before all phases complete, checkpoint state to plan frontmatter (`last_completed_phase`, `convergence_round`) and instruct user to re-invoke `/fv:plan --resume`.

**--- Setup (Phases 0-1) ---**

**Phase 0: Task intake**
- [ ] Normalize user request into task statement
- [ ] Generate task slug
- [ ] Load repo truth (source-of-truth order)
- [ ] Detect repo layer presence; if missing, prompt: auto-scaffold or /fv:repo-catchup
- [ ] Prompt: create worktree for this task? If yes, call worktree adapter

**Phase 1: Initial impact (round 0)**
- [ ] Launch fuelviews-engineering:workflow:impact-assessment-agent with task description
- [ ] Broad structural discovery: routes, controllers, models, Livewire, Filament, policies, jobs
- [ ] Query GitNexus MCP tools for dependency graph (if available)
- [ ] Classify findings: definite/probable/possible/blind spot
- [ ] Write initial impact artifact (round 0, depth: broad)

**--- Convergent Loop (Phases 2-6) ---**

**Phase 2: Plan v1**
- [ ] Run compound-engineering:research:repo-research-analyst + compound-engineering:research:learnings-researcher in parallel
- [ ] Conditionally run compound-engineering:research:best-practices-researcher + compound-engineering:research:framework-docs-researcher
- [ ] Generate plan v1 using impact seed data + research findings
- [ ] Write plan artifact (status: draft)

**Phase 3: Plan review round 1**
- [ ] Launch review panel in parallel (curated subset for planning):
  - compound-engineering:review:architecture-strategist
  - fuelviews-engineering:review:laravel-reviewer
  - compound-engineering:review:security-sentinel
  - compound-engineering:review:code-simplicity-reviewer
- [ ] Collect P1-P3 findings
- [ ] Launch fuelviews-engineering:workflow:synthesis-agent to dedupe and prioritize

**Phase 4: Impact assessment round 1**
- [ ] Launch impact-assessment-agent with plan v1 + review findings
- [ ] Plan-aware dependency discovery (depth: plan-aware)
- [ ] Update impact artifact (round 1)
- [ ] Feed plan deltas back

**Phase 5: Deepen-plan (integrated, max 2 rounds)**
- [ ] Run deepen pass 1 (mandatory after round 1 review + impact)
  - Stress-test assumptions against impact findings
  - Compare alternate approaches
  - Explore hidden risk and simplification opportunities
  - Update plan with deepened sections
- [ ] Track `deepen_count` in plan state (increment after each pass)
- [ ] Deepen pass 2 is optional: triggers after round 2 if material new scope/domain entered

**Phase 6: Review rounds 2-4 (convergent loop)**
- [ ] For each round (max 4 total):
  - Run review panel
  - Run impact assessment (deeper each round)
  - After round 2: if material new scope discovered AND `deepen_count < 2`, run deepen pass 2 before round 3
  - Check convergence: no new actionable P1-P3? Stop early
  - Check re-run conditions: material plan change, new domain/module, new side-effect path
  - Update plan incrementally
- [ ] Track convergence state and `deepen_count` in plan frontmatter

**--- Finalize (Phases 7-8) ---**

**Phase 7: Finalized-plan deepest impact**
- [ ] Run impact-assessment-agent at depth: contract-validation
- [ ] Verify final implementation contract
- [ ] Write final impact artifact

**Phase 8: Plan lock**
- [ ] Set plan status to `locked`
- [ ] Set `locked_at` timestamp
- [ ] Write final watchlist and blind spots
- [ ] Update docs/plans/_index.md
- [ ] Update docs/ai/current-work.md

##### 2.3 /fv:impact (standalone diagnostic)

- [ ] Accept task slug or plan path
- [ ] Run fuelviews-engineering:workflow:impact-assessment-agent at specified or auto-detected depth
- [ ] Output impact artifact without modifying plan
- [ ] Useful for: debugging scope, checking drift, comparing approaches

##### 2.4 /fv:work (implementation execution)

Fork CE's ce:work with fv additions:

- [ ] Read locked plan and latest impact artifact
- [ ] Verify plan status is `locked`
- [ ] Phase 1: Quick start (read plan, clarify, set up environment, create task list)
- [ ] Phase 2: Execute (task loop with incremental commits)
  - Monitor for material drift from plan
  - If scope expands, trigger impact delta
  - Conventional commit messages
- [ ] Phase 3: Quality check
  - Run fv Laravel review agents (php, laravel, blade, js, postgresql as applicable)
  - Run compound-engineering:review:code-simplicity-reviewer
  - System-wide test check
- [ ] Phase 4: Ship (commit, PR, update plan status to `implementing`)
- [ ] Branch strategy follows user's git workflow (create from dev, conventional naming)

##### 2.5 /fv:review (convergent code review)

- [ ] Load review agent panel from `fuelviews-engineering.local.md` or use defaults
- [ ] Max 4 review rounds with convergence
- [ ] Each round:
  1. Inspect diff against plan + impact artifact
  2. Launch review agents (parallel for <=5, serial for 6+)
  3. Run fv Laravel agents mandatorily
  4. Conditional agents: schema-drift-detector (if migrations), data-migration-expert (if data changes), deployment-verification-agent (if deploy-risk), julik-frontend-races-reviewer (if JS/Livewire changes)
  5. Identify P1-P3 findings
  6. Apply fixes unless excluded
  7. Run impact assessment for newly touched areas
  8. Launch synthesis-agent to dedupe and prioritize
  9. Update plan if implementation drifted
- [ ] Convergence: stop when no new actionable findings
- [ ] Output: resolved findings, excluded findings, plan deltas, impact misses
- [ ] P1 findings block merge

##### 2.6 /fv:plan-sync

- [ ] Compare plan artifact against actual implementation
- [ ] Update plan sections that drifted during work/review
- [ ] Sync plan index (docs/plans/_index.md)
- [ ] Update docs/ai/current-work.md
- [ ] Update docs/handoffs/latest.md
- [ ] Set plan status to `synced`

##### 2.7 /fv:start-session

- [ ] **Hard-fail if CE not detected**: Check for compound-engineering plugin presence (look for key CE agent files). If missing, emit blocking error: "fv requires the compound-engineering plugin." Do not proceed to any fv skill.
- [ ] Read repo truth in source-of-truth order (all 11 levels, canonical path: `docs/plans/_index.md`)
- [ ] Detect repo layer health (missing docs/ai/? Missing docs/plans/_index.md?)
- [ ] Identify active task/plan if any
- [ ] Check reference freshness (date-fetched timestamps on Spatie/best-practices refs)
- [ ] Check GitNexus availability; if missing, recommend + offer install (record decision)
- [ ] Check Boost availability; if missing in Laravel repo, suggest once (record decision)
- [ ] Output: session brief, warnings, recommended next command

##### 2.8 /fv:close-task

- [ ] **Blocking gate** (both skill-internal logic AND hook enforcement): refuse to close if:
  - Plan not synced (status != synced)
  - Unresolved P1 findings exist
  - Handoff not updated
- [ ] **Hook-based enforcement** (in Phase 2, not deferred to 3a): Create a close-task hook that independently verifies conditions by reading plan frontmatter and review artifacts, not trusting skill self-report
- [ ] Verify plan sync completed
- [ ] Verify current-work.md updated
- [ ] Verify handoff freshness
- [ ] Summarize: what changed, next prompt, next likely step
- [ ] Suggest worktree cleanup/archive if applicable
- [ ] Set plan status to `closed`

##### 2.9 /fv:repo-catchup

- [ ] Scan repo structure and existing docs/plans
- [ ] Create/refresh docs/ai/* (architecture, conventions, repo-map, current-work)
- [ ] Create/refresh docs/plans/_index.md
- [ ] Classify existing plans: current, historical, superseded, abandoned, dead
- [ ] Add frontmatter to legacy plans (title, status, created_at, last_verified_at, canonical, superseded_by)
- [ ] Move superseded/dead plans to docs/plans/archive/
- [ ] Infer likely current work
- [ ] Identify risky legacy zones
- [ ] Mark human-confirmation gaps (flag uncertainty, don't invent truth)
- [ ] Detect Laravel: check for Boost, suggest if appropriate
- [ ] Detect GitNexus: recommend if not present

##### /fv:compound - DEFERRED

Use CE's `ce:compound` skill directly (writes to docs/solutions/ with same format). Create fv-specific version only when fv-specific changes are needed.

**Phase 2 success criteria:**
- [ ] All 8 skills are fully functional
- [ ] Planning pipeline runs all 9 phases (organized as Setup/Loop/Finalize) with convergence
- [ ] Review pipeline runs with max 4 rounds and convergence
- [ ] Impact artifacts track round-over-round depth
- [ ] Exclusions stored structurally in plan frontmatter
- [ ] Plan lifecycle works: draft -> in_review -> deepening -> locked -> implementing -> synced -> closed
- [ ] /fv:close-task blocks on unresolved P1s or stale plan (skill-internal + hook enforcement)
- [ ] Close-task hook independently verifies conditions (not trusting skill self-report)
- [ ] Synthesis-agent runs in both fv:plan and fv:review pipelines
- [ ] fv:start-session hard-fails if CE plugin not detected
- [ ] Frontmatter validation rejects out-of-order status transitions

---

#### Phase 3a: Core Hardening

**Goal:** Deep integration of graph, worktree, and enforcement tools.

##### 3a.1 GitNexus deep integration

- [ ] Set up continuous file watcher for incremental graph updates
- [ ] Configure **PreToolUse hooks** to enrich grep/glob/bash with graph context for all agents
  - **Trust boundary:** Graph data is untrusted input, not oracle truth. Do not inject graph context into security-sensitive operations (e.g., bash commands that modify files)
  - Pin GitNexus to a specific version in MCP configuration
- [ ] Enhance impact-assessment-agent with direct MCP queries for:
  - Dependency graphs (who calls this? what does this call?)
  - Blast radius (what breaks if this changes?)
  - Dead code detection (unreachable nodes)

##### 3a.2 Hook enforcement

Create `hooks/hooks.json` (note: close-task hook is Phase 2, see 2.8):

- [ ] **SessionStart hook**: Check repo memory exists, active plan matches current-work.md, recommend catch-up if needed
- [ ] **Workflow boundary warnings** (PostToolUse-style checks): At /fv:review, /fv:plan-sync - warn if plan/impact/handoff are stale relative to code changes. These are distinct from the PreToolUse enrichment hooks in 3a.1.
- [ ] All hooks warn-first (close-task blocking gate is in Phase 2)

##### 3a.3 Worktree adapter

- [ ] Define adapter contract: create(taskSlug, branchType), list(), switch(name), remove(name), active()
- [ ] **Slug sanitization:** Validate task slugs match `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$` before passing to any shell operation. Use array-based command execution (not string interpolation).
- [ ] Wrap user's custom shell scripts (create, list, switch, remove)
- [ ] /fv:plan prompts for worktree creation, records choice in plan artifact
- [ ] /fv:work verifies correct worktree context
- [ ] /fv:close-task suggests worktree cleanup/archive
- [ ] Adapter handles branch naming per user's git workflow (conventional branches from dev)

##### 3a.4 Improved synthesis and watchlists

- [ ] Synthesis agent produces structured watchlist from review findings
- [ ] Watchlist persists across rounds and informs next impact depth
- [ ] Auto-generate "what to watch for" section in handoff documents

**Phase 3a success criteria:**
- [ ] GitNexus enriches all agent discovery via PreToolUse hooks
- [ ] Impact agent uses direct graph queries for dependency/blast-radius
- [ ] Hooks enforce freshness at boundaries, block on close-task
- [ ] Worktree adapter wraps custom scripts correctly
- [ ] Watchlists inform handoff documents

---

#### Phase 3b: Extended Hardening

**Goal:** Multi-repo, Boost, and deeper repo intelligence.

##### 3b.1 Multi-repo orchestration

- [ ] Detect related repos (composer.json dependencies pointing to local paths or owned GitHub repos)
  - **Path safety:** Validate composer.json local paths are within the expected workspace root (no `../../../` traversal)
- [ ] Track cross-repo impact in impact artifacts (dependencies, shared interfaces, package versions)
- [ ] Support plan references to work in other repos
- [ ] Handle git workflows for: apps (PR to dev), packages (PR to main), package forks (PR to fork, never upstream)
  - **Fork safety:** Implement git remote allowlist stored in docs/ai/conventions.md. Verify target remote is in allowlist before any push/PR. Require explicit user confirmation for fork push operations.

##### 3b.2 Boost-aware behavior

- [ ] Detect Laravel Boost installation (check composer.json/lock)
- [ ] If installed: read Boost outputs as additional signal source
- [ ] Extend Boost files with fv sections using `<!-- fv:start -->` / `<!-- fv:end -->` delimiters
  - Validate marker pairing: exactly one start, one end, start before end, no nesting
  - On regeneration, verify existing markers are well-formed before modifying
- [ ] If not installed: suggest once on /fv:start-session or /fv:repo-catchup
- [ ] Record Boost decision in docs/ai/conventions.md (never ask again)

##### 3b.3 Stronger repo archaeology

- [ ] Deeper plan classification heuristics for legacy repos
- [ ] Cross-reference git history with plan dates for better classification
- [ ] Detect common Laravel patterns (admin/user parity, multi-tenancy, API versioning)
- [ ] Build richer repo-map.md with risk zones and ownership hints

**Phase 3b success criteria:**
- [ ] Multi-repo impact tracked in artifacts
- [ ] Git workflow differences (app/package/fork) handled correctly
- [ ] Boost files extended without conflicts
- [ ] Legacy repos normalize faster with richer archaeology

---

## Acceptance Criteria

### Functional Requirements

- [ ] Plugin installs and appears in marketplace
- [ ] All 8 skills execute their full pipelines
- [ ] Planning pipeline runs 9 phases (Setup/Loop/Finalize) with convergent review (max 4 rounds)
- [ ] Impact artifacts track discovery at 5 depth levels with 4 confidence categories
- [ ] Review pipeline runs with convergence and per-round impact
- [ ] Laravel-specific review agents fire mandatorily during plan and review
- [ ] Plan lifecycle manages all 7 statuses
- [ ] Exclusions stored in plan frontmatter, not raised repeatedly
- [ ] Repo layer scaffolded on first use (user prompted)
- [ ] Session start hydrates full context from source-of-truth order
- [ ] Close-task blocks on unresolved P1s or stale plan sync
- [ ] CE's ce:compound works for knowledge capture until fv:compound is created
- [ ] fuelviews-engineering.local.md configures per-project review panel

### Non-Functional Requirements

- [ ] New agent namespaces use `fuelviews-engineering:<category>:<name>` format
- [ ] CE agents referenced via `compound-engineering:<category>:<name>` (not copied)
- [ ] All skill references use markdown links (not bare backticks)
- [ ] Skills use AskUserQuestion for blocking questions
- [ ] Hooks are warn-first (except close-task gate)
- [ ] Spatie/best-practices references under 500 lines each with concrete examples
- [ ] Templates produce valid YAML frontmatter

### Quality Gates

- [ ] `bun run release:validate` passes
- [ ] All agent YAML frontmatter validates
- [ ] All SKILL.md frontmatter validates (correct name: with colon separator)
- [ ] Plugin manifest matches component counts (10 agents, 8 skills)
- [ ] README.md reflects accurate inventory

## Dependencies & Prerequisites

| Dependency | Type | Status | Required |
|------------|------|--------|----------|
| Compound Engineering plugin | Internal | Available (v2.49.0) | Yes - fv references CE agents |
| GitNexus | External | MCP config in Phase 1, deep integration Phase 3a | No - graceful fallback |
| Laravel Boost | External | Phase 3b | No - optional enhancement |
| Custom worktree scripts | External | Phase 3a | No - fv works without worktrees |
| Spatie guidelines | External | Fetch in Phase 1 | Yes - distilled into references |
| alexeymezenin/laravel-best-practices | External | Fetch in Phase 1 | Yes - distilled into reference |
| context7 MCP server | External | Via CE plugin | Yes - via CE dependency |

## Risk Analysis & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Skill size exceeds context limits | P2 | Use references/ for large content, keep SKILL.md focused on orchestration. fv:plan phases grouped into Setup/Loop/Finalize. |
| GitNexus not available in all repos | P3 | Impact system works without graph (falls back to grep/glob discovery) |
| Agent panel too large for parallel dispatch | P2 | Auto-serial mode for 6+ agents (following CE pattern) |
| Plan/impact artifacts get large | P3 | Keep artifacts focused, archive completed plans |
| Boost files conflict on regeneration | P2 | Use `<!-- fv:start/end -->` markers, never modify outside markers |
| Multi-repo orchestration complexity | P2 | Phase 3b priority, single-repo must work perfectly first |
| Worktree adapter script incompatibility | P3 | Adapter contract is minimal (4 operations), easy to wrap |
| CE plugin updates break fv agent references | P2 | Cross-ref validation in release:validate catches broken references. Pin to CE version. |
| CE plugin not installed alongside fv | P1 | fv:start-session hard-fails with clear error if CE agents not resolvable |
| YAML frontmatter injection bypasses gates | P2 | Schema validation, lifecycle transition enforcement, structured exclusion entries |
| GitNexus graph poisoning via PreToolUse | P2 | Trust boundary docs, no graph injection into bash commands, version pinning |
| Task slug command injection | P2 | Strict slug regex validation, array-based command execution |
| CE security-sentinel is Rails/JS-focused | P2 | fv Laravel agents (blade-reviewer, laravel-reviewer) cover PHP/Laravel security patterns explicitly. Consider fv-owned laravel-security-reviewer if gaps persist. |
| Agent panel neutered via .local.md | P2 | Minimum required agent set enforced (laravel-reviewer, php-reviewer, blade-reviewer) |
| Synthesis-agent dedup quality | P3 | Clear scope boundaries between review agents reduce overlap |
| Sensitive data in committed artifacts | P3 | Document that plan artifacts may contain security info; recommend .gitignore for public repos |

## Future Considerations

- **fv:compound fork**: Create when fv-specific compound changes are needed
- **laravel-security-reviewer**: Create fv-owned security agent if CE's security-sentinel proves insufficient for Laravel patterns
- **Design agents**: Re-add Figma agents when design workflow is needed
- **Repo separation**: fv and CE are coupled by co-location. Separating them would require a cross-plugin dependency resolver.
- **AI model improvements**: As models get better context handling, some discovery work may simplify
- **Static analysis integration**: Evaluate Larastan, ast-grep, nazonohito51/dependency-analyzer for deeper impact assessment
- **Graph tool alternatives**: Adapter pattern for GitNexus means other tools could be swapped in
- **Team collaboration**: Multi-user plan/review workflows
- **CI integration**: Hooks that run impact assessment on PR creation
- **Metrics dashboard**: Track planning accuracy, review convergence rates

## Documentation Plan

- [ ] Plugin README.md with full component inventory and usage guide
- [ ] AGENTS.md with plugin development conventions (including skill naming convention)
- [ ] Each skill's SKILL.md serves as its own documentation
- [ ] Reference docs serve as agent knowledge base
- [ ] Update root marketplace README if applicable

## References & Research

### Internal References

- Brainstorm: `docs/brainstorms/2026-03-22-fuelviews-engineering-plugin-brainstorm.md`
- Master plan: `MASTER-PLAN.md` (uses legacy hyphen naming; colon convention is canonical)
- CE plugin structure: `plugins/compound-engineering/`
- CE planning skill: `plugins/compound-engineering/skills/ce-plan/SKILL.md`
- CE work skill: `plugins/compound-engineering/skills/ce-work/SKILL.md`
- CE review skill: `plugins/compound-engineering/skills/ce-review/SKILL.md`
- CE compound skill: `plugins/compound-engineering/skills/ce-compound/SKILL.md`
- CE brainstorm skill: `plugins/compound-engineering/skills/ce-brainstorm/SKILL.md`
- CE deepen-plan: `plugins/compound-engineering/skills/deepen-plan/SKILL.md` (no `ce:` prefix)
- Minimal plugin example: `plugins/coding-tutor/`
- Plugin parser: `src/parsers/claude.ts`
- Release validation: `scripts/release/validate.ts`

### External References

- Spatie Laravel guidelines: https://spatie.be/guidelines/laravel
- Spatie security guidelines: https://spatie.be/guidelines/security
- Spatie JavaScript guidelines: https://spatie.be/guidelines/javascript
- Spatie AI guidelines: https://spatie.be/guidelines/ai
- Laravel best practices: https://github.com/alexeymezenin/laravel-best-practices
- GitNexus: https://github.com/abhigyanpatwari/GitNexus
- code-review-graph: https://github.com/tirth8205/code-review-graph

### Key Decisions

| # | Decision | Source |
|---|----------|--------|
| 1 | Fork as new plugin in this repo | Brainstorm |
| 2 | Build everything, Section 22 order | Brainstorm |
| 3 | Impact artifacts as separate files linked from plan | Brainstorm |
| 4 | Laravel quality: mandatory in pipeline + standalone | Brainstorm |
| 5 | Reference CE agents directly, don't copy | Review round 1 |
| 6 | Prompt user on repo bootstrap | Brainstorm |
| 7 | Spatie + alexeymezenin guidelines fetched and distilled | Brainstorm |
| 8 | fv:plan, fv:work, fv:review naming (colon separator) | Brainstorm |
| 9 | GitNexus MCP config in Phase 1, deep integration Phase 3a | Review round 1 |
| 10 | Boost: extend with <!-- fv:start/end --> markers (Phase 3b) | Brainstorm + Review |
| 11 | Worktree adapter wraps custom scripts (Phase 3a) | Brainstorm |
| 12 | Hooks: warn at boundaries, block on close-task only | Brainstorm |
| 13 | Full multi-repo orchestration (Phase 3b) | Brainstorm |
| 14 | Merge agent pairs: conventions+best-practices, dead+dry | Review round 1 |
| 15 | Fold deepen-plan into fv:plan (not separate skill) | Review round 1 |
| 16 | Defer fv:compound, use CE's ce:compound | Review round 1 |
| 17 | Drop design agents, defer until Figma workflow needed | Review round 1 |
| 18 | Split Phase 3 into 3a (core) and 3b (extended) | Review round 1 |
| 19 | docs/plans/ flat path (CE convention), not plans/active/ | Review round 1 |
| 20 | MCP servers: both plugin.json mcpServers AND .mcp.json (CE's dual-file pattern) | Review round 1 + round 3 |
| 21 | Minimum required agents: laravel-reviewer, php-reviewer, blade-reviewer (not security-sentinel) | Review round 3 |
| 22 | State machine includes DEEPEN state between round 1 and convergent loop | Review round 3 |
| 23 | Checkpoint/resume for context exhaustion via plan frontmatter state | Review round 3 |
| 24 | Research insights extracted to appendix, plan body has pointers only | Review round 3 |
| 25 | Deepen-plan runs up to 2 times max (mandatory after R1, optional after R2 if new scope) | User directive |

### Review History

**Round 1** (2026-03-22): DHH, Kieran, Simplicity reviewers in parallel.
- 4 P1, 12 P2, 7 P3 findings
- Major changes: reference CE agents instead of copying, merge 3 agent pairs, fold deepen-plan, defer compound, split Phase 3, fix GitNexus phasing, drop design agents, fix artifact paths, document naming convention
- Status: all findings accepted and applied

**Round 2** (2026-03-22): Architecture-strategist, Security-sentinel, Simplicity reviewers in parallel.
- Architecture: 2 P1 (no plugin dependency mechanism, release infra needs extension), 7 P2, 4 P3
- Security: 3 P1 (frontmatter injection, close-task gate LLM-only, GitNexus graph poisoning), 6 P2, 3 P3
- Simplicity: 0 P1, 4 P2, 6 P3 (confirmed round 1 revisions landed well)
- Major changes: add release infra extension (Phase 1.0), cross-ref agent validation, CE hard-fail check in start-session, frontmatter validation schema, close-task hook moved to Phase 2, GitNexus trust boundary, slug sanitization, minimum required agent set, agent scope boundaries documented, fork safety via remote allowlist, Boost marker validation, kieran-typescript made conditional, execution model clarified for fv:plan
- Convergence status: approaching convergence. No structural rework needed. Remaining items are implementation-level hardening.

**Round 3** (2026-03-22): DHH, Kieran, Simplicity reviewers on deepened plan.
- DHH: 1 P1 (research insights break readability), 4 P2, 3 P3. "Ready to ship with P1 fix."
- Kieran: 2 P1 (state machine missing DEEPEN state, MCP config contradicts CE pattern), 5 P2, 6 P3. "Conditionally implementation-ready."
- Simplicity: 0 P1, 3 P2, 7 P3. "Converged and ready to implement."
- Major changes: extracted research insights to appendix pointers, added DEEPEN state, fixed MCP config to dual-file pattern, updated minimum required agent set, added checkpoint/resume, clarified review vs impact depth labels, added validate behavior spec, moved external tools to Future
- Convergence status: **CONVERGED**. All reviewers confirm ready to implement. No structural rework needed.

---

## Appendix A: Research Insights

Research gathered during deepening pass. These will be consumed when authoring reference docs and agent definitions in Phase 1.

### A.1 Agent Design Patterns

**Structural skeleton (every agent must follow):**
1. YAML frontmatter: `name`, `description` (with "Use when..." clause), `model: inherit`
2. Examples block: 2-3 `<example>` blocks with `<commentary>` for dispatch routing
3. Role paragraph: "You are a [Expert Title] specializing in [domain]. Your mission is to [goal]."
4. Numbered protocol: Step-by-step checklist of what to examine
5. Verification checklist: `- [ ]` items that must be verified before output
6. Structured output format: Standardized findings schema (below)
7. Operational guidelines: Short bullets of meta-instructions

**Standardized findings schema (all fv agents must use):**
```markdown
### Finding N
- **Category**: [security|performance|architecture|quality|data-integrity|conventions|dead-code]
- **Severity**: [P1|P2|P3]
- **File**: [path:line]
- **Summary**: One-sentence description
- **Detail**: What is wrong and why it matters
- **Recommendation**: Concrete fix with code example
- **Effort**: [Small|Medium|Large]
```

**Scope boundary template:**
```markdown
## Scope
**This agent covers:** [specific areas]
**This agent does NOT cover (defer to):** [named agent for each excluded area]
**Overlap resolution:** Report here ONLY if primary concern is this agent's domain.
```

**Dispatch strategy:** Batch 3-4 agents, collect inline per batch. Under context pressure, switch to artifact-backed mode (`.context/fuelviews-engineering/<skill>/<run-id>/agent-name.md`). Build compact-safe fallback for exhausted context.

### A.2 Impact Assessment Implementation

**Confidence classification rules:**
- `definite` := direct use statement OR direct method call OR extends/implements OR route binding
- `probable` := event listener for changed event OR observer on changed model OR middleware in pipeline
- `possible` := same trait used OR similar naming pattern OR same table different model OR config reference
- `blind_spot` := dynamic instantiation OR reflection usage OR external package hook OR runtime config switch

**Laravel dependency tracing chain (per file in edit set):**
1. Routes referencing this controller -> `routes/*.php` grep + `php artisan route:list --json`
2. Middleware applied -> `Kernel.php` groups + route middleware
3. Form requests -> controller type-hinted parameters
4. Injected services -> constructor type-hints
5. Models touched -> service class grep for `::query()`, `->save()`, `->update()`
6. Per model: observers, events (`$dispatchesEvents`), relations, policies (`AuthServiceProvider::$policies`)
7. Filament resources -> `$model = Model::class` in `Filament/Resources/`
8. Livewire components -> `<livewire:*>` and `$this->dispatch()` patterns
9. Event listeners -> `EventServiceProvider::$listen`
10. Job chains -> `dispatch()`, `Bus::chain()`

**GitNexus MCP tools:** `impact` (blast radius), `context` (360-degree symbol view), `query` (hybrid search), `detect_changes` (diff to flows), `cypher` (raw graph queries).

### A.3 Laravel Agent Checklists

**php-reviewer:** PSR-12, typed properties, return types, constructor promotion, happy path pattern, strict comparisons, readonly properties, no unused imports.

**laravel-reviewer:** Single responsibility controllers, fat models/skinny controllers, FormRequest validation, service classes, Eloquent scopes, `$request->validated()`, eager loading, `Model::shouldBeStrict()`, policy-based auth, route model binding, no `env()` outside config, IoC over `new`, events for side effects, queue heavy work.

**blade-reviewer:** Always `{{ }}`, audit `{!! !!}`, `@json()` for data transfer, CSRF. **Livewire:** authorize actions, `#[Locked]`, store models not IDs, persistent middleware. **Alpine:** `::` prefix, no sensitive data in `x-data`.

**postgresql-reviewer:** N+1, chunking, pagination, `CREATE INDEX CONCURRENTLY`, three-step column additions, `SET lock_timeout`, JSONB/GIN indexes, partial indexes, expression indexes.

**laravel-conventions-reviewer:** Controller singular PascalCase, routes plural kebab-case, model singular, table plural snake_case, pivot alphabetical, route tuple notation, array validation syntax, shorter helpers.

**laravel-codebase-health-reviewer:** No commented code, no unused imports/routes/methods/config/components, no duplicated rules/queries, no God classes, Larastan level 6+ (if installed).

**laravel-performance-reviewer:** `preventLazyLoading()`, `withCount()`, `Cache::remember()`, Redis, config caching, idempotent jobs, explicit retry config, `->select()`, `chunkById()`.

### A.4 Plugin Architecture Details

**MCP config:** Both `plugin.json` `mcpServers` AND `.mcp.json` at plugin root (CE pattern). `.mcp.json` handles API key headers.

**Hook events (13):** PreToolUse, PostToolUse, PostToolUseFailure, SessionStart, SessionEnd, Stop, PreCompact, Setup, PermissionRequest, UserPromptSubmit, Notification, SubagentStart, SubagentStop.

**hooks.json format:** `{ "hooks": { "EventName": [{ "matcher": "pattern", "hooks": [{ "type": "command|prompt|agent", ... }] }] } }`

**Release infrastructure:** Add to `ReleaseComponent` union, add counting function, add sync paths, add release-please config + manifest.

### A.5 Convergent Review State Machine

**States:** INIT -> DISPATCH -> COLLECT -> SYNTHESIZE -> EVALUATE -> [DEEPEN | DISPATCH | REPORT]

**Guards:**
- `CAN_DISPATCH`: round < 4 AND NOT converged AND context_budget > min
- `NEEDS_DEEPENING`: (round == 1 AND deepen_count < 2) OR (round == 2 AND deepen_count < 2 AND significant_new_scope)
- `HAS_CONVERGED`: new_actionable_count == 0 OR 2x consecutive P3-only
- `FORCE_STOP`: round >= 4 OR context_budget < min
- `CONTEXT_PRESSURE`: next_round_cost > remaining * 0.8 -> artifact-backed mode

**Round focus escalation (review scope, not impact depth):**

| Round | Focus |
|-------|-------|
| 1 | Broad -- all P1/P2/P3 |
| 2 | Interaction effects, cross-file |
| 3 | System-wide: error propagation, state lifecycle, API parity |
| 4 | Adversarial: P1 risks only, challenge prior P2 severities |

**Context budget:** Round 1 full detail -> Round 2 compressed prior + full -> Round 3 ultra-compressed + full -> Round 4 minimal + full.

**Dedup:** 3-layer -- exact (file+line+type), semantic (region+concern), escalation (P3 now P2/P1).

### A.6 fv:plan SKILL.md Orchestration (Deepening Pass 2)

**Section structure:** Frontmatter -> Introduction -> Interaction Method -> Input -> Core Principles -> Pipeline State Schema -> Workflow (Setup Group / Loop Group / Finalize Group) -> Impact Artifact Schema -> Plan Frontmatter Schema -> Convergence Rules -> Post-Pipeline Options -> Transition to fv:work.

**Phase grouping pattern (from CE's SLFG skill):** Sequential Phase (must complete in order) -> Parallel Phase (concurrent tasks) -> Finalize Phase (cleanup, handoff). Maps to fv:plan's Setup (0-2) / Loop (3-6) / Finalize (7-8).

**GATE pattern (from CE's LFG skill):** Insert explicit `GATE: STOP.` checkpoints between groups. Example: "GATE: Verify plan file exists on disk. If not, retry. Do NOT proceed."

**Checkpoint/resume via frontmatter:** Every phase updates `pipeline_phase` in plan frontmatter. `--resume <plan-path>` reads this and jumps to correct phase. Phase mapping: 0-1 -> restart intake, 2 -> start review, 3 -> check impact, 4 -> start deepen, 5 -> start loop, 6 -> resume at `review_rounds_completed + 1`, 7 -> start lock, 8 -> present options.

**Progressive summarization between rounds:** After each round, create compact summary (round N, new findings list, resolved, excluded, impact delta, confidence trend). Pass summary (not full agent output) to next round's agents.

**Transition to fv:work:** Pass locked plan path, final impact artifact path, and task slug. fv:work uses the watchlist and blind spots for drift monitoring during implementation.

**Key implementation notes:**
- Phase 2 follows ce:plan-beta's approach but feeds impact seed data as additional context
- Impact is the differentiator -- CE has no impact concept. Must be fully specified.
- Deepen runs up to 2 times max. First is mandatory after round 1, second is optional after round 2 if significant new scope.
- The convergent loop is review -> impact -> convergence check (deepen is a branching state, not part of every iteration)
- Frontmatter is the checkpoint mechanism. Durable across sessions.
- Laravel-specific checks are wired into the review panel, not a separate phase.

### A.7 Repo-Layer Truth Templates (Deepening Pass 2)

**architecture.md:** Under 200 lines. Sections: Stack, Architectural Decisions (request flow, domain organization), Key Patterns (table format), Callback/Event Chains to Know, External Integrations, What NOT to Do. Include `Last verified` date. Table format for patterns (faster for agents to parse than prose).

**conventions.md:** Only rules that differ from or extend framework defaults. Every line must earn its place. Sections: PHP, Laravel, Testing, Naming (table), Code Review Non-Negotiables. Do NOT include formatting rules (those belong in pint.json). Do NOT repeat framework docs.

**repo-map.md:** Self-healing design -- instruction at top tells agents to verify and update if inaccurate. Sections: Entry Points (table), Domain Directories (table), Configuration Wiring (table), Test Locations (table), Key Commands, Recent Structural Changes. Omit exact line counts and file counts (stale immediately). Use "as of last count" for estimates.

**current-work.md:** Overwritten every session. Sections: Active Task (title, plan, branch, status), Progress (checkboxes), Current Context (with key decisions made), Blockers/Open Questions, Files Currently Being Modified (table with status), Mistakes to Avoid.

**handoff (latest.md):** Sections: What Was Accomplished, Commits Made, What Did NOT Work, Current State, Open Questions Carried Forward, Recommended Next Steps (ordered), Key Files to Read First. Critical content: decisions with rationale, failed approaches, specific file paths, ordered next steps.

**Session hydration order for fv:start-session:**
1. conventions.md (rules that constrain all behavior)
2. architecture.md (structural decisions)
3. repo-map.md (what exists and where)
4. handoffs/latest.md (what last session did)
5. current-work.md (active task state)
6. plans/_index.md (plan registry)
7. Active plan file (referenced in current-work.md)

**Staleness detection (3 tiers):**
- Tier 1 (passive): `Last verified` date. >14 days = WARNING, >30 days = BLOCKING, >60 days = STALE.
- Tier 2 (active): Compare `git log -1 -- docs/ai/` vs `git log -1 -- app/ database/ routes/ config/`. If code changed more recently, docs may be stale.
- Tier 3 (periodic): `/fv:verify-docs` cross-references doc claims against actual code (directories exist, model counts match, commands run).

### A.8 Legacy Repo Catch-Up Algorithms (Deepening Pass 2)

> **Scope note:** Phase 2.9 (`/fv:repo-catchup`) should use a simplified subset of these algorithms. Full 6-signal classification and Tornhill hotspot analysis are Phase 3b.3 targets. Phase 2.9 focuses on: git recency + frontmatter status + checkbox ratio for plan classification, and basic directory scanning for architecture inference.

**Plan classification algorithm:** 6 signals combined with weighted evidence.
1. Git recency: 0-14 days = likely current, 61-180 = likely historical/abandoned, 180+ = likely dead
2. Content freshness: checkbox ratio (1.0 + old = historical, 0.0 + old = abandoned, partial + old = abandoned)
3. Branch/PR correlation: open PR = current, merged PR = historical, closed-without-merge = abandoned
4. Supersession detection: explicit `superseded_by` frontmatter, same feature name with later dates
5. Code reference validation: check if referenced files still exist. <30% existence = dead
6. Commit message cross-reference: recent commits implementing plan features = historical

Combined: explicit frontmatter trumps all -> supersession evidence -> code validation -> branch/PR -> recency + completion -> default `needs_human_confirmation`.

**Architecture inference for Laravel:** Run `php artisan route:list --json`, `php artisan model:show --all`, `php artisan db:show`. Detect patterns: Filament (app/Filament/), Livewire (app/Livewire/), Actions (app/Actions/), Services (app/Services/), Repositories (app/Repositories/), Domain-driven (app/Domain/ or app/Modules/).

**Convention extraction:** Sample 3-5 files per category. Extract: injection patterns, return types, validation location, authorization location, query patterns. Majority-wins for each dimension. Flag inconsistencies as legacy drift zones (<80% consistency).

**Risk zone detection (Tornhill hotspot method):** `hotspot_score = normalize(churn) * normalize(complexity)`. Churn = commits/12mo via `git log --name-only`. Complexity = LOC proxy via `wc -l`. Top-right quadrant (high churn + high complexity) = primary risk. Also detect: bus factor = 1 (single author), no test coverage, fat controllers >300 LOC, God models >500 LOC, temporal coupling (files that change together in different directories).

**Execution order:** Scan (fast, parallel, read-only) -> Infer (compute, no writes) -> Write (create/refresh docs) -> Organize (move files, requires confirmation for low-confidence) -> Flag (human-confirmation gaps last).

### A.9 Worktree Adapter Design (Deepening Pass 2)

**Adapter interface:** 5 core methods (create, list, switch, remove, active) + 3 extended (resolve, copyEnv, cleanup). `CreateOptions` includes `branchType`, `fromBranch`, `repoType` (app/package/package-fork).

**Branch naming:** `<type>/<task-slug>`. Always lowercase, hyphens only, max 80 chars total. Type prefix matches conventional commit types. Slug validated against `^[a-z0-9][a-z0-9-]*[a-z0-9]$`.

**Repo-type-aware base branch:**
- App: `dev` (or `develop`, falling back to `main`)
- Package: `main`
- Package fork: `main` on fork remote (NEVER upstream)

**Auto-detection:** Check `composer.json` type field ("library" = package). Check for `upstream` remote (present = fork).

**Task-to-worktree tracking:** JSON registry at `.worktrees/.worktree-registry.json` (gitignored). Bidirectional: registry maps slug -> worktree, plan frontmatter maps worktree -> slug.

**Edge cases handled:** Branch lock conflicts (same branch in two worktrees), stale worktrees (prune before listing), case-sensitive naming on macOS, nested worktree prevention, locked worktrees, detached HEAD after force-push, uncommitted changes on removal, submodule state.

**Lifecycle:**
- `/fv:plan` Phase 0: ask to create, record choice in plan frontmatter
- `/fv:work` Phase 1: resolve and switch to task worktree
- `/fv:close-task`: verify clean, offer cleanup with `deleteBranch: true`

**Fork safety:** Validate `origin != upstream` before any push/PR. Use git remote allowlist in docs/ai/conventions.md. Require explicit confirmation for fork operations.

**Multi-repo coordination:** Convention-based discovery via sibling directories. Cross-repo task manifest with `mergeOrder` (leaf-first: dependencies before dependents). Post-merge sync scripts are repo-type-aware (app: dev->main rebase, package: wait for checks, fork: never upstream).
