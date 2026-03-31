const app = getApp()
const { COPY } = require('../../utils/copy')

Page({
  data: {
    saving: false,
    fromLogin: false,
    copy: COPY.profileEdit,
    actionLabel: COPY.profileEdit.saveLabel,
    profileSourceLabel: '微信补水资料',
    avatarInitial: '补',
    form: {
      nickName: '',
      avatarUrl: '',
      motto: ''
    }
  },

  onLoad(options) {
    this.store = app.globalData.store
    this.fromLogin = Boolean(options && options.fromLogin === '1')
    this.refreshForm()
  },

  onShow() {
    this.refreshForm()
  },

  refreshForm() {
    const viewModel = this.store ? this.store.getProfileViewModel() : null
    const profile = (viewModel && viewModel.profile) || {
      nickName: '补水计划用户',
      avatarUrl: '',
      motto: '用每一次补水滋养今天',
      profileSource: 'local'
    }

    const resolvedNickName = profile.displayNickName || profile.nickName || '补水计划用户'
    const resolvedAvatarUrl = profile.displayAvatarUrl || profile.avatarUrl || ''

    this.setData({
      fromLogin: this.fromLogin,
      actionLabel: this.fromLogin ? '完成并登录' : COPY.profileEdit.saveLabel,
      profileSourceLabel: profile.profileSource === 'manual'
        ? '已使用手动补水资料'
        : (profile.profileSource === 'wechat' ? '微信补水资料' : '本地默认补水资料'),
      avatarInitial: resolvedNickName ? resolvedNickName.slice(0, 1) : '补',
      form: {
        nickName: resolvedNickName,
        avatarUrl: resolvedAvatarUrl,
        motto: profile.motto || '用每一次补水滋养今天'
      }
    })
  },

  onNickInput(e) {
    this.setData({
      'form.nickName': e.detail.value
    })
  },

  onMottoInput(e) {
    this.setData({
      'form.motto': e.detail.value
    })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl || ''
    this.setData({
      'form.avatarUrl': avatarUrl
    })
  },

  chooseLocalAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths && res.tempFilePaths[0]
        if (!tempPath) {
          return
        }

        wx.saveFile({
          tempFilePath: tempPath,
          success: (saveRes) => {
            this.setData({
              'form.avatarUrl': saveRes.savedFilePath
            })
          },
          fail: () => {
            this.setData({
              'form.avatarUrl': tempPath
            })
          }
        })
      }
    })
  },

  restoreWechatProfile() {
    if (!this.store) {
      return
    }

    this.store.restoreWechatProfile()
    this.refreshForm()
    this.syncGlobalProfile()
    wx.showToast({
      title: COPY.profileEdit.restoreToast,
      icon: 'success'
    })
  },

  saveProfile() {
    const nickName = String(this.data.form.nickName || '').trim()
    const avatarUrl = String(this.data.form.avatarUrl || '').trim()
    const motto = String(this.data.form.motto || '').trim()

    if (!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (!this.store) {
      wx.showToast({
        title: COPY.profileEdit.saveFailedShort,
        icon: 'none'
      })
      return
    }

    this.setData({ saving: true })

    try {
      if (this.fromLogin) {
        this.store.updateProfile({
          motto
        })
        this.store.setLoginProfile({
          nickName,
          avatarUrl,
          loginProvider: 'wechat',
          syncWechatProfile: false
        })
        this.store.updateSettings({ privacyAccepted: true })
        wx.setStorageSync('drink_privacy_ack', true)
        wx.setStorageSync('drink_auth_state', {
          isLoggedIn: true,
          loginProvider: 'wechat',
          lastLoginAt: new Date().toISOString()
        })
      } else {
        this.store.updateProfile({
          nickName,
          avatarUrl,
          motto
        })
      }
      this.syncGlobalProfile()
      this.refreshForm()
      wx.showToast({
        title: COPY.profileEdit.savedToast,
        icon: 'success'
      })
      setTimeout(() => {
        if (this.fromLogin) {
          wx.reLaunch({
            url: '/pages/home/home'
          })
          return
        }

        wx.navigateBack()
      }, 450)
    } catch (error) {
      wx.showToast({
        title: COPY.profileEdit.saveFailed,
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  syncGlobalProfile() {
    const state = this.store ? this.store.getProfileViewModel() : null
    if (state && app.globalData) {
      app.globalData.userInfo = state.profile
      app.globalData.appState = this.store.getStore()
    }
  }
})
