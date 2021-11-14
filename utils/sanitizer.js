'use strict';

const _htmlSanitizer = document.createElement('span');

/**
 * @param {string} html
 * @returns {string}
 */
export function escapeHtml(html) {
  _htmlSanitizer.innerText = html;
  return _htmlSanitizer.innerHTML;
}
