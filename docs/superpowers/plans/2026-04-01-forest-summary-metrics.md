# Forest Summary Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the explore summary metrics render from live hydration/forest data and add a compact rules hint that explains how each number is calculated.

**Architecture:** Keep the existing forest view-model contract intact where possible. Extend the explore page with one small UI affordance for rules copy and rely on existing store fields plus the existing `getDropCount()` helper for the displayed metrics.

**Tech Stack:** WeChat Mini Program page JS/WXML/WXSS, local regression scripts, Node-based smoke checks

---

### Task 1: Lock the expected explore summary behavior

**Files:**
- Modify: `scripts/check-forest-water-rhythm-game.js`
- Modify: `scripts/smoke-check.js`

- [ ] **Step 1: Write the failing test**

Add assertions for `{{oxygenValue}}`, `{{collectionLabel}}`, `{{dropCount}}`, a rules trigger, and the rules copy source.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-forest-water-rhythm-game.js`
Expected: FAIL because the rules trigger/copy source is not implemented yet

- [ ] **Step 3: Write minimal implementation**

Expose the rules copy in the page data and add a tap handler plus markup for the trigger.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-forest-water-rhythm-game.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/check-forest-water-rhythm-game.js scripts/smoke-check.js pages/explore/explore.js pages/explore/explore.wxml pages/explore/explore.wxss utils/copy.js
git commit -m "feat: explain forest summary metrics"
```

### Task 2: Implement the explore rules hint cleanly

**Files:**
- Modify: `pages/explore/explore.js`
- Modify: `pages/explore/explore.wxml`
- Modify: `pages/explore/explore.wxss`
- Modify: `utils/copy.js`

- [ ] **Step 1: Write the failing test**

Use the Task 1 assertions as the regression target.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-forest-water-rhythm-game.js`
Expected: FAIL on missing rules trigger or rules copy binding

- [ ] **Step 3: Write minimal implementation**

Add a small `计算规则` trigger, wire it to `wx.showModal`, and keep all three summary values bound to existing live data fields.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-forest-water-rhythm-game.js`
Expected: PASS

- [ ] **Step 5: Verify broader regression coverage**

Run: `node scripts/check-forest-page-clean.js && node scripts/smoke-check.js`
Expected: PASS
