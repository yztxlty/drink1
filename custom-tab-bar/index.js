const TAB_ITEMS = [
  {
    pagePath: 'pages/home/home',
    text: '首页',
    iconPath: '/assets/tabbar/home.svg',
    selectedIconPath: '/assets/tabbar/home-active.svg'
  },
  {
    pagePath: 'pages/explore/explore',
    text: '森林',
    iconPath: '/assets/tabbar/forest.svg',
    selectedIconPath: '/assets/tabbar/forest-active.svg'
  },
  {
    pagePath: 'pages/profile/profile',
    text: '我的',
    iconPath: '/assets/tabbar/profile.svg',
    selectedIconPath: '/assets/tabbar/profile-active.svg'
  }
]

Component({
  data: {
    items: TAB_ITEMS,
    selected: 0,
    ready: false
  },

  lifetimes: {
    attached() {
      this.syncSelectedFromRoute()
    }
  },

  pageLifetimes: {
    show() {
      this.syncSelectedFromRoute()
    }
  },

  methods: {
    getCurrentRoute() {
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const currentPage = pages[pages.length - 1]
      return currentPage && currentPage.route ? currentPage.route.replace(/^\//, '') : ''
    },

    syncSelectedFromRoute() {
      const route = this.getCurrentRoute()
      const selected = TAB_ITEMS.findIndex((item) => item.pagePath === route)
      const nextSelected = selected >= 0 ? selected : this.data.selected

      if (nextSelected !== this.data.selected || !this.data.ready) {
        this.setData({
          selected: nextSelected,
          ready: true
        })
        return
      }

      if (!this.data.ready) {
        this.setData({
          ready: true
        })
      }
    },

    onTabTap(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.items[index]

      if (!item || index === this.data.selected) {
        return
      }

      if (typeof wx === 'undefined' || typeof wx.switchTab !== 'function') {
        return
      }

      wx.switchTab({
        url: `/${item.pagePath}`,
        fail: () => {
          this.syncSelectedFromRoute()
        }
      })
    }
  }
})
