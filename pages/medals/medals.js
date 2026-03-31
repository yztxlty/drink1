const app = getApp()
const { COPY } = require('../../utils/copy')

const MEDAL_CATALOG = [
  {
    id: 'first_drop',
    title: '首杯奖励',
    icon: '💧',
    desc: '完成第一次补水记录即可解锁',
    condition: '记录 1 次补水'
  },
  {
    id: 'three_day',
    title: '三日连饮',
    icon: '🌱',
    desc: '连续 3 天保持补水节奏',
    condition: '连续 3 天'
  },
  {
    id: 'seven_day',
    title: '七日守护',
    icon: '🏅',
    desc: '连续一周养成稳定补水习惯',
    condition: '连续 7 天'
  },
  {
    id: 'monthly_goal',
    title: '月度达标',
    icon: '🏆',
    desc: '累计完成高频补水目标，形成长期习惯',
    condition: '累计达标 30 次'
  }
]

Page({
  data: {
    copy: COPY.medals,
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'unlocked', label: '已解锁' },
      { key: 'locked', label: '待解锁' }
    ],
    activeTab: 'all',
    summary: {
      unlockedCount: 0,
      totalCount: MEDAL_CATALOG.length
    },
    medals: [],
    visibleMedals: []
  },

  onShow() {
    this.store = app.globalData.store
    this.loadMedals()
  },

  loadMedals() {
    const profileViewModel = this.store ? this.store.getProfileViewModel() : { badges: [] }
    const badges = profileViewModel.badges || []
    const medals = MEDAL_CATALOG.map((item) => {
      const badge = badges.find((entry) => entry.id === item.id) || {}
      return {
        ...item,
        unlocked: Boolean(badge.unlocked),
        progressText: badge.progressText || this.getProgressText(item.id, {}),
        progressRate: badge.completionRate || 0
      }
    })

    this.setData({
      medals,
      visibleMedals: this.filterMedals(medals, this.data.activeTab),
      summary: {
        unlockedCount: medals.filter((item) => item.unlocked).length,
        totalCount: medals.length
      }
    })
  },

  filterMedals(medals, tab) {
    return medals.filter((item) => {
      if (tab === 'all') return true
      if (tab === 'unlocked') return item.unlocked
      return !item.unlocked
    })
  },

  getProgressText(id, profile) {
    const streakDays = Number(profile.streakDays) || 0
    const totalRecords = Number(profile.totalRecords) || 0
    const completedDays = Number(profile.completedDays) || 0

    if (id === 'first_drop') {
      return totalRecords >= 1 ? '已完成' : `还差 ${1 - totalRecords} 次`
    }
    if (id === 'three_day') {
      return streakDays >= 3 ? '已完成' : `还差 ${3 - streakDays} 天`
    }
    if (id === 'seven_day') {
      return streakDays >= 7 ? '已完成' : `还差 ${7 - streakDays} 天`
    }
    if (id === 'monthly_goal') {
      return completedDays >= 30 ? '已完成' : `还差 ${30 - completedDays} 天`
    }
    return '待解锁'
  },

  switchTab(e) {
    const { key } = e.currentTarget.dataset
    this.setData({
      activeTab: key,
      visibleMedals: this.filterMedals(this.data.medals, key)
    })
  },

  viewMedal(e) {
    const { id } = e.currentTarget.dataset
    const medal = this.data.medals.find((item) => item.id === id)
    if (!medal) {
      return
    }

    wx.showModal({
      title: medal.title,
      content: `${medal.desc}\n\n解锁条件：${medal.condition}`,
      showCancel: false
    })
  }
})
