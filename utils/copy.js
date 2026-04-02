const { SHARE_FAB_COPY } = require('./share/share-copy');
const APP_NAME = '喝水了吗';

const COPY = {
  appName: APP_NAME,
  home: {
    navTitle: '今日补水',
    statusTitle: '今日补水',
    actionLabel: '记录补水',
    recordTitle: '今日补水记录'
  },
  shareFab: SHARE_FAB_COPY,
  profile: {
    navTitle: '我的补水档案',
    statusTitle: '我的补水档案',
    actionLabel: '数据本地保存',
    menuItems: [
      { key: 'settings', title: '补水设置', subtitle: '每日目标、水杯容量与提醒节奏' },
      { key: 'medals', title: '补水勋章', subtitle: '查看系统勋章与解锁详情', badge: true },
      { key: 'privacy', title: '补水隐私条款', subtitle: '了解补水数据如何保存' },
      { key: 'about', title: '关于补水', subtitle: '补水版本信息与反馈入口' }
    ],
    syncToast: '已保存到本地'
  },
  forest: {
    navTitle: '补水森林',
    statusTitle: '补水森林',
    actionLabel: '去补水',
    summaryRulesTitle: '计算规则',
    summaryRulesTrigger: '计算规则',
    summaryRules: [
      '森林氧气浓度会根据今日补水达成情况动态计算。',
      '融合进度会按当前水滴融合状态实时更新，初始水滴越多被融合掉，进度越高。',
      '治愈水滴按今日补水量换算，每记录 50ml 补水生成 1 颗初始水滴。'
    ]
  },
  forestWaterRhythm: {
    navTitle: '森林水韵',
    statusTitle: '森林水韵',
    heroKicker: '互动小游戏',
    heroTitle: '跟着节奏唤醒森林的呼吸',
    heroDesc: '先把入口搭起来，后续可以接入节奏点击、连击奖励和解压动画。',
    stageTitle: '节奏舞台',
    stageHint: '当前为骨架模式，已预留互动位',
    gameTitle: '森林水韵·噗噗乐',
    gameSubtitle: '拖动晶透水滴，让它们在玻璃容器里轻轻融合',
    energyLabel: '今日已收集 {{intake}}ml 能量水滴',
    emptyHint: '多喝水才能产生治愈水滴哦',
    rulesTitle: '玩法说明',
    ruleItems: [
      { key: 'tempo', title: '跟随节奏', subtitle: '先看清节拍，再开始点击' },
      { key: 'combo', title: '积累连击', subtitle: '后续会围绕连击和奖励展开' },
      { key: 'feedback', title: '解锁反馈', subtitle: '完成目标后再展示成长结果' }
    ],
    actionLabel: '开始体验',
    resetLabel: '重置预览',
    backLabel: '返回上一页'
  },
  login: {
    navTitle: '补水登录',
    eyebrow: 'Hydration Oasis',
    heroTitle: '欢迎来到喝水了吗',
    heroDesc: '把每一次补水都记录成可见的进步，让你的补水档案随着习惯一起生长。',
    panelTitle: '登录授权',
    panelDesc: '首次使用时，点击登录后先微信授权。',
    actionLabel: '微信同意并登录',
    avatarTip: '点击选择微信头像',
    nicknamePlaceholder: '请输入昵称',
    consentTitle: '提示',
    consentRequired: '请先阅读并同意隐私协议',
    homeRedirectFailed: '进入首页失败，请重试',
    profileRequired: '请完善头像和昵称',
    authorizationPageFailed: '进入授权页失败，请重试',
    privacyLabel: '登录前请确认已阅读并同意',
    privacyLink: '《用户协议》',
    privacyJoiner: '与',
    policyLink: '《隐私政策》',
    footerChips: ['补水陪伴成长', '数据本地留存', '轻量提醒打卡'],
    loginLoading: '补水登录中',
    loginUnsupported: '当前环境不支持补水登录',
    loginFailed: '补水登录失败，请重试',
    authFailed: '未完成补水授权',
    profileDesc: '用于展示你的补水档案'
  },
  loginAuth: {
    navTitle: '微信资料授权',
    heroKicker: '微信资料授权',
    heroTitle: '完成头像与昵称授权后即可登录',
    heroDesc: '为了展示你的补水档案，首次登录需要补充一次微信头像和昵称授权。',
    panelTitle: '微信资料',
    panelDesc: '授权完成后会同步到首页与我的页面展示。',
    actionLabel: '完成授权并登录',
    avatarTip: '点击选择微信头像',
    nicknamePlaceholder: '请输入昵称',
    profileRequired: '请完善头像和昵称',
    homeRedirectFailed: '进入首页失败，请重试'
  },
  settings: {
    navTitle: '补水设置',
    heroKicker: '补水设置',
    heroTitle: '把目标和提醒调成更适合你的补水节奏',
    dailyTargetTitle: '每日补水目标',
    reminderTitle: '补水提醒时间',
    quickTitle: '快捷容量管理',
    sharedHint: '这里调整的快捷容量会同步到首页快速记录。',
    quickHint: '点选可切换默认容量，点击修改图标进入删除模式。',
    quickDeleteHint: '删除模式已开启，点击右上角删除图标即可移除容量。',
    quickManageHint: '点选可切换默认容量，点击修改图标进入删除模式。',
    quickDeleteModeTip: '点击空白处恢复到正常显示状态。',
    quickAddLabel: '添加容量',
    quickAddDialogTitle: '添加快捷容量',
    quickAddDialogHint: '以 50ml 为单位设置新的快捷容量',
    quickAddDialogTip: '保存后会立即出现在列表中，并设为当前默认容量。',
    quickAddConfirm: '确定',
    exportHint: '同步补水资料会导出标准 JSON 到本机存储。',
    dataManagementTitle: '数据管理',
    dataManagementSubtitle: '删除当天数据或清空历史业务数据',
    dataManagementAction: '进入',
    saveLabel: '保存补水设置',
    savedToast: '补水设置已保存',
    reminderItems: [
      { key: 'morning', label: '早晨补水提醒', hint: '08:30' },
      { key: 'noon', label: '午间补水提醒', hint: '12:30' },
      { key: 'evening', label: '傍晚补水提醒', hint: '18:30' },
      { key: 'night', label: '睡前补水提醒', hint: '21:30' }
    ]
  },
  dataManagement: {
    navTitle: '数据管理',
    heroKicker: '数据管理',
    heroTitle: '仅清空业务数据，不影响账号资料与补水设置',
    warning: '请慎重操作，删除后无法找回',
    deleteTodayTitle: '删除当天数据',
    deleteTodaySubtitle: '仅删除今天的补水记录与联动统计',
    clearHistoryTitle: '清空历史数据',
    clearHistorySubtitle: '仅清空业务数据：补水记录与勋章进度',
    todayStatsLabel: '今日记录',
    allStatsLabel: '历史记录',
    deleteTodayAction: '删除当天数据',
    clearHistoryAction: '清空历史数据',
    deleteTodayConfirmTitle: '删除当天数据',
    deleteTodayConfirmContent: '请慎重操作，删除后无法找回。\n\n确定删除今天的补水数据吗？',
    clearHistoryConfirmTitle: '清空历史数据',
    clearHistoryConfirmContent: '请慎重操作，删除后无法找回。\n\n确定清空全部历史业务数据吗？',
    secondConfirmTitle: '最终确认',
    secondConfirmContent: '再次确认：该操作无法撤销。',
    deleteTodaySuccess: '已删除当天数据',
    clearHistorySuccess: '已清空历史业务数据'
  },
  profileEdit: {
    navTitle: '编辑补水资料',
    heroKicker: '补水档案',
    heroTitleFromLogin: '开发者工具不显示系统授权窗，请先填写补水资料',
    heroTitleNormal: '编辑后会优先展示你自己的补水资料',
    fieldLabel: '补水签名',
    fieldPlaceholder: '写一句属于你的补水签名',
    restoreLabel: '恢复微信补水资料',
    saveLabel: '保存补水资料',
    savedToast: '补水资料已保存',
    restoreToast: '已恢复微信补水资料',
    saveFailed: '补水资料保存失败，请重试',
    saveFailedShort: '补水资料保存失败'
  },
  privacy: {
    navTitle: '补水隐私条款',
    heroKicker: '补水隐私条款',
    heroTitle: '本地优先保存补水数据，减少不必要的数据暴露',
    readChip: '已阅读补水说明',
    notReadChip: '未确认',
    ackTitle: '我已阅读并理解以上补水说明',
    ackSub: '确认后会在本地保存状态',
    copySummary: '《喝水了吗》隐私说明：本地优先存储补水与设置数据。',
    sections: [
      {
        title: '我们保存什么',
        body: '仅在本地保存补水记录、补水设置、勋章状态和登录态，不主动上传到外部服务。'
      },
      {
        title: '为什么要保存',
        body: '为了让你在正常使用周期内持续查看历史数据和目标进度。'
      },
      {
        title: '你可以做什么',
        body: '随时在本机删除缓存或退出登录。若后续接入云同步，会单独补充同步授权。'
      }
    ]
  },
  about: {
    navTitle: '关于补水',
    heroKicker: '关于补水',
    appName: APP_NAME,
    productTitle: '补水产品说明',
    productBody: '我们把补水记录、目标设置和成长勋章放在本地微信 storage 中，保持使用体验连续、轻量，并方便后续二次开发。',
    feedbackTitle: '联系与反馈',
    feedbackBody: '如果你发现补水页面还原或交互有问题，可以直接复制邮箱反馈。',
    copyLabel: '复制补水反馈邮箱',
    privacyLabel: '查看补水隐私条款',
    copySuccess: '已复制补水邮箱'
  },
  medals: {
    navTitle: '补水勋章',
    heroKicker: '补水勋章',
    heroTitle: '收集补水习惯的成长记录'
  }
};

module.exports = {
  APP_NAME,
  COPY
};
