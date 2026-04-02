// pages/profile/profile.js
const app = getApp()
const { COPY } = require('../../utils/copy')
const SHARE_PATH = '/pages/home/home'

const MENU_ROUTES = {
  settings: '/pages/settings/settings',
  medals: '/pages/medals/medals',
  privacy: '/pages/privacy/privacy',
  about: '/pages/about/about'
}
const CONTACT_MENU_ITEM = {
  key: 'contact',
  title: '加入 Drink1 社群',
  subtitle: '扫码添加作者微信，一起把喝水习惯坚持下去'
}
const LINE_Y_TO_X_RATIO = 0.42

function buildShareTitle(intake, streakDays) {
  const safeIntake = Math.max(0, Math.round(Number(intake) || 0))
  const safeStreakDays = Math.max(0, Math.round(Number(streakDays) || 0))
  return `我今天已喝水 ${safeIntake}ml，已连续坚持 ${safeStreakDays} 天，快来加入我吧！`
}

Page({
  data: {
    copy: COPY.profile,
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
    shareProgressPercent: 0,
    shareStreakDays: 0,
    badges: [],
    contactDialogVisible: false,
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
    menuItems: [...COPY.profile.menuItems, CONTACT_MENU_ITEM]
  },

  onLoad() {
    this.store = app.globalData.store
    this.refreshSummary()
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    if (tabBar && typeof tabBar.setData === 'function') {
      tabBar.setData({ selected: 2 });
    }
    this.refreshSummary()
  },

  onShareAppMessage() {
    const shareFab = typeof this.selectComponent === 'function'
      ? this.selectComponent('#shareFab')
      : null

    if (shareFab && typeof shareFab.getShareContent === 'function') {
      return shareFab.getShareContent()
    }

    const homeViewModel = this.store && typeof this.store.getHomeViewModel === 'function'
      ? this.store.getHomeViewModel()
      : {}
    const profileViewModel = this.store && typeof this.store.getProfileViewModel === 'function'
      ? this.store.getProfileViewModel()
      : {}
    const intake = Number(homeViewModel.intake) || 0
    const streakDays = Number(profileViewModel.stats && profileViewModel.stats.streakDays) || Number(this.data.summary.streakDays) || 0

    return {
      title: buildShareTitle(intake, streakDays),
      path: SHARE_PATH
    }
  },

  onShareTimeline() {
    const shareFab = typeof this.selectComponent === 'function'
      ? this.selectComponent('#shareFab')
      : null

    if (shareFab && typeof shareFab.getShareContent === 'function') {
      const shareContent = shareFab.getShareContent()
      return {
        title: shareContent.title,
        query: 'from=timeline'
      }
    }

    const homeViewModel = this.store && typeof this.store.getHomeViewModel === 'function'
      ? this.store.getHomeViewModel()
      : {}
    const profileViewModel = this.store && typeof this.store.getProfileViewModel === 'function'
      ? this.store.getProfileViewModel()
      : {}
    const intake = Number(homeViewModel.intake) || 0
    const streakDays = Number(profileViewModel.stats && profileViewModel.stats.streakDays) || Number(this.data.summary.streakDays) || 0

    return {
      title: buildShareTitle(intake, streakDays),
      query: 'from=timeline'
    }
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
      const centerX = rawPoints.length <= 1 ? 50 : ((index + 0.5) * 100) / rawPoints.length
      return {
        key: `${period}_${index}`,
        ...item,
        amount,
        barPercent: Number(percent.toFixed(2)),
        centerX: Number(centerX.toFixed(2)),
        amountLabel: `${amount}ml`,
        completionPercentLabel: `${Math.round((Number(item.completionRate) || 0) * 100)}%`
      }
    })

    const linePoints = points.map((item, index) => {
      const x = Number(item.centerX || 50)
      const y = Number(item.barPercent)
      return {
        style: `left: calc(${x}% - 8rpx); bottom: calc(${y}% - 8rpx);`
      }
    })

    const lineSegments = []
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index]
      const next = points[index + 1]
      const x1 = Number(current.centerX || 50)
      const x2 = Number(next.centerX || 50)
      const y1 = Number(current.barPercent)
      const y2 = Number(next.barPercent)
      const dx = x2 - x1
      const dy = y2 - y1
      const convertedDy = dy * LINE_Y_TO_X_RATIO
      const length = Math.sqrt(dx * dx + convertedDy * convertedDy)
      const angle = (Math.atan2(convertedDy, dx) * 180) / Math.PI
      lineSegments.push({
        style: `left: ${x1}%; bottom: ${y1}%; width: ${length}%; transform: rotate(${angle}deg);`
      })
    }

    const targetPercent = Number(Math.min(((targetMl / maxAmount) * 100), 100).toFixed(2))
    const lineSvg = this.buildAnalysisLineSvg(points, targetMl, targetPercent)
    const lineSvgStyle = `background-image: url("${lineSvg}");`

    return {
      points,
      targetMl,
      maxAmount,
      targetPercent,
      lineSvg,
      lineSvgStyle,
      linePoints,
      lineSegments
    }
  },

  buildAnalysisLineSvg(points, targetMl, targetPercent) {
    const safePoints = Array.isArray(points) ? points : []
    const safeTargetMl = Number.isFinite(Number(targetMl)) ? Number(targetMl) : 0
    const safeTargetPercent = Number.isFinite(Number(targetPercent)) ? Number(targetPercent) : 0
    const targetY = Math.max(0, Math.min(100, 100 - safeTargetPercent))
    const targetLabelY = Math.max(4.5, targetY - 1.8)
    const pointCoords = safePoints
      .map((item) => {
        const x = Number(item.centerX || 50)
        const y = Math.max(0, Math.min(100, 100 - Number(item.barPercent || 0)))
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')

    const pointMarks = safePoints
      .map((item) => {
        const x = Number(item.centerX || 50)
        const y = Math.max(0, Math.min(100, 100 - Number(item.barPercent || 0)))
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.0" fill="#ffffff" stroke="rgba(0, 95, 155, 0.94)" stroke-width="0.6" />`
      })
      .join('')

    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">',
      `<line x1="0" y1="${targetY.toFixed(2)}" x2="100" y2="${targetY.toFixed(2)}" stroke="rgba(0, 95, 155, 0.72)" stroke-width="0.55" stroke-dasharray="2.4 2.4" stroke-linecap="butt" />`,
      `<text x="99.2" y="${targetLabelY.toFixed(2)}" fill="rgba(0, 95, 155, 0.92)" font-size="4.5" text-anchor="end" font-weight="700">${safeTargetMl}ml</text>`,
      pointCoords ? `<polyline points="${pointCoords}" fill="none" stroke="rgba(0, 95, 155, 0.92)" stroke-width="0.75" stroke-linecap="butt" stroke-linejoin="round" />` : '',
      pointMarks,
      '</svg>'
    ].join('')

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
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
    const homeViewModel = this.store && typeof this.store.getHomeViewModel === 'function'
      ? this.store.getHomeViewModel()
      : {}
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
      menuItems: [...(viewModel.menuItems || COPY.profile.menuItems || []), CONTACT_MENU_ITEM],
      summary: {
        streakDays: viewModel.stats.streakDays,
        unlockedMedals: viewModel.stats.unlockedMedalCount,
        totalLiters: viewModel.stats.totalLitres
      },
      shareProgressPercent: Number(homeViewModel.progressPercent) || 0,
      shareStreakDays: Number(viewModel.stats.streakDays) || Number(homeViewModel.streakDays) || 0
    })
  },

  navigateToMenu(e) {
    const { key } = e.currentTarget.dataset
    if (key === 'contact') {
      this.showContactDialog()
      return
    }

    const url = MENU_ROUTES[key]
    if (!url) {
      return
    }

    wx.navigateTo({ url })
  },

  showContactDialog() {
    this.setData({
      contactDialogVisible: true
    })
  },

  hideContactDialog() {
    this.setData({
      contactDialogVisible: false
    })
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
      const serialized = JSON.stringify(exportData.payload, null, 2)
      fs.writeFileSync(filePath, serialized, 'utf8')
      fs.accessSync(filePath)
      const verifyContent = fs.readFileSync(filePath, 'utf8')
      if (!verifyContent || !String(verifyContent).trim()) {
        throw new Error('EXPORT_EMPTY_CONTENT')
      }
      const parsed = JSON.parse(verifyContent)
      if (!parsed || parsed.schemaVersion !== exportData.payload.schemaVersion) {
        throw new Error('EXPORT_VERIFY_FAILED')
      }
      const verifyBuffer = fs.readFileSync(filePath)
      const bufferSize = Number((verifyBuffer && verifyBuffer.byteLength) || 0)
      const fileStats = fs.statSync(filePath)
      const fileSize = Math.max(bufferSize, this.resolveStatSize(fileStats))
      if (fileSize <= 0) {
        throw new Error('EXPORT_EMPTY_FILE')
      }
      this.setData({
        exportResult: {
          ...exportData,
          path: filePath,
          sizeLabel: this.formatFileSize(fileSize),
          fileSize,
          verifiedAt: new Date().toISOString()
        }
      })
      this.refreshSummary()
      wx.showToast({
        title: COPY.profile.syncToast,
        icon: 'success'
      })
      wx.showModal({
        title: '导出完成',
        content: `已保存为标准 JSON。\n\n文件：${exportData.filename}\n路径：${filePath}\n大小：${this.formatFileSize(fileSize)}\n下一步可点“分享文件”或“另存到手机”。`,
        showCancel: false
      })
    } catch (error) {
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    }
  },

  resolveStatSize(fileStats) {
    if (!fileStats) {
      return 0
    }
    if (Number(fileStats.size) > 0) {
      return Number(fileStats.size)
    }
    if (fileStats.stats && Number(fileStats.stats.size) > 0) {
      return Number(fileStats.stats.size)
    }
    return 0
  },

  formatFileSize(fileSize) {
    const size = Number(fileSize) || 0
    if (size < 1024) {
      return `${size}B`
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)}KB`
    }
    return `${(size / 1024 / 1024).toFixed(2)}MB`
  },

  handleExportPathTap() {
    const now = Date.now()
    if (this.lastPathTapAt && now - this.lastPathTapAt <= 350) {
      this.lastPathTapAt = 0
      this.copyExportPath()
      return
    }
    this.lastPathTapAt = now
  },

  copyExportPath() {
    const exportResult = this.data.exportResult
    if (!exportResult || !exportResult.path) {
      wx.showToast({
        title: '暂无可复制路径',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: exportResult.path,
      success: () => {
        wx.showToast({
          title: '路径已复制',
          icon: 'success'
        })
      }
    })
  },

  shareExportFile() {
    const exportResult = this.data.exportResult
    if (!exportResult || !exportResult.path) {
      wx.showToast({
        title: '请先导出数据',
        icon: 'none'
      })
      return
    }

    if (typeof wx.shareFileMessage !== 'function') {
      wx.showModal({
        title: '当前版本不支持',
        content: '当前微信版本不支持直接分享文件，请使用“另存到手机”完成外部保存。',
        showCancel: false
      })
      return
    }

    wx.shareFileMessage({
      filePath: exportResult.path,
      fileName: exportResult.filename,
      success: () => {
        wx.showToast({
          title: '已拉起分享',
          icon: 'success'
        })
      },
      fail: (error) => {
        if (error && /cancel/i.test(String(error.errMsg || ''))) {
          return
        }
        wx.showToast({
          title: '分享失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  saveExportToExternal() {
    const exportResult = this.data.exportResult
    if (!exportResult || !exportResult.path) {
      wx.showToast({
        title: '请先导出数据',
        icon: 'none'
      })
      return
    }

    const fs = wx.getFileSystemManager()
    if (fs && typeof fs.saveFileToDisk === 'function') {
      fs.saveFileToDisk({
        filePath: exportResult.path,
        success: () => {
          wx.showToast({
            title: '已保存到系统目录',
            icon: 'success'
          })
        },
        fail: () => {
          this.openExportFile()
        }
      })
      return
    }

    this.openExportFile()
  },

  openExportFile() {
    const exportResult = this.data.exportResult
    if (!exportResult || !exportResult.path) {
      wx.showToast({
        title: '暂无可打开文件',
        icon: 'none'
      })
      return
    }

    wx.openDocument({
      filePath: exportResult.path,
      showMenu: true,
      fileType: 'json',
      success: () => {
        wx.showToast({
          title: '请在右上角菜单另存',
          icon: 'none'
        })
      },
      fail: () => {
        wx.showToast({
          title: '打开失败，请先复制路径',
          icon: 'none'
        })
      }
    })
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
