#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const wxml = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'components/share-fab/share-fab.wxss'), 'utf8');

assert.ok(
  wxml.trimStart().startsWith('<button'),
  'Expected share-fab.wxml to be rooted by the share button'
);

assert.ok(wxss.includes('backdrop-filter'), 'Expected share-fab.wxss to include backdrop-filter');
assert.ok(wxml.includes('open-type="share"'), 'Expected share-fab.wxml to include open-type="share"');
assert.ok(wxss.includes('transition'), 'Expected share-fab.wxss to animate the reveal with transition');

console.log('share-fab UI check passed.');
