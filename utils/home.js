const { getHydrationStatus, normalizeWaterAmount } = require('./water');
const { getTimeLabel } = require('./date');

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

function buildRecordProgressStyle(progressRate, level) {
  const safeRate = Number.isFinite(Number(progressRate)) ? Math.max(0, Number(progressRate)) : 0;
  const progressPercent = Math.min(Math.round(safeRate * 100), 100);
  const safeLevel = level || (safeRate >= 1 ? 'overflow' : 'normal');

  if (safeLevel === 'complete') {
    return 'width: 100%; background: linear-gradient(90deg, rgba(77, 182, 172, 0.56), rgba(15, 157, 88, 0.96));';
  }

  if (safeLevel === 'overflow' || safeLevel === 'severe_overflow') {
    const overflowProgress = clamp((safeRate - 1) / 0.35, 0, 1);
    const startColor = mixRgba([79, 140, 255], [255, 138, 101], overflowProgress, 0.68 + overflowProgress * 0.16);
    const endColor = mixRgba([41, 98, 255], [244, 81, 30], overflowProgress, 0.92 + overflowProgress * 0.06);
    return 'width: 100%; background: linear-gradient(90deg, ' + startColor + ', ' + endColor + ');';
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
  const chronologicalRecords = sourceRecords.slice().reverse();
  const progressById = new Map();
  let cumulativeAmount = 0;

  chronologicalRecords.forEach((record) => {
    const amount = Math.max(0, Number(record.amount) || 0);
    cumulativeAmount += amount;
    const progressStatus = getHydrationStatus(cumulativeAmount, safeTarget);
    const progressRate = cumulativeAmount / safeTarget;

    progressById.set(record.id, {
      progressPercent: Math.min(Math.round(progressRate * 100), 100),
      progressTone: progressStatus.level,
      progressStyle: buildRecordProgressStyle(progressRate, progressStatus.level)
    });
  });

  return sourceRecords.map((record) => {
    const progress = progressById.get(record.id) || {
      progressPercent: 0,
      progressTone: 'normal',
      progressStyle: buildRecordProgressStyle(0, 'normal')
    };

    return {
      ...record,
      amountDisplay: `${record.amount} ml`,
      timeDisplay: record.timeLabel || (record.createdAt ? getTimeLabel(record.createdAt) : ''),
      ...progress
    };
  });
}

module.exports = {
  buildTodayRecordViews,
  resolveQuickLogAmount
};
