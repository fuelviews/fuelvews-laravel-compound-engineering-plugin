# Spatie AI Guidelines (Distilled)

Source: https://spatie.be/guidelines/ai

## Core Principles

- Follow documented Laravel conventions first before generating custom solutions
- Maintain PSR compliance and type declarations throughout generated code
- Structure classes with typed properties and constructor promotion
- Implement early returns and avoid else statements (happy path pattern)
- Adhere to established Laravel patterns for routes, controllers, configuration, and artisan commands
- Apply consistent naming conventions across classes, methods, files, and URLs
- Prioritize code quality and maintainability in all AI-assisted generation

## Integration

- Use Laravel Boost package for automatic guideline integration across projects
- For global integration: download guidelines to `~/.claude/CLAUDE.md`
- For project-specific integration: include guidelines in project root `CLAUDE.md`
- Keep guidelines current via Composer scripts

## AI-Assisted Code Review Expectations

- Generated code must pass the same review standards as human-written code
- AI output should follow the same PSR-12, typing, and naming rules
- Prefer explicit type declarations over docblock annotations
- Use constructor property promotion with trailing commas
- Follow the happy-path pattern (early returns, no else blocks)
- Apply single responsibility principle to generated classes and methods
- Use Eloquent over raw SQL or Query Builder where possible
- Move validation to FormRequest classes
- Move business logic to service classes
- Use mass assignment through relationships
- Prevent N+1 queries with eager loading

## Quality Checklist for AI Output

- [ ] PSR-12 compliant
- [ ] All properties typed
- [ ] Return types declared (including `void`)
- [ ] Constructor promotion used where applicable
- [ ] No `env()` calls outside config files
- [ ] Route tuple notation used
- [ ] Validation in FormRequest classes
- [ ] Business logic in service classes
- [ ] Eloquent scopes for reusable queries
- [ ] Eager loading for relationships
- [ ] CSRF protection on forms
- [ ] Authorization via policies
