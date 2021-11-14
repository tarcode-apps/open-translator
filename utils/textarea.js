'use strict';

/**
 * @param {HTMLElement} element
 */
export function createHtmlTextArea(element) {
  let lastInnerHtml;

  element.addEventListener('cut', e => e.preventDefault());
  element.addEventListener('paste', e => e.preventDefault());
  element.addEventListener('drop', e => e.preventDefault());
  element.addEventListener('drag', () => {
    lastInnerHtml = element.innerHTML;
  });
  element.addEventListener('dragend', e => {
    if (e.dataTransfer.dropEffect === 'move' && lastInnerHtml) {
      element.innerHTML = lastInnerHtml;
    }
  });
  element.addEventListener('keydown', e => {
    if (e.code === 'Tab') return true;

    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && e.code === 'KeyA') return true;
    if (isCtrl && e.code === 'KeyC') return true;
    if (isCtrl && e.code === 'KeyX') document.execCommand('copy');
    e.preventDefault();
  });

  Object.defineProperty(element, 'placeholder', {
    get: () => element.getAttribute('placeholder'),
    set: newValue => element.setAttribute('placeholder', newValue),
  });

  Object.defineProperty(element, 'value', {
    get: () => element.innerHTML,
    set: newValue => (element.innerHTML = newValue),
  });

  return element;
}
