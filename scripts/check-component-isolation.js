#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const homeJs = fs.readFileSync(path.join(root, 'pages/home/home.js'), 'utf8');
const exploreJs = fs.readFileSync(path.join(root, 'pages/explore/explore.js'), 'utf8');
const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
const exploreWxml = fs.readFileSync(path.join(root, 'pages/explore/explore.wxml'), 'utf8');
const appJson = fs.readFileSync(path.join(root, 'app.json'), 'utf8');
const shareFabWxss = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.wxss'), 'utf8');

assert.ok(homeJs.includes('logWater'), 'Expected home.js to still contain logWater');
assert.ok(homeJs.includes('onShareAppMessage'), 'Expected home.js to expose onShareAppMessage');
assert.ok(exploreJs.includes('onShareAppMessage'), 'Expected explore.js to expose onShareAppMessage');
assert.ok(homeWxml.includes('<share-fab'), 'Expected home.wxml to render share-fab');
assert.ok(exploreWxml.includes('<share-fab'), 'Expected explore.wxml to render share-fab');
assert.ok(appJson.includes('share-fab'), 'Expected app.json to register share-fab globally');
assert.ok(shareFabWxss.includes('backdrop-filter'), 'Expected share-fab.wxss to use backdrop-filter');

console.log('Component isolation check passed.');
