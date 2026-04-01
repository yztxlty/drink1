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
    path.join(root, 'utils/quick-amounts')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

function createPageHarness(store) {
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

function createHomePageHarness(store) {
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

  require('../pages/home/home.js');
  return global.__page;
}

function createComponentHarness() {
  global.Component = (cfg) => {
    cfg.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    global.__component = cfg;
  };

  require('../components/quick-amount-manager/quick-amount-manager.js');
  return global.__component;
}

const root = process.cwd();
const settingsJson = JSON.parse(fs.readFileSync(path.join(root, 'pages/settings/settings.json'), 'utf8'));
const settingsWxml = fs.readFileSync(path.join(root, 'pages/settings/settings.wxml'), 'utf8');
const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
const componentScript = fs.readFileSync(
  path.join(root, 'components/quick-amount-manager/quick-amount-manager.js'),
  'utf8'
);
const componentWxml = fs.readFileSync(
  path.join(root, 'components/quick-amount-manager/quick-amount-manager.wxml'),
  'utf8'
);

assert.ok(
  settingsJson.usingComponents && settingsJson.usingComponents['quick-amount-manager'],
  'Settings page should register the quick amount manager component'
);
assert.ok(
  settingsWxml.includes('<quick-amount-manager'),
  'Settings page should render the quick amount manager component'
);
assert.ok(
  homeWxml.includes('wx:for="{{quickAmounts}}"'),
  'Home page should render quick amounts from view model data'
);
assert.ok(
  settingsWxml.includes('bindadd="handleQuickAmountAdd"') &&
    settingsWxml.includes('bindselect="handleQuickAmountSelect"') &&
    settingsWxml.includes('binddelete="handleQuickAmountDelete"'),
  'Settings page should bind component add/select/delete events'
);
assert.ok(
  componentScript.includes('doubleTap') &&
    componentScript.includes('enterDeleteMode') &&
    componentScript.includes('confirmQuickAmount'),
  'Quick amount manager component should own the add dialog and double-tap delete flow'
);
assert.ok(
  componentWxml.includes('add-chip-action') &&
    componentWxml.includes('quick-amount-delete-action'),
  'Quick amount manager should keep the add and delete tap targets isolated from the root taps'
);
assert.ok(
  componentWxml.includes('quick-amount-edit-action') &&
    componentWxml.includes('bindtap="enterDeleteMode"'),
  'Quick amount manager should expose one shared edit icon that enters delete mode'
);
assert.ok(
  componentWxml.includes('quick-amount-delete-action" data-amount="{{item}}" catchtap="handleDeleteTap"'),
  'Delete icon should own the amount data and stop tap bubbling at the target'
);
assert.ok(
  !componentWxml.includes('quick-amount-close" bindtap="closeQuickAmountDialog" catchtap="noop"'),
  'Quick amount dialog close button should not mix bindtap and catchtap on the same node'
);
assert.ok(
  !componentWxml.includes('step-btn" bindtap="decreaseQuickAmountDraft" catchtap="noop"') &&
    !componentWxml.includes('step-btn" bindtap="increaseQuickAmountDraft" catchtap="noop"'),
  'Quick amount stepper buttons should not mix bindtap and catchtap on the same node'
);

const store = loadFreshStore();
store.clearBusinessData();
store.updateSettings({
  dailyTarget: 2000,
  quickAmounts: [150, 250, 500],
  selectedCupAmount: 250
});

const page = createPageHarness(store);
page.onShow();

assert.ok(typeof page.handleQuickAmountAdd === 'function', 'Page should handle component add events');
assert.ok(typeof page.handleQuickAmountSelect === 'function', 'Page should handle component select events');
assert.ok(typeof page.handleQuickAmountDelete === 'function', 'Page should handle component delete events');

const component = createComponentHarness();
const emittedEvents = [];
const quickAmountComponent = {
  data: {
    ...(component.data || {}),
    quickAmounts: [150, 250, 500],
    selectedAmount: 250
  },
  setData(patch) {
    this.data = { ...this.data, ...patch };
  },
  triggerEvent(name, detail) {
    emittedEvents.push({ name, detail });
  }
};

Object.assign(quickAmountComponent, component.methods);

quickAmountComponent.openQuickAmountDialog();
assert.strictEqual(quickAmountComponent.data.dialogVisible, true, 'Add tile should open the dialog');

quickAmountComponent.setData({ draftAmount: 300 });
quickAmountComponent.decreaseQuickAmountDraft();
assert.strictEqual(quickAmountComponent.data.draftAmount, 250, 'Minus button should reduce draft amount by 50ml');

quickAmountComponent.increaseQuickAmountDraft();
assert.strictEqual(quickAmountComponent.data.draftAmount, 300, 'Plus button should increase draft amount by 50ml');

quickAmountComponent.setData({ draftAmount: 350 });
quickAmountComponent.confirmQuickAmount();

assert.deepStrictEqual(
  emittedEvents.find((item) => item.name === 'add').detail,
  { amount: 350 },
  'Dialog confirm should emit the normalized amount'
);

quickAmountComponent.enterDeleteMode();
assert.strictEqual(quickAmountComponent.data.deleteMode, true, 'Edit icon should enter delete mode');
quickAmountComponent.handleDeleteTap({
  currentTarget: {
    dataset: {
      amount: 250
    }
  }
});

assert.deepStrictEqual(
  emittedEvents.find((item) => item.name === 'delete').detail,
  { amount: 250 },
  'Delete icon should emit the selected amount to remove'
);
assert.strictEqual(
  quickAmountComponent.data.deleteMode,
  true,
  'Delete mode should stay active until blank space is tapped'
);

quickAmountComponent.handleRootTap();
assert.strictEqual(quickAmountComponent.data.deleteMode, false, 'Blank tap should exit delete mode');

quickAmountComponent.setData({ dialogVisible: true });
quickAmountComponent.closeQuickAmountDialog();
assert.strictEqual(quickAmountComponent.data.dialogVisible, false, 'Close button should hide the dialog');

page.handleQuickAmountAdd({
  detail: {
    amount: 350
  }
});

assert.deepStrictEqual(
  store.getHomeViewModel().quickAmounts,
  [150, 250, 350, 500],
  'Adding a quick amount should sync the sorted list into the store'
);
assert.strictEqual(
  store.getHomeViewModel().selectedCup,
  350,
  'Adding a quick amount should make it the selected default capacity'
);

page.handleQuickAmountSelect({
  detail: {
    amount: 250
  }
});

assert.strictEqual(
  store.getStore().config.selectedCupAmount,
  250,
  'Selecting a quick amount should update the default capacity'
);

page.handleQuickAmountDelete({
  detail: {
    amount: 250
  }
});

assert.deepStrictEqual(
  store.getStore().config.quickAmounts,
  [150, 350, 500],
  'Deleting a quick amount should remove only the selected item'
);

const homePage = createHomePageHarness(store);
homePage.onLoad();

homePage.openCustomAmountPanel();
homePage.setData({
  customAmount: 650
});
homePage.confirmCustomAmount();

assert.deepStrictEqual(
  homePage.data.quickAmounts,
  [150, 350, 500, 650],
  'Home page should refresh its quick amount list immediately after adding a custom amount'
);
assert.strictEqual(
  homePage.data.selectedCup,
  650,
  'Home page should keep the newly added custom amount selected'
);

console.log('Quick amount management check passed.');
