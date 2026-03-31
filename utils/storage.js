const memoryStorage = {};

function getStorageDriver() {
  if (typeof wx !== 'undefined' && wx.getStorageSync && wx.setStorageSync) {
    return wx;
  }

  return {
    getStorageSync(key) {
      return memoryStorage[key];
    },
    setStorageSync(key, value) {
      memoryStorage[key] = value;
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorage(key) {
  return getStorageDriver().getStorageSync(key);
}

function writeStorage(key, value) {
  getStorageDriver().setStorageSync(key, value);
  return value;
}

module.exports = {
  clone,
  getStorageDriver,
  readStorage,
  writeStorage
};
