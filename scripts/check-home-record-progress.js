#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const { buildTodayRecordViews } = require(path.join(process.cwd(), 'utils/home'));

const records = [
  {
    id: 'overflow-1',
    amount: 300,
    createdAt: '2026-03-31T02:00:00.000Z',
    dateKey: '2026-03-31',
    timeLabel: '10:00'
  },
  {
    id: 'latest',
    amount: 50,
    createdAt: '2026-03-31T06:00:00.000Z',
    dateKey: '2026-03-31',
    timeLabel: '14:00'
  },
  {
    id: 'early',
    amount: 400,
    createdAt: '2026-03-31T00:00:00.000Z',
    dateKey: '2026-03-31',
    timeLabel: '08:00'
  },
  {
    id: 'overflow-2',
    amount: 350,
    createdAt: '2026-03-31T04:00:00.000Z',
    dateKey: '2026-03-31',
    timeLabel: '12:00'
  }
];

const views = buildTodayRecordViews(records, 650);

function extractEndRgb(style) {
  const matches = [...style.matchAll(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/g)];
  const lastMatch = matches[matches.length - 1];
  return lastMatch ? lastMatch.slice(1, 4).map(Number) : null;
}

assert.strictEqual(views.length, 4, 'All today records should be preserved');
assert.strictEqual(views[0].id, 'latest', 'The newest record should be shown first');
assert.strictEqual(views[1].id, 'overflow-2', 'Records should be sorted from newest to oldest');
assert.strictEqual(views[2].id, 'overflow-1', 'Records should continue in descending time order');
assert.strictEqual(views[3].id, 'early', 'The oldest record should be last');
assert.strictEqual(views[0].progressTone, 'overflow', 'The latest record should be in overflow state');
assert.strictEqual(views[1].progressTone, 'overflow', 'Earlier overflow rows should stay in overflow state');
assert.strictEqual(views[2].progressTone, 'overflow', 'The overflow region should extend through the third row');
assert.strictEqual(views[3].progressTone, 'normal', 'Older rows should still stay below the target');
assert.notStrictEqual(
  views[0].progressStyle,
  views[1].progressStyle,
  'Later overflow rows should keep getting darker instead of sharing one fixed color'
);
assert.ok(
  extractEndRgb(views[0].progressStyle)[1] < extractEndRgb(views[1].progressStyle)[1] &&
  extractEndRgb(views[1].progressStyle)[1] < extractEndRgb(views[2].progressStyle)[1],
  'Later overflow rows should get progressively darker down the list'
);

console.log('Home record progress check passed.');
