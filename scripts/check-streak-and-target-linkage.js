#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { getDateKey } = require(path.join(process.cwd(), 'utils/date'));

function clearModuleCache(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function loadFreshStore() {
  const root = process.cwd();
  [
    path.join(root, 'utils/store'),
    path.join(root, 'utils/storage'),
    path.join(root, 'utils/water'),
    path.join(root, 'utils/date'),
    path.join(root, 'utils/medals'),
    path.join(root, 'utils/home')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

function createSettingsPageHarness(store) {
  global.getApp = () => ({ globalData: { store } });
  global.Page = (cfg) => {
    cfg.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    global.__page = cfg;
  };
  global.wx = {
    showToast: () => {},
    vibrateShort: () => {},
    navigateTo: () => {},
    setStorageSync: () => {},
    getStorageSync: () => false
  };

  require('../pages/settings/settings.js');
  return global.__page;
}

function makeIso(date, hour, minute) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0
  ).toISOString();
}

const store = loadFreshStore();
store.clearBusinessData();
store.updateSettings({
  dailyTarget: 2000,
  quickAmounts: [150, 250, 500],
  selectedCupAmount: 250
});

const today = new Date();
const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
const twoDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
const yesterdayKey = getDateKey(yesterday);
const twoDaysAgoKey = getDateKey(twoDaysAgo);

store.updateStore({
  business: {
    hydration: {
      records: [
        {
          id: 'streak-two-days-ago',
          amount: 300,
          createdAt: makeIso(twoDaysAgo, 8, 10),
          dateKey: twoDaysAgoKey
        },
        {
          id: 'streak-yesterday',
          amount: 350,
          createdAt: makeIso(yesterday, 9, 20),
          dateKey: yesterdayKey
        }
      ]
    }
  }
});

const homeViewModel = store.getHomeViewModel();
const profileViewModel = store.getProfileViewModel();

assert.strictEqual(
  homeViewModel.heroStatLabel,
  '连续天数',
  'Home hero stat should stay on streak mode when the day is not complete'
);
assert.strictEqual(
  homeViewModel.heroStatValue,
  '2 天',
  'Home hero stat should count consecutive drinking days instead of only today'
);
assert.strictEqual(
  profileViewModel.stats.streakDays,
  2,
  'Profile summary should count consecutive drinking days instead of only today'
);
assert.strictEqual(
  profileViewModel.statusBar.metricValue,
  '2',
  'Profile status bar should use the same streak value as the summary card'
);

const settingsPage = createSettingsPageHarness(store);
settingsPage.onShow();

settingsPage.onGoalChanging({
  detail: {
    value: 2600
  }
});

assert.strictEqual(
  settingsPage.data.settings.dailyTarget,
  2600,
  'Goal slider should update its displayed number while dragging'
);

settingsPage.onGoalChange({
  detail: {
    value: 2600
  }
});

assert.strictEqual(
  store.ensureState().settings.dailyTarget,
  2600,
  'Goal slider should persist the daily target into store state'
);
assert.strictEqual(
  store.getHomeViewModel().dailyTarget,
  2600,
  'Home view model should reflect the updated daily target'
);
assert.strictEqual(
  store.getProfileViewModel().analysis.chart.targetMl,
  2600,
  'Profile chart should update its guideline target after settings change'
);

console.log('Streak and target linkage check passed.');
