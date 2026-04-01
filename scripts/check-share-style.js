#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const wxssPath = path.join(root, 'pages/profile/profile.wxss');
const wxss = fs.readFileSync(wxssPath, 'utf8');

assert.ok(wxss.includes('backdrop-filter'), 'Expected pages/profile/profile.wxss to include backdrop-filter');
assert.ok(wxss.includes('linear-gradient'), 'Expected pages/profile/profile.wxss to include linear-gradient');

console.log('Share style check passed.');
