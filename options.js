'use strict';

import { i18n } from './browser/i18n.js';
import { storage } from './browser/storage.js';
import { createShortcutInput } from './utils/shortcut.js';

const { shortcutReverse: lastShortcutReverse, shortcutClear: lastShortcutClear } = await storage.local.getAsync([
  'shortcutReverse',
  'shortcutClear',
]);

document.title = i18n.getMessage('appOptions');
document.querySelectorAll('[data-locale]').forEach(elem => {
  elem.innerText = i18n.getMessage(elem.dataset.locale);
});

document.getElementById('version').innerText = chrome.runtime.getManifest().version;
document.getElementById('author').innerText = chrome.runtime.getManifest().author;
document.getElementById('sourceCode').href = chrome.runtime.getManifest().homepage_url;

const _shortcutsEl = document.getElementById('shortcuts');

const shortcutLocale = {
  buttonLabel: i18n.getMessage('shortcutEdit'),
  placeholderEmpty: i18n.getMessage('shortcutNotSet'),
  placeholderFocus: i18n.getMessage('shortcutEnter'),
  errorModifierRequired: i18n.getMessage('shortcutErrorModifierRequired'),
  errorLetterRequired: i18n.getMessage('shortcutErrorLetterRequired'),
};
const shortcutFeatures = {
  allowFKeys: true,
  allowNumpad: true,
  allowArrows: true,
};

_addShortcut(
  createShortcutInput(
    i18n.getMessage('clear'),
    lastShortcutClear,
    async e => {
      await storage.local.setAsync({
        shortcutClear: e.shortcut,
        shortcutClearUserDefined: true,
      });
    },
    shortcutLocale,
    shortcutFeatures,
  ),
);

_addShortcut(
  createShortcutInput(
    i18n.getMessage('reverseTranslation'),
    lastShortcutReverse,
    async e => {
      await storage.local.setAsync({
        shortcutReverse: e.shortcut,
        shortcutReverseUserDefined: true,
      });
    },
    shortcutLocale,
    shortcutFeatures,
  ),
);

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

/**
 * @param {HTMLElement} element
 */
function _addShortcut(element) {
  element.classList.add('row', 'shortcut-row');
  _shortcutsEl.appendChild(element);
}
