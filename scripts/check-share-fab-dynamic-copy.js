#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const root = process.cwd();
let componentConfig = null;

global.getApp = () => ({
  globalData: {
    store: {
      getHomeViewModel() {
        return {
          progressPercent: 42,
          streakDays: 1,
          intake: 1680
        };
      },
      getProfileViewModel() {
        return {
          stats: {
            streakDays: 1
          }
        };
      }
    }
  }
});

global.Component = (config) => {
  componentConfig = config;
};

require(path.join(root, 'components/share-fab/share-fab.js'));

assert.ok(componentConfig, 'Expected share-fab component to register');
assert.ok(componentConfig.methods, 'Expected share-fab component to expose methods');

const challengeCopy = componentConfig.methods.chooseShareCopy({
  percent: 12,
  streakDays: 5,
  intake: 1680
});
assert.ok(
  challengeCopy.text.includes('5'),
  'Challenge share copy should render the live streak value'
);
assert.strictEqual(
  challengeCopy.text.includes('{{'),
  false,
  'Challenge share copy should not keep unresolved placeholders'
);

const profileShareContent = componentConfig.methods.getShareContent.call({
  data: {
    pageName: 'profile',
    pagePath: '',
    percent: 42,
    streak: 1
  },
  resolveMetrics: componentConfig.methods.resolveMetrics,
  chooseShareCopy: componentConfig.methods.chooseShareCopy,
  resolveSharePath: componentConfig.methods.resolveSharePath,
  resolveStore: componentConfig.methods.resolveStore
});
assert.ok(
  profileShareContent.title.includes('42'),
  'Profile share content should use the live progress value from store fallback'
);
assert.strictEqual(
  profileShareContent.path,
  '/pages/profile/profile',
  'Profile share content should resolve the profile page path'
);

const exploreShareContent = componentConfig.methods.getShareContent.call({
  data: {
    pageName: 'explore',
    pagePath: '',
    percent: 42,
    streak: 1
  },
  resolveMetrics: componentConfig.methods.resolveMetrics,
  chooseShareCopy: componentConfig.methods.chooseShareCopy,
  resolveSharePath: componentConfig.methods.resolveSharePath,
  resolveStore: componentConfig.methods.resolveStore
});
assert.ok(
  exploreShareContent.title.includes('42'),
  'Explore share content should use the live progress value from store fallback'
);
assert.strictEqual(
  exploreShareContent.path,
  '/pages/explore/explore',
  'Explore share content should resolve the explore page path'
);

const progressCopy = componentConfig.methods.chooseShareCopy({
  percent: 42,
  streakDays: 1,
  intake: 840
});
assert.ok(
  progressCopy.text.includes('42'),
  'Progress share copy should render the live progress value'
);
assert.strictEqual(
  progressCopy.text.includes('{{'),
  false,
  'Progress share copy should not keep unresolved placeholders'
);

console.log('Share fab dynamic copy check passed.');
