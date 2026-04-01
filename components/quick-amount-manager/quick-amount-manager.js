const {
  DEFAULT_SELECTED_AMOUNT,
  normalizeQuickAmount
} = require('../../utils/quick-amounts')

const DOUBLE_TAP_WINDOW_MS = 1000

Component({
  properties: {
    quickAmounts: {
      type: Array,
      value: []
    },
    selectedAmount: {
      type: Number,
      value: DEFAULT_SELECTED_AMOUNT
    },
    title: {
      type: String,
      value: '快捷容量管理'
    },
    manageHint: {
      type: String,
      value: '点选可切换默认容量'
    },
    deleteHint: {
      type: String,
      value: '点击修改图标进入删除模式'
    },
    sharedHint: {
      type: String,
      value: '这里调整的快捷容量会同步到首页快速记录。'
    },
    deleteModeTip: {
      type: String,
      value: '点击右上角删除图标移除容量，点空白处退出。'
    },
    addLabel: {
      type: String,
      value: '添加容量'
    },
    dialogTitle: {
      type: String,
      value: '添加快捷容量'
    },
    dialogHint: {
      type: String,
      value: '以 50ml 为单位设置新的快捷容量'
    },
    dialogTip: {
      type: String,
      value: '保存后会立即出现在列表中，并设为当前默认容量。'
    },
    confirmLabel: {
      type: String,
      value: '确定'
    },
    countSuffix: {
      type: String,
      value: '个'
    }
  },

  data: {
    deleteMode: false,
    dialogVisible: false,
    draftAmount: 300,
    lastTapAmount: 0,
    lastTapAt: 0
  },

  lifetimes: {
    detached() {
      this.clearDoubleTapTimer()
    }
  },

  methods: {
    noop() {},

    clearDoubleTapTimer() {
      if (this.doubleTapTimer) {
        clearTimeout(this.doubleTapTimer)
        this.doubleTapTimer = null
      }
    },

    handleRootTap() {
      if (this.data.deleteMode) {
        this.exitDeleteMode()
      }
    },

    openQuickAmountDialog() {
      if (this.data.deleteMode) {
        return
      }

      const baseAmount = Number(this.data.selectedAmount || DEFAULT_SELECTED_AMOUNT)
      this.setData({
        dialogVisible: true,
        draftAmount: normalizeQuickAmount(baseAmount + 50)
      })
    },

    closeQuickAmountDialog() {
      this.setData({
        dialogVisible: false
      })
    },

    decreaseQuickAmountDraft() {
      this.setData({
        draftAmount: normalizeQuickAmount((this.data.draftAmount || 50) - 50)
      })
    },

    increaseQuickAmountDraft() {
      this.setData({
        draftAmount: normalizeQuickAmount((this.data.draftAmount || 50) + 50)
      })
    },

    confirmQuickAmount() {
      const amount = normalizeQuickAmount(this.data.draftAmount)
      this.triggerEvent('add', { amount }, {})
      this.setData({
        dialogVisible: false,
        deleteMode: false,
        draftAmount: normalizeQuickAmount(amount + 50)
      })
    },

    handleAmountTap(e) {
      if (this.data.deleteMode) {
        return
      }

      const amount = Number(e.currentTarget.dataset.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return
      }

      const now = Date.now()
      const isDoubleTap = this.data.lastTapAmount === amount && now - this.data.lastTapAt <= DOUBLE_TAP_WINDOW_MS

      if (isDoubleTap) {
        this.enterDeleteMode()
        return
      }

      this.triggerEvent('select', { amount }, {})
      this.clearDoubleTapTimer()
      this.setData({
        lastTapAmount: amount,
        lastTapAt: now
      })
      this.doubleTapTimer = setTimeout(() => {
        this.doubleTapTimer = null
        this.setData({
          lastTapAmount: 0,
          lastTapAt: 0
        })
      }, DOUBLE_TAP_WINDOW_MS)
    },

    enterDeleteMode() {
      if (this.data.deleteMode) {
        return
      }

      this.clearDoubleTapTimer()
      this.setData({
        deleteMode: true,
        dialogVisible: false,
        lastTapAmount: 0,
        lastTapAt: 0
      })
      this.triggerEvent('modechange', { deleteMode: true }, {})
    },

    exitDeleteMode() {
      if (!this.data.deleteMode) {
        return
      }

      this.clearDoubleTapTimer()
      this.setData({
        deleteMode: false,
        lastTapAmount: 0,
        lastTapAt: 0
      })
      this.triggerEvent('modechange', { deleteMode: false }, {})
    },

    handleDeleteTap(e) {
      const amount = Number(e.currentTarget.dataset.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        return
      }

      this.triggerEvent('delete', { amount }, {})
    }
  }
})
