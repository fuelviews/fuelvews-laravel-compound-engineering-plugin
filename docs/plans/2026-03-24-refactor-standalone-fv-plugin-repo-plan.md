---
title: Make this a standalone fuelviews-engineering plugin repo
type: refactor
status: drafting
date: 2026-03-24
---

# Make This a Standalone Fuelviews Engineering Plugin Repo

## Overview

Currently this repo is a fork of the compound-engineering plugin repo. It contains the CE plugin, CLI converter, tests, and marketplace metadata for multiple plugins. Strip it down to be a standalone fuelviews-engineering plugin repo where the root IS the plugin.

## Current Structure (what exists)

```
repo/
├── .claude-plugin/marketplace.json    # Marketplace with CE + coding-tutor + fv
├── plugins/compound-engineering/      # CE plugin source (NOT ours)
├── plugins/coding-tutor/              # Coding tutor plugin (NOT ours)
├── plugins/fuelviews-engineering/     # OUR plugin
├── src/                               # CLI converter (NOT ours)
├── tests/                             # Converter tests (NOT ours)
├── scripts/                           # Release scripts (NOT ours)
├── node_modules/                      # Bun/Node deps for CLI
├── package.json                       # CLI package config
├── bun.lock                           # Bun lockfile
├── tsconfig.json                      # TypeScript config
├── MASTER-PLAN.md                     # CE master plan
├── CHANGELOG.md                       # CE changelog
├── compound-engineering.local.md      # CE local config
├── todos/                             # CE todos
├── AGENTS.md                          # Root AGENTS.md (references both CE + fv)
├── CLAUDE.md                          # Root CLAUDE.md (shim)
├── README.md                          # CE repo readme
├── docs/                              # Plans, solutions (mixed CE + fv)
```

## Target Structure (what we want)

```
repo/
├── .claude-plugin/
│   ├── plugin.json                    # fv plugin manifest (existing, moved from plugins/fuelviews-engineering/)
│   └── marketplace.json               # fv-only marketplace
├── agents/                            # Moved from plugins/fuelviews-engineering/agents/
│   ├── review/
│   └── workflow/
├── skills/                            # Moved from plugins/fuelviews-engineering/skills/
│   ├── fv-plan/
│   ├── fv-review/
│   ├── fv-work/
│   └── ...
├── references/                        # Moved from plugins/fuelviews-engineering/references/
├── templates/                         # Moved from plugins/fuelviews-engineering/templates/
├── hooks/                             # Moved from plugins/fuelviews-engineering/hooks/
├── .mcp.json                          # Moved from plugins/fuelviews-engineering/.mcp.json
├── AGENTS.md                          # fv AGENTS.md (moved from plugins/fuelviews-engineering/)
├── CLAUDE.md                          # fv CLAUDE.md (moved from plugins/fuelviews-engineering/)
├── README.md                          # fv README.md (moved from plugins/fuelviews-engineering/)
├── docs/                              # Keep fv-relevant plans only
│   ├── plans/
│   ├── impact/
│   └── solutions/
├── .claude/                           # Claude Code project config
│   ├── settings.local.json
│   └── skills/                        # GitNexus skills (if present)
├── .gitignore
├── LICENSE
```

## Steps

### 1. Move fv plugin contents to root

Move everything from `plugins/fuelviews-engineering/` to repo root:

```
plugins/fuelviews-engineering/agents/     → agents/
plugins/fuelviews-engineering/skills/     → skills/
plugins/fuelviews-engineering/references/ → references/
plugins/fuelviews-engineering/templates/  → templates/
plugins/fuelviews-engineering/hooks/      → hooks/
plugins/fuelviews-engineering/.mcp.json   → .mcp.json
plugins/fuelviews-engineering/AGENTS.md   → AGENTS.md
plugins/fuelviews-engineering/CLAUDE.md   → CLAUDE.md
plugins/fuelviews-engineering/README.md   → README.md
plugins/fuelviews-engineering/.claude-plugin/ → .claude-plugin/
plugins/fuelviews-engineering/.cursor-plugin/ → .cursor-plugin/
```

### 2. Update marketplace.json

Replace the multi-plugin marketplace with fv-only:

```json
{
  "name": "fuelviews-engineering-marketplace",
  "owner": {
    "name": "Joshua Mitchener",
    "url": "https://github.com/fuelviews"
  },
  "metadata": {
    "description": "Fuelviews Engineering plugin for Claude Code",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "fuelviews-engineering",
      "description": "Laravel-focused engineering workflow with impact discovery, convergent review, and repo-layer truth. Requires compound-engineering plugin.",
      "author": {
        "name": "Joshua Mitchener",
        "url": "https://github.com/fuelviews"
      },
      "homepage": "https://github.com/fuelviews/fuelvews-laravel-compound-engineering-plugin",
      "tags": ["laravel", "php", "livewire", "filament", "blade", "postgresql"],
      "source": "."
    }
  ]
}
```

Note: `"source": "."` — the root IS the plugin now.

### 3. Delete everything that belongs to CE/CLI

**Delete directories:**
- `plugins/` (entire directory — fv contents already moved)
- `src/` (CLI converter)
- `tests/` (converter tests)
- `scripts/` (release scripts)
- `node_modules/`
- `todos/` (CE todos)
- `.github/` (CE workflows — recreate fv-specific ones if needed)

**Delete files:**
- `package.json`
- `package-lock.json`
- `bun.lock`
- `tsconfig.json`
- `MASTER-PLAN.md`
- `CHANGELOG.md` (CE changelog — fv will start fresh)
- `compound-engineering.local.md`
- `PRIVACY.md` (CE privacy)
- `SECURITY.md` (CE security)

### 4. Update AGENTS.md

The current root AGENTS.md references both CE and fv. Replace it entirely with the fv plugin's AGENTS.md (already moved in step 1). Remove all references to:
- "converter/install CLI"
- "secondary plugins such as `plugins/coding-tutor/`"
- `src/` and converter-related instructions
- `bun test` and `bun run release:validate`

### 5. Clean up docs/

Keep only fv-relevant content:
- `docs/plans/` — keep fv plans (2026-03-22+), remove older CE plans
- `docs/impact/` — keep all (fv-only)
- `docs/solutions/` — keep all (useful learnings)
- Remove `docs/brainstorms/` if it only has CE content
- Remove `docs/specs/` if it only has CE content

### 6. Update .gitignore

Simplify — remove CLI/node/bun entries, keep basics:

```
.gitnexus/
node_modules/
.env
.DS_Store
.idea/
```

### 7. Update plugin.json source/homepage

Update `plugin.json` to reflect the new structure:
- `"source": "."` in marketplace
- Homepage and repository URLs stay the same

### 8. Update README.md

The fv README.md (already at root from step 1) needs minor updates:
- Remove "Requires: compound-engineering plugin" as a sibling directory reference — change to "Requires: compound-engineering plugin installed"
- Update any paths that referenced `plugins/fuelviews-engineering/`

## Acceptance Criteria

- [ ] Repo root IS the plugin (agents/, skills/, references/ at root)
- [ ] `.claude-plugin/plugin.json` exists at root with fv manifest
- [ ] `.claude-plugin/marketplace.json` contains only fv plugin with `"source": "."`
- [ ] No `plugins/`, `src/`, `tests/`, `scripts/`, `node_modules/` directories
- [ ] No `package.json`, `bun.lock`, `tsconfig.json`
- [ ] AGENTS.md is fv-only (no CE/CLI references)
- [ ] All fv plans in docs/plans/ are intact
- [ ] Plugin installs correctly from the new structure

## Risk

- **Git history**: Moving files loses per-file git history. Use `git mv` to preserve it where possible.
- **Marketplace references**: Anyone using the old marketplace URL will get the new fv-only marketplace. This is correct since we're making this repo fv-only.
- **CE dependency**: fv still requires CE installed as a separate plugin. This doesn't change — we're just removing CE's source from this repo.
