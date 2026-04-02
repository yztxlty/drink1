const { diffDateKeys, getDateKey, getTimeLabel, getTodayKey, toDate } = require('./date');

function nowIsoString() {
  return new Date().toISOString();
}

function normalizeWaterRecord(record) {
  const createdAt = record && record.createdAt ? record.createdAt : nowIsoString();
  const amount = normalizeWaterAmount(record && record.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: record.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount: Math.round(amount),
    source: record.source || 'manual',
    note: record.note || '',
    createdAt,
    dateKey: record.dateKey || getDateKey(createdAt),
    timeLabel: record.timeLabel || getTimeLabel(createdAt)
  };
}

function normalizeWaterAmount(amount) {
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
    return null;
  }

  return Math.max(50, Math.round(safeAmount / 50) * 50);
}

function getPreviousDateKey(dateKey) {
  const previousDate = new Date(toDate(dateKey).getTime() - 24 * 60 * 60 * 1000);
  return getDateKey(previousDate);
}

function calculateCurrentStreak(orderedKeys, daily, predicate, anchorDateKey) {
  const safeDaily = daily || {};
  const safePredicate = typeof predicate === 'function' ? predicate : () => false;

  if (!anchorDateKey || !safeDaily[anchorDateKey] || !safePredicate(safeDaily[anchorDateKey])) {
    return 0;
  }

  let streak = 0;
  let cursorDateKey = anchorDateKey;

  while (safeDaily[cursorDateKey] && safePredicate(safeDaily[cursorDateKey])) {
    streak += 1;
    cursorDateKey = getPreviousDateKey(cursorDateKey);
  }

  return streak;
}

function calculateLongestStreak(orderedKeys, daily, predicate) {
  const safeDaily = daily || {};
  const safePredicate = typeof predicate === 'function' ? predicate : () => false;
  let longestStreak = 0;
  let runningStreak = 0;

  orderedKeys.forEach((dateKey, index) => {
    const previousKey = orderedKeys[index - 1];
    const entry = safeDaily[dateKey];
    const isQualified = entry && safePredicate(entry);

    if (!isQualified) {
      runningStreak = 0;
      return;
    }

    if (!previousKey || diffDateKeys(dateKey, previousKey) === 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  });

  return longestStreak;
}

function buildDailySummaries(records, dailyTarget) {
  const daily = {};
  let totalAmount = 0;
  let morningRecords = 0;
  let nightRecords = 0;

  records.forEach((record) => {
    const dateKey = record.dateKey || getDateKey(record.createdAt);
    const entry = daily[dateKey] || {
      dateKey,
      total: 0,
      target: dailyTarget,
      recordCount: 0,
      completionRate: 0,
      completed: false,
      remaining: dailyTarget,
      firstRecordAt: record.createdAt,
      lastRecordAt: record.createdAt
    };

    entry.total += record.amount;
    entry.recordCount += 1;
    entry.target = dailyTarget;
    entry.completionRate = Math.min(entry.total / dailyTarget, 1);
    entry.completed = entry.total >= dailyTarget;
    entry.remaining = Math.max(dailyTarget - entry.total, 0);
    entry.firstRecordAt = toDate(record.createdAt) < toDate(entry.firstRecordAt) ? record.createdAt : entry.firstRecordAt;
    entry.lastRecordAt = toDate(record.createdAt) > toDate(entry.lastRecordAt) ? record.createdAt : entry.lastRecordAt;

    daily[dateKey] = entry;
    totalAmount += record.amount;

    const hour = toDate(record.createdAt).getHours();
    if (hour < 9) {
      morningRecords += 1;
    }
    if (hour >= 21) {
      nightRecords += 1;
    }
  });

  const orderedKeys = Object.keys(daily).sort((left, right) => diffDateKeys(left, right));
  const completedPredicate = (entry) => Boolean(entry && entry.completed);
  const activePredicate = (entry) => Number(entry && entry.total) > 0;
  const longestStreak = calculateLongestStreak(orderedKeys, daily, completedPredicate);
  const currentStreak = calculateCurrentStreak(orderedKeys, daily, completedPredicate, getTodayKey());
  const activeLongestStreak = calculateLongestStreak(orderedKeys, daily, activePredicate);
  const activeCurrentStreak = calculateCurrentStreak(
    orderedKeys,
    daily,
    activePredicate,
    orderedKeys.length ? orderedKeys[orderedKeys.length - 1] : ''
  );
  const lastActiveDateKey = orderedKeys.length ? orderedKeys[orderedKeys.length - 1] : '';

  const completedDays = Object.values(daily).filter((entry) => entry.completed).length;
  const activeDays = Object.keys(daily).length;
  const averageCompletionRate = activeDays
    ? Object.values(daily).reduce((sum, entry) => sum + entry.completionRate, 0) / activeDays
    : 0;

  return {
    daily,
    totals: {
      today: Number(((daily || {})[getTodayKey()] || {}).total) || 0,
      totalAmount,
      totalRecords: records.length,
      completedDays,
      activeDays,
      averageCompletionRate,
      morningRecords,
      nightRecords
    },
    streak: {
      current: currentStreak,
      longest: longestStreak,
      lastQualifiedDateKey: currentStreak > 0 ? getTodayKey() : '',
      activeCurrent: activeCurrentStreak,
      activeLongest: activeLongestStreak,
      lastActiveDateKey
    }
  };
}

function getHydrationQuality(todayCompletionRate) {
  if (todayCompletionRate >= 1) {
    return '优秀';
  }
  if (todayCompletionRate >= 0.75) {
    return '良好';
  }
  if (todayCompletionRate >= 0.4) {
    return '稳定';
  }
  return '待提升';
}

function getHydrationStatus(todayTotal, dailyTarget) {
  const target = Math.max(1, Number(dailyTarget) || 0);
  const total = Math.max(0, Number(todayTotal) || 0);
  const remaining = Math.max(target - total, 0);
  const overflowAmount = Math.max(total - target, 0);

  if (total === target) {
    return {
      level: 'complete',
      tone: 'success',
      isComplete: true,
      isOverflow: false,
      overflowAmount: 0,
      remaining: 0,
      label: '今日已达标',
      hint: '今日补水已达标，继续保持好节奏',
      badgeText: '今日已达标'
    };
  }

  if (total > target) {
    const severeOverflow = overflowAmount >= Math.max(500, Math.round(target * 0.25));

    return {
      level: severeOverflow ? 'severe_overflow' : 'overflow',
      tone: severeOverflow ? 'warning' : 'overflow',
      isComplete: true,
      isOverflow: overflowAmount > 0,
      overflowAmount,
      remaining: 0,
      label: overflowAmount > 0 ? `已超出 ${overflowAmount} ml` : '今日已达标',
      hint: severeOverflow
        ? '补水过量易增加身体负担，请适量补水哦'
        : (overflowAmount > 0 ? '已超过今日目标，注意放缓补水节奏' : '今日补水已达标，继续保持好节奏'),
      badgeText: overflowAmount > 0 ? `超出 ${overflowAmount} ml` : '今日已达标'
    };
  }

  return {
    level: 'normal',
    tone: 'normal',
    isComplete: false,
    isOverflow: false,
    overflowAmount: 0,
    remaining,
    label: `还差 ${remaining} ml`,
    hint: `距离目标还差 ${remaining} ml`,
    badgeText: `${remaining} ml`
  };
}

module.exports = {
  buildDailySummaries,
  getHydrationQuality,
  getHydrationStatus,
  normalizeWaterAmount,
  normalizeWaterRecord
};
