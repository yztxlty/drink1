#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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
    path.join(root, 'utils/home'),
    path.join(root, 'utils/forest-water-rhythm')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

function createPageHarness(modulePath, store) {
  global.getApp = () => ({
    globalData: {
      store
    }
  });

  global.Page = (cfg) => {
    cfg.setData = function setData(patch, callback) {
      this.data = { ...this.data, ...patch };
      if (typeof callback === 'function') {
        callback();
      }
    };
    global.__page = cfg;
  };

  global.wx = {
    createSelectorQuery() {
      const query = {
        in() {
          return query;
        },
        select() {
          return {
            boundingClientRect(callback) {
              if (typeof callback === 'function') {
                callback(null);
              }
              return query;
            }
          };
        },
        exec() {
          return undefined;
        }
      };

      return query;
    },
    getSystemInfoSync() {
      return {
        windowWidth: 375,
        windowHeight: 667,
        safeArea: {
          bottom: 667
        }
      };
    },
    showToast() {},
    vibrateShort() {},
    navigateTo() {},
    setStorageSync() {},
    getStorageSync() {
      return false;
    }
  };

  require(modulePath);
  return global.__page;
}

const root = process.cwd();
const exploreWxml = fs.readFileSync(path.join(root, 'pages/explore/explore.wxml'), 'utf8');
const profileWxml = fs.readFileSync(path.join(root, 'pages/profile/profile.wxml'), 'utf8');

assert.ok(
  exploreWxml.includes('percent="{{shareProgressPercent}}"') &&
    exploreWxml.includes('streak="{{shareStreakDays}}"'),
  'Explore share-fab should bind its live progress and streak values'
);
assert.ok(
  profileWxml.includes('percent="{{shareProgressPercent}}"') &&
    profileWxml.includes('streak="{{shareStreakDays}}"'),
  'Profile share-fab should bind its live progress and streak values'
);

const store = loadFreshStore();
store.clearBusinessData();
store.updateSettings({
  dailyTarget: 2000,
  quickAmounts: [150, 250, 500],
  selectedCupAmount: 250
});
store.addWaterRecord(300);

const homeViewModel = store.getHomeViewModel();
const profileViewModel = store.getProfileViewModel();

const explorePage = createPageHarness(path.join(root, 'pages/explore/explore.js'), store);
explorePage.onLoad();
explorePage.updateCollectionProgress(3);

assert.strictEqual(
  explorePage.data.shareProgressPercent,
  60,
  'Explore share progress should follow the live collection progress, not the reset value'
);
assert.strictEqual(
  explorePage.data.shareStreakDays,
  homeViewModel.streakDays,
  'Explore share streak should come from the live hydration streak'
);

const profilePage = createPageHarness(path.join(root, 'pages/profile/profile.js'), store);
profilePage.onLoad();

assert.strictEqual(
  profilePage.data.shareProgressPercent,
  homeViewModel.progressPercent,
  'Profile share progress should mirror the live home completion rate'
);
assert.strictEqual(
  profilePage.data.shareStreakDays,
  profileViewModel.stats.streakDays,
  'Profile share streak should mirror the live profile streak'
);

console.log('Share page prop linkage check passed.');
