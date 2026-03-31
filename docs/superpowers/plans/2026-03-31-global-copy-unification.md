# Global Copy Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all user-facing wording in `drink1` around one product voice: the brand remains `喝水了吗`, while product and action wording consistently uses `补水`.

**Architecture:** Add a single source of truth for copy strings so store-derived view models, page headers, buttons, menus, and toast messages all read from the same terms. Keep business logic untouched; only change labels, titles, and user-facing text, then lock the vocabulary down with a regression check and the existing smoke test.

**Tech Stack:** WeChat Mini Program JavaScript, WXML, WXSS, Node.js assertion scripts.

---

### Task 1: Add a shared copy dictionary

**Files:**
- Create: `utils/copy.js`

- [ ] **Step 1: Write the shared copy constants**

```js
const APP_NAME = '喝水了吗';

const COPY = {
  appName: APP_NAME,
  home: {
    navTitle: '今日补水',
    statusTitle: '今日补水',
    actionLabel: '记录补水'
  },
  profile: {
    navTitle: '我的补水档案',
    statusTitle: '我的补水档案',
    actionLabel: '同步资料'
  },
  forest: {
    navTitle: '补水森林',
    statusTitle: '补水森林',
    actionLabel: '去补水'
  },
  login: {
    navTitle: '补水登录',
    heroTitle: '欢迎来到喝水了吗',
    panelTitle: '补水授权'
  },
  settings: {
    navTitle: '补水设置'
  },
  profileEdit: {
    navTitle: '编辑补水资料'
  },
  privacy: {
    navTitle: '补水隐私条款'
  },
  about: {
    navTitle: '关于补水'
  },
  medals: {
    navTitle: '补水勋章'
  }
};

module.exports = {
  APP_NAME,
  COPY
};
```

- [ ] **Step 2: Verify the file loads**

Run: `node --check utils/copy.js`
Expected: PASS

### Task 2: Route store and page view models through the shared copy

**Files:**
- Modify: `utils/store.js`
- Modify: `pages/home/home.js`
- Modify: `pages/profile/profile.js`
- Modify: `pages/explore/explore.js`
- Modify: `pages/login/login.js`
- Modify: `pages/settings/settings.js`
- Modify: `pages/profile/edit.js`
- Modify: `pages/privacy/privacy.js`
- Modify: `pages/about/about.js`
- Modify: `pages/medals/medals.js`

- [ ] **Step 1: Add `copy` imports and replace hard-coded page titles/actions**

```js
const { COPY } = require('./copy');

// example usage
const statusBar = {
  title: COPY.home.statusTitle,
  actionLabel: COPY.home.actionLabel
};
```

- [ ] **Step 2: Update the home/profile/forest view models**

```js
const statusBar = {
  tone: todayStatus.level,
  title: COPY.home.statusTitle,
  subtitle: todayStatus.hint,
  metricValue: `${today.total} ml`,
  metricLabel: `/ ${state.settings.dailyTarget} ml`,
  actionLabel: COPY.home.actionLabel
};
```

- [ ] **Step 3: Update login/settings/edit/privacy/about/medals page strings**

```js
// Example: navigationBarTitleText should use the shared copy target
navigationBarTitleText: COPY.login.navTitle
```

- [ ] **Step 4: Run syntax checks on all touched page scripts**

Run:
`node --check utils/store.js && node --check pages/home/home.js && node --check pages/profile/profile.js && node --check pages/explore/explore.js && node --check pages/login/login.js && node --check pages/settings/settings.js && node --check pages/profile/edit.js && node --check pages/privacy/privacy.js && node --check pages/about/about.js && node --check pages/medals/medals.js`

Expected: PASS

### Task 3: Replace page-local copy with the shared vocabulary

**Files:**
- Modify: `pages/home/home.json`
- Modify: `pages/home/home.wxml`
- Modify: `pages/profile/profile.json`
- Modify: `pages/profile/profile.wxml`
- Modify: `pages/explore/explore.json`
- Modify: `pages/explore/explore.wxml`
- Modify: `pages/login/login.json`
- Modify: `pages/login/login.wxml`
- Modify: `pages/settings/settings.json`
- Modify: `pages/settings/settings.wxml`
- Modify: `pages/profile/edit.json`
- Modify: `pages/profile/edit.wxml`
- Modify: `pages/privacy/privacy.json`
- Modify: `pages/privacy/privacy.wxml`
- Modify: `pages/about/about.json`
- Modify: `pages/about/about.wxml`
- Modify: `pages/medals/medals.json`
- Modify: `pages/medals/medals.wxml`

- [ ] **Step 1: Replace page titles and primary CTAs with the shared copy**

```json
{
  "navigationBarTitleText": "补水登录"
}
```

- [ ] **Step 2: Replace visible page headlines, helper copy, and footer labels**

```xml
<text class="hero-title">把每一次补水都记录成可见的进步</text>
```

- [ ] **Step 3: Replace remaining legacy phrases on auxiliary pages**

```xml
<text class="section-title">补水产品说明</text>
```

- [ ] **Step 4: Verify the copied text renders cleanly on the pages**

Run: `node scripts/check-auxiliary-copy.js`
Expected: PASS

### Task 4: Lock the vocabulary with regression checks

**Files:**
- Create: `scripts/check-copy-vocabulary.js`
- Modify: `scripts/check-auxiliary-copy.js`
- Modify: `scripts/check-page-status-bars.js`
- Modify: `scripts/smoke-check.js`

- [ ] **Step 1: Write a global vocabulary regression script**

```js
assert.ok(homeJson.includes('补水'), 'Home title should use hydration copy');
assert.ok(profileJson.includes('补水'), 'Profile title should use hydration copy');
assert.ok(loginJson.includes('补水'), 'Login title should use hydration copy');
assert.ok(settingsJson.includes('补水'), 'Settings title should use hydration copy');
```

- [ ] **Step 2: Ensure the auxiliary copy script covers all auxiliary pages**

```js
assert.ok(aboutWxml.includes('补水产品说明'), 'About page should use hydration copy');
assert.ok(medalsWxml.includes('补水勋章'), 'Medals page should use hydration copy');
```

- [ ] **Step 3: Wire both checks into smoke-check**

```js
checkAuxiliaryCopy();
checkCopyVocabulary();
```

- [ ] **Step 4: Run the full verification suite**

Run:
`node scripts/check-copy-vocabulary.js && node scripts/check-auxiliary-copy.js && node scripts/smoke-check.js`

Expected: PASS

### Task 5: Final cleanup and review

**Files:**
- Modify: any touched file with residual legacy copy

- [ ] **Step 1: Search for leftover legacy phrases**

Run: `rg -n "喝水设置|我的勋章|隐私条款|关于我们|登录授权|数字森林|记录饮水|同步数据|喝水记录|个人中心" pages scripts utils`

Expected: only allowed brand text (`喝水了吗`) and intentional historical references remain.

- [ ] **Step 2: Re-run smoke check after cleanup**

Run: `node scripts/smoke-check.js`
Expected: PASS

- [ ] **Step 3: Stop only when the vocabulary is consistent end-to-end**

No further code changes unless the search or smoke check exposes a mismatch.
