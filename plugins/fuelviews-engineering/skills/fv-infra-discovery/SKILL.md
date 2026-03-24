---
name: fv-infra-discovery
description: Discover reusable infrastructure in a Laravel codebase. Use before planning to prevent code drift.
context: fork
agent: Explore
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(ast-grep *), Bash(git *)
effort: medium
argument-hint: "[feature description]"
---

# Infrastructure Discovery

Discover all existing reusable infrastructure this feature should leverage instead of creating from scratch. The goal is to prevent code drift and duplication.

## Feature

$ARGUMENTS

## Tools (use in this priority order)

1. **GitNexus** (if `.gitnexus/` exists): `gitnexus_query` for execution flows, `gitnexus_cypher` for graph queries, `gitnexus_context` for symbol details, `gitnexus://repo/{name}/clusters` for functional areas. Most accurate — understands call relationships and inheritance.
2. **`ast-grep`** (via shell): Use for structural pattern matching that Grep can't do. Examples:
   - Find all classes extending Model: `ast-grep -p 'class $NAME extends Model' --lang php`
   - Find all invokable controllers: `ast-grep -p 'public function __invoke($_$)' --lang php`
   - Find all classes implementing ShouldQueue: `ast-grep -p 'class $NAME implements $$$ShouldQueue$$$' --lang php`
   - Find all enums: `ast-grep -p 'enum $NAME' --lang php`
   - Find React components: `ast-grep -p 'export function $NAME($$$)' --lang tsx`
   - Find hooks: `ast-grep -p 'export function use$NAME($$$)' --lang tsx`
   Run one `ast-grep` command at a time, no chaining.
3. **Native tools** (Glob, Grep, Read): For file discovery by path pattern and text content search. Use as supplement to the above, not primary.

## Tool Selection Rules

- Prefer native Glob over `find` — avoids permission prompts in subagent workflows
- Prefer native Grep over `grep -r` via shell — returns structured results, no parsing needed
- Prefer native Read over `cat`/`head`/`tail` — no permission prompts
- Do NOT use shell pipelines (`find | grep | wc`) — use multiple native tool calls instead
- Do NOT use `for f in $(find ...)` shell loops — use Glob then Read
- Shell is appropriate for: `ast-grep`, `git`, `composer`, `npm`, `artisan` commands (one at a time, no chaining)

## Categories to Discover (skip empty ones)

### Laravel Backend
- Models — relationships, scopes, casts, observers, policies, factories
- Enums — statuses, types, categories, roles
- Config files — existing keys, env vars, feature flags
- Middleware — auth, tenant scoping, rate limiting, middleware groups
- Policies and gates
- Events, listeners, and subscribers
- Jobs — queue infrastructure, retry configs, unique locks
- Form requests — shared validation rules, base classes, rule traits
- Notifications and mailables — channels, base classes
- Services, actions, helpers, and traits
- Custom Eloquent casts
- Artisan commands — signatures, scheduling
- Factories and seeders
- Routes — groups, middleware stacks, prefixes
- Base classes and inheritance chains

### Blade / Livewire / Alpine
- Layouts (`resources/views/layouts/`)
- Partials and shared sections
- Blade components (class-based and anonymous)
- Livewire components and their state/actions
- Alpine.js component patterns

### JavaScript / TypeScript / React (check `package.json` first)
- Shared components (`Components/`, `components/`, `src/components/`)
- Hooks and composables (`hooks/`, `composables/`)
- State management stores (Zustand, Pinia, Redux, etc.)
- Utility and helper modules (`utils/`, `lib/`, `helpers/`)
- API client and fetch wrappers
- TypeScript types and interfaces (`types/`, `interfaces/`)
- Layout components and shared UI primitives
- Existing page components for the same domain

### Installed Packages
- `composer.json` require — packages that already provide needed capabilities
- `package.json` dependencies — npm packages for UI, utilities, integrations
- Package recommendations — well-maintained packages that could replace custom code

## Return Format

Structured summary with categories as headers. Each item: `- file/path — what it does / why it's relevant to this feature`. Target under 200 lines. Skip empty categories. End with a Packages section.

Do NOT return raw query results, full file contents, or verbose listings.
