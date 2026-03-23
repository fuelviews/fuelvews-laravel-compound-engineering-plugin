# Spatie Security Guidelines (Distilled)

Source: https://spatie.be/guidelines/security

## Authentication

- Store all passwords in a dedicated password manager (e.g., 1Password)
- Enforce unique passwords across all services
- Enable multi-factor authentication when available
- Protect all private keys with passwords
- Sign all Git commits

## Application Security

- Encrypt all HTTP traffic over SSL
- Implement CSRF protection on all forms
- Use appropriate HTTP methods for state-changing operations (`POST`, `PUT`, `DELETE` -- never `GET`)
- Add automated tests for authorization controls
- Hash all stored passwords
- Encrypt API keys stored in the database

## Database Security

- Use a separate database user per database with appropriate read/write permissions
- Restrict database access via IP whitelisting (webservers and developer machines only)

## Server Security

- Keep NGINX, PHP, Ubuntu, and all services updated
- Use SSH key-based authentication only (disable password auth)
- Enable automatic security updates (`unattended-upgrades`)
- Configure firewall to allow only relevant traffic (ports 22 and 443)
- Use centralized server management (Ansible) for patching and access revocation

## Endpoint Security

- Enable full-disk encryption (FileVault on macOS)
- Maintain automated backups and verify periodically

## Data Sharing

- Never use public pastebin services for sensitive code or data
- Avoid pirated software

## Browser Security

- Install extensions only from official stores
- Minimize extension usage
- Avoid keystroke-tracking extensions (exception: 1Password)

## Laravel-Specific Security Rules (Derived)

These rules extend Spatie's guidelines for Laravel development:

- Use `$request->validated()` to access only validated input
- Prefer `{{ }}` in Blade (auto-escapes output)
- Audit every `{!! !!}` usage -- only for trusted data
- Use `Js::from()` for server-to-JavaScript data in Blade
- Use `@csrf` on every form
- Use policies for model authorization, gates for non-resource actions
- Never store secrets in `.env.example`
- Never commit `.env` files
- Use `config()` helper, not `env()`, outside config files
- Use signed URLs for sensitive actions
- Rate-limit authentication endpoints
- Use `ShouldBeUnique` on jobs that must not run concurrently
