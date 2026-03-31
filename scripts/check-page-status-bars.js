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
    path.join(root, 'utils/medals')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

const root = process.cwd();
const store = loadFreshStore();
const { COPY } = require(path.join(root, 'utils/copy'));
const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
const profileWxml = fs.readFileSync(path.join(root, 'pages/profile/profile.wxml'), 'utf8');
const forestWxml = fs.readFileSync(path.join(root, 'pages/explore/explore.wxml'), 'utf8');
const stripWxss = fs.readFileSync(path.join(root, 'components/page-status-strip/page-status-strip.wxss'), 'utf8');

function assertStatusBar(viewModel, name) {
  assert.ok(viewModel.statusBar, `${name} view model should expose statusBar`);
  ['title', 'subtitle', 'metricLabel', 'metricValue', 'actionLabel'].forEach((key) => {
    assert.strictEqual(
      typeof viewModel.statusBar[key],
      'string',
      `${name} statusBar.${key} should be a string`
    );
  });
}

assertStatusBar(store.getHomeViewModel(), 'home');
assertStatusBar(store.getProfileViewModel(), 'profile');
assertStatusBar(store.getForestViewModel(), 'forest');

assert.strictEqual(store.getHomeViewModel().statusBar.title, '今日补水', 'Home status bar title should use the shared hydration copy');
assert.strictEqual(store.getHomeViewModel().statusBar.actionLabel, '记录补水', 'Home status bar action should use the shared hydration copy');
assert.strictEqual(store.getProfileViewModel().statusBar.title, '我的补水档案', 'Profile status bar title should use the shared hydration copy');
assert.strictEqual(store.getProfileViewModel().statusBar.actionLabel, '', 'Profile status bar action should stay hidden');
assert.strictEqual(store.getForestViewModel().statusBar.title, '补水森林', 'Forest status bar title should use the shared hydration copy');
assert.strictEqual(store.getForestViewModel().statusBar.actionLabel, '去补水', 'Forest status bar action should use the shared hydration copy');

assert.ok(homeWxml.includes('<page-status-strip'), 'Home page should use the shared status strip');
assert.ok(profileWxml.includes('<page-status-strip'), 'Profile page should use the shared status strip');
assert.ok(forestWxml.includes('<page-status-strip'), 'Forest page should use the shared status strip');
assert.ok(stripWxss.includes('white-space: nowrap'), 'Shared status strip should clamp text instead of wrapping');
assert.ok(stripWxss.includes('text-overflow: ellipsis'), 'Shared status strip should ellipsize overflow text');

console.log('Page status bar check passed.');
