# Impact Assessment Depth Guide

Internal reference for impact-discovery depth levels used across review rounds.

---

## Depth Levels by Round

### Round 0 -- `broad`

Structural discovery. Enumerate top-level artifacts without tracing cross-file
interactions.

Targets:
- Route files (web.php, api.php, custom route service providers)
- Controllers (HTTP, API, invokable)
- Eloquent models and relationships
- Livewire components (full-page and nested)
- Filament resources, pages, widgets, relation managers
- Policies and gates
- Jobs, listeners, observers, notifications
- Middleware (global and route-level)
- Service providers (boot/register)
- Config files referenced by changed code

Output: flat list of potentially-affected files with depth=broad tag.

### Round 1 -- `plan-aware`

Plan-context dependency discovery. Use the plan's stated scope to focus the
search on files the plan intends to change or depend on.

Targets (in addition to Round 0 survivors):
- Explicit dependencies of planned changes (use statements, DI bindings)
- Route-model bindings touched by plan
- Form request validators for affected endpoints
- Blade/Livewire views rendered by affected controllers/components
- Database factories and seeders for affected models
- Migration files that define or alter affected tables

Output: dependency graph edges with `plan-aware` depth tag.

### Round 2 -- `deep-wiring`

Cross-file interaction effects. Trace how a change in file A propagates
through file B into file C.

Targets:
- Event dispatch chains (event -> listener -> side-effect)
- Observer hooks triggered by model changes
- Pipeline/middleware ordering effects
- Queued job chains and batch dependencies
- Cache invalidation paths
- Livewire event bus (dispatch/on, emit/listeners)
- Filament form save -> afterSave -> relation manager refresh

Output: interaction paths (A -> B -> C) with confidence classification.

### Round 3 -- `deep-legacy`

System-wide error propagation and state lifecycle. Look for failure modes,
implicit contracts, and long-lived state.

Targets:
- Exception handling gaps (uncaught in changed paths)
- Database transaction boundaries (missing or overly broad)
- Session and cache state lifecycle across request boundaries
- Scheduled task ordering when affected jobs change
- External service integration points (API clients, webhooks)
- Legacy code with no test coverage that shares tables/traits

Output: risk inventory with propagation vectors.

### Round 4 -- `contract-validation`

Final contract verification. Confirm every finding from prior rounds still
holds after plan revisions and deepen passes.

Targets:
- Re-verify all P1/P2 findings against current plan state
- Confirm interface contracts match implementations
- Validate route signatures match controller method signatures
- Check policy method coverage for all CRUD operations in scope
- Verify migration column types match model casts and form rules

Output: validated finding list with stale/confirmed status.

---

## Confidence Classification Rules

Each discovered impact gets exactly one confidence level.

### `definite`

Direct, statically-verifiable connection.

Criteria (any one sufficient):
- Direct `use` statement importing the changed class
- Direct method call on the changed class or its instance
- `extends` or `implements` the changed class/interface
- Route-model binding referencing the changed model
- Explicit DI type-hint for the changed class in a constructor or method

### `probable`

One degree of indirection, still deterministic at analysis time.

Criteria (any one sufficient):
- Event listener registered for an event dispatched by changed code
- Observer on a model that the changed code writes to
- Middleware in the same route group pipeline as changed routes
- Blade @include or @livewire directive embedding a changed component
- Filament relation manager attached to a changed resource

### `possible`

Indirect or pattern-based association, not statically provable.

Criteria (any one sufficient):
- Same trait used by both changed and discovered class
- Similar naming pattern suggesting shared domain (e.g., `OrderService` and `OrderExport`)
- Same database table accessed by a different model
- Config value referenced that could alter changed code behavior
- Shared cache key namespace

### `blind_spot`

Cannot be discovered by static analysis alone.

Indicators:
- Dynamic class instantiation (`app()->make($class)`, `resolve($binding)`)
- Reflection-based method calls
- External package hooks (e.g., Spatie event subscribers, Filament plugin hooks)
- Runtime config switches (`config('feature.flag')` toggling behavior)
- String-based class references in config or database rows
- Eval or dynamic route registration

When a blind spot is identified, log it in the plan watchlist. Do not mark
it as a finding -- mark it as a surveillance item for manual verification.

---

## Usage Notes

- Depth levels are cumulative: Round 2 includes all Round 0 and Round 1 targets.
- Each round adds its own depth tag; do not remove prior tags.
- Confidence classification applies at discovery time and can be upgraded
  (never downgraded) in later rounds if stronger evidence appears.
- Blind spots persist across all rounds until manually resolved.
