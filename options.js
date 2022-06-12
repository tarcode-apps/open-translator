'use strict';

import { i18n } from './browser/i18n.js';
import { storage } from './browser/storage.js';
import { createShortcutInput } from './utils/shortcut.js';

const {
  shortcutReverse: lastShortcutReverse,
  shortcutClear: lastShortcutClear,
  ttsEnabled: lastTtsEnabled,
} = await storage.local.getAsync(['shortcutReverse', 'shortcutClear', 'ttsEnabled']);

document.title = i18n.getMessage('appOptions');
document.querySelectorAll('[data-locale]').forEach(elem => {
  elem.innerText = i18n.getMessage(elem.dataset.locale);
});

document.getElementById('version').innerText = chrome.runtime.getManifest().version;
document.getElementById('author').innerText = chrome.runtime.getManifest().author;
document.getElementById('sourceCode').href = chrome.runtime.getManifest().homepage_url;

const _shortcutsEl = document.getElementById('shortcuts');

/** @type {HTMLDivElement} */
const _ttsEnabledRowEl = document.getElementById('ttsEnabledRow');
_ttsEnabledRowEl.addEventListener('click', () => _ttsEnabledEl.click(), { passive: true });

const _ttsEnabledCheckboxEl = document.getElementById('ttsEnabledCheckbox');
_ttsEnabledCheckboxEl.addEventListener('click', event => event.stopPropagation());

/** @type {HTMLInputElement} */
const _ttsEnabledEl = document.getElementById('ttsEnabled');
_ttsEnabledEl.checked = lastTtsEnabled ?? false;
_ttsEnabledEl.addEventListener(
  'change',
  async () => {
    const ttsEnabled = _ttsEnabledEl.checked;
    await storage.local.setAsync({
      ttsEnabled: ttsEnabled,
    });
  },
  { passive: true },
);

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
