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
  const loginWxml = fs.readFileSync(path.join(root, 'pages/login/login.wxml'), 'utf8');
  const loginJs = fs.readFileSync(path.join(root, 'pages/login/login.js'), 'utf8');

  const requiredMarkers = [
    'checkbox-group',
    'bindchange="onAgreementChange"',
    'disabled="{{loading || !agreed}}"',
    'agreed: true',
    'if (!this.data.agreed)'
  ];

  requiredMarkers.forEach((marker) => {
    if (!loginWxml.includes(marker) && !loginJs.includes(marker)) {
      addFailure(`Login page is missing required agreement behavior: ${marker}`);
    }
  });
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

function main() {
  checkAppRoutes();
  checkLocalAssetRefs();
  checkProjectConfig();
  checkHomepageStructure();
  checkHomeViewModel();
  checkHomeHydrationLogic();
  checkLoginAgreement();
  checkLoginHintRemoved();
  checkProfilePageClean();
  checkForestPageClean();
  checkPageStatusBars();
  checkCopyVocabulary();
  checkAuxiliaryCopy();

  if (failures.length) {
    console.error('Smoke check failed:');
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log('Smoke check passed.');
}

main();
