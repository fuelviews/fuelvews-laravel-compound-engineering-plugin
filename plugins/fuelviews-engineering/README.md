# Fuelviews Engineering Plugin

Laravel-focused engineering workflow with impact discovery, convergent review, layered planning, repo-layer truth, and worktree isolation.

**Requires:** [compound-engineering](../compound-engineering/) plugin installed alongside.

## Component Inventory

| Component | Count |
|-----------|-------|
| Agents | 10 |
| Skills | 13 |
| References | 17 |
| Templates | 9 |

## Agents

### Review Agents (8)

| Agent | Description |
|-------|-------------|
| php-reviewer | PSR-12, type safety, modern PHP patterns, error handling |
| laravel-reviewer | Fat controllers, service boundaries, Eloquent, middleware, policies |
| blade-reviewer | Template hygiene, component usage, XSS, Livewire/Alpine integration |
| javascript-reviewer | Alpine.js, Livewire interop, async handling, DOM safety |
| postgresql-reviewer | Query performance, indexes, N+1, transactions, JSON columns, migrations |
| laravel-conventions-reviewer | Spatie + alexeymezenin conventions, naming, config patterns |
| laravel-codebase-health-reviewer | Dead/unused code, orphaned actions, stale jobs/views, DRY violations |
| laravel-performance-reviewer | Eloquent eager loading, query optimization, cache strategy, queue performance |

### Workflow Agents (2)

| Agent | Description |
|-------|-------------|
| impact-assessment-agent | Evidence-based scope discovery, blast-radius mapping |
| synthesis-agent | Dedupe findings across reviewers, synthesize severity, next-action recommendations |

## Skills

| Skill | Name | Description |
|-------|------|-------------|
| fv-start-session | fv:start-session | Initialize session with repo truth, CE detection, reference freshness |
| fv-plan | fv:plan | Full planning pipeline with convergent review and deepening (9 phases) |
| fv-impact | fv:impact | Standalone impact assessment diagnostic |
| fv-work | fv:work | Implementation execution with plan-aware drift monitoring |
| fv-review | fv:review | Convergent code review with max 4 rounds |
| fv-plan-sync | fv:plan-sync | Reconcile plan artifacts against implementation reality |
| fv-close-task | fv:close-task | Close task with blocking gates on unresolved P1s |
| fv-repo-catchup | fv:repo-catchup | Normalize legacy repos with plan classification and doc refresh |
| fv-normalize | fv:normalize | Tiered codebase normalization using Pint, Rector, Larastan, and GitNexus |
| fv-brainstorm | fv:brainstorm | Explore requirements and approaches through collaborative dialogue before planning |
| fv-infra-discovery | fv-infra-discovery | Discover reusable infrastructure in a codebase (forked Explore agent) |
| laravel-conventions-ref | (background) | Laravel conventions reference preloaded into review agents |
| severity-policy-ref | (background) | Severity policy reference preloaded into review agents |

## References

| Reference | Description |
|-----------|-------------|
| spatie-laravel.md | Distilled Spatie Laravel guidelines |
| spatie-security.md | Distilled Spatie security guidelines |
| spatie-javascript.md | Distilled Spatie JavaScript guidelines |
| spatie-ai.md | Distilled Spatie AI guidelines |
| laravel-best-practices.md | Distilled alexeymezenin/laravel-best-practices |
| impact-depth-guide.md | Impact assessment depth per round (0-4) |
| convergence-rules.md | Planning/review stop conditions and max rounds |
| convergent-planning-loop.md | /fv:plan convergent loop orchestration |
| plan-finalization.md | /fv:plan finalization and lock flow |
| severity-policy.md | P1/P2/P3 definitions and exclusion rules |
| source-of-truth-order.md | Canonical trust hierarchy (11 levels) |
| worktree-adapter.md | Worktree contract with CE delegation and custom script support |
| multi-repo-orchestration.md | Cross-repo impact tracking, git workflow handling, fork safety |
| boost-integration.md | Laravel Boost detection, output reading, fv marker extension |
| repo-archaeology.md | Advanced plan classification, pattern detection, risk mapping |

## Templates

| Template | Description |
|----------|-------------|
| plan-artifact.md | Plan frontmatter + section skeleton |
| impact-artifact.md | Impact frontmatter + section skeleton |
| plan-index.md | docs/plans/_index.md table format |
| current-work.md | docs/ai/current-work.md format |
| handoff.md | docs/handoffs/latest.md format |
| repo-layer/ | Full docs/ai/ scaffold |

## CE Agents Referenced

This plugin references the following agents from the compound-engineering plugin:

| Agent | Namespace | Used By |
|-------|-----------|---------|
| architecture-strategist | compound-engineering:review: | fv:plan, fv:review |
| security-sentinel | compound-engineering:review: | fv:plan, fv:review |
| performance-oracle | compound-engineering:review: | fv:review |
| code-simplicity-reviewer | compound-engineering:review: | fv:plan, fv:review, fv:work |
| data-integrity-guardian | compound-engineering:review: | fv:review |
| pattern-recognition-specialist | compound-engineering:review: | fv:review |
| kieran-typescript-reviewer | compound-engineering:review: | fv:review (conditional) |
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
