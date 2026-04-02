#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function clearModuleCache(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function loadFreshStore() {
  const root = process.cwd();
  [
    path.join(root, 'utils/store'),
    path.join(root, 'utils/storage'),
    path.join(root, 'utils/water'),
    path.join(root, 'utils/date'),
    path.join(root, 'utils/medals')
  ].forEach(clearModuleCache);

  return require(path.join(root, 'utils/store'));
}

const root = process.cwd();
const store = loadFreshStore();
const { COPY } = require(path.join(root, 'utils/copy'));
const forestWaterRhythm = require(path.join(root, 'utils/forest-water-rhythm'));
const exploreJs = fs.readFileSync(path.join(root, 'pages/explore/explore.js'), 'utf8');
const exploreWxml = fs.readFileSync(path.join(root, 'pages/explore/explore.wxml'), 'utf8');
const exploreWxss = fs.readFileSync(path.join(root, 'pages/explore/explore.wxss'), 'utf8');
const storeState = store.getStore();

assert.strictEqual(
  typeof (((storeState.business || {}).hydration || {}).totals || {}).today,
  'number',
  'Store should expose hydration.totals.today for the forest rhythm game'
);
assert.ok(
  exploreWxml.includes('{{oxygenValue}}'),
  'Explore page should bind the oxygen metric to the live oxygenValue field'
);
assert.ok(
  exploreWxml.includes('{{collectionLabel}}'),
  'Explore page should bind the collection metric to the live collectionLabel field'
);
assert.ok(
  exploreWxml.includes('{{dropCount}}'),
  'Explore page should bind the drop metric to the live dropCount field'
);
assert.ok(
  exploreWxml.includes('class="vessel-container"'),
  'Explore page should render the vessel container'
);
assert.ok(
  exploreWxml.includes('class="water-drop'),
  'Explore page should render draggable water drops'
);
assert.ok(
  COPY.forestWaterRhythm.emptyHint === '多喝水才能产生治愈水滴哦',
  'Shared copy should expose the empty hint for the forest rhythm game'
);
assert.ok(
  COPY.forest.summaryRulesTrigger === '计算规则',
  'Shared copy should expose the summary rules trigger text'
);
assert.ok(
  Array.isArray(COPY.forest.summaryRules) && COPY.forest.summaryRules.length === 3,
  'Shared copy should expose the three summary rules'
);
assert.ok(
  COPY.forest.summaryRules[1].includes('水滴融合'),
  'Shared copy should explain the merge-progress rule using live water-drop fusion state'
);
assert.strictEqual(
  forestWaterRhythm.getMergeProgress(4, 4),
  0,
  'Merge progress should start at 0% before any droplets are fused'
);
assert.strictEqual(
  forestWaterRhythm.getMergeProgress(4, 1),
  100,
  'Merge progress should reach 100% when all droplets have fused into one'
);
assert.strictEqual(
  forestWaterRhythm.getMergeProgress(4, 2),
  67,
  'Merge progress should increase as the remaining droplet count decreases'
);
assert.ok(
  exploreWxml.includes('{{gameCopy.emptyHint}}'),
  'Explore page should render the empty hint from shared copy'
);
assert.ok(
  exploreWxml.includes('summary-rules-trigger'),
  'Explore page should render the summary rules trigger'
);
assert.ok(
  exploreWxml.includes('{{summaryRulesTrigger}}'),
  'Explore page should render the summary rules trigger from shared copy'
);
assert.ok(
  exploreJs.includes('touchStart'),
  'Explore page should define touchStart()'
);
assert.ok(
  exploreJs.includes('touchMove'),
  'Explore page should define touchMove()'
);
assert.ok(
  exploreJs.includes('touchEnd'),
  'Explore page should define touchEnd()'
);
assert.ok(
  exploreJs.includes('showSummaryRules'),
  'Explore page should define showSummaryRules()'
);
assert.ok(
  exploreJs.includes('summaryRules: COPY.forest.summaryRules'),
  'Explore page should source the summary rules from shared copy'
);
assert.ok(
  exploreJs.includes('getMergeProgress'),
  'Explore page should use the live merge-progress helper'
);
assert.ok(
  exploreJs.includes('updateCollectionProgress'),
  'Explore page should recalculate merge progress when droplet state changes'
);
assert.ok(
  exploreJs.includes('wx.createInnerAudioContext'),
  'Explore page should prepare the pop audio feedback'
);
assert.ok(
  exploreJs.includes('/assets/audio/water-drop.mp3'),
  'Explore page should reference the real water-drop audio asset path'
);
assert.ok(
  exploreWxss.includes('cubic-bezier(0.175, 0.885, 0.320, 1.275)'),
  'Explore page should use the required elastic transition curve'
);
assert.ok(
  exploreWxss.includes('radial-gradient'),
  'Explore page should use radial gradients for the glass droplets'
);

console.log('Forest water rhythm game check passed.');
