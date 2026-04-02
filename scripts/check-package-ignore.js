#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const configPath = path.join(root, 'project.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ignoreItems = config.packOptions && Array.isArray(config.packOptions.ignore)
  ? config.packOptions.ignore
  : [];

function hasIgnoredFolder(folderPath) {
  return ignoreItems.some((item) => item.type === 'folder' && item.value === folderPath);
}

assert.ok(
  hasIgnoredFolder('.worktrees'),
  'project.config.json must ignore the .worktrees folder to keep mini program source size under the 4MB device-debug limit'
);

console.log('Package ignore check passed.');
