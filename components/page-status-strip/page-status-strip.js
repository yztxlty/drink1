Component({
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    tone: {
      type: String,
      value: 'home'
    },
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    metricValue: {
      type: String,
      value: ''
    },
    metricLabel: {
      type: String,
      value: ''
    },
    actionLabel: {
      type: String,
      value: ''
    },
    actionDisabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onActionTap() {
      if (this.data.actionDisabled || !this.data.actionLabel) {
        return
      }

      this.triggerEvent('action', {}, {})
    }
  }
})
