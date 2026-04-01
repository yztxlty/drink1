const DEFAULT_QUICK_AMOUNTS = [150, 250, 500];
const DEFAULT_SELECTED_AMOUNT = 250;

function normalizeQuickAmount(value) {
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue) || safeValue <= 0) {
    return 50;
  }

  return Math.max(50, Math.round(safeValue / 50) * 50);
}

function normalizeQuickAmounts(values) {
  const source = Array.isArray(values) ? values : DEFAULT_QUICK_AMOUNTS;
  const normalized = source
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  return normalized.length
    ? Array.from(new Set(normalized)).sort((left, right) => left - right)
    : DEFAULT_QUICK_AMOUNTS.slice();
}

function resolveFallbackSelectedCup(quickAmounts, removedAmount, currentSelected) {
  const safeAmounts = Array.isArray(quickAmounts) ? quickAmounts.slice() : [];
  if (!safeAmounts.length) {
    return DEFAULT_SELECTED_AMOUNT;
  }

  const selectedValue = Number(currentSelected);
  if (safeAmounts.includes(selectedValue)) {
    return selectedValue;
  }

  const nextHigher = safeAmounts.find((item) => item > removedAmount);
  if (Number.isFinite(nextHigher)) {
    return nextHigher;
  }

  return safeAmounts[safeAmounts.length - 1];
}

module.exports = {
  DEFAULT_QUICK_AMOUNTS,
  DEFAULT_SELECTED_AMOUNT,
  normalizeQuickAmount,
  normalizeQuickAmounts,
  resolveFallbackSelectedCup
};
