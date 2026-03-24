---
name: fv:review
description: Perform exhaustive code reviews using multi-agent analysis, ultra-thinking, and worktrees
argument-hint: "[PR number, GitHub URL, branch name, or latest] [--serial] [--auto]"
---

# Review Command

<command_purpose> Perform exhaustive code reviews using multi-agent analysis, ultra-thinking, and Git worktrees for deep local inspection. </command_purpose>

## Introduction

<role>Senior Code Review Architect with expertise in security, performance, architecture, and quality assurance</role>

### Execution Modes

- `--auto`: Autonomous mode -- auto-fix P1/P2 without asking.
- `--serial`: Run agents sequentially.

## Prerequisites

<requirements>
- Git repository with GitHub CLI (`gh`) installed and authenticated
- Clean main/master branch
- Proper permissions to create worktrees and access the repository
- For document reviews: Path to a markdown file or document
</requirements>

## Main Tasks

### 1. Determine Review Target & Setup (ALWAYS FIRST)

<review_target> #$ARGUMENTS </review_target>

<thinking>
First, I need to determine the review target type and set up the code for analysis.
</thinking>

#### Immediate Actions:

<task_list>

- [ ] Determine review type: PR number (numeric), GitHub URL, file path (.md), or empty (current branch)
- [ ] Check current git branch
- [ ] If ALREADY on the target branch (PR branch, requested branch name, or the branch already checked out for review) → proceed with analysis on current branch
- [ ] If DIFFERENT branch than the review target → offer to use worktree: "Use git-worktree skill for isolated Call `skill: git-worktree` with branch name"
- [ ] Fetch PR metadata using `gh pr view --json` for title, body, files, linked issues
- [ ] Set up language-specific analysis tools
- [ ] Prepare security scanning environment
- [ ] Make sure we are on the branch we are reviewing. Use gh pr checkout to switch to the branch or manually checkout the branch.

Ensure that the code is ready for analysis (either in worktree or on current branch). ONLY then proceed to the next step.

</task_list>

#### Protected Artifacts

<protected_artifacts>
The following paths are compound-engineering pipeline artifacts and must never be flagged for deletion, removal, or gitignore by any review agent:

- `docs/brainstorms/*-requirements.md` — Requirements documents created by `/fv:brainstorm`. These are the product-definition artifacts that planning depends on.
- `docs/plans/*.md` — Plan files created by `/fv:plan`. These are living documents that track implementation progress (checkboxes are checked off by `/fv:work`).
- `docs/solutions/*.md` -- Solution documents created during the pipeline.
- `docs/impact/*.md` -- Impact assessment artifacts created by `/fv:impact`.
- `docs/ai/*.md` -- AI collaboration context documents.
- `docs/handoffs/*.md` -- Session handoff documents.

If a review agent flags any file in these directories for cleanup or removal, discard that finding during synthesis. Do not create a todo for it.
</protected_artifacts>

#### Load Review Agents

Read `fuelviews-engineering.local.md` in the project root. If found, use `review_agents` from YAML frontmatter. If the markdown body contains review context, pass it to each agent as additional instructions.

If no settings file exists, use the fv default review panel:

**Mandatory (fv Laravel):**
- `fuelviews-engineering:review:laravel-reviewer`
- `fuelviews-engineering:review:php-reviewer`
- `fuelviews-engineering:review:blade-reviewer`
- `fuelviews-engineering:review:laravel-conventions-reviewer`
- `fuelviews-engineering:review:laravel-performance-reviewer`

**Standard (CE):**
- `compound-engineering:review:code-simplicity-reviewer`
- `compound-engineering:review:security-sentinel`
- `compound-engineering:review:pattern-recognition-specialist`
- `compound-engineering:review:architecture-strategist`
- `compound-engineering:review:performance-oracle`

#### Choose Execution Mode

<execution_mode>

Before launching review agents, check for context constraints:

**If `--serial` flag is passed OR conversation is in a long session:**

Run agents ONE AT A TIME in sequence. Wait for each agent to complete before starting the next. This uses less context but takes longer.

**Default (parallel):**

Run all agents simultaneously for speed. If you hit context limits, retry with `--serial` flag.

**Auto-detect:** If more than 5 review agents are configured, automatically switch to serial mode and inform the user:
"Running review agents in serial mode (6+ agents configured). Use --parallel to override."

</execution_mode>

#### Framework Version Resolution

Before dispatching agents, determine framework versions via Boost `application-info` MCP tool or by reading `composer.json`. Pass version context (Laravel, PHP, Livewire, FilamentPHP versions) to all agents so they can tailor advice to the correct API surface.

#### Reference Loading

Do NOT read reference files into the orchestrator context. Instead, instruct each fv review agent to read these files itself as part of its review:

1. `references/spatie-laravel.md` -- Spatie Laravel guidelines
2. `references/laravel-best-practices.md` -- alexeymezenin best practices
3. `docs/ai/conventions.md` -- repo-specific conventions (if exists)
4. Boost `mcp__laravel-boost__search-docs` (if available, for topics the PR touches)

This keeps the orchestrator lean — reference content stays in subagent contexts only.

#### GitNexus Pre-Dispatch

If `.gitnexus/` exists in the project root, run `detect_changes` on the diff before dispatching agents. Pass affected processes and transitive dependency information to each agent so they can assess broader impact.

#### Parallel Agents to review the PR:

<parallel_tasks>

**Return contract for ALL review agents:** Instruct each agent: "Return ONLY a structured findings list. Each finding: severity (P1/P2/P3), file path:line, one-line summary, effort estimate. Do NOT return full code examples, detailed reasoning, or lengthy recommendations — keep those in your analysis context. The synthesis agent will request details for P1/P2 findings if needed."

**For fv review agents**, also instruct: "Read `references/spatie-laravel.md`, `references/laravel-best-practices.md`, and `docs/ai/conventions.md` before reviewing. Use Boost `search-docs` if available."

**Parallel mode (default for ≤5 agents):**

Run all configured review agents in parallel using Task tool. For each agent in the `review_agents` list:

```
Task {agent-name}(PR diff + review context from settings body + return contract + reference-loading instruction)
```

**Serial mode (--serial flag, or auto for 6+ agents):**

Run configured review agents ONE AT A TIME. For each agent:

```
For each agent in review_agents:
  1. Task {agent-name}(PR diff + review context + return contract + reference-loading instruction)
  2. Wait for completion
  3. Collect structured findings
  4. Proceed to next agent
```

Always run these last regardless of mode (can use `run_in_background: true` since findings are additive):
- Task compound-engineering:review:agent-native-reviewer(PR diff) - Verify new features are agent-accessible
- Task compound-engineering:research:learnings-researcher(PR diff) - Search docs/solutions/ for past issues. **Return contract:** relevant solution files with one-line summaries only.

</parallel_tasks>

#### Conditional Agents (Run if applicable):

<conditional_agents>

These agents are run ONLY when the PR matches specific criteria. Check the PR files list to determine if they apply:

**MIGRATIONS: If PR contains database migrations, schema changes, or data backfills:**

- Task compound-engineering:review:schema-drift-detector(PR content) - Detects unrelated schema changes by cross-referencing against included migrations (run FIRST)
- Task compound-engineering:review:data-migration-expert(PR content) - Validates ID mappings match production, checks for swapped values, verifies rollback safety
- Task compound-engineering:review:data-integrity-guardian(PR content) - Reviews migration safety, data constraints, transaction boundaries, and privacy compliance
- Task compound-engineering:review:deployment-verification-agent(PR content) - Creates Go/No-Go deployment checklist with SQL verification queries
- Task fuelviews-engineering:review:postgresql-reviewer(PR content) - PostgreSQL-specific review for query patterns, index usage, and migration safety
- Task fuelviews-engineering:review:laravel-codebase-health-reviewer(PR content, references) - Check for orphaned routes, unused methods, and dead code left by the migration

**When to run:**
- PR includes files matching `database/migrations/*.php`
- PR modifies columns that store IDs, enums, or mappings
- PR includes data backfill scripts or artisan commands
- PR title/body mentions: migration, backfill, data transformation, ID mapping

**What these agents check:**
- `schema-drift-detector`: Cross-references schema changes against PR migrations to catch unrelated columns/indexes from local database state
- `data-migration-expert`: Verifies hard-coded mappings match production reality (prevents swapped IDs), checks for orphaned associations, validates dual-write patterns
- `data-integrity-guardian`: Reviews data model safety, transaction boundaries, constraint integrity, and privacy compliance
- `deployment-verification-agent`: Produces executable pre/post-deploy checklists with SQL queries, rollback procedures, and monitoring plans
- `postgresql-reviewer`: Validates PostgreSQL-specific patterns, index strategies, and migration safety
- `laravel-codebase-health-reviewer`: Detects orphaned routes, unused methods, dead config, and DRY violations from the migration

**JS/LIVEWIRE: If PR contains JavaScript or Livewire files:**

- Task fuelviews-engineering:review:javascript-reviewer(PR content) - Reviews JS/Alpine/Livewire patterns and interactions
- Task compound-engineering:review:julik-frontend-races-reviewer(PR content) - Detects frontend race conditions

**When to run:**
- PR includes files matching `resources/js/**/*.js`, `resources/js/**/*.ts`, or Livewire component files

**TYPESCRIPT: If PR contains TypeScript files:**

- Task compound-engineering:review:kieran-typescript-reviewer(PR content) - TypeScript-specific review for type safety and patterns

**When to run:**
- PR includes files matching `**/*.ts` or `**/*.tsx`

</conditional_agents>

### 2. Ultra-Thinking Deep Dive Phases

<ultrathink_instruction> For each phase below, spend maximum cognitive effort. Think step by step. Consider all angles. Question assumptions. And bring all reviews in a synthesis to the user.</ultrathink_instruction>

<deliverable>
Complete system context map with component interactions
</deliverable>

#### Phase 1: Stakeholder Perspective Analysis

<thinking_prompt> ULTRA-THINK: Put yourself in each stakeholder's shoes. What matters to them? What are their pain points? </thinking_prompt>

<stakeholder_perspectives>

1. **Developer Perspective** <questions>

   - How easy is this to understand and modify?
   - Are the APIs intuitive?
   - Is debugging straightforward?
   - Can I test this easily? </questions>

2. **Operations Perspective** <questions>

   - How do I deploy this safely?
   - What metrics and logs are available?
   - How do I troubleshoot issues?
   - What are the resource requirements? </questions>

3. **End User Perspective** <questions>

   - Is the feature intuitive?
   - Are error messages helpful?
   - Is performance acceptable?
   - Does it solve my problem? </questions>

4. **Security Team Perspective** <questions>

   - What's the attack surface?
   - Are there compliance requirements?
   - How is data protected?
   - What are the audit capabilities? </questions>

5. **Business Perspective** <questions>
   - What's the ROI?
   - Are there legal/compliance risks?
   - How does this affect time-to-market?
   - What's the total cost of ownership? </questions> </stakeholder_perspectives>

#### Phase 2: Scenario Exploration

<thinking_prompt> ULTRA-THINK: Explore edge cases and failure scenarios. What could go wrong? How does the system behave under stress? </thinking_prompt>

<scenario_checklist>

- [ ] **Happy Path**: Normal operation with valid inputs
- [ ] **Invalid Inputs**: Null, empty, malformed data
- [ ] **Boundary Conditions**: Min/max values, empty collections
- [ ] **Concurrent Access**: Race conditions, deadlocks
- [ ] **Scale Testing**: 10x, 100x, 1000x normal load
- [ ] **Network Issues**: Timeouts, partial failures
- [ ] **Resource Exhaustion**: Memory, disk, connections
- [ ] **Security Attacks**: Injection, overflow, DoS
- [ ] **Data Corruption**: Partial writes, inconsistency
- [ ] **Cascading Failures**: Downstream service issues </scenario_checklist>

### 3. Multi-Angle Review Perspectives

#### Technical Excellence Angle

- Code craftsmanship evaluation
- Engineering best practices
- Technical documentation quality
- Tooling and automation assessment

#### Business Value Angle

- Feature completeness validation
- Performance impact on users
- Cost-benefit analysis
- Time-to-market considerations

#### Risk Management Angle

- Security risk assessment
- Operational risk evaluation
- Compliance risk verification
- Technical debt accumulation

#### Team Dynamics Angle

- Code review etiquette
- Knowledge sharing effectiveness
- Collaboration patterns
- Mentoring opportunities

### 4. Simplification and Minimalism Review

Run the Task compound-engineering:review:code-simplicity-reviewer() to see if we can simplify the code.

### 5. Findings Synthesis and Todo Creation Using file-todos Skill

<critical_requirement> ALL findings MUST be stored in the todos/ directory using the file-todos skill. Create todo files immediately after synthesis - do NOT present findings for user approval first. Use the skill for structured todo management. </critical_requirement>

#### Step 1: Synthesize All Findings

<thinking>
Consolidate all agent reports into a categorized list of findings.
Remove duplicates, prioritize by severity and impact.
</thinking>

<synthesis_tasks>

- [ ] Collect findings from all parallel agents
- [ ] Surface learnings-researcher results: if past solutions are relevant, flag them as "Known Pattern" with links to docs/solutions/ files
- [ ] Discard any findings that recommend deleting or gitignoring files in `docs/brainstorms/`, `docs/plans/`, or `docs/solutions/` (see Protected Artifacts above)
- [ ] Run `fuelviews-engineering:workflow:synthesis-agent` for 3-layer dedup before creating todos. **Return contract:** deduplicated findings list (ID, severity, file, summary, effort), counts by severity, escalation actions taken. No dedup reasoning.
- [ ] Categorize by type: security, performance, architecture, quality, etc.
- [ ] Assign severity levels: 🔴 CRITICAL (P1), 🟡 IMPORTANT (P2), 🔵 NICE-TO-HAVE (P3)
- [ ] Remove duplicate or overlapping findings
- [ ] Estimate effort for each finding (Small/Medium/Large)

</synthesis_tasks>

#### Step 2: Create Todo Files Using file-todos Skill

<critical_instruction> Use the file-todos skill to create todo files for ALL findings immediately. Do NOT present findings one-by-one asking for user approval. Create all todo files in parallel using the skill, then summarize results to user. </critical_instruction>

**Implementation Options:**

**Option A: Direct File Creation (Fast)**

- Create todo files directly using Write tool
- All findings in parallel for speed
- Use standard template from `.claude/skills/file-todos/assets/todo-template.md`
- Follow naming convention: `{issue_id}-pending-{priority}-{description}.md`

**Option B: Sub-Agents in Parallel (Recommended for Scale)** For large PRs with 15+ findings, use sub-agents to create finding files in parallel:

```bash
# Launch multiple finding-creator agents in parallel
Task() - Create todos for first finding
Task() - Create todos for second finding
Task() - Create todos for third finding
etc. for each finding.
```

Sub-agents can:

- Process multiple findings simultaneously
- Write detailed todo files with all sections filled
- Organize findings by severity
- Create comprehensive Proposed Solutions
- Add acceptance criteria and work logs
- Complete much faster than sequential processing

**Execution Strategy:**

1. Synthesize all findings into categories (P1/P2/P3)
2. Group findings by severity
3. Launch 3 parallel sub-agents (one per severity level)
4. Each sub-agent creates its batch of todos using the file-todos skill
5. Consolidate results and present summary

**Process (Using file-todos Skill):**

1. For each finding:

   - Determine severity (P1/P2/P3)
   - Write detailed Problem Statement and Findings
   - Create 2-3 Proposed Solutions with pros/cons/effort/risk
   - Estimate effort (Small/Medium/Large)
   - Add acceptance criteria and work log

2. Use file-todos skill for structured todo management:

   ```bash
   skill: file-todos
   ```

   The skill provides:

   - Template location: `.claude/skills/file-todos/assets/todo-template.md`
   - Naming convention: `{issue_id}-{status}-{priority}-{description}.md`
   - YAML frontmatter structure: status, priority, issue_id, tags, dependencies
   - All required sections: Problem Statement, Findings, Solutions, etc.

3. Create todo files in parallel:

   ```bash
   {next_id}-pending-{priority}-{description}.md
   ```

4. Examples:

   ```
   001-pending-p1-path-traversal-vulnerability.md
   002-pending-p1-api-response-validation.md
   003-pending-p2-concurrency-limit.md
   004-pending-p3-unused-parameter.md
   ```

5. Follow template structure from file-todos skill: `.claude/skills/file-todos/assets/todo-template.md`

**Todo File Structure (from template):**

Each todo must include:

- **YAML frontmatter**: status, priority, issue_id, tags, dependencies
- **Problem Statement**: What's broken/missing, why it matters
- **Findings**: Discoveries from agents with evidence/location
- **Proposed Solutions**: 2-3 options, each with pros/cons/effort/risk
- **Recommended Action**: (Filled during triage, leave blank initially)
- **Technical Details**: Affected files, components, database changes
- **Acceptance Criteria**: Testable checklist items
- **Work Log**: Dated record with actions and learnings
- **Resources**: Links to PR, issues, documentation, similar patterns

**File naming convention:**

```
{issue_id}-{status}-{priority}-{description}.md

Examples:
- 001-pending-p1-security-vulnerability.md
- 002-pending-p2-performance-optimization.md
- 003-pending-p3-code-cleanup.md
```

**Status values:**

- `pending` - New findings, needs triage/decision
- `ready` - Approved by manager, ready to work
- `complete` - Work finished

**Priority values:**

- `p1` - Critical (blocks merge, security/data issues)
- `p2` - Important (should fix, architectural/performance)
- `p3` - Nice-to-have (enhancements, cleanup)

**Tagging:** Always add `code-review` tag, plus: `security`, `performance`, `architecture`, `laravel`, `quality`, etc.

#### Step 3: Summary Report

After creating all todo files, present a clean summary:

````markdown
## Code Review Complete

**PR:** #XXXX - [PR Title]
**Branch:** [branch-name]
**Agents:** [comma-separated list of agents used]

### Findings

| Severity | Count | Todos Created |
|----------|-------|---------------|
| P1 (blocks merge) | <N> | `001-pending-p1-*.md`, ... |
| P2 (should fix) | <N> | `003-pending-p2-*.md`, ... |
| P3 (nice to have) | <N> | `005-pending-p3-*.md`, ... |

### P1 Findings (must resolve)

| File | Finding | Todo |
|------|---------|------|
| path:line | one-line summary | `NNN-pending-p1-*.md` |

### Consensus (multiple reviewers flagged)

| Finding | Reviewers | Severity |
|---------|-----------|----------|
| summary | agent1, agent2 | P2 |

### Next Steps

1. Address P1 findings before merge
2. Run `/triage` for interactive prioritization
3. Run `/resolve-todo-parallel` to fix approved items
````

#### Step 4: Iterative Review

Use **AskUserQuestion** (do NOT proceed without a response):

1. "Run another review round" -- Re-dispatch agents to check for issues the fixes may have introduced
2. "Done reviewing" -- Proceed to end-to-end testing (if applicable) or finish

Wait for the user's selection before proceeding. If yes, re-dispatch agents. The user controls when to stop.

### 6. End-to-End Testing (Optional)

<detect_project_type>

**First, detect the project type from PR files:**

| Indicator | Project Type |
|-----------|--------------|
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` (iOS) | iOS/macOS |
| `Gemfile`, `package.json`, `app/views/*`, `*.html.*` | Web |
| Both iOS files AND web files | Hybrid (test both) |

</detect_project_type>

<offer_testing>

After presenting the Summary Report, offer appropriate testing based on project type:

Use **AskUserQuestion** based on detected project type (do NOT proceed without a response):

**For Web Projects:**

1. "Yes -- run browser tests" -- Spawn `/test-browser` subagent
2. "No -- skip testing" -- Finish review

**For iOS Projects:**

1. "Yes -- run Xcode tests" -- Spawn `/xcode-test` subagent
2. "No -- skip testing" -- Finish review

**For Hybrid Projects (e.g., Rails + Hotwire Native):**

1. "Web only" -- Run `/test-browser`
2. "iOS only" -- Run `/xcode-test`
3. "Both" -- Run both
4. "No -- skip" -- Finish review

</offer_testing>

#### If User Accepts Web Testing:

Spawn a subagent to run browser tests (preserves main context):

```
Task general-purpose("Run /test-browser for PR #[number]. Test all affected pages, check for console errors, handle failures by creating todos and fixing.")
```

The subagent will:
1. Identify pages affected by the PR
2. Navigate to each page and capture snapshots (using Playwright MCP or agent-browser CLI)
3. Check for console errors
4. Test critical interactions
5. Pause for human verification on OAuth/email/payment flows
6. Create P1 todos for any failures
7. Fix and retry until all tests pass

**Standalone:** `/test-browser [PR number]`

#### If User Accepts iOS Testing:

Spawn a subagent to run Xcode tests (preserves main context):

```
Task general-purpose("Run /xcode-test for scheme [name]. Build for simulator, install, launch, take screenshots, check for crashes.")
```

The subagent will:
1. Verify XcodeBuildMCP is installed
2. Discover project and schemes
3. Build for iOS Simulator
4. Install and launch app
5. Take screenshots of key screens
6. Capture console logs for errors
7. Pause for human verification (Sign in with Apple, push, IAP)
8. Create P1 todos for any failures
9. Fix and retry until all tests pass

**Standalone:** `/xcode-test [scheme]`

### Important: P1 Findings Block Merge

Any **🔴 P1 (CRITICAL)** findings must be addressed before merging the PR. Present these prominently and ensure they're resolved before accepting the PR.
