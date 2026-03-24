---
title: Fix fv plugin contradictions, add Herd MCP + Chrome browser integration
type: refactor
status: drafting
date: 2026-03-23
reviewed_at: 2026-03-23
---

# Fix fv Plugin Contradictions, Add Herd MCP + Chrome Browser Integration

## Overview

Fix the remaining contradictions in fv review agents, wire Herd MCP infrastructure detection into the session startup (matching Boost pattern), and add Chrome browser automation for debugging/testing/visual verification during work and review.

## Part 1: Fix Agent Contradictions (3 file changes)

### 1a: Give N+1 entirely to performance-reviewer

**postgresql-reviewer:** Remove N+1 from scope. Add defer: "N+1 query detection (all levels, including missing with(), lazy loading, withCount()) defers to laravel-performance-reviewer."

**laravel-performance-reviewer:** Clarify scope: "Owns all N+1 detection — preventLazyLoading(), missing with(), lazy loading in loops, withCount()/withSum(). Database-level index optimization defers to postgresql-reviewer."

### 1b: Fix conventions-reviewer P1 gap

Add to `laravel-conventions-reviewer` severity guide: "Convention violations are never P1. Maximum severity is P2 for cross-feature inconsistency."

Add reference: "Apply severity definitions from [severity-policy.md](../references/severity-policy.md)."

### 1c: Add ast-grep to blade-reviewer

Add to blade-reviewer Operational Guidelines:
```
Use `ast-grep` via shell for structural Blade pattern detection
(e.g., `ast-grep -p '{!! $_ !!}' --lang php` to find unescaped output).
One command at a time.
```

## Part 2: Herd MCP Integration

Mirror the Boost pattern: detect in start-session, wire specific tools into specific skill steps where they add value. Same approach as Boost — explicit tool calls at the right moments, not passive discovery.

### 2a: New reference file — `references/herd-integration.md`

Document Herd MCP tools and when agents should use them:

| Tool | What it does | When to use |
|------|-------------|-------------|
| `site_information` | Current site URL, env vars, PHP/Node versions | Session init, environment context |
| `debug_site` | Captures queries, jobs, logs, dumps, HTTP requests | When debugging test failures or tracing execution |
| `get_all_sites` | Lists all local Herd sites | Environment discovery |
| `find_available_services` | MySQL, Redis, Typesense status and connections | Service verification |
| `get_all_php_versions` | Installed PHP versions | PHP compatibility checks |
| `install_service` | Install and configure services | When a required service is missing |
| `start_or_stop_service` | Control running services | When a service needs restart |
| `isolate_or_unisolate_site` | Lock project to specific PHP version | PHP version testing |

### 2b: fv:start-session Step 7b (NEW — after Boost, before session brief)

Place Herd detection alongside Boost (both are infrastructure MCP servers):

1. Detect Herd: check `which herd` or `/Applications/Herd.app` exists
2. If Herd detected but MCP not configured: use **AskUserQuestion**:
   - "Configure Herd MCP now (recommended)" — run `claude mcp add herd php /Applications/Herd.app/Contents/Resources/herd-mcp.phar -e SITE_PATH="$(pwd)"`
   - "Skip" — proceed without Herd
3. If Herd MCP available: call `site_information` for environment context, `find_available_services` for service status
4. Add to session brief: `Herd: available (PHP X.Y, MySQL running, Redis running)` or `Herd: not detected`
5. If both Boost and Herd active: note "Full-stack context: Boost (application) + Herd (infrastructure)"

### 2c: Wire into fv:work Phase 2 (execution loop)

Add Herd tools alongside existing Boost tools for debugging and environment management:

```
- When tests fail or errors occur:
  1. Use Boost `last-error` and `read-log-entries` for application-level errors (existing)
  2. If Herd available, also use `debug_site` for broader execution context —
     captures queries, dispatched jobs, HTTP requests, and variable dumps automatically.
     This is faster than manually checking logs, tinker, and telescope separately.
  3. If service-related error (connection refused, timeout):
     use `find_available_services` to check if MySQL/Redis/queue is running,
     use `start_or_stop_service` to restart if needed.
- When switching PHP versions for compatibility testing:
  use `isolate_or_unisolate_site` to lock the project to a specific version.
```

### 2d: Wire into fv:review (pre-dispatch environment context)

Add Herd environment context to the review pre-dispatch section alongside Boost:

```
- If Herd available, call `site_information` to include environment context:
  PHP version, Node version, active services, site URL.
  This supplements Boost `application-info` with infrastructure-level data
  (Boost knows the app, Herd knows the environment).
- During end-to-end testing, use `debug_site` to capture execution context
  (queries, jobs, logs) for each test scenario.
```

### 2e: Wire into fv:normalize Phase 0 (toolchain detection)

Use Herd for accurate PHP version detection:

```
- If Herd available, call `get_all_php_versions` to detect all installed PHP versions.
  This is more complete than `php --version` (shows all installed, not just active).
- Use `site_information` for environment snapshot in the audit report.
```

### 2f: Permissions

Add Herd MCP permissions to fv:start-session Step 1b allow list (only if Herd detected):
```
"mcp__herd__site_information"
"mcp__herd__debug_site"
"mcp__herd__get_all_sites"
"mcp__herd__find_available_services"
"mcp__herd__get_all_php_versions"
"mcp__herd__start_or_stop_service"
```

## Part 3: Chrome Browser Automation for Debugging/Testing/Work

The claude-in-chrome MCP server provides browser automation tools that should be used during implementation and review for visual verification, debugging, and testing.

### 3a: New reference file — `references/chrome-browser-integration.md`

Document when and how to use Chrome browser tools in the engineering workflow:

| Tool | What it does | When to use |
|------|-------------|-------------|
| `navigate` | Open a URL in Chrome | Navigate to local dev site for testing |
| `read_page` | Screenshot + DOM snapshot | Visual verification after UI changes |
| `get_page_text` | Extract visible text | Verify rendered content |
| `javascript_tool` | Execute JS in page | Debug runtime state, check Alpine/Livewire |
| `read_console_messages` | Read browser console | Catch JS errors, debug Alpine/Livewire |
| `read_network_requests` | Monitor network activity | Verify API calls, check for N+1 HTTP requests |
| `form_input` | Fill form fields | Test form submissions |
| `find` | Find elements on page | Locate UI components for interaction |
| `computer` | Click, scroll, interact | Test user flows end-to-end |
| `gif_creator` | Record interaction as GIF | Document UI changes for PR descriptions |
| `tabs_context_mcp` | Get current browser state | Understand what's open before automating |

### 3b: Wire into fv:work Phase 2 (execution loop)

Add to the execution loop after test runs:

```
- After implementing UI changes, use Chrome browser tools for visual verification:
  1. Call `tabs_context_mcp` to check browser state
  2. Navigate to the affected page (`navigate` tool)
  3. Take a screenshot (`read_page`) to verify the change looks correct
  4. Check browser console (`read_console_messages`) for JS errors
  5. If Livewire/Alpine: use `javascript_tool` to verify component state
  6. If form changes: use `form_input` + `computer` to test the flow
  7. Use `gif_creator` to record the interaction for the PR description
- When debugging test failures involving HTTP responses:
  1. Navigate to the failing route
  2. Use `read_network_requests` to inspect the response
  3. Use `read_console_messages` to check for client-side errors
  4. Use `javascript_tool` to inspect page state
```

This is optional — only use browser tools when the task involves UI, Livewire, or browser-visible behavior.

### 3c: Wire into fv:review Step 6 (end-to-end testing)

The fv:review skill already has an "End-to-End Testing" section that offers browser testing. Update it to reference Chrome tools explicitly:

```
For browser testing, use claude-in-chrome MCP tools:
1. Navigate to affected pages
2. Take screenshots for before/after comparison
3. Check console for errors
4. Test form submissions and interactions
5. Record GIFs of key flows for PR documentation
```

### 3d: Wire into fv:work Phase 4 (Ship It — screenshot capture)

The skill already has a "Capture and Upload Screenshots" section. Update to use Chrome tools as the primary method:

```
For screenshot capture, use claude-in-chrome MCP tools:
1. Navigate to the page: `navigate` tool
2. Take screenshot: `read_page` tool (returns screenshot + DOM)
3. For animated interactions: `gif_creator` tool
```

## Files Changed

| File | Action |
|------|--------|
| `agents/review/postgresql-reviewer.md` | Remove N+1 from scope, add defer |
| `agents/review/laravel-performance-reviewer.md` | Clarify N+1 ownership |
| `agents/review/laravel-conventions-reviewer.md` | Add P1 definition, add severity-policy.md ref |
| `agents/review/blade-reviewer.md` | Add ast-grep guidance |
| `references/herd-integration.md` | **NEW** — Herd MCP tool reference |
| `references/chrome-browser-integration.md` | **NEW** — Chrome browser tool reference |
| `skills/fv-start-session/SKILL.md` | Add Step 7b (Herd detection + install), add Herd permissions |
| `skills/fv-work/SKILL.md` | Add Herd debug_site for test failures, service management, Chrome visual verification + screenshot capture |
| `skills/fv-review/SKILL.md` | Add Herd environment context to pre-dispatch, Chrome for end-to-end testing |
| `skills/fv-normalize/SKILL.md` | Add Herd PHP version detection |
| `README.md` | Update reference count (15 -> 17) |

## Acceptance Criteria

- [ ] N+1 ownership clearly assigned to performance-reviewer only
- [ ] postgresql-reviewer scope no longer mentions N+1
- [ ] conventions-reviewer has P1 definition and severity-policy.md reference
- [ ] blade-reviewer has ast-grep guidance
- [ ] Herd MCP detected and offered for install in fv:start-session (mirrors Boost pattern)
- [ ] Herd `debug_site` used in fv:work when tests fail (alongside Boost `last-error`)
- [ ] Herd `find_available_services` + `start_or_stop_service` used for service errors in fv:work
- [ ] Herd `site_information` included in fv:review pre-dispatch environment context
- [ ] Herd `get_all_php_versions` used in fv:normalize PHP detection
- [ ] Chrome browser tools documented in reference file
- [ ] fv:work uses Chrome for visual verification after UI changes
- [ ] fv:work uses Chrome for debugging HTTP/JS errors
- [ ] fv:review references Chrome for end-to-end testing
- [ ] README reference count updated

## Sequencing

This plan is independent of the token consolidation plan. If consolidation ships first (merging performance-reviewer + postgresql-reviewer into laravel-data-reviewer), the N+1 fix in Part 1a is absorbed into the merge. The remaining changes (conventions P1 gap, blade ast-grep, Herd, Chrome) still apply.
