#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failures = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(root, filePath), 'utf8'));
}

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function walk(dir) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(relative);
    return [relative];
  });
}

function addFailure(message) {
  failures.push(message);
}

function checkAppRoutes() {
  const app = readJson('app.json');
  const pages = app.pages || [];

  pages.forEach((pagePath) => {
    ['.js', '.json', '.wxml', '.wxss'].forEach((ext) => {
      const filePath = `${pagePath}${ext}`;
      if (!exists(filePath)) {
        addFailure(`Missing page file: ${filePath}`);
      }
    });
  });

  const tabPages = ((app.tabBar && app.tabBar.list) || []).map((item) => item.pagePath);
  tabPages.forEach((pagePath) => {
    if (!pages.includes(pagePath)) {
      addFailure(`TabBar page is not registered in app.json pages: ${pagePath}`);
    }
  });
}

function checkCustomTabBar() {
  const scriptPath = path.join(root, 'scripts/check-custom-tab-bar.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing custom tab bar regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Custom tab bar regression check failed: ${error.message}`);
  }
}

function checkLocalAssetRefs() {
  const sourceFiles = walk('pages').concat(walk('components'));
  const assetRefPatterns = [
    /(?:src|url)\(\s*["']?(\/assets\/[^"')\s]+)["']?\s*\)/g,
    /(?:src|url)=["'](\/assets\/[^"']+)["']/g,
  ];

  const refs = new Set();

  sourceFiles
    .filter((file) => file.endsWith('.wxml') || file.endsWith('.wxss'))
    .forEach((file) => {
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      assetRefPatterns.forEach((pattern) => {
        for (const match of content.matchAll(pattern)) {
          refs.add(match[1]);
        }
      });
    });

  refs.forEach((assetPath) => {
    const normalized = assetPath.replace(/^\//, '');
    if (!exists(normalized)) {
      addFailure(`Missing referenced asset: ${assetPath}`);
    }
  });
}

function checkProjectConfig() {
  const projectConfig = readJson('project.config.json');
  if ((projectConfig.appid || '') !== '') {
    addFailure('project.config.json should keep appid empty for local-first development');
  }
}

function checkPackageIgnoreConfig() {
  const scriptPath = path.join(root, 'scripts/check-package-ignore.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing package ignore regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Package ignore regression check failed: ${error.message}`);
  }
}

function checkHomepageStructure() {
  const homeWxml = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8');
  const requiredMarkers = [
    'class="home-hero glass-card"',
    'class="home-action-card glass-card"',
    'class="record-card glass-card home-history"',
    'wx:if="{{visibleTodayRecords.length}}"',
    '{{todayRecordCount}} 次',
    'bindscrolltolower="loadMoreTodayRecords"',
    'bindtap="openCustomAmountPanel"',
    'bindtap="logWater"'
  ];

  requiredMarkers.forEach((marker) => {
    if (!homeWxml.includes(marker)) {
      addFailure(`Home page is missing required structure: ${marker}`);
    }
  });

  const forbiddenMarkers = [
    'class="insight-card"',
    'class="status-row"'
  ];

  forbiddenMarkers.forEach((marker) => {
    if (homeWxml.includes(marker)) {
      addFailure(`Home page should not contain removed structure: ${marker}`);
    }
  });

  const homeJs = fs.readFileSync(path.join(root, 'pages/home/home.js'), 'utf8');
  if (homeJs.includes('history: []')) {
    addFailure('Home page should not keep the old history state');
  }
}

function checkHomeViewModel() {
  const scriptPath = path.join(root, 'scripts/check-home-view-model.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing home view model regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Home view model regression check failed: ${error.message}`);
  }
}

function checkHomeHydrationLogic() {
  const scriptPath = path.join(root, 'scripts/check-home-hydration-logic.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing home hydration regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Home hydration regression check failed: ${error.message}`);
  }
}

function checkLoginAgreement() {
  const scriptPath = path.join(root, 'scripts/check-login-flow.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing login flow regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Login flow regression check failed: ${error.message}`);
  }
}

function checkLoginHintRemoved() {
  const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
  const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');

  const forbiddenMarkers = [
    'login-hint',
    '开发者工具不保证返回真实微信头像昵称，请优先在真机验证',
    'loginHint'
  ];

  forbiddenMarkers.forEach((marker) => {
    if (loginWxml.includes(marker) || loginJs.includes(marker)) {
      addFailure(`Login page should not contain removed hint content: ${marker}`);
    }
  });
}

function checkProfilePageClean() {
  const scriptPath = path.join(root, 'scripts/check-profile-page-clean.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing profile page clean regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Profile page clean regression check failed: ${error.message}`);
  }
}

function checkForestPageClean() {
  const scriptPath = path.join(root, 'scripts/check-forest-page-clean.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing forest page clean regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Forest page clean regression check failed: ${error.message}`);
  }
}

function checkForestWaterRhythmGame() {
  const scriptPath = path.join(root, 'scripts/check-forest-water-rhythm-game.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing forest water rhythm game regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Forest water rhythm game regression check failed: ${error.message}`);
  }
}

function checkPageStatusBars() {
  const scriptPath = path.join(root, 'scripts/check-page-status-bars.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing page status bar regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Page status bar regression check failed: ${error.message}`);
  }
}

function checkCopyVocabulary() {
  const scriptPath = path.join(root, 'scripts/check-copy-vocabulary.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing copy vocabulary regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Copy vocabulary regression check failed: ${error.message}`);
  }
}

function checkAuxiliaryCopy() {
  const scriptPath = path.join(root, 'scripts/check-auxiliary-copy.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing auxiliary page copy regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Auxiliary page copy regression check failed: ${error.message}`);
  }
}

function checkProfileDashboardAndMedalAssets() {
  const profileWxml = fs.readFileSync(path.join(root, 'pages/profile/profile.wxml'), 'utf8');
  const profileWxss = fs.readFileSync(path.join(root, 'pages/profile/profile.wxss'), 'utf8');
  const medalsWxml = fs.readFileSync(path.join(root, 'pages/medals/medals.wxml'), 'utf8');
  const medalsWxss = fs.readFileSync(path.join(root, 'pages/medals/medals.wxss'), 'utf8');
  const settingsWxml = fs.readFileSync(path.join(root, 'pages/settings/settings.wxml'), 'utf8');
  const { MEDAL_DEFINITIONS } = require(path.join(root, 'utils/medals'));
  const store = require(path.join(root, 'utils/store'));

  if (!profileWxml.includes('class="analysis-card glass-card"')) {
    addFailure('Profile page should render the hydration analysis card');
  }
  if (!profileWxml.includes('class="export-card glass-card"')) {
    addFailure('Profile page should render the export card');
  }
  if (!profileWxml.includes('bindtap="goToMedals"')) {
    addFailure('Profile page should link the medal preview to the medal page');
  }
  if (!medalsWxml.includes('class="medal-focus glass-card"')) {
    addFailure('Medal page should render the selected medal focus card');
  }
  if (!medalsWxml.includes('class="medal-gallery"')) {
    addFailure('Medal page should render the medal gallery');
  }
  if (profileWxss.includes('grayscale(') || medalsWxss.includes('grayscale(')) {
    addFailure('Medal showcase should keep icons in highlighted mode instead of grayscale');
  }
  if (!settingsWxml.includes('bindchanging="onGoalChanging"')) {
    addFailure('Settings page should expose live target slider updates');
  }
  if (!settingsWxml.includes('<quick-amount-manager')) {
    addFailure('Settings page should render the quick amount manager component');
  }
  if (!settingsJsonUsesQuickAmountComponent()) {
    addFailure('Settings page should register the quick amount manager component');
  }
  if (!store.exportHydrationData || typeof store.exportHydrationData !== 'function') {
    addFailure('Store should expose exportHydrationData()');
  }
  if (!MEDAL_DEFINITIONS.every((item) => typeof item.icon === 'string' && item.icon.startsWith('/assets/medals/'))) {
    addFailure('All medal definitions should point at the medal asset directory');
  }
}

function settingsJsonUsesQuickAmountComponent() {
  const settingsJson = readJson('pages/settings/settings.json');
  return Boolean(
    settingsJson &&
      settingsJson.usingComponents &&
      settingsJson.usingComponents['quick-amount-manager']
  );
}

function checkProfileChartMedalExportFlow() {
  const scriptPath = path.join(root, 'scripts/check-profile-chart-medal-export.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing profile chart/medal/export regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Profile chart/medal/export regression check failed: ${error.message}`);
  }
}

function checkHomeAiRecommendation() {
  const scriptPath = path.join(root, 'scripts/check-home-ai-recommendation.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing home AI recommendation regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Home AI recommendation regression check failed: ${error.message}`);
  }
}

function checkAppStartupModernization() {
  const scriptPath = path.join(root, 'scripts/check-app-startup-modernization.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing app startup modernization regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`App startup modernization regression check failed: ${error.message}`);
  }
}

function checkProfileChartAlignment() {
  const scriptPath = path.join(root, 'scripts/check-profile-chart-alignment.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing profile chart alignment regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Profile chart alignment regression check failed: ${error.message}`);
  }
}

function checkContactFeature() {
  const scriptPath = path.join(root, 'scripts/check-contact-feature.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing contact feature regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Contact feature regression check failed: ${error.message}`);
  }
}

function checkDataManagementFlow() {
  const scriptPath = path.join(root, 'scripts/check-data-management.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing data management regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Data management regression check failed: ${error.message}`);
  }
}

function checkDataManagementBehavior() {
  const scriptPath = path.join(root, 'scripts/check-data-management-behavior.js');
  if (!fs.existsSync(scriptPath)) {
    addFailure('Missing data management behavior regression check');
    return;
  }

  try {
    require(scriptPath);
  } catch (error) {
    addFailure(`Data management behavior regression check failed: ${error.message}`);
  }
}

function main() {
checkAppRoutes();
checkCustomTabBar();
checkLocalAssetRefs();
  checkProjectConfig();
  checkPackageIgnoreConfig();
  checkHomepageStructure();
  checkHomeViewModel();
  checkHomeHydrationLogic();
  checkLoginAgreement();
  checkLoginHintRemoved();
checkProfilePageClean();
checkForestPageClean();
checkForestWaterRhythmGame();
checkPageStatusBars();
  checkCopyVocabulary();
  checkAuxiliaryCopy();
  checkProfileDashboardAndMedalAssets();
  checkProfileChartMedalExportFlow();
  checkHomeAiRecommendation();
  checkAppStartupModernization();
  checkProfileChartAlignment();
  checkContactFeature();
  checkDataManagementFlow();
  checkDataManagementBehavior();

  if (failures.length) {
    console.error('Smoke check failed:');
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log('Smoke check passed.');
}

main();
