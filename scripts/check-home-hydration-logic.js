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

function isoMinutesFromNow(deltaMinutes) {
  return new Date(Date.now() + deltaMinutes * 60 * 1000).toISOString();
}

function makeRecord(id, amount, deltaMinutes, dateKey) {
  return {
    id,
    amount,
    createdAt: isoMinutesFromNow(deltaMinutes),
    dateKey
  };
}

function seedStore(records, config) {
  const store = loadFreshStore();
  const patch = {
    business: {
      hydration: {
        records
      }
    }
  };

  if (config) {
    patch.config = config;
  }

  store.updateStore(patch);
  return store;
}

const todayKey = getDateKey(new Date());
const yesterdayKey = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

{
  const store = seedStore([
    makeRecord('yesterday', 1000, -24 * 60, yesterdayKey),
    makeRecord('today-1', 700, -120, todayKey),
    makeRecord('today-2', 750, -60, todayKey),
    makeRecord('today-3', 800, -10, todayKey)
  ]);

  const home = store.getHomeViewModel();
  assert.ok(home.todayStatus, 'Home view model should expose todayStatus');
  assert.strictEqual(home.todayStatus.level, 'overflow', 'Home should mark over-target days as overflow');
  assert.strictEqual(home.todayStatus.overflowAmount, 250, 'Overflow amount should equal the amount over target');
  assert.strictEqual(home.heroStatLabel, '超出目标', 'Hero stat should switch to over-target label');
  assert.strictEqual(home.heroStatValue, '250 ml', 'Hero stat should show the overflow amount');
  assert.strictEqual(home.todayGoalText, '已超出 250 ml', 'Goal chip should show the overflow amount');
  assert.strictEqual(home.todayStatus.hint.includes('适量补水'), false, 'Mild overflow should not show the severe warning');
}

{
  const store = seedStore([
    makeRecord('today-complete-1', 1000, -60, todayKey),
    makeRecord('today-complete-2', 1000, -30, todayKey)
  ]);

  const home = store.getHomeViewModel();
  assert.strictEqual(home.todayStatus.level, 'complete', 'Home should mark exact target days as complete');
  assert.strictEqual(home.heroStatLabel, '今日达标', 'Hero stat should switch to completion label');
  assert.strictEqual(home.heroStatValue, '100%', 'Hero stat should show completion percent');
  assert.strictEqual(home.todayGoalText, '今日已达标', 'Goal chip should show completion state');
}

{
  const store = seedStore([
    makeRecord('today-severe-1', 1200, -45, todayKey),
    makeRecord('today-severe-2', 1100, -20, todayKey),
    makeRecord('today-severe-3', 600, -10, todayKey)
  ]);

  const home = store.getHomeViewModel();
  assert.strictEqual(home.todayStatus.level, 'severe_overflow', 'Home should mark heavy overflow days separately');
  assert.ok(home.todayStatus.hint.includes('补水过量易'), 'Severe overflow should include the weak warning copy');
}

{
  const store = seedStore([], {
    quickAmounts: [150, 250, 500],
    selectedCupAmount: 250
  });

  const selected = store.setSelectedCupAmount(333);
  assert.strictEqual(selected.settings.selectedCupAmount, 350, 'Custom amounts should snap to the nearest 50ml');
  assert.ok(selected.settings.quickAmounts.includes(350), 'Custom amounts should persist into quick amounts');
}

{
  const store = seedStore([
    makeRecord('before-goal-1', 800, -40, todayKey),
    makeRecord('before-goal-2', 900, -20, todayKey)
  ], {
    quickAmounts: [150, 250, 500],
    selectedCupAmount: 250
  });

  const before = store.getHomeViewModel();
  const result = store.addWaterRecord(333, { source: 'test_custom_amount' });
  assert.strictEqual(result.state.hydration.records[0].amount, 350, 'Recorded custom amounts should be normalized before storage');
  assert.ok(result.home.todayRecords.length >= before.todayRecords.length, 'Recording water should refresh today records');
  assert.ok(typeof result.goalCelebration === 'object', 'Crossing the goal should return a celebration payload');
  assert.strictEqual(result.goalCelebration.medalName, '今日达标', 'Goal celebration should reuse the medal logic');
}

{
  const store = seedStore([], {
    quickAmounts: [150, 250, 500, 700, 850, 1000, 1250],
    selectedCupAmount: 250
  });

  assert.strictEqual(
    store.getStore().config.quickAmounts.length,
    7,
    'Quick amounts should keep all valid capacities'
  );
}

console.log('Home hydration logic check passed.');
