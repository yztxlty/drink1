#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const js = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.wxml'), 'utf8');

assert.ok(
  js.includes('AUTO_COLLAPSE_DELAY = 5000'),
  'Expected share-fab.js to use a 5-second auto-collapse delay'
);

assert.ok(
  js.includes('deltaX'),
  'Expected share-fab.js to measure horizontal swipe distance'
);

assert.ok(
  js.includes('onTouchStart') && js.includes('onTouchMove'),
  'Expected share-fab.js to include touch gesture handlers'
);

assert.ok(
  wxml.trimStart().startsWith('<button') &&
    wxml.includes('class="share-fab-root') &&
    wxml.includes('open-type="share"') &&
    wxml.includes('bindtouchstart="onTouchStart"') &&
    wxml.includes('bindtouchmove="onTouchMove"'),
  'Expected the outermost share-fab node to be a transparent share button with touch handlers'
);

console.log('share-fab gesture check passed.');
