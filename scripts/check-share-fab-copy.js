#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const { COPY } = require(path.join(process.cwd(), 'utils/copy'));

assert.ok(COPY.shareFab, 'Expected COPY.shareFab to exist');
assert.ok(Array.isArray(COPY.shareFab.progress), 'Expected COPY.shareFab.progress to be an array');
assert.ok(Array.isArray(COPY.shareFab.challenge), 'Expected COPY.shareFab.challenge to be an array');
assert.ok(COPY.shareFab.progress.length >= 2, 'Expected multiple progress share copies');
assert.ok(COPY.shareFab.challenge.length >= 2, 'Expected multiple challenge share copies');
assert.ok(COPY.shareFab.pages, 'Expected COPY.shareFab.pages to exist');
assert.ok(Array.isArray(COPY.shareFab.pages.home.low), 'Expected home low share copy pool to exist');
assert.ok(Array.isArray(COPY.shareFab.pages.explore.mid), 'Expected explore mid share copy pool to exist');
assert.ok(Array.isArray(COPY.shareFab.pages.profile.challenge), 'Expected profile challenge share copy pool to exist');

console.log('Share fab copy check passed.');
