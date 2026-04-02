const { SHARE_FAB_COPY } = require('./share-copy');
const { resolveSharePath } = require('./share-context');

const SHARE_HISTORY_KEY = 'drink1:share-fab-copy-history-v1';
const SHARE_HISTORY_LIMIT = 5;

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function interpolate(template, values) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : '';
  });
}

function pickRandom(list, seed) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }

  if (Number.isFinite(Number(seed))) {
    const index = Math.abs(Math.floor(Number(seed))) % list.length;
    return list[index];
  }

  return list[Math.floor(Math.random() * list.length)];
}

function normalizeRecentTitles(recentTitles) {
  if (!Array.isArray(recentTitles)) {
    return [];
  }

  return recentTitles
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, SHARE_HISTORY_LIMIT);
}

function getShareHistoryKey() {
  return SHARE_HISTORY_KEY;
}

function getPageCopyPools(pageName) {
  const safePageName = pageName && SHARE_FAB_COPY.pages[pageName] ? pageName : 'fallback';
  return SHARE_FAB_COPY.pages[safePageName] || SHARE_FAB_COPY.pages.fallback;
}

function buildCandidateTemplates(context, recentTitles, seed) {
  const pagePools = getPageCopyPools(context.pageName);
  const primaryTemplates = Array.isArray(pagePools[context.scene]) ? pagePools[context.scene].filter(Boolean) : [];
  const fallbackTemplates = Array.from(new Set([
    ...(SHARE_FAB_COPY.pages.fallback[context.scene] || []),
    ...(context.scene === 'challenge' ? SHARE_FAB_COPY.challenge : SHARE_FAB_COPY.progress),
    ...(SHARE_FAB_COPY.pages.fallback.challenge || []),
    ...(SHARE_FAB_COPY.pages.fallback.mid || []),
    ...(SHARE_FAB_COPY.pages.fallback.high || [])
  ].filter(Boolean)));
  const uniqueTemplates = primaryTemplates.length ? primaryTemplates : fallbackTemplates;
  const recentSet = new Set(normalizeRecentTitles(recentTitles));
  const values = {
    percent: Math.max(0, Math.round(toNumber(context.percent, 0))),
    progress: Math.max(0, Math.round(toNumber(context.percent, 0))),
    progressPercent: Math.max(0, Math.round(toNumber(context.percent, 0))),
    streak: Math.max(0, Math.round(toNumber(context.streakDays, 0))),
    streakDays: Math.max(0, Math.round(toNumber(context.streakDays, 0))),
    intake: Math.max(0, Math.round(toNumber(context.intake, 0)))
  };

  const rendered = uniqueTemplates.map((template) => ({
    template,
    text: interpolate(template, values)
  }));
  const fresh = rendered.filter((item) => !recentSet.has(item.text));
  let pool = fresh;

  if (!pool.length && primaryTemplates.length) {
    const fallbackRendered = fallbackTemplates.map((template) => ({
      template,
      text: interpolate(template, values)
    })).filter((item) => !recentSet.has(item.text));
    pool = fallbackRendered.length ? fallbackRendered : rendered;
  }

  if (!pool.length) {
    pool = rendered;
  }

  const selected = pickRandom(pool, seed) || pickRandom(rendered, seed) || {
    template: '今日补水进度 {{percent}}%，来看看我坚持得怎么样。',
    text: interpolate('今日补水进度 {{percent}}%，来看看我坚持得怎么样。', values)
  };

  return {
    text: selected.text,
    template: selected.template,
    values
  };
}

function buildShareContent(context, options) {
  const safeContext = context && typeof context === 'object' ? context : {};
  const safeOptions = options && typeof options === 'object' ? options : {};
  const selection = buildCandidateTemplates(
    safeContext,
    safeOptions.recentTitles,
    safeOptions.randomSeed
  );

  return {
    title: selection.text,
    text: selection.text,
    mode: safeContext.scene || 'low',
    scene: safeContext.scene || 'low',
    path: resolveSharePath(safeContext.pageName, safeContext.pagePath, safeContext.route)
  };
}

function normalizeShareHistory(history) {
  return normalizeRecentTitles(history);
}

function prependShareHistory(history, title) {
  const nextHistory = normalizeRecentTitles(history);
  const nextTitle = typeof title === 'string' ? title.trim() : '';
  if (!nextTitle) {
    return nextHistory;
  }

  return [nextTitle, ...nextHistory.filter((item) => item !== nextTitle)].slice(0, SHARE_HISTORY_LIMIT);
}

module.exports = {
  SHARE_HISTORY_LIMIT,
  buildShareContent,
  getShareHistoryKey,
  normalizeShareHistory,
  prependShareHistory
};
