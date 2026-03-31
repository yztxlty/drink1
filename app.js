const store = require('./utils/store');

App({
  onLaunch() {
    const state = store.initStore();
    this.globalData.store = store;
    this.globalData.userInfo = store.getProfileViewModel().profile;
    this.globalData.appState = state;
  },

  onShow() {
    store.syncSessionHeartbeat();
    const state = store.getStore();
    this.globalData.userInfo = store.getProfileViewModel().profile;
    this.globalData.appState = state;
  },

  globalData: {
    appState: null,
    store,
    userInfo: null
  }
});
