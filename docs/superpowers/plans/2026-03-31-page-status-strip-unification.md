# Page Status Strip Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the top status language, spacing, and action affordances across the Home, Profile, and Forest pages while keeping each page's business data accurate and easy to read.

**Architecture:** Introduce a shared `page-status-strip` component for the top summary area and feed it from page-specific view model fields with a consistent shape. Keep the pages thin: they should only pass data and handle page-specific actions. The store will expose a `statusBar` object for each page so the component receives stable, aligned fields and the pages do not invent their own summary rules.

**Tech Stack:** WeChat Mini Program components, existing `utils/store.js` view models, shared WXSS tokens, lightweight Node regression scripts.

---

### Task 1: Lock the shared status model with tests

**Files:**
- Create: `scripts/check-page-status-bars.js`
- Modify: `scripts/smoke-check.js`

- [ ] **Step 1: Write the failing test**

```js
const home = store.getHomeViewModel();
const profile = store.getProfileViewModel();
const forest = store.getForestViewModel();

for (const viewModel of [home, profile, forest]) {
  assert.ok(viewModel.statusBar);
  assert.ok(typeof viewModel.statusBar.title === 'string');
  assert.ok(typeof viewModel.statusBar.subtitle === 'string');
  assert.ok(typeof viewModel.statusBar.metricLabel === 'string');
  assert.ok(typeof viewModel.statusBar.metricValue === 'string');
  assert.ok(typeof viewModel.statusBar.actionLabel === 'string');
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-page-status-bars.js`
Expected: FAIL because `statusBar` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add `statusBar` objects in `utils/store.js` for home, profile, and forest.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/check-page-status-bars.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/check-page-status-bars.js scripts/smoke-check.js utils/store.js
git commit -m "feat: unify page status models"
```

### Task 2: Add the shared status strip component

**Files:**
- Create: `components/page-status-strip/page-status-strip.js`
- Create: `components/page-status-strip/page-status-strip.json`
- Create: `components/page-status-strip/page-status-strip.wxml`
- Create: `components/page-status-strip/page-status-strip.wxss`
- Modify: `scripts/check-page-status-bars.js`

- [ ] **Step 1: Write the failing test**

```js
assert.ok(homeWxml.includes('<page-status-strip'));
assert.ok(profileWxml.includes('<page-status-strip'));
assert.ok(forestWxml.includes('<page-status-strip'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-page-status-bars.js`
Expected: FAIL because the component is not used yet.

- [ ] **Step 3: Write minimal implementation**

Implement a single-row top strip with a title, subtitle, metric value, metric label, and action slot.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/check-page-status-bars.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/page-status-strip scripts/check-page-status-bars.js
git commit -m "feat: add shared page status strip"
```

### Task 3: Wire pages to the shared strip and align copy

**Files:**
- Modify: `pages/home/home.json`
- Modify: `pages/home/home.wxml`
- Modify: `pages/home/home.wxss`
- Modify: `pages/profile/profile.json`
- Modify: `pages/profile/profile.wxml`
- Modify: `pages/profile/profile.wxss`
- Modify: `pages/explore/explore.json`
- Modify: `pages/explore/explore.wxml`
- Modify: `pages/explore/explore.wxss`

- [ ] **Step 1: Write the failing test**

```js
assert.ok(homeWxml.includes('bindtap="logWater"'));
assert.ok(profileWxml.includes('bindtap="syncData"'));
assert.ok(forestWxml.includes('bindtap="navHome"'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-page-status-bars.js`
Expected: FAIL until the pages actually use the shared strip.

- [ ] **Step 3: Write minimal implementation**

Replace each page's top area with the shared strip and keep page-specific content below it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/check-page-status-bars.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pages/home pages/profile pages/explore
git commit -m "feat: unify top status strips across pages"
```

### Task 4: Extend smoke checks and validate layout stability

**Files:**
- Modify: `scripts/smoke-check.js`

- [ ] **Step 1: Write the failing test**

```js
assert.ok(homeWxml.includes('white-space: nowrap'));
assert.ok(profileWxml.includes('white-space: nowrap'));
assert.ok(forestWxml.includes('white-space: nowrap'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-page-status-bars.js`
Expected: FAIL until the component and page styles are in place.

- [ ] **Step 3: Write minimal implementation**

Add smoke checks that block regressions in the shared strip copy and the page-specific CTA wiring.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/smoke-check.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke-check.js
git commit -m "test: cover shared page status strip"
```
