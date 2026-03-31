const APP_NAME = '喝水了吗';

const COPY = {
  appName: APP_NAME,
  home: {
    navTitle: '今日补水',
    statusTitle: '今日补水',
    actionLabel: '记录补水',
    recordTitle: '今日补水记录'
  },
  profile: {
    navTitle: '我的补水档案',
    statusTitle: '我的补水档案',
    actionLabel: '同步补水资料',
    menuItems: [
      { key: 'settings', title: '补水设置', subtitle: '每日目标、水杯容量与提醒节奏' },
      { key: 'medals', title: '补水勋章', subtitle: '查看解锁进度', badge: true },
      { key: 'privacy', title: '补水隐私条款', subtitle: '了解补水数据如何保存' },
      { key: 'about', title: '关于补水', subtitle: '补水版本信息与反馈入口' }
    ],
    syncToast: '已同步补水资料'
  },
  forest: {
    navTitle: '补水森林',
    statusTitle: '补水森林',
    actionLabel: '去补水'
  },
  login: {
    navTitle: '补水登录',
    eyebrow: 'Hydration Oasis',
    heroTitle: '欢迎来到喝水了吗',
    heroDesc: '把每一次补水都记录成可见的进步，让你的补水档案随着习惯一起生长。',
    panelTitle: '登录授权',
    panelDesc: '授权后可同步补水记录、目标设置与勋章进度。',
    actionLabel: '微信同意并登录',
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
  settings: {
    navTitle: '补水设置',
    heroKicker: '补水设置',
    heroTitle: '把目标和提醒调成更适合你的补水节奏',
    dailyTargetTitle: '每日补水目标',
    reminderTitle: '补水提醒时间',
    quickTitle: '快捷补水容量',
    saveLabel: '保存补水设置',
    savedToast: '补水设置已保存',
    reminderItems: [
      { key: 'morning', label: '早晨补水提醒', hint: '08:30' },
      { key: 'noon', label: '午间补水提醒', hint: '12:30' },
      { key: 'evening', label: '傍晚补水提醒', hint: '18:30' },
      { key: 'night', label: '睡前补水提醒', hint: '21:30' }
    ]
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
