#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const forestWxml = fs.readFileSync(path.join(root, 'pages/explore/explore.wxml'), 'utf8');
const forestJs = fs.readFileSync(path.join(root, 'pages/explore/explore.js'), 'utf8');

assert.strictEqual(
  forestWxml.includes('1240'),
  false,
  'Forest page should not render a hard-coded oxygen value'
);
assert.strictEqual(
  forestWxml.includes('65%'),
  false,
  'Forest page should not render a hard-coded collection progress'
);
assert.strictEqual(
  forestWxml.includes('800ml'),
  false,
  'Forest page should not render a hard-coded reminder amount'
);
assert.strictEqual(
  forestWxml.includes('分享'),
  false,
  'Forest page should not keep the share shortcut'
);
assert.strictEqual(
  forestWxml.includes('手册'),
  false,
  'Forest page should not keep the manual shortcut'
);
assert.strictEqual(
  forestWxml.includes('背包'),
  false,
  'Forest page should not keep the bag shortcut'
);
assert.strictEqual(
  forestWxml.includes('商店'),
  false,
  'Forest page should not keep the shop shortcut'
);
assert.strictEqual(
  forestWxml.includes('<page-status-strip'),
  true,
  'Forest page should render the shared top status strip'
);
assert.strictEqual(
  forestWxml.includes('actionLabel="{{statusBar.actionLabel}}"'),
  false,
  'Forest page should not render the top-right CTA from the status strip'
);
assert.strictEqual(
  forestWxml.includes('actionLabel=""'),
  true,
  'Forest page should explicitly hide the top-right status strip CTA'
);
assert.strictEqual(
  forestWxml.includes('{{collectionLabel}}'),
  true,
  'Forest page should render the collection label'
);
assert.strictEqual(
  forestWxml.includes('{{forestStatusHint}}'),
  true,
  'Forest page should render the forest status hint'
);
assert.strictEqual(
  forestWxml.includes('{{todayRemaining}}'),
  true,
  'Forest page should render the remaining amount'
);
assert.strictEqual(
  forestWxml.includes('{{todayTotal}}'),
  true,
  'Forest page should render the today total'
);
assert.strictEqual(
  forestWxml.includes('bindtap="navHome"'),
  true,
  'Forest page should keep the home navigation CTA'
);
assert.strictEqual(
  forestWxml.includes('forest-header'),
  false,
  'Forest page should remove the old header block'
);
assert.strictEqual(
  forestWxml.includes('terrain terrain-left'),
  false,
  'Forest page should remove the left green terrain layer from the water-drop stage'
);
assert.strictEqual(
  forestWxml.includes('terrain terrain-right'),
  false,
  'Forest page should remove the right green terrain layer from the water-drop stage'
);
assert.strictEqual(
  forestJs.includes('reminderText'),
  true,
  'Forest page should still consume the reminder text from the view model'
);

console.log('Forest page clean check passed.');
