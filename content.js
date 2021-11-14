'use strict';

let _selectionTimeout;

function updateSelection() {
  const selectedText = document.getSelection().toString().trim();
  try {
    chrome.storage.local.set({ selectedText });
  } catch {
    document.removeEventListener('selectionchange', onSelectionChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
}

function onSelectionChange() {
  clearTimeout(_selectionTimeout);
  _selectionTimeout = setTimeout(() => updateSelection(), 100);
}

function onVisibilityChange() {
  clearTimeout(_selectionTimeout);
  if (document.visibilityState === 'visible') {
    _selectionTimeout = setTimeout(() => updateSelection(), 300);
  }
}

document.addEventListener('selectionchange', onSelectionChange, { passive: true });
document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });

// Workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=893175
const prefersSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
prefersSchemeMedia.addEventListener('change', updatePrefersScheme, { passive: true });

function updatePrefersScheme() {
  try {
    chrome.storage.local.set({ prefersScheme: prefersSchemeMedia.matches ? 'dark' : 'light' });
  } catch {
    prefersSchemeMedia.removeEventListener('change', updatePrefersScheme);
  }
}

updatePrefersScheme();
