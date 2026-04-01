#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const componentDir = path.join(root, 'components/share-fab');
const jsPath = path.join(componentDir, 'share-fab.js');
const wxmlPath = path.join(componentDir, 'share-fab.wxml');
const wxssPath = path.join(componentDir, 'share-fab.wxss');
const jsonPath = path.join(componentDir, 'share-fab.json');

assert.ok(fs.existsSync(jsPath), 'Expected share-fab.js to exist');
assert.ok(fs.existsSync(wxmlPath), 'Expected share-fab.wxml to exist');
assert.ok(fs.existsSync(wxssPath), 'Expected share-fab.wxss to exist');
assert.ok(fs.existsSync(jsonPath), 'Expected share-fab.json to exist');

const js = fs.readFileSync(jsPath, 'utf8');
const wxml = fs.readFileSync(wxmlPath, 'utf8');
const wxss = fs.readFileSync(wxssPath, 'utf8');
const json = fs.readFileSync(jsonPath, 'utf8');

[
  'getShareContent',
  'toggleCollapsed',
  'onDragStart',
  'onDragMove',
  'onDragEnd',
  'onShareTap'
].forEach((marker) => {
  assert.ok(js.includes(marker), `Expected share-fab.js to include ${marker}`);
});

assert.ok(wxml.includes('open-type="share"'), 'Expected share-fab.wxml to use open-type="share"');
assert.ok(wxml.includes('bindtouchstart'), 'Expected share-fab.wxml to support dragging');
assert.ok(wxss.includes('backdrop-filter'), 'Expected share-fab.wxss to use backdrop-filter');
assert.ok(json.includes('"component": true'), 'Expected share-fab.json to register a component');

console.log('Share fab component check passed.');
