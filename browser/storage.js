'use strict';

class StorageArea {
  _area;

  get onChanged() {
    return this._area.onChanged;
  }

  constructor(areaName) {
    this._area = chrome.storage[areaName];
  }

  /**
   * @param {string | string[] | object | null} keys
   * @returns {Promise<object>}
   */
  getAsync(keys) {
    return new Promise((resolve, reject) => {
      this._area.get(keys, data => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(data);
      });
    });
  }

  /**
   * @param {object} items
   * @returns {Promise<void>}
   */
  setAsync(items) {
    return new Promise((resolve, reject) => {
      this._area.set(items, () => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });
  }

  /**
   * @returns {Promise<void>}
   */
  clearAsync() {
    return new Promise((resolve, reject) => {
      this._area.clear(() => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });
  }
}

export const storage = {
  local: new StorageArea('local'),
  sync: new StorageArea('sync'),
};
