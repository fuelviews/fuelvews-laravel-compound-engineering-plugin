# Plan Finalization

Internal reference for /fv:plan finalization and lock flow (phases 7-8).

---

## Phase 7: Contract-Validation Impact

Final verification pass. Confirms every finding and implementation contract
still holds after all review rounds and deepen passes.

### Inputs

- All findings from prior rounds (loaded at compressed level per budget).
- Current plan artifact on disk (full fidelity).
- Plan frontmatter state.

### Steps

1. **Re-verify P1 findings.**
   For each P1 finding:
   - Confirm it is resolved (plan includes a fix) OR acknowledged (exclusion
     recorded with rationale).
   - If neither, block finalization -- return to loop with forced Round 4.

2. **Re-verify P2 findings.**
   For each P2 finding:
   - Confirm it is resolved, acknowledged, or explicitly deferred.
   - Deferred P2s require a rationale and must appear in the watchlist.

3. **Validate implementation contracts.**
   For each file in the plan's change set:
   - Interface contracts: all methods declared in interfaces have matching
     implementations in the plan.
   - Route contracts: route definitions match controller method signatures
     (parameter names, types, middleware).
   - Policy contracts: every CRUD operation on in-scope models has a
     corresponding policy method or an explicit "no policy needed" note.
   - Migration contracts: column types match model `$casts`, form request
     rules, and factory definitions.
   - Event contracts: every dispatched event has at least one listener or
     an explicit "fire-and-forget" note.

4. **Validate test coverage intent.**
   - Every P1 fix in the plan references which test file will cover it.
   - Every new public method in the plan has a test intent note (does not
     require the test to exist yet, only the intent).

5. **Update findings summary.**
   - Mark re-verified findings as `confirmed` or `stale`.
   - Remove stale findings from active list (move to `stale_findings` in
     frontmatter).

### Exit Criteria (GATE: lock-ready)

- Zero unresolved P1 findings.
- All P2 findings resolved, acknowledged, or deferred with rationale.
- Contract validation complete with no new P1 issues discovered.
- If new P1 issues are discovered, return to Phase 2 (loop re-entry).

---

## Phase 8: Plan Lock

Immutable snapshot. After this phase, the plan cannot be modified without
an explicit unlock.

### Steps

1. **Set `locked_at` timestamp.**
   ISO-8601 format in plan frontmatter.

2. **Set `status: locked`.**

3. **Emit final watchlist.**
   Collected from all rounds:
   - Unresolved blind spots (confidence=blind_spot, not yet manually verified).
   - Deferred P2 findings.
   - Surveillance items from deep-legacy analysis.
   - External dependency risks (package version assumptions, API contracts).

   Format:
   ```yaml
   watchlist:
     - id: FV-1003
       type: blind_spot
       summary: "Dynamic route registration in RouteServiceProvider"
       action: "Manual review during implementation"
     - id: FV-2015
       type: deferred_p2
       summary: "Missing index on orders.status column"
       action: "Add migration before load testing"
   ```

4. **Emit final blind spots summary.**
   Separate section listing every blind_spot-confidence finding with:
   - Finding ID
   - Source file(s)
   - Why static analysis could not resolve it
   - Recommended verification approach

5. **Update `docs/plans/_index.md`.**
   Add or update the entry for this plan:
   ```markdown
   | Plan Name | Status | Locked | Findings (P1/P2/P3) | Rounds |
   |-----------|--------|--------|----------------------|--------|
   | <name>    | locked | <date> | 0 / 3 / 7            | 3      |
   ```

6. **Update `current-work.md`.**
   If the locked plan is the active work item:
   - Set plan reference to the locked plan path.
   - Set status to `ready-for-implementation`.
   - Include watchlist count.

7. **Verify artifact integrity.**
   - Plan file is valid YAML frontmatter + Markdown body.
   - All finding IDs referenced in watchlist exist in the plan.
   - `findings_summary` counts match actual finding entries.
   - `locked_at` is set and `status` is `locked`.

---

## Post-Pipeline Options

After Phase 8, the orchestrator presents available transitions.

### Option 1: Transition to fv:work

Start implementation based on the locked plan.

Prerequisites:
- Plan status is `locked`.
- Zero unresolved P1.
- Watchlist has been reviewed by user (confirmation prompt).

Action:
- Create or switch to implementation branch.
- Hydrate fv:work context from locked plan.
- Carry watchlist and blind spots into implementation monitoring.

### Option 2: Park Plan

Defer implementation to a later time.

Action:
- Plan remains `locked`.
- Update `current-work.md` to clear active reference.
- No branch changes.

### Option 3: Request More Review

Unlock the plan for additional review rounds.

Action:
- Set `status: reviewing`.
- Clear `locked_at`.
- Increment a `reopen_count` counter in frontmatter.
- Re-enter at Phase 2 with round counter continuing from where it left off
  (does not reset to 1).
- Max reopens: 2. After that, require explicit user override.

---

## Lock Immutability Rules

Once `status: locked`:
- No finding may be added, removed, or reclassified.
- No plan section may be edited.
- Frontmatter may only be updated by:
  - Phase 8 itself (during lock).
  - Unlock via "Request More Review" (Option 3).
  - `fv:work` adding implementation-phase cross-references.
- Any other write attempt must be rejected with an error referencing this
  policy.

---

## Checklist (machine-readable)

```yaml
phase_7:
  - p1_findings_resolved: required
  - p2_findings_handled: required
  - contract_validation_clean: required
  - test_coverage_intent: required
  - findings_summary_updated: required

phase_8:
  - locked_at_set: required
  - status_locked: required
  - watchlist_emitted: required
  - blind_spots_summarized: required
  - index_updated: required
  - current_work_updated: conditional
  - artifact_integrity_verified: required
```
