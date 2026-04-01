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
  try {
    return getStorageDriver().getStorageSync(key);
  } catch (error) {
    return memoryStorage[key];
  }
}

function writeStorage(key, value) {
  try {
    getStorageDriver().setStorageSync(key, value);
  } catch (error) {
    memoryStorage[key] = value;
  }
  return value;
}

module.exports = {
  clone,
  getStorageDriver,
  readStorage,
  writeStorage
};
