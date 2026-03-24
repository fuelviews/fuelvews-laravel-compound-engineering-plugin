# Checkpoint, Resume, and Error Recovery

## Checkpoint and Resume Protocol

At every phase boundary, update frontmatter: `pipeline_phase`, `review_rounds_completed`, `convergence_round`, `deepen_count`, `context_budget` (used_pct, compression_level).

### Context Pressure Checkpoint

If `used_pct > 80%`: emergency summarize, write full findings to disk, set `status: parked`, instruct user to `--resume`.

### User Interruption

Save state to frontmatter, set `status: parked`, report checkpoint phase and resume instructions.

## Progressive Summarization Between Rounds

Apply compression matrix from [convergent-planning-loop.md](../references/convergent-planning-loop.md): full -> compressed -> ultra-compressed -> minimal as rounds advance. Current round always gets full fidelity.

After each round (post Phase 4): write full findings to disk (append, never overwrite), generate compressed version, update `compression_level`, escalate if still over budget.

## Loop Invariants

1. `pipeline_phase` matches actual execution phase.
2. `convergence_round` never decreases.
3. `deepen_count` never exceeds 2.
4. Every finding has unique ID (`FV-RNNN`) persisting across rounds.
5. No finding deleted -- only resolved, excluded, or subsumed.
6. `used_pct` never exceeds 80% entering a new phase.

## Error Recovery

| Failure Mode | Recovery Action |
|---|---|
| Agent timeout during COLLECT | Retry once, then mark scope as skipped |
| Frontmatter parse error | Attempt YAML repair, escalate if ambiguous |
| Context budget exceeded mid-phase | Emergency summarize, continue phase |
| Conflicting findings (same ID, different severity) | Keep higher severity, log conflict |
| User interrupts mid-loop | Save state, set status=parked |
| Gate fails 2x consecutively | Escalate to user with failure details |
