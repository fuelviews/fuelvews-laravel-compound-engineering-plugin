# Worktree Adapter Contract

Reference document defining the fv-owned worktree contract. This is not
executable code -- it specifies the two-layer interface that fv skills use to
manage worktrees safely.

---

## Two-Layer Contract

### Layer 1 -- Delegated CE Verbs

These operations are resolved by invoking the CE `git-worktree` skill
(`compound-engineering` plugin). The fv wrapper never re-implements them.

| Verb | CE Mapping | Description |
|------|-----------|-------------|
| `create(taskSlug, branchType)` | `worktree-manager.sh create <branch> [from]` | Create worktree with branch naming |
| `list()` | `worktree-manager.sh list` | List all worktrees with status |
| `switch(name)` | `worktree-manager.sh switch <name>` | Switch to an existing worktree |
| `copyEnv(name?)` | `worktree-manager.sh copy-env <name>` | Copy .env files to a worktree |
| `cleanup()` | `worktree-manager.sh cleanup` | Interactive cleanup of inactive worktrees |

Delegated verbs are always invoked via the CE script path:

```
${CE_PLUGIN_ROOT}/skills/git-worktree/scripts/worktree-manager.sh <verb> [args]
```

### Layer 2 -- Wrapper-Owned Helpers

These are fv implementation details that do not call CE scripts.

| Helper | Implementation | Description |
|--------|---------------|-------------|
| `active()` | `git worktree list --porcelain` | Derive the currently active worktree from git output |

The `active()` helper parses porcelain output to find the worktree whose
path matches the current working directory. It never calls the CE script.

### Optional Wrapper Behavior

`remove(name)` is an optional wrapper-owned verb for targeted worktree
removal. It is NOT a CE delegated verb. When present, it calls
`git worktree remove` directly with array-based argument passing. Plugins
that do not need targeted removal can omit it entirely.

---

## Slug Validation

Task slugs must match this pattern:

```
^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$
```

Rules:
- Lowercase alphanumeric and hyphens only
- Must start and end with an alphanumeric character
- Minimum 2 characters, maximum 80 characters
- No consecutive hyphens
- No uppercase, underscores, dots, or slashes

Validate slugs before passing to any CE verb or branch naming logic.

---

## Branch Naming

Format: `<type>/<task-slug>`

- Lowercase only, hyphens within slug
- Maximum 80 characters total (type + slash + slug)
- Type values: `feature`, `fix`, `chore`, `refactor`, `docs`

Examples:
- `feature/add-user-export`
- `fix/order-total-rounding`
- `chore/update-dependencies`

---

## Repo-Type-Aware Base Branches

The base branch for worktree creation depends on the repository type.

| Repo Type | Base Branch | Fallback Order |
|-----------|-------------|----------------|
| App | `dev` | `develop`, then `main` |
| Package | `main` | (none) |
| Package fork | `main` on fork remote | NEVER upstream `main` |

### Fork Safety

For package forks:
- Always resolve `main` from the fork remote (typically `origin`)
- NEVER use the upstream remote's `main` as a base branch
- Validate `origin != upstream` before any push or PR operation
- Require explicit user confirmation for fork operations
- Respect git remote allowlist defined in `docs/ai/conventions.md` if present

---

## Command Execution Safety

All worktree commands (both delegated and wrapper-owned) MUST use
array-based argument construction, never string interpolation.

Correct (array-based):
```
args = ["create", taskSlug, baseBranch]
execute(scriptPath, args)
```

Wrong (string interpolation):
```
command = "bash #{scriptPath} create #{taskSlug} #{baseBranch}"
shell(command)
```

This prevents shell injection when slugs or branch names contain
unexpected characters (even after validation).

---

## CE Dependency Validation

Before any worktree operation, verify that the CE git-worktree skill is
available:

1. Resolve the CE plugin root (check `CLAUDE_PLUGIN_ROOT` siblings or
   known install paths)
2. Confirm the script path exists:
   `<CE_ROOT>/skills/git-worktree/scripts/worktree-manager.sh`
3. Confirm required delegated verbs are available by checking the script
   responds to `--help` or `list` without error
4. If CE is not found, hard-fail with a message directing the user to
   install the `compound-engineering` plugin

This validation runs once per session (typically during `fv:start-session`)
and the result is cached for subsequent worktree operations.

---

## Skill Integration Points

### fv:plan

- During plan creation (Phase 0), prompt the user to create a worktree
  for the task
- Record the user's choice (`worktree: true/false`) in plan frontmatter
- If accepted, call `create(taskSlug, branchType)` with the plan's task
  slug and inferred branch type
- Store the worktree path in plan frontmatter for downstream skills

### fv:work

- On entry, call `active()` to determine the current worktree
- Verify the active worktree matches the task slug from the plan
- If mismatched, warn the user and offer to `switch(name)` to the
  correct worktree
- If no worktree exists for the task, offer to create one

### fv:close-task

- After all close-task gates pass, suggest worktree cleanup
- Call `list()` to show the user which worktrees are active
- Offer `cleanup()` for interactive removal
- Do not force cleanup -- the user may want to keep the worktree for
  reference

---

## Resolution Modes

The adapter supports two resolution modes for locating CE:

| Mode | CE Location | When |
|------|-------------|------|
| Repo/dev | Sibling plugin directory in the same repo | Development and testing |
| Installed | Platform-specific plugin install path | Production use after install |

Both modes use the same delegated verb interface. The only difference is
how `CE_PLUGIN_ROOT` is resolved.
