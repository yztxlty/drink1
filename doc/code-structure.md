# 喝水了吗 小程序代码结构说明

## 1. 项目概览

这是一个基于微信小程序原生目录结构实现的饮水记录应用，核心目标是围绕“记录喝水、查看进度、成长激励、资料与设置管理”提供本地优先的数据体验。

当前项目以 **页面层 + 全局状态层 + 领域工具层 + 公共组件层** 的方式组织代码：

- 页面层负责交互、展示和页面跳转
- `utils/store.js` 负责统一状态管理、持久化和视图模型组装
- `utils/*.js` 负责日期、饮水统计、勋章计算、存储适配等纯逻辑
- `components/` 放公共 UI 组件
- `scripts/` 放项目辅助校验脚本

整个项目暂未接入真实后端，数据主要保存在本地存储中。

## 2. 顶层目录结构

```text
drink1/
├── app.js                       # 小程序全局入口，初始化全局 store
├── app.json                     # 页面注册、窗口配置、TabBar 配置
├── app.wxss                     # 全局样式
├── project.config.json          # 微信开发者工具工程配置
├── project.private.config.json  # 本地私有工程配置
├── sitemap.json                 # 小程序站点地图配置
├── components/                  # 公共组件
│   ├── navigation-bar/          # 自定义导航栏组件
│   └── droplet/                 # 预留目录，当前无实际代码
├── pages/                       # 页面目录
│   ├── login/                   # 登录页
│   ├── home/                    # 首页/喝水记录主页面
│   ├── explore/                 # 森林成长页
│   ├── profile/                 # 个人中心与资料编辑
│   ├── settings/                # 设置页
│   ├── medals/                  # 勋章页
│   ├── privacy/                 # 隐私说明页
│   ├── about/                   # 关于页
│   └── index/                   # 占位页面，当前未在 app.json 注册
├── utils/                       # 业务工具与状态管理
│   ├── store.js                 # 核心状态仓库
│   ├── water.js                 # 饮水记录与统计计算
│   ├── medals.js                # 勋章定义与进度计算
│   ├── date.js                  # 日期格式与日期键工具
│   └── storage.js               # 本地存储适配层
├── scripts/
│   └── smoke-check.js           # 基础结构冒烟检查脚本
└── doc/
    └── code-structure.md        # 本文档
```

## 3. 全局入口与运行方式

### 3.1 `app.js`

`app.js` 是小程序运行入口，主要做三件事：

1. 在 `onLaunch` 中调用 `store.initStore()` 初始化本地状态
2. 将 `store` 挂到 `App.globalData.store`
3. 将当前用户资料和状态快照同步到 `globalData`

页面层基本都通过：

```js
const app = getApp();
this.store = app.globalData.store;
```

来访问统一状态能力。

### 3.2 `app.json`

`app.json` 定义了：

- 页面注册顺序
- 自定义导航样式 `navigationStyle: "custom"`
- 底部 TabBar

当前 TabBar 页面为：

- `pages/home/home`
- `pages/explore/explore`
- `pages/profile/profile`

## 4. 核心架构分层

### 4.1 页面层：`pages/`

页面层特点是“轻逻辑、重组装”：

- 从 `store` 中读取视图模型
- 把视图模型写入 `Page.data`
- 响应用户操作并调用 `store` 的写接口
- 负责页面跳转、Toast、震动等微信端交互

### 4.2 状态层：`utils/store.js`

`utils/store.js` 是项目最核心的文件，承担了类似轻量状态管理器的职责：

- 定义默认状态
- 负责状态归一化
- 负责写入/读取本地存储
- 负责根据原始状态生成页面视图模型
- 负责处理喝水记录、登录资料、设置、勋章等业务写操作

它对外提供两类主要接口：

- 读接口：`getHomeViewModel()`、`getForestViewModel()`、`getProfileViewModel()`、`getLoginViewModel()`、`getStore()`
- 写接口：`addWaterRecord()`、`updateSettings()`、`updateProfile()`、`setLoginProfile()`、`updateStore()`、`clearUserStore()`、`syncSessionHeartbeat()`

### 4.3 领域工具层：`utils/*.js`

这些文件负责把复杂逻辑从页面和状态层中拆出来：

- `date.js`：日期转换、`dateKey`、时间展示、日期差计算
- `water.js`：饮水记录归一化、日统计、连续达标、总量汇总
- `medals.js`：勋章清单和进度评估逻辑
- `storage.js`：对 `wx.getStorageSync / setStorageSync` 做一层封装，便于在非微信环境下回退到内存存储

### 4.4 组件层：`components/`

当前实际使用的公共组件主要是：

- `components/navigation-bar/`

该组件封装了：

- 安全区适配
- 返回按钮显示控制
- 标题区插槽
- 透明/动画显示逻辑

由于 `app.json` 使用了自定义导航栏风格，这个组件是页面统一头部体验的重要基础设施。

### 4.5 脚本层：`scripts/`

`scripts/smoke-check.js` 用于做基本结构校验，主要检查：

- `app.json` 注册页面对应的四件套文件是否齐全
- TabBar 页面是否已注册
- `pages/` 和 `components/` 中引用的本地资源是否存在

这类脚本适合在提交前或 CI 中做快速冒烟验证。

## 5. 状态模型设计

`utils/store.js` 中的状态以一个统一对象保存，核心字段如下：

```js
{
  version,
  profile,
  settings,
  session,
  hydration,
  achievements,
  meta
}
```

### 5.1 `profile`

用户资料与登录信息，包括：

- 本地默认资料
- 微信授权资料
- 手动修改后的资料
- 登录状态、登录方式、最近登录时间

### 5.2 `settings`

业务设置，包括：

- 每日饮水目标
- 快捷杯量
- 当前选中杯量
- 提醒开关
- 提醒间隔
- 起床/睡眠时间
- 隐私协议接受状态

### 5.3 `session`

会话信息，包括：

- 最近打开时间
- 最近同步时间
- 是否看过引导

### 5.4 `hydration`

饮水业务数据，包括：

- 原始饮水记录 `records`
- 按天聚合结果 `daily`
- 连续达标统计 `streak`
- 全局累计统计 `totals`

### 5.5 `achievements`

勋章/成就相关数据，包括：

- 各勋章进度
- 已解锁 ID 列表
- 新解锁列表
- 最近评估时间

## 6. 主要数据流

### 6.1 应用启动

```text
App.onLaunch
  -> store.initStore()
  -> ensureState()
  -> 从本地存储恢复状态
  -> normalizeState()
  -> decorateState()
  -> 写入 globalData.store / userInfo / appState
```

### 6.2 页面读取数据

```text
页面 onLoad/onShow
  -> 从 app.globalData 获取 store
  -> 调用 get*ViewModel()
  -> this.setData(viewModel)
```

例如：

- 首页读取 `getHomeViewModel()`
- 森林页读取 `getForestViewModel()`
- 我的页读取 `getProfileViewModel()`

### 6.3 记录一次喝水

```text
home.logWater()
  -> store.addWaterRecord(amount)
  -> updateState()
  -> hydration.records 新增记录
  -> buildDailySummaries() 重新计算统计
  -> evaluateMedals() 重新计算勋章
  -> 返回新的 home / forest / profile 视图模型
```

这说明页面不直接操作统计字段，而是由状态层统一重算，避免多个页面各自维护一套统计口径。

### 6.4 编辑资料/登录/设置

登录、资料编辑、设置页都不会直接修改底层存储，而是通过 `store` 暴露的方法间接写入：

- 登录：`setLoginProfile()` 或 `updateStore()`
- 编辑资料：`updateProfile()`
- 设置修改：`updateSettings()`
- 退出登录：`clearUserStore()` 或 `logout()`

## 7. 页面职责说明

### 7.1 `pages/login/`

登录入口页，负责：

- 获取隐私协议同意状态
- 触发 `wx.getUserProfile` 和 `wx.login`
- 将微信昵称、头像、登录 code 同步到本地状态
- 登录完成后跳转到首页

说明：该页面仍包含一层兼容式写法，使用了 `updateStore()` 这种聚合接口。

### 7.2 `pages/home/`

首页是主业务页面，负责：

- 展示今日饮水进度
- 展示快捷杯量
- 展示最近记录
- 触发“记录一杯水”
- 展示连续达标、森林等级、勋章数等概览指标

这是与 `store` 配合最紧密的页面之一。

### 7.3 `pages/explore/`

森林成长页，负责展示：

- 植物成长状态
- 氧气值
- 勋章收集进度
- 今日剩余饮水量

它本质上是 `getForestViewModel()` 的展示页。

### 7.4 `pages/profile/`

个人中心页，负责：

- 展示个人资料
- 展示勋章摘要和统计
- 跳转到设置、勋章、隐私、关于
- 执行本地同步和退出登录

### 7.5 `pages/profile/edit/`

资料编辑页，负责：

- 修改昵称、头像、签名
- 支持恢复微信资料
- 兼容“登录后补充资料”场景

这个页面较完整地体现了“微信资料 + 手动资料”双来源模型。

### 7.6 `pages/settings/`

设置页负责：

- 修改每日目标
- 修改快捷杯量
- 控制提醒选项

说明：当前页面字段命名与 `store` 中的设置模型存在一层历史差异，详见后文“当前结构注意点”。

### 7.7 `pages/medals/`

勋章页负责：

- 勋章分类展示
- 已解锁/待解锁筛选
- 进度文案展示

说明：页面本地定义了一份勋章目录，和 `utils/medals.js` 中的正式勋章定义并不完全一致。

### 7.8 `pages/privacy/`

隐私说明页，负责：

- 展示隐私说明内容
- 切换隐私协议同意状态
- 复制摘要文本

### 7.9 `pages/about/`

关于页，负责：

- 展示应用名称、版本、联系信息
- 跳转隐私页

### 7.10 `pages/index/`

当前是空白占位页，未在 `app.json` 中注册，不参与现有运行流程。

## 8. 公共组件说明

### 8.1 `components/navigation-bar/`

这是一个通用导航栏组件，支持：

- 自定义标题
- 左侧返回按钮
- 插槽扩展左中右区域
- iOS / Android / 开发者工具环境适配
- 显示隐藏动画

如果后续新增页面，推荐继续复用这个组件，以保持头部交互和安全区表现一致。

## 9. 工具模块说明

### 9.1 `utils/date.js`

用于处理所有时间格式的基础工具，避免页面直接拼接日期字符串。

### 9.2 `utils/water.js`

饮水统计的核心纯函数模块，主要负责：

- 标准化单条饮水记录
- 聚合每日统计
- 计算总量、早晨记录数、夜间记录数
- 计算连续达标天数
- 返回饮水质量标签

### 9.3 `utils/medals.js`

定义正式勋章目录 `MEDAL_DEFINITIONS`，并通过 `evaluateMedals()` 基于业务上下文计算：

- 当前进度
- 是否解锁
- 解锁时间
- 新解锁列表

### 9.4 `utils/storage.js`

屏蔽微信环境和普通 JS 环境之间的存储差异，适合：

- 在小程序中走 `wx.getStorageSync`
- 在脚本或测试环境中走内存存储

### 9.5 `utils/store.js`

除状态管理外，还承担“页面视图模型转换器”的角色，是当前项目的业务中台。

## 10. 当前结构注意点

从现有代码来看，主结构已经比较明确，但仍有几处值得在继续开发时注意：

### 10.1 设置页与状态层字段存在历史命名差异

页面 `pages/settings/settings.js` 使用的字段偏向旧命名：

- `dailyGoal`
- `reminders`

而 `utils/store.js` 当前正式字段是：

- `dailyTarget`
- `reminderEnabled`
- `reminderIntervalMinutes`
- `wakeupTime`
- `sleepTime`

这说明设置页和状态层之间仍存在兼容层，后续如果重构，建议统一为同一套字段命名。

### 10.2 勋章页目录与正式勋章定义不完全一致

`pages/medals/medals.js` 中的 `MEDAL_CATALOG` 与 `utils/medals.js` 中的 `MEDAL_DEFINITIONS` 并非一一对应，例如：

- 页面使用 `three_day`、`seven_day`、`monthly_goal`
- 状态层使用 `streak_3`、`streak_7`、`goal_once`、`litre_50` 等

因此当前勋章页更像“展示层草稿”，而真正的勋章计算以 `utils/medals.js` 为准。

### 10.3 `pages/index/` 当前未接入主流程

该目录存在，但没有在 `app.json` 中注册，可以视为预留页面或历史残留。

### 10.4 `components/droplet/` 当前为空目录

这通常表示后续可能计划增加动画或视觉组件，但目前没有实际接入代码。

## 11. 推荐的阅读顺序

如果新同学要快速理解这个项目，建议按下面顺序阅读：

1. `app.json`
2. `app.js`
3. `utils/store.js`
4. `utils/water.js`
5. `utils/medals.js`
6. `pages/home/home.js`
7. `pages/profile/profile.js`
8. `pages/profile/edit.js`
9. `pages/settings/settings.js`

这样可以先理解运行入口，再理解状态，再理解核心页面。

## 12. 总结

这个项目目前采用的是一种适合中小型微信小程序的组织方式：

- 页面目录清晰
- 状态管理集中
- 统计逻辑下沉到工具模块
- UI 组件复用点明确

其中最重要的中心文件是 `utils/store.js`，它连接了：

- 本地存储
- 领域计算
- 页面视图模型
- 用户操作写入

如果后续继续演进，比较合适的方向是：

- 统一设置页与状态层字段
- 统一勋章目录来源
- 为空目录和未注册页面做清理
- 补充脚本化检查或测试用例
