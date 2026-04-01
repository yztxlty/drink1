#!/usr/bin/env node

const assert = require('assert');

function createProfilePageHarness() {
  global.getApp = () => ({ globalData: { store: null } });
  global.Page = (cfg) => {
    cfg.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    global.__page = cfg;
  };
  global.wx = {
    showToast: () => {},
    vibrateShort: () => {},
    getStorageSync: () => false,
    setStorageSync: () => {}
  };

  require('../pages/profile/profile.js');
  return global.__page;
}

function extractLeftPercent(style) {
  const match = String(style || '').match(/left:\s*(?:calc\()?([0-9.]+)%/);
  return match ? Number(match[1]) : NaN;
}

function extractBottomPercent(style) {
  const match = String(style || '').match(/bottom:\s*(?:calc\()?([0-9.]+)%/);
  return match ? Number(match[1]) : NaN;
}

function decodeSvgDataUri(dataUri) {
  const raw = String(dataUri || '');
  const prefix = 'data:image/svg+xml;utf8,';
  if (!raw.startsWith(prefix)) {
    return '';
  }

  return decodeURIComponent(raw.slice(prefix.length));
}

const page = createProfilePageHarness();
const analysis = {
  targetMl: 2000,
  chart: {
    targetMl: 2000,
    periods: {
      week: [
        { label: '周一', amount: 100, completionRate: 0.05 },
        { label: '周二', amount: 300, completionRate: 0.15 },
        { label: '周三', amount: 500, completionRate: 0.25 }
      ]
    }
  }
};

const chart = page.buildAnalysisChart(analysis, 'week');

assert.strictEqual(chart.points.length, 3, 'Chart should keep all source points');
assert.strictEqual(chart.linePoints.length, 3, 'Chart should render one point per source point');
assert.strictEqual(chart.lineSegments.length, 2, 'Chart should render connecting segments between every adjacent point');
assert.ok(chart.lineSvg.startsWith('data:image/svg+xml;utf8,'), 'Chart should expose an SVG data URI for the trend layer');

const expectedCenters = [16.67, 50, 83.33];
const expectedPolylinePoints = chart.points
  .map((point) => `${Number(point.centerX).toFixed(2)},${(100 - Number(point.barPercent || 0)).toFixed(2)}`)
  .join(' ');

chart.linePoints.forEach((point, index) => {
  const left = extractLeftPercent(point.style);
  const bottom = extractBottomPercent(point.style);
  assert.ok(Number.isFinite(left), `Line point ${index} should expose a left coordinate`);
  assert.ok(Number.isFinite(bottom), `Line point ${index} should expose a bottom coordinate`);
  assert.ok(
    Math.abs(left - expectedCenters[index]) < 0.75,
    `Line point ${index} should sit near the center of its day cell`
  );
});

const decodedSvg = decodeSvgDataUri(chart.lineSvg);
assert.ok(decodedSvg.includes('<polyline'), 'Trend SVG should include a polyline');
assert.ok(
  decodedSvg.includes(`points="${expectedPolylinePoints}"`),
  'Trend SVG should include every point, including the latest day'
);
assert.ok(
  decodedSvg.includes('<line '),
  'Trend SVG should include the target guideline'
);
assert.ok(
  decodedSvg.includes('2000ml'),
  'Trend SVG should label the target guideline with the real daily target value'
);

console.log('Profile chart alignment check passed.');
