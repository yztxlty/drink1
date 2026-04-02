#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');
const loginAuthWxml = fs.readFileSync(path.join(root, 'pages/login-auth/login-auth.wxml'), 'utf8');
const loginAuthJs = fs.readFileSync(path.join(root, 'pages/login-auth/login-auth.js'), 'utf8');
const appJson = fs.readFileSync(path.join(root, 'app.json'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const store = require(path.join(root, 'utils/store.js'));

assert.ok(
  !loginWxml.includes('open-type="chooseAvatar"'),
  'Main login page should not render the avatar authorization control'
);
assert.ok(
  loginWxml.includes('bindtap="handleLogin"'),
  'Login button should handle login through an explicit tap event'
);
assert.ok(
  !loginWxml.includes('type="nickname"'),
  'Main login page should not render the nickname authorization input'
);
assert.ok(
  loginWxml.includes('disabled="{{loading}}"'),
  'Login button should only disable while loading'
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
  loginJs.includes("const LOGIN_AUTH_PAGE = '/pages/login-auth/login-auth'") && loginJs.includes('url: LOGIN_AUTH_PAGE'),
  'Main login page should route first-time users to the authorization page'
);
assert.ok(
  loginJs.includes('setLoginProfile'),
  'Main login page should use store.setLoginProfile when cached WeChat profile is available'
);
assert.ok(
  loginJs.includes('getLoginViewModel'),
  'Login page should read its initial state from store.getLoginViewModel()'
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
  loginJs.includes('resolveCachedWechatProfile'),
  'Main login page should resolve cached WeChat profile state before deciding the flow'
);
assert.ok(
  !loginJs.includes('onChooseAvatar'),
  'Main login page should not keep the avatar handler after the flow split'
);
assert.ok(
  loginJs.includes('handleLogin'),
  'Login page should submit with handleLogin'
);
assert.ok(
  !loginJs.includes('wx.getUserProfile('),
  'Login flow should stop using wx.getUserProfile'
);
assert.ok(
  !loginJs.includes('wx.setStorageSync'),
  'Login page should not write storage directly'
);
assert.ok(
  !loginJs.includes('setTimeout('),
  'Login flow should not delay the permission request with setTimeout'
);
assert.ok(
  appJson.includes('pages/login-auth/login-auth'),
  'App config should register the dedicated login authorization page'
);
assert.ok(
  appJs.includes('store.initStore('),
  'App launch should initialize the store on startup'
);

assert.ok(
  loginAuthWxml.includes('open-type="chooseAvatar"'),
  'Authorization page should use chooseAvatar for the avatar selector'
);
assert.ok(
  loginAuthWxml.includes('bindchooseavatar="onChooseAvatar"'),
  'Authorization page should bind the chooseAvatar callback'
);
assert.ok(
  loginAuthWxml.includes('type="nickname"'),
  'Authorization page should use the nickname input type'
);
assert.ok(
  loginAuthWxml.includes('bindinput="onNicknameChange"'),
  'Authorization page should sync the nickname immediately through onNicknameChange'
);
assert.ok(
  loginAuthWxml.includes('bindtap="handleAuthorize"'),
  'Authorization page should complete login through handleAuthorize'
);
assert.ok(
  loginAuthJs.includes('this.store.updateProfile'),
  'Authorization page should write avatar and nickname through store.updateProfile'
);
assert.ok(
  loginAuthJs.includes('resolveAuthorizationUserInfo'),
  'Authorization page should strip the local fallback nickname before showing the authorization input'
);
assert.ok(
  loginAuthJs.includes("url: '/pages/home/home'"),
  'Authorization page should switch to the home tab after success'
);

store.resetToDefault();
store.updateProfile({
  nickName: '微信昵称',
  avatarUrl: 'https://example.com/avatar.png',
  wechatLoginCode: 'wechat-code',
  loginProvider: 'wechat',
  isLoggedIn: true,
  syncWechatProfile: true
});

const loginViewModel = store.getLoginViewModel();
const profileViewModel = store.getProfileViewModel();

assert.strictEqual(
  loginViewModel.isLoggedIn,
  true,
  'Store login view model should mark the user as logged in after WeChat profile sync'
);
assert.strictEqual(
  profileViewModel.profile.wechatNickName,
  '微信昵称',
  'Store should merge the WeChat nickname into profile state'
);
assert.strictEqual(
  profileViewModel.profile.wechatAvatarUrl,
  'https://example.com/avatar.png',
  'Store should merge the WeChat avatar into profile state'
);
assert.strictEqual(
  profileViewModel.profile.nickName,
  '微信昵称',
  'Resolved profile nickname should follow the synced WeChat nickname'
);
assert.strictEqual(
  profileViewModel.profile.avatarUrl,
  'https://example.com/avatar.png',
  'Resolved profile avatar should follow the synced WeChat avatar'
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
