// pages/profile/profile.js
const app = getApp()
const { COPY } = require('../../utils/copy')

const MENU_ROUTES = {
  settings: '/pages/settings/settings',
  medals: '/pages/medals/medals',
  privacy: '/pages/privacy/privacy',
  about: '/pages/about/about'
}

Page({
  data: {
    summary: {
      streakDays: 0,
      unlockedMedals: 0,
      totalLiters: '0.0'
    },
    badges: [],
    profile: {
      nickName: '补水计划用户',
      avatarUrl: '',
      isLoggedIn: false,
      motto: '用每一次补水滋养今天'
    },
    profileInitial: '补',
    statusBar: {
      tone: 'profile',
      title: COPY.profile.statusTitle,
      subtitle: '资料与进度保持同步',
      metricValue: '0',
      metricLabel: '连续天数',
      actionLabel: COPY.profile.actionLabel
    },
    settings: {
      dailyTarget: 2000,
      selectedCupAmount: 250
    },
    menuItems: COPY.profile.menuItems
  },

  onLoad() {
    this.store = app.globalData.store
    this.refreshSummary()
  },

  onShow() {
    this.refreshSummary()
  },

  goEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit'
    })
  },

  refreshSummary() {
    const viewModel = this.store ? this.store.getProfileViewModel() : {
      badges: [],
      profile: {},
      settings: {},
      stats: {
        streakDays: 0,
        unlockedMedalCount: 0,
        totalLitres: '0.0'
      },
      statusBar: {
        tone: 'profile',
        title: COPY.profile.statusTitle,
        subtitle: '资料与进度保持同步',
        metricValue: '0',
        metricLabel: '连续天数',
        actionLabel: COPY.profile.actionLabel
      }
    }
    const profile = viewModel.profile || {}
    this.setData({
      badges: viewModel.badges,
      profile,
      profileInitial: profile.nickName ? profile.nickName.slice(0, 1) : '补',
      settings: viewModel.settings,
      statusBar: viewModel.statusBar,
      summary: {
        streakDays: viewModel.stats.streakDays,
        unlockedMedals: viewModel.stats.unlockedMedalCount,
        totalLiters: viewModel.stats.totalLitres
      }
    })
  },

  navigateToMenu(e) {
    const { key } = e.currentTarget.dataset
    const url = MENU_ROUTES[key]
    if (!url) {
      return
    }

    wx.navigateTo({ url })
  },

  syncData() {
    if (this.store) {
      this.store.syncSessionHeartbeat()
    }
    this.refreshSummary()
    wx.showToast({
      title: COPY.profile.syncToast,
      icon: 'success'
    })
  },

  logout() {
    // 退出时只清理登录态，避免误伤本地补水记录和勋章进度。
    if (this.store) {
      this.store.clearUserStore()
    }
    if (app.globalData) {
      app.globalData.userInfo = this.store ? this.store.getProfileViewModel().profile : null
      app.globalData.appState = this.store ? this.store.getStore() : null
    }
    wx.removeStorageSync('drink_auth_state')
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }
})
