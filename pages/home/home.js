const app = getApp();
const { COPY } = require('../../utils/copy');
const { HOME_AI_RECOMMENDATION } = require('../../utils/home-ai-recommend');
const { resolveQuickLogAmount } = require('../../utils/home');
const SHARE_PATH = '/pages/home/home';

function buildSelectedCupScrollId(amount) {
  return `quick-pick-item-${amount}`;
}

function normalizeCustomAmount(value) {
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue) || safeValue <= 0) {
    return 50;
  }

  return Math.max(50, Math.round(safeValue / 50) * 50);
}

function buildAiChatRecommendationState(visible) {
  return {
    visible,
    title: HOME_AI_RECOMMENDATION.title,
    subtitle: HOME_AI_RECOMMENDATION.subtitle,
    hint: HOME_AI_RECOMMENDATION.hint,
    actionLabel: HOME_AI_RECOMMENDATION.actionLabel,
    closeLabel: HOME_AI_RECOMMENDATION.closeLabel,
    badgeLabel: HOME_AI_RECOMMENDATION.badgeLabel,
    appId: HOME_AI_RECOMMENDATION.appId,
    path: HOME_AI_RECOMMENDATION.path,
    sourceLink: HOME_AI_RECOMMENDATION.sourceLink
  };
}

function readAiChatRecommendationHiddenUntil() {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') {
    return 0;
  }

  const value = wx.getStorageSync(HOME_AI_RECOMMENDATION.storageKey);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildShareTitle(intake, streakDays) {
  const safeIntake = Math.max(0, Math.round(Number(intake) || 0));
  const safeStreakDays = Math.max(0, Math.round(Number(streakDays) || 0));
  return `我今天已喝水 ${safeIntake}ml，已连续坚持 ${safeStreakDays} 天，快来加入我吧！`;
}

Page({
  data: {
    intake: 0,
    progressDegree: 0,
    progressPercent: 0,
    selectedCup: 250,
    selectedCupScrollId: buildSelectedCupScrollId(250),
    quickAmounts: [150, 250, 500],
    todayRecords: [],
    todayRecordCount: 0,
    visibleTodayRecords: [],
    recordDisplayLimit: 5,
    recordLoadHint: '',
    recordTitle: COPY.home.recordTitle,
    dailyTarget: 2000,
    remaining: 2000,
    heroStatLabel: '连续天数',
    heroStatValue: '0 天',
    qualityLabel: '待提升',
    todayGoalText: '还差 2000 ml',
    statusBar: {
      tone: 'home',
      title: COPY.home.statusTitle,
      subtitle: '看进度，顺手补水',
      metricValue: '0 ml',
      metricLabel: '/ 2000 ml',
      actionLabel: COPY.home.actionLabel
    },
    todayStatus: {
      level: 'normal',
      tone: 'normal',
      label: '还差 2000 ml',
      hint: '距离目标还差 2000 ml',
      badgeText: '2000 ml'
    },
    customPanelVisible: false,
    customAmount: 250,
    showGoalCelebration: false,
    celebrationMedal: '',
    celebrationMessage: '',
    aiChatRecommendation: buildAiChatRecommendationState(true)
  },

  onLoad() {
    this.store = app.globalData.store;
    this.refreshPageData();
    this.refreshAiChatRecommendationVisibility();
  },

  onShow() {
    if (this.store) {
      this.store.syncSessionHeartbeat();
    }
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    if (tabBar && typeof tabBar.setData === 'function') {
      tabBar.setData({ selected: 0 });
    }
    this.refreshPageData();
    this.refreshAiChatRecommendationVisibility();
  },

  onShareAppMessage() {
    const shareFab = typeof this.selectComponent === 'function'
      ? this.selectComponent('#shareFab')
      : null;

    if (shareFab && typeof shareFab.getShareContent === 'function') {
      return shareFab.getShareContent();
    }

    return {
      title: buildShareTitle(this.data.intake, this.data.streakDays),
      path: SHARE_PATH
    };
  },

  onShareTimeline() {
    return {
      title: buildShareTitle(this.data.intake, this.data.streakDays),
      query: 'from=timeline'
    };
  },

  refreshPageData() {
    const homeViewModel = this.store ? this.store.getHomeViewModel() : {};
    this.setData({
      ...homeViewModel,
      selectedCupScrollId: buildSelectedCupScrollId(homeViewModel.selectedCup || 250)
    }, () => {
      this.refreshVisibleRecords();
    });
  },

  refreshVisibleRecords() {
    const todayRecords = Array.isArray(this.data.todayRecords) ? this.data.todayRecords : [];
    const recordDisplayLimit = Math.max(5, Number(this.data.recordDisplayLimit) || 5);
    const visibleTodayRecords = todayRecords.slice(0, recordDisplayLimit);
    const hasMoreTodayRecords = visibleTodayRecords.length < todayRecords.length;

    this.setData({
      visibleTodayRecords,
      hasMoreTodayRecords,
      recordLoadHint: todayRecords.length
        ? (hasMoreTodayRecords ? '～下拉显示更多～' : '～到底了～')
        : ''
    });
  },

  refreshAiChatRecommendationVisibility() {
    const hiddenUntil = readAiChatRecommendationHiddenUntil();
    const visible = !(hiddenUntil > 0 && Date.now() < hiddenUntil);

    this.setData({
      aiChatRecommendation: buildAiChatRecommendationState(visible)
    });
  },

  hideAiChatRecommendation() {
    const hiddenUntil = Date.now() + HOME_AI_RECOMMENDATION.cooldownMs;
    if (typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') {
      wx.setStorageSync(HOME_AI_RECOMMENDATION.storageKey, hiddenUntil);
    }

    this.setData({
      aiChatRecommendation: buildAiChatRecommendationState(false)
    });
  },

  goAiChatRecommendation() {
    if (!this.data.aiChatRecommendation.visible) {
      return;
    }

    if (typeof wx === 'undefined' || typeof wx.navigateToMiniProgram !== 'function') {
      if (typeof wx !== 'undefined' && typeof wx.showToast === 'function') {
        wx.showToast({
          title: '当前环境暂不支持跳转',
          icon: 'none'
        });
      }
      return;
    }

    const navigateOptions = {
      appId: HOME_AI_RECOMMENDATION.appId,
      envVersion: 'release',
      success: () => {},
      fail: () => {
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none'
        });
      }
    };

    if (HOME_AI_RECOMMENDATION.path) {
      navigateOptions.path = HOME_AI_RECOMMENDATION.path;
    }

    wx.navigateToMiniProgram(navigateOptions);
  },

  loadMoreTodayRecords() {
    const todayRecords = Array.isArray(this.data.todayRecords) ? this.data.todayRecords : [];
    const currentLimit = Math.max(5, Number(this.data.recordDisplayLimit) || 5);
    if (currentLimit >= todayRecords.length) {
      this.setData({
        hasMoreTodayRecords: false,
        recordLoadHint: todayRecords.length ? '～到底了～' : ''
      });
      return;
    }

    this.setData({
      recordDisplayLimit: currentLimit + 5
    }, () => {
      this.refreshVisibleRecords();
    });
  },

  selectCup(e) {
    const value = Number(e.currentTarget.dataset.val);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    if (this.store) {
      this.store.setSelectedCupAmount(value);
    }
    this.setData({
      selectedCup: value,
      selectedCupScrollId: buildSelectedCupScrollId(value)
    });
    wx.vibrateShort();
  },

  openCustomAmountPanel() {
    this.setData({
      customPanelVisible: true,
      customAmount: normalizeCustomAmount(this.data.selectedCup || 250)
    });
  },

  closeCustomAmountPanel() {
    this.setData({
      customPanelVisible: false
    });
  },

  decreaseCustomAmount() {
    const nextAmount = normalizeCustomAmount((this.data.customAmount || 50) - 50);
    this.setData({ customAmount: nextAmount });
  },

  increaseCustomAmount() {
    const nextAmount = normalizeCustomAmount((this.data.customAmount || 50) + 50);
    this.setData({ customAmount: nextAmount });
  },

  confirmCustomAmount() {
    const customAmount = normalizeCustomAmount(this.data.customAmount);
    if (this.store) {
      this.store.setSelectedCupAmount(customAmount);
    }

    const homeViewModel = this.store ? this.store.getHomeViewModel() : null;

    this.setData({
      selectedCup: homeViewModel ? homeViewModel.selectedCup : customAmount,
      quickAmounts: homeViewModel ? homeViewModel.quickAmounts : this.data.quickAmounts,
      customAmount,
      customPanelVisible: false,
      selectedCupScrollId: buildSelectedCupScrollId(customAmount)
    }, () => {
      this.logWater(customAmount);
    });
  },

  logWater(forceAmount) {
    const amount = resolveQuickLogAmount(forceAmount, this.data.selectedCup);
    if (!Number.isFinite(amount) || amount <= 0) {
      wx.showToast({
        title: '请选择补水容量',
        icon: 'none'
      });
      return;
    }

    wx.vibrateShort();

    try {
      const result = this.store
        ? this.store.addWaterRecord(amount, {
            source: 'home_quick_add'
          })
        : null;

      if (result) {
        this.setData({
          ...result.home,
          selectedCupScrollId: buildSelectedCupScrollId(result.home.selectedCup || amount)
        }, () => {
          this.refreshVisibleRecords();
        });
      }

      wx.showToast({
        title: `已记录 ${amount}ml`,
        icon: 'success'
      });

      if (result && result.goalCelebration) {
        this.setData({
          showGoalCelebration: true,
          celebrationMedal: result.goalCelebration.medalName,
          celebrationMessage: result.goalCelebration.message
        });
        clearTimeout(this.goalCelebrationTimer);
        this.goalCelebrationTimer = setTimeout(() => {
          this.setData({
            showGoalCelebration: false
          });
        }, 2200);
      }

      if (result && result.home && result.home.todayStatus && result.home.todayStatus.level === 'severe_overflow') {
        wx.showToast({
          title: result.home.todayStatus.hint,
          icon: 'none'
        });
      }

      if (result && result.newlyUnlocked && result.newlyUnlocked.length) {
        const firstUnlocked = result.newlyUnlocked[0];
        setTimeout(() => {
          wx.showToast({
            title: `解锁 ${firstUnlocked.name}`,
            icon: 'none'
          });
        }, 500);
      }
    } catch (error) {
      wx.showToast({
        title: '记录失败，请重试',
        icon: 'none'
      });
    }
  },

  onUnload() {
    clearTimeout(this.goalCelebrationTimer);
  }
});
