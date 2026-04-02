const store = require('./utils/store');

function createFallbackAppState() {
  const now = new Date().toISOString();

  return {
    user: {
      userId: 'local-user',
      nickName: '补水计划用户',
      avatarUrl: '',
      motto: '用每一口水滋养今天',
      isLoggedIn: false,
      loginProvider: 'local',
      lastLoginAt: '',
      updatedAt: '',
      wechatNickName: '',
      wechatAvatarUrl: '',
      wechatLoginCode: '',
      customNickName: '',
      customAvatarUrl: '',
      customProfileLocked: false,
      nicknameCustomized: false,
      avatarCustomized: false
    },
    config: {
      dailyTarget: 2000,
      quickAmounts: [150, 250, 500],
      selectedCupAmount: 250,
      reminderEnabled: true,
      reminderIntervalMinutes: 120,
      wakeupTime: '08:00',
      sleepTime: '22:30',
      privacyAccepted: false
    },
    business: {
      session: {
        lastOpenAt: now,
        lastSyncAt: '',
        hasSeenOnboarding: false
      },
      hydration: {
        records: [],
        daily: {},
        streak: {
          current: 0,
          longest: 0,
          lastQualifiedDateKey: ''
        },
        totals: {
          today: 0,
          totalAmount: 0,
          totalRecords: 0,
          completedDays: 0,
          activeDays: 0,
          averageCompletionRate: 0,
          morningRecords: 0,
          nightRecords: 0
        }
      },
      achievements: {
        progress: {},
        unlockedIds: [],
        unlockedCount: 0,
        newlyUnlocked: [],
        lastEvaluatedAt: '',
        catalogVersion: 1
      }
    }
  };
}

function safeClearStorage() {
  try {
    if (typeof wx !== 'undefined' && typeof wx.clearStorageSync === 'function') {
      wx.clearStorageSync();
    }
  } catch (error) {}
}

function safeReLaunchToHome() {
  if (typeof wx === 'undefined' || typeof wx.reLaunch !== 'function') {
    return;
  }

  try {
    wx.reLaunch({
      url: '/pages/home/home'
    });
  } catch (error) {}
}

function bootstrapStore(appInstance) {
  let appState = null;
  let initialized = false;

  try {
    store.initStore();
    appState = store.getStore();
    initialized = true;
  } catch (error) {
    safeClearStorage();
    safeReLaunchToHome();
    try {
      store.resetToDefault();
      appState = store.getStore();
    } catch (resetError) {
      appState = createFallbackAppState();
    }
  }

  try {
    appInstance.globalData.appState = appState;
    appInstance.globalData.userInfo = appState.user;
  } catch (error) {
    appInstance.globalData.appState = createFallbackAppState();
    appInstance.globalData.userInfo = appInstance.globalData.appState.user;
  }

  appInstance.globalData.storeReady = true;
  appInstance.globalData.storeInitialized = initialized;
  return appState;
}

function refreshGlobalState(appInstance) {
  try {
    const nextAppState = store.getStore();
    appInstance.globalData.appState = nextAppState;
    appInstance.globalData.userInfo = nextAppState.user;
    return nextAppState;
  } catch (error) {
    const fallbackAppState = createFallbackAppState();
    appInstance.globalData.appState = fallbackAppState;
    appInstance.globalData.userInfo = fallbackAppState.user;
    return fallbackAppState;
  }
}

App({
  onLaunch() {
    try {
      this.globalData.store = store;
      this.globalData.storeReady = false;
      this.globalData.storeInitialized = false;
      bootstrapStore(this);
      refreshGlobalState(this);
    } catch (error) {
      safeReLaunchToHome();
    }
  },

  onShow() {
    try {
      store.syncSessionHeartbeat();
    } catch (error) {}

    if (this.globalData.storeReady) {
      refreshGlobalState(this);
    }
  },

  globalData: {
    appState: null,
    store,
    storeReady: false,
    storeInitialized: false,
    userInfo: null
  }
});
