#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');
const navigationBarJs = fs.readFileSync(path.join(root, 'components/navigation-bar/navigation-bar.js'), 'utf8');
const shareFabJs = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.js'), 'utf8');

assert.ok(Array.isArray(appJson.pages), 'app.json should expose pages');
assert.deepStrictEqual(
  appJson.pages.slice(0, 2),
  ['pages/login/login', 'pages/home/home'],
  'app.json should keep login first and home second'
);
assert.ok(
  !Object.prototype.hasOwnProperty.call(appJson, 'navigateToMiniProgramAppIdList'),
  'app.json should not declare navigateToMiniProgramAppIdList'
);

assert.ok(
  appJs.includes('wx.reLaunch({') && appJs.includes("url: '/pages/home/home'"),
  'app.js should relaunch to home when startup initialization fails'
);

assert.ok(
  !loginJs.includes('wx.getSystemInfoSync()'),
  'login.js should not use wx.getSystemInfoSync()'
);
assert.ok(
  !navigationBarJs.includes('wx.getSystemInfoSync()'),
  'navigation-bar.js should not use wx.getSystemInfoSync()'
);
assert.ok(
  !shareFabJs.includes('wx.getSystemInfoSync()'),
  'share-fab.js should not use wx.getSystemInfoSync()'
);

assert.ok(
  loginJs.includes('wx.getDeviceInfo()'),
  'login.js should use wx.getDeviceInfo() for platform detection'
);
assert.ok(
  navigationBarJs.includes('wx.getWindowInfo()') && navigationBarJs.includes('wx.getDeviceInfo()'),
  'navigation-bar.js should use modern window/device info APIs'
);
assert.ok(
  shareFabJs.includes('wx.getWindowInfo()'),
  'share-fab.js should use wx.getWindowInfo() for sizing and safe area'
);

console.log('App startup modernization check passed.');
