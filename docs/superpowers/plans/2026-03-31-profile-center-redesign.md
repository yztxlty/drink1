# 补水档案中心重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“我的”相关能力重构为一个统一的补水档案中心，完成更高级的勋章橱窗、个人总览、设置控制台与 JSON 导出体验。

**Architecture:** 以 `utils/store.js` 作为唯一数据源，先统一勋章定义与视图模型，再分别重做勋章页、档案主页、设置页和导出能力。视觉层面使用透明奖章素材、玻璃拟态卡片、分层统计区与更高密度的收藏展示，让页面同时满足“看起来高级”和“信息可读”。

**Tech Stack:** 微信小程序 WXML/WXSS/JS、现有 `utils/store.js` / `utils/medals.js` / `utils/copy.js`、本地文件系统导出、现有 smoke-check 脚本。

---

### Task 1: 统一勋章数据模型并接入图片资产

**Files:**
- Modify: `utils/medals.js`
- Modify: `utils/store.js`
- Modify: `pages/medals/medals.js`
- Modify: `pages/medals/medals.json`

- [ ] **Step 1: Update the medal definitions to use asset paths**

```js
// utils/medals.js
const MEDAL_DEFINITIONS = [
  {
    id: 'first_drop',
    name: '第一滴',
    icon: '/assets/medals/first_drop.png',
    description: '完成第一次补水记录',
    category: 'record',
    target: 1,
    getProgress(context) {
      return context.totalRecords
    }
  }
]
```

- [ ] **Step 2: Extend the profile view model so medal cards expose image-ready data**

```js
// utils/store.js
return {
  badges: MEDAL_DEFINITIONS.map((definition) => {
    const progress = state.achievements.progress[definition.id] || {
      current: 0,
      target: definition.target,
      unlocked: false,
      completionRate: 0
    }

    return {
      id: definition.id,
      name: definition.name,
      icon: definition.icon,
      description: definition.description,
      target: definition.target,
      category: definition.category,
      unlocked: progress.unlocked,
      progressCurrent: progress.current,
      progressTarget: progress.target,
      progressText: `${Math.min(progress.current, progress.target)}/${progress.target}`,
      completionRate: progress.completionRate
    }
  })
}
```

- [ ] **Step 3: Replace the local hardcoded medal catalog in the page with store-driven medals**

```js
// pages/medals/medals.js
const profileViewModel = this.store ? this.store.getProfileViewModel() : { badges: [] }
const medals = (profileViewModel.badges || []).map((item) => ({
  id: item.id,
  title: item.name,
  icon: item.icon,
  desc: item.description,
  condition: item.progressText,
  unlocked: Boolean(item.unlocked),
  progressText: item.unlocked
    ? `已解锁 · 累计进度 ${item.progressText}`
    : `还差 ${Math.max(item.progressTarget - item.progressCurrent, 0)} 步`
}))
```

- [ ] **Step 4: Wire the medal page to the updated model and expose image assets in the template**

```xml
<!-- pages/medals/medals.wxml -->
<image class="medal-icon-img" src="{{item.icon}}" mode="aspectFit" />
```

- [ ] **Step 5: Run a quick regression check**

Run: `node scripts/smoke-check.js`
Expected: medal cards render image paths without breaking the existing page model.

- [ ] **Step 6: Commit**

```bash
git add utils/medals.js utils/store.js pages/medals
git commit -m "feat: switch medals to asset-backed showcase"
```

### Task 2: Redesign the medal showcase into a premium gallery

**Files:**
- Modify: `pages/medals/medals.wxml`
- Modify: `pages/medals/medals.wxss`

- [ ] **Step 1: Rebuild the layout into a hero plus responsive medal grid**

```xml
<!-- pages/medals/medals.wxml -->
<scroll-view class="scrollarea" scroll-y>
  <view class="container medal-page">
    <view class="hero-card glass-card">
      <text class="hero-kicker">{{copy.heroKicker}}</text>
      <text class="hero-title">{{copy.heroTitle}}</text>
      <view class="hero-chip-row">
        <view class="hero-chip">已解锁 {{summary.unlockedCount}}</view>
        <view class="hero-chip">总计 {{summary.totalCount}}</view>
      </view>
    </view>

    <view class="medal-gallery">
      <view class="medal-card glass-card {{item.unlocked ? 'unlocked' : 'locked'}}" wx:for="{{visibleMedals}}" wx:key="id">
        <view class="medal-art">
          <view class="medal-halo"></view>
          <image class="medal-icon-img" src="{{item.icon}}" mode="aspectFit" />
        </view>
        <view class="medal-copy">
          <view class="medal-title-row">
            <text class="medal-title">{{item.title}}</text>
            <text class="medal-status">{{item.unlocked ? '已解锁' : '未解锁'}}</text>
          </view>
          <text class="medal-desc">{{item.desc}}</text>
          <text class="medal-progress">{{item.progressText}}</text>
        </view>
      </view>
    </view>
  </view>
</scroll-view>
```

- [ ] **Step 2: Add glass, glow, and lock-state styling that makes the images look premium**

```css
/* pages/medals/medals.wxss */
.medal-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
}

.medal-card {
  padding: 28rpx 24rpx;
  border-radius: 36rpx;
  overflow: hidden;
  position: relative;
}

.medal-art {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 18rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 35%, rgba(255,255,255,0.95), rgba(231, 245, 255, 0.78) 58%, rgba(0,95,155,0.08) 100%);
  box-shadow: 0 18rpx 36rpx rgba(16, 53, 83, 0.12), inset 0 1rpx 0 rgba(255,255,255,0.8);
}

.medal-halo {
  position: absolute;
  inset: -10rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,95,155,0.16), transparent 66%);
  filter: blur(6rpx);
}

.medal-icon-img {
  position: relative;
  z-index: 1;
  width: 108rpx;
  height: 108rpx;
  top: 26rpx;
  left: 26rpx;
  filter: drop-shadow(0 10rpx 18rpx rgba(13, 45, 74, 0.18));
}

.medal-card.locked {
  opacity: 0.6;
  filter: grayscale(0.25);
}
```

- [ ] **Step 3: Verify the gallery layout on small and large screens**

Run: `node scripts/smoke-check.js`
Expected: cards keep their proportions and icon/text spacing stays readable.

- [ ] **Step 4: Commit**

```bash
git add pages/medals/medals.wxml pages/medals/medals.wxss
git commit -m "feat: redesign medal gallery"
```

### Task 3: Turn the profile page into a real hydration dashboard

**Files:**
- Modify: `pages/profile/profile.wxml`
- Modify: `pages/profile/profile.wxss`
- Modify: `pages/profile/profile.js`
- Modify: `pages/profile/profile.json`
- Modify: `utils/store.js`
- Modify: `utils/copy.js`

- [ ] **Step 1: Add summary, analysis, and action sections to the profile page**

```xml
<!-- pages/profile/profile.wxml -->
<view class="analysis-card glass-card">
  <text class="section-title">补水分析</text>
  <view class="analysis-grid">
    <view class="analysis-item">
      <text class="analysis-value">{{analysis.averageDaily}}</text>
      <text class="analysis-label">平均日补水</text>
    </view>
    <view class="analysis-item">
      <text class="analysis-value">{{analysis.averageCup}}</text>
      <text class="analysis-label">平均单次</text>
    </view>
  </view>
  <text class="analysis-summary">{{analysis.summary}}</text>
  <text class="analysis-suggestion">{{analysis.suggestion}}</text>
</view>
```

- [ ] **Step 2: Build the profile analysis payload from the store**

```js
// utils/store.js
function getProfileViewModel() {
  const state = ensureState()
  const totalRecords = state.hydration.totals.totalRecords || 0
  const totalAmount = state.hydration.totals.totalAmount || 0
  const averageCup = totalRecords ? Math.round(totalAmount / totalRecords) : 0

  return {
    // existing fields...
    analysis: {
      averageDaily: `${(totalAmount / 1000).toFixed(1)} L`,
      averageCup: `${averageCup} ml`,
      summary: state.hydration.streak.current >= 3
        ? '你的补水节奏已经稳定，继续保持。'
        : '你的补水还在建立节奏，建议固定几个容易执行的时间点。',
      suggestion: averageCup < state.settings.selectedCupAmount
        ? `可以优先把单次容量调整到 ${state.settings.selectedCupAmount} ml 附近，减少记录偏差。`
        : '保持当前节奏，再把补水时间分布做得更均匀。'
    }
  }
}
```

- [ ] **Step 3: Add export JSON data and a visible storage path result to the page**

```js
// pages/profile/profile.js
exportData() {
  const payload = this.store ? this.store.exportHydrationData() : null
  if (!payload) return
  this.setData({
    exportResult: payload
  })
}
```

- [ ] **Step 4: Add premium styling for the analysis and export cards**

```css
/* pages/profile/profile.wxss */
.analysis-grid {
  display: flex;
  gap: 20rpx;
  margin: 20rpx 0;
}

.analysis-item {
  flex: 1;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(255,255,255,0.52);
}
```

- [ ] **Step 5: Verify that profile actions still work**

Run: `node scripts/smoke-check.js`
Expected: profile page still navigates to edit, settings, medals, privacy, about, and logout.

- [ ] **Step 6: Commit**

```bash
git add pages/profile utils/store.js utils/copy.js
git commit -m "feat: turn profile page into hydration dashboard"
```

### Task 4: Refine settings into a hydration control console

**Files:**
- Modify: `pages/settings/settings.wxml`
- Modify: `pages/settings/settings.wxss`
- Modify: `pages/settings/settings.js`
- Modify: `utils/copy.js`

- [ ] **Step 1: Reframe settings around goal, cup size, and quick amount controls**

```xml
<!-- pages/settings/settings.wxml -->
<view class="goal-card glass-card">
  <view class="section-head">
    <text class="section-title">每日补水目标</text>
    <text class="section-value">{{settings.dailyGoal}}ml</text>
  </view>
  <slider min="800" max="3500" step="100" value="{{settings.dailyGoal}}" bindchange="onGoalChange" />
</view>
```

- [ ] **Step 2: Make quick amounts clearly editable and linked to home-record values**

```js
// pages/settings/settings.js
selectAmount(e) {
  const amount = Number(e.currentTarget.dataset.amount)
  const quickAmounts = this.data.settings.quickAmounts.includes(amount)
    ? this.data.settings.quickAmounts.filter((item) => item !== amount)
    : [...this.data.settings.quickAmounts, amount].sort((a, b) => a - b)

  this.commitSettings({
    ...this.data.settings,
    quickAmounts,
    selectedCupAmount: amount
  })
}
```

- [ ] **Step 3: Add a compact helper copy block that explains the shared behavior**

```js
// utils/copy.js
settings: {
  // existing fields...
  sharedHint: '这里调整的单次饮水量会同步到首页快速记录。',
  exportHint: '同步补水资料会导出标准 JSON 文件到本机存储。'
}
```

- [ ] **Step 4: Run a regression check on the settings page**

Run: `node scripts/smoke-check.js`
Expected: goal slider, quick amounts, and save flow still work.

- [ ] **Step 5: Commit**

```bash
git add pages/settings utils/copy.js
git commit -m "feat: refine hydration settings console"
```

### Task 5: Add export payload support and finalize verification

**Files:**
- Modify: `utils/store.js`
- Modify: `pages/profile/profile.js`
- Modify: `scripts/smoke-check.js`

- [ ] **Step 1: Add an export helper that returns the canonical JSON payload and path**

```js
// utils/store.js
function exportHydrationData() {
  const state = ensureState()
  const exportedAt = new Date().toISOString()
  const filename = `drink1-export-${exportedAt.replace(/[-:]/g, '').replace(/\..+$/, '')}.json`
  return {
    filename,
    path: `${wx.env.USER_DATA_PATH}/${filename}`,
    payload: {
      schemaVersion: 1,
      exportedAt,
      profile: clone(state.profile),
      settings: clone(state.settings),
      hydration: clone(state.hydration),
      achievements: clone(state.achievements),
      meta: clone(state.meta)
    }
  }
}
```

- [ ] **Step 2: Wire the profile page action to write the JSON file and show the save path**

```js
// pages/profile/profile.js
exportData() {
  const result = this.store ? this.store.exportHydrationData() : null
  if (!result) {
    wx.showToast({ title: '导出失败', icon: 'none' })
    return
  }

  const fs = wx.getFileSystemManager()
  fs.writeFileSync(result.path, JSON.stringify(result.payload, null, 2), 'utf8')
  this.setData({ exportResult: result })
}
```

- [ ] **Step 3: Extend the smoke script to assert medal paths and export helpers exist**

```js
const { MEDAL_DEFINITIONS } = require('../utils/medals')
assert.ok(MEDAL_DEFINITIONS.every((item) => item.icon.startsWith('/assets/medals/')))
```

- [ ] **Step 4: Run full verification**

Run:
```bash
node scripts/smoke-check.js
```
Expected: all existing checks pass and the new medal asset assertions succeed.

- [ ] **Step 5: Commit**

```bash
git add utils/store.js pages/profile/profile.js scripts/smoke-check.js
git commit -m "feat: add hydration export payload support"
```

## Verification Plan

### Automated Checks
- `node scripts/smoke-check.js`
- Existing page regression scripts in `scripts/`

### Manual Checks
- Open the medal page and confirm all icons render as premium gallery cards, not flat emoji-style badges.
- Confirm locked medals are still readable but visually subdued.
- Confirm the profile page shows summary, analysis, and actions without crowding.
- Confirm settings changes affect the same selected cup amount used by the home record flow.
- Confirm export writes a JSON file and displays a usable path string.

