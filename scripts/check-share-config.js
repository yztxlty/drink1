#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const homeJs = fs.readFileSync(path.join(root, 'pages/home/home.js'), 'utf8');
const profileJs = fs.readFileSync(path.join(root, 'pages/profile/profile.js'), 'utf8');
const appJson = fs.readFileSync(path.join(root, 'app.json'), 'utf8');

function expectIncludes(source, marker, fileName) {
  assert.ok(
    source.includes(marker),
    `Expected ${fileName} to include ${marker}`
  );
}

expectIncludes(homeJs, 'onShareAppMessage', 'pages/home/home.js');
expectIncludes(homeJs, 'onShareTimeline', 'pages/home/home.js');
expectIncludes(profileJs, 'onShareAppMessage', 'pages/profile/profile.js');
expectIncludes(profileJs, 'onShareTimeline', 'pages/profile/profile.js');

expectIncludes(homeJs, '/pages/home/home', 'pages/home/home.js');
expectIncludes(profileJs, '/pages/home/home', 'pages/profile/profile.js');

assert.strictEqual(
  appJson.includes('disableShare'),
  false,
  'app.json should not disable sharing'
);

console.log('Share config check passed.');
