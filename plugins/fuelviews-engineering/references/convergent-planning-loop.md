# Convergent Planning Loop

Internal reference for /fv:plan convergent loop orchestration (phases 2-6).

---

## Phase Grouping

```
Setup    [Phase 0-1]  --GATE:setup-complete-->
Loop     [Phase 2-6]  --GATE:loop-exit-->
Finalize [Phase 7-8]
```

### Setup (Phases 0-1)

- Phase 0: Parse user intent, load repo context, create or resume plan file.
- Phase 1: Baseline impact discovery (depth=broad), populate initial file list.

GATE: `setup-complete`
- Plan file exists with valid frontmatter
- Initial file list is non-empty
- Plan status is `drafting` or `reviewing`

### Loop (Phases 2-6)

- Phase 2: Dispatch review agents for current round.
- Phase 3: Collect and normalize agent findings.
- Phase 4: Synthesize, deduplicate, classify findings.
- Phase 5: Evaluate convergence guards.
- Phase 6: Apply deepen (if NEEDS_DEEPENING) or advance round counter.

The loop repeats phases 2-6 until EVALUATE transitions to REPORT
(HAS_CONVERGED, FORCE_STOP, or CONTEXT_PRESSURE).

GATE: `loop-exit`
- Convergence state is REPORT
- All P1 findings addressed or acknowledged
- Round counter and deepen counter recorded in frontmatter

### Finalize (Phases 7-8)

- Phase 7: Contract-validation impact pass (if not already done as Round 4).
- Phase 8: Lock plan, emit final artifacts.

---

## GATE Checkpoints

Gates are binary pass/fail checks evaluated between phase groups.

| Gate             | Checked Between   | Pass Condition                              |
|------------------|-------------------|---------------------------------------------|
| setup-complete   | Phase 1 -> 2      | Valid plan frontmatter + non-empty file list |
| loop-exit        | Phase 6 -> 7      | Convergence state == REPORT                 |
| lock-ready       | Phase 7 -> 8      | Zero unresolved P1, contract validation done|

If a gate fails:
1. Log the failure reason in plan frontmatter under `gate_failures`.
2. Return to the last phase that can resolve the failure.
3. After 2 consecutive failures of the same gate, escalate to user.

---

## Checkpoint/Resume via Plan Frontmatter

The plan file's YAML frontmatter is the single source of truth for loop state.

### Required Frontmatter Fields

```yaml
status: drafting | reviewing | locked | parked
current_phase: 0-8
current_round: 1-4
deepen_count: 0-2
last_gate: setup-complete | loop-exit | lock-ready | null
gate_failures: []
findings_summary:
  p1: 0
  p2: 0
  p3: 0
  resolved: 0
  excluded: 0
context_budget:
  used_pct: 0
  compression_level: none | compressed | ultra-compressed | minimal
locked_at: null | ISO-8601 timestamp
```

### Resume Logic

On plan resume:
1. Read frontmatter `current_phase` and `current_round`.
2. If `current_phase` is within Loop (2-6), re-enter at that phase.
3. Hydrate prior round findings at the appropriate compression level.
4. Re-evaluate the last gate if `last_gate` is set but the next phase
   group has not started.
5. If `status` is `locked`, refuse modification -- plan is immutable.

### Frontmatter Update Rules

- Update `current_phase` at the START of each phase (before work begins).
- Update `current_round` only when EVALUATE transitions to DISPATCH (new round).
- Update `deepen_count` only when EVALUATE transitions to DEEPEN.
- Update `findings_summary` at end of SYNTHESIZE (Phase 4).
- Update `context_budget` at end of every phase.
- Never delete prior gate failure entries from `gate_failures`.

---

## Progressive Summarization Between Rounds

Context budget dictates how much prior-round data is carried forward.

### Compression Levels

| Entering Round | Prior Round 1 Data     | Prior Round 2 Data     | Prior Round 3 Data     | Current Round |
|----------------|------------------------|------------------------|------------------------|---------------|
| Round 1        | full                   | --                     | --                     | full          |
| Round 2        | compressed + full      | --                     | --                     | full          |
| Round 3        | ultra-compressed + full| compressed             | --                     | full          |
| Round 4        | minimal + full         | ultra-compressed       | compressed             | full          |

### Compression Definitions

- **full**: Complete finding with all evidence, file references, code snippets.
- **compressed**: Finding ID + severity + confidence + affected files + one-line summary.
- **ultra-compressed**: Finding ID + severity + one-line summary.
- **minimal**: Finding ID + severity only.

The "+ full" notation means the original full data is still available in the
plan artifact on disk; the compression applies to what is loaded into context.

### Summarization Procedure

At end of each round (after Phase 4):
1. Write full findings to plan artifact on disk (append, never overwrite).
2. Generate compressed version for next-round context loading.
3. Update `context_budget.compression_level` in frontmatter.
4. If compressed output still exceeds budget, escalate compression one level.

---

## Loop Invariants

These must hold true at every phase boundary within the loop:

1. `current_phase` in frontmatter matches actual execution phase.
2. `current_round` never decreases.
3. `deepen_count` never exceeds 2.
4. Every finding has a unique ID that persists across rounds.
5. No finding is deleted -- only resolved, excluded, or subsumed.
6. Context budget `used_pct` never exceeds 80% entering a new phase
   (CONTEXT_PRESSURE fires before that).

---

## Error Recovery

| Failure Mode                  | Recovery Action                            |
|-------------------------------|--------------------------------------------|
| Agent timeout during COLLECT  | Retry once, then mark agent scope as skipped|
| Frontmatter parse error       | Attempt YAML repair, escalate if ambiguous |
| Context budget exceeded mid-phase | Emergency summarize, continue phase    |
| Conflicting findings (same ID, different severity) | Keep higher severity, log conflict |
| User interrupts mid-loop      | Save state to frontmatter, set status=parked |
