# Severity Policy

Internal reference for finding severity classification (P1/P2/P3),
escalation rules, and exclusion handling.

---

## Severity Definitions

### P1 -- Critical

Blocks merge and implementation. Must be resolved or explicitly acknowledged
before the plan can be locked.

Criteria (any one sufficient):
- **Security vulnerability**: SQL injection, XSS, CSRF bypass, auth bypass,
  mass assignment, insecure deserialization, exposed secrets.
- **Data loss risk**: Missing soft-delete guard, cascade delete without
  confirmation, incorrect migration that drops data, unprotected bulk update.
- **Broken core functionality**: Change breaks a primary user flow (login,
  checkout, payment, data submission) in a way that is not recoverable
  without a code fix.
- **Incorrect business logic**: Calculation produces wrong results, state
  machine allows invalid transitions, pricing/tax/discount logic is wrong.

Response requirements:
- Plan must include a specific fix or mitigation.
- Fix must reference which test will verify the resolution.
- Cannot be deferred -- must be resolved or acknowledged with rationale.

### P2 -- Important

Should fix before merge. Can be deferred with documented rationale.

Criteria (any one sufficient):
- **Performance degradation**: N+1 queries, missing database index on
  filtered/sorted column, unbounded collection loading, synchronous external
  API call in request cycle.
- **Convention violation**: Breaks documented project conventions (naming,
  file organization, architectural boundaries) in a way that causes
  maintenance burden.
- **Missing error handling**: Uncaught exception in a user-facing path,
  missing try/catch around external service call, no fallback for failed
  queue job.
- **Incomplete test coverage**: New public method or critical path has no
  test intent, existing tests broken by the change without a fix plan.

Response requirements:
- Plan should include a fix.
- If deferred, must record rationale and add to watchlist.
- Deferred P2s appear in the locked plan's watchlist.

### P3 -- Minor

Fix if time permits. Does not block merge or lock.

Criteria:
- **Style preference**: Formatting, variable naming that does not violate
  conventions, alternative approach that is marginally cleaner.
- **Minor optimization**: Micro-optimization with negligible real-world
  impact, slightly more efficient query that does not affect page load.
- **Documentation improvement**: Missing or outdated docblock, README
  section that could be clearer, inline comment suggestion.
- **Nice-to-have**: Feature enhancement idea discovered during review,
  refactoring opportunity not related to current scope.

Response requirements:
- No action required.
- May be noted in plan for future reference.
- Do not carry forward into watchlist unless user requests it.

---

## Escalation Rules

### Automatic Escalation (P3 -> P2)

A P3 finding is escalated to P2 when:
- The same P3 pattern appears in 3+ files within the change set.
- A P3 style issue causes a linter or static analysis failure.
- A P3 documentation gap means a blind spot cannot be evaluated.

### Automatic Escalation (P2 -> P1)

A P2 finding is escalated to P1 when:
- The performance issue affects a route handling > 1000 requests/day
  (if traffic data is available).
- The missing error handling is on a payment or auth path.
- The convention violation breaks an interface contract.

### Manual Escalation

Any finding can be manually escalated by:
- The user during review.
- An agent during deepen pass with new evidence.

Manual escalation requires a one-line rationale recorded with the finding.

### De-escalation

Findings are never automatically de-escalated. De-escalation requires:
- Explicit user approval.
- Rationale recorded in the finding.
- Original severity preserved in finding history.

---

## Exclusion Handling

A finding may be excluded from blocking plan lock if it meets exclusion
criteria. Excluded findings are not deleted -- they are marked and stored.

### Exclusion Criteria

- Finding is a false positive (code analysis misread the intent).
- Finding is out of scope (affects code not being changed by this plan).
- Finding is already tracked in a separate plan or issue.
- User explicitly accepts the risk with documented rationale.

### Exclusion Record Format

Stored in plan frontmatter under `exclusions`:

```yaml
exclusions:
  - finding_id: FV-1005
    author: user
    timestamp: 2026-03-23T14:30:00Z
    reason: "False positive -- method is never called with user input"
    original_severity: P1
  - finding_id: FV-2012
    author: user
    timestamp: 2026-03-23T14:35:00Z
    reason: "Tracked in plan docs/plans/performance-audit.md"
    original_severity: P2
```

### Required Fields

| Field             | Type      | Description                                |
|-------------------|-----------|--------------------------------------------|
| finding_id        | string    | Unique finding ID (FV-RNNN format)         |
| author            | string    | Who approved the exclusion (user or agent)  |
| timestamp         | ISO-8601  | When the exclusion was recorded             |
| reason            | string    | One-line rationale (required, non-empty)    |
| original_severity | P1/P2/P3  | Severity at time of exclusion               |

### Exclusion Rules

- Only users can exclude P1 findings. Agents may suggest but not execute.
- Agents can exclude P3 findings autonomously during dedup (subsumption).
- P2 exclusions require user confirmation unless the finding is a
  confirmed false positive with definite-confidence evidence.
- Excluded findings still appear in the final plan artifact under a
  separate "Excluded Findings" section.
- Excluded findings do not count toward convergence (they are not "new"
  findings for HAS_CONVERGED evaluation).
- Exclusion is irreversible within a plan lock cycle. To re-include,
  the plan must be unlocked (Request More Review).

---

## Finding ID Format

```
FV-RNNN

FV   = Fuelviews prefix
R    = Round number (1-4)
NNN  = Sequence number within round (001-999)
```

Examples:
- `FV-1001` -- first finding from round 1
- `FV-2015` -- fifteenth finding from round 2
- `FV-4001` -- first finding from contract-validation round

Findings created during deepen passes use the round number of the round
that triggered the deepen, with sequence continuing from the last finding
in that round.

---

## Summary Table

| Severity | Blocks Lock | Deferrable | Watchlist | Auto-Escalation Target |
|----------|-------------|------------|-----------|------------------------|
| P1       | Yes         | No*        | N/A       | --                     |
| P2       | No          | Yes        | Yes       | -> P1                  |
| P3       | No          | N/A        | Optional  | -> P2                  |

*P1 can be excluded (see Exclusion Handling) but not deferred.
