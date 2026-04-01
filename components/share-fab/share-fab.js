const { COPY } = require('../../utils/copy');

// Bump the storage key when the collapsed layout changes, so stale positions
// from older releases do not hide the fab on first render.
const STORAGE_KEY = 'drink1:share-fab-ui-v5';
const AUTO_COLLAPSE_DELAY = 5000;
const SWIPE_THRESHOLD = 18;
const EXPANDED_SIZE_RPX = {
  width: 286,
  height: 96
};
const EXPANDED_RIGHT = '20rpx';
const EDGE_RPX = 16;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom(list) {
  if (!Array.isArray(list) || !list.length) {
    return '';
  }

  return list[Math.floor(Math.random() * list.length)];
}

function interpolate(template, values) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : '';
  });
}

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

Component({
  properties: {
    percent: {
      type: Number,
      value: null
    },
    streak: {
      type: Number,
      value: null
    },
    pagePath: {
      type: String,
      value: ''
    },
    pageName: {
      type: String,
      value: ''
    }
  },

  data: {
    ready: false,
    expanded: true,
    dragging: false,
    pressed: false,
    top: 0,
    right: EXPANDED_RIGHT,
    width: 0,
    height: 0,
    translateX: 0,
    collapseOffset: 0,
    shareMode: 'progress',
    shareBadge: '今日补水',
    sharePreview: ''
  },

  lifetimes: {
    attached() {
      this.systemInfo = this.getSystemInfo();
      this.restoreUiState();
      this.refreshShareCopy();
      this.ensureAutoCollapseTimer();
    },
    detached() {
      this.clearTimers();
      this.persistUiState();
    }
  },

  pageLifetimes: {
    show() {
      this.refreshShareCopy();
      this.ensureAutoCollapseTimer();
    },
    hide() {
      this.persistUiState();
    }
  },

  methods: {
    clearTimers() {
      clearTimeout(this.autoCollapseTimer);
      clearTimeout(this.pressedTimer);
      this.autoCollapseTimer = null;
      this.pressedTimer = null;
    },

    getSystemInfo() {
      if (typeof wx === 'undefined' || typeof wx.getWindowInfo !== 'function') {
        return {
          windowWidth: 375,
          windowHeight: 667,
          statusBarHeight: 20,
          safeArea: {
            top: 20,
            bottom: 667
          }
        };
      }

      try {
        const windowInfo = wx.getWindowInfo() || {};
        return {
          windowWidth: Number.isFinite(Number(windowInfo.windowWidth)) ? Number(windowInfo.windowWidth) : 375,
          windowHeight: Number.isFinite(Number(windowInfo.windowHeight)) ? Number(windowInfo.windowHeight) : 667,
          statusBarHeight: Number.isFinite(Number(windowInfo.statusBarHeight)) ? Number(windowInfo.statusBarHeight) : 20,
          safeArea: windowInfo.safeArea || {
            top: 20,
            bottom: 667
          }
        };
      } catch (error) {
        return {
          windowWidth: 375,
          windowHeight: 667,
          statusBarHeight: 20,
          safeArea: {
            top: 20,
            bottom: 667
          }
        };
      }
    },

    rpxToPx(value) {
      const windowWidth = toNumber(this.systemInfo && this.systemInfo.windowWidth, 375);
      return Math.round((windowWidth / 750) * value);
    },

    resolveSize() {
      return {
        width: this.rpxToPx(EXPANDED_SIZE_RPX.width),
        height: this.rpxToPx(EXPANDED_SIZE_RPX.height)
      };
    },

    resolveCollapseOffset(width) {
      const target = Math.round(width * 0.6);
      return clamp(target, this.rpxToPx(48), width - this.rpxToPx(24));
    },

    getTopInset() {
      const statusBarHeight = toNumber(this.systemInfo && this.systemInfo.statusBarHeight, 20);
      return Math.max(this.rpxToPx(EDGE_RPX), statusBarHeight + this.rpxToPx(44));
    },

    getBottomInset() {
      const safeArea = this.systemInfo && this.systemInfo.safeArea;
      const windowHeight = toNumber(this.systemInfo && this.systemInfo.windowHeight, 667);
      const safeAreaBottomInset = safeArea && Number.isFinite(Number(safeArea.bottom))
        ? Math.max(0, windowHeight - Number(safeArea.bottom))
        : 0;

      return Math.max(this.rpxToPx(150), safeAreaBottomInset + this.rpxToPx(24));
    },

    getTopBounds(height) {
      const windowHeight = toNumber(this.systemInfo && this.systemInfo.windowHeight, 667);
      const minTop = this.getTopInset();
      const maxTop = Math.max(minTop, windowHeight - height - this.getBottomInset());
      return {
        minTop,
        maxTop
      };
    },

    clampTop(top, height) {
      const bounds = this.getTopBounds(height);
      return clamp(Math.round(top), bounds.minTop, bounds.maxTop);
    },

    getDefaultTop(height) {
      const bounds = this.getTopBounds(height);
      return clamp(bounds.maxTop, bounds.minTop, bounds.maxTop);
    },

    readStorage() {
      if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') {
        return {};
      }

      try {
        const state = wx.getStorageSync(STORAGE_KEY);
        return state && typeof state === 'object' ? state : {};
      } catch (error) {
        return {};
      }
    },

    persistUiState() {
      if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
        return;
      }

      try {
        wx.setStorageSync(STORAGE_KEY, {
          expanded: this.data.expanded,
          top: this.data.top
        });
      } catch (error) {
        // Keep sharing working even when persistence fails.
      }
    },

    restoreUiState() {
      const restored = this.readStorage();
      const expanded = typeof restored.expanded === 'boolean' ? restored.expanded : true;
      const size = this.resolveSize();
      const collapseOffset = this.resolveCollapseOffset(size.width);
      const top = Number.isFinite(Number(restored.top))
        ? this.clampTop(Number(restored.top), size.height)
        : this.getDefaultTop(size.height);

      this.setData({
        ready: true,
        expanded,
        top,
        right: EXPANDED_RIGHT,
        width: size.width,
        height: size.height,
        translateX: expanded ? 0 : collapseOffset,
        collapseOffset
      });
    },

    resolveStore() {
      if (typeof getApp !== 'function') {
        return null;
      }

      const app = getApp();
      return app && app.globalData ? app.globalData.store : null;
    },

    resolveRoute() {
      if (this.data.pagePath) {
        return this.data.pagePath.replace(/^\//, '');
      }

      if (typeof getCurrentPages !== 'function') {
        return '';
      }

      const pages = getCurrentPages();
      const currentPage = Array.isArray(pages) && pages.length ? pages[pages.length - 1] : null;
      return currentPage && currentPage.route ? currentPage.route : '';
    },

    resolveMetrics() {
      const store = this.resolveStore();
      const route = this.resolveRoute();
      const propPercent = Number(this.data.percent);
      const propStreak = Number(this.data.streak);

      let percent = Number.isFinite(propPercent) && propPercent >= 0 ? propPercent : null;
      let streakDays = Number.isFinite(propStreak) && propStreak >= 0 ? propStreak : null;
      let intake = 0;

      if (store) {
        const homeViewModel = typeof store.getHomeViewModel === 'function' ? store.getHomeViewModel() || {} : {};
        const profileViewModel = typeof store.getProfileViewModel === 'function' ? store.getProfileViewModel() || {} : {};

        if (percent === null) {
          const homePercent = Number(homeViewModel.progressPercent);
          if (Number.isFinite(homePercent)) {
            percent = homePercent;
          }
        }

        if (streakDays === null) {
          const homeStreak = Number(homeViewModel.streakDays);
          const profileStreak = Number(profileViewModel.stats && profileViewModel.stats.streakDays);
          if (Number.isFinite(homeStreak)) {
            streakDays = homeStreak;
          } else if (Number.isFinite(profileStreak)) {
            streakDays = profileStreak;
          }
        }

        intake = Number(homeViewModel.intake) || 0;
      }

      return {
        percent: clamp(Math.round(Number(percent) || 0), 0, 100),
        streakDays: Math.max(0, Math.round(Number(streakDays) || 0)),
        intake: Math.max(0, Math.round(intake)),
        route
      };
    },

    chooseShareCopy(metrics) {
      const progressList = (COPY.shareFab && COPY.shareFab.progress) || [];
      const challengeList = (COPY.shareFab && COPY.shareFab.challenge) || [];
      const shouldUseProgress = metrics.percent >= 55 || metrics.streakDays < 3;
      const shouldUseChallenge = metrics.streakDays >= 3 && metrics.percent < 85;
      let mode = 'progress';

      if (shouldUseChallenge && !shouldUseProgress) {
        mode = 'challenge';
      } else if (shouldUseProgress && !shouldUseChallenge) {
        mode = 'progress';
      } else {
        mode = Math.random() > 0.5 ? 'progress' : 'challenge';
      }

      const pool = mode === 'challenge' ? challengeList : progressList;
      const fallback = mode === 'challenge' ? progressList : challengeList;
      const template = pickRandom(pool) || pickRandom(fallback) || (mode === 'challenge'
        ? '已连续补水 {{streakDays}} 天，来挑战一下我的习惯！'
        : '今日进度 {{percent}}%，补水大师养成中！');

      return {
        mode,
        text: interpolate(template, {
          percent: metrics.percent,
          streakDays: metrics.streakDays,
          intake: metrics.intake
        })
      };
    },

    resolveSharePath(metrics) {
      if (this.data.pagePath) {
        return this.data.pagePath;
      }

      if (this.data.pageName === 'home') {
        return '/pages/home/home';
      }

      if (this.data.pageName === 'explore') {
        return '/pages/explore/explore';
      }

      if (this.data.pageName === 'profile') {
        return '/pages/profile/profile';
      }

      if (metrics.route) {
        return `/${metrics.route}`;
      }

      return '/pages/home/home';
    },

    refreshShareCopy() {
      const metrics = this.resolveMetrics();
      const copy = this.chooseShareCopy(metrics);

      this.setData({
        shareMode: copy.mode,
        shareBadge: copy.mode === 'challenge' ? '连续挑战' : '今日补水',
        sharePreview: copy.text
      });
    },

    getShareContent() {
      const metrics = this.resolveMetrics();
      const copy = this.chooseShareCopy(metrics);

      return {
        title: copy.text,
        path: this.resolveSharePath(metrics)
      };
    },

    ensureAutoCollapseTimer() {
      clearTimeout(this.autoCollapseTimer);
      this.autoCollapseTimer = setTimeout(() => {
        if (this.data.expanded && !this.data.dragging) {
          this.setExpanded(false);
        }
      }, AUTO_COLLAPSE_DELAY);
    },

    markPressed() {
      this.setData({ pressed: true });
      clearTimeout(this.pressedTimer);
      this.pressedTimer = setTimeout(() => {
        this.setData({ pressed: false });
      }, 180);
    },

    setExpanded(nextExpanded) {
      const size = this.resolveSize();
      const collapseOffset = this.resolveCollapseOffset(size.width);
      const top = this.clampTop(this.data.top || this.getDefaultTop(size.height), size.height);

      this.setData({
        expanded: !!nextExpanded,
        dragging: false,
        top,
        right: EXPANDED_RIGHT,
        width: size.width,
        height: size.height,
        translateX: nextExpanded ? 0 : collapseOffset,
        collapseOffset
      }, () => {
        this.refreshShareCopy();
        this.persistUiState();

        if (nextExpanded) {
          this.ensureAutoCollapseTimer();
        } else {
          clearTimeout(this.autoCollapseTimer);
          this.autoCollapseTimer = null;
        }
      });
    },

    toggleCollapsed() {
      this.setExpanded(!this.data.expanded);
    },

    extractTouch(event) {
      return event && event.touches && event.touches[0] ? event.touches[0] : null;
    },

    onShareTap() {
      this.markPressed();
      this.ensureAutoCollapseTimer();
    },

    onTouchStart(event) {
      const touch = this.extractTouch(event);
      if (!touch) {
        return;
      }

      this.touchState = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTop: this.data.top || this.getDefaultTop(this.data.height || this.resolveSize().height),
        startTranslateX: this.data.translateX || 0,
        collapseOffset: this.data.collapseOffset || this.resolveCollapseOffset(this.resolveSize().width),
        height: this.data.height || this.resolveSize().height,
        expanded: !!this.data.expanded,
        axis: null,
        active: false
      };

      this.setData({ pressed: true });
      this.ensureAutoCollapseTimer();
    },

    onTouchMove(event) {
      const touch = this.extractTouch(event);
      if (!touch || !this.touchState) {
        return;
      }

      const deltaX = touch.clientX - this.touchState.startX;
      const deltaY = touch.clientY - this.touchState.startY;

      if (!this.touchState.active) {
        if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
          return;
        }

        this.touchState.active = true;
        this.touchState.axis = Math.abs(deltaY) > Math.abs(deltaX) ? 'vertical' : 'horizontal';
        this.setData({
          dragging: true,
          pressed: false
        });
      }

      if (this.touchState.axis === 'vertical') {
        const nextTop = this.clampTop(
          this.touchState.startTop + deltaY,
          this.touchState.height
        );

        this.setData({
          top: Math.round(nextTop)
        });
        return;
      }

      const minTranslate = this.touchState.expanded ? 0 : -this.touchState.collapseOffset;
      const maxTranslate = this.touchState.expanded ? this.touchState.collapseOffset : 0;
      const nextTranslateX = clamp(
        this.touchState.startTranslateX + deltaX,
        minTranslate,
        maxTranslate
      );

      this.setData({
        translateX: Math.round(nextTranslateX)
      });
    },

    finishTouch() {
      if (!this.touchState) {
        return;
      }

      const touchState = this.touchState;
      const gestureDeltaX = this.data.translateX - touchState.startTranslateX;

      this.touchState = null;
      this.setData({
        dragging: false,
        pressed: false
      }, () => {
        if (!touchState.active) {
          this.persistUiState();
          return;
        }

        if (touchState.axis === 'vertical') {
          this.persistUiState();
          return;
        }

        if (touchState.expanded && gestureDeltaX >= SWIPE_THRESHOLD) {
          this.setExpanded(false);
          return;
        }

        if (!touchState.expanded && gestureDeltaX <= -SWIPE_THRESHOLD) {
          this.setExpanded(true);
          return;
        }

        this.setExpanded(touchState.expanded);
      });
    },

    onTouchEnd() {
      this.finishTouch();
    },

    onTouchCancel() {
      this.finishTouch();
    },

    onDragStart(event) {
      this.onTouchStart(event);
    },

    onDragMove(event) {
      this.onTouchMove(event);
    },

    onDragEnd(event) {
      this.finishTouch(event);
    }
  }
});
