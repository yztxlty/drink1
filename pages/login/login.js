const app = getApp()
const { COPY } = require('../../utils/copy')

function safeShowToast(title) {
  if (typeof wx === 'undefined' || typeof wx.showToast !== 'function') {
    return
  }

  wx.showToast({
    title,
    icon: 'none'
  })
}

function showConsentRequiredPrompt() {
  if (typeof wx !== 'undefined' && typeof wx.showModal === 'function') {
    wx.showModal({
      title: '提示',
      content: '请先阅读并同意隐私协议',
      showCancel: false
    })
    return
  }

  safeShowToast('请先阅读并同意隐私协议')
}

function safeSetStorageSync(key, value) {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
    return false
  }

  try {
    wx.setStorageSync(key, value)
    return true
  } catch (error) {
    return false
  }
}

Page({
  data: {
    copy: COPY.login,
    agreed: true,
    loading: false
  },

  onLoad() {
    this.store = app.globalData.store || null
    this.loginInFlight = false
    const deviceInfo = typeof wx !== 'undefined' && typeof wx.getDeviceInfo === 'function'
      ? wx.getDeviceInfo()
      : {}
    this.isDevTools = deviceInfo.platform === 'devtools'
    let loginViewModel = null

    try {
      loginViewModel = this.store && typeof this.store.getLoginViewModel === 'function'
        ? this.store.getLoginViewModel()
        : null
    } catch (error) {
      loginViewModel = null
    }

    this.setData({
      copy: COPY.login,
      agreed: Boolean(loginViewModel ? loginViewModel.privacyAccepted : false)
    })
  },

  goPrivacy() {
    if (typeof wx === 'undefined' || typeof wx.navigateTo !== 'function') {
      return
    }

    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  onLogin() {
    if (this.loginInFlight || this.data.loading) {
      return
    }

    if (!this.data.agreed) {
      showConsentRequiredPrompt()
      return
    }

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
    let currentStore = null

    try {
      currentStore = this.store ? this.store.getStore() : null
    } catch (error) {
      currentStore = null
    }

    const currentUserId = currentStore && currentStore.user ? currentStore.user.userId : ''
    const nextUserId = currentUserId && currentUserId !== 'local-user'
      ? currentUserId
      : `wx_local_${Date.now()}`

    this.setData({ loading: true })
    if (typeof wx !== 'undefined' && typeof wx.showLoading === 'function') {
      wx.showLoading({
        title: COPY.login.loginLoading,
        mask: true
      })
    }

    try {
      if (this.store && typeof this.store.updateStore === 'function') {
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
        try {
          app.globalData.userInfo = this.store ? this.store.getProfileViewModel().profile : loginInfo
        } catch (error) {
          app.globalData.userInfo = loginInfo
        }

        try {
          app.globalData.appState = this.store ? this.store.getStore() : app.globalData.appState
        } catch (error) {}
      }

      safeSetStorageSync('drink_auth_state', {
        isLoggedIn: true,
        loginProvider: extraOptions.loginProvider || 'wechat',
        loginCode: loginInfo.loginCode || '',
        lastLoginAt: new Date().toISOString()
      })

      if (typeof wx !== 'undefined' && typeof wx.switchTab === 'function') {
        wx.switchTab({
          url: '/pages/home/home',
          fail: () => {
            safeShowToast('进入首页失败，请重试')
          }
        })
      }
    } finally {
      if (typeof wx !== 'undefined' && typeof wx.hideLoading === 'function') {
        wx.hideLoading()
      }
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
    safeSetStorageSync('drink_privacy_ack', nextAgreed)
    if (this.store) {
      try {
        this.store.updateSettings({ privacyAccepted: nextAgreed })
      } catch (error) {}
    }
  },

  startWechatLogin() {
    this.loginInFlight = true

    try {
      if (typeof wx === 'undefined' || !wx.getUserProfile || !wx.login) {
        if (this.isDevTools) {
          this.loginWithFallback()
          return
        }

        safeShowToast(COPY.login.loginUnsupported)
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
              safeShowToast(COPY.login.loginFailed)
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

          safeShowToast(COPY.login.authFailed)
          this.setLoginState()
        }
      })
    } catch (error) {
      if (this.isDevTools) {
        this.loginWithFallback()
        return
      }

      safeShowToast(COPY.login.loginUnsupported)
      this.setLoginState()
    }
  },
})
