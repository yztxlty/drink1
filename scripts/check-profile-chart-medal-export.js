#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const profileWxml = fs.readFileSync(path.join(root, 'pages/profile/profile.wxml'), 'utf8');
const profileJs = fs.readFileSync(path.join(root, 'pages/profile/profile.js'), 'utf8');
const profileWxss = fs.readFileSync(path.join(root, 'pages/profile/profile.wxss'), 'utf8');
const { COPY } = require(path.join(root, 'utils/copy'));
const { MEDAL_DEFINITIONS } = require(path.join(root, 'utils/medals'));

assert.strictEqual(
  COPY.profile.actionLabel,
  '数据本地保存',
  'Profile export action label should be 数据本地保存'
);

assert.ok(
  profileWxml.includes('class="analysis-plot-area"'),
  'Profile chart should render unified plot area for bar and line coordinates'
);
assert.ok(
  profileWxml.includes('class="analysis-line-layer"') && profileWxml.includes('analysisChart.lineSvgStyle'),
  'Profile chart should render the trend layer as a background layer'
);

assert.ok(
  profileJs.includes('copyExportPath()'),
  'Profile page should expose copyExportPath method'
);
assert.ok(
  profileJs.includes('buildAnalysisLineSvg('),
  'Profile page should build the trend line as an SVG overlay'
);
assert.ok(
  profileJs.includes('lineSvgStyle'),
  'Profile page should expose the SVG background style for the trend layer'
);
assert.ok(
  profileJs.includes('shareExportFile()'),
  'Profile page should expose shareExportFile method for exporting outside sandbox'
);
assert.ok(
  profileJs.includes('saveExportToExternal()'),
  'Profile page should expose saveExportToExternal method for system-visible save'
);
assert.ok(
  profileJs.includes('handleExportPathTap()'),
  'Profile page should support double tap copy on exported path'
);
assert.ok(
  profileJs.includes('fs.readFileSync(filePath, \'utf8\')'),
  'Profile export should read the exported file back for strict verification'
);
assert.ok(
  profileJs.includes('JSON.parse(verifyContent)'),
  'Profile export should validate that exported JSON can be parsed'
);
assert.ok(
  profileWxss.includes('width: 170rpx;') && profileWxss.includes('height: 170rpx;'),
  'Profile medal showcase icon container should be enlarged for stronger visual presence'
);
assert.ok(
  profileWxml.includes('bindtap="shareExportFile"') && profileWxml.includes('bindtap="saveExportToExternal"'),
  'Profile export panel should provide share/save to external actions'
);

MEDAL_DEFINITIONS.forEach((medal) => {
  const icon = String(medal.icon || '');
  assert.ok(
    icon.startsWith('/assets/medals/'),
    `Medal icon must be under /assets/medals/: ${medal.id}`
  );

  const localPath = path.join(root, icon.replace(/^\//, ''));
  assert.ok(fs.existsSync(localPath), `Medal icon file should exist: ${icon}`);
});

console.log('Profile chart, medal assets and export flow check passed.');
