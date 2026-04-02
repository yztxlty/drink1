# Forest Water Rhythm Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current DOM-based forest interaction in `pages/explore/explore` with a Canvas-driven water-drop scene that feels like water, persists state, and enters irrigation mode when the hydration goal is met.

**Architecture:** Keep the rewrite focused on the existing forest tab instead of a new route. Split the work into three slices: persistent forest scene state in `utils/store.js`, a focused Canvas interaction engine in `utils/forest-water-rhythm.js`, and a page-level rewrite of `pages/explore/explore.*` plus regression scripts. Canvas owns per-frame positions and animation; page `data` only owns text/status UI.

**Tech Stack:** WeChat Mini Program page files, Canvas 2D via `wx.createSelectorQuery().fields({ node, size })`, plain JS utility modules, Node-based assertion scripts.

---

### Task 1: Add persistent forest scene state and user-facing copy

**Files:**
- Modify: `utils/store.js`
- Modify: `utils/copy.js`
- Modify: `scripts/check-forest-water-rhythm-game.js`

- [ ] **Step 1: Write the failing test**

Replace the old scaffold assertions with checks for the new persistence API and user-facing copy.

```js
const state = store.getForestSceneState();
assert.ok(state && Array.isArray(state.drops), 'Store should expose a forest scene snapshot');

store.saveForestSceneState({
  drops: [{ id: 'drop_1', x: 12, y: 18, radius: 16, vx: 0, vy: 0, hueOffset: 0 }],
  mode: 'normal',
  intakeSnapshot: 300,
  targetSnapshot: 2000,
  updatedAt: '2026-04-01T00:00:00.000Z'
});

const saved = store.getForestSceneState();
assert.strictEqual(saved.drops[0].x, 12, 'Saved forest scene state should persist drop positions');
assert.strictEqual(COPY.forestWaterRhythm.emptyHint, '喝一点水，这里就会出现新的小水滴');
assert.ok(COPY.forestWaterRhythm.irrigationHint.includes('持续灌溉'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-forest-water-rhythm-game.js`

Expected: FAIL because the store does not yet expose `getForestSceneState()` / `saveForestSceneState()` and the new copy values are missing.

- [ ] **Step 3: Write minimal implementation**

In `utils/store.js`, add a normalized forest scene bucket under `business.forestScene` and expose these methods from the module export:

```js
function normalizeForestDrop(drop, index) {
  const safeDrop = drop || {};
  return {
    id: String(safeDrop.id || `drop_${index + 1}`),
    x: Number.isFinite(Number(safeDrop.x)) ? Number(safeDrop.x) : 0,
    y: Number.isFinite(Number(safeDrop.y)) ? Number(safeDrop.y) : 0,
    radius: Number.isFinite(Number(safeDrop.radius)) ? Number(safeDrop.radius) : 18,
    vx: Number.isFinite(Number(safeDrop.vx)) ? Number(safeDrop.vx) : 0,
    vy: Number.isFinite(Number(safeDrop.vy)) ? Number(safeDrop.vy) : 0,
    hueOffset: Number.isFinite(Number(safeDrop.hueOffset)) ? Number(safeDrop.hueOffset) : 0,
    hasBeenDragged: Boolean(safeDrop.hasBeenDragged)
  };
}

function normalizeForestScene(scene) {
  const safeScene = scene || {};
  return {
    drops: Array.isArray(safeScene.drops) ? safeScene.drops.map(normalizeForestDrop) : [],
    mode: safeScene.mode === 'irrigation' ? 'irrigation' : 'normal',
    intakeSnapshot: Number(safeScene.intakeSnapshot) || 0,
    targetSnapshot: Number(safeScene.targetSnapshot) || DEFAULT_DAILY_TARGET,
    updatedAt: safeScene.updatedAt || nowIsoString()
  };
}

function getForestSceneState() {
  const state = ensureState();
  return normalizeForestScene((((state.business || {}).forestScene) || {}));
}

function saveForestSceneState(sceneState) {
  const normalized = normalizeForestScene(sceneState);
  updateState((state) => {
    state.business = state.business || {};
    state.business.forestScene = normalized;
    return state;
  });
  return normalized;
}
```

Also extend `buildDefaultState()` to include:

```js
business: {
  forestScene: {
    drops: [],
    mode: 'normal',
    intakeSnapshot: 0,
    targetSnapshot: DEFAULT_DAILY_TARGET,
    updatedAt: generatedAt
  }
},
```

In `utils/copy.js`, replace the old developer-facing bucket with user-facing labels:

```js
forestWaterRhythm: {
  navTitle: '水滴花园',
  statusTitle: '水滴花园',
  gameTitle: '水滴花园',
  gameSubtitle: '拖一拖，让水滴慢慢汇成一片清泉',
  energyLabel: '今天已经积累 {{intake}} ml 水分',
  emptyHint: '喝一点水，这里就会出现新的小水滴',
  normalHint: '拖动水滴，靠近时它们会自然汇在一起',
  irrigationHint: '今天的饮水目标已完成，水滴正在为森林持续灌溉',
  actionLabel: '去记录补水'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-forest-water-rhythm-game.js`

Expected: PASS for the new store API and copy assertions, while page-shape assertions still fail in later tasks if not updated yet.

### Task 2: Build the Canvas water-drop engine

**Files:**
- Modify: `utils/forest-water-rhythm.js`
- Modify: `scripts/check-forest-water-rhythm-game.js`

- [ ] **Step 1: Write the failing test**

Add direct utility-level assertions for the new engine API in `scripts/check-forest-water-rhythm-game.js`.

```js
const engine = require(path.join(root, 'utils/forest-water-rhythm'));

assert.strictEqual(typeof engine.createDropsFromIntake, 'function');
assert.strictEqual(typeof engine.reconcileDropsWithIntake, 'function');
assert.strictEqual(typeof engine.findDropAtPoint, 'function');
assert.strictEqual(typeof engine.drawDrop, 'function');

const created = engine.createDropsFromIntake(250, { width: 320, height: 480, seed: 1 });
assert.strictEqual(created.length, 5, 'Each 50ml should create one base drop');

const reconciled = engine.reconcileDropsWithIntake(created.slice(0, 2), 300, { width: 320, height: 480, seed: 2 });
assert.strictEqual(reconciled.length, 6, 'Increasing intake should append drops without rebuilding the whole scene');

const hit = engine.findDropAtPoint(created, created[0].x, created[0].y);
assert.ok(hit, 'Hit testing should find the tapped drop');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-forest-water-rhythm-game.js`

Expected: FAIL because the current utility file still exposes the old DOM helper API.

- [ ] **Step 3: Write minimal implementation**

Rewrite `utils/forest-water-rhythm.js` around a Canvas-friendly API. The file should export focused helpers like:

```js
function createDropsFromIntake(todayIntake, canvasSize) {}
function reconcileDropsWithIntake(existingDrops, todayIntake, canvasSize) {}
function findDropAtPoint(drops, x, y) {}
function moveDraggedDrop(drop, point, canvasSize) {}
function findMergeCandidate(activeDrop, drops, thresholdRatio) {}
function mergeDrops(activeDrop, targetDrop) {}
function applyIrrigationFrame(drops, canvasSize, dt) {}
function applyAutoAttraction(drops, strength) {}
function drawDrop(ctx, drop) {}
function drawBridge(ctx, dropA, dropB, closeness) {}
```

Implementation rules:

```js
const DROP_UNIT_INTAKE = 50;

function createDropsFromIntake(todayIntake, canvasSize) {
  const count = Math.max(0, Math.floor(Number(todayIntake || 0) / DROP_UNIT_INTAKE));
  return Array.from({ length: count }, (_, index) => buildDrop(index, canvasSize));
}

function reconcileDropsWithIntake(existingDrops, todayIntake, canvasSize) {
  const nextCount = Math.max(0, Math.floor(Number(todayIntake || 0) / DROP_UNIT_INTAKE));
  const safeDrops = Array.isArray(existingDrops) ? existingDrops.slice() : [];
  if (safeDrops.length < nextCount) {
    for (let index = safeDrops.length; index < nextCount; index += 1) {
      safeDrops.push(buildDrop(index, canvasSize));
    }
  }
  if (safeDrops.length > nextCount) {
    return safeDrops
      .slice()
      .sort((left, right) => Number(left.hasBeenDragged) - Number(right.hasBeenDragged) || left.radius - right.radius)
      .slice(0, nextCount);
  }
  return safeDrops;
}
```

`drawDrop(ctx, drop)` must use `ctx.createRadialGradient(...)`, and `applyIrrigationFrame(...)` must increase `vy` with gravity then recycle drops from the top when they cross the bottom boundary.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-forest-water-rhythm-game.js`

Expected: PASS for the utility-level API and intake reconciliation behavior.

### Task 3: Rewrite the explore page around Canvas rendering

**Files:**
- Modify: `pages/explore/explore.js`
- Modify: `pages/explore/explore.wxml`
- Modify: `pages/explore/explore.wxss`
- Modify: `pages/explore/explore.json` if component registration changes
- Modify: `scripts/check-forest-water-rhythm-game.js`
- Modify: `scripts/check-forest-page-clean.js`

- [ ] **Step 1: Write the failing test**

Replace the old page assertions in `scripts/check-forest-water-rhythm-game.js` with checks for the Canvas scene and irrigation-mode behavior:

```js
assert.ok(exploreWxml.includes('type="2d"'), 'Explore page should render a 2d canvas');
assert.ok(exploreWxml.includes('id="waterCanvas"'), 'Explore page should expose the water canvas node');
assert.ok(exploreWxml.includes('bindtouchstart="handleCanvasTouchStart"'));
assert.ok(exploreWxml.includes('bindtouchmove="handleCanvasTouchMove"'));
assert.ok(exploreJs.includes('initCanvas'));
assert.ok(exploreJs.includes('startAnimationLoop'));
assert.ok(exploreJs.includes('saveForestSceneState'));
assert.ok(exploreJs.includes('requestAnimationFrame'));
assert.ok(!exploreWxml.includes('class="water-drop'), 'DOM water drops should be removed');
assert.ok(!exploreWxml.includes('terrain-left'), 'Legacy bottom terrain layers should be removed');
assert.ok(exploreWxss.includes('.water-canvas'), 'Canvas stage styling should exist');
assert.ok(exploreWxml.includes('{{gameCopy.irrigationHint}}'), 'Explore page should render the irrigation hint from shared copy');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-forest-water-rhythm-game.js`

Expected: FAIL because the page still uses DOM droplets and old copy.

- [ ] **Step 3: Write minimal implementation**

Rebuild `pages/explore/explore.js` so that it:

```js
onShow() {
  this.ensureStore();
  this.refreshForestMeta();
  this.initCanvas();
}

initCanvas() {
  wx.createSelectorQuery()
    .in(this)
    .select('#waterCanvas')
    .fields({ node: true, size: true })
    .exec((res) => { /* store canvas, dpr, ctx, and scene */ });
}

startAnimationLoop() {
  const tick = (timestamp) => {
    this.stepFrame(timestamp);
    this.animationFrameId = this.requestAnimationFrame(tick);
  };
  this.animationFrameId = this.requestAnimationFrame(tick);
}

handleCanvasTouchEnd() {
  this.activeDropId = '';
  this.persistScene();
}
```

Required page behavior:

1. On show, read `store.getForestViewModel()` and `store.getForestSceneState()`.
2. Reconcile cached drops with the latest intake amount.
3. Set `interactionMode` to `irrigation` only when `todayIntake >= dailyTarget`.
4. In normal mode, only manual drag can trigger merge.
5. In irrigation mode, run auto-attraction plus gravity-based falling and top respawn.
6. After `touchend` or successful merge, call `this.store.saveForestSceneState(...)`.
7. Keep page `data` focused on summary text, mode flags, and labels, not the live drop array.

Rebuild `pages/explore/explore.wxml` so the stage uses a single canvas:

```xml
<view class="water-stage">
  <view class="stage-copy">
    <text class="section-title">{{gameCopy.gameTitle}}</text>
    <text class="section-subtitle">{{isIrrigationMode ? gameCopy.irrigationHint : gameCopy.normalHint}}</text>
  </view>
  <canvas
    id="waterCanvas"
    type="2d"
    class="water-canvas"
    bindtouchstart="handleCanvasTouchStart"
    bindtouchmove="handleCanvasTouchMove"
    bindtouchend="handleCanvasTouchEnd"
    bindtouchcancel="handleCanvasTouchEnd"
  />
  <view wx:if="{{showEmptyHint}}" class="canvas-empty">{{gameCopy.emptyHint}}</view>
</view>
```

Rebuild `pages/explore/explore.wxss` so the stage is clean and layered lightly around the canvas:

```css
.water-stage {
  position: relative;
  padding: 28rpx;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, rgba(237, 248, 255, 0.96), rgba(225, 244, 255, 0.88));
}

.water-canvas {
  width: 100%;
  height: 720rpx;
  border-radius: 44rpx;
  background: radial-gradient(circle at top, rgba(255,255,255,0.92), rgba(209,235,248,0.72));
}
```

Also remove obsolete selectors and assertions that depend on `.water-drop`, `.terrain-*`, or the old vessel container.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node scripts/check-forest-water-rhythm-game.js
node scripts/check-copy-vocabulary.js
node scripts/check-forest-page-clean.js
```

Expected: PASS for all three scripts.

### Task 4: Final verification sweep

**Files:**
- No new files required unless verification uncovers issues

- [ ] **Step 1: Run focused regression checks**

Run:

```bash
node scripts/check-forest-water-rhythm-game.js
node scripts/check-copy-vocabulary.js
node scripts/check-forest-page-clean.js
node scripts/check-home-view-model.js
```

Expected: PASS.

- [ ] **Step 2: Run broader smoke verification**

Run:

```bash
node scripts/smoke-check.js
```

Expected: PASS.
