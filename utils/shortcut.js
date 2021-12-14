'use strict';

/**
 * @typedef {{
 *  code: string,
 *  ctrlKey: boolean,
 *  altKey: boolean,
 *  shiftKey: boolean,
 * }} Shortcut
 */

/**
 * @typedef {{
 *  buttonLabel: string,
 *  placeholderEmpty: string,
 *  placeholderFocus: string,
 *  errorModifierRequired: string,
 *  errorLetterRequired: string,
 * }} ShortcutLocale
 */

/**
 * @typedef {{
 *  allowOneKey: boolean,
 *  allowNumpad: boolean,
 *  allowArrows: boolean,
 *  allowFKeys: boolean,
 * }} ShortcutFeatures
 */

/**
 * @callback shortcutCallback
 * @param {{
 *  shortcut: Shortcut
 * }} event
 */

/**
 * @param {string} commandName
 * @param {shortcutCallback} callback
 * @param {ShortcutLocale} locale
 * @param {ShortcutFeatures} features
 * @returns {HTMLElement}
 */
export function createShortcutInput(commandName, commandShortcut, callback, locale, features) {
  features ??= {};

  const container = document.createElement('div');

  const label = document.createElement('label');
  label.innerText = commandName;
  container.appendChild(label);

  const shortcutInput = document.createElement('div');
  shortcutInput.classList.add('shortcut-input');
  container.appendChild(shortcutInput);

  const editableInput = document.createElement('div');
  editableInput.classList.add('editable-input');
  shortcutInput.appendChild(editableInput);

  const inputContainer = document.createElement('div');
  inputContainer.classList.add('input-container');
  editableInput.appendChild(inputContainer);

  const innerInputContainer = document.createElement('div');
  innerInputContainer.classList.add('inner-input-container');
  inputContainer.appendChild(innerInputContainer);

  const input = document.createElement('input');
  input.type = 'text';
  input.readOnly = true;
  input.placeholder = locale.placeholderEmpty;
  input.value = commandShortcut ? _shortcutToString(commandShortcut) : '';
  innerInputContainer.appendChild(input);

  const inputUnderline = document.createElement('div');
  inputUnderline.classList.add('input-underline');
  innerInputContainer.appendChild(inputUnderline);

  const button = document.createElement('button');
  button.classList.add('button-icon');
  button.ariaLabel = locale.buttonLabel;
  editableInput.appendChild(button);

  const buttonIcon = document.createElement('div');
  buttonIcon.classList.add('icon');
  button.appendChild(buttonIcon);

  const error = document.createElement('div');
  error.classList.add('error');
  error.ariaLive = 'assertive';
  shortcutInput.appendChild(error);

  const showError = message => {
    if (message) {
      container.setAttribute('invalid', '');
      error.setAttribute('role', 'alert');
    } else {
      container.removeAttribute('invalid');
      error.removeAttribute('role');
    }
    error.innerText = message ?? '';
  };

  const onInputKeyDown = e => {
    e.preventDefault();

    if (e.code === 'Escape') return blur();

    if (features.allowOneKey || e.ctrlKey || e.metaKey || e.altKey) {
      if (_isAllowedCode(e.code, features)) {
        blur({
          code: e.code,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        });
      } else {
        showError(locale.errorLetterRequired);
      }
    } else {
      showError(locale.errorModifierRequired);
    }
  };

  const onInputKeyUp = e => {
    e.preventDefault();

    if (features.allowOneKey || e.ctrlKey || e.metaKey || e.altKey) return;

    showError(locale.errorModifierRequired);
  };

  const onInputBlur = () => blur();

  const onVisibilityChange = e => {
    if (e.visibilityState === 'hidden') blur();
  };

  const blur = shortcut => {
    input.readOnly = true;
    input.placeholder = locale.placeholderEmpty;
    input.value = shortcut ? _shortcutToString(shortcut) : '';
    input.removeEventListener('keydown', onInputKeyDown);
    input.removeEventListener('keyup', onInputKeyUp);
    input.removeEventListener('blur', onInputBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);

    showError();

    callback({ shortcut: shortcut ?? null });
  };

  button.addEventListener(
    'click',
    () => {
      input.readOnly = false;
      input.focus();
      input.placeholder = locale.placeholderFocus;
      input.value = '';
      input.addEventListener('keydown', onInputKeyDown);
      input.addEventListener('keyup', onInputKeyUp);
      input.addEventListener('blur', onInputBlur, { passive: true });
      document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
    },
    { passive: true },
  );

  return container;
}

/**
 * @param {KeyboardEvent} event
 * @param {Shortcut} shortcut
 * @returns {boolean}
 */
export function isShortcutPressed(event, shortcut) {
  return (
    shortcut &&
    event.altKey === shortcut.altKey &&
    event.ctrlKey === shortcut.ctrlKey &&
    event.shiftKey === shortcut.shiftKey &&
    event.code === shortcut.code
  );
}

/**
 * @param {string} code
 * @param {ShortcutFeatures} features
 * @returns {boolean}
 */
function _isAllowedCode(code, features) {
  if (/^(Key|Digit)[\d\w]$/.test(code)) return true;
  if (features.allowFKeys && /^F\d\d?$/.test(code)) return true;
  if (features.allowNumpad && /^Numpad(\d|\w+)/.test(code)) return true;
  if (features.allowArrows && /^Arrow\w+/.test(code)) return true;

  return false;
}

/**
 * @param {Shortcut} shortcut
 * @returns {string}
 */
function _shortcutToString(shortcut) {
  let text = '';

  const append = part => (text ? `${text} + ${part}` : part);
  if (shortcut.ctrlKey || shortcut.metaKey) text = append('Ctrl');
  if (shortcut.altKey) text = append('Alt');
  if (shortcut.shiftKey) text = append('Shift');
  return append(
    shortcut.code.replace('Key', '').replace('Digit', '').replace('Arrow', 'Arrow ').replace('Numpad', 'Numpad '),
  );
}
