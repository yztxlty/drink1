#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const { COPY } = require(path.join(root, 'utils/copy'));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function expectIncludes(filePath, needle, message) {
  const content = read(filePath);
  assert.ok(content.includes(needle), message);
}

expectIncludes('pages/home/home.json', COPY.home.navTitle, 'Home navigation title should match shared copy');
expectIncludes('pages/profile/profile.json', COPY.profile.navTitle, 'Profile navigation title should match shared copy');
expectIncludes('pages/explore/explore.json', COPY.forest.navTitle, 'Forest navigation title should match shared copy');
expectIncludes('pages/login/login.json', COPY.login.navTitle, 'Login navigation title should match shared copy');
expectIncludes('pages/login-auth/login-auth.json', COPY.loginAuth.navTitle, 'Login auth navigation title should match shared copy');
expectIncludes('pages/settings/settings.json', COPY.settings.navTitle, 'Settings navigation title should match shared copy');
expectIncludes('pages/profile/edit.json', COPY.profileEdit.navTitle, 'Profile edit navigation title should match shared copy');
expectIncludes('pages/privacy/privacy.json', COPY.privacy.navTitle, 'Privacy navigation title should match shared copy');
expectIncludes('pages/about/about.json', COPY.about.navTitle, 'About navigation title should match shared copy');
expectIncludes('pages/medals/medals.json', COPY.medals.navTitle, 'Medals navigation title should match shared copy');

expectIncludes('pages/login/login.wxml', '{{copy.heroTitle}}', 'Login page should render its hero title from shared copy');
expectIncludes('pages/login/login.wxml', '{{copy.panelTitle}}', 'Login page should render its panel title from shared copy');
expectIncludes('pages/login/login.wxml', '{{copy.actionLabel}}', 'Login page should render its action label from shared copy');
expectIncludes('pages/login-auth/login-auth.wxml', '{{copy.heroTitle}}', 'Login auth page should render its hero title from shared copy');
expectIncludes('pages/login-auth/login-auth.wxml', '{{copy.panelTitle}}', 'Login auth page should render its panel title from shared copy');
expectIncludes('pages/login-auth/login-auth.wxml', '{{copy.actionLabel}}', 'Login auth page should render its action label from shared copy');

expectIncludes('pages/settings/settings.wxml', '{{copy.heroTitle}}', 'Settings page should render its hero title from shared copy');
expectIncludes('pages/profile/edit.wxml', 'copy.heroTitleFromLogin', 'Profile edit page should render the login-state hero copy from shared copy');
expectIncludes('pages/profile/edit.wxml', '{{copy.fieldLabel}}', 'Profile edit page should render its field label from shared copy');
expectIncludes('pages/privacy/privacy.wxml', '{{copy.heroTitle}}', 'Privacy page should render its hero title from shared copy');
expectIncludes('pages/about/about.wxml', '{{copy.productTitle}}', 'About page should render its product title from shared copy');
expectIncludes('pages/medals/medals.wxml', '{{copy.heroTitle}}', 'Medals page should render its hero title from shared copy');

expectIncludes('pages/profile/profile.wxml', 'wx:for="{{menuItems}}"', 'Profile page menu should be data-driven');
expectIncludes('pages/profile/profile.wxml', '{{copy.actionLabel}}', 'Profile export button should reuse the shared action label');
assert.ok(
  !read('pages/home/home.wxml').includes('actionLabel="{{statusBar.actionLabel}}"'),
  'Home page should hide the top-right quick action'
);
expectIncludes('pages/explore/explore.wxml', '{{statusBar.actionLabel}}', 'Forest quick action should reuse the shared action label');

console.log('Copy vocabulary check passed.');
