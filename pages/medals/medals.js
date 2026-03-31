const app = getApp()
const { COPY } = require('../../utils/copy')

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
      totalCount: 0,
      completionRate: '0%'
    },
    medals: [],
    visibleMedals: [],
    selectedMedal: null
  },

  onShow() {
    this.store = app.globalData.store
    this.loadMedals()
  },

  loadMedals() {
    const viewModel = this.store ? this.store.getProfileViewModel() : { badges: [], stats: {} }
    const medals = (viewModel.badges || []).map((item) => {
      const remaining = Math.max(Number(item.progressTarget || 0) - Number(item.progressCurrent || 0), 0)

      return {
        id: item.id,
        title: item.name,
        icon: item.icon,
        desc: item.description,
        condition: item.unlocked
          ? `已达成 ${item.progressText}`
          : `还差 ${remaining} 次`,
        unlocked: Boolean(item.unlocked),
        progressText: item.unlocked
          ? `已点亮 · ${item.progressText}`
          : `进度 ${item.progressText}`,
        progressCurrent: Number(item.progressCurrent) || 0,
        progressTarget: Number(item.progressTarget) || 0,
        progressPercent: Number(item.progressPercent) || 0,
        category: item.category,
        accentLabel: item.unlocked ? '已获得' : '待解锁'
      }
    })

    const visibleMedals = this.filterMedals(medals, this.data.activeTab)
    const selectedMedal = this.resolveSelectedMedal(medals, visibleMedals)

    this.setData({
      medals,
      visibleMedals,
      selectedMedal,
      summary: {
        unlockedCount: medals.filter((item) => item.unlocked).length,
        totalCount: medals.length,
        completionRate: medals.length ? `${Math.round((medals.filter((item) => item.unlocked).length / medals.length) * 100)}%` : '0%'
      }
    })
  },

  resolveSelectedMedal(medals, visibleMedals) {
    if (!medals.length) {
      return null
    }

    const current = this.data.selectedMedal
    const nextId = current && visibleMedals.find((item) => item.id === current.id)
      ? current.id
      : (visibleMedals[0] && visibleMedals[0].id) || medals[0].id

    return medals.find((item) => item.id === nextId) || medals[0]
  },

  filterMedals(medals, tab) {
    return medals.filter((item) => {
      if (tab === 'all') return true
      if (tab === 'unlocked') return item.unlocked
      return !item.unlocked
    })
  },

  switchTab(e) {
    const { key } = e.currentTarget.dataset
    const visibleMedals = this.filterMedals(this.data.medals, key)
    this.setData({
      activeTab: key,
      visibleMedals,
      selectedMedal: this.resolveSelectedMedal(this.data.medals, visibleMedals)
    })
  },

  viewMedal(e) {
    const { id } = e.currentTarget.dataset
    const medal = this.data.medals.find((item) => item.id === id)
    if (!medal) {
      return
    }

    this.setData({
      selectedMedal: medal
    })
  }
})
