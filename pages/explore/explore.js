const app = getApp();
const { COPY } = require('../../utils/copy');

Page({
  data: {
    plants: [],
    oxygenValue: 0,
    collectionProgress: 0,
    collectionLabel: '0%',
    forestLevel: 0,
    forestStatusHint: '',
    statusBar: {
      tone: 'forest',
      title: COPY.forest.statusTitle,
      subtitle: '补水越稳，森林越茂盛 · 还差 2000 ml',
      metricValue: '0',
      metricLabel: '当前氧气',
      actionLabel: COPY.forest.actionLabel
    },
    unlockedMedalCount: 0,
    todayRemaining: 0,
    todayTotal: 0,
    reminderText: ''
  },

  onLoad() {
    this.store = app.globalData.store;
    this.refreshPageData();
  },

  onShow() {
    this.refreshPageData();
  },

  refreshPageData() {
    const forestViewModel = this.store ? this.store.getForestViewModel() : {
      plants: [],
      oxygenValue: 0,
      collectionProgress: 0,
      collectionLabel: '0%',
      forestLevel: 0,
      forestStatusHint: '',
      statusBar: {
        tone: 'forest',
        title: COPY.forest.statusTitle,
        subtitle: '补水越稳，森林越茂盛 · 还差 2000 ml',
        metricValue: '0',
        metricLabel: '当前氧气',
        actionLabel: COPY.forest.actionLabel
      },
      unlockedMedalCount: 0,
      todayRemaining: 0,
      todayTotal: 0,
      reminderText: ''
    };
    this.setData(forestViewModel);
  },

  navHome() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});
