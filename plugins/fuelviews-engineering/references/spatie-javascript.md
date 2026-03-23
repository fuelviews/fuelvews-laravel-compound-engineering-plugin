# Spatie JavaScript Guidelines (Distilled)

Source: https://spatie.be/guidelines/javascript

## Code Style

- Use Prettier for formatting consistency
- Use 4-space indentation (via `.editorconfig`)
- Set `printWidth` to 120 characters
- Prefer single quotes over double quotes

## Variables

- Prefer `const` over `let`; never use `var`
- Reassigning properties of a `const` object is allowed

```javascript
const person = { name: 'Sebastian' };
person.name = 'Seb'; // allowed
```

- Avoid abbreviations in variable names
- Allow abbreviations in single-line arrow functions when context is clear

```javascript
userSessions.forEach(s => saveUserSession(s)); // acceptable
```

## Comparisons

- Always use strict equality (`===`)
- Cast variables before comparing if types differ

```javascript
if (one === parseInt(another)) { ... }
```

## Functions

- Use `function` keyword for named function declarations
- Use arrow functions for terse single-line operations

```javascript
const sum = (a, b) => a + b;
```

- Use arrow functions for higher-order functions and anonymous callbacks
- Exception: use `function` when `this` binding is needed

```javascript
$('a').on('click', function () {
    window.location = $(this).attr('href');
});
```

- Use shorthand method syntax in objects
- Keep functions pure; limit `this` usage

## Destructuring

- Prefer destructuring over variable assignment for arrays and objects

```javascript
const [hours, minutes] = '12:00'.split(':');
```

- Use destructuring for configuration objects in function parameters

```javascript
function uploader({ element, url, multiple = false }) { ... }
```

## Alpine.js / Livewire-Specific Rules (Derived)

These extend Spatie's JS guidelines for the Laravel frontend stack:

- Use `::` prefix for Alpine.js shorthand directives
- Never expose sensitive data in `x-data` attributes
- Use `$wire` for Livewire interop in Alpine components
- Prefer `@entangle` for two-way Livewire/Alpine binding
- Use `wire:loading` states for async feedback
- Debounce user input with `wire:model.debounce`
- Avoid inline JavaScript in Blade; extract to Alpine components
- Handle async operations with proper error boundaries
- Use `x-cloak` to prevent flash of unstyled content
