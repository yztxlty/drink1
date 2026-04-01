Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    qrSrc: {
      type: String,
      value: '/assets/medals/kefu.png'
    },
    title: {
      type: String,
      value: '联系作者/加入社群'
    },
    subtitle: {
      type: String,
      value: '保存二维码后，随时可以添加作者微信'
    },
    saveButtonText: {
      type: String,
      value: '保存图片到相册'
    }
  },

  data: {
    saving: false
  },

  methods: {
    noop() {},

    handleMaskTap() {
      if (this.data.saving) {
        return
      }

      this.triggerEvent('close')
    },

    saveQRCode() {
      if (this.data.saving) {
        return
      }

      const qrSrc = String(this.properties.qrSrc || '').trim()
      if (!qrSrc) {
        wx.showToast({
          title: '二维码图片缺失',
          icon: 'none'
        })
        return
      }

      this.setData({
        saving: true
      }, () => {
        this.ensureAlbumPermission(() => {
          this.resolveImagePath(qrSrc, (filePath) => {
            if (!filePath) {
              this.finishSaving()
              wx.showToast({
                title: '无法读取二维码',
                icon: 'none'
              })
              return
            }

            wx.saveImageToPhotosAlbum({
              filePath,
              success: () => {
                wx.showToast({
                  title: '已保存到相册',
                  icon: 'success'
                })
                this.finishSaving()
              },
              fail: (error) => {
                if (this.isAlbumPermissionDenied(error)) {
                  this.openAlbumSetting(() => {
                    this.resolveImagePath(qrSrc, (retryFilePath) => {
                      if (!retryFilePath) {
                        this.finishSaving()
                        return
                      }

                      wx.saveImageToPhotosAlbum({
                        filePath: retryFilePath,
                        success: () => {
                          wx.showToast({
                            title: '已保存到相册',
                            icon: 'success'
                          })
                          this.finishSaving()
                        },
                        fail: () => {
                          this.finishSaving()
                          wx.showToast({
                            title: '保存失败，请重试',
                            icon: 'none'
                          })
                        }
                      })
                    })
                  }, () => {
                    this.finishSaving()
                  })
                  return
                }

                this.finishSaving()
                wx.showToast({
                  title: '保存失败，请重试',
                  icon: 'none'
                })
              }
            })
          })
        }, () => {
          this.finishSaving()
        })
      })
    },

    ensureAlbumPermission(onGranted, onDenied) {
      if (typeof wx === 'undefined' || typeof wx.getSetting !== 'function') {
        onGranted()
        return
      }

      wx.getSetting({
        success: (res) => {
          const authSetting = res && res.authSetting ? res.authSetting : {}
          if (authSetting['scope.writePhotosAlbum']) {
            onGranted()
            return
          }

          this.requestAlbumAuthorization(onGranted, onDenied)
        },
        fail: () => {
          this.requestAlbumAuthorization(onGranted, onDenied)
        }
      })
    },

    requestAlbumAuthorization(onGranted, onDenied) {
      if (typeof wx === 'undefined' || typeof wx.authorize !== 'function') {
        this.openAlbumSetting(onGranted, onDenied)
        return
      }

      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success: () => {
          onGranted()
        },
        fail: () => {
          this.openAlbumSetting(onGranted, onDenied)
        }
      })
    },

    openAlbumSetting(onGranted, onDenied) {
      if (typeof wx === 'undefined' || typeof wx.openSetting !== 'function') {
        if (typeof onDenied === 'function') {
          onDenied()
        }
        return
      }

      wx.openSetting({
        success: (res) => {
          const authSetting = res && res.authSetting ? res.authSetting : {}
          if (authSetting['scope.writePhotosAlbum']) {
            onGranted()
            return
          }

          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启“保存到相册”权限后，再点击保存图片到相册。',
            showCancel: false
          })
          if (typeof onDenied === 'function') {
            onDenied()
          }
        },
        fail: () => {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启“保存到相册”权限后，再点击保存图片到相册。',
            showCancel: false
          })
          if (typeof onDenied === 'function') {
            onDenied()
          }
        }
      })
    },

    resolveImagePath(src, callback) {
      if (typeof wx === 'undefined' || typeof wx.getImageInfo !== 'function') {
        callback(src)
        return
      }

      wx.getImageInfo({
        src,
        success: (res) => {
          callback(res && res.path ? res.path : src)
        },
        fail: () => {
          callback(src)
        }
      })
    },

    isAlbumPermissionDenied(error) {
      const message = String(error && error.errMsg ? error.errMsg : '')
      return /auth deny|auth denied|permission|authorize/i.test(message)
    },

    finishSaving() {
      this.setData({
        saving: false
      })
    }
  }
})
