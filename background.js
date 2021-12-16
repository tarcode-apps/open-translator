'use strict';

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['prefersScheme'], ({ prefersScheme: lastPrefersScheme }) => {
    setIcon(false, lastPrefersScheme);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['shortcutReverseUserDefined'], ({ shortcutReverseUserDefined }) => {
    if (!shortcutReverseUserDefined) {
      chrome.storage.local.set({
        shortcutReverse: {
          code: 'KeyR',
          altKey: true,
          ctrlKey: false,
          shiftKey: false,
        },
      });
    }
  });
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.selectedText) {
    const selectedText = changes.selectedText.newValue;
    chrome.storage.local.get(['prefersScheme'], ({ prefersScheme: lastPrefersScheme }) => {
      setIcon(!!selectedText, lastPrefersScheme);
    });
  } else if (changes.prefersScheme) {
    if (changes.prefersScheme.newValue != changes.prefersScheme.oldValue) {
      chrome.storage.local.get(['selectedText'], ({ selectedText: lastSelectedText }) => {
        setIcon(!!lastSelectedText, changes.prefersScheme.newValue);
      });
    }
  }
});

chrome.commands.onCommand.addListener(async command => {
  switch (command) {
    case 'translate_page': {
      await translatePage();
      break;
    }
  }
});

chrome.storage.local.get(
  ['selectedText', 'prefersScheme'],
  ({ selectedText: lastSelectedText, prefersScheme: lastPrefersScheme }) => {
    setIcon(!!lastSelectedText, lastPrefersScheme);
  },
);

/**
 * @param {boolean} selected
 * @param {'light' | 'dark' | undefined} colorScheme
 */
function setIcon(selected, colorScheme) {
  let path = selected ? 'selected' : 'default';

  switch (colorScheme) {
    case 'light':
      break;
    case 'dark':
      path = 'dark/' + path;
      break;
    default:
      path = 'icon';
  }

  path = 'images/' + path;
  chrome.action.setIcon({
    path: Object.fromEntries(Object.keys(chrome.runtime.getManifest().icons).map(size => [size, `${path}${size}.png`])),
  });
}

async function translatePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!/^https?:\/\//.test(tab?.url)) return;

  const uiLanguageCode = navigator.language;
  const sourceLanguageCode = 'auto';
  chrome.storage.local.get(['targetLangCode'], ({ targetLangCode }) => {
    targetLangCode ??= uiLanguageCode;
    chrome.tabs.create({
      openerTabId: tab.id,
      index: tab.index + 1,
      url: makeTranslatedPageUrl(tab.url, sourceLanguageCode, targetLangCode, uiLanguageCode),
    });
  });
}

function makeTranslatedPageUrl(sourceUrl, sourceLanguageCode, targetLanguageCode, uiLanguageCode) {
  let url = `https://translate.google.com/translate`;
  url += `?hl=${uiLanguageCode}`;
  url += `&sl=${sourceLanguageCode}`;
  url += `&tl=${targetLanguageCode}`;
  url += `&u=${encodeURIComponent(sourceUrl)}`;
  return url;
}
