// pages/about/about.js
const { COPY } = require('../../utils/copy')

Page({
  data: {
    copy: COPY.about,
    version: '1.0.0',
    contact: 'yztxlty@163.com'
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
