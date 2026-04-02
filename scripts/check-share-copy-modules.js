#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const root = process.cwd();
const shareContext = require(path.join(root, 'utils/share/share-context'));
const shareSelector = require(path.join(root, 'utils/share/share-selector'));

assert.strictEqual(typeof shareContext.resolveShareContext, 'function', 'Expected resolveShareContext to be exported');
assert.strictEqual(typeof shareContext.resolveSharePath, 'function', 'Expected resolveSharePath to be exported');
assert.strictEqual(typeof shareSelector.buildShareContent, 'function', 'Expected buildShareContent to be exported');
assert.strictEqual(typeof shareSelector.getShareHistoryKey, 'function', 'Expected getShareHistoryKey to be exported');

const context = shareContext.resolveShareContext({
  pageName: 'home',
  percent: 78,
  streak: 4,
  intake: 1560,
  pagePath: '/pages/home/home'
});

assert.strictEqual(context.pageName, 'home', 'Expected the page name to be preserved');
assert.strictEqual(context.scene, 'challenge', 'Expected home page share to resolve a challenge scene at high streak');
assert.strictEqual(context.percent, 78, 'Expected the live progress percent to be preserved');
assert.strictEqual(context.streakDays, 4, 'Expected the live streak to be preserved');

const firstShare = shareSelector.buildShareContent(context, {
  recentTitles: ['连续 4 天，继续冲刺'],
  randomSeed: 1
});

assert.ok(firstShare.title, 'Expected a share title to be generated');
assert.strictEqual(
  firstShare.title.includes('连续 4 天，继续冲刺'),
  false,
  'Expected the selector to avoid the most recent title when alternates exist'
);
assert.strictEqual(
  firstShare.title.includes('{{'),
  false,
  'Expected the selector to resolve all template placeholders'
);

const secondShare = shareSelector.buildShareContent(context, {
  recentTitles: [firstShare.title],
  randomSeed: 2
});

assert.ok(secondShare.title, 'Expected a second share title to be generated');
assert.notStrictEqual(
  secondShare.title,
  firstShare.title,
  'Expected a different title after the first one is recorded as recent'
);

console.log('Share copy module check passed.');
