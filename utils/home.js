const { getHydrationStatus, normalizeWaterAmount } = require('./water');
const { getTimeLabel, toDate } = require('./date');

function isFinitePositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function resolveQuickLogAmount(input, selectedAmount) {
  const directAmount = isFinitePositiveNumber(input);
  if (directAmount !== null) {
    return normalizeWaterAmount(directAmount);
  }

  const fallbackAmount = normalizeWaterAmount(selectedAmount);
  return Number.isFinite(fallbackAmount) && fallbackAmount > 0 ? fallbackAmount : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mixChannel(start, end, progress) {
  return Math.round(start + (end - start) * clamp(progress, 0, 1));
}

function mixRgba(start, end, progress, alpha) {
  return `rgba(${mixChannel(start[0], end[0], progress)}, ${mixChannel(start[1], end[1], progress)}, ${mixChannel(start[2], end[2], progress)}, ${alpha})`;
}

function buildOverflowRecordStyle(depth) {
  const safeDepth = clamp(depth, 0, 1);
  const softGreen = Math.round(176 - safeDepth * 92);
  const softBlue = Math.round(136 - safeDepth * 104);
  const deepGreen = Math.round(132 - safeDepth * 86);
  const deepBlue = Math.round(94 - safeDepth * 84);
  const startAlpha = (0.68 + safeDepth * 0.18).toFixed(3);
  const endAlpha = (0.90 + safeDepth * 0.06).toFixed(3);

  return 'width: 100%; background: linear-gradient(90deg, rgba(255, ' +
    `${softGreen}, ${softBlue}, ${startAlpha}), rgba(255, ${deepGreen}, ${deepBlue}, ${endAlpha}));`;
}

function buildRecordProgressStyle(progressRate, level) {
  const safeRate = Number.isFinite(Number(progressRate)) ? Math.max(0, Number(progressRate)) : 0;
  const progressPercent = Math.min(Math.round(safeRate * 100), 100);
  const safeLevel = level || (safeRate >= 1 ? 'overflow' : 'normal');

  if (safeLevel === 'complete') {
    return 'width: 100%; background: linear-gradient(90deg, rgba(77, 182, 172, 0.56), rgba(15, 157, 88, 0.96));';
  }

  if (safeLevel === 'overflow' || safeLevel === 'severe_overflow') {
    return buildOverflowRecordStyle(clamp((safeRate - 1) / 0.35, 0, 1));
  }

  const fillAlpha = Math.min(0.18 + safeRate * 0.42, 0.78);
  const deepAlpha = Math.min(fillAlpha + 0.18, 0.96);
  const startColor = mixRgba([142, 219, 255], [0, 95, 155], safeRate, fillAlpha);
  const endColor = mixRgba([71, 166, 247], [0, 95, 155], safeRate, deepAlpha);
  return `width: ${Math.max(14, progressPercent)}%; background: linear-gradient(90deg, ${startColor}, ${endColor});`;
}

function buildTodayRecordViews(records, dailyTarget) {
  const safeTarget = Math.max(1, Number(dailyTarget) || 0);
  const sourceRecords = Array.isArray(records) ? records.slice() : [];
  const sortedRecords = sourceRecords
    .slice()
    .sort((left, right) => toDate(right.createdAt).getTime() - toDate(left.createdAt).getTime());
  const chronologicalRecords = sortedRecords.slice().reverse();
  const progressById = new Map();
  const cumulativeStates = [];
  let cumulativeAmount = 0;

  chronologicalRecords.forEach((record) => {
    const amount = Math.max(0, Number(record.amount) || 0);
    cumulativeAmount += amount;
    const progressStatus = getHydrationStatus(cumulativeAmount, safeTarget);
    const progressRate = cumulativeAmount / safeTarget;

    cumulativeStates.push({
      id: record.id,
      cumulativeAmount,
      progressStatus,
      progressRate
    });
  });

  cumulativeStates.forEach((state) => {
    progressById.set(state.id, {
      progressPercent: Math.min(Math.round(state.progressRate * 100), 100),
      progressTone: state.progressStatus.level,
      progressStyle: buildRecordProgressStyle(state.progressRate, state.progressStatus.level),
      cumulativeAmount: state.cumulativeAmount,
      progressRate: state.progressRate
    });
  });

  const overflowCount = cumulativeStates.filter((state) => state.progressStatus.level === 'overflow' || state.progressStatus.level === 'severe_overflow').length;

  return sortedRecords.map((record, recordIndex) => {
    const progressState = progressById.get(record.id) || {
      progressPercent: 0,
      progressTone: 'normal',
      progressStyle: buildRecordProgressStyle(0, 'normal')
    };
    const isOverflow = progressState.progressTone === 'overflow' || progressState.progressTone === 'severe_overflow';
    const overflowDepth = isOverflow && overflowCount > 0
      ? (overflowCount === 1 ? 1 : clamp(1 - (recordIndex / (overflowCount - 1)), 0, 1))
      : 0;

    return {
      ...record,
      amountDisplay: `${record.amount} ml`,
      timeDisplay: record.timeLabel || (record.createdAt ? getTimeLabel(record.createdAt) : ''),
      ...progressState,
      progressStyle: isOverflow
        ? buildOverflowRecordStyle(overflowDepth)
        : progressState.progressStyle
    };
  });
}

module.exports = {
  buildTodayRecordViews,
  resolveQuickLogAmount
};
