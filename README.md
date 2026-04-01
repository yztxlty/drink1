# 喝水了吗 / Drink1

> A polished, local-first hydration tracker for the WeChat Mini Program ecosystem.
>
> 一款本地优先的微信小程序补水记录工具，围绕「记录、提醒、成长、分享」构建完整的习惯闭环。

## Project Vision / 产品定位

**喝水了吗** is designed for users who want hydration tracking to feel lightweight, continuous, and rewarding.

**喝水了吗** 面向的是希望把补水习惯真正坚持下去的人：它把每一次饮水记录、每日目标、提醒节奏、连续打卡和成长勋章整合在一起，让“喝水”不再只是一个动作，而是一条可见、可回顾、可分享的习惯路径。

## Why It Stands Out / 项目亮点

- **Local-first by design / 本地优先**  
  Core hydration data, quick amounts, medals, settings, and profile state are stored locally in WeChat storage for a fast, private, and resilient experience.
- **Habit loop engineered into the UX / 习惯闭环清晰**  
  The app combines quick logging, reminder scheduling, streak tracking, and medal progression to keep feedback immediate and motivating.
- **A focused mini-program architecture / 清晰的微信小程序架构**  
  Pages handle user journeys, components encapsulate reusable interactions, and `utils/store.js` centralizes hydration state and derived analytics.
- **Share-ready interactions / 分享与传播就绪**  
  Built-in share logic, floating share entry, and contact paths make the product easy to distribute and easy to revisit.
- **Privacy-conscious product language / 隐私友好的产品表达**  
  The copy and data flow consistently emphasize local persistence and minimal exposure.

## Screenshots / 项目截图

<table>
  <tr>
    <td align="center">
      <img src="docs/readme/login.jpg" alt="Login screen / 登录页" width="230" />
      <br /><b>登录页 / Login</b>
      <br />授权入口与产品主视觉
    </td>
    <td align="center">
      <img src="docs/readme/home.jpg" alt="Home screen / 首页" width="230" />
      <br /><b>首页 / Home</b>
      <br />补水记录、快捷容量与今日进度
    </td>
    <td align="center">
      <img src="docs/readme/forest.jpg" alt="Forest screen / 森林页" width="230" />
      <br /><b>森林页 / Forest</b>
      <br />成长氛围、守护进度与分享入口
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/readme/profile.jpg" alt="Profile screen / 个人中心" width="230" />
      <br /><b>个人中心 / Profile</b>
      <br />统计分析、勋章展示与资料管理
    </td>
    <td align="center">
      <img src="docs/readme/settings.jpg" alt="Settings screen / 设置页" width="230" />
      <br /><b>设置页 / Settings</b>
      <br />目标、提醒和快捷容量统一配置
    </td>
    <td align="center">
      <img src="docs/readme/settings-sheet.jpg" alt="Settings modal / 设置弹层" width="230" />
      <br /><b>设置弹层 / Settings Sheet</b>
      <br />保留沉浸式交互和安全确认
    </td>
  </tr>
</table>

## Runtime Experience / 运行效果

<table>
  <tr>
    <td align="center">
      <img src="docs/readme/contact-dialog.jpg" alt="Contact dialog / 联系弹窗" width="230" />
      <br /><b>联系弹窗 / Contact Dialog</b>
      <br />扫码加入社群或联系作者
    </td>
    <td align="center">
      <img src="docs/readme/settings-sheet.jpg" alt="Settings interaction / 设置交互" width="230" />
      <br /><b>交互状态 / Interaction State</b>
      <br />验证设置流和保存动作的完整性
    </td>
  </tr>
</table>

## Architecture / 代码架构

The repository follows a clean mini-program split:

本仓库采用清晰的微信小程序分层方式：

- `pages/` — user-facing journeys such as home, forest, profile, settings, privacy, and about
- `components/` — reusable interaction modules like the share FAB, navigation bar, dialogs, and quick-amount manager
- `custom-tab-bar/` — custom bottom navigation for the main app shell
- `utils/store.js` — hydration state, derived metrics, medal evaluation, and local persistence
- `utils/copy.js` — centralized product copy and screen text
- `utils/medals.js`, `utils/water.js`, `utils/home.js` — domain logic for medals, hydration math, and home view models
- `scripts/` — regression checks and smoke tests used during development

## Key Capabilities / 核心能力

- Daily hydration target tracking / 每日补水目标跟踪
- Quick amount presets and custom amount management / 快捷容量与自定义容量管理
- Reminder scheduling / 补水提醒节奏
- Streak and medal progression / 连续天数与勋章成长
- Local data management and export support / 本地数据管理与导出支持
- Privacy policy and about pages / 隐私条款与关于页
- Floating share entry and contact flow / 浮动分享入口与联系流程

## Quick Start / 快速开始

1. Open the repository in WeChat DevTools.
2. Compile the project with the mini-program runtime.
3. If needed, fill in your own `appid` for real platform capabilities such as login, sharing, and device-specific behaviors.

The project is intentionally lightweight:

项目本身保持轻量，不依赖额外前端构建链，适合直接在微信开发者工具中打开、调试和迭代。

## Data & Privacy / 数据与隐私

- Hydration records, settings, medals, and profile state are stored locally by default.
- The repository currently does not include a backend service.
- If cloud sync or account services are added later, the privacy text and product copy should be updated together.

## Directory Snapshot / 目录速览

```text
.
├── app.js / app.json / app.wxss
├── components/
├── custom-tab-bar/
├── docs/readme/
├── pages/
├── scripts/
└── utils/
```

## Notes for Contributors / 开发说明

- Prefer updating shared copy in `utils/copy.js` before duplicating text in page files.
- Keep reusable interaction logic inside `components/` when multiple pages need it.
- Use `utils/store.js` as the source of truth for hydration-related state and derived summaries.
- Store new README assets under `docs/readme/` so they can be referenced with stable relative paths.

