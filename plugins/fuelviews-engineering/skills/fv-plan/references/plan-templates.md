# Plan Templates

All templates share the same frontmatter schema (defined in SKILL.md Phase 2.2) and end with `## Review Deltas`.

## MINIMAL (Quick Issue)

**Best for:** Simple bugs, small improvements, clear features

**Body sections:**

```markdown
# [Issue Title]

[Brief problem/feature description]

## Acceptance Criteria

- [ ] Core requirement 1
- [ ] Core requirement 2

## Context

[Any critical information]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources

- **Origin document:** [path](path) -- if from brainstorm, otherwise omit
- Related issue: #[issue_number]

## Review Deltas

<!-- Populated by convergent review loop -->
```

## MORE (Standard Issue)

**Best for:** Most features, complex bugs, team collaboration

**Body sections (adds to MINIMAL):**

```markdown
# [Issue Title]

## Overview

[Comprehensive description]

## Problem Statement / Motivation

[Why this matters]

## Proposed Solution

[High-level approach]

## Technical Considerations

- Architecture impacts
- Performance implications
- Security considerations

## System-Wide Impact

- **Interaction graph**: [What callbacks/middleware/observers fire?]
- **Error propagation**: [How do errors flow across layers?]
- **State lifecycle risks**: [Can partial failure leave inconsistent state?]
- **API surface parity**: [Other interfaces needing the same change?]
- **Integration test scenarios**: [Cross-layer scenarios unit tests miss]

## Acceptance Criteria

- [ ] Detailed requirement 1
- [ ] Testing requirements

## Success Metrics

[How we measure success]

## Dependencies & Risks

[What could block or complicate this]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources & References

- **Origin document:** [path](path) -- if from brainstorm
- Similar implementations: [file_path:line_number]
- Best practices: [documentation_url]

## Review Deltas

<!-- Populated by convergent review loop -->
```

## A LOT (Comprehensive Issue)

**Best for:** Major features, architectural changes, complex integrations

**Body sections (adds to MORE):**

```markdown
# [Issue Title]

## Overview

[Executive summary]

## Problem Statement

[Detailed problem analysis]

## Proposed Solution

[Comprehensive solution design]

## Technical Approach

### Architecture
[Detailed technical design]

### Implementation Phases

#### Phase 1: [Foundation]
- Tasks, success criteria, estimated effort

#### Phase 2: [Core Implementation]
- Tasks, success criteria, estimated effort

#### Phase 3: [Polish & Optimization]
- Tasks, success criteria, estimated effort

## Alternative Approaches Considered

[Other solutions evaluated and why rejected]

## System-Wide Impact

### Interaction Graph
[Chain reaction map: callbacks, middleware, observers, event handlers. Trace 2+ levels deep.]

### Error & Failure Propagation
[Trace errors from lowest layer up. Exception classes, retry conflicts, silent failures.]

### State Lifecycle Risks
[Partial failure scenarios: orphaned rows, stale caches, duplicate records.]

### API Surface Parity
[All interfaces exposing equivalent functionality. Which need updating.]

### Integration Test Scenarios
[3-5 cross-layer scenarios unit tests with mocks would miss.]

## Acceptance Criteria

### Functional Requirements
- [ ] Detailed functional criteria

### Non-Functional Requirements
- [ ] Performance targets
- [ ] Security requirements

### Quality Gates
- [ ] Test coverage requirements
- [ ] Code review approval

## Success Metrics

[Detailed KPIs and measurement methods]

## Dependencies & Prerequisites

[Detailed dependency analysis]

## Risk Analysis & Mitigation

[Comprehensive risk assessment]

## Future Considerations

[Extensibility and long-term vision]

## Documentation Plan

[What docs need updating]

## Impact References

- Impact artifact: `docs/impact/<task-slug>.md`

## Sources & References

### Origin
- **Origin document:** [path](path) -- key decisions carried forward: [list]

### Internal References
- Architecture decisions: [file_path:line_number]
- Similar features: [file_path:line_number]

### External References
- Framework documentation: [url]
- Best practices guide: [url]

### Related Work
- Previous PRs: #[pr_numbers]
- Related issues: #[issue_numbers]

## Review Deltas

<!-- Populated by convergent review loop -->
```
