Fuelviews Engineering Master Plan

1. Vision

Fuelviews Engineering (fv) is a forked Compound Engineering workflow for Claude Code.

Its job is to make AI-assisted development more reliable in large, messy, long-lived repos by combining:
•	a global base layer for consistent behavior across repos
•	a repo layer for durable project truth
•	a forked CE workflow with stronger planning and review discipline
•	layered impact discovery before and during work
•	Laravel-specific quality checks and Boost awareness
•	a catch-up path for old repos with scattered plans and stale docs
•	your custom worktree solution for task isolation

The goal is not to make the AI “remember harder.”
The goal is to make the system itself carry memory, enforce planning quality, reduce drift, and keep future sessions from starting blind.

2. Core Problems This Solves

2.1 Session drift

AI loses continuity between sessions unless continuity is stored in files and workflow state.

2.2 Stale plans

Plans often stop matching reality after implementation and review.

2.3 Sprawling repos

Important behavior is spread across routes, components, actions, policies, jobs, events, admin paths, tests, and legacy code.

2.4 Inconsistent quality

Without explicit rules, the AI may place logic in inconsistent layers or miss conventions.

2.5 Legacy repo chaos

Old repos often contain archived plans, dead docs, duplicate code paths, unclear ownership, and no canonical truth.

2.6 Rework

Weak scoping and weak review cause missed dependencies, poor boundaries, and repeated fixes.

3. Design Principles
    1.	Repo truth beats chat history.
    2.	Plans remain living documents until after review and sync.
    3.	Impact discovery is evidence-based, layered, and honest about uncertainty.
    4.	Review is convergent, not blind looping.
    5.	The system should try to find everything it can, while tracking what is still uncertain.
    6.	The repo should get smarter after each task.
    7.	Laravel conventions and best practices should be checked explicitly.
    8.	Worktree isolation should be part of the workflow, not an afterthought.

4. High-Level Architecture

4.1 Base layer: global machine-level config

Lives in ~/.claude/.

Purpose:
•	personal defaults
•	reusable workflow rules
•	Laravel defaults
•	bootstrap / catch-up helpers
•	global skills and settings

Suggested structure:

~/.claude/
CLAUDE.md
rules/
00-workflow.md
10-laravel-defaults.md
20-review-policy.md
skills/
fv-bootstrap-repo/
fv-catchup-repo/
fv-start-session/
settings.json

4.2 Plugin layer: Fuelviews fork

This is the fork of Compound Engineering.

Purpose:
•	own the workflow commands
•	own the review/impact/planning pipeline
•	own subagents and synthesis
•	own hook behavior
•	distribute as an installable plugin/marketplace package

Suggested structure:

fuelviews-marketplace/
.claude-plugin/marketplace.json
plugins/
fuelviews-engineering/
.claude-plugin/plugin.json
skills/
agents/
hooks/
templates/
README.md

4.3 Repo layer: committed project truth

Lives inside each repo.

Purpose:
•	architecture memory
•	current work state
•	canonical plans and plan index
•	handoffs
•	conventions
•	repo map
•	risk zones

Suggested structure:

repo/
CLAUDE.md
.claude/
rules/
settings.json
docs/
ai/
README.md
architecture.md
conventions.md
repo-map.md
current-work.md
handoffs/
latest.md
decisions/
ADR-0001-*.md
plans/
_index.md
active/
archive/

4.4 Graph and impact layer

Purpose:
•	code discovery
•	dependency tracing
•	blast-radius mapping
•	watchlist generation
•	uncertainty tracking

This includes:
•	repo graph/index integration where available
•	cached repo map in docs
•	impact artifacts generated during planning and review

4.5 Laravel intelligence layer

Purpose:
•	conventions and best practices
•	dead/unused/duplicate checks
•	Livewire / Filament boundaries
•	Boost detection and setup

4.6 Worktree layer

Purpose:
•	task isolation
•	consistent task/worktree lifecycle
•	safer experimentation and implementation
•	clean mapping from plan/task to working tree

This will use your custom worktree solution via an adapter contract.

5. Canonical Source-of-Truth Order

The system should trust sources in this order:
1.	repo CLAUDE.md
2.	docs/ai/current-work.md
3.	plans/_index.md
4.	active canonical plan
5.	active impact artifact
6.	docs/handoffs/latest.md
7.	docs/ai/architecture.md
8.	docs/ai/conventions.md
9.	docs/ai/repo-map.md
10.	ADRs / decisions
11.	archived plans only when needed for history

6. Primary Workflow Commands

6.1 /fv-start-session

Purpose:
•	hydrate context
•	detect repo health
•	identify active task/plan if any
•	recommend next safe step

Reads:
•	repo CLAUDE.md
•	docs/ai/current-work.md
•	plans/_index.md
•	active plan if present
•	latest handoff
•	architecture / conventions / repo map

Outputs:
•	session brief
•	warnings
•	recommended next command

6.2 /fv-plan <task>

Purpose:
•	main entrypoint for new non-trivial work
•	wraps the CE planning workflow with Fuelviews logic

Internally includes:
•	task intake
•	initial impact
•	plan v1
•	plan review round 1
•	impact assessment round 1
•	deepen-plan
•	further plan-review rounds
•	deeper impact each round
•	deepest impact on finalized plan
•	plan lock

6.3 /fv-impact <task>

Purpose:
•	standalone manual diagnostic tool
•	inspect or refresh blast radius outside the full planning path

Used for:
•	debugging scope
•	checking drift
•	comparing alternative approaches
•	refreshing stale plan assumptions

6.4 /fv-work

Purpose:
•	implement against the locked plan
•	monitor for material drift
•	trigger impact deltas if scope expands

6.5 /fv-review

Purpose:
•	run convergent code review
•	apply P1–P3 fixes unless excluded
•	run impact assessment every review round
•	reconcile missed scope

6.6 /fv-plan-sync

Purpose:
•	update the active plan so it matches implementation and review outcomes
•	sync plan index, current work, and handoff

6.7 /fv-compound

Purpose:
•	update reusable learnings
•	preserve valuable patterns for later tasks/sessions

6.8 /fv-close-task

Purpose:
•	final closure check
•	verify plan sync and handoff freshness
•	summarize next prompt / next likely step

6.9 /fv-repo-catchup

Purpose:
•	normalize a legacy repo that has missing docs, scattered plans, stale artifacts, and unclear structure

7. Detailed Planning Pipeline

For non-trivial work, /fv-plan <task> follows this internal sequence.

Phase 0: task intake
•	normalize user request into a task statement
•	create task slug / task record
•	load repo truth

Phase 1: initial impact

Purpose:
•	broad task-based discovery
•	identify likely entry points, edit set, read set, watchlist, risks, and blind spots

Output:
•	initial impact artifact
•	seed data for plan v1

Phase 2: plan v1

Purpose:
•	produce first concrete implementation approach

Output:
•	active plan draft

Phase 3: plan review round 1

Purpose:
•	pressure-test the plan with reviewers
•	find P1–P3 issues

Phase 4: impact assessment round 1

Purpose:
•	compare plan v1 plus review findings against repo reality
•	discover additional dependencies, flows, and risks
•	update plan deltas

Phase 5: deepen-plan

Purpose:
•	stress-test assumptions
•	compare alternate approaches
•	explore hidden risk and simplification opportunities

Phase 6: plan review rounds 2–4

Rules:
•	maximum 4 total plan-review rounds
•	stop early on convergence
•	impact assessment every round
•	impact gets deeper each round
•	update plan incrementally when new scope/risk is found

Phase 7: finalized-plan deepest impact

Purpose:
•	run the deepest impact analysis against the actual finalized plan
•	verify final implementation contract before coding begins

Phase 8: plan lock

Purpose:
•	freeze plan as the implementation contract
•	write final plan artifact, final impact artifact, final watchlist, final blind spots

8. Planning Convergence Rules

Hard limits
•	maximum 4 plan-review rounds

Round policy
•	impact assessment every round
•	each round’s impact is deeper than the prior one
•	deepest impact happens on the finalized plan

Stop conditions

Stop early if:
•	no new actionable P1–P3 findings remain
•	remaining items are excluded
•	later rounds only restate the same findings without stronger evidence or severity

Re-run conditions

A new/deeper impact pass is justified when:
•	the plan materially changes
•	a new domain/module enters scope
•	a new side effect path appears
•	admin/user parity changes
•	sync vs async changes
•	policy/validation path changes
•	migration/runtime dependency is introduced

9. Detailed Review Pipeline

For non-trivial work, /fv-review follows this internal sequence.

Review round rules
•	maximum 4 review rounds
•	impact assessment every round
•	deeper impact each round
•	stop early on convergence

Each review round does:
1.	inspect current diff against active plan and impact artifact
2.	identify P1–P3 findings
3.	apply fixes unless explicitly excluded
4.	run impact assessment for newly discovered touched areas
5.	update plan if implementation drifted or review found missed scope

Final review outcome

Outputs:
•	resolved findings
•	open excluded findings
•	plan deltas
•	impact misses
•	updated test/risk notes

10. Impact Assessment Design

Impact assessments are not passive reports.
They are state-changing checkpoints.

Each impact assessment does two jobs:
1.	discover/validate scope
2.	update plan state and guide the next agent/reviewer step

Discovery categories

Each impacted item should be classified as:
•	definite
•	probable
•	possible
•	blind spot / unresolved

Output sets

Each impact artifact should include:
•	definite edit set
•	definite read set
•	watchlist
•	blind spots
•	evidence notes
•	confidence notes
•	tests likely affected
•	risks

What impact uses
•	routes
•	controllers
•	Livewire components
•	Filament resources/pages/actions
•	models
•	actions/services
•	policies
•	requests/validation
•	jobs/events/listeners
•	config references
•	service providers
•	traits/interfaces
•	similar flows
•	tests
•	dead/duplicate candidates nearby

Depth per round
•	round 0: broad structural discovery
•	round 1: plan-aware dependency discovery
•	round 2: deeper Laravel wiring / side-effect discovery
•	round 3: deeper duplicate/legacy/admin parity/test coverage discovery
•	round 4 / final: deepest finalized-plan contract validation

Plan updates from impact

Impact can update:
•	scope
•	files to read/edit/watch
•	tests required
•	risks/open questions
•	architecture notes
•	implementation steps
•	side-effect notes
•	confidence / blind spot notes

11. deepen-plan Role

deepen-plan is mandatory after:
•	initial plan
•	first plan review
•	first impact follow-up

Purpose:
•	push beyond first-pass planning
•	surface hidden complexity
•	challenge assumptions
•	explore simplifications
•	identify alternate safer approaches

It feeds:
•	later plan-review rounds
•	later deeper impact rounds

12. Severity and Exclusions Policy

Severity levels

P1
Correctness/security/data-loss/broken-behavior level issues.

P2
Architecture/maintainability/test gaps that materially increase risk.

P3
Consistency/simplification/DRY/best-practice improvements worth fixing by default.

Policy
•	fix P1–P3 by default
•	user may exclude specific findings
•	exclusions must be stored structurally, not only in chat

Exclusion handling

Excluded findings must:
•	stay visible as deferred exceptions
•	not be repeatedly raised as unresolved every round
•	remain part of final plan/review history

13. Artifact and File Schema

13.1 Active plan

Suggested location:

plans/active/<task-slug>.plan.md

Suggested frontmatter:

title: Subscription pause flow
status: in_review
canonical: true
review_rounds_completed: 2
max_review_rounds: 4
converged: false
excluded_improvements: []

Key sections:
•	task
•	goal
•	acceptance criteria
•	architecture decisions
•	implementation steps
•	test plan
•	risks
•	review deltas
•	deferred/excluded items

13.2 Impact artifact

Suggested location:

plans/active/<task-slug>.impact.md

Key sections:
•	task
•	round number
•	confidence summary
•	definite edit set
•	definite read set
•	watchlist
•	blind spots
•	evidence notes
•	tests impacted
•	risks
•	what changed since prior impact round

13.3 Plan index

Suggested location:

plans/_index.md

Tracks:
•	plan title
•	file
•	status
•	canonical yes/no
•	created date
•	last verified date
•	superseded by
•	notes

13.4 Current work

Suggested location:

docs/ai/current-work.md

Tracks:
•	active task
•	active plan
•	recent changes
•	next likely step
•	open risks

13.5 Handoff

Suggested location:

docs/handoffs/latest.md

Tracks:
•	what changed
•	files touched
•	decisions made
•	remaining work
•	next prompt

14. Legacy Repo Catch-Up Plan

Goals
•	infer structure
•	infer conventions
•	classify old plans
•	identify likely current work
•	normalize docs and plan registry
•	flag uncertainty instead of inventing truth

Catch-up flow
1.	scan repo structure and existing docs/plans
2.	create/refresh docs/ai/*
3.	create/refresh plans/_index.md
4.	classify plans
5.	move superseded/dead plans to archive
6.	infer likely current work
7.	identify risky legacy zones
8.	mark human-confirmation gaps

Plan classification buckets
•	current
•	historical
•	superseded
•	abandoned
•	dead

Plan frontmatter for legacy plans

Include fields like:
•	title
•	status
•	created_at
•	last_verified_at
•	canonical
•	superseded_by
•	implemented_in
•	reviewed_in

15. Laravel Quality Layer

15.1 Dead / unused checks

Look for:
•	unused classes
•	orphaned actions
•	stale jobs/listeners
•	stale views/components
•	dead helpers
•	dead plan files

15.2 Duplicate / DRY checks

Look for:
•	repeated validation logic
•	repeated authorization logic
•	repeated query fragments
•	repeated orchestration across user/admin flows
•	repeated transformations

15.3 Laravel conventions

Check for:
•	fat controllers
•	business logic in Blade
•	business logic in Livewire state/methods
•	business logic buried in Filament closures
•	repeated query logic outside scopes/query objects
•	policy bypasses
•	validation in the wrong layer

15.4 Best practices

Check for:
•	feature tests for user-visible behavior
•	authorization coverage
•	request validation
•	safe migration patterns
•	explicit domain/service boundaries
•	idempotent async side effects where needed

These checks should run during both planning and review.

16. Laravel Boost Integration

Detection

A repo supports Boost if it is a Laravel app/package with Composer/PHP/Artisan available or clearly supports Laravel integration.

Behavior

During bootstrap/catch-up:
1.	detect Laravel
2.	detect whether Boost is installed
3.	if not installed and repo supports it, recommend setup
4.	if approved, install/setup Boost
5.	keep Boost-generated content separate from Fuelviews repo-memory content

Policy

If Boost is installed:
•	use it as an additional Laravel-aware signal source
•	do not overwrite Boost-specific guidance files with Fuelviews files
•	layer repo truth on top of it

17. Worktree Integration Plan

Fuelviews should integrate your custom worktree solution through an adapter contract.

Goals
•	one task maps cleanly to one isolated working environment
•	reduce branch/task collision
•	make work/review safer
•	support task-specific plans and implementation state

Required adapter capabilities
•	create/select worktree for task slug
•	report active worktree
•	map task to worktree path
•	optional cleanup/archive hook

Workflow expectations
•	/fv-plan <task> may create or bind a worktree
•	/fv-work should operate in the correct task context
•	/fv-close-task can suggest cleanup/merge/archive actions

18. Hooks and Freshness Enforcement

SessionStart hook

Check:
•	repo memory exists
•	active plan exists if current work says so
•	repo needs catch-up or not

PostToolUse hook

Warn if code changed but none of these changed:
•	active plan
•	impact artifact
•	plans/_index.md
•	docs/ai/current-work.md
•	docs/handoffs/latest.md

Close-task readiness check

Verify:
•	unresolved P1–P3 findings
•	plan sync completed
•	current work updated
•	handoff updated

Hooks should be warn-first, not block-first.

19. Subagents and Review Roles

Suggested planning/review panel:
•	architecture reviewer
•	Laravel conventions reviewer
•	security/data reviewer
•	testing/reliability reviewer
•	simplicity/DRY reviewer
•	dead/unused reviewer
•	synthesis agent

Purpose:
•	parallel specialized review
•	dedupe findings
•	synthesize severity, evidence, and next actions

20. Rollout Plan

Phase 1: scaffold and baseline

Build:
•	plugin scaffold
•	command specs
•	base layer templates
•	repo layer templates
•	catch-up skeleton
•	summary/guide docs
•	worktree adapter contract

Outcome:
•	usable skeleton
•	not fully automated

Phase 2: workflow intelligence

Build:
•	active plan and impact artifact schemas
•	/fv-plan internal phases
•	convergent plan-review logic
•	convergent review logic
•	exclusions handling
•	plan-sync logic
•	Laravel checks

Outcome:
•	real repeatable workflow

Phase 3: hardening

Build:
•	deeper graph integration
•	stronger repo archaeology
•	Boost-aware behavior
•	better hook enforcement
•	richer worktree automation
•	improved synthesis and watchlists

Outcome:
•	mature system

21. Success Criteria

Fuelviews is succeeding when:
•	sessions restart with less confusion
•	plans stay aligned with implementation after review
•	fewer dependencies are missed during coding
•	fewer stale plans pollute future sessions
•	legacy repos become understandable faster
•	Laravel layering becomes more consistent
•	duplicate/dead logic gets caught earlier
•	worktree-based task isolation reduces collisions and confusion

22. What to Build First

Recommended build order:
1.	master repo/base/plugin scaffolds
2.	active plan + impact artifact schemas
3.	/fv-plan internal planning phases
4.	/fv-plan-sync
5.	/fv-review convergence model
6.	/fv-repo-catchup
7.	Laravel checks
8.	worktree adapter integration
9.	Boost-aware enhancements

23. Short Internal Pitch

Fuelviews Engineering is Compound Engineering hardened for real repos.

It gives us:
•	stronger planning
•	stronger impact discovery
•	deeper review
•	less stale context
•	better Laravel consistency
•	better continuity across sessions
•	cleaner task isolation

In practice, that should mean:
•	fewer wrong turns
•	fewer missed dependencies
•	less rework
•	more consistent code
•	better use of AI across messy real-world repos

24. Final Rule

A task is not done when the code compiles.
A task is done when:
•	the plan matches reality
•	review findings are resolved or explicitly deferred
•	impact discoveries have been reconciled
•	repo memory is updated
•	the next session can start from truth instead of guesswork

https://spatie.be/guidelines/ai
https://spatie.be/guidelines/security
https://spatie.be/guidelines/laravel
https://spatie.be/guidelines/javascript

We generally use postgresql locally and on production, and laravel forge for production

🥇 GitNexus — Best Overall for Claude Code
github.com/abhigyanpatwari/GitNexus & github.com/nxpatterns/gitnexus
GitNexus is a client-side knowledge graph creator that runs entirely in your browser — drop in a GitHub repo or ZIP file and get an interactive knowledge graph with a built-in Graph RAG Agent. GitHub It has the deepest Claude integration of any tool in this space: Claude Code gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that automatically enrich grep/glob/bash calls with knowledge graph context. GitHub

🥈 RepoGraph — Best for Research / SWE-Bench Tasks
github.com/ozyyshr/RepoGraph (the one you linked)
RepoGraph operates at the line level, offering a more fine-grained approach compared to previous file-level browsing methods. Each node in the graph represents a line of code, and edges represent the dependencies of code definitions and references. arXiv It's a plug-in module used in academic research; RepoGraph substantially boosts the performance of all systems, leading to a new state-of-the-art among open-source frameworks OpenReview on SWE-bench.

🥉 code-review-graph — Best for Claude Code Token Efficiency
github.com/tirth8205/code-review-graph
A local knowledge graph for Claude Code that builds a persistent map of your codebase so Claude reads only what matters — 6.8× fewer tokens on reviews and up to 49× on daily coding tasks. GitHub Highly practical if you're doing ongoing development with Claude Code.

Also Worth Knowing:
Code-Graph-RAG (vitali87/code-graph-rag) — Can run as an MCP server, enabling seamless integration with Claude Code and other MCP clients. GitHub Supports Python, JS/TS, Rust, Go, Java, C/C++, and more. Great for natural-language-to-Cypher graph querying.
Understand-Anything (Lum1104/Understand-Anything) — A Claude Code skill that turns any codebase into an interactive knowledge graph you can explore, search, and ask questions about, with auto-generated walkthroughs of the architecture ordered by dependency. GitHub
Repomix (yamadashy/repomix) — Not strictly a grapher, but packs your entire repository into a single AI-friendly file, perfect for feeding your codebase to LLMs like Claude. GitHub Best for one-shot context injection.

TL;DR recommendation: If you're using Claude Code day-to-day, go with GitNexus or code-review-graph. If you're doing AI software engineering research (SWE-bench style), RepoGraph is the most rigorous. If you just need quick codebase context for Claude.ai chat, Repomix is the simplest.

When working on fuelviews repos/appss, our general git workflow, dev is the source of truth, worktrees, create conventional branch from dev, session/plan/work/etc/etc/etc, commit, push, pr into dev,
squash merge, checkout to dev, pull, checkout to main, pull, git rebase dev, git push, checkout to dev. if there are github actions that need to work, let them complete, if there is a changelog updater
workflow, let that complete post pr squash merge, and when you pull ensure it gets that update, if it doesnt, check if there is one and proceed based on info. Same workflow for packages, except you need
to pr into main, and wait for checks + changelog there. Package forks, same workflows as package, except never commit or pr into the upstream repo or branchm always to the forked one..