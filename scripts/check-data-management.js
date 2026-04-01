#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const settingsWxml = fs.readFileSync(path.join(root, 'pages/settings/settings.wxml'), 'utf8');
const settingsJs = fs.readFileSync(path.join(root, 'pages/settings/settings.js'), 'utf8');
const dataManagementWxml = fs.readFileSync(path.join(root, 'pages/data-management/data-management.wxml'), 'utf8');
const dataManagementJs = fs.readFileSync(path.join(root, 'pages/data-management/data-management.js'), 'utf8');
const storeJs = fs.readFileSync(path.join(root, 'utils/store.js'), 'utf8');
const copyJs = fs.readFileSync(path.join(root, 'utils/copy.js'), 'utf8');

assert.ok(
  appJson.pages.includes('pages/data-management/data-management'),
  'App routes should include pages/data-management/data-management'
);

['js', 'json', 'wxml', 'wxss'].forEach((ext) => {
  const filePath = path.join(root, `pages/data-management/data-management.${ext}`);
  assert.ok(fs.existsSync(filePath), `Data management page file should exist: ${filePath}`);
});

assert.ok(
  settingsWxml.includes('bindtap="goDataManagement"'),
  'Settings page should provide a secondary entry for data management'
);
assert.ok(
  settingsJs.includes('goDataManagement()'),
  'Settings page should expose goDataManagement method'
);
assert.ok(
  dataManagementWxml.includes('bindtap="deleteTodayData"') && dataManagementWxml.includes('bindtap="clearHistoryData"'),
  'Data management actions should be tap-enabled'
);
assert.ok(
  dataManagementWxml.includes('class="pending-card glass-card"') && dataManagementWxml.includes('bindtap="confirmPendingAction"'),
  'Data management should render an inline pending confirmation card'
);
assert.ok(
  dataManagementWxml.includes('class="pending-header"') &&
    dataManagementWxml.includes('class="pending-badge"') &&
    dataManagementWxml.includes('系统级危险操作'),
  'Data management should expose a stronger system-level warning hierarchy'
);
assert.ok(
  dataManagementWxml.includes('class="weak-notice-floating show"'),
  'Data management should render a floating weak notice'
);
assert.ok(
  dataManagementJs.includes('promptPendingAction(') && dataManagementJs.includes('confirmPendingAction()'),
  'Data management should enforce inline second confirmation before irreversible actions'
);
assert.ok(
  dataManagementJs.includes('showWeakNotice('),
  'Data management should show weak success feedback after action completed'
);

assert.ok(
  storeJs.includes('function deleteTodayHydrationData()'),
  'Store should expose deleteTodayHydrationData for deleting today records'
);
assert.ok(
  storeJs.includes('function clearBusinessData()'),
  'Store should expose clearBusinessData for clearing business history data'
);

assert.ok(
  copyJs.includes('请慎重操作，删除后无法找回'),
  'Copy should include irreversible action warning text'
);

console.log('Data management check passed.');
