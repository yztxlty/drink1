# Code Style Guide / 代码规范

> Applies to `app.js`, `pages/`, `components/`, `utils/`, `scripts/`, and related assets.
>
> 适用于 `app.js`、`pages/`、`components/`、`utils/`、`scripts/` 以及相关资源文件。

This guide is based on the repository's current structure and aims to keep new code consistent, maintainable, and easy to verify.

本规范基于当前项目的真实结构编写，目标是让新代码保持一致、可维护、可回归。

## 1. Design Principles

- Local-first: do not depend on a backend by default; store business data locally when possible.
- Single source of truth: hydration, settings, profile, and medal state should flow through `utils/store.js`.
- Keep pages light: pages should focus on interaction, view assembly, and routing, not deep domain logic.
- Reuse components: extract cross-page interactions into `components/`.
- Centralize copy: prefer `utils/copy.js` for shared text, button labels, and prompts.
- Stay compatible with the WeChat Mini Program runtime: always check whether a `wx` API is available before using it.

## 2. Directory Responsibilities

### 2.1 `app.js`

- Initialize the global store.
- Restore local state on startup.
- Expose `store`, `appState`, and `userInfo` through `globalData`.

### 2.2 `pages/`

- Each directory represents a page or subpage.
- Pages should mainly:
  - Read view models from the store
  - Call store write methods
  - Respond to user actions
  - Handle navigation, dialogs, toasts, and share behaviors

### 2.3 `components/`

- Hold reusable UI and interaction modules.
- Prefer `properties` for input and `triggerEvent` for output.
- Do not let components mutate page state directly or write business data on their own.

### 2.4 `utils/`

- Hold pure logic, normalization, domain calculations, copy, and storage wrappers.
- `utils/store.js` is the core state layer.
- `utils/copy.js` centralizes product copy.
- Keep `utils/*.js` helpers as side-effect free as possible.

### 2.5 `scripts/`

- Hold regression checks, smoke tests, and developer utilities.
- When page behavior or cross-page coupling changes, add or update the matching check script.

## 3. Naming Conventions

### 3.1 Files and Directories

- Use lowercase names for pages and components.
- Use `kebab-case` for multi-word directories such as `data-management` and `quick-amount-manager`.
- Place assets in `assets/` and README screenshots in `docs/readme/`.

### 3.2 JavaScript Identifiers

- Use `camelCase` for variables, functions, and methods.
- Use `UPPER_SNAKE_CASE` for constants such as `COPY`, `MENU_ROUTES`, and `SHARE_PATH`.
- Use meaningful boolean prefixes:
  - `is...`
  - `has...`
  - `show...`
  - `visible...`
  - `can...`

### 3.3 Method Names

- Data refresh or fetch: `refresh...`, `load...`
- Data building: `build...`
- Data normalization or fallback: `normalize...`, `resolve...`
- Navigation: `go...`, `navigate...`
- Events: `handle...`, `on...`

Examples:

- `refreshPageData()`
- `buildShareTitle()`
- `normalizeQuickAmounts()`
- `goToMedals()`
- `handleQuickAmountAdd()`

## 4. JavaScript Style

- Prefer `const`; use `let` only when reassignment is required.
- Avoid `var`.
- Use CommonJS: `require(...)` / `module.exports`.
- Keep functions short and single-purpose.
- Prefer early returns to avoid deep nesting.
- Guard external data, stored data, and event parameters with defensive checks.
- Check for the existence of `wx` APIs before calling them.

### 4.1 Semicolons

The repository currently contains a mix of semicolon and no-semicolon files.

- Keep each new file internally consistent.
- When editing an existing file, follow the style already used in that file.
- Avoid large formatting-only rewrites that are unrelated to the current change.

### 4.2 Comments

- Add comments only for logic that is complex or easy to misread.
- Explain why something exists, not what the code visibly does.
- Avoid comments for trivial assignments or obvious branches.

## 5. Page Writing Rules

### 5.1 Page Data

- Keep only render-relevant fields in `Page.data`.
- Initialize every field up front to avoid blank first paints.
- Keep view model field names aligned with WXML bindings.

### 5.2 Lifecycle

- `onLoad`: grab the store, initialize page state, and render once.
- `onShow`: refresh data that depends on global state and update the tab bar selection.
- When returning to a page, do not assume `data` is still fresh.

### 5.3 Reading Data

- Prefer `store.get*ViewModel()` when reading data into a page.
- Avoid reconstructing global business state inside page files.
- Keep derived data in the store or pure helpers.

### 5.4 Writing Data

- Use store methods for business mutations.
- Do not write business objects to local storage directly from pages.
- Local-only UI state can stay on the page, but it should remain clearly separated from business state.

### 5.5 Routing and Feedback

- Use `wx.navigateTo`, `wx.redirectTo`, `wx.reLaunch`, and `wx.navigateBack` for routing.
- Provide toast, dialog, or status feedback after user actions.
- Confirm destructive actions before executing them.

## 6. Component Writing Rules

- One component should focus on one capability.
- Define `properties` types and default values.
- Keep internal state limited to component-specific interaction.
- Communicate outward with `triggerEvent` and clear event names.
- Read system info inside `lifetimes.attached` or an appropriate lifecycle hook and guard it carefully.
- Components should not depend directly on private page state.

### 6.1 Component Event Names

- Use clear verbs such as:
  - `select`
  - `change`
  - `delete`
  - `back`
  - `submit`

## 7. State and Data Rules

### 7.1 `utils/store.js` Is the Core State Layer

- Keep business state read and write paths centralized.
- When adding a field, update:
  - default values
  - normalization
  - version compatibility
  - view model outputs

### 7.2 Derived Data Is Computed Once

- Keep streaks, totals, daily summaries, and medal progress in one shared computation path.
- Do not implement the same statistics in multiple pages.
- If a stat changes, update the store or domain helper first, then let pages consume the new result.

### 7.3 Storage Keys

- Keep fixed storage keys centralized.
- Make temporary or page-local keys explicit about their lifecycle.
- Name page-only state so its purpose is obvious.

## 8. Copy and Product Language

- Keep the product tone warm, encouraging, and practical.
- Use project terms consistently, such as “补水”, “记录”, “森林”, “勋章”, and “设置”.
- Prefer shared copy in `utils/copy.js` over repeated inline strings.
- When adding copy, consider:
  - Page title
  - Button label
  - Empty state
  - Error message
  - Success message

## 9. Data and Privacy

- Default to local storage and avoid unnecessary network dependencies.
- Make user intent explicit for login, profile, privacy, or data-clearing actions.
- Destructive data operations should include confirmation text and, when possible, an impact summary.
- If cloud sync or account systems are added later, update the privacy page, product copy, and regression checks together.

## 10. Testing and Regression

- When changing page structure, keep WXML / WXSS / JS in sync.
- When changing core logic, update the matching `scripts/check-*.js` script.
- For changes that affect home, settings, profile, sharing, or data management, run at least one smoke pass.
- For cross-page changes, verify:
  - home recording
  - settings updates
  - profile sync
  - medal refresh
  - share content

## 11. Pre-Commit Checklist

- Are new page fields initialized in `data`?
- Does business state flow through the store or a domain helper?
- Is shared text centralized in `utils/copy.js`?
- Are components exposing only the necessary `properties` and events?
