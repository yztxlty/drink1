const PAGE_PATHS = {
  home: '/pages/home/home',
  explore: '/pages/explore/explore',
  profile: '/pages/profile/profile'
};

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizePageName(pageName) {
  if (pageName === 'explore' || pageName === 'profile') {
    return pageName;
  }

  return 'home';
}

function resolveShareScene(pageName, percent, streakDays) {
  const safePercent = Math.max(0, Math.min(100, Math.round(toNumber(percent, 0))));
  const safeStreakDays = Math.max(0, Math.round(toNumber(streakDays, 0)));

  if (safePercent >= 100) {
    return 'complete';
  }

  if (safeStreakDays >= 3) {
    return 'challenge';
  }

  if (safePercent >= 80) {
    return 'high';
  }

  if (safePercent >= 35) {
    return 'mid';
  }

  if (pageName === 'profile' && safeStreakDays >= 3) {
    return 'challenge';
  }

  return 'low';
}

function resolveSharePath(pageName, pagePath, route) {
  if (typeof pagePath === 'string' && pagePath) {
    return pagePath;
  }

  const normalizedPageName = normalizePageName(pageName);
  if (PAGE_PATHS[normalizedPageName]) {
    return PAGE_PATHS[normalizedPageName];
  }

  if (typeof route === 'string' && route) {
    return route.startsWith('/') ? route : `/${route}`;
  }

  return PAGE_PATHS.home;
}

function resolveShareContext(input) {
  const source = input && typeof input === 'object' ? input : {};
  const store = source.store && typeof source.store === 'object' ? source.store : null;
  const pageName = normalizePageName(source.pageName);
  const homeViewModel = store && typeof store.getHomeViewModel === 'function' ? store.getHomeViewModel() || {} : {};
  const profileViewModel = store && typeof store.getProfileViewModel === 'function' ? store.getProfileViewModel() || {} : {};
  const forestViewModel = store && typeof store.getForestViewModel === 'function' ? store.getForestViewModel() || {} : {};

  const directPercent = toNumber(
    source.percent ?? source.progressPercent ?? source.shareProgressPercent,
    NaN
  );
  const fallbackPercent = pageName === 'explore'
    ? toNumber(forestViewModel.collectionProgress, NaN)
    : toNumber(homeViewModel.progressPercent, NaN);
  const percent = Number.isFinite(directPercent)
    ? directPercent
    : (Number.isFinite(fallbackPercent) ? fallbackPercent : 0);

  const directStreak = toNumber(source.streakDays ?? source.streak, NaN);
  const fallbackStreak = toNumber(homeViewModel.streakDays, NaN);
  const profileStreak = toNumber(profileViewModel.stats && profileViewModel.stats.streakDays, NaN);
  const streakDays = Number.isFinite(directStreak)
    ? directStreak
    : (Number.isFinite(fallbackStreak)
      ? fallbackStreak
      : (Number.isFinite(profileStreak) ? profileStreak : 0));

  const directIntake = toNumber(source.intake, NaN);
  const fallbackIntake = pageName === 'explore'
    ? toNumber(forestViewModel.todayTotal, NaN)
    : toNumber(homeViewModel.intake, NaN);
  const intake = Number.isFinite(directIntake)
    ? directIntake
    : (Number.isFinite(fallbackIntake) ? fallbackIntake : 0);

  return {
    pageName,
    pagePath: typeof source.pagePath === 'string' ? source.pagePath : '',
    route: typeof source.route === 'string' ? source.route : '',
    percent: Math.max(0, Math.round(percent)),
    streakDays: Math.max(0, Math.round(streakDays)),
    intake: Math.max(0, Math.round(intake)),
    scene: resolveShareScene(pageName, percent, streakDays)
  };
}

module.exports = {
  resolveShareContext,
  resolveSharePath,
  resolveShareScene
};
