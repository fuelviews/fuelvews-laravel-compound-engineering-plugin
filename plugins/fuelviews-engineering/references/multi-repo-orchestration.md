# Multi-Repo Orchestration

Reference for cross-repo impact tracking, git workflow handling, and fork safety.

---

## Related Repo Detection

Detect related repositories from `composer.json`:

1. Check `repositories` key for local path dependencies (`type: path`)
2. Check `require` / `require-dev` for packages owned by the same GitHub org
3. Validate local paths are within the expected workspace root (no `../../../` traversal)

```json
{
  "repositories": [
    {
      "type": "path",
      "url": "../my-package"
    }
  ]
}
```

### Path Safety

Before resolving any local path from `composer.json`:
- Normalize the path and verify it stays within the workspace root
- Reject paths containing `../` that would escape the workspace
- Log the resolved absolute path for audit

---

## Cross-Repo Impact Tracking

When impact assessment discovers dependencies in other repositories:

### Impact Artifact Extension

Add a `## Cross-Repo Dependencies` section to the impact artifact:

```markdown
## Cross-Repo Dependencies

| Repo | Package | Interface | Impact | Confidence |
|------|---------|-----------|--------|------------|
| ../my-package | my-org/my-package | ServiceInterface | Method signature change | definite |
```

### Plan References

Plans can reference work in other repos:

```markdown
## Cross-Repo Work

- [ ] Update `my-org/my-package` ServiceInterface (see ../my-package plan)
- [ ] Bump package version constraint in composer.json
```

---

## Git Workflow by Repo Type

| Repo Type | PR Target | Branch From | Push To |
|-----------|-----------|-------------|---------|
| App | `dev` | `dev` | `origin` |
| Package | `main` | `main` | `origin` |
| Package fork | `main` (fork) | `main` (fork) | `origin` (fork) |

### Auto-Detection

1. Read `composer.json` `type` field: `library` = package, else app
2. Check for `upstream` remote: present = fork
3. If `type` is absent, infer from directory structure (presence of `src/` + no `app/` = likely package)

### App Workflow

- Create feature branches from `dev` (or `develop`, falling back to `main`)
- PR targets `dev`
- After merge to `dev`, release process handles `dev` -> `main`

### Package Workflow

- Create feature branches from `main`
- PR targets `main`
- Tag releases from `main`

### Fork Workflow

- Create feature branches from fork's `main`
- PR targets fork's `main` (NEVER upstream)
- Require explicit user confirmation for any push operation

---

## Fork Safety

### Remote Allowlist

Store allowed push targets in `docs/ai/conventions.md`:

```yaml
git:
  push_remotes:
    - origin
  blocked_remotes:
    - upstream
```

### Pre-Push Validation

Before any push or PR creation:
1. Read the remote allowlist from conventions.md
2. Verify the target remote is in the allowlist
3. If target is `upstream` or any blocked remote: refuse and explain
4. If no allowlist exists: default to allowing `origin` only
5. For fork repos: require explicit user confirmation even for allowed remotes

### Merge Order for Multi-Repo Changes

When changes span multiple repos, merge in dependency order:
1. Leaf packages first (no dependencies on other changed packages)
2. Intermediate packages next
3. App repo last (depends on all packages)

Wait for CI to pass on each package before merging the next level.
