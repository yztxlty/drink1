#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const { COPY } = require(path.join(process.cwd(), 'utils/copy'));

assert.ok(COPY.shareFab, 'Expected COPY.shareFab to exist');
assert.ok(Array.isArray(COPY.shareFab.progress), 'Expected COPY.shareFab.progress to be an array');
assert.ok(Array.isArray(COPY.shareFab.challenge), 'Expected COPY.shareFab.challenge to be an array');
assert.ok(COPY.shareFab.progress.length >= 2, 'Expected multiple progress share copies');
assert.ok(COPY.shareFab.challenge.length >= 2, 'Expected multiple challenge share copies');

console.log('Share fab copy check passed.');
