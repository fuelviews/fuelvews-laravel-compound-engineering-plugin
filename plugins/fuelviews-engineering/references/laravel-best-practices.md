# Laravel Best Practices (Distilled)

Source: https://github.com/alexeymezenin/laravel-best-practices

## 1. Single Responsibility Principle

Keep controllers thin. Move complex logic to service classes or model methods.

```php
// Bad: validation + logging + business logic in controller
public function update(Request $request): string
{
    $validated = $request->validate([...]);
    foreach ($request->events as $event) {
        $this->logger->log('Update event ' . $event['date']);
    }
    $this->event->updateGeneralEvent($request->validated());
    return back();
}

// Good: delegate to dedicated classes
public function update(UpdateRequest $request): string
{
    $this->logService->logEvents($request->events);
    $this->event->updateGeneralEvent($request->validated());
    return back();
}
```

## 2. Methods Should Do One Thing

Extract complex conditionals into named methods.

```php
// Good
public function getFullNameAttribute(): string
{
    return $this->isVerifiedClient()
        ? $this->getFullNameLong()
        : $this->getFullNameShort();
}
```

## 3. Fat Models, Skinny Controllers

Place database-related logic in Eloquent models.

```php
// Good
class Client extends Model
{
    public function getWithNewOrders(): Collection
    {
        return $this->verified()
            ->with(['orders' => fn($q) => $q->where('created_at', '>', now()->subWeek())])
            ->get();
    }
}
```

## 4. Validation in FormRequest Classes

Move validation from controllers to dedicated Request classes.

```php
// Good
public function store(PostRequest $request) { ... }

class PostRequest extends Request
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'unique:posts', 'max:255'],
            'body' => ['required'],
        ];
    }
}
```

## 5. Business Logic in Service Classes

Controllers handle HTTP; services handle business logic.

```php
// Good
public function store(Request $request)
{
    $this->articleService->handleUploadedImage($request->file('image'));
}
```

## 6. DRY (Don't Repeat Yourself)

Use Eloquent scopes for reusable query logic.

```php
// Good
public function scopeActive($q)
{
    return $q->where('verified', true)->whereNotNull('deleted_at');
}
```

## 7. Prefer Eloquent Over Query Builder and Raw SQL

Eloquent provides soft deletes, events, scopes, and readable syntax.

```php
// Good
Article::has('user.profile')->verified()->latest()->get();
```

## 8. Mass Assignment

Use relationship methods with validated data.

```php
// Good
$category->article()->create($request->validated());
```

## 9. Prevent N+1 Queries

Use eager loading. Never query in Blade templates.

```php
// Bad: N+1 in Blade
@foreach (User::all() as $user)
    {{ $user->profile->name }}
@endforeach

// Good: eager load in controller
$users = User::with('profile')->get();
```

## 10. Chunk Large Datasets

Process large datasets in chunks to manage memory.

```php
// Good
$this->chunk(500, function ($users) {
    foreach ($users as $user) { ... }
});
```

## 11. Descriptive Names Over Comments

Write self-documenting code with clear method and variable names.

## 12. Use Config and Language Files Over Hardcoded Text

Store user-facing strings in language files and settings in config.

## 13. Follow Laravel Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Controller | singular PascalCase | `ArticleController` |
| Route | plural kebab-case | `articles/featured` |
| Named route | dot notation snake_case | `articles.featured` |
| Model | singular PascalCase | `User` |
| Table | plural snake_case | `article_comments` |
| Pivot table | alphabetical singular | `article_user` |
| Column | snake_case (no model prefix) | `meta_title` |
| Foreign key | model_id | `article_id` |
| Primary key | `id` | -- |
| Migration | date + description | `2017_01_01_000000_create_articles_table` |
| Method | camelCase | `getAll` |
| Variable | camelCase | `$articlesWithAuthor` |
| Collection | descriptive plural | `$activeUsers` |
| Object | descriptive singular | `$activeUser` |
| Config/language key | snake_case | `articles_enabled` |
| View | kebab-case | `show-filtered.blade.php` |
| Trait | adjective | `Notifiable` |

## 14. Shorter Syntax Where Possible

Prefer helpers and shorter alternatives:

```php
// Long
$request->session()->get('cart');
// Short
session('cart');

// Long
return Redirect::back();
// Short
return back();

// Long
$request->input('name');
// Short
$request->name;
```

## 15. Use IoC Container or Facades

Avoid `new Class` -- use dependency injection.

```php
// Bad
$user = new User;
$user->create($request->validated());

// Good (injected)
public function __construct(
    protected User $user,
) {}

public function store(Request $request)
{
    $this->user->create($request->validated());
}
```

## 16. Do Not Get Data Directly from .env

Use `config()` helper; access `env()` only in config files.

```php
// Bad
$apiKey = env('API_KEY');

// Good (in config/services.php)
'key' => env('API_KEY'),
// Then use:
$apiKey = config('services.api.key');
```

## 17. Store Dates in Standard Format

Use accessors/mutators for display format changes.

## 18. Other Good Practices

- Never put logic in route files
- Minimize vanilla PHP in Blade; use Blade directives
- Use in-memory SQLite for testing
- Use standard Laravel tools over third-party packages
- Follow community conventions for naming
- Use `$request->validated()` not `$request->all()`
