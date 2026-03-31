# 勋章橱窗优化设计规约 (Medal Showcase Optimization)

本项目旨在通过视觉资产重绘和交互布局重构，提升补水计划勋章展示区域的高级感与可用性。

## 修改范围

### 1. 勋章图标资产 (Icon Assets)
*   **资源路径**：`/assets/medals/*.png`
*   **设计风格**：极简毛玻璃 (Glassmorphism)。半透明、磨砂感、带柔和反射。
*   **图标内容**：
    1.  `first_drop` -> 极简玻璃水滴
    2.  `goal_once` -> 磨砂玻璃箭靶
    3.  `streak_3` -> 玻璃罩内的淡色火焰
    4.  `streak_7` -> 透明海浪层叠
    5.  `early_bird` -> 磨砂地平线上的冰蓝红日
    6.  `night_guard` -> 弯月冰块背光效果
    7.  `cup_20` -> 晶莹剔透的水杯叠影
    8.  `litre_50` -> 玻璃质感的生长树

### 2. 补水档案首页 (Profile Page)
*   **WXML**：将当前的 `.badge-list` 替换为 `scroll-view`。
*   **WXSS**：
    *   启用水平滚动 (`scroll-x`) 和 Flex 布局 (`enable-flex`)。
    *   优化勋章卡片宽度，确保每屏展示 3-4 个，其余通过滑动查看。
    *   勋章名称显示于图标的正下方，确保文字无遮挡、不挤压。
    *   在滚动区域左右两侧实现渐变蒙版，产生视觉深度。

### 3. 数据层 (Utility Logic)
*   **`utils/medals.js`**：更新 `MEDAL_DEFINITIONS` 对象，将原本 hardcoded 的 Emoji 替换为相对路径指向 `/assets/medals/`。
*   **`utils/store.js`**：确保 `getProfileViewModel` 正确组装包含图片路径的勋章数据模型。

## 成功指标
*   所有勋章均可由于水平滑动被流畅浏览。
*   勋章名称清晰（不再出现垂直换行或挤压）。
*   视觉风格与 “Hydration Narrative” 系统完美契合。

## 关键技术点
*   使用微信 `scroll-view` 组件。
*   利用 CSS `mask-image` 或 覆盖线性渐变 `::after` 伪元素实现侧边遮罩效果。
*   通过 `opacity` 和 `grayscale` 滤镜区分已解锁/未解锁状态。
