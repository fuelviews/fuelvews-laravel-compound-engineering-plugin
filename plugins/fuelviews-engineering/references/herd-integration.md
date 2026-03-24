# Herd MCP Integration

Laravel Herd's MCP server provides infrastructure-level context that complements Boost's application-level tools. Herd knows your environment (services, PHP versions, site config, debugging); Boost knows your app (routes, models, schema, packages).

## Tools

| Tool | What it does | When to use |
|------|-------------|-------------|
| `site_information` | Current site URL, env vars, PHP/Node versions | Session init, environment context for reviews |
| `debug_site` | Captures queries, jobs, logs, dumps, HTTP requests | When debugging test failures or tracing execution |
| `get_all_sites` | Lists all local Herd sites with URLs and paths | Environment discovery |
| `find_available_services` | MySQL, Redis, Typesense status and connection details | Service verification, diagnosing connection errors |
| `get_all_php_versions` | Installed PHP versions and their status | PHP compatibility checks, normalization |
| `install_service` | Install and configure services with specified ports | When a required service is missing |
| `start_or_stop_service` | Control running services (start, stop, restart) | When a service needs restart during work |
| `isolate_or_unisolate_site` | Lock project to specific PHP version | PHP version testing, compatibility checks |
| `get_last_deployment_information` | Laravel Forge deployment history for linked sites | Cross-referencing with production state |
| `secure_or_unsecure_site` | Enable/disable HTTPS and manage TLS certificates | Security review, HTTPS verification |

## Detection

Check for Herd: `which herd` succeeds OR `/Applications/Herd.app` exists (macOS).

## Installation (per-project, recommended)

```bash
claude mcp add herd php /Applications/Herd.app/Contents/Resources/herd-mcp.phar -e SITE_PATH="$(pwd)"
```

Per-project installation gives fine-grained tool access and better results than global.

## Herd + Boost Together

When both are active, the agent gets complete context:
- **Boost:** routes, models, schema, packages, Artisan, docs search, Tinker
- **Herd:** services, PHP versions, site config, debugging (queries, jobs, logs, HTTP)

This eliminates manual environment discovery that would otherwise take multiple tool calls.

## When to Use Each Herd Tool

### During fv:start-session
- `site_information` -- populate environment section of session brief
- `find_available_services` -- verify database, cache, queue are running

### During fv:work
- `debug_site` -- when tests fail, captures broader execution context than Boost `last-error` alone (includes dispatched jobs, outgoing HTTP, variable dumps)
- `find_available_services` + `start_or_stop_service` -- when service-related errors occur (connection refused, timeout)
- `isolate_or_unisolate_site` -- when testing PHP version compatibility

### During fv:review
- `site_information` -- include environment context with PR review
- `debug_site` -- capture execution context during end-to-end testing

### During fv:normalize
- `get_all_php_versions` -- complete PHP version inventory (more thorough than `php --version`)
- `site_information` -- environment snapshot for audit report
