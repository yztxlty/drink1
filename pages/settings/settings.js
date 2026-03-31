const app = getApp()
const { COPY } = require('../../utils/copy')

const DEFAULT_SETTINGS = {
  dailyGoal: 2000,
  quickAmounts: [150, 250, 500],
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
    reminderItems: COPY.settings.reminderItems,
    quickAmountOptions: [150, 250, 300, 500, 750, 1000]
  },

  onShow() {
    this.store = app.globalData.store
    this.loadSettings()
  },

  loadSettings() {
    const cached = this.store ? this.store.ensureState().settings : wx.getStorageSync('drink_settings') || {}
    this.setData({
      settings: this.normalizeSettings(cached)
    })
  },

  normalizeSettings(source) {
    // 做一层兜底，避免老版本存储字段缺失时页面空白。
    return {
      dailyGoal: Number(source.dailyGoal) || DEFAULT_SETTINGS.dailyGoal,
      quickAmounts:
        Array.isArray(source.quickAmounts) && source.quickAmounts.length
          ? source.quickAmounts
          : DEFAULT_SETTINGS.quickAmounts,
      reminders: {
        ...DEFAULT_SETTINGS.reminders,
        ...(source.reminders || {})
      }
    }
  },

  onGoalChange(e) {
    const dailyGoal = Number(e.detail.value)
    this.commitSettings({
      ...this.data.settings,
      dailyGoal
    })
  },

  onCupChange(e) {
    const selectedCupAmount = Number(e.detail.value)
    const quickAmounts = this.data.settings.quickAmounts.includes(selectedCupAmount)
      ? this.data.settings.quickAmounts
      : [...this.data.settings.quickAmounts, selectedCupAmount].sort((a, b) => a - b)

    this.commitSettings({
      ...this.data.settings,
      quickAmounts,
      selectedCupAmount
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

  selectAmount(e) {
    const amount = Number(e.currentTarget.dataset.amount)
    const quickAmounts = this.data.settings.quickAmounts.includes(amount)
      ? this.data.settings.quickAmounts
      : [...this.data.settings.quickAmounts, amount].sort((a, b) => a - b)

    this.commitSettings({
      ...this.data.settings,
      quickAmounts,
      selectedCupAmount: amount
    })
  },

  commitSettings(settings) {
    const normalized = this.normalizeSettings(settings)
    this.setData({
      settings: normalized
    })

    if (this.store) {
      this.store.updateSettings(normalized)
    } else {
      wx.setStorageSync('drink_settings', normalized)
    }
  },

  saveSettings() {
    wx.showToast({
      title: COPY.settings.savedToast,
      icon: 'success'
    })
  }
})
