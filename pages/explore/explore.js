const app = getApp();
const { COPY } = require('../../utils/copy');
const {
  buildInitialDrops,
  buildMergedDrop,
  findMergeTarget,
  getDropCount,
  getMergeProgress,
  updateDraggedDrop
} = require('../../utils/forest-water-rhythm');

const MERGE_ANIMATION_MS = 420;

function buildFallbackForestViewModel() {
  return {
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
}

function buildFallbackSystemInfo() {
  return {
    windowWidth: 375,
    windowHeight: 667,
    safeArea: {
      bottom: 667
    }
  };
}

function buildEnergyLabel(intake) {
  return COPY.forestWaterRhythm.energyLabel.replace('{{intake}}', intake);
}

function buildCollectionLabel(progress) {
  return `${Math.max(0, Number(progress) || 0)}%`;
}

Page({
  data: {
    gameCopy: COPY.forestWaterRhythm,
    summaryRulesTitle: COPY.forest.summaryRulesTitle,
    summaryRulesTrigger: COPY.forest.summaryRulesTrigger,
    summaryRules: COPY.forest.summaryRules,
    drops: [],
    dropCount: 0,
    intake: 0,
    intakeEnergyLabel: buildEnergyLabel(0),
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
    this.systemInfo = this.getSystemInfo();
    this.mergeTimer = null;
    this.vesselRect = null;
    this.activeDropId = '';
    this.popAudioContext = null;
    this.refreshPageData();
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    if (tabBar && typeof tabBar.setData === 'function') {
      tabBar.setData({ selected: 1 });
    }
    this.refreshPageData();
  },

  onUnload() {
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer);
      this.mergeTimer = null;
    }

    if (this.popAudioContext && typeof this.popAudioContext.destroy === 'function') {
      this.popAudioContext.destroy();
      this.popAudioContext = null;
    }
  },

  onShareAppMessage() {
    const shareFab = typeof this.selectComponent === 'function'
      ? this.selectComponent('#shareFab')
      : null;

    if (shareFab && typeof shareFab.getShareContent === 'function') {
      return shareFab.getShareContent();
    }

    return {
      title: COPY.forest.statusTitle,
      path: '/pages/explore/explore'
    };
  },

  showSummaryRules() {
    if (typeof wx === 'undefined' || typeof wx.showModal !== 'function') {
      return;
    }

    wx.showModal({
      title: this.data.summaryRulesTitle || COPY.forest.summaryRulesTitle,
      content: (this.data.summaryRules || COPY.forest.summaryRules).join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  getSystemInfo() {
    if (typeof wx === 'undefined' || typeof wx.getSystemInfoSync !== 'function') {
      return buildFallbackSystemInfo();
    }

    try {
      return wx.getSystemInfoSync();
    } catch (error) {
      return buildFallbackSystemInfo();
    }
  },

  readTodayIntake() {
    if (!this.store || typeof this.store.getStore !== 'function') {
      return 0;
    }

    const storeState = this.store.getStore();
    const business = storeState && storeState.business ? storeState.business : {};
    const hydration = business.hydration || {};
    const totals = hydration.totals || {};
    return Number(totals.today) || 0;
  },

  refreshPageData() {
    const forestViewModel = this.store && typeof this.store.getForestViewModel === 'function'
      ? this.store.getForestViewModel()
      : buildFallbackForestViewModel();
    const intake = this.readTodayIntake() || Number(forestViewModel.todayTotal) || 0;
    const initialDropCount = getDropCount(intake);
    const collectionProgress = getMergeProgress(initialDropCount, initialDropCount);

    this.setData({
      gameCopy: COPY.forestWaterRhythm,
      oxygenValue: Number(forestViewModel.oxygenValue) || 0,
      collectionProgress,
      collectionLabel: buildCollectionLabel(collectionProgress),
      forestLevel: Number(forestViewModel.forestLevel) || 0,
      forestStatusHint: forestViewModel.forestStatusHint || '',
      statusBar: forestViewModel.statusBar || buildFallbackForestViewModel().statusBar,
      unlockedMedalCount: Number(forestViewModel.unlockedMedalCount) || 0,
      todayRemaining: Number(forestViewModel.todayRemaining) || 0,
      todayTotal: Number(forestViewModel.todayTotal) || 0,
      reminderText: forestViewModel.reminderText || '',
      intake,
      dropCount: initialDropCount,
      intakeEnergyLabel: buildEnergyLabel(intake)
    }, () => {
      this.measureVesselAndInitDrops();
    });
  },

  updateCollectionProgress(currentDropCount) {
    const initialDropCount = getDropCount(this.data.intake);
    const collectionProgress = getMergeProgress(initialDropCount, currentDropCount);

    this.setData({
      collectionProgress,
      collectionLabel: buildCollectionLabel(collectionProgress)
    });
  },

  measureVesselAndInitDrops() {
    if (typeof wx === 'undefined' || typeof wx.createSelectorQuery !== 'function') {
      this.initDrops();
      return;
    }

    wx.createSelectorQuery()
      .in(this)
      .select('.vessel-container')
      .boundingClientRect((rect) => {
        this.vesselRect = rect || null;
        this.initDrops();
      })
      .exec();
  },

  initDrops() {
    const drops = buildInitialDrops(this.data.intake, {
      vesselRect: this.vesselRect,
      systemInfo: this.systemInfo,
      windowWidth: this.systemInfo.windowWidth
    });

    this.setData({
      drops,
      dropCount: getDropCount(this.data.intake)
    }, () => {
      this.updateCollectionProgress(drops.length);
    });
  },

  touchStart(e) {
    const dropId = e.currentTarget && e.currentTarget.dataset
      ? String(e.currentTarget.dataset.id || '')
      : '';

    if (!dropId) {
      return;
    }

    this.activeDropId = dropId;
    const drops = (this.data.drops || []).map((drop) => ({
      ...drop,
      isDragging: drop.id === dropId
    }));

    this.setData({ drops });
  },

  touchMove(e) {
    const dropId = e.currentTarget && e.currentTarget.dataset
      ? String(e.currentTarget.dataset.id || '')
      : '';
    const touch = e.touches && e.touches[0];

    if (!dropId || !touch) {
      return;
    }

    const drops = (this.data.drops || []).map((drop) => ({ ...drop }));
    const activeIndex = drops.findIndex((drop) => drop.id === dropId);

    if (activeIndex === -1) {
      return;
    }

    const vesselRect = this.vesselRect || {
      left: 0,
      top: 0,
      width: Math.round(this.systemInfo.windowWidth * 0.84),
      height: Math.round(this.systemInfo.windowHeight * 0.42)
    };
    const activeDrop = updateDraggedDrop(drops[activeIndex], {
      x: touch.clientX,
      y: touch.clientY
    }, vesselRect);

    drops[activeIndex] = activeDrop;

    const mergeTarget = findMergeTarget(activeDrop, drops);
    if (!mergeTarget) {
      this.setData({ drops });
      return;
    }

    const mergedDrop = buildMergedDrop(activeDrop, mergeTarget, vesselRect);
    const nextDrops = drops
      .filter((drop) => drop.id !== activeDrop.id && drop.id !== mergeTarget.id)
      .concat(mergedDrop);

    this.triggerMergeFeedback();
    this.setData({
      drops: nextDrops,
      dropCount: nextDrops.length
    }, () => {
      this.updateCollectionProgress(nextDrops.length);

      if (this.mergeTimer) {
        clearTimeout(this.mergeTimer);
      }

      this.mergeTimer = setTimeout(() => {
        this.clearMergingState(mergedDrop.id);
      }, MERGE_ANIMATION_MS);
    });
  },

  touchEnd() {
    this.activeDropId = '';
    const drops = (this.data.drops || []).map((drop) => ({
      ...drop,
      isDragging: false
    }));

    this.setData({ drops });
  },

  clearMergingState(dropId) {
    const drops = (this.data.drops || []).map((drop) => {
      if (drop.id !== dropId) {
        return drop;
      }

      return {
        ...drop,
        isMerging: false
      };
    });

    this.setData({ drops });
  },

  triggerMergeFeedback() {
    if (typeof wx !== 'undefined' && typeof wx.vibrateShort === 'function') {
      try {
        wx.vibrateShort();
      } catch (error) {}
    }

    this.playPopSound();
  },

  playPopSound() {
    if (typeof wx === 'undefined' || typeof wx.createInnerAudioContext !== 'function') {
      return;
    }

    if (!this.popAudioContext) {
      this.popAudioContext = wx.createInnerAudioContext();
      this.popAudioContext.src = '/assets/audio/water-drop.mp3';
      this.popAudioContext.obeyMuteSwitch = false;
    }

    try {
      if (typeof this.popAudioContext.stop === 'function') {
        this.popAudioContext.stop();
      }
      if (typeof this.popAudioContext.seek === 'function') {
        this.popAudioContext.seek(0);
      }
      this.popAudioContext.play();
    } catch (error) {}
  },

  navHome() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});
