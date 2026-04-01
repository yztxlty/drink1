#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function createHomeHarness() {
  const storage = new Map();
  const calls = [];

  global.getApp = () => ({
    globalData: {
      store: {
        syncSessionHeartbeat() {},
        getHomeViewModel() {
          return {
            statusBar: {
              tone: 'home',
              title: '今日补水',
              subtitle: '看进度，顺手补水',
              metricValue: '0 ml',
              metricLabel: '/ 2000 ml',
              actionLabel: '记录补水'
            },
            intake: 0,
            progressDegree: 0,
            progressPercent: 0,
            selectedCup: 250,
            selectedCupScrollId: 'quick-pick-item-250',
            quickAmounts: [150, 250, 500],
            todayRecords: [],
            todayRecordCount: 0,
            visibleTodayRecords: [],
            recordDisplayLimit: 5,
            recordLoadHint: '',
            recordTitle: '今日补水记录',
            dailyTarget: 2000,
            remaining: 2000,
            heroStatLabel: '连续天数',
            heroStatValue: '0 天',
            qualityLabel: '待提升',
            todayGoalText: '还差 2000 ml',
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
            celebrationMessage: ''
          };
        }
      }
    }
  });

  global.Page = (cfg) => {
    cfg.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    global.__page = cfg;
  };

  global.wx = {
    getStorageSync(key) {
      return storage.get(key);
    },
    setStorageSync(key, value) {
      storage.set(key, value);
    },
    navigateToMiniProgram(opts) {
      calls.push({ type: 'navigate', opts });
      if (opts && typeof opts.success === 'function') {
        opts.success();
      }
    },
    showToast(opts) {
      calls.push({ type: 'toast', opts });
    },
    vibrateShort() {}
  };

  require('../pages/home/home.js');
  return { page: global.__page, storage, calls };
}

const originalNow = Date.now;
let now = 1700000000000;
Date.now = () => now;

try {
  const root = process.cwd();
  const { page, storage, calls } = createHomeHarness();
  const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
  const homeJs = fs.readFileSync(path.join(root, 'pages/home/home.js'), 'utf8');
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const resource = require('../utils/home-ai-recommend');

  page.onLoad();
  page.onShow();

  assert.ok(page.data.aiChatRecommendation.visible, 'AI recommendation should show by default');
  assert.strictEqual(page.data.aiChatRecommendation.title, 'AI 聊天推荐', 'AI recommendation title should come from resources');
  assert.strictEqual(page.data.aiChatRecommendation.appId, 'wx29c58f03b1322e0e', 'AI recommendation appId should come from resources');
  assert.strictEqual(page.data.aiChatRecommendation.path, '', 'AI recommendation should not force a path when the source link has no page path');

  page.hideAiChatRecommendation();
  assert.strictEqual(page.data.aiChatRecommendation.visible, false, 'AI recommendation should hide immediately after closing');
  assert.strictEqual(typeof storage.get('home_ai_chat_recommend_hidden_until'), 'number', 'Closing should persist a hide-until timestamp');

  const hiddenUntil = storage.get('home_ai_chat_recommend_hidden_until');
  now = hiddenUntil - 1;
  page.onShow();
  assert.strictEqual(page.data.aiChatRecommendation.visible, false, 'AI recommendation should stay hidden during the 2-hour cooldown');

  now = hiddenUntil + 1;
  page.onShow();
  assert.ok(page.data.aiChatRecommendation.visible, 'AI recommendation should reappear after the cooldown expires');

  page.goAiChatRecommendation();
  const navigateCall = calls.find((item) => item.type === 'navigate');
  assert.ok(navigateCall, 'Clicking the card should navigate to the AI mini program');
  assert.strictEqual(navigateCall.opts.appId, 'wx29c58f03b1322e0e', 'Navigation appId should match the AI mini program');
  assert.ok(!('path' in navigateCall.opts) || navigateCall.opts.path === '', 'Navigation should omit path when the source link does not provide one');

  assert.strictEqual(resource.appId, 'wx29c58f03b1322e0e', 'Resource file should expose the AI mini program appId');
  assert.strictEqual(resource.path, '', 'Resource file should not expose a fake AI mini program path');
  assert.strictEqual(resource.sourceLink, '#小程序://幽光Ai伴侣/IeNvypurIqnBEUh', 'Resource file should preserve the original source link for debugging');
  assert.strictEqual(resource.storageKey, 'home_ai_chat_recommend_hidden_until', 'Resource file should expose the hidden state key');
  assert.strictEqual(resource.copy.title, 'AI 聊天推荐', 'Resource file should expose the recommendation title copy');
  assert.strictEqual(resource.copy.closeLabel, '×', 'Resource file should expose the close button label');
  assert.ok(
    homeWxml.includes('wx:if="{{aiChatRecommendation.visible}}"') &&
      homeWxml.includes('bindtap="goAiChatRecommendation"') &&
      homeWxml.includes('catchtap="hideAiChatRecommendation"'),
    'Home page should render the AI recommendation card with tap and close behavior'
  );
  assert.ok(
    homeJs.includes('HOME_AI_RECOMMENDATION') &&
      homeJs.includes('refreshAiChatRecommendationVisibility()') &&
      homeJs.includes('hideAiChatRecommendation()') &&
      homeJs.includes('goAiChatRecommendation()'),
    'Home page should wire the recommendation feature from the resource file'
  );
  assert.ok(
    !Object.prototype.hasOwnProperty.call(appJson, 'navigateToMiniProgramAppIdList'),
    'app.json should not include navigateToMiniProgramAppIdList'
  );

  console.log('Home AI recommendation check passed.');
} finally {
  Date.now = originalNow;
}
