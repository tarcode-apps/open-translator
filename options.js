'use strict';

import { i18n } from './browser/i18n.js';
import { storage } from './browser/storage.js';

document.title = i18n.getMessage('appOptions');
document.querySelectorAll('[data-locale]').forEach(elem => {
  elem.innerText = i18n.getMessage(elem.dataset.locale);
});

document.getElementById('version').innerText = chrome.runtime.getManifest().version;
document.getElementById('author').innerText = chrome.runtime.getManifest().author;
document.getElementById('sourceCode').href = chrome.runtime.getManifest().homepage_url;

/** @type {HTMLElement} */
const _resetSettings = document.getElementById('resetSettings');
_resetSettings.addEventListener(
  'click',
  async () => {
    if (confirm(i18n.getMessage('troubleshootingResetSettingsQuestion'))) {
      await storage.local.clearAsync();
    }
  },
  { passive: true },
);
