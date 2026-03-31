#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');

assert.strictEqual(
  loginWxml.includes('login-hint'),
  false,
  'Login page should not render the inline hint block'
);
assert.strictEqual(
  loginJs.includes('开发者工具不保证返回真实微信头像昵称，请优先在真机验证'),
  false,
  'Login page should not keep the devtools warning copy'
);
assert.strictEqual(
  loginJs.includes('loginHint'),
  false,
  'Login page should not keep inline hint state'
);

console.log('Login hint removal check passed.');
