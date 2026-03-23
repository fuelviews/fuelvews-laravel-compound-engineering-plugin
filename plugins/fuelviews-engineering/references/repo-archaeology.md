# Repo Archaeology

Advanced heuristics for legacy repo analysis, pattern detection, and risk mapping.
Supplements the basic classification in fv:repo-catchup with deeper analysis.

---

## Enhanced Plan Classification

### 6-Signal Algorithm (Full Version)

| Signal | Weight | Implementation |
|--------|--------|---------------|
| Git recency | 25% | `git log -1 --format=%ci -- <plan-file>` |
| Content freshness | 20% | Checkbox ratio: complete / total |
| Branch/PR correlation | 20% | `gh pr list --search <plan-slug>` |
| Supersession detection | 15% | Frontmatter `superseded_by` or same feature + later date |
| Code reference validation | 10% | Check if referenced files still exist |
| Commit message cross-ref | 10% | `git log --grep=<plan-slug> --oneline` |

### Combined Classification

```
explicit frontmatter status -> use it (highest trust)
superseded_by set -> mark superseded
< 30% code refs exist -> dead
branch open + recent commits -> current
merged PR + > 80% checkbox complete -> historical
no activity > 180 days -> dead
no activity > 60 days + low completion -> abandoned
recent activity but low completion -> in_progress
otherwise -> needs_human_confirmation
```

### Git History Cross-Reference

For plans without explicit status:
1. Extract key terms from plan title
2. Search commit messages: `git log --all --grep="<term>" --since="6 months ago" --oneline`
3. If commits found implementing plan features: likely historical (work was done)
4. If commits found reverting plan features: likely abandoned
5. Cross-reference commit dates against plan dates for temporal ordering

---

## Laravel Pattern Detection

### Common Patterns to Detect

| Pattern | Detection Method | Implications |
|---------|-----------------|-------------|
| Admin/User parity | `app/Filament/` exists alongside `resources/views/` | Dual UI surface; changes may need both |
| Multi-tenancy | `tenant_id` columns, `BelongsToTenant` trait, tenant middleware | Scope queries, test with multiple tenants |
| API versioning | `routes/api/v1.php`, `routes/api/v2.php` | Version-aware impact assessment |
| Domain-driven design | `app/Domain/` or `app/Modules/` | Module boundaries in impact tracing |
| Action pattern | `app/Actions/` directory | Single-purpose classes, trace callers |
| Repository pattern | `app/Repositories/` directory | Data access abstraction layer |
| Event sourcing | `stored_events` table, Spatie Event Sourcing | Replay concerns, projector tracing |
| CQRS | Separate read/write models | Impact on both read and write paths |
| Feature flags | `laravel-pennant`, `config/features.php` | Conditional behavior in impact |

### Architecture Inference

Run this detection during `fv:repo-catchup`:

1. Scan `app/` subdirectories for pattern directories
2. Check `composer.json` for pattern-indicating packages
3. Run `php artisan route:list --json` for API versioning detection
4. Sample 3-5 files per pattern directory to extract conventions
5. Majority-wins for each convention dimension
6. Flag inconsistencies as legacy drift zones (< 80% consistency)

---

## Risk Zone Detection

### Hotspot Analysis (Tornhill Method)

```
hotspot_score = normalize(churn) * normalize(complexity)
```

- **Churn**: commits in last 12 months via `git log --name-only --since="12 months ago"`
- **Complexity**: LOC as proxy via file size
- **Top-right quadrant** (high churn + high complexity) = primary risk zones

### Specific Risk Indicators

| Risk | Detection | Threshold |
|------|-----------|-----------|
| Bus factor = 1 | `git shortlog -sn -- <file>` shows single author | 1 author for > 90% of commits |
| Fat controller | `wc -l app/Http/Controllers/*.php` | > 300 LOC |
| God model | `wc -l app/Models/*.php` | > 500 LOC |
| Missing tests | Compare `app/` classes against `tests/` | Class with no corresponding test |
| Temporal coupling | Files that always change together | `git log --name-only` pair analysis |
| Raw SQL | `DB::raw`, `DB::select`, `DB::statement` | Any occurrence outside migrations |
| Missing types | Methods without return types | > 20% of public methods |

### Risk Map Output

Produce a risk summary for `docs/ai/repo-map.md`:

```markdown
## Risk Zones

| File/Directory | Risk Score | Indicators | Recommendation |
|---------------|-----------|------------|----------------|
| app/Models/User.php | High | 650 LOC, 45 commits/year, 1 author | Extract traits, add tests |
| app/Http/Controllers/OrderController.php | Medium | 380 LOC, 30 commits/year | Split into resource controllers |
```

---

## Ownership Hints

When bus factor analysis identifies expertise concentration:

```markdown
## Ownership Hints

| Area | Primary Author | Commits | Recommendation |
|------|---------------|---------|----------------|
| Payment processing | alice@example.com | 85% | Pair review required |
| Admin panel | bob@example.com | 90% | Knowledge transfer needed |
```

These hints feed into `fv:review` agent panel decisions (more review agents for single-author zones).
