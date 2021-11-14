'use strict';

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['prefersScheme'], ({ prefersScheme: lastPrefersScheme }) => {
    setIcon(false, lastPrefersScheme);
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
    path: [16, 32, 48, 128].reduce((acc, size) => {
      acc[size] = `${path}${size}.png`;
      return acc;
    }, {}),
  });
}
