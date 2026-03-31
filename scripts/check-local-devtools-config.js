#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const configPath = path.join(root, 'project.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

assert.strictEqual(
  config.appid || '',
  '',
  'project.config.json should not pin a real AppID for local-first development'
);

console.log('Local devtools config check passed.');
