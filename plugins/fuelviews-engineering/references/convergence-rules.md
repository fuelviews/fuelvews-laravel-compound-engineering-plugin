# Convergence Rules

Internal reference for the review convergence state machine, guards, and
deduplication logic.

---

## State Machine

```
INIT -> DISPATCH -> COLLECT -> SYNTHESIZE -> EVALUATE
                                                |
                              +-----------------+-----------------+
                              |                 |                 |
                           DEEPEN           DISPATCH           REPORT
                              |                 |
                              v                 v
                           DISPATCH          COLLECT
```

### States

| State      | Purpose                                              |
|------------|------------------------------------------------------|
| INIT       | Load plan frontmatter, hydrate prior round state     |
| DISPATCH   | Fan out review tasks to specialist agents            |
| COLLECT    | Gather agent responses, normalize finding format     |
| SYNTHESIZE | Merge findings, deduplicate, classify severity       |
| EVALUATE   | Apply convergence guards to decide next transition   |
| DEEPEN     | Expand scope of one or more agents with new context  |
| REPORT     | Emit final review summary and update plan artifact   |

### Transitions

| From       | To        | Guard              |
|------------|-----------|--------------------|
| INIT       | DISPATCH  | always             |
| DISPATCH   | COLLECT   | CAN_DISPATCH       |
| COLLECT    | SYNTHESIZE| all agents replied |
| SYNTHESIZE | EVALUATE  | always             |
| EVALUATE   | DISPATCH  | CAN_DISPATCH       |
| EVALUATE   | DEEPEN    | NEEDS_DEEPENING    |
| EVALUATE   | REPORT    | HAS_CONVERGED      |
| EVALUATE   | REPORT    | FORCE_STOP         |
| EVALUATE   | REPORT    | CONTEXT_PRESSURE   |
| DEEPEN     | DISPATCH  | always             |

---

## Guards

### CAN_DISPATCH

True when:
- Current round < max rounds (4)
- At least one agent role has unreviewed scope
- Context budget has capacity for another round

### NEEDS_DEEPENING

True when:
- Current deepen count < max deepen (2)
- Last round produced 2+ new findings at probable or higher confidence
- At least one finding references a file not yet reviewed at `deep-wiring`
  depth or greater

### HAS_CONVERGED

True when:
- Last round produced zero new P1 or P2 findings
- All prior P1 findings have been addressed or acknowledged in plan
- No unresolved blind spots flagged as high-risk

### FORCE_STOP

True when:
- Current round >= max rounds (4), regardless of findings
- User explicitly requests stop
- Agent returns a fatal error

### CONTEXT_PRESSURE

True when:
- Estimated next-round token cost would exceed 80% of model context window
- Progressive summarization cannot free sufficient budget
- Triggers automatic transition to REPORT with a `truncated` flag

---

## Round Focus Escalation

Each round narrows focus and increases depth.

| Round | Depth Level          | Focus                                       |
|-------|----------------------|---------------------------------------------|
| 1     | broad + plan-aware   | Full structural scan, plan dependency graph  |
| 2     | deep-wiring          | Cross-file interaction, event chains         |
| 3     | deep-legacy          | Error propagation, state lifecycle, legacy   |
| 4     | contract-validation  | Final verification of all prior findings     |

Round 1 always runs. Rounds 2-4 run only if the preceding EVALUATE does not
trigger HAS_CONVERGED or FORCE_STOP.

---

## Context Budget Management

### Token Allocation

- Reserve 20% of context window for system prompt + tool definitions
- Reserve 15% for final REPORT generation
- Remaining 65% split across rounds:
  - Round 1: up to 40% of remaining
  - Round 2: up to 30% of remaining
  - Round 3: up to 20% of remaining
  - Round 4: up to 10% of remaining

### Progressive Summarization

After each round, compress prior-round findings:
- Round 1 output: kept at full fidelity for Round 2
- Round 1 output entering Round 3: compressed to finding ID + severity + one-line summary
- Round 1 output entering Round 4: compressed to finding ID + severity only
- Current round always gets full fidelity

### Budget Exceeded

If a round's token usage exceeds its allocation:
1. Truncate lowest-severity findings first (P3, then P2)
2. If still over, summarize file contents to signatures only
3. If still over, trigger CONTEXT_PRESSURE guard

---

## 3-Layer Deduplication

Applied during SYNTHESIZE.

### Layer 1 -- Exact Match

Same file, same line range, same finding type.
Action: merge, keep highest severity, union of evidence.

### Layer 2 -- Semantic Overlap

Different files but same root cause (e.g., missing validation on the same
form request found by two agents).
Action: merge into single finding, reference all affected files, keep highest
severity.

### Layer 3 -- Subsumption

One finding is a strict subset of another (e.g., "missing null check on
line 42" subsumed by "entire method lacks input validation").
Action: keep the broader finding, attach the narrower as supporting evidence.

### Dedup Output

Each surviving finding after dedup gets:
- Unique finding ID (format: `FV-RNNN` where R=round, NNN=sequence)
- Severity (P1/P2/P3)
- Confidence (definite/probable/possible/blind_spot)
- Affected files (list)
- Evidence summary (one paragraph max)
- Prior-round lineage (if merged from earlier round findings)

---

## Limits Summary

| Parameter          | Value |
|--------------------|-------|
| Max review rounds  | 4     |
| Max deepen rounds  | 2     |
| Convergence signal | 0 new P1/P2 findings |
| Context pressure   | 80% window utilization |
| Max findings per round before compression | 50 |
