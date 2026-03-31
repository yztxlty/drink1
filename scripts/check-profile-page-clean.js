#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const profileWxml = fs.readFileSync(path.join(root, 'pages/profile/profile.wxml'), 'utf8');
const profileJs = fs.readFileSync(path.join(root, 'pages/profile/profile.js'), 'utf8');

assert.strictEqual(
  profileWxml.includes('auth-debug-card'),
  false,
  'Profile page should not render the raw authorization debug card'
);
assert.strictEqual(
  profileWxml.includes('微信授权信息'),
  false,
  'Profile page should not expose the authorization debug section title'
);
assert.strictEqual(
  profileJs.includes('wechatAuthInfo'),
  false,
  'Profile page should not keep the debug auth data structure'
);
assert.strictEqual(
  profileJs.includes('averageCompletion'),
  false,
  'Profile page should not keep the average completion summary field'
);
assert.strictEqual(
  profileWxml.includes('平均达成'),
  false,
  'Profile page should not show the average completion stat label'
);

console.log('Profile page clean check passed.');
