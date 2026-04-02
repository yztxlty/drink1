const app = getApp()
const { COPY } = require('../../utils/copy')
const LOGIN_COPY = COPY.login
const LOGIN_AUTH_PAGE = '/pages/login-auth/login-auth'

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
      title: LOGIN_COPY.consentTitle,
      content: LOGIN_COPY.consentRequired,
      showCancel: false
    })
    return
  }

  safeShowToast(LOGIN_COPY.consentRequired)
}

Page({
  data: {
    copy: LOGIN_COPY,
    agreed: true,
    loading: false
  },

  onLoad() {
    this.store = app.globalData.store || null
    this.deviceInfo = typeof wx !== 'undefined' && typeof wx.getDeviceInfo === 'function'
      ? wx.getDeviceInfo()
      : {}
    let loginViewModel = null

    try {
      loginViewModel = this.store && typeof this.store.getLoginViewModel === 'function'
        ? this.store.getLoginViewModel()
        : null
    } catch (error) {
      loginViewModel = null
    }

    this.setData({
      copy: LOGIN_COPY
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

  onAgreementChange(e) {
    const agreed = Array.isArray(e.detail.value) && e.detail.value.includes('agree')
    this.setData({ agreed })
    if (this.store && typeof this.store.updateSettings === 'function') {
      this.store.updateSettings({ privacyAccepted: agreed })
    }
  },

  getLoginViewModel() {
    try {
      return this.store && typeof this.store.getLoginViewModel === 'function'
        ? this.store.getLoginViewModel()
        : null
    } catch (error) {
      return null
    }
  },

  resolveCachedWechatProfile(loginViewModel) {
    const viewModel = loginViewModel || this.getLoginViewModel()
    const profile = viewModel && viewModel.profile ? viewModel.profile : {}
    const nickName = String(profile.wechatNickName || '').trim()
    const avatarUrl = String(profile.wechatAvatarUrl || '').trim()

    return {
      nickName,
      avatarUrl,
      isReady: Boolean(nickName && avatarUrl)
    }
  },

  completeLogin(wechatLoginCode, userInfo) {
    try {
      if (this.store && typeof this.store.setLoginProfile === 'function') {
        this.store.setLoginProfile({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          loginProvider: 'wechat',
          code: wechatLoginCode
        })
      }

      if (app.globalData && this.store && typeof this.store.getProfileViewModel === 'function') {
        app.globalData.userInfo = this.store.getProfileViewModel().profile
      }

      if (typeof wx !== 'undefined' && typeof wx.switchTab === 'function') {
        wx.switchTab({
          url: '/pages/home/home',
          fail: () => {
            safeShowToast(LOGIN_COPY.homeRedirectFailed)
          }
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  goAuthorizeProfile() {
    if (typeof wx === 'undefined' || typeof wx.navigateTo !== 'function') {
      safeShowToast(LOGIN_COPY.authorizationPageFailed)
      return
    }

    wx.navigateTo({
      url: LOGIN_AUTH_PAGE,
      fail: () => {
        safeShowToast(LOGIN_COPY.authorizationPageFailed)
      }
    })
  },

  handleLogin() {
    if (this.data.loading) {
      return
    }

    if (!this.data.agreed) {
      showConsentRequiredPrompt()
      return
    }

    const loginViewModel = this.getLoginViewModel()
    const cachedWechatProfile = this.resolveCachedWechatProfile(loginViewModel)

    if (!cachedWechatProfile.isReady) {
      this.goAuthorizeProfile()
      return
    }

    this.setData({
      loading: true
    })

    try {
      if (typeof wx === 'undefined' || typeof wx.login !== 'function') {
        this.completeLogin('', cachedWechatProfile)
        return
      }

      wx.login({
        success: (loginRes) => {
          this.completeLogin((loginRes && loginRes.code) || '', cachedWechatProfile)
        },
        fail: () => {
          this.completeLogin('', cachedWechatProfile)
        }
      })
    } catch (error) {
      this.completeLogin('', cachedWechatProfile)
    }
  }
})
