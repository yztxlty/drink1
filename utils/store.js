const { getDateKey, getTimeLabel, getTodayKey, toDate } = require('./date');
const { COPY } = require('./copy');
const { MEDAL_DEFINITIONS, evaluateMedals } = require('./medals');
const { clone, readStorage, writeStorage } = require('./storage');
const { buildTodayRecordViews } = require('./home');
const {
  buildDailySummaries,
  getHydrationQuality,
  getHydrationStatus,
  normalizeWaterAmount,
  normalizeWaterRecord
} = require('./water');

const STORAGE_KEY = 'drink1:state';
const WECHAT_PROFILE_KEY = 'drink1:wechatProfile';
const STATE_VERSION = 2;
const DEFAULT_DAILY_TARGET = 2000;
const DEFAULT_QUICK_AMOUNTS = [150, 250, 500];
const DEFAULT_PROFILE = {
  userId: 'local-user',
  nickName: '补水计划用户',
  avatarUrl: '',
  motto: '用每一口水滋养今天',
  isLoggedIn: false,
  loginProvider: 'local',
  lastLoginAt: '',
  updatedAt: '',
  wechatNickName: '',
  wechatAvatarUrl: '',
  wechatLoginCode: '',
  customNickName: '',
  customAvatarUrl: '',
  customProfileLocked: false,
  nicknameCustomized: false,
  avatarCustomized: false
};
const DEFAULT_SETTINGS = {
  dailyTarget: DEFAULT_DAILY_TARGET,
  quickAmounts: DEFAULT_QUICK_AMOUNTS,
  selectedCupAmount: 250,
  reminderEnabled: true,
  reminderIntervalMinutes: 120,
  wakeupTime: '08:00',
  sleepTime: '22:30',
  privacyAccepted: false
};
function nowIsoString() {
  return new Date().toISOString();
}

function normalizeQuickAmounts(quickAmounts) {
  const source = Array.isArray(quickAmounts) ? quickAmounts : DEFAULT_QUICK_AMOUNTS;
  const normalized = source
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  return normalized.length
    ? Array.from(new Set(normalized)).sort((left, right) => left - right)
    : DEFAULT_QUICK_AMOUNTS.slice();
}

function buildDefaultState() {
  const generatedAt = nowIsoString();

  return {
    version: STATE_VERSION,
    profile: clone(DEFAULT_PROFILE),
    settings: clone(DEFAULT_SETTINGS),
    session: {
      lastOpenAt: generatedAt,
      lastSyncAt: '',
      hasSeenOnboarding: false
    },
    hydration: {
      records: [],
      daily: {},
      streak: {
        current: 0,
        longest: 0,
        lastQualifiedDateKey: ''
      },
      totals: {
        today: 0,
        totalAmount: 0,
        totalRecords: 0,
        completedDays: 0,
        activeDays: 0,
        averageCompletionRate: 0,
        morningRecords: 0,
        nightRecords: 0
      }
    },
    achievements: {
      progress: {},
      unlockedIds: [],
      unlockedCount: 0,
      newlyUnlocked: [],
      lastEvaluatedAt: '',
      catalogVersion: 1
    },
    meta: {
      createdAt: generatedAt,
      updatedAt: generatedAt
    }
  };
}

function normalizeProfile(profile) {
  const source = profile || {};
  const wechatNickName = typeof source.wechatNickName === 'string' ? source.wechatNickName : '';
  const wechatAvatarUrl = typeof source.wechatAvatarUrl === 'string' ? source.wechatAvatarUrl : '';
  const wechatLoginCode = typeof source.wechatLoginCode === 'string' ? source.wechatLoginCode : '';
  const customNickName = typeof source.customNickName === 'string' ? source.customNickName : '';
  const customAvatarUrl = typeof source.customAvatarUrl === 'string' ? source.customAvatarUrl : '';
  const customProfileLocked = Boolean(source.customProfileLocked);
  const nicknameCustomized = Boolean(source.nicknameCustomized && customNickName);
  const avatarCustomized = Boolean(source.avatarCustomized && customAvatarUrl);
  const fallbackNickName = typeof source.nickName === 'string' && source.nickName ? source.nickName : DEFAULT_PROFILE.nickName;
  const fallbackAvatarUrl = typeof source.avatarUrl === 'string' ? source.avatarUrl : '';
  const resolvedNickName = customProfileLocked && nicknameCustomized
    ? customNickName
    : (wechatNickName || fallbackNickName);
  const resolvedAvatarUrl = customProfileLocked && avatarCustomized
    ? customAvatarUrl
    : (wechatAvatarUrl || fallbackAvatarUrl);

  return {
    ...DEFAULT_PROFILE,
    ...source,
    nickName: resolvedNickName,
    avatarUrl: resolvedAvatarUrl,
    wechatNickName,
    wechatAvatarUrl,
    wechatLoginCode,
    customNickName,
    customAvatarUrl,
    customProfileLocked,
    nicknameCustomized,
    avatarCustomized,
    isLoggedIn: Boolean(source.isLoggedIn),
    loginProvider: source.loginProvider || DEFAULT_PROFILE.loginProvider,
    lastLoginAt: source.lastLoginAt || DEFAULT_PROFILE.lastLoginAt,
    updatedAt: source.updatedAt || DEFAULT_PROFILE.updatedAt,
    motto: typeof source.motto === 'string' && source.motto ? source.motto : DEFAULT_PROFILE.motto
  };
}

function resolveProfile(profile) {
  const safeProfile = normalizeProfile(profile);
  const profileSource = safeProfile.customProfileLocked
    ? 'manual'
    : (safeProfile.isLoggedIn ? 'wechat' : 'local');

  return {
    ...safeProfile,
    displayNickName: safeProfile.customProfileLocked && safeProfile.nicknameCustomized && safeProfile.customNickName
      ? safeProfile.customNickName
      : safeProfile.nickName,
    displayAvatarUrl: safeProfile.customProfileLocked && safeProfile.avatarCustomized && safeProfile.customAvatarUrl
      ? safeProfile.customAvatarUrl
      : safeProfile.avatarUrl,
    hasCustomName: Boolean(safeProfile.customProfileLocked && safeProfile.nicknameCustomized && safeProfile.customNickName),
    hasCustomAvatar: Boolean(safeProfile.customProfileLocked && safeProfile.avatarCustomized && safeProfile.customAvatarUrl),
    profileSource
  };
}

function normalizeSettings(settings) {
  const safeSettings = settings || {};
  const quickAmounts = normalizeQuickAmounts(safeSettings.quickAmounts);
  const selectedCupAmount = Number(safeSettings.selectedCupAmount);
  const incomingDailyTarget = Number(
    Number.isFinite(Number(safeSettings.dailyTarget))
      ? safeSettings.dailyTarget
      : safeSettings.dailyGoal
  );
  const fallbackSelectedCup = quickAmounts.includes(selectedCupAmount)
    ? selectedCupAmount
    : quickAmounts[1] || quickAmounts[0];

  return {
    ...DEFAULT_SETTINGS,
    ...safeSettings,
    dailyTarget: incomingDailyTarget > 0 ? incomingDailyTarget : DEFAULT_DAILY_TARGET,
    quickAmounts,
    selectedCupAmount: fallbackSelectedCup,
    reminderEnabled: safeSettings.reminderEnabled !== false,
    reminderIntervalMinutes: Number(safeSettings.reminderIntervalMinutes) > 0
      ? Number(safeSettings.reminderIntervalMinutes)
      : DEFAULT_SETTINGS.reminderIntervalMinutes,
    privacyAccepted: Boolean(safeSettings.privacyAccepted)
  };
}

function createMedalContext(derivedHydration) {
  return {
    totalRecords: derivedHydration.totals.totalRecords,
    totalAmount: derivedHydration.totals.totalAmount,
    completedDays: derivedHydration.totals.completedDays,
    currentStreak: derivedHydration.streak.current,
    morningRecords: derivedHydration.totals.morningRecords,
    nightRecords: derivedHydration.totals.nightRecords,
    generatedAt: nowIsoString()
  };
}

function getDateRangeKey(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offsetDays);
  return getDateKey(date);
}

function formatExportTimestamp(isoString) {
  return isoString
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .replace('Z', '');
}

function getDateByOffset(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function getDailyAmount(daily, dateKey) {
  return Number((daily[dateKey] && daily[dateKey].total) || 0);
}

function buildWeekSeries(daily, dailyTarget) {
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  const points = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = getDateByOffset(-offset);
    const dateKey = getDateKey(date);
    const amount = getDailyAmount(daily, dateKey);
    points.push({
      label: `周${labels[date.getDay()]}`,
      dateKey,
      amount,
      completionRate: dailyTarget > 0 ? amount / dailyTarget : 0
    });
  }

  return points;
}

function buildMonthSeries(daily, dailyTarget) {
  const points = [];

  for (let group = 5; group >= 0; group -= 1) {
    let totalAmount = 0;
    const offsets = [];
    for (let offset = group * 5 + 4; offset >= group * 5; offset -= 1) {
      const date = getDateByOffset(-offset);
      const dateKey = getDateKey(date);
      offsets.push(date);
      totalAmount += getDailyAmount(daily, dateKey);
    }

    const startDate = offsets[0];
    const endDate = offsets[offsets.length - 1];
    const averageAmount = Math.round(totalAmount / 5);
    points.push({
      label: `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getDate()}`,
      amount: averageAmount,
      completionRate: dailyTarget > 0 ? averageAmount / dailyTarget : 0
    });
  }

  return points;
}

function buildYearSeries(daily, dailyTarget) {
  const points = [];
  const now = new Date();
  const dailyEntries = Object.keys(daily || {});

  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const daysInMonth = Math.max(1, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate());
    let totalAmount = 0;

    dailyEntries.forEach((dateKey) => {
      const date = toDate(dateKey);
      if (date >= monthStart && date < nextMonthStart) {
        totalAmount += getDailyAmount(daily, dateKey);
      }
    });

    const averageAmount = Math.round(totalAmount / daysInMonth);
    points.push({
      label: `${monthStart.getMonth() + 1}月`,
      amount: averageAmount,
      completionRate: dailyTarget > 0 ? averageAmount / dailyTarget : 0
    });
  }

  return points;
}

function getDisplayStreakDays(state) {
  const streak = state && state.hydration && state.hydration.streak ? state.hydration.streak : {};
  const activeCurrent = Number(streak.activeCurrent);
  if (Number.isFinite(activeCurrent) && activeCurrent > 0) {
    return activeCurrent;
  }

  const current = Number(streak.current);
  return Number.isFinite(current) && current > 0 ? current : 0;
}

function buildProfileAnalysis(state) {
  const totals = state.hydration.totals || {};
  const daily = state.hydration.daily || {};
  const dailyTarget = Number(state.settings.dailyTarget) || DEFAULT_DAILY_TARGET;
  const totalAmount = Number(totals.totalAmount) || 0;
  const totalRecords = Number(totals.totalRecords) || 0;
  const activeDays = Number(totals.activeDays) || 0;
  const streakDays = getDisplayStreakDays(state);
  const averageCup = totalRecords > 0 ? Math.round(totalAmount / totalRecords) : 0;
  const averageDaily = activeDays > 0 ? Math.round(totalAmount / activeDays) : 0;
  let recentCompletedDays = 0;
  let recentTotalAmount = 0;
  let dominantPeriod = '全天';
  const morningRecords = Number(totals.morningRecords) || 0;
  const nightRecords = Number(totals.nightRecords) || 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const entry = daily[getDateRangeKey(offset)];
    if (entry) {
      recentTotalAmount += Number(entry.total) || 0;
      if (entry.completed) {
        recentCompletedDays += 1;
      }
    }
  }

  if (morningRecords > nightRecords) {
    dominantPeriod = '早晨';
  } else if (nightRecords > morningRecords) {
    dominantPeriod = '夜间';
  }

  const summary = streakDays >= 7
    ? '你的补水习惯已经稳定成型，当前节奏值得继续保持。'
    : (recentCompletedDays >= 4
      ? '最近一周的补水节奏比较稳定，建议继续保持当前安排。'
      : '补水节奏还在形成中，建议固定几个容易执行的时间点。');

  const suggestion = averageCup < Number(state.settings.selectedCupAmount || 0)
    ? `把单次容量固定在 ${state.settings.selectedCupAmount} ml，能让记录更稳定。`
    : (recentCompletedDays >= 5
      ? `保持最近 7 天中 ${dominantPeriod} 时段的补水习惯，连续性会更好。`
      : '先把每天至少一杯水的习惯固定下来，再逐步拉高总量。');

  return {
    totalLitres: (totalAmount / 1000).toFixed(1),
    averageDaily: `${(averageDaily / 1000).toFixed(1)}L`,
    averageCup: `${averageCup} ml`,
    recentCompletion: `${recentCompletedDays}/7`,
    recentTotal: `${(recentTotalAmount / 1000).toFixed(1)}L`,
    dominantPeriod,
    targetMl: dailyTarget,
    chart: {
      targetMl: dailyTarget,
      periods: {
        week: buildWeekSeries(daily, dailyTarget),
        month: buildMonthSeries(daily, dailyTarget),
        year: buildYearSeries(daily, dailyTarget)
      }
    },
    summary,
    suggestion
  };
}

function buildExportPayload(state) {
  const exportedAt = nowIsoString();

  return {
    filename: `drink1-export-${formatExportTimestamp(exportedAt)}.json`,
    exportedAt,
    payload: {
      schemaVersion: 1,
      exportedAt,
      profile: clone(state.profile),
      settings: clone(state.settings),
      hydration: clone(state.hydration),
      achievements: clone(state.achievements),
      meta: clone(state.meta)
    }
  };
}

function decorateState(state) {
  const records = (state.hydration.records || [])
    .map(normalizeWaterRecord)
    .filter(Boolean)
    .sort((left, right) => toDate(right.createdAt) - toDate(left.createdAt));
  const derivedHydration = buildDailySummaries(records, state.settings.dailyTarget);
  const achievements = evaluateMedals(
    createMedalContext(derivedHydration),
    state.achievements
  );

  return {
    ...state,
    version: STATE_VERSION,
    hydration: {
      records,
      daily: derivedHydration.daily,
      streak: derivedHydration.streak,
      totals: derivedHydration.totals
    },
    achievements: {
      ...achievements,
      catalogVersion: 1
    },
    meta: {
      ...state.meta,
      updatedAt: nowIsoString()
    }
  };
}

function normalizeState(rawState) {
  const defaults = buildDefaultState();
  const source = rawState && typeof rawState === 'object' ? rawState : {};

  return decorateState({
    ...defaults,
    ...source,
    profile: normalizeProfile(source.profile),
    settings: normalizeSettings(source.settings),
    session: {
      ...defaults.session,
      ...(source.session || {})
    },
    hydration: {
      ...defaults.hydration,
      ...(source.hydration || {}),
      records: Array.isArray(source.hydration && source.hydration.records) ? source.hydration.records : []
    },
    achievements: {
      ...defaults.achievements,
      ...(source.achievements || {})
    },
    meta: {
      ...defaults.meta,
      ...(source.meta || {})
    }
  });
}

function getStateSnapshot() {
  return normalizeState(readStorage(STORAGE_KEY));
}

let cachedState = null;

function persistState(nextState) {
  cachedState = normalizeState(nextState);
  writeStorage(STORAGE_KEY, cachedState);
  return cachedState;
}

function ensureState() {
  if (!cachedState) {
    cachedState = getStateSnapshot();
    writeStorage(STORAGE_KEY, cachedState);
  }

  return cachedState;
}

function updateState(updater) {
  const currentState = ensureState();
  const nextState = typeof updater === 'function' ? updater(clone(currentState)) : updater;
  return persistState(nextState);
}

function getForestMetrics(state) {
  const totalAmount = state.hydration.totals.totalAmount;
  const unlockedCount = state.achievements.unlockedCount;
  const currentStreak = state.hydration.streak.current;
  const oxygen = Math.round(totalAmount * 0.6 + unlockedCount * 80 + currentStreak * 35);
  const forestLevel = Math.max(1, Math.floor(totalAmount / 3000) + 1);
  const collectionProgress = MEDAL_DEFINITIONS.length
    ? Math.round((unlockedCount / MEDAL_DEFINITIONS.length) * 100)
    : 0;

  return {
    oxygen,
    forestLevel,
    collectionProgress
  };
}

function getRecentRecords(records, limit) {
  return records.slice(0, limit).map((record) => ({
    ...record,
    amountLabel: `${record.amount}ml`,
    amountDisplay: `${record.amount} ml`,
    timeDisplay: record.timeLabel
  }));
}

function getTodayRecords(records, todayKey) {
  return records
    .filter((record) => (record.dateKey || getDateKey(record.createdAt)) === todayKey)
    .map((record) => ({
      ...record,
      amountLabel: `${record.amount}ml`
    }));
}

function buildHeroStat(todayStatus, streakDays) {
  if (todayStatus.level === 'overflow' || todayStatus.level === 'severe_overflow') {
    return {
      label: todayStatus.level === 'severe_overflow' ? '超标提醒' : '超出目标',
      value: `${todayStatus.overflowAmount} ml`
    };
  }

  if (todayStatus.isComplete) {
    return {
      label: '今日达标',
      value: '100%'
    };
  }

  return {
    label: '连续天数',
    value: `${streakDays} 天`
  };
}

function getHomeViewModel() {
  const state = ensureState();
  const todayKey = getTodayKey();
  const profile = resolveProfile(state.profile);
  const profileName = profile.displayNickName || DEFAULT_PROFILE.nickName;
  const today = state.hydration.daily[todayKey] || {
    total: 0,
    target: state.settings.dailyTarget,
    completionRate: 0,
    remaining: state.settings.dailyTarget,
    recordCount: 0
  };
  const forest = getForestMetrics(state);
  const todayRecords = buildTodayRecordViews(
    getTodayRecords(state.hydration.records, todayKey),
    state.settings.dailyTarget
  );
  const todayStatus = getHydrationStatus(today.total, state.settings.dailyTarget);
  const heroStat = buildHeroStat(todayStatus, getDisplayStreakDays(state));
  const statusBar = {
    tone: todayStatus.level,
    title: COPY.home.statusTitle,
    subtitle: todayStatus.hint,
    metricValue: `${today.total} ml`,
    metricLabel: `/ ${state.settings.dailyTarget} ml`,
    actionLabel: COPY.home.actionLabel
  };

  return {
    profileName,
    profileAvatarUrl: profile.displayAvatarUrl || '',
    intake: today.total,
    progressDegree: Math.min(Math.round(today.completionRate * 360), 360),
    progressPercent: Math.round(today.completionRate * 100),
    selectedCup: state.settings.selectedCupAmount,
    quickAmounts: state.settings.quickAmounts,
    todayRecords,
    todayRecordCount: today.recordCount,
    dailyTarget: state.settings.dailyTarget,
    remaining: today.remaining,
    streakDays: getDisplayStreakDays(state),
    completedDays: state.hydration.totals.completedDays,
    qualityLabel: getHydrationQuality(today.completionRate),
    todayStatus,
    heroStatLabel: heroStat.label,
    heroStatValue: heroStat.value,
    todayGoalText: todayStatus.label,
    plantLevel: forest.forestLevel,
    unlockedMedalCount: state.achievements.unlockedCount,
    totalLitres: (state.hydration.totals.totalAmount / 1000).toFixed(1),
    statusBar
  };
}

function getForestViewModel() {
  const state = ensureState();
  const forest = getForestMetrics(state);
  const today = state.hydration.daily[getTodayKey()] || {
    remaining: state.settings.dailyTarget,
    total: 0
  };
  const isCompleted = today.remaining <= 0;
  const statusBar = {
    tone: isCompleted ? 'forest-complete' : 'forest',
    title: COPY.forest.statusTitle,
    subtitle: isCompleted
      ? '补水节奏已达标，森林正在舒展生长'
      : `补水越稳，森林越茂盛 · 还差 ${today.remaining} ml`,
    metricValue: `${forest.oxygen}`,
    metricLabel: '当前氧气',
    actionLabel: COPY.forest.actionLabel
  };

  return {
    forestStatusLabel: isCompleted ? '今日守护完成' : '今日成长中',
    forestStatusHint: isCompleted
      ? '继续保持补水节奏，森林会更茂盛'
      : `距离完成还差 ${today.remaining} ml`,
    plants: [
      {
        id: 1,
        name: '云雾杉',
        level: Math.max(1, Math.min(30, Math.ceil(forest.forestLevel * 1.5))),
        unlocked: true,
        positionClass: 'pos1',
        toneClass: 'tone-forest',
        stemClass: 'stem-tall',
        canopyClass: 'canopy-tall'
      },
      {
        id: 2,
        name: '星光草',
        level: Math.max(1, Math.min(30, Math.ceil(state.hydration.streak.current / 2) + 2)),
        unlocked: state.achievements.unlockedIds.includes('goal_once'),
        positionClass: 'pos2',
        toneClass: 'tone-sky',
        stemClass: 'stem-short',
        canopyClass: 'canopy-round'
      }
    ],
    oxygenValue: forest.oxygen,
    collectionProgress: forest.collectionProgress,
    collectionLabel: `${forest.collectionProgress}%`,
    unlockedMedalCount: state.achievements.unlockedCount,
    todayRemaining: today.remaining,
    todayTotal: today.total,
    forestLevel: forest.forestLevel,
    reminderText: today.remaining > 0
      ? `今日还需补水 ${today.remaining}ml 完成守护目标`
      : '今日守护目标已完成，继续保持补水节奏',
    statusBar
  };
}

function getProfileViewModel() {
  const state = ensureState();
  const profile = resolveProfile(state.profile);
  const analysis = buildProfileAnalysis(state);
  const streakDays = getDisplayStreakDays(state);
  const statusBar = {
    tone: profile.profileSource === 'manual' ? 'profile-manual' : 'profile',
    title: COPY.profile.statusTitle,
    subtitle: profile.profileSource === 'manual'
      ? '手动资料与进度正在同步'
      : (profile.profileSource === 'wechat' ? '微信资料与进度已同步' : '资料与进度保持同步'),
    metricValue: `${streakDays}`,
    metricLabel: '连续天数',
    actionLabel: ''
  };

  return {
    badges: MEDAL_DEFINITIONS.map((definition) => {
      const progress = state.achievements.progress[definition.id] || {
        current: 0,
        target: definition.target,
        unlocked: false,
        completionRate: 0
      };

      return {
        id: definition.id,
        name: definition.name,
        icon: definition.icon,
        description: definition.description,
        category: definition.category,
        target: definition.target,
        unlocked: progress.unlocked,
        progressCurrent: progress.current,
        progressTarget: progress.target,
        progressText: `${Math.min(progress.current, progress.target)}/${progress.target}`,
        completionRate: progress.completionRate,
        progressPercent: Math.round(progress.completionRate * 100)
      };
    }),
    profile: clone(profile),
    stats: {
      streakDays,
      averageCompletion: `${Math.round(state.hydration.totals.averageCompletionRate * 100)}%`,
      totalLitres: (state.hydration.totals.totalAmount / 1000).toFixed(1),
      unlockedMedalCount: state.achievements.unlockedCount
    },
    analysis,
    settings: clone(state.settings),
    session: clone(state.session),
    statusBar
  };
}

function exportHydrationData() {
  return buildExportPayload(ensureState());
}

function addWaterRecord(amount, extra) {
  const safeAmount = normalizeWaterAmount(amount);
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    throw new Error('INVALID_WATER_AMOUNT');
  }

  const createdAt = extra && extra.createdAt ? extra.createdAt : nowIsoString();
  const previousState = ensureState();
  const previousToday = previousState.hydration.daily[getTodayKey()] || {
    total: 0,
    target: previousState.settings.dailyTarget
  };
  const nextState = updateState((state) => {
    // 记录只保留结构化字段，后续二次开发可以直接扩展 source、note 等维度。
    state.hydration.records.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: safeAmount,
      source: (extra && extra.source) || 'manual',
      note: (extra && extra.note) || '',
      createdAt,
      dateKey: getDateKey(createdAt),
      timeLabel: getTimeLabel(createdAt)
    });
    state.session.lastOpenAt = nowIsoString();
    return state;
  });

  return {
    state: nextState,
    home: getHomeViewModel(),
    forest: getForestViewModel(),
    profile: getProfileViewModel(),
    newlyUnlocked: nextState.achievements.newlyUnlocked,
    goalCelebration: previousToday.total < previousToday.target &&
      (nextState.hydration.daily[getTodayKey()] || { total: 0, target: nextState.settings.dailyTarget }).total >= nextState.settings.dailyTarget
      ? {
          medalName: (nextState.achievements.newlyUnlocked.find((item) => item.id === 'goal_once') || nextState.achievements.newlyUnlocked[0] || { name: '今日达标' }).name,
          message: `恭喜你今日补水已达标，获得${(nextState.achievements.newlyUnlocked.find((item) => item.id === 'goal_once') || nextState.achievements.newlyUnlocked[0] || { name: '今日达标' }).name}勋章`,
          isGoalUnlocked: true
        }
      : null
  };
}

function setSelectedCupAmount(amount) {
  const safeAmount = normalizeWaterAmount(amount);
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    return ensureState();
  }

  return updateState((state) => {
    if (!state.settings.quickAmounts.includes(safeAmount)) {
      state.settings.quickAmounts = normalizeQuickAmounts([...state.settings.quickAmounts, safeAmount]);
    }
    state.settings.selectedCupAmount = safeAmount;
    return state;
  });
}

function updateSettings(partialSettings) {
  return updateState((state) => {
    state.settings = normalizeSettings({
      ...state.settings,
      ...(partialSettings || {})
    });
    return state;
  });
}

function markPrivacyAccepted(accepted) {
  return updateSettings({
    privacyAccepted: Boolean(accepted)
  });
}

function getLoginViewModel() {
  const state = ensureState();
  const profile = resolveProfile(state.profile);

  return {
    profile: clone(profile),
    userInfo: {
      nickName: profile.displayNickName || '',
      avatarUrl: profile.displayAvatarUrl || '',
      motto: profile.motto || ''
    },
    privacyAccepted: state.settings.privacyAccepted,
    isLoggedIn: state.profile.isLoggedIn
  };
}

function setLoginProfile(profile) {
  return updateState((state) => {
    const incoming = profile || {};
    const syncWechatProfile = incoming.syncWechatProfile !== false;
    const nextIncomingNickName = typeof incoming.nickName === 'string' ? incoming.nickName.trim() : '';
    const nextIncomingAvatarUrl = typeof incoming.avatarUrl === 'string' ? incoming.avatarUrl.trim() : '';
    const nextIncomingLoginCode = typeof incoming.loginCode === 'string'
      ? incoming.loginCode.trim()
      : (typeof incoming.authCode === 'string'
        ? incoming.authCode.trim()
        : (typeof incoming.code === 'string' ? incoming.code.trim() : ''));
    const nextWechatNickName = syncWechatProfile && nextIncomingNickName
      ? nextIncomingNickName
      : state.profile.wechatNickName;
    const nextWechatAvatarUrl = syncWechatProfile && nextIncomingAvatarUrl
      ? nextIncomingAvatarUrl
      : state.profile.wechatAvatarUrl;
    const nextWechatLoginCode = syncWechatProfile && nextIncomingLoginCode
      ? nextIncomingLoginCode
      : state.profile.wechatLoginCode;
    const nextProfile = {
      ...state.profile,
      userId: incoming.userId || state.profile.userId || DEFAULT_PROFILE.userId,
      wechatNickName: nextWechatNickName,
      wechatAvatarUrl: nextWechatAvatarUrl,
      wechatLoginCode: nextWechatLoginCode,
      isLoggedIn: true,
      loginProvider: incoming.loginProvider || 'wechat',
      lastLoginAt: nowIsoString(),
      updatedAt: nowIsoString()
    };

    if (nextIncomingNickName) {
      nextProfile.nickName = nextIncomingNickName;
    } else if (!nextProfile.nicknameCustomized) {
      nextProfile.nickName = nextWechatNickName || state.profile.nickName || DEFAULT_PROFILE.nickName;
    }

    if (nextIncomingAvatarUrl) {
      nextProfile.avatarUrl = nextIncomingAvatarUrl;
    } else if (!nextProfile.avatarCustomized) {
      nextProfile.avatarUrl = nextWechatAvatarUrl || state.profile.avatarUrl || '';
    }

    state.profile = normalizeProfile(nextProfile);
    if (syncWechatProfile && (nextWechatNickName || nextWechatAvatarUrl || nextWechatLoginCode)) {
      writeStorage(WECHAT_PROFILE_KEY, {
        nickName: nextWechatNickName,
        avatarUrl: nextWechatAvatarUrl,
        loginCode: nextWechatLoginCode,
        updatedAt: nowIsoString()
      });
    }
    return state;
  });
}

function updateProfile(partialProfile) {
  return updateState((state) => {
    const incoming = partialProfile || {};
    const nextProfile = {
      ...state.profile
    };
    const shouldSyncWechatProfile = incoming.loginProvider === 'wechat' || incoming.syncWechatProfile === true;
    const hasWechatNickName = Object.prototype.hasOwnProperty.call(incoming, 'wechatNickName');
    const hasWechatAvatarUrl = Object.prototype.hasOwnProperty.call(incoming, 'wechatAvatarUrl');
    const nextWechatNickName = hasWechatNickName ? String(incoming.wechatNickName || '').trim() : '';
    const nextWechatAvatarUrl = hasWechatAvatarUrl ? String(incoming.wechatAvatarUrl || '').trim() : '';

    if (Object.prototype.hasOwnProperty.call(incoming, 'nickName') || hasWechatNickName) {
      const nextNickName = String(incoming.nickName || '').trim();
      const resolvedWechatNickName = nextWechatNickName || nextNickName;
      if (shouldSyncWechatProfile && nextNickName) {
        nextProfile.wechatNickName = resolvedWechatNickName;
        nextProfile.customNickName = '';
        nextProfile.nicknameCustomized = false;
        nextProfile.customProfileLocked = Boolean(nextProfile.avatarCustomized);
        nextProfile.nickName = resolvedWechatNickName;
      } else if (shouldSyncWechatProfile && resolvedWechatNickName) {
        nextProfile.wechatNickName = resolvedWechatNickName;
        nextProfile.customNickName = '';
        nextProfile.nicknameCustomized = false;
        nextProfile.customProfileLocked = Boolean(nextProfile.avatarCustomized);
        nextProfile.nickName = resolvedWechatNickName;
      } else {
        nextProfile.customNickName = nextNickName;
        nextProfile.nicknameCustomized = nextNickName.length > 0;
        nextProfile.customProfileLocked = nextProfile.nicknameCustomized || nextProfile.avatarCustomized || Boolean(nextProfile.customProfileLocked);
        nextProfile.nickName = nextProfile.nicknameCustomized
          ? nextNickName
          : (nextProfile.wechatNickName || DEFAULT_PROFILE.nickName);
      }
    }

    if (Object.prototype.hasOwnProperty.call(incoming, 'avatarUrl') || hasWechatAvatarUrl) {
      const nextAvatarUrl = String(incoming.avatarUrl || '').trim();
      const resolvedWechatAvatarUrl = nextWechatAvatarUrl || nextAvatarUrl;
      if (shouldSyncWechatProfile && nextAvatarUrl) {
        nextProfile.wechatAvatarUrl = resolvedWechatAvatarUrl;
        nextProfile.customAvatarUrl = '';
        nextProfile.avatarCustomized = false;
        nextProfile.customProfileLocked = Boolean(nextProfile.nicknameCustomized);
        nextProfile.avatarUrl = resolvedWechatAvatarUrl;
      } else if (shouldSyncWechatProfile && resolvedWechatAvatarUrl) {
        nextProfile.wechatAvatarUrl = resolvedWechatAvatarUrl;
        nextProfile.customAvatarUrl = '';
        nextProfile.avatarCustomized = false;
        nextProfile.customProfileLocked = Boolean(nextProfile.nicknameCustomized);
        nextProfile.avatarUrl = resolvedWechatAvatarUrl;
      } else {
        nextProfile.customAvatarUrl = nextAvatarUrl;
        nextProfile.avatarCustomized = nextAvatarUrl.length > 0;
        nextProfile.customProfileLocked = nextProfile.nicknameCustomized || nextProfile.avatarCustomized || Boolean(nextProfile.customProfileLocked);
        nextProfile.avatarUrl = nextProfile.avatarCustomized
          ? nextAvatarUrl
          : (nextProfile.wechatAvatarUrl || '');
      }
    }

    if (Object.prototype.hasOwnProperty.call(incoming, 'motto')) {
      nextProfile.motto = String(incoming.motto || '').trim() || DEFAULT_PROFILE.motto;
    }

    if (Object.prototype.hasOwnProperty.call(incoming, 'wechatLoginCode')) {
      nextProfile.wechatLoginCode = String(incoming.wechatLoginCode || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(incoming, 'loginProvider') && incoming.loginProvider) {
      nextProfile.loginProvider = incoming.loginProvider;
    }

    if (incoming.isLoggedIn === true || incoming.loginProvider === 'wechat') {
      nextProfile.isLoggedIn = true;
      nextProfile.lastLoginAt = nowIsoString();
    }

    nextProfile.updatedAt = nowIsoString();
    state.profile = normalizeProfile(nextProfile);

    // 登录页只负责收集资料，微信资料缓存应由 store 统一持久化，避免页面层越过状态层直接写本地存储。
    if (shouldSyncWechatProfile && (nextProfile.wechatNickName || nextProfile.wechatAvatarUrl || nextProfile.wechatLoginCode)) {
      writeStorage(WECHAT_PROFILE_KEY, {
        nickName: nextProfile.wechatNickName,
        avatarUrl: nextProfile.wechatAvatarUrl,
        loginCode: nextProfile.wechatLoginCode,
        updatedAt: nextProfile.updatedAt
      });
    }

    return state;
  });
}

function restoreWechatProfile() {
  return updateState((state) => {
    const cachedWechatProfile = readStorage(WECHAT_PROFILE_KEY) || {};
    const cachedWechatNickName = typeof cachedWechatProfile.nickName === 'string'
      ? cachedWechatProfile.nickName.trim()
      : '';
    const cachedWechatAvatarUrl = typeof cachedWechatProfile.avatarUrl === 'string'
      ? cachedWechatProfile.avatarUrl.trim()
      : '';
    const cachedWechatLoginCode = typeof cachedWechatProfile.loginCode === 'string'
      ? cachedWechatProfile.loginCode.trim()
      : '';
    const nextProfile = {
      ...state.profile,
      customNickName: '',
      customAvatarUrl: '',
      customProfileLocked: false,
      nicknameCustomized: false,
      avatarCustomized: false,
      nickName: cachedWechatNickName || state.profile.wechatNickName || DEFAULT_PROFILE.nickName,
      avatarUrl: cachedWechatAvatarUrl || state.profile.wechatAvatarUrl || '',
      wechatLoginCode: cachedWechatLoginCode || state.profile.wechatLoginCode || '',
      updatedAt: nowIsoString()
    };

    state.profile = normalizeProfile(nextProfile);
    return state;
  });
}

function logout() {
  return updateState((state) => {
    state.profile = normalizeProfile({
      ...state.profile,
      isLoggedIn: false,
      loginProvider: 'local',
      lastLoginAt: '',
      updatedAt: nowIsoString()
    });
    return state;
  });
}

function syncSessionHeartbeat() {
  return updateState((state) => {
    state.session.lastOpenAt = nowIsoString();
    return state;
  });
}

function deleteTodayHydrationData() {
  const todayKey = getTodayKey();
  return updateState((state) => {
    state.hydration.records = (state.hydration.records || []).filter((record) => {
      const recordDateKey = record.dateKey || getDateKey(record.createdAt);
      return recordDateKey !== todayKey;
    });
    state.session.lastOpenAt = nowIsoString();
    return state;
  });
}

function clearBusinessData() {
  return updateState((state) => {
    state.hydration.records = [];
    state.achievements = {
      progress: {},
      unlockedIds: [],
      unlockedCount: 0,
      newlyUnlocked: [],
      lastEvaluatedAt: '',
      catalogVersion: 1
    };
    state.session.lastOpenAt = nowIsoString();
    return state;
  });
}

function buildUserStore(state) {
  const profile = resolveProfile(state.profile);

  return {
    userId: profile.userId,
    nickName: profile.nickName,
    avatarUrl: profile.avatarUrl,
    motto: profile.motto,
    isLoggedIn: profile.isLoggedIn,
    loginProvider: profile.loginProvider,
    lastLoginAt: profile.lastLoginAt,
    updatedAt: profile.updatedAt,
    wechatNickName: profile.wechatNickName,
    wechatAvatarUrl: profile.wechatAvatarUrl,
    wechatLoginCode: profile.wechatLoginCode,
    customNickName: profile.customNickName,
    customAvatarUrl: profile.customAvatarUrl,
    profileSource: profile.profileSource
  };
}

function buildConfigStore(settings) {
  return clone({
    dailyTarget: settings.dailyTarget,
    quickAmounts: settings.quickAmounts,
    selectedCupAmount: settings.selectedCupAmount,
    reminderEnabled: settings.reminderEnabled,
    reminderIntervalMinutes: settings.reminderIntervalMinutes,
    wakeupTime: settings.wakeupTime,
    sleepTime: settings.sleepTime,
    privacyAccepted: settings.privacyAccepted
  });
}

function buildBusinessStore(state) {
  return clone({
    session: state.session,
    hydration: state.hydration,
    achievements: state.achievements
  });
}

function initStore() {
  ensureState();
  return getStore();
}

function resetToDefault() {
  cachedState = buildDefaultState();
  writeStorage(STORAGE_KEY, cachedState);
  return getStore();
}

function getStore() {
  const state = ensureState();

  return {
    user: buildUserStore(state),
    config: buildConfigStore(state.settings),
    business: buildBusinessStore(state)
  };
}

function updateStore(partialStore) {
  const incoming = partialStore || {};

  if (incoming.user) {
    const userPatch = incoming.user;
    const loginPayload = {};

    if (Object.prototype.hasOwnProperty.call(userPatch, 'nickName')) {
      loginPayload.nickName = userPatch.nickName;
    } else if (Object.prototype.hasOwnProperty.call(userPatch, 'wechatNickName')) {
      loginPayload.nickName = userPatch.wechatNickName;
    }

    if (Object.prototype.hasOwnProperty.call(userPatch, 'avatarUrl')) {
      loginPayload.avatarUrl = userPatch.avatarUrl;
    } else if (Object.prototype.hasOwnProperty.call(userPatch, 'wechatAvatarUrl')) {
      loginPayload.avatarUrl = userPatch.wechatAvatarUrl;
    }

    if (Object.prototype.hasOwnProperty.call(userPatch, 'wechatLoginCode')) {
      loginPayload.loginCode = userPatch.wechatLoginCode;
    } else if (Object.prototype.hasOwnProperty.call(userPatch, 'loginCode')) {
      loginPayload.loginCode = userPatch.loginCode;
    }

    if (Object.prototype.hasOwnProperty.call(userPatch, 'loginProvider')) {
      loginPayload.loginProvider = userPatch.loginProvider;
    }

    if (Object.keys(loginPayload).length || userPatch.isLoggedIn === true) {
      if (Object.prototype.hasOwnProperty.call(userPatch, 'userId')) {
        loginPayload.userId = userPatch.userId;
      }
      setLoginProfile(loginPayload);
    }

    if (Object.prototype.hasOwnProperty.call(userPatch, 'motto')) {
      updateProfile({
        motto: userPatch.motto
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(userPatch, 'customNickName') ||
      Object.prototype.hasOwnProperty.call(userPatch, 'customAvatarUrl')
    ) {
      const customProfilePatch = {};
      if (Object.prototype.hasOwnProperty.call(userPatch, 'customNickName')) {
        customProfilePatch.nickName = userPatch.customNickName;
      }
      if (Object.prototype.hasOwnProperty.call(userPatch, 'customAvatarUrl')) {
        customProfilePatch.avatarUrl = userPatch.customAvatarUrl;
      }
      updateProfile(customProfilePatch);
    }

    if (userPatch.isLoggedIn === false) {
      logout();
    }
  }

  if (incoming.config) {
    updateSettings(incoming.config);
  }

  if (incoming.business) {
    updateState((state) => {
      if (incoming.business.session) {
        state.session = {
          ...state.session,
          ...clone(incoming.business.session)
        };
      }

      if (incoming.business.hydration) {
        state.hydration = {
          ...state.hydration,
          ...clone(incoming.business.hydration)
        };
      }

      if (incoming.business.achievements) {
        state.achievements = {
          ...state.achievements,
          ...clone(incoming.business.achievements)
        };
      }

      return state;
    });
  }

  return getStore();
}

function clearUserStore() {
  updateState((state) => {
    state.profile = normalizeProfile({
      ...DEFAULT_PROFILE,
      updatedAt: nowIsoString()
    });
    return state;
  });
  writeStorage(WECHAT_PROFILE_KEY, {});
  return getStore();
}

module.exports = {
  STORAGE_KEY,
  STATE_VERSION,
  addWaterRecord,
  clearUserStore,
  clearBusinessData,
  deleteTodayHydrationData,
  ensureState,
  getForestViewModel,
  getHomeViewModel,
  getProfileViewModel,
  getStore,
  getStateSnapshot,
  getLoginViewModel,
  initStore,
  exportHydrationData,
  logout,
  markPrivacyAccepted,
  resetToDefault,
  setLoginProfile,
  setSelectedCupAmount,
  restoreWechatProfile,
  syncSessionHeartbeat,
  updateStore,
  updateProfile,
  updateSettings
};
