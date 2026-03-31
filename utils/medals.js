const MEDAL_DEFINITIONS = [
  {
    id: 'first_drop',
    name: '第一滴',
    icon: '💧',
    description: '完成第一次补水记录',
    category: 'record',
    target: 1,
    getProgress(context) {
      return context.totalRecords;
    }
  },
  {
    id: 'goal_once',
    name: '今日达标',
    icon: '🎯',
    description: '任意一天完成补水目标',
    category: 'goal',
    target: 1,
    getProgress(context) {
      return context.completedDays;
    }
  },
  {
    id: 'streak_3',
    name: '连续起航',
    icon: '🔥',
    description: '连续达标 3 天',
    category: 'streak',
    target: 3,
    getProgress(context) {
      return context.currentStreak;
    }
  },
  {
    id: 'streak_7',
    name: '稳定补水者',
    icon: '🌊',
    description: '连续达标 7 天',
    category: 'streak',
    target: 7,
    getProgress(context) {
      return context.currentStreak;
    }
  },
  {
    id: 'early_bird',
    name: '晨曦之饮',
    icon: '🌅',
    description: '早晨 9 点前完成 5 次记录',
    category: 'habit',
    target: 5,
    getProgress(context) {
      return context.morningRecords;
    }
  },
  {
    id: 'night_guard',
    name: '夜间守护',
    icon: '🌙',
    description: '晚间 21 点后完成 5 次记录',
    category: 'habit',
    target: 5,
    getProgress(context) {
      return context.nightRecords;
    }
  },
  {
    id: 'cup_20',
    name: '杯数收藏家',
    icon: '🥛',
    description: '累计记录 20 杯水',
    category: 'record',
    target: 20,
    getProgress(context) {
      return context.totalRecords;
    }
  },
  {
    id: 'litre_50',
    name: '森林灌溉师',
    icon: '🌳',
    description: '累计补水达到 50L',
    category: 'growth',
    target: 50000,
    getProgress(context) {
      return context.totalAmount;
    }
  }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function evaluateMedals(context, previousAchievements) {
  const safeAchievements = previousAchievements || {};
  const previousProgress = safeAchievements.progress || {};
  const previousUnlockedIds = new Set(safeAchievements.unlockedIds || []);
  const progress = {};
  const unlockedIds = [];
  const newlyUnlocked = [];

  MEDAL_DEFINITIONS.forEach((definition) => {
    const rawProgress = Number(definition.getProgress(context) || 0);
    const current = Math.max(0, rawProgress);
    const target = Math.max(1, Number(definition.target || 1));
    const unlocked = current >= target;
    const completionRate = clamp(current / target, 0, 1);
    const previousEntry = previousProgress[definition.id] || {};

    progress[definition.id] = {
      current,
      target,
      completionRate,
      unlocked,
      unlockedAt: unlocked ? previousEntry.unlockedAt || context.generatedAt : ''
    };

    if (unlocked) {
      unlockedIds.push(definition.id);
      if (!previousUnlockedIds.has(definition.id)) {
        newlyUnlocked.push({
          id: definition.id,
          name: definition.name,
          icon: definition.icon
        });
      }
    }
  });

  return {
    catalog: MEDAL_DEFINITIONS,
    progress,
    unlockedIds,
    unlockedCount: unlockedIds.length,
    newlyUnlocked,
    lastEvaluatedAt: context.generatedAt
  };
}

module.exports = {
  MEDAL_DEFINITIONS,
  evaluateMedals
};
