# Infrastructure Reuse Rules

For every new artifact the plan proposes creating, apply the appropriate rule:

- **Models:** NEVER create a new model if the entity exists. Add relationships, scopes, casts, or accessors to the existing model. Use `gitnexus_context` to understand existing relationships, observers, and policies before modifying. Verify new tables represent genuinely new entities.
- **Enums:** Add cases to existing enums. Don't create parallel enums for the same domain concept under a different name.
- **Config:** Add keys to existing config files. Don't create new config files unless the domain is genuinely distinct. Check existing env vars and feature flags.
- **Components:** Compose or extend existing Blade/Livewire components via slots/props. Check both class-based and anonymous components.
- **Middleware:** Use existing middleware stacks (auth, tenant, rate limiting). Don't add inline request checks when middleware already handles the concern. Add new routes to existing middleware groups.
- **Policies:** If a model has a policy, add gates to it. NEVER scatter authorization in controllers when a policy exists.
- **Events/Listeners:** Attach new listeners to existing events for side effects. Don't create direct side effects that bypass the event system. Only create new events for genuinely new domain actions.
- **Form Requests:** Check for existing Store/Update request pairs and shared validation rule traits. Extract common rules rather than duplicating across requests.
- **Jobs:** Reuse existing queue infrastructure, retry configs, and unique-lock patterns. Don't create parallel job pipelines for related concerns.
- **Notifications/Mailables:** Extend existing notification channels and mailable base classes.
- **Services/Actions/Helpers/Traits:** Reference existing infrastructure by file path. Extend or compose rather than duplicate. Use `gitnexus_context` to understand the contract before proposing extensions.
- **Casts:** Reuse existing custom casts (money, JSON, encrypted). Don't reinvent them.
- **Composer/npm packages:** Before proposing custom code, verify an installed package doesn't already provide the capability. Also consider whether a well-maintained package is a better solution than custom code.
- **Factories/Seeders:** If a model has a factory, update it with new fields/states. Don't create test data manually.
- **Routes:** Add to existing route groups and middleware stacks. Don't create new route files unless the domain is genuinely separate.
- **Commands:** Add options/subcommands to existing Artisan commands for the same domain. Check scheduler for existing scheduled tasks before creating new ones.
- **Blade views:** Extend existing layouts. Include existing partials. Use existing component slots. Don't recreate shared UI that already exists.
- **JS/TS components:** Reuse existing shared components, hooks/composables, utility modules, and API wrappers. Don't create parallel UI primitives (buttons, modals, cards) that already exist. Extend existing stores rather than creating parallel state.
- **TypeScript types:** Use existing type definitions and interfaces. Extend existing types rather than creating overlapping ones.
- **Base classes:** Extend existing hierarchies rather than creating parallel ones.
- **No match:** Only then propose creating a new artifact. Note in the plan why existing infrastructure doesn't fit.
