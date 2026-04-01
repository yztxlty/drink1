const app = getApp()
const { COPY } = require('../../utils/copy')
const { getTodayKey } = require('../../utils/date')
const storeModule = require('../../utils/store')

Page({
  data: {
    copy: COPY.dataManagement,
    notice: {
      visible: false,
      text: ''
    },
    pendingAction: {
      visible: false,
      kind: '',
      title: '',
      content: '',
      confirmText: ''
    },
    stats: {
      todayAmount: 0,
      todayRecordCount: 0,
      totalRecordCount: 0,
      totalLitres: '0.0'
    }
  },

  onShow() {
    this.store = (app.globalData && app.globalData.store) || storeModule
    this.refreshStats()
  },

  onUnload() {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer)
      this.noticeTimer = null
    }
  },

  ensureStore() {
    if (this.store) {
      return true
    }
    this.store = (app.globalData && app.globalData.store) || storeModule
    return Boolean(this.store)
  },

  lightFeedback() {
    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({
        type: 'light'
      })
    }
  },

  showWeakNotice(text) {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer)
    }
    this.setData({
      notice: {
        visible: true,
        text
      }
    })

    this.noticeTimer = setTimeout(() => {
      this.setData({
        notice: {
          visible: false,
          text: ''
        }
      })
      this.noticeTimer = null
    }, 1800)
  },

  updateGlobalState() {
    if (app.globalData && this.store && typeof this.store.getStore === 'function') {
      app.globalData.appState = this.store.getStore()
    }
  },

  promptPendingAction(action) {
    this.setData({
      pendingAction: {
        visible: true,
        kind: action.kind,
        title: action.title,
        content: action.content,
        confirmText: action.confirmText
      }
    })
  },

  cancelPendingAction() {
    this.setData({
      pendingAction: {
        visible: false,
        kind: '',
        title: '',
        content: '',
        confirmText: ''
      }
    })
  },

  confirmPendingAction() {
    const { kind } = this.data.pendingAction
    if (!kind) {
      return
    }

    this.cancelPendingAction()
    if (kind === 'deleteToday') {
      this.executeDeleteToday()
      return
    }

    if (kind === 'clearHistory') {
      this.executeClearHistory()
    }
  },

  refreshStats() {
    const state = this.store ? this.store.ensureState() : null
    const hydration = (state && state.hydration) || { daily: {}, totals: {} }
    const today = hydration.daily[getTodayKey()] || {}
    const totalAmount = Number((hydration.totals && hydration.totals.totalAmount) || 0)

    this.setData({
      stats: {
        todayAmount: Number(today.total) || 0,
        todayRecordCount: Number(today.recordCount) || 0,
        totalRecordCount: Number((hydration.totals && hydration.totals.totalRecords) || 0),
        totalLitres: (totalAmount / 1000).toFixed(1)
      }
    })
  },

  deleteTodayData() {
    this.lightFeedback()
    if (!this.ensureStore() || typeof this.store.deleteTodayHydrationData !== 'function') {
      wx.showToast({
        title: '当前无法删除',
        icon: 'none'
      })
      return
    }

    this.promptPendingAction({
      kind: 'deleteToday',
      title: this.data.copy.deleteTodayConfirmTitle,
      content: this.data.copy.deleteTodayConfirmContent,
      confirmText: this.data.copy.deleteTodayAction
    })
  },

  clearHistoryData() {
    this.lightFeedback()
    if (!this.ensureStore() || typeof this.store.clearBusinessData !== 'function') {
      wx.showToast({
        title: '当前无法清空',
        icon: 'none'
      })
      return
    }

    this.promptPendingAction({
      kind: 'clearHistory',
      title: this.data.copy.clearHistoryConfirmTitle,
      content: this.data.copy.clearHistoryConfirmContent,
      confirmText: this.data.copy.clearHistoryAction
    })
  },

  executeDeleteToday() {
    this.store.deleteTodayHydrationData()
    this.updateGlobalState()
    this.refreshStats()
    this.showWeakNotice(this.data.copy.deleteTodaySuccess)
  },

  executeClearHistory() {
    this.store.clearBusinessData()
    this.updateGlobalState()
    this.refreshStats()
    this.showWeakNotice(this.data.copy.clearHistorySuccess)
  }
})
