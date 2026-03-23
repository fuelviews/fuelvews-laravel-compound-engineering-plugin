---
name: fv:impact
description: Run a standalone impact assessment diagnostic. Use when checking blast radius, verifying scope drift, or comparing approaches without modifying a plan.
argument-hint: "[task-slug, plan path, or file path to assess]"
---

# Standalone Impact Assessment

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

## Input

<impact_input> #$ARGUMENTS </impact_input>

## Step 1: Parse Input

Determine the input type from the argument above. Exactly one of these applies:

1. **No argument** -- Assess impact of the current git diff (unstaged + staged). Derive a slug from the current branch name. If the branch is `main` or `dev`, use `adhoc-impact` as the slug.
2. **Task slug** (no path separators, no file extension) -- Look up `docs/plans/<slug>.plan.md` for plan context and `docs/plans/<slug>.impact.md` for prior impact. If neither exists, treat the slug as a label and assess the current diff.
3. **Plan path** (ends in `.plan.md` or `.md` inside `docs/plans/`) -- Read the plan directly. Derive the slug from the filename by stripping date prefix, sequence number, and `-plan.md` suffix.
4. **File path** (any other path) -- Assess impact of changes to that specific file. Derive a slug from the filename.
5. **Two paths separated by a comma or space** -- Enter comparison mode (Step 6).

If the argument is ambiguous, ask the user which interpretation to use.

Set `$SLUG`, `$PLAN_PATH` (if found), and `$PRIOR_IMPACT_PATH` (if `docs/plans/<slug>.impact.md` exists).

## Step 2: Select Depth

Depth levels control how far the assessment traces dependencies. Reference: [impact-depth-guide.md](./references/impact-depth-guide.md)

| Depth | Round | Scope |
|-------|-------|-------|
| `broad` | 0 | Structural discovery -- routes, controllers, models, Livewire, Filament, policies, jobs |
| `plan-aware` | 1 | Plan-informed dependency tracing -- use statements, DI, form requests, views, migrations |
| `deep-wiring` | 2 | Cross-file interaction effects -- events, observers, middleware pipelines, job chains, cache |
| `deep-legacy` | 3 | System-wide patterns -- error propagation, transaction boundaries, external integrations |
| `contract-validation` | 4 | Final verification -- re-verify all prior findings, interface contracts, route signatures |

**Auto-detection:** If a plan exists and contains a `round:` counter in its frontmatter, map the round number to the corresponding depth level from the table above.

**Manual selection:** If no plan exists or no round counter is present, default to `broad`. Ask the user:

"Select impact depth: (1) broad, (2) plan-aware, (3) deep-wiring, (4) deep-legacy, (5) contract-validation -- or press Enter for broad."

Store the result as `$DEPTH`.

## Step 3: Gather Context

Collect artifacts for the assessment agent:

1. **Plan content** -- Read `$PLAN_PATH` if it exists. Pass the full content to the agent.
2. **Prior impact** -- Read `$PRIOR_IMPACT_PATH` if it exists. The agent uses this for delta tracking.
3. **File context** -- If the input was a file path, read the file and collect its current git diff. If the input was no argument, collect the full `git diff` and `git diff --staged` output using a single shell command each.
4. **Repo truth** -- Read `docs/ai/fuelviews-engineering.local.md` if it exists, for project-specific configuration.

## Step 4: Run Impact Assessment

Launch the impact assessment agent with the gathered context:

- Task `fuelviews-engineering:workflow:impact-assessment-agent` with:
  - `depth`: `$DEPTH`
  - `plan_content`: plan text or empty
  - `prior_impact`: prior impact artifact text or empty
  - `file_context`: diff output or file content depending on input type
  - `slug`: `$SLUG`

Also dispatch the codebase researcher in parallel for dependency graph mapping:

- Task `compound-engineering:research:repo-research-analyst` with scope: dependency graph for files in the diff or plan

Wait for both to complete. Merge the codebase researcher's dependency findings into the impact assessment.

**Do NOT modify any plan artifact.** This is a read-only diagnostic.

## Step 5: Write Output

### Impact artifact path

- If a plan exists: write to `docs/plans/<slug>.impact.md`
- If no plan exists: write to `.context/compound-engineering/fv-impact/<slug>-impact.md`

Create parent directories as needed.

### Required output sections

The impact artifact must contain:

```
## Confidence Summary

| Category   | Count | Delta |
|------------|-------|-------|
| Definite   | N     | +/-N  |
| Probable   | N     | +/-N  |
| Possible   | N     | +/-N  |
| Blind Spot | N     | +/-N  |

## Definite Edit Set
[Files that WILL need changes, with evidence and impact description]

## Watchlist
[Probable and possible items requiring monitoring during implementation]

## Blind Spots
[Items that cannot be statically traced -- dynamic dispatch, reflection, runtime config]

## Tests Impacted
[Test files needing updates or new tests needed]

## Risks
[Risk items with severity and mitigation]

## Delta from Prior Assessment
[New entries, resolved entries, confidence upgrades -- omit if no prior impact exists]
```

### Terminal summary

After writing the artifact, print a compact summary to the terminal:

1. **Confidence summary table** (definite/probable/possible/blind_spot counts)
2. **Definite edit set** (file list, max 15 entries; note count if truncated)
3. **Top 3 watchlist items**
4. **Blind spots** (count and most critical)
5. **Delta highlights** (if prior impact existed: what is new, what is resolved)
6. **Next step suggestion**: "Use `/fv:plan` to create a full plan, or `/fv:review` to review changes."

## Step 6: Comparison Mode

Activated when the input contains two paths separated by a comma or space, or two plan slugs.

1. Parse both inputs using the same rules from Step 1.
2. Run Step 2 through Step 4 independently for each input. Dispatch both assessments in parallel.
3. Write a single comparison artifact to `.context/compound-engineering/fv-impact/comparison-<slug1>-vs-<slug2>.md`.
4. The comparison artifact must contain:
   - Side-by-side confidence summary tables
   - Files unique to each approach's blast radius
   - Files shared by both approaches
   - Net complexity comparison (total definite + probable counts)
   - Blind spot comparison
   - Recommendation: which approach has the smaller or more predictable blast radius
5. Print the comparison summary to the terminal and suggest: "Use `/fv:plan` to plan the preferred approach."

## Key References

- [impact-depth-guide.md](./references/impact-depth-guide.md)
- [severity-policy.md](./references/severity-policy.md)

## Agent Dispatch

### CE Agents

- `compound-engineering:research:repo-research-analyst` -- map dependency graph for impact scope

### FV Agents

- `fuelviews-engineering:workflow:impact-assessment-agent` -- execute impact analysis at specified depth

## Scratch Space

Write ephemeral working files to `.context/compound-engineering/fv-impact/`. Clean up after successful completion unless the user requests inspection.
