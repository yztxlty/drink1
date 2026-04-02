const DEFAULT_DROP_SIZE_RPX = 80;
const DROP_UNIT_INTAKE = 50;
const DROP_COLORS = [
  'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.48) 20%, rgba(126,221,255,0.52) 58%, rgba(43,148,255,0.34) 100%)',
  'radial-gradient(circle at 28% 24%, rgba(255,255,255,0.94), rgba(255,255,255,0.46) 18%, rgba(148,255,223,0.5) 60%, rgba(24,192,138,0.3) 100%)',
  'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.95), rgba(255,255,255,0.5) 20%, rgba(255,206,231,0.52) 56%, rgba(255,126,173,0.3) 100%)'
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeNumber(value, fallback) {
  const safeValue = Number(value);
  return Number.isFinite(safeValue) ? safeValue : fallback;
}

function rpxToPx(rpx, windowWidth) {
  const safeWindowWidth = Math.max(320, normalizeNumber(windowWidth, 375));
  return Math.round((normalizeNumber(rpx, DEFAULT_DROP_SIZE_RPX) * safeWindowWidth) / 750);
}

function getDropCount(todayIntake) {
  return Math.max(0, Math.floor(Math.max(0, normalizeNumber(todayIntake, 0)) / DROP_UNIT_INTAKE));
}

function getMergeProgress(initialDropCount, currentDropCount) {
  const initial = Math.max(0, Math.floor(normalizeNumber(initialDropCount, 0)));
  const current = Math.max(0, Math.floor(normalizeNumber(currentDropCount, 0)));

  if (initial <= 0) {
    return 0;
  }

  if (initial === 1) {
    return 100;
  }

  const clampedCurrent = clamp(current, 1, initial);
  const mergedCount = initial - clampedCurrent;
  return Math.round((mergedCount / (initial - 1)) * 100);
}

function resolveVesselRect(vesselRect, systemInfo, dropSize) {
  const safeRect = vesselRect || {};
  const safeSystemInfo = systemInfo || {};

  return {
    left: normalizeNumber(safeRect.left, 0),
    top: normalizeNumber(safeRect.top, 0),
    width: Math.max(
      normalizeNumber(safeRect.width, 0),
      Math.round(normalizeNumber(safeSystemInfo.windowWidth, 375) * 0.84)
    ),
    height: Math.max(
      normalizeNumber(safeRect.height, 0),
      Math.round(normalizeNumber(safeSystemInfo.windowHeight, 667) * 0.42)
    ),
    dropSize
  };
}

function buildInitialDrops(todayIntake, options) {
  const safeOptions = options || {};
  const dropSize = rpxToPx(DEFAULT_DROP_SIZE_RPX, safeOptions.windowWidth);
  const vesselRect = resolveVesselRect(safeOptions.vesselRect, safeOptions.systemInfo, dropSize);
  const maxX = Math.max(0, vesselRect.width - dropSize);
  const maxY = Math.max(0, vesselRect.height - dropSize);
  const drops = [];

  for (let index = 0; index < getDropCount(todayIntake); index += 1) {
    drops.push({
      id: `drop_${index + 1}`,
      x: Math.round(Math.random() * maxX),
      y: Math.round(Math.random() * maxY),
      size: dropSize,
      color: DROP_COLORS[index % DROP_COLORS.length],
      isDragging: false,
      isMerging: false
    });
  }

  return drops;
}

function updateDraggedDrop(drop, touchPoint, vesselRect) {
  const safeDrop = drop || {};
  const safePoint = touchPoint || {};
  const safeVessel = vesselRect || {};
  const size = Math.max(20, normalizeNumber(safeDrop.size, 40));
  const nextX = normalizeNumber(safePoint.x, 0) - normalizeNumber(safeVessel.left, 0) - size / 2;
  const nextY = normalizeNumber(safePoint.y, 0) - normalizeNumber(safeVessel.top, 0) - size / 2;
  const maxX = Math.max(0, normalizeNumber(safeVessel.width, 0) - size);
  const maxY = Math.max(0, normalizeNumber(safeVessel.height, 0) - size);

  return {
    ...safeDrop,
    x: Math.round(clamp(nextX, 0, maxX)),
    y: Math.round(clamp(nextY, 0, maxY)),
    isDragging: true
  };
}

function findMergeTarget(activeDrop, allDrops) {
  const safeDrops = Array.isArray(allDrops) ? allDrops : [];
  const activeCenterX = normalizeNumber(activeDrop.x, 0) + normalizeNumber(activeDrop.size, 0) / 2;
  const activeCenterY = normalizeNumber(activeDrop.y, 0) + normalizeNumber(activeDrop.size, 0) / 2;
  const activeRadius = normalizeNumber(activeDrop.size, 0) / 2;

  for (let index = 0; index < safeDrops.length; index += 1) {
    const drop = safeDrops[index];
    if (!drop || drop.id === activeDrop.id) {
      continue;
    }

    const dropRadius = normalizeNumber(drop.size, 0) / 2;
    const dropCenterX = normalizeNumber(drop.x, 0) + dropRadius;
    const dropCenterY = normalizeNumber(drop.y, 0) + dropRadius;
    const deltaX = activeCenterX - dropCenterX;
    const deltaY = activeCenterY - dropCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < activeRadius + dropRadius) {
      return drop;
    }
  }

  return null;
}

function buildMergedDrop(activeDrop, targetDrop, vesselRect) {
  const safeVessel = vesselRect || {};
  const activeSize = Math.max(20, normalizeNumber(activeDrop.size, 40));
  const targetSize = Math.max(20, normalizeNumber(targetDrop.size, 40));
  const mergedSize = Math.round(Math.sqrt(activeSize * activeSize + targetSize * targetSize));
  const activeCenterX = normalizeNumber(activeDrop.x, 0) + activeSize / 2;
  const activeCenterY = normalizeNumber(activeDrop.y, 0) + activeSize / 2;
  const targetCenterX = normalizeNumber(targetDrop.x, 0) + targetSize / 2;
  const targetCenterY = normalizeNumber(targetDrop.y, 0) + targetSize / 2;
  const maxX = Math.max(0, normalizeNumber(safeVessel.width, 0) - mergedSize);
  const maxY = Math.max(0, normalizeNumber(safeVessel.height, 0) - mergedSize);

  return {
    ...activeDrop,
    x: Math.round(clamp(((activeCenterX + targetCenterX) / 2) - mergedSize / 2, 0, maxX)),
    y: Math.round(clamp(((activeCenterY + targetCenterY) / 2) - mergedSize / 2, 0, maxY)),
    size: mergedSize,
    isDragging: false,
    isMerging: true
  };
}

module.exports = {
  buildInitialDrops,
  buildMergedDrop,
  findMergeTarget,
  getDropCount,
  getMergeProgress,
  updateDraggedDrop
};
