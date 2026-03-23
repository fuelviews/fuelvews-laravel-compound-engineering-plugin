# Source of Truth Order

Internal reference for the canonical trust hierarchy used by all
fuelviews-engineering agents when resolving conflicting information.

---

## Trust Hierarchy

When two sources disagree, the higher-numbered source loses. Always trust
the lower number.

| Rank | Source                          | Rationale                                    |
|------|---------------------------------|----------------------------------------------|
| 1    | Running code behavior           | What actually executes is ground truth        |
| 2    | Database schema + migrations    | Structural contract the app is built on       |
| 3    | Test assertions                 | Codified expectations of correct behavior     |
| 4    | Route definitions               | Declares the app's public API surface         |
| 5    | Type signatures / interfaces    | Compile-time / static-analysis contracts      |
| 6    | docs/ai/conventions.md          | Team-agreed coding conventions                |
| 7    | docs/ai/architecture.md         | Documented system architecture                |
| 8    | Plan artifacts (docs/plans/)    | Current implementation plans                  |
| 9    | docs/ai/repo-map.md            | Directory and component map                   |
| 10   | Git history / commit messages   | Historical record of intent                   |
| 11   | Comments and documentation      | Supplementary, often stale                    |

---

## Resolution Rules

### Rule 1: Code Wins

If a comment says "this method returns an array" but the code returns a
Collection, the code is correct. Flag the comment as stale.

### Rule 2: Schema Wins Over Code

If code assumes a column is nullable but the migration defines it as
NOT NULL, the schema is the contract. Flag the code as potentially buggy.

### Rule 3: Tests Codify Intent

If a test asserts behavior X but the code does behavior Y, investigate:
- If the test was written more recently than the code change: the test
  likely reflects intended behavior. Flag the code.
- If the code was changed after the test: the test may be stale. Flag
  the test but do not auto-correct.

### Rule 4: Routes Are Public Contract

If a controller method exists but no route points to it, the method is
dead code until proven otherwise. Do not assume it is called.

### Rule 5: Conventions Over Opinions

If docs/ai/conventions.md specifies a pattern, agents must follow it even
if a "better" pattern exists. To change the convention, update the document
first.

### Rule 6: Plans Are Living Documents

Plan artifacts reflect current intent but not current reality. If a plan
says "add a status column" but the migration does not exist yet, the plan
is aspirational. Never treat plan content as existing code.

### Rule 7: Git History Is Context, Not Authority

Commit messages explain why a change was made. They do not override what
the code currently does. Use git history to understand intent when code
is ambiguous, not to determine correctness.

### Rule 8: Comments Are Suspect

Inline comments and docblocks are the lowest trust source. They are
useful for understanding intent but must be verified against higher-trust
sources before being cited as evidence in findings.

---

## Conflict Logging

When a trust hierarchy conflict is detected during review:

1. Record both sources and their ranks.
2. Flag the lower-trust source as potentially stale.
3. If the conflict affects a finding, cite the higher-trust source as
   primary evidence.
4. If the conflict is between ranks 1-5 (hard contracts), create a
   finding. Minimum severity: P2.
5. If the conflict is between ranks 6-11 (soft documentation), note it
   but do not auto-create a finding unless it causes ambiguity in a
   P1/P2 finding.

---

## Canonical Paths

Standard locations that agents must check. If a repo does not have these
paths, agents should note their absence but not fail.

| Purpose              | Path                      |
|----------------------|---------------------------|
| Plan index           | docs/plans/_index.md      |
| Conventions          | docs/ai/conventions.md    |
| Architecture         | docs/ai/architecture.md   |
| Repo map             | docs/ai/repo-map.md       |
| Current work         | current-work.md           |
| Route definitions    | routes/web.php, routes/api.php, routes/console.php |
| Migrations           | database/migrations/      |
| Model directory      | app/Models/               |
| Policy directory     | app/Policies/             |
| Test directory       | tests/                    |

---

## Agent Application

### During Impact Discovery

- Start from rank 1-4 sources to identify what the code actually does.
- Use rank 5-9 to understand intended architecture and conventions.
- Use rank 10-11 only to fill gaps when higher sources are ambiguous.

### During Finding Classification

- Evidence from rank 1-3 sources yields `definite` confidence.
- Evidence from rank 4-6 sources yields `probable` confidence.
- Evidence from rank 7-9 sources yields `possible` confidence.
- Evidence only from rank 10-11 sources yields `possible` at best;
  consider flagging as `blind_spot` if no higher source corroborates.

### During Contract Validation (Phase 7)

- Verify rank 2 (schema) matches rank 1 (running behavior).
- Verify rank 4 (routes) matches rank 1 (controller behavior).
- Verify rank 5 (interfaces) matches rank 1 (implementations).
- Verify rank 3 (tests) matches rank 1 (code behavior).
- Flag any mismatch as minimum P2.

---

## Staleness Indicators

Signs that a source may be stale (lower trust within its rank):

- **Comments**: Reference removed classes, old method signatures, or
  TODO items older than 6 months.
- **Docs**: Last git modification > 3 months ago while related code
  changed more recently.
- **Tests**: Skipped or marked incomplete. Use `@skip`, `markTestSkipped`,
  or `markTestIncomplete` as signals.
- **Repo map**: Lists files or directories that no longer exist.
- **Commit messages**: Reference ticket numbers from a different project
  management system than currently in use.
