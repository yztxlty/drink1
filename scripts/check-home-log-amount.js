#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const { resolveQuickLogAmount } = require(path.join(process.cwd(), 'utils/home'));

assert.strictEqual(
  resolveQuickLogAmount({ currentTarget: { dataset: {} } }, 250),
  250,
  'Tap events should fall back to the selected cup amount'
);

assert.strictEqual(
  resolveQuickLogAmount(333, 250),
  350,
  'Explicit quick amounts should still normalize to the nearest 50ml'
);

assert.strictEqual(
  resolveQuickLogAmount(null, 250),
  250,
  'Missing event payload should still use the selected cup amount'
);

console.log('Home log amount check passed.');
