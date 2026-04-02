const app = getApp()
const { COPY } = require('../../utils/copy')

Page({
  data: {
    copy: COPY.about,
    version: 'v1.0.0-lite',
    contact: 'yztxlty@163.com'
  },

  onLoad() {
    this.store = app.globalData.store || null

    const aboutViewModel = this.store && typeof this.store.getAboutViewModel === 'function'
      ? this.store.getAboutViewModel()
      : null

    this.setData({
      version: aboutViewModel && aboutViewModel.versionLabel
        ? aboutViewModel.versionLabel
        : 'v1.0.0-lite'
    })
  },

  copyContact() {
    wx.setClipboardData({
      data: this.data.contact,
      success: () => {
        wx.showToast({ title: COPY.about.copySuccess, icon: 'success' })
      }
    })
  },

  goPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  }
})
