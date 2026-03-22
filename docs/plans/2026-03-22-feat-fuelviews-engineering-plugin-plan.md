---
title: "feat: Fuelviews Engineering Plugin"
type: feat
date: 2026-03-22
origin: docs/brainstorms/2026-03-22-fuelviews-engineering-plugin-brainstorm.md
master_plan: MASTER-PLAN.md
---

# feat: Fuelviews Engineering Plugin

## Overview

Build the Fuelviews Engineering (fv) plugin as `plugins/fuelviews-engineering/` in this repo, forking Compound Engineering's workflow with stronger planning, convergent review, layered impact discovery, Laravel-specific quality checks, repo-layer truth, worktree isolation, GitNexus knowledge graph integration, and multi-repo orchestration.

This is a new plugin in the existing repo, sharing CLI/marketplace infrastructure with CE while owning its own skills, agents, hooks, and templates.

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

Fork CE's workflow skills with fv-specific enhancements, organized into three implementation phases:

- **Phase 1: Scaffold and Baseline** - Plugin structure, artifact schemas, templates, Spatie references, curated agents
- **Phase 2: Workflow Intelligence** - All 9 commands with full planning/review/impact pipelines
- **Phase 3: Hardening** - GitNexus deep integration, Boost awareness, multi-repo orchestration, hook enforcement

## Technical Approach

### Architecture

```
plugins/fuelviews-engineering/
  .claude-plugin/
    plugin.json                    # Plugin manifest
  .mcp.json                        # MCP servers (context7 + GitNexus)
  agents/
    review/                        # 13 review agents (8 new + 5 curated from CE)
    research/                      # 6 research agents (curated from CE)
    workflow/                      # 4 workflow agents (2 new + 2 curated from CE)
    design/                        # 3 design agents (curated from CE)
  skills/
    fv-start-session/SKILL.md
    fv-plan/SKILL.md
    fv-impact/SKILL.md
    fv-work/SKILL.md
    fv-review/SKILL.md
    fv-plan-sync/SKILL.md
    fv-compound/SKILL.md
    fv-close-task/SKILL.md
    fv-repo-catchup/SKILL.md
    fv-deepen-plan/SKILL.md
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
    impact-depth-guide.md          # Impact assessment depth per round
    convergence-rules.md           # Planning/review convergence logic
    severity-policy.md             # P1/P2/P3 definitions and exclusion rules
    source-of-truth-order.md       # Canonical trust hierarchy
  AGENTS.md
  README.md
  CLAUDE.md                        # Shim -> AGENTS.md
```

### Agent Inventory

**Curated from CE (keep as-is):**

| Agent | Category | Why keep |
|-------|----------|----------|
| architecture-strategist | review | Core architectural review |
| security-sentinel | review | Security audit |
| performance-oracle | review | Performance analysis |
| code-simplicity-reviewer | review | YAGNI/simplicity |
| data-integrity-guardian | review | Migration/data safety |
| pattern-recognition-specialist | review | Pattern/anti-pattern detection |
| kieran-typescript-reviewer | review | TS/JS quality (Livewire/Alpine) |
| deployment-verification-agent | review | Deploy checklists |
| data-migration-expert | review | Migration validation |
| repo-research-analyst | research | Repo structure analysis |
| learnings-researcher | research | docs/solutions/ lookup |
| best-practices-researcher | research | External best practices |
| framework-docs-researcher | research | Framework doc lookup |
| git-history-analyzer | research | Git archaeology |
| spec-flow-analyzer | workflow | User flow gap analysis |
| bug-reproduction-validator | workflow | Bug validation |
| design-implementation-reviewer | design | Figma comparison |
| design-iterator | design | Iterative UI refinement |
| figma-design-sync | design | Figma sync |

**Drop from CE (Ruby/Python-specific):**

| Agent | Reason |
|-------|--------|
| dhh-rails-reviewer | Rails-specific |
| kieran-rails-reviewer | Rails-specific |
| kieran-python-reviewer | Python-specific |
| lint | Ruby/ERB-specific |
| ankane-readme-writer | Ruby gem-specific |
| every-style-editor | Every.to-specific |
| pr-comment-resolver | Can rebuild fv-specific version later |
| agent-native-reviewer | Not relevant to Laravel workflow |

**New fv agents:**

| Agent | Category | Purpose |
|-------|----------|---------|
| php-reviewer | review | PSR-12, type safety, modern PHP patterns, error handling |
| laravel-reviewer | review | Fat controllers, service boundaries, Eloquent, middleware, policies |
| blade-reviewer | review | Template hygiene, component usage, XSS, Livewire/Alpine integration |
| javascript-reviewer | review | Alpine.js, Livewire interop, async handling, DOM safety |
| postgresql-reviewer | review | Query performance, indexes, N+1, transactions, JSON columns, migrations |
| laravel-conventions-reviewer | review | Spatie-informed conventions, naming, config patterns |
| laravel-dead-unused-reviewer | review | Orphaned actions, stale jobs/listeners/views, dead helpers/routes |
| laravel-dry-reviewer | review | Repeated validation/auth/query/orchestration across flows |
| laravel-best-practices-reviewer | review | Community best practices from alexeymezenin/laravel-best-practices |
| impact-assessment-agent | workflow | Evidence-based scope discovery, blast-radius mapping, GitNexus queries |
| synthesis-agent | workflow | Dedupe findings, synthesize severity, produce next-action recommendations |

### Artifact Schemas

**Plan artifact** (`plans/active/<task-slug>.plan.md`):

```yaml
---
title: <task title>
status: draft | in_review | deepening | locked | implementing | synced | closed
canonical: true
task_slug: <slug>
worktree: <path or null>
review_rounds_completed: 0
max_review_rounds: 4
converged: false
impact_rounds_completed: 0
excluded_findings: []
created_at: YYYY-MM-DD
locked_at: null
---
```

Sections: task, goal, acceptance criteria, architecture decisions, implementation steps, test plan, risks, review deltas, impact references, deferred/excluded items.

**Impact artifact** (`plans/active/<task-slug>.impact.md`):

```yaml
---
title: "Impact: <task title>"
task_slug: <slug>
round: 0
depth: broad | plan-aware | deep-wiring | deep-legacy | contract-validation
previous_round: null
---
```

Sections: confidence summary, definite edit set, definite read set, watchlist, blind spots, evidence notes, tests impacted, risks, what changed since prior round.

**Plan index** (`plans/_index.md`):

Table with: title, file, status, canonical, created, last_verified, superseded_by, notes.

### Implementation Phases

#### Phase 1: Scaffold and Baseline

**Goal:** Usable plugin skeleton with all structural components in place.

##### 1.1 Plugin scaffold

- [ ] Create `plugins/fuelviews-engineering/` directory structure
- [ ] Create `.claude-plugin/plugin.json` manifest
- [ ] Create `.mcp.json` with context7 server config
- [ ] Create `AGENTS.md` with fv-specific plugin development rules
- [ ] Create `CLAUDE.md` shim referencing AGENTS.md
- [ ] Create `README.md` with component inventory
- [ ] Update `.claude-plugin/marketplace.json` to register fv plugin
- [ ] Run `bun run release:validate` to verify registration

##### 1.2 Curate CE agents

- [ ] Copy 19 relevant CE agents into `agents/` with correct category subdirectories
- [ ] Update agent namespaces from `compound-engineering:` to `fuelviews-engineering:`
- [ ] Verify YAML frontmatter format is correct for all copied agents

##### 1.3 Create new fv agents

- [ ] `agents/review/php-reviewer.md`
- [ ] `agents/review/laravel-reviewer.md`
- [ ] `agents/review/blade-reviewer.md`
- [ ] `agents/review/javascript-reviewer.md`
- [ ] `agents/review/postgresql-reviewer.md`
- [ ] `agents/review/laravel-conventions-reviewer.md`
- [ ] `agents/review/laravel-dead-unused-reviewer.md`
- [ ] `agents/review/laravel-dry-reviewer.md`
- [ ] `agents/review/laravel-best-practices-reviewer.md`
- [ ] `agents/workflow/impact-assessment-agent.md`
- [ ] `agents/workflow/synthesis-agent.md`

##### 1.4 Fetch and distill Spatie guidelines

- [ ] Fetch https://spatie.be/guidelines/laravel -> `references/spatie-laravel.md`
- [ ] Fetch https://spatie.be/guidelines/security -> `references/spatie-security.md`
- [ ] Fetch https://spatie.be/guidelines/javascript -> `references/spatie-javascript.md`
- [ ] Fetch https://spatie.be/guidelines/ai -> `references/spatie-ai.md`
- [ ] Distill each into concise, actionable rules that agents can reference

##### 1.5 Create reference documents

- [ ] `references/impact-depth-guide.md` - Impact assessment depth per round (0-4)
- [ ] `references/convergence-rules.md` - Planning/review stop conditions, re-run conditions, max rounds
- [ ] `references/severity-policy.md` - P1/P2/P3 definitions, exclusion handling, structural storage
- [ ] `references/source-of-truth-order.md` - Canonical trust hierarchy (11 levels)

##### 1.6 Create artifact templates

- [ ] `templates/plan-artifact.md` - Plan frontmatter + section skeleton
- [ ] `templates/impact-artifact.md` - Impact frontmatter + section skeleton
- [ ] `templates/plan-index.md` - plans/_index.md table format
- [ ] `templates/current-work.md` - docs/ai/current-work.md format
- [ ] `templates/handoff.md` - docs/handoffs/latest.md format
- [ ] `templates/repo-layer/` - Full docs/ai/ scaffold (README, architecture, conventions, repo-map)

##### 1.7 Scaffold all 9 skill directories

- [ ] `skills/fv-start-session/SKILL.md` (minimal shell)
- [ ] `skills/fv-plan/SKILL.md` (minimal shell)
- [ ] `skills/fv-impact/SKILL.md` (minimal shell)
- [ ] `skills/fv-work/SKILL.md` (minimal shell)
- [ ] `skills/fv-review/SKILL.md` (minimal shell)
- [ ] `skills/fv-plan-sync/SKILL.md` (minimal shell)
- [ ] `skills/fv-compound/SKILL.md` (minimal shell)
- [ ] `skills/fv-close-task/SKILL.md` (minimal shell)
- [ ] `skills/fv-repo-catchup/SKILL.md` (minimal shell)
- [ ] `skills/fv-deepen-plan/SKILL.md` (minimal shell)

**Phase 1 success criteria:**
- [ ] `bun run release:validate` passes
- [ ] All agents have valid YAML frontmatter
- [ ] All skills have valid SKILL.md with frontmatter
- [ ] Plugin appears in marketplace.json
- [ ] References are distilled and actionable

---

#### Phase 2: Workflow Intelligence

**Goal:** Real, repeatable workflow with all 9 commands fully functional.

##### 2.1 Active plan + impact artifact schemas

- [ ] Finalize plan artifact schema with all frontmatter fields
- [ ] Finalize impact artifact schema with depth levels and round tracking
- [ ] Create plan index format with classification buckets
- [ ] Document artifact lifecycle (draft -> in_review -> locked -> implementing -> synced -> closed)

##### 2.2 /fv:plan (full planning pipeline)

The most complex skill. Internal phases:

**Phase 0: Task intake**
- [ ] Normalize user request into task statement
- [ ] Generate task slug
- [ ] Load repo truth (source-of-truth order)
- [ ] Detect repo layer presence; if missing, prompt: auto-scaffold or /fv:repo-catchup
- [ ] Prompt: create worktree for this task? If yes, call worktree adapter

**Phase 1: Initial impact (round 0)**
- [ ] Launch impact-assessment-agent with task description
- [ ] Broad structural discovery: routes, controllers, models, Livewire, Filament, policies, jobs
- [ ] Query GitNexus MCP tools for dependency graph (if available)
- [ ] Classify findings: definite/probable/possible/blind spot
- [ ] Write initial impact artifact (round 0, depth: broad)

**Phase 2: Plan v1**
- [ ] Run repo-research-analyst + learnings-researcher in parallel
- [ ] Conditionally run best-practices-researcher + framework-docs-researcher
- [ ] Generate plan v1 using impact seed data + research findings
- [ ] Write plan artifact (status: draft)

**Phase 3: Plan review round 1**
- [ ] Launch review panel in parallel (curated subset for planning):
  - architecture-strategist
  - laravel-reviewer
  - security-sentinel
  - code-simplicity-reviewer
- [ ] Collect P1-P3 findings
- [ ] Launch synthesis-agent to dedupe and prioritize

**Phase 4: Impact assessment round 1**
- [ ] Launch impact-assessment-agent with plan v1 + review findings
- [ ] Plan-aware dependency discovery (depth: plan-aware)
- [ ] Update impact artifact (round 1)
- [ ] Feed plan deltas back

**Phase 5: Deepen-plan**
- [ ] Stress-test assumptions against impact findings
- [ ] Compare alternate approaches
- [ ] Explore hidden risk and simplification opportunities
- [ ] Update plan with deepened sections

**Phase 6: Review rounds 2-4 (convergent loop)**
- [ ] For each round (max 4 total):
  - Run review panel
  - Run impact assessment (deeper each round)
  - Check convergence: no new actionable P1-P3? Stop early
  - Check re-run conditions for deeper impact
  - Update plan incrementally
- [ ] Track convergence state in plan frontmatter

**Phase 7: Finalized-plan deepest impact**
- [ ] Run impact-assessment-agent at depth: contract-validation
- [ ] Verify final implementation contract
- [ ] Write final impact artifact

**Phase 8: Plan lock**
- [ ] Set plan status to `locked`
- [ ] Set `locked_at` timestamp
- [ ] Write final watchlist and blind spots
- [ ] Update plans/_index.md
- [ ] Update docs/ai/current-work.md

##### 2.3 /fv:impact (standalone diagnostic)

- [ ] Accept task slug or plan path
- [ ] Run impact-assessment-agent at specified or auto-detected depth
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
  - Run Laravel-specific review agents (php, laravel, blade, js, postgresql as applicable)
  - Run code-simplicity-reviewer
  - System-wide test check
- [ ] Phase 4: Ship (commit, PR, update plan status to `implementing`)
- [ ] Branch strategy follows user's git workflow (create from dev, conventional naming)

##### 2.5 /fv:review (convergent code review)

- [ ] Load review agent panel (configurable, defaults to full fv set)
- [ ] Max 4 review rounds with convergence
- [ ] Each round:
  1. Inspect diff against plan + impact artifact
  2. Launch review agents (parallel for <=5, serial for 6+)
  3. Run Laravel-specific agents mandatorily
  4. Identify P1-P3 findings
  5. Apply fixes unless excluded
  6. Run impact assessment for newly touched areas
  7. Update plan if implementation drifted
- [ ] Convergence: stop when no new actionable findings
- [ ] Output: resolved findings, excluded findings, plan deltas, impact misses
- [ ] P1 findings block merge

##### 2.6 /fv:plan-sync

- [ ] Compare plan artifact against actual implementation
- [ ] Update plan sections that drifted during work/review
- [ ] Sync plan index (_index.md)
- [ ] Update docs/ai/current-work.md
- [ ] Update docs/handoffs/latest.md
- [ ] Set plan status to `synced`

##### 2.7 /fv:start-session

- [ ] Read repo truth in source-of-truth order (all 11 levels)
- [ ] Detect repo layer health (missing docs/ai/? Missing plans/_index.md?)
- [ ] Identify active task/plan if any
- [ ] Check GitNexus availability; if missing, recommend + offer install (record decision)
- [ ] Check Boost availability; if missing in Laravel repo, suggest once (record decision)
- [ ] Output: session brief, warnings, recommended next command

##### 2.8 /fv:compound

Fork CE's ce:compound:

- [ ] Parallel subagents: context analyzer, solution extractor, related docs finder, prevention strategist, category classifier
- [ ] Write to docs/solutions/<category>/ with YAML frontmatter
- [ ] Only orchestrator writes files (Phase 2 discipline)

##### 2.9 /fv:close-task

- [ ] **Blocking gate**: refuse to close if:
  - Plan not synced (status != synced)
  - Unresolved P1 findings exist
  - Handoff not updated
- [ ] Verify plan sync completed
- [ ] Verify current-work.md updated
- [ ] Verify handoff freshness
- [ ] Summarize: what changed, next prompt, next likely step
- [ ] Suggest worktree cleanup/archive if applicable
- [ ] Set plan status to `closed`

##### 2.10 /fv:repo-catchup

- [ ] Scan repo structure and existing docs/plans
- [ ] Create/refresh docs/ai/* (architecture, conventions, repo-map, current-work)
- [ ] Create/refresh plans/_index.md
- [ ] Classify existing plans: current, historical, superseded, abandoned, dead
- [ ] Add frontmatter to legacy plans (title, status, created_at, last_verified_at, canonical, superseded_by)
- [ ] Move superseded/dead plans to plans/archive/
- [ ] Infer likely current work
- [ ] Identify risky legacy zones
- [ ] Mark human-confirmation gaps (flag uncertainty, don't invent truth)
- [ ] Detect Laravel: check for Boost, suggest if appropriate
- [ ] Detect GitNexus: recommend if not present

##### 2.11 /fv:deepen-plan

Fork CE's deepen-plan:

- [ ] Mandatory after initial plan + first review + first impact
- [ ] Push beyond first-pass planning
- [ ] Surface hidden complexity
- [ ] Challenge assumptions with evidence from impact
- [ ] Explore simplifications
- [ ] Feed into later review and impact rounds

**Phase 2 success criteria:**
- [ ] All 9 commands + deepen-plan are fully functional
- [ ] Planning pipeline runs all 9 phases with convergence
- [ ] Review pipeline runs with max 4 rounds and convergence
- [ ] Impact artifacts track round-over-round depth
- [ ] Exclusions stored structurally in plan frontmatter
- [ ] Plan lifecycle works: draft -> locked -> implementing -> synced -> closed
- [ ] /fv:close-task blocks on unresolved P1s or stale plan

---

#### Phase 3: Hardening

**Goal:** Mature system with deep integration and multi-repo support.

##### 3.1 GitNexus deep integration

- [ ] Configure GitNexus MCP server in `.mcp.json`
- [ ] Set up continuous file watcher for incremental graph updates
- [ ] Configure PreToolUse hooks to enrich grep/glob/bash with graph context
- [ ] Update impact-assessment-agent to make direct MCP queries for:
  - Dependency graphs (who calls this? what does this call?)
  - Blast radius (what breaks if this changes?)
  - Dead code detection (unreachable nodes)
- [ ] /fv:start-session checks GitNexus availability, offers install if missing

##### 3.2 Boost-aware behavior

- [ ] Detect Laravel Boost installation (check composer.json/lock)
- [ ] If installed: read Boost outputs as additional signal source
- [ ] Extend Boost files with fv sections using `<!-- fv:start -->` / `<!-- fv:end -->` delimiters
- [ ] If not installed: suggest once on /fv:start-session or /fv:repo-catchup
- [ ] Record Boost decision in docs/ai/conventions.md (never ask again)

##### 3.3 Multi-repo orchestration

- [ ] Detect related repos (composer.json dependencies pointing to local paths or owned GitHub repos)
- [ ] Track cross-repo impact in impact artifacts (dependencies, shared interfaces, package versions)
- [ ] Support plan references to work in other repos
- [ ] Handle git workflows for: apps (PR to dev), packages (PR to main), package forks (PR to fork, never upstream)

##### 3.4 Hook enforcement

Create `hooks/hooks.json`:

- [ ] **SessionStart hook**: Check repo memory exists, active plan matches current-work.md, recommend catch-up if needed
- [ ] **Workflow boundary warnings**: At /fv:review, /fv:close-task, /fv:plan-sync - warn if plan/impact/handoff are stale relative to code changes
- [ ] **Close-task gate**: Block (not just warn) if plan not synced, P1s unresolved, or handoff not updated
- [ ] All hooks warn-first except close-task gate

##### 3.5 Worktree adapter

- [ ] Define adapter contract: create(taskSlug, branchType), list(), switch(name), remove(name), active()
- [ ] Wrap user's custom shell scripts (create, list, switch, remove)
- [ ] /fv:plan prompts for worktree creation, records choice in plan frontmatter
- [ ] /fv:work verifies correct worktree context
- [ ] /fv:close-task suggests worktree cleanup/archive
- [ ] Adapter handles branch naming per user's git workflow (conventional branches from dev)

##### 3.6 Stronger repo archaeology

- [ ] Deeper plan classification heuristics for legacy repos
- [ ] Cross-reference git history with plan dates for better classification
- [ ] Detect common Laravel patterns (admin/user parity, multi-tenancy, API versioning)
- [ ] Build richer repo-map.md with risk zones and ownership hints

##### 3.7 Improved synthesis and watchlists

- [ ] Synthesis agent produces structured watchlist from review findings
- [ ] Watchlist persists across rounds and informs next impact depth
- [ ] Auto-generate "what to watch for" section in handoff documents

**Phase 3 success criteria:**
- [ ] GitNexus enriches all agent discovery via PreToolUse hooks
- [ ] Impact agent uses direct graph queries for dependency/blast-radius
- [ ] Boost files extended without conflicts
- [ ] Multi-repo impact tracked in artifacts
- [ ] Hooks enforce freshness at boundaries, block on close-task
- [ ] Worktree adapter wraps custom scripts correctly
- [ ] Legacy repos normalize faster with richer archaeology

---

## Acceptance Criteria

### Functional Requirements

- [ ] Plugin installs and appears in marketplace
- [ ] All 9 workflow commands execute their full pipelines
- [ ] Planning pipeline runs 0-8 phases with convergent review (max 4 rounds)
- [ ] Impact artifacts track discovery at 5 depth levels with 4 confidence categories
- [ ] Review pipeline runs with convergence and per-round impact
- [ ] Laravel-specific review agents fire mandatorily during plan and review
- [ ] Plan lifecycle manages: draft -> in_review -> locked -> implementing -> synced -> closed
- [ ] Exclusions stored in plan frontmatter, not raised repeatedly
- [ ] Repo layer scaffolded on first use (user prompted)
- [ ] Session start hydrates full context from source-of-truth order
- [ ] Close-task blocks on unresolved P1s or stale plan sync

### Non-Functional Requirements

- [ ] Agent namespaces use `fuelviews-engineering:<category>:<name>` format
- [ ] All skill references use markdown links (not bare backticks)
- [ ] Skills use AskUserQuestion for blocking questions
- [ ] Hooks are warn-first (except close-task gate)
- [ ] No CE agent modifications - curated copies only
- [ ] Spatie guidelines distilled into actionable reference docs
- [ ] Templates produce valid YAML frontmatter

### Quality Gates

- [ ] `bun run release:validate` passes
- [ ] All agent YAML frontmatter validates
- [ ] All SKILL.md frontmatter validates
- [ ] Plugin manifest matches component counts
- [ ] README.md reflects accurate agent/skill inventory

## Dependencies & Prerequisites

| Dependency | Type | Status |
|------------|------|--------|
| Compound Engineering plugin | Internal | Available (v2.49.0) |
| GitNexus | External | Needs setup per repo |
| Laravel Boost | External | Optional, detected at runtime |
| Custom worktree scripts | External | User provides create/list/switch/remove |
| Spatie guidelines | External | Fetch and distill during Phase 1 |
| context7 MCP server | External | Already configured in CE |

## Risk Analysis & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Skill size exceeds context limits | P2 | Use references/ for large content, keep SKILL.md focused on orchestration |
| GitNexus not available in all repos | P3 | Impact system works without graph (falls back to grep/glob discovery) |
| Agent panel too large for parallel dispatch | P2 | Auto-serial mode for 6+ agents (following CE pattern) |
| Plan/impact artifacts get large | P3 | Keep artifacts focused, archive old rounds |
| Boost files conflict on regeneration | P2 | Use `<!-- fv:start/end -->` markers, never modify outside markers |
| Multi-repo orchestration complexity | P2 | Phase 3 priority, single-repo must work perfectly first |
| Worktree adapter script incompatibility | P3 | Adapter contract is minimal (4 operations), easy to wrap |

## Future Considerations

- **AI model improvements**: As models get better context handling, some discovery work may simplify
- **Graph tool alternatives**: Adapter pattern for GitNexus means other graph tools (code-review-graph, RepoGraph) could be swapped in
- **Team collaboration**: Multi-user plan/review workflows where different people own different phases
- **CI integration**: Hooks that run impact assessment on PR creation
- **Metrics dashboard**: Track planning accuracy, review convergence rates, impact discovery effectiveness

## Documentation Plan

- [ ] Plugin README.md with full component inventory and usage guide
- [ ] AGENTS.md with plugin development conventions
- [ ] Each skill's SKILL.md serves as its own documentation
- [ ] Reference docs serve as agent knowledge base
- [ ] Update root marketplace README if applicable

## References & Research

### Internal References

- Brainstorm: `docs/brainstorms/2026-03-22-fuelviews-engineering-plugin-brainstorm.md`
- Master plan: `MASTER-PLAN.md`
- CE plugin structure: `plugins/compound-engineering/`
- CE planning skill: `plugins/compound-engineering/skills/ce-plan/SKILL.md`
- CE work skill: `plugins/compound-engineering/skills/ce-work/SKILL.md`
- CE review skill: `plugins/compound-engineering/skills/ce-review/SKILL.md`
- CE compound skill: `plugins/compound-engineering/skills/ce-compound/SKILL.md`
- CE brainstorm skill: `plugins/compound-engineering/skills/ce-brainstorm/SKILL.md`
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

### Key Decisions from Brainstorm

| # | Decision |
|---|----------|
| 1 | Fork as new plugin in this repo |
| 2 | Build everything, Section 22 order |
| 3 | Impact artifacts as separate files linked from plan |
| 4 | Laravel quality: mandatory in pipeline + standalone |
| 5 | Curate CE agents (drop Ruby/Python-specific) |
| 6 | Prompt user on repo bootstrap |
| 7 | Spatie guidelines fetched and distilled |
| 8 | fv:plan, fv:work, fv:review naming (colon separator) |
| 9 | GitNexus from Phase 1 |
| 10 | Boost: extend with <!-- fv:start/end --> markers |
| 11 | Worktree adapter wraps custom scripts |
| 12 | GitNexus: continuous watcher + PreToolUse hooks + direct queries |
| 13 | Hooks: warn at boundaries, block on close-task only |
| 14 | Full multi-repo orchestration |
| 15 | Boost delimiters: <!-- fv:start/end --> |
| 16 | GitNexus setup: recommend + offer install |
