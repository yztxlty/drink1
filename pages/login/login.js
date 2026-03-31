const app = getApp()
const { COPY } = require('../../utils/copy')

Page({
  data: {
    copy: COPY.login,
    agreed: true,
    loading: false
  },

  onLoad() {
    this.store = app.globalData.store
    this.loginInFlight = false
    const info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    this.isDevTools = info.platform === 'devtools'
    this.setData({
      copy: COPY.login,
      agreed: true
    })
  },

  goPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  onLogin() {
    if (this.loginInFlight) {
      return
    }

    if (!this.data.agreed) {
      wx.showToast({
        title: '请先勾选同意协议',
        icon: 'none'
      })
      return
    }

    this.setPrivacyAccepted(true)
    this.startWechatLogin()
  },

  onAgreementChange(e) {
    const agreed = Array.isArray(e.detail.value) && e.detail.value.includes('agree')
    this.setPrivacyAccepted(agreed)
  },

  setLoginState(nextState) {
    this.loginInFlight = false
    this.setData({
      loading: false
    })
  },

  finishLogin(authInfo, options) {
    const loginInfo = authInfo || {}
    const extraOptions = options || {}
    const currentStore = this.store ? this.store.getStore() : null
    const currentUserId = currentStore && currentStore.user ? currentStore.user.userId : ''
    const nextUserId = currentUserId && currentUserId !== 'local-user'
      ? currentUserId
      : `wx_local_${Date.now()}`

    this.setData({ loading: true })
    wx.showLoading({
      title: COPY.login.loginLoading,
      mask: true
    })

    try {
      if (this.store) {
        this.store.updateStore({
          user: {
            userId: nextUserId,
            nickName: loginInfo.nickName,
            avatarUrl: loginInfo.avatarUrl,
            loginProvider: extraOptions.loginProvider || 'wechat',
            wechatLoginCode: loginInfo.loginCode,
            isLoggedIn: true
          },
          config: {
            privacyAccepted: true
          }
        })
      }

      if (app.globalData) {
        app.globalData.userInfo = this.store ? this.store.getProfileViewModel().profile : loginInfo
        app.globalData.appState = this.store ? this.store.getStore() : app.globalData.appState
      }

      wx.setStorageSync('drink_auth_state', {
        isLoggedIn: true,
        loginProvider: extraOptions.loginProvider || 'wechat',
        loginCode: loginInfo.loginCode || '',
        lastLoginAt: new Date().toISOString()
      })

      const goHome = () => {
        wx.switchTab({
          url: '/pages/home/home',
          fail: () => {
            wx.reLaunch({
              url: '/pages/home/home'
            })
          }
        })
      }

      goHome()
    } finally {
      wx.hideLoading()
      this.setLoginState()
    }
  },

  loginWithFallback() {
    this.finishLogin({
      nickName: '补水计划用户',
      avatarUrl: '',
      loginCode: ''
    }, {
      loginProvider: 'wechat'
    })
  },

  setPrivacyAccepted(agreed) {
    const nextAgreed = Boolean(agreed)
    this.setData({ agreed: nextAgreed })
    wx.setStorageSync('drink_privacy_ack', nextAgreed)
    if (this.store) {
      this.store.updateSettings({ privacyAccepted: nextAgreed })
    }
  },

  startWechatLogin() {
    this.loginInFlight = true

    try {
      if (!wx.getUserProfile || !wx.login) {
        if (this.isDevTools) {
          this.loginWithFallback()
          return
        }

        wx.showToast({
          title: COPY.login.loginUnsupported,
          icon: 'none'
        })
        this.setLoginState()
        return
      }

      wx.getUserProfile({
        desc: COPY.login.profileDesc,
        success: (profileRes) => {
          const userInfo = profileRes.userInfo || {}
          wx.login({
            success: (loginRes) => {
              this.finishLogin({
                nickName: userInfo.nickName || '',
                avatarUrl: userInfo.avatarUrl || '',
                loginCode: loginRes.code || ''
              })
            },
            fail: () => {
              wx.showToast({
                title: COPY.login.loginFailed,
                icon: 'none'
              })
              this.setLoginState()
            }
          })
        },
        fail: (err) => {
          const errMsg = err && err.errMsg ? err.errMsg : ''
          if (this.isDevTools || errMsg.includes('not supported')) {
            this.loginWithFallback()
            return
          }

          wx.showToast({
            title: COPY.login.authFailed,
            icon: 'none'
          })
          this.setLoginState()
        }
      })
    } catch (error) {
      if (this.isDevTools) {
        this.loginWithFallback()
        return
      }

      wx.showToast({
        title: COPY.login.loginUnsupported,
        icon: 'none'
      })
      this.setLoginState()
    }
  },
})
