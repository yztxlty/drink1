const ONE_DAY = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDate(input) {
  if (!input) {
    return new Date();
  }

  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function getDateKey(input) {
  const date = toDate(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTimeLabel(input) {
  const date = toDate(input);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getTodayKey() {
  return getDateKey(new Date());
}

function diffDateKeys(left, right) {
  const leftDate = toDate(left);
  const rightDate = toDate(right);
  const leftStart = new Date(leftDate.getFullYear(), leftDate.getMonth(), leftDate.getDate()).getTime();
  const rightStart = new Date(rightDate.getFullYear(), rightDate.getMonth(), rightDate.getDate()).getTime();
  return Math.round((leftStart - rightStart) / ONE_DAY);
}

function sortDateKeysDesc(dateKeys) {
  return [...dateKeys].sort((left, right) => diffDateKeys(right, left));
}

module.exports = {
  diffDateKeys,
  getDateKey,
  getTimeLabel,
  getTodayKey,
  sortDateKeysDesc,
  toDate
};
