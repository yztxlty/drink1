#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

assert.ok(
  loginWxml.includes('bindtap="onLogin"'),
  'Login button should bind directly to the tap handler'
);
assert.ok(
  loginWxml.includes('disabled="{{loading}}"'),
  'Login button should only disable while loading'
);
assert.ok(
  !loginWxml.includes('disabled="{{loading || !agreed}}"'),
  'Login button should not block taps when consent is unchecked'
);
assert.ok(
  loginWxml.includes('checkbox-group'),
  'Login page should keep the privacy consent checkbox group'
);
assert.ok(
  loginJs.includes('if (!this.data.agreed)'),
  'Login flow should block unchecked consent with an explicit guard'
);
assert.ok(
  loginJs.includes('请先阅读并同意隐私协议'),
  'Login flow should show a clear toast when consent is missing'
);
assert.ok(
  loginJs.includes("wx.switchTab({"),
  'Login success should use wx.switchTab for the tabBar home page'
);
assert.ok(
  loginJs.includes("url: '/pages/home/home'"),
  'Login success should target the home tab page'
);
assert.ok(
  loginJs.includes('wx.getUserProfile(') || loginJs.includes('wx.getUserInfo('),
  'Login flow should request user profile directly from the click handler path'
);
assert.ok(
  !loginJs.includes('setTimeout('),
  'Login flow should not delay the permission request with setTimeout'
);
assert.ok(
  appJs.includes('store.initStore()'),
  'App launch should initialize the store on startup'
);

const mapsToHits = [];

function walk(dir) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) {
    return;
  }

  fs.readdirSync(fullDir, { withFileTypes: true }).forEach((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(relative);
      return;
    }

    if (relative === path.join('scripts', 'check-login-flow.js')) {
      return;
    }

    if (!/\.(js|json|wxml|wxss|ts|tsx)$/.test(entry.name)) {
      return;
    }

    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    if (content.includes('MapsTo')) {
      mapsToHits.push(relative);
    }
  });
}

walk('pages');
walk('components');
walk('utils');
walk('scripts');

if (fs.existsSync(path.join(root, 'app.js'))) {
  const appContent = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  if (appContent.includes('MapsTo')) {
    mapsToHits.push('app.js');
  }
}

assert.strictEqual(
  mapsToHits.length,
  0,
  `Do not use MapsTo for tab page navigation. Found in: ${mapsToHits.join(', ')}`
);

console.log('Login flow check passed.');
