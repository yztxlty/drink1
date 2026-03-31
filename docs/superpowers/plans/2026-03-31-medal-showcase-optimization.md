# 勋柜橱窗优化 (Medal Showcase Optimization) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构勋章橱窗，使用极简毛玻璃风格图标替换 Emoji，并实现丝滑的横向滚动展示效果。

**Architecture:** 
1.  **资产层**：生成 8 个高品质 PNG 图标。
2.  **逻辑层**：更新勋章定义，将图标引用指向新生成的资产。
3.  **视图层**：利用 `scroll-view` 实现响应式横向布局，通过 CSS 伪元素添加边缘渐变遮罩。

**Tech Stack:** 微信小程序 (WXML/WXSS/JS), DALL-E (Image Generation)

---

## Proposed Changes

### [Task 1: 勋章图标资产生成与部署]

**Files:**
- [NEW] `assets/medals/first_drop.png`
- [NEW] `assets/medals/goal_once.png`
- [NEW] `assets/medals/streak_3.png`
- [NEW] `assets/medals/streak_7.png`
- [NEW] `assets/medals/early_bird.png`
- [NEW] `assets/medals/night_guard.png`
- [NEW] `assets/medals/cup_20.png`
- [NEW] `assets/medals/litre_50.png`

- [ ] **Step 1: 生成并保存图标**
    使用 `generate_image` 为每个勋章生成内容。提示词需包含：`Glassmorphism style`, `minimalist`, `frosted glass`, `translucent`, `soft reflection`, `organic shape`, `premium quality`, `on transparent background`.
- [ ] **Step 2: 验证资产完整性**
    确认所有 8 个文件已正确保存且背景透明。
- [ ] **Step 3: Commit**
    ```bash
    git add assets/medals/
    git commit -m "assets: add glassmorphism medal icons"
    ```

### [Task 2: 更新勋章定义逻辑]

**Files:**
- [MODIFY] `utils/medals.js`

- [ ] **Step 1: 修改图标引用路径**
    将 `MEDAL_DEFINITIONS` 中的 `icon` 字段从 Emoji 更改为图片路径。

```javascript
// utils/medals.js
const MEDAL_DEFINITIONS = [
  {
    id: 'first_drop',
    name: '第一滴',
    icon: '/assets/medals/first_drop.png', // 修改此处
    // ...
  },
  // 重复更新所有 8 个定义
];
```

- [ ] **Step 2: Commit**
    ```bash
    git commit -am "feat: update medal definitions to use image assets"
    ```

### [Task 3: 重构个人中心勋章视图]

**Files:**
- [MODIFY] `pages/profile/profile.wxml`
- [MODIFY] `pages/profile/profile.wxss`

- [ ] **Step 1: 更新 WXML 结构**
    将 `.badge-list` 包装在 `scroll-view` 中，并更新图标渲染逻辑。

```xml
<!-- pages/profile/profile.wxml -->
<scroll-view class="badge-scroll-view" scroll-x enable-flex>
  <view class="badge-list">
    <view class="badge-card {{item.unlocked ? '' : 'locked'}}" wx:for="{{badges}}" wx:key="id">
      <image class="badge-icon-img" src="{{item.icon}}" mode="aspectFit" />
      <text class="badge-name">{{item.name}}</text>
    </view>
  </view>
</scroll-view>
```

- [ ] **Step 2: 更新 WXSS 样式**
    实现横向滚动布局，添加边缘渐变遮罩。

```css
/* pages/profile/profile.wxss */
.badge-scroll-view {
  width: 100%;
  white-space: nowrap;
  margin-top: 24rpx;
  position: relative;
}

.badge-list {
  display: inline-flex; /* 关键：确保不换行 */
  padding: 0 30rpx 20rpx;
  gap: 24rpx;
}

.badge-card {
  flex: 0 0 160rpx; /* 固定宽度，防止挤压 */
  min-height: 152rpx;
  padding: 24rpx 12rpx;
  border-radius: 34rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(238, 241, 243, 0.92));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.badge-icon-img {
  width: 80rpx;
  height: 80rpx;
}

.badge-card.locked {
  filter: grayscale(100%);
  opacity: 0.5;
}

.badge-name {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--on-surface);
  text-align: center;
  line-height: 1.5;
}

/* 边缘遮罩 */
.badge-preview::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 60rpx;
  background: linear-gradient(to right, transparent, white);
  pointer-events: none;
  z-index: 2;
}
```

- [ ] **Step 3: Commit**
    ```bash
    git commit -am "feat: implement horizontal scroll for medal showcase"
    ```

## Verification Plan

### Automated Tests
- N/A (UI visual task).

### Manual Verification
- 在模拟器中确认勋章名称是否水平排列且无截断。
- 模拟解锁一个勋章，确认其灰度滤镜消失且图标变为彩色。
- 确保滑动丝滑，无卡顿。
