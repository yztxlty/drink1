const app = getApp()
const { COPY } = require('../../utils/copy')
const LOGIN_AUTH_COPY = COPY.loginAuth

function safeShowToast(title) {
  if (typeof wx === 'undefined' || typeof wx.showToast !== 'function') {
    return
  }

  wx.showToast({
    title,
    icon: 'none'
  })
}

Page({
  data: {
    copy: LOGIN_AUTH_COPY,
    loading: false,
    userInfo: {
      nickName: '',
      avatarUrl: ''
    }
  },

  onLoad() {
    this.store = app.globalData.store || null
    let loginViewModel = null

    try {
      loginViewModel = this.store && typeof this.store.getLoginViewModel === 'function'
        ? this.store.getLoginViewModel()
        : null
    } catch (error) {
      loginViewModel = null
    }

    this.setData({
      copy: LOGIN_AUTH_COPY,
      userInfo: this.resolveAuthorizationUserInfo(loginViewModel)
    })
  },

  resolveAuthorizationUserInfo(loginViewModel) {
    const viewModel = loginViewModel || {}
    const profile = viewModel.profile || {}
    const userInfo = viewModel.userInfo || {}
    const hasWechatNickName = Boolean(String(profile.wechatNickName || '').trim())
    const hasWechatAvatarUrl = Boolean(String(profile.wechatAvatarUrl || '').trim())

    return {
      nickName: hasWechatNickName ? String(userInfo.nickName || '').trim() : '',
      avatarUrl: hasWechatAvatarUrl ? String(userInfo.avatarUrl || '').trim() : ''
    }
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl
      ? String(e.detail.avatarUrl)
      : ''

    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
  },

  onNicknameChange(e) {
    const nickName = e && e.detail && typeof e.detail.value === 'string'
      ? e.detail.value.trim()
      : ''

    this.setData({
      'userInfo.nickName': nickName
    })
  },

  completeAuthorize(wechatLoginCode, userInfo) {
    try {
      if (this.store && typeof this.store.updateProfile === 'function') {
        this.store.updateProfile({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          wechatNickName: userInfo.nickName,
          wechatAvatarUrl: userInfo.avatarUrl,
          wechatLoginCode,
          loginProvider: 'wechat',
          isLoggedIn: true,
          syncWechatProfile: true
        })
      }

      if (app.globalData && this.store && typeof this.store.getProfileViewModel === 'function') {
        app.globalData.userInfo = this.store.getProfileViewModel().profile
      }

      if (typeof wx !== 'undefined' && typeof wx.switchTab === 'function') {
        wx.switchTab({
          url: '/pages/home/home',
          fail: () => {
            safeShowToast(LOGIN_AUTH_COPY.homeRedirectFailed)
          }
        })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  handleAuthorize() {
    if (this.data.loading) {
      return
    }

    const userInfo = {
      nickName: String(this.data.userInfo.nickName || '').trim(),
      avatarUrl: String(this.data.userInfo.avatarUrl || '').trim()
    }

    if (!userInfo.nickName || !userInfo.avatarUrl) {
      safeShowToast(LOGIN_AUTH_COPY.profileRequired)
      return
    }

    this.setData({
      loading: true,
      userInfo
    })

    try {
      if (typeof wx === 'undefined' || typeof wx.login !== 'function') {
        this.completeAuthorize('', userInfo)
        return
      }

      wx.login({
        success: (loginRes) => {
          this.completeAuthorize((loginRes && loginRes.code) || '', userInfo)
        },
        fail: () => {
          this.completeAuthorize('', userInfo)
        }
      })
    } catch (error) {
      this.completeAuthorize('', userInfo)
    }
  }
})
