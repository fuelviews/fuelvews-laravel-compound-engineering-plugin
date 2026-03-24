# Plugin Instructions

These instructions apply when working under `plugins/fuelviews-engineering/`.
They supplement the repo-root `AGENTS.md`.

# Fuelviews Engineering Plugin Development

## Plugin Dependency

This plugin requires the `compound-engineering` plugin to be installed alongside it.
fv references CE agents directly via the `compound-engineering:` namespace.

## Versioning Requirements

**IMPORTANT**: Routine PRs should not cut releases for this plugin.

The repo uses an automated release process to prepare plugin releases, including version selection and changelog generation. Because multiple PRs may merge before the next release, contributors cannot know the final released version from within an individual PR.

### Contributor Rules

- Do **not** manually bump `.claude-plugin/plugin.json` version in a normal feature PR.
- Do **not** manually bump marketplace plugin version in a normal feature PR.
- Do **not** cut a release section in the canonical root `CHANGELOG.md` for a normal feature PR.
- Do update substantive docs that are part of the actual change, such as `README.md`, component tables, usage instructions, or counts when they would otherwise become inaccurate.

### Pre-Commit Checklist

Before committing ANY changes:

- [ ] No manual release-version bump in `.claude-plugin/plugin.json`
- [ ] No manual release-version bump in marketplace manifests
- [ ] No manual release entry added to the root `CHANGELOG.md`
- [ ] README.md component counts verified
- [ ] README.md tables accurate (agents, skills)
- [ ] plugin.json description matches current counts

### Directory Structure

```
agents/
├── review/     # Laravel-focused code review agents
└── workflow/   # Impact assessment and synthesis agents

skills/
├── fv-*/       # Core workflow skills (fv:plan, fv:review, etc.)

hooks/
└── hooks.json  # Workflow boundary checks and gates

templates/
├── repo-layer/ # docs/ai/ scaffold templates
└── *.md        # Artifact templates (plan, impact, index, etc.)

references/
└── *.md        # Distilled guidelines and workflow rules
```

## Skill Naming Convention

Skill directories use hyphens: `fv-plan/`, `fv-review/`, `fv-start-session/`.
Skill frontmatter `name:` uses colons: `fv:plan`, `fv:review`, `fv:start-session`.

This follows CE's convention where directory `ce-plan/` has frontmatter `name: ce:plan`.

## Agent Naming Convention

All fv-owned agents use the `fuelviews-engineering:<category>:<name>` namespace.

CE agents referenced by fv skills use the `compound-engineering:<category>:<name>` namespace.
Never use short agent names alone -- always use the fully-qualified namespace.

## Agent Categories

- `review` -- Code review agents (PHP, Laravel, Blade, JS, PostgreSQL, conventions, health, performance)
- `workflow` -- Impact assessment and synthesis agents

## Skill Compliance Checklist

When adding or modifying skills, verify compliance:

### YAML Frontmatter (Required)

- [ ] `name:` present and uses colon separator (e.g., `fv:plan`)
- [ ] `description:` present and describes what it does and when to use it

### Cross-Platform User Interaction

- [ ] When a skill needs to ask the user a question, instruct use of the platform's blocking question tool and name the known equivalents (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini)
- [ ] Include a fallback for environments without a question tool (present numbered options and wait for user reply)

### Cross-Platform Task Tracking

- [ ] When a skill needs to create or track tasks, describe the intent and name known equivalents (`TaskCreate`/`TaskUpdate`/`TaskList` in Claude Code, `update_plan` in Codex)
- [ ] Do not reference `TodoWrite` or `TodoRead` -- these are legacy tools
- [ ] Prefer parallel dispatch with sequential fallback for sub-agents

### Reference Links

- [ ] All files in `references/` are linked as `[filename.md](./references/filename.md)`
- [ ] No bare backtick references -- use proper markdown links

### Cross-Platform Reference Rules

- [ ] Inside SKILL.md, prefer semantic wording ("load the `fv-plan` skill") over slash syntax
- [ ] Use slash syntax only for actual published commands (e.g., `/fv:plan`)

### Tool Selection

- [ ] Never instruct agents to use shell commands for routine file discovery or reading
- [ ] Describe tools by capability class with platform hints
- [ ] For shell-only workflows, use simple single commands without chaining

## Script and File Path Convention

When referencing scripts or files bundled with a skill, use `${CLAUDE_SKILL_DIR}` for path resolution. This resolves to the skill's directory at runtime regardless of working directory.

Example: `bash ${CLAUDE_SKILL_DIR}/scripts/process.mjs`

## Adding Components

- **New skill:** Create `skills/<name>/SKILL.md` with required YAML frontmatter (`name`, `description`). Keep SKILL.md under 500 lines — move templates, tables, and reference content to `skills/<name>/references/`. Add to README.md tables and update counts.
- **New agent:** Create `agents/<category>/<name>.md` with frontmatter. Add `effort` level and `skills` preloading where appropriate. Add to README.md and update counts.
