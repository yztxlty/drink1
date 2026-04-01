#!/usr/bin/env node

const assert = require('assert');
const store = require('../utils/store');

function createPageHarness() {
  global.getApp = () => ({ globalData: { store, appState: null } });
  global.Page = (cfg) => {
    cfg.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    global.__page = cfg;
  };
  global.wx = {
    showToast: (opts) => {
      global.__calls.push({ type: 'toast', title: opts.title });
    },
    vibrateShort: () => {
      global.__calls.push({ type: 'vibrate' });
    },
    getStorageSync: () => false,
    setStorageSync: () => {}
  };

  require('../pages/data-management/data-management.js');
  return global.__page;
}

global.__calls = [];
store.initStore();
store.addWaterRecord(200);
store.addWaterRecord(300);
store.addWaterRecord(250);

const page = createPageHarness();
page.onShow();

assert.strictEqual(page.data.stats.todayRecordCount, 3, 'Harness should see today records before deletion');
assert.strictEqual(store.ensureState().hydration.records.length, 3, 'Store should contain 3 records before deletion');

page.deleteTodayData();

assert.strictEqual(page.data.pendingAction.visible, true, 'deleteTodayData should first expose an inline confirmation card');
assert.strictEqual(page.data.pendingAction.kind, 'deleteToday', 'deleteTodayData should mark the pending action kind');
assert.strictEqual(store.ensureState().hydration.records.length, 3, 'deleteTodayData should not clear data before confirmation');

page.confirmPendingAction();

assert.strictEqual(store.ensureState().hydration.records.length, 0, 'deleteTodayData should remove today records');
assert.strictEqual(page.data.notice.visible, true, 'deleteTodayData should surface weak reminder');
assert.strictEqual(page.data.notice.text, '已删除当天数据', 'deleteTodayData should surface success text');

store.addWaterRecord(250);
store.addWaterRecord(250);

page.clearHistoryData();

assert.strictEqual(page.data.pendingAction.visible, true, 'clearHistoryData should first expose an inline confirmation card');
assert.strictEqual(page.data.pendingAction.kind, 'clearHistory', 'clearHistoryData should mark the pending action kind');
assert.strictEqual(store.ensureState().hydration.records.length, 2, 'clearHistoryData should not clear data before confirmation');

page.confirmPendingAction();

assert.strictEqual(store.ensureState().hydration.records.length, 0, 'clearHistoryData should clear business hydration records');
assert.strictEqual(store.ensureState().achievements.unlockedCount, 0, 'clearHistoryData should reset achievements');
assert.strictEqual(page.data.notice.visible, true, 'clearHistoryData should surface weak reminder');
assert.strictEqual(page.data.notice.text, '已清空历史业务数据', 'clearHistoryData should surface success text');

assert.ok(global.__calls.some((item) => item.type === 'vibrate'), 'Actions should trigger haptic feedback');

console.log('Data management behavior check passed.');
