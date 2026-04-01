#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

assert.ok(fs.existsSync(path.join(root, 'custom-tab-bar/index.wxml')), 'Expected custom-tab-bar/index.wxml to exist');
assert.ok(fs.existsSync(path.join(root, 'custom-tab-bar/index.wxss')), 'Expected custom-tab-bar/index.wxss to exist');
assert.ok(fs.existsSync(path.join(root, 'custom-tab-bar/index.js')), 'Expected custom-tab-bar/index.js to exist');
assert.ok(fs.existsSync(path.join(root, 'custom-tab-bar/index.json')), 'Expected custom-tab-bar/index.json to exist');

[
  'assets/tabbar/home.svg',
  'assets/tabbar/home-active.svg',
  'assets/tabbar/forest.svg',
  'assets/tabbar/forest-active.svg',
  'assets/tabbar/profile.svg',
  'assets/tabbar/profile-active.svg'
].forEach((assetPath) => {
  assert.ok(fs.existsSync(path.join(root, assetPath)), `Expected ${assetPath} to exist`);
});

const appJson = JSON.parse(read('app.json'));
assert.strictEqual(appJson.tabBar && appJson.tabBar.custom, true, 'Expected app.json tabBar.custom to be true');

const list = (appJson.tabBar && appJson.tabBar.list) || [];
assert.deepStrictEqual(
  list.map((item) => item.pagePath),
  ['pages/home/home', 'pages/explore/explore', 'pages/profile/profile'],
  'Expected tabBar list to contain home, explore, and profile in order'
);

const js = read('custom-tab-bar/index.js');
['switchTab', 'getCurrentPages', 'selected', 'ready'].forEach((marker) => {
  assert.ok(js.includes(marker), `Expected custom-tab-bar/index.js to include ${marker}`);
});
assert.ok(
  !js.includes('this.setData({\n        selected: index\n      })'),
  'Expected custom-tab-bar/index.js to avoid changing selected immediately on tap'
);

const wxml = read('custom-tab-bar/index.wxml');
['tab-item', 'tab-item--active', 'tab-item__active-bg', 'bindtap="onTabTap"', 'is-ready'].forEach((marker) => {
  assert.ok(wxml.includes(marker), `Expected custom-tab-bar/index.wxml to include ${marker}`);
});

const wxss = read('custom-tab-bar/index.wxss');
['backdrop-filter', 'water-ripple', 'tab-item--active', 'tab-item__active-bg', 'pointer-events: none', 'pointer-events: auto', 'is-ready'].forEach((marker) => {
  assert.ok(wxss.includes(marker), `Expected custom-tab-bar/index.wxss to include ${marker}`);
});

assert.ok(
  /min-height:\s*7[0-9]rpx/.test(wxss),
  'Expected custom-tab-bar/index.wxss to reduce the tab item height to roughly 30% smaller'
);
assert.ok(
  /inset:\s*4rpx\s+11rpx/.test(wxss),
  'Expected custom-tab-bar/index.wxss to give the active background more vertical space'
);
assert.ok(
  /rgba\(0,\s*191,\s*255,\s*0\.0[45]\)/.test(wxss),
  'Expected custom-tab-bar/index.wxss to soften the active background border'
);
assert.ok(
  !/background\s+180ms\s+ease/.test(wxss),
  'Expected custom-tab-bar/index.wxss to avoid background transitions that can flicker'
);

const appWxss = read('app.wxss');
assert.ok(
  appWxss.includes('padding-bottom: 180rpx;'),
  'Expected app.wxss to reserve bottom padding for tab pages'
);
['home-page', 'forest-page', 'profile-page'].forEach((className) => {
  assert.ok(
    appWxss.includes(className),
    `Expected app.wxss to include bottom spacing for ${className}`
  );
});

[
  ['pages/home/home.js', 'getTabBar()', 'selected: 0'],
  ['pages/explore/explore.js', 'getTabBar()', 'selected: 1'],
  ['pages/profile/profile.js', 'getTabBar()', 'selected: 2']
].forEach(([filePath, getTabBarMarker, selectedMarker]) => {
  const content = read(filePath);
  assert.ok(content.includes(getTabBarMarker), `Expected ${filePath} to include ${getTabBarMarker}`);
  assert.ok(content.includes(selectedMarker), `Expected ${filePath} to include ${selectedMarker}`);
});

console.log('custom-tab-bar check passed.');
