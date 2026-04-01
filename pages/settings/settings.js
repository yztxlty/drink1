const app = getApp()
const { COPY } = require('../../utils/copy')
const {
  DEFAULT_QUICK_AMOUNTS,
  DEFAULT_SELECTED_AMOUNT,
  normalizeQuickAmounts,
  resolveFallbackSelectedCup
} = require('../../utils/quick-amounts')

const DEFAULT_SETTINGS = {
  dailyTarget: 2000,
  quickAmounts: DEFAULT_QUICK_AMOUNTS,
  selectedCupAmount: DEFAULT_SELECTED_AMOUNT,
  reminders: {
    morning: true,
    noon: true,
    evening: true,
    night: false
  }
}

Page({
  data: {
    copy: COPY.settings,
    settings: DEFAULT_SETTINGS,
    reminderItems: COPY.settings.reminderItems
  },

  onShow() {
    this.store = app.globalData.store
    this.loadSettings()
  },

  loadSettings() {
    const cached = this.store ? this.store.ensureState().settings : wx.getStorageSync('drink_settings') || {}
    const normalized = this.normalizeSettings(cached)
    this.setData({
      settings: normalized
    })
  },

  normalizeSettings(source) {
    // 做一层兜底，避免老版本存储字段缺失时页面空白。
    const quickAmounts = normalizeQuickAmounts(source.quickAmounts)
    const dailyTarget = Number.isFinite(Number(source.dailyTarget))
      ? Number(source.dailyTarget)
      : Number(source.dailyGoal)
    const selectedCupAmount = Number(source.selectedCupAmount)

    return {
      dailyTarget: dailyTarget > 0 ? dailyTarget : DEFAULT_SETTINGS.dailyTarget,
      quickAmounts,
      selectedCupAmount: quickAmounts.includes(selectedCupAmount)
        ? selectedCupAmount
        : (quickAmounts[1] || quickAmounts[0] || DEFAULT_SETTINGS.selectedCupAmount),
      reminders: {
        ...DEFAULT_SETTINGS.reminders,
        ...(source.reminders || {})
      }
    }
  },

  onGoalChanging(e) {
    const dailyTarget = Number(e.detail.value)
    if (!Number.isFinite(dailyTarget) || dailyTarget <= 0) {
      return
    }

    this.setData({
      settings: {
        ...this.data.settings,
        dailyTarget
      }
    })
  },

  onGoalChange(e) {
    const dailyTarget = Number(e.detail.value)
    this.commitSettings({
      ...this.data.settings,
      dailyTarget
    })
  },

  onToggleReminder(e) {
    const { key } = e.currentTarget.dataset
    const checked = Boolean(e.detail.value)
    this.commitSettings({
      ...this.data.settings,
      reminders: {
        ...this.data.settings.reminders,
        [key]: checked
      }
    })
  },

  handleQuickAmountAdd(e) {
    const amount = Number(e.detail && e.detail.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    const quickAmounts = normalizeQuickAmounts([...this.data.settings.quickAmounts, amount])
    this.commitSettings({
      ...this.data.settings,
      quickAmounts,
      selectedCupAmount: amount
    })
  },

  handleQuickAmountSelect(e) {
    const amount = Number(e.detail && e.detail.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    this.commitSettings({
      ...this.data.settings,
      selectedCupAmount: amount
    })
  },

  handleQuickAmountDelete(e) {
    const amount = Number(e.detail && e.detail.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    const quickAmounts = normalizeQuickAmounts(
      this.data.settings.quickAmounts.filter((item) => Number(item) !== amount)
    )
    const selectedCupAmount = resolveFallbackSelectedCup(
      quickAmounts,
      amount,
      this.data.settings.selectedCupAmount
    )

    this.commitSettings({
      ...this.data.settings,
      quickAmounts,
      selectedCupAmount
    })
  },

  noop() {},

  commitSettings(settings) {
    const normalized = this.normalizeSettings(settings)
    this.setData({
      settings: normalized
    })

    if (this.store) {
      this.store.updateSettings(normalized)
      if (app.globalData) {
        app.globalData.appState = this.store.getStore()
      }
    } else {
      wx.setStorageSync('drink_settings', normalized)
    }
  },

  saveSettings() {
    wx.showToast({
      title: COPY.settings.savedToast,
      icon: 'success'
    })
  },

  goDataManagement() {
    wx.navigateTo({
      url: '/pages/data-management/data-management'
    })
  }
})
