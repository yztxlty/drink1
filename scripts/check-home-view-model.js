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
    path.join(root, 'utils/medals')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

function makeIso(year, month, day, hour, minute) {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

const store = loadFreshStore();
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const todayDate = new Date(year, month - 1, day);
const yesterdayDate = new Date(year, month - 1, day - 1);
const todayKey = getDateKey(todayDate);
const yesterdayKey = getDateKey(yesterdayDate);

store.updateStore({
  business: {
    hydration: {
      records: [
        {
          id: 'yesterday-1',
          amount: 1000,
          createdAt: makeIso(yesterdayDate.getFullYear(), yesterdayDate.getMonth() + 1, yesterdayDate.getDate(), 9, 0),
          dateKey: yesterdayKey
        },
        {
          id: 'today-1',
          amount: 150,
          createdAt: makeIso(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate(), 8, 20),
          dateKey: todayKey
        },
        {
          id: 'today-2',
          amount: 200,
          createdAt: makeIso(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate(), 12, 15),
          dateKey: todayKey
        }
      ]
    }
  }
});

const home = store.getHomeViewModel();

assert.strictEqual('history' in home, false, 'Home view model should not expose the old history field');
assert.ok(Array.isArray(home.todayRecords), 'Home view model should expose todayRecords');
assert.strictEqual(home.todayRecords.length, 2, 'Home view model should include only today records');
assert.deepStrictEqual(
  home.todayRecords.map((record) => record.dateKey),
  [todayKey, todayKey],
  'Today records should only contain the current date'
);
assert.deepStrictEqual(
  home.todayRecords.map((record) => record.timeDisplay),
  ['12:15', '08:20'],
  'Today records should stay sorted from newest to oldest'
);
assert.strictEqual(home.todayRecordCount, 2, 'Home view model should expose the count of today records');
assert.strictEqual(home.todayStatus.level, 'normal', 'Header state should be normal while under target');
assert.strictEqual(home.heroStatLabel, '连续天数', 'Header stat should stay on streak mode while under target');
assert.strictEqual(home.heroStatValue, '2 天', 'Header stat should reflect the consecutive drinking streak when under target');
assert.strictEqual(home.todayGoalText, '还差 1650 ml', 'Goal text should reflect the remaining amount');

console.log('Home view model check passed.');
