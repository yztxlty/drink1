# Share Fab Gesture and Auto-Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the share-fab component so a left swipe expands it, a right swipe collapses it to a partially visible state, and inactivity triggers an automatic collapse after 5 seconds.

**Architecture:** Keep the feature self-contained inside `components/share-fab/`. The WXML will make the outermost node a transparent share `button`, the JS will own gesture state and the auto-collapse timer, and the WXSS will animate the horizontal reveal using `transition` without changing page-level behavior.

**Tech Stack:** WeChat Mini Program components, WXML/WXSS/JS, Node assertion scripts.

---

### Task 1: Lock in the desired behavior with checks

**Files:**
- Modify: `scripts/check-gesture.js`
- Modify: `scripts/check-ui-fix.js`

- [ ] **Step 1: Write the failing checks**

Update `scripts/check-gesture.js` so it asserts the component JS contains a 5-second auto-collapse delay and horizontal swipe handlers:

```js
assert.ok(js.includes('AUTO_COLLAPSE_DELAY = 5000'));
assert.ok(js.includes('deltaX'));
assert.ok(js.includes('touchstart'));
assert.ok(js.includes('touchmove'));
```

Update `scripts/check-ui-fix.js` so it asserts the WXML is rooted by the transparent share button and the WXSS animates the button with `transition`:

```js
assert.ok(wxml.trimStart().startsWith('<button'));
assert.ok(wxml.includes('open-type="share"'));
assert.ok(wxss.includes('transition'));
```

- [ ] **Step 2: Run the checks to confirm they fail**

Run:

```bash
node scripts/check-gesture.js
node scripts/check-ui-fix.js
```

Expected: both fail against the current component because it still uses the old vertical-drag behavior and the old shell structure.

### Task 2: Rebuild the share-fab component interaction

**Files:**
- Modify: `components/share-fab/share-fab.js`
- Modify: `components/share-fab/share-fab.wxml`
- Modify: `components/share-fab/share-fab.wxss`

- [ ] **Step 1: Implement the new behavior**

Rewrite the component so it:

```js
// JS responsibilities:
// - track expanded / collapsed state
// - start or reset a 5-second timer on touchstart
// - expand on left swipe
// - collapse to a 50%-70% hidden state on right swipe
// - keep getShareContent() intact for open-type="share"
```

- [ ] **Step 2: Run the checks again**

Run:

```bash
node scripts/check-gesture.js
node scripts/check-ui-fix.js
```

Expected: both pass after the WXML, WXSS, and JS update.

- [ ] **Step 3: Verify component safety**

Run:

```bash
node scripts/check-share-fab-component.js
```

Expected: pass, proving the component still exposes the existing share contract.
