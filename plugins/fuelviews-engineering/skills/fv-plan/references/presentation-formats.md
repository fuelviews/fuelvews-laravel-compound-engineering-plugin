# Presentation Formats

All user-facing summaries use these formatted markdown templates.

## Plan Draft Summary (Phase 2.6)

```markdown
## Plan Draft (Round <N>)

**Task:** <task title>
**Slug:** <task-slug>
**Plan:** `docs/plans/<filename>.md`
**Impact:** `docs/impact/<task-slug>.md`

### Key Decisions
- <decision 1>
- <decision 2>

### Implementation Approach
<brief summary>

### Plan Stats

| Metric | Count |
|--------|-------|
| Architecture decisions | <N> |
| Implementation steps | <N> |
| Tests planned | <N> |
| Risks identified | <N> |

### Impact Assessment

| Confidence | Files |
|------------|-------|
| Definite | <N> |
| Probable | <N> |
| Possible | <N> |
| Blind spots | <N> |

### Reusable Infrastructure Leveraged
- <existing service/model/component referenced in plan>
```

## Review Findings Summary (Phase 4.4)

```markdown
## Plan Review Round <N> Findings

**Reviewers:** <list of agents that ran>
**Total findings:** <count> (<new> new, <resolved> resolved from prior rounds)

### Consensus (multiple reviewers agree)

| Finding | Severity | File | Summary |
|---------|----------|------|---------|
| FV-NNNN | P1/P2/P3 | path:line | one-line summary |

### Unique Callouts

**<Agent Name>:**
- FV-NNNN (P2) path:line -- summary

### Summary

| Severity | Count | Status |
|----------|-------|--------|
| P1 (blocking) | <N> | Must resolve before lock |
| P2 (should fix) | <N> | Address or defer with rationale |
| P3 (minor) | <N> | Optional |

### Impact on Scope

<If findings introduce new files or change the edit set, note here. Otherwise: "No scope change.">
```

## Impact Delta Summary (Phase 5.4)

```markdown
## Impact Update (Round <N>, depth: <depth>)

### Scope Delta

| Change | Count |
|--------|-------|
| New definite files | <N> |
| New probable files | <N> |
| New blind spots | <N> |
| Resolved blind spots | <N> |

### New Discoveries
- `<file/component>` -- <reason>
```

## Deepen Results Summary (Phase 6.3)

```markdown
## Deepen Pass <deepen_count> Results

| Category | Count |
|----------|-------|
| New risks discovered | <N> |
| Alternative approaches evaluated | <N> |
| Hidden dependencies surfaced | <N> |

### Key Findings
- <finding summary>
```

## Lock Summary (Phase 8.6)

```markdown
## Plan Locked

| Field | Value |
|-------|-------|
| Plan | `docs/plans/<filename>.md` |
| Impact | `docs/impact/<task-slug>.md` |
| Slug | `<task-slug>` |
| Rounds completed | <N> |
| Watchlist items | <N> |
| Blind spots | <N> |

### Findings Summary

| Severity | Total | Resolved | Excluded | Open |
|----------|-------|----------|----------|------|
| P1 | <N> | <N> | <N> | <N> |
| P2 | <N> | <N> | <N> | <N> |
| P3 | <N> | <N> | <N> | <N> |

### Infrastructure Leveraged
- <existing services/models/components the plan reuses>
```
