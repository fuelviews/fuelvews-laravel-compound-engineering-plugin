# Spatie Laravel Guidelines (Distilled)

Source: https://spatie.be/guidelines/laravel

## PHP General

- Follow PSR-1, PSR-2, PSR-12
- Avoid `final` unless specifically justified
- Use nullable shorthand: `?string` not `string|null`
- Always declare `void` return types on methods that return nothing
- Always type properties explicitly (no docblock-only types)
- Use PascalCase for enum values
- Skip docblocks when type hints are sufficient
- Import classnames in docblocks (no inline namespaces)
- Use constructor property promotion on separate lines with trailing commas

```php
class MyClass {
    public function __construct(
        protected string $firstArgument,
        protected string $secondArgument,
    ) {}
}
```

- Declare each trait on its own line
- Prefer string interpolation over `sprintf()` and concatenation

```php
$greeting = "Hi, I am {$name}.";
```

## Control Flow

- Always use curly brackets for `if` statements
- Order unhappy path first, happy path last (early returns)
- Avoid `else` blocks -- refactor using early returns
- Prefer separate `if` statements over compound conditions

```php
if (! $conditionA) {
    return;
}
if (! $conditionB) {
    return;
}
// happy path here
```

## Configuration

- Use kebab-case for config filenames: `config/pdf-generator.php`
- Use snake_case for config keys
- Never use `env()` outside config files
- Add service credentials to `config/services.php`

## Routing

- Use kebab-case for public URLs: `/open-source`
- Prefer route tuple notation: `[Controller::class, 'method']`
- Use camelCase for route names and parameters
- Don't prefix routes with `/` (except root)
- Use plural resource names in APIs: `/projects`

## Controllers

- Use plural resource name: `PostsController`
- Stick to CRUD actions: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`
- Extract non-CRUD to separate controllers (e.g., `FavoritePostsController`)

## Views

- Use camelCase for view filenames: `openSource.blade.php`

## Validation

- Use array notation for rules: `['required', 'email']`
- Use snake_case for custom validation rules

## Blade

- Indent with 4 spaces
- No space after control structures: `@if($condition)`

## Authorization

- Use camelCase for policy gate names
- Use default CRUD words for abilities (replace `show` with `view`)

## Artisan Commands

- Use kebab-case: `php artisan delete-old-records`
- Provide completion feedback with `$this->comment()`
- Output progress in loops before processing items

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Controller | Plural + Controller | `UsersController` |
| Invokable Controller | Action + Controller | `PerformCleanupController` |
| Resource | Plural + Resource | `UsersResource` |
| Job | Action description | `CreateUser` |
| Event (before) | Present participle | `ApprovingLoan` |
| Event (after) | Past tense | `LoanApproved` |
| Listener | Action + Listener | `SendInvitationMailListener` |
| Command | Action + Command | `PublishScheduledPostsCommand` |
| Mailable | Name + Mail | `AccountActivatedMail` |
| Enum | No prefix | `OrderStatus` |

## Code Style

- Minimize comments; write expressive code
- Allow blank lines between logical blocks
- Group single-line equivalent operations without spacing
- No empty lines inside brackets
