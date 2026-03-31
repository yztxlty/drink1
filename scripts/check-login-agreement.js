#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');

assert.ok(
  loginWxml.includes('checkbox-group'),
  'Login page should use a checkbox group for privacy consent'
);
assert.ok(
  loginWxml.includes('bindchange="onAgreementChange"'),
  'Login page should react to checkbox changes'
);
assert.ok(
  loginWxml.includes('disabled="{{loading || !agreed}}"'),
  'Login button should be disabled until consent is checked'
);
assert.ok(
  loginJs.includes('agreed: true'),
  'Login page should default the consent checkbox to checked'
);
assert.ok(
  loginJs.includes('if (!this.data.agreed)'),
  'Login flow should block submission when consent is unchecked'
);

console.log('Login agreement check passed.');
