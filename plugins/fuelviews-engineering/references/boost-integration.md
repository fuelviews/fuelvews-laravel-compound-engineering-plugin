# Boost Integration

Reference for detecting, reading, and extending Laravel Boost outputs.

---

## Detection

Check for Boost installation:

1. Read `composer.json` or `composer.lock`
2. Search for `laravel-boost` or `laravel/boost` in require/require-dev
3. If found: Boost is installed, read its outputs
4. If not found: suggest once, record decision

### Suggestion Protocol

Boost suggestion happens in `fv:start-session` or `fv:repo-catchup`:

1. Check if `docs/ai/conventions.md` contains a `boost: declined` entry
2. If declined: do not suggest again
3. If no entry: suggest once: "Laravel Boost can provide additional code analysis signals. Install? (y/n)"
4. Record the decision in `docs/ai/conventions.md`:

```yaml
boost:
  status: installed | declined
  decided_at: YYYY-MM-DD
```

---

## Reading Boost Outputs

When Boost is installed, its outputs serve as additional signal sources:

| Boost Output | Location | Use |
|-------------|----------|-----|
| Architecture analysis | `.boost/architecture.md` | Feed to fv:start-session context |
| Code quality report | `.boost/quality.md` | Feed to fv:review as pre-scan data |
| Dependency graph | `.boost/dependencies.md` | Feed to impact-assessment-agent |

Read Boost files during:
- `fv:start-session` (architecture context)
- `fv:review` (quality pre-scan)
- `fv:impact` (dependency graph supplement)

Treat Boost data as advisory, not authoritative. Cross-validate against actual code.

---

## Extending Boost Files

When fv skills produce insights relevant to Boost files, append them using delimited sections:

```markdown
<!-- fv:start -->
## Fuelviews Engineering Insights

[fv-generated content here]
<!-- fv:end -->
```

### Marker Validation

Before modifying any Boost file:
1. Check for existing `<!-- fv:start -->` and `<!-- fv:end -->` markers
2. Validate: exactly one start marker, exactly one end marker, start before end, no nesting
3. If markers are malformed: warn and do not modify (risk of corrupting Boost content)
4. If markers exist and are valid: replace content between them
5. If no markers exist: append new markers at the end of the file

### Content Ownership

- Content OUTSIDE markers belongs to Boost -- never modify it
- Content BETWEEN markers belongs to fv -- safe to regenerate
- On Boost regeneration: fv markers and content are preserved if Boost respects them

### Regeneration Safety

Before regenerating fv content in a Boost file:
1. Read the file
2. Verify markers are well-formed
3. Extract existing fv content (for diff)
4. Generate new fv content
5. Replace between markers
6. Write the file
7. If the file was not modified (content identical): skip write
