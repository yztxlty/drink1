#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');

function indexOfOrFail(marker) {
  const index = homeWxml.indexOf(marker);
  assert.notStrictEqual(
    index,
    -1,
    `Expected home.wxml to contain ${marker}`
  );
  return index;
}

const heroIndex = indexOfOrFail('class="home-hero glass-card"');
const actionIndex = indexOfOrFail('class="home-action-card glass-card"');
const historyIndex = indexOfOrFail('class="record-card glass-card home-history"');

assert.ok(heroIndex < actionIndex, 'Hero should appear before the action card');
assert.ok(actionIndex < historyIndex, 'Action card should appear before the history card');

assert.strictEqual(
  homeWxml.includes('class="insight-card"'),
  false,
  'Home page should remove the insight card'
);
assert.strictEqual(
  homeWxml.includes('class="status-row"'),
  false,
  'Home page should remove the status row'
);

assert.ok(
  homeWxml.includes('bindtap="logWater"'),
  'Home page should keep the primary drink action button'
);
assert.ok(
  homeWxml.includes('wx:if="{{visibleTodayRecords.length}}"'),
  'Home page should render a history empty state'
);
assert.ok(
  homeWxml.includes('{{todayRecordCount}} 次'),
  'Home page should render the today record count'
);
assert.ok(
  homeWxml.includes('bindscrolltolower="loadMoreTodayRecords"'),
  'Home page should support load more on scroll'
);
assert.ok(
  homeWxml.includes('bindtap="openCustomAmountPanel"'),
  'Home page should expose the custom amount entry'
);

console.log('Homepage structure check passed.');
