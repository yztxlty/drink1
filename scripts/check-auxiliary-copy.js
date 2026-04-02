#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const loginWxml = read('pages/login/login.wxml');
const loginJson = read('pages/login/login.json');
const loginAuthWxml = read('pages/login-auth/login-auth.wxml');
const loginAuthJson = read('pages/login-auth/login-auth.json');
const settingsWxml = read('pages/settings/settings.wxml');
const settingsJson = read('pages/settings/settings.json');
const editWxml = read('pages/profile/edit.wxml');
const editJson = read('pages/profile/edit.json');
const profileJs = read('pages/profile/profile.js');
const privacyWxml = read('pages/privacy/privacy.wxml');
const privacyJs = read('pages/privacy/privacy.js');
const privacyJson = read('pages/privacy/privacy.json');
const aboutWxml = read('pages/about/about.wxml');
const aboutJson = read('pages/about/about.json');
const medalsWxml = read('pages/medals/medals.wxml');
const medalsJson = read('pages/medals/medals.json');

assert.ok(loginWxml.includes('copy.heroDesc'), 'Login copy should mention the hydration archive');
assert.ok(loginWxml.includes('copy.panelTitle'), 'Login page should use hydration copy for the auth panel');
assert.ok(loginWxml.includes('copy.footerChips[0]'), 'Login footer should use hydration copy');
assert.ok(loginJson.includes('补水登录'), 'Login navigation title should use hydration copy');
assert.ok(loginAuthWxml.includes('copy.heroTitle'), 'Login auth page should use hydration copy');
assert.ok(loginAuthWxml.includes('copy.panelTitle'), 'Login auth page should use hydration copy for the auth panel');
assert.ok(loginAuthWxml.includes('copy.actionLabel'), 'Login auth page should use hydration copy for the authorize CTA');
assert.ok(loginAuthJson.includes('微信资料授权'), 'Login auth navigation title should use hydration copy');

assert.ok(settingsWxml.includes('copy.heroTitle'), 'Settings page should use hydration copy');
assert.ok(settingsWxml.includes('copy.dailyTargetTitle'), 'Settings page should label the daily target with hydration copy');
assert.ok(settingsWxml.includes('copy.saveLabel'), 'Settings page should use hydration copy for the save CTA');
assert.ok(settingsJson.includes('补水设置'), 'Settings navigation title should use hydration copy');

assert.ok(editWxml.includes('copy.heroTitleFromLogin'), 'Profile edit page should use hydration copy');
assert.ok(editWxml.includes('copy.fieldLabel'), 'Profile edit page should rename the motto field');
assert.ok(editWxml.includes('copy.restoreLabel'), 'Profile edit page should use hydration copy for restore action');
assert.ok(editJson.includes('编辑补水资料'), 'Profile edit navigation title should use hydration copy');

assert.ok(profileJs.includes('COPY.profile.menuItems'), 'Profile page should source its menu from shared copy');
assert.ok(profileJs.includes('COPY.profile.syncToast'), 'Profile page should source its sync toast from shared copy');

assert.ok(privacyWxml.includes('copy.heroTitle'), 'Privacy page should use hydration copy');
assert.ok(privacyWxml.includes('copy.ackTitle'), 'Privacy page should render the acknowledgment copy');
assert.ok(privacyJs.includes('COPY.privacy.sections'), 'Privacy page should source the sections from shared copy');
assert.ok(privacyJson.includes('补水隐私条款'), 'Privacy navigation title should use hydration copy');

assert.ok(aboutWxml.includes('copy.productTitle'), 'About page should use hydration copy');
assert.ok(aboutWxml.includes('copy.copyLabel'), 'About page should use hydration copy for feedback CTA');
assert.ok(aboutJson.includes('关于补水'), 'About navigation title should use hydration copy');

assert.ok(medalsWxml.includes('copy.heroTitle'), 'Medals page should use hydration copy');
assert.ok(medalsJson.includes('补水勋章'), 'Medals navigation title should use hydration copy');

console.log('Auxiliary page copy check passed.');
