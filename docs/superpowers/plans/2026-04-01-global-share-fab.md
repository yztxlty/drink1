# Global Share Fab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully independent floating share ball for the Drink1 mini program that can collapse, expand, drag to the edge, and generate randomized share copy without touching `utils/store.js` core behavior.

**Architecture:** Add one self-contained component at `components/share-fab/` that owns its own interaction state, share-copy generation, and local persistence for position/collapse state. Pages only pass lightweight hydration/streak data into the component and expose a minimal `onShareAppMessage` bridge. Global text stays centralized in `utils/copy.js` so the share copy follows the existing unified copy convention.

**Tech Stack:** WeChat Mini Program components, WXML/WXSS/JS, `wx.getStorageSync` / `wx.setStorageSync`, Node-based assertion scripts.

---

### Task 1: Add unified share copy definitions

**Files:**
- Modify: `utils/copy.js`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-share-fab-copy.js` with assertions that `COPY.shareFab` exists and includes grouped copy buckets for progress and challenge messages.

```js
const assert = require('assert');
const { COPY } = require('../../utils/copy');

assert.ok(COPY.shareFab);
assert.ok(Array.isArray(COPY.shareFab.progress));
assert.ok(Array.isArray(COPY.shareFab.challenge));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-share-fab-copy.js`

Expected: FAIL because `COPY.shareFab` is not defined yet.

- [ ] **Step 3: Write minimal implementation**

Add `shareFab` entries to `utils/copy.js`:

```js
  shareFab: {
    title: '一起补水吧',
    progress: [
      '今日补水进度已达 {{percent}}%，邀你一起变水润！',
      '今天已经完成 {{percent}}% 的补水目标，来一起打卡吧！'
    ],
    challenge: [
      '已连续打卡 {{streak}} 天！谁能比我更坚持？',
      '连续 {{streak}} 天补水中，来看看谁更能坚持！'
    ]
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-share-fab-copy.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/copy.js scripts/check-share-fab-copy.js
git commit -m "feat: add unified share copy"
```

### Task 2: Build the share-fab component

**Files:**
- Create: `components/share-fab/share-fab.json`
- Create: `components/share-fab/share-fab.js`
- Create: `components/share-fab/share-fab.wxml`
- Create: `components/share-fab/share-fab.wxss`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-share-fab-component.js` to assert the component file set exists, the JS exports `getShareContent`, and the WXSS contains `backdrop-filter`.

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const js = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.js'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.wxss'), 'utf8');

assert.ok(js.includes('getShareContent'));
assert.ok(wxss.includes('backdrop-filter'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-share-fab-component.js`

Expected: FAIL because the component does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement the component with:

```js
const { COPY } = require('../../utils/copy');

Component({
  properties: {
    percent: { type: Number, value: 0 },
    streak: { type: Number, value: 0 },
    pageName: { type: String, value: '' }
  },
  data: { collapsed: false, x: 0, y: 0 },
  methods: {
    getShareContent() {},
    onShareTap() {},
    onDragStart() {},
    onDragMove() {},
    onDragEnd() {},
    toggleCollapsed() {}
  }
});
```

Then fill in the WXML/WXSS so the button is fixed, draggable, collapsible, and visually matches the requested glass effect.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-share-fab-component.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/share-fab scripts/check-share-fab-component.js
git commit -m "feat: add share fab component"
```

### Task 3: Wire pages into the component without touching store logic

**Files:**
- Modify: `pages/home/home.json`
- Modify: `pages/home/home.wxml`
- Modify: `pages/home/home.js`
- Modify: `pages/explore/explore.json`
- Modify: `pages/explore/explore.wxml`
- Modify: `pages/explore/explore.js`

- [ ] **Step 1: Write the failing test**

Extend `scripts/check-component-isolation.js` to assert:

```js
assert.ok(homeJs.includes('logWater'));
assert.ok(homeJs.includes('onShareAppMessage'));
assert.ok(exploreJs.includes('onShareAppMessage'));
assert.ok(homeWxml.includes('<share-fab'));
assert.ok(exploreWxml.includes('<share-fab'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-component-isolation.js`

Expected: FAIL until the component is wired in.

- [ ] **Step 3: Write minimal implementation**

Register the component in both page JSON files, append `<share-fab id="shareFab" percent="{{progressPercent}}" streak="{{streakDays}}" pageName="home" />` and a matching explore version in WXML, and bridge `onShareAppMessage()` through `this.selectComponent('#shareFab')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-component-isolation.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pages/home pages/explore scripts/check-component-isolation.js
git commit -m "feat: connect share fab to home and explore"
```

### Task 4: Verify the whole flow

**Files:**
- Modify: `scripts/smoke-check.js` if needed for the new component

- [ ] **Step 1: Run focused checks**

Run:

```bash
node scripts/check-share-fab-copy.js
node scripts/check-share-fab-component.js
node scripts/check-component-isolation.js
```

Expected: all pass.

- [ ] **Step 2: Run the project smoke check**

Run: `node scripts/smoke-check.js`

Expected: existing checks remain green.

- [ ] **Step 3: Commit**

```bash
git add scripts
git commit -m "test: add share fab isolation checks"
```
