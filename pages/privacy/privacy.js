const app = getApp()
const { COPY } = require('../../utils/copy')
const STORAGE_KEY = 'drink_privacy_ack'

Page({
  data: {
    copy: COPY.privacy,
    agreed: false,
    sections: COPY.privacy.sections
  },

  onShow() {
    this.store = app.globalData.store
    this.setData({
      agreed: Boolean(wx.getStorageSync(STORAGE_KEY) || (this.store && this.store.ensureState().settings.privacyAccepted))
    })
  },

  toggleAgree(e) {
    const agreed = Boolean(e.detail.value)
    wx.setStorageSync(STORAGE_KEY, agreed)
    if (this.store) {
      this.store.updateSettings({ privacyAccepted: agreed })
    }
    this.setData({ agreed })
  },

  copySummary() {
    wx.setClipboardData({
      data: COPY.privacy.copySummary,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
})
