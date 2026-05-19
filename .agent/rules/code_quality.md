# Rule: Strict Modern Code Quality & TypeScript Conventions

Use this rule when writing, refactoring, or reviewing TypeScript, React, and Node.js files in both the client and server.

---

## 🔒 1. Strict Typing and Safety

### No `any` Allowed
*   Every variable, parameter, and function return value must be explicitly typed.
*   If a type is truly dynamic, use `unknown` combined with custom type guards, or use generic type parameters `<T>`.
*   Avoid non-null assertions (`!`) unless the variable was explicitly checked in the immediate block. Prefer optional chaining (`?.`) or fallback defaults (`??`).

### Discriminated Unions for Clean State
*   Use discriminated union types to represent mutually exclusive states (e.g., loading, success, failure) instead of scattered boolean flags.
*   *Example:*
    ```typescript
    type AsyncState<T> =
      | { status: 'idle' }
      | { status: 'loading' }
      | { status: 'success'; data: T }
      | { status: 'error'; error: Error };
    ```

---

## 🧬 2. Architectural Clarity

### The Early Return Pattern
*   Never deeply nest conditions. Aim for flat, linear functions.
*   Check parameters and error conditions first, return or throw early, then perform the main business logic.
*   Keep nesting within functions to a maximum of 2 levels.

### Single Responsibility Rule
*   Break down larger components and routes.
*   Keep Next.js components focused purely on rendering or local view state. Move side effects, heavy computations, or data fetching logic to React Hooks or server-side actions.
*   Backend routes should handle request parsing and response format, delegating domain logic to dedicated service layers.

---

## 🛑 3. Robust Error Handling

### Explicit Async Try-Catch Blocks
*   Every asynchronous function (API fetch, scraper invocation, database call) must reside inside a structured `try-catch` block.
*   Provide contextual error messages. Do not just throw a generic string. Create helper classes or type objects.

### Structured Backend Error Schema
*   Never return raw stack traces or internal server error messages to the client.
*   Backend REST responses for errors must always conform to:
    ```typescript
    interface ErrorResponse {
      success: false;
      error: {
        code: string;       // e.g., 'VALIDATION_ERROR'
        message: string;    // Human-readable summary
        details?: unknown;  // Optional validation array/object
      };
    }
    ```

---

## 📦 4. Dependency & Import Rules

*   **Clean Imports:** Group imports logically (external libraries first, shared local modules second, relative files third).
*   **Named Exports:** Prefer named exports (`export const MyComponent = ...`) over default exports (`export default ...`) to keep imports clean, searchable, and refactoring-safe (except where default exports are required by Next.js routing files like `page.tsx`, `layout.tsx`, etc.).
*   **Dead Code Elimination:** Instantly delete unused variables, unused imports, or dead logs before finalizing edits.
