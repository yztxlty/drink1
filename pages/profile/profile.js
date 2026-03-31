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
    analysis: {
      totalLitres: '0.0',
      averageDaily: '0.0L',
      averageCup: '0 ml',
      recentCompletion: '0/7',
      recentTotal: '0.0L',
      dominantPeriod: '全天',
      targetMl: 2000,
      chart: {
        targetMl: 2000,
        periods: {
          week: [],
          month: [],
          year: []
        }
      },
      summary: '补水分析会在这里显示。',
      suggestion: '开始记录后，这里会给出更有针对性的建议。'
    },
    analysisPeriod: 'week',
    analysisPeriodTabs: [
      { key: 'week', label: '周' },
      { key: 'month', label: '月' },
      { key: 'year', label: '年' }
    ],
    analysisChart: {
      points: [],
      targetMl: 2000,
      targetPercent: 0,
      maxAmount: 2000,
      lineSegments: [],
      linePoints: []
    },
    badges: [],
    profile: {
      nickName: '补水计划用户',
      avatarUrl: '',
      isLoggedIn: false,
      motto: '用每一次补水滋养今天'
    },
    profileInitial: '补',
    exportResult: null,
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

  goToMedals() {
    wx.navigateTo({
      url: '/pages/medals/medals'
    })
  },

  switchAnalysisPeriod(e) {
    const { key } = e.currentTarget.dataset
    if (!key || key === this.data.analysisPeriod) {
      return
    }

    this.setData({
      analysisPeriod: key,
      analysisChart: this.buildAnalysisChart(this.data.analysis, key)
    })
  },

  buildAnalysisChart(analysis, period) {
    const safeAnalysis = analysis || {}
    const chart = safeAnalysis.chart || {}
    const targetMl = Number(chart.targetMl || safeAnalysis.targetMl || this.data.settings.dailyTarget || 2000)
    const periods = chart.periods || {}
    const rawPoints = Array.isArray(periods[period]) ? periods[period] : []
    const maxAmount = Math.max(
      targetMl,
      ...rawPoints.map((item) => Number(item.amount) || 0),
      1
    )
    const points = rawPoints.map((item, index) => {
      const amount = Math.max(0, Number(item.amount) || 0)
      const percent = Math.min((amount / maxAmount) * 100, 100)
      return {
        key: `${period}_${index}`,
        ...item,
        amount,
        barPercent: percent.toFixed(2),
        amountLabel: `${amount}ml`,
        completionPercentLabel: `${Math.round((Number(item.completionRate) || 0) * 100)}%`
      }
    })

    const linePoints = points.map((item, index) => {
      const x = points.length <= 1 ? 50 : (index * 100) / (points.length - 1)
      return {
        style: `left: calc(${x}% - 7rpx); bottom: calc(${item.barPercent}% - 7rpx);`
      }
    })

    const lineSegments = []
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const next = points[index + 1]
      const x1 = points.length <= 1 ? 50 : (index * 100) / (points.length - 1)
      const x2 = points.length <= 1 ? 50 : ((index + 1) * 100) / (points.length - 1)
      const y1 = Number(current.barPercent)
      const y2 = Number(next.barPercent)
      const dx = x2 - x1
      const dy = y2 - y1
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      lineSegments.push({
        style: `left: ${x1}%; bottom: ${y1}%; width: ${length}%; transform: rotate(${angle}deg);`
      })
    }

    return {
      points,
      targetMl,
      maxAmount,
      targetPercent: Math.min(((targetMl / maxAmount) * 100), 100).toFixed(2),
      linePoints,
      lineSegments
    }
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
      analysis: {
        totalLitres: '0.0',
        averageDaily: '0.0L',
        averageCup: '0 ml',
        recentCompletion: '0/7',
        recentTotal: '0.0L',
        dominantPeriod: '全天',
        targetMl: 2000,
        chart: {
          targetMl: 2000,
          periods: {
            week: [],
            month: [],
            year: []
          }
        },
        summary: '补水分析会在这里显示。',
        suggestion: '开始记录后，这里会给出更有针对性的建议。'
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
    const profileName = profile.displayNickName || profile.nickName || '补水计划用户'
    this.setData({
      badges: viewModel.badges,
      profile,
      profileInitial: profileName ? profileName.slice(0, 1) : '补',
      analysis: viewModel.analysis || this.data.analysis,
      analysisChart: this.buildAnalysisChart(viewModel.analysis || this.data.analysis, this.data.analysisPeriod),
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
    if (!this.store) {
      wx.showToast({
        title: '当前无法导出',
        icon: 'none'
      })
      return
    }

    this.store.syncSessionHeartbeat()

    const exportData = this.store.exportHydrationData()
    const filePath = `${wx.env.USER_DATA_PATH}/${exportData.filename}`

    try {
      const fs = wx.getFileSystemManager()
      fs.writeFileSync(filePath, JSON.stringify(exportData.payload, null, 2), 'utf8')
      this.setData({
        exportResult: {
          ...exportData,
          path: filePath
        }
      })
      this.refreshSummary()
      wx.showToast({
        title: COPY.profile.syncToast,
        icon: 'success'
      })
      wx.showModal({
        title: '导出完成',
        content: `已保存为标准 JSON。\n\n文件：${exportData.filename}\n路径：${filePath}`,
        showCancel: false
      })
    } catch (error) {
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    }
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '仅退出当前账号，不会删除本地补水记录和勋章成果。',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          return
        }

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
  }
})
