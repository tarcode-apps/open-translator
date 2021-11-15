'use strict';

import { createRipple } from './utils/ripple.js';
import { createHtmlTextArea } from './utils/textarea.js';
import { storage } from './browser/storage.js';
import { i18n } from './browser/i18n.js';
import { GoogleTranslator } from './translators/google-translator.js';

/** @type {GoogleTranslator} */
let _translator;
const _translators = [new GoogleTranslator()];

/** @type {{
 * sourceLanguages: Array<{code, friendlyName}>,
 * targetLanguages: Array<{code, friendlyName}>,
 * autoDetectLanguageCode: string
}} */
let _languages = {};

document.title = i18n.getMessage('appName');

/** @type {HTMLSelectElement} */
const _translatorSelect = document.getElementById('translator');
_translatorSelect.addEventListener(
  'change',
  async e => {
    await setTranslatorByUidAsync(e.target.value);
  },
  { passive: true },
);

/** @type {HTMLSelectElement} */
const _langSourceSelect = document.getElementById('lang-source');
_langSourceSelect.addEventListener(
  'change',
  async e => {
    await storage.local.setAsync({ sourceLangCode: e.target.value });
  },
  { passive: true },
);

/** @type {HTMLSelectElement} */
const _langTargetSelect = document.getElementById('lang-target');
_langTargetSelect.addEventListener(
  'change',
  async e => {
    await storage.local.setAsync({ targetLangCode: e.target.value });
  },
  { passive: true },
);

/** @type {HTMLButtonElement} */
const _langSwapButton = document.getElementById('lang-swap');
_langSwapButton.title = i18n.getMessage('swapLanguages');
_langSwapButton.addEventListener('click', async () => await swapAsync(), { passive: true });

/** @type {HTMLTextAreaElement} */
const _sourceTextArea = document.getElementById('source');
_sourceTextArea.placeholder = i18n.getMessage('sourcePlaceholder');
let _sourceTextDebounce;
_sourceTextArea.addEventListener(
  'input',
  e => {
    clearTimeout(_sourceTextDebounce);
    _sourceTextDebounce = setTimeout(async () => {
      await storage.local.setAsync({
        sourceText: e.target.value,
      });
    }, 200);
  },
  { passive: true },
);
_sourceTextArea.addEventListener(
  'keydown',
  async e => {
    if ((e.ctrlKey || e.metaKey) && e.code == 'Enter') {
      await translateAsync();
    }
  },
  { passive: true },
);

/** @type {HTMLElement} */
const _targetTextArea = createHtmlTextArea(document.getElementById('target'));
_targetTextArea.placeholder = i18n.getMessage('targetPlaceholder');

/** @type {HTMLElement} */
const _reverseTextArea = createHtmlTextArea(document.getElementById('reverse'));
_reverseTextArea.placeholder = i18n.getMessage('reversePlaceholder');

/** @type {HTMLButtonElement} */
const _translateButton = document.getElementById('translate');
_translateButton.innerText = i18n.getMessage('translate');
_translateButton.addEventListener('click', async () => await translateAsync(), { passive: true });

/** @type {HTMLButtonElement} */
const _clearButton = document.getElementById('clear');
_clearButton.innerText = i18n.getMessage('clear');
_clearButton.addEventListener('click', () => clearAsync(), { passive: true });

/** @type {HTMLElement} */
const _reverseSection = document.getElementById('reverse-section');

/** @type {HTMLInputElement} */
const _reverseCheckbox = document.getElementById('reverse-checkbox');
_reverseCheckbox.addEventListener(
  'change',
  async e => {
    const reverse = e.target.checked;
    await storage.local.setAsync({ reverse });
    updateReverse(reverse);
    if (reverse) await translateAsync();
  },
  { passive: true },
);

/** @type {HTMLSpanElement} */
const _reverseText = document.getElementById('reverse-text');
_reverseText.innerText = i18n.getMessage('reverseTranslation');

/** @type {string} */
const _uiLanguageCode = i18n.getUILanguage();

/**
 * @param {string} uid
 */
async function setTranslatorByUidAsync(uid) {
  _translator = _translators.find(t => t.uid === uid) ?? _translators[0];
  await storage.local.setAsync({
    translatorUid: _translator.uid,
  });
  _translatorSelect.value = _translator.uid;
  await loadSupportedLanguagesAsync();
}

async function loadSupportedLanguagesAsync() {
  let {
    cacheLanguages: languages,
    cacheTranslatorUid: translatorUid,
    cacheUiLanguageCode: uiLanguageCode,
  } = await storage.local.getAsync(['cacheLanguages', 'cacheTranslatorUid', 'cacheUiLanguageCode']);

  if (!languages || translatorUid !== _translator.uid || uiLanguageCode !== _uiLanguageCode) {
    languages = await _translator.getSupportedLanguagesAsync(_uiLanguageCode);

    const acceptLanguages = await i18n.getAcceptLanguagesAsync();

    const importantLanguages = {};
    importantLanguages[languages.autoDetectLanguageCode] = 1;
    importantLanguages['en'] = 2;
    acceptLanguages.filter(l => !l.startsWith('en')).forEach((l, i) => (importantLanguages[l] = i + 3));

    const languageComparator = (a, b) => {
      const importantA = importantLanguages[a.code];
      const importantB = importantLanguages[b.code];

      if (importantA && !importantB) return -1;
      if (importantB && !importantA) return 1;
      if (importantA && importantB) return importantA - importantB;
      return a.friendlyName.localeCompare(b.friendlyName);
    };

    languages.sourceLanguages.sort((a, b) => languageComparator(a, b));
    languages.targetLanguages.sort((a, b) => languageComparator(a, b));

    await storage.local.setAsync({
      cacheLanguages: languages,
      cacheTranslatorUid: _translator.uid,
      cacheUiLanguageCode: _uiLanguageCode,
    });
  }

  _languages = languages;

  updateLanguagesSelect(_langSourceSelect, languages.sourceLanguages);
  updateLanguagesSelect(_langTargetSelect, languages.targetLanguages);

  let { sourceLangCode, targetLangCode } = await storage.local.getAsync(['sourceLangCode', 'targetLangCode']);

  if (languages.sourceLanguages.every(l => l.code !== sourceLangCode)) {
    sourceLangCode = languages.sourceLanguages[0].code;
    await storage.local.setAsync({ sourceLangCode });
  }
  _langSourceSelect.value = sourceLangCode;

  if (languages.targetLanguages.every(l => l.code !== targetLangCode)) {
    targetLangCode = languages.targetLanguages[0].code;
    await storage.local.setAsync({ targetLangCode });
  }
  _langTargetSelect.value = targetLangCode;
}

/**
 * @param {string} lastSourceText
 */
function preventDataLose(lastSourceText) {
  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.code == 'KeyZ') {
      e.preventDefault();
      _sourceTextArea.removeEventListener('input', onKeyDown);
      _sourceTextArea.value = lastSourceText;
    }
  };

  _sourceTextArea.addEventListener('keydown', onKeyDown);
  _sourceTextArea.addEventListener(
    'input',
    () => {
      _sourceTextArea.removeEventListener('input', onKeyDown);
    },
    { passive: true, once: true },
  );
}

/**
 * @param {HTMLSelectElement} select
 * @param {Array<{code, friendlyName}>} languages
 */
function updateLanguagesSelect(select, languages) {
  while (select.options.length > 0) {
    select.remove(0);
  }
  for (const lang of languages) {
    select.add(new Option(lang.friendlyName, lang.code));
  }
}

/**
 * @param {boolean} value
 */
function updateReverse(value) {
  value ? _reverseSection.removeAttribute('hidden') : _reverseSection.setAttribute('hidden', '');
}

/**
 * @param {string} languageCode
 */
async function updateAutoOptionAsync(languageCode) {
  if (!_languages.autoDetectLanguageCode) return;

  const autoOption = Array.from(_langSourceSelect.options).find(o => o.value === _languages.autoDetectLanguageCode);
  if (languageCode) {
    const lang = _languages.sourceLanguages.find(l => l.code === languageCode);
    autoOption.text = i18n.getMessage('detectedLanguage', [lang.friendlyName]);
  } else {
    const lang = _languages.sourceLanguages.find(l => l.code === _languages.autoDetectLanguageCode);
    autoOption.text = lang.friendlyName;
  }

  await storage.local.setAsync({
    detectedLanguageCode: languageCode,
  });
}

/**
 * @param {HTMLElement} textArea
 * @param {{
 *  translatedText: string,
 *  sourceLanguageCode: string,
 *  dictionary: Array<{
 *    partOfSpeech: string,
 *    terms: Array<{
 *      word: string,
 *      reverseTranslation: Array<string>,
 *    }>
 *  }>
 * }} translation
 */
function generateTranslationHtml(textArea, translation) {
  textArea.innerHTML = '';

  if (!translation.dictionary) {
    textArea.appendChild(document.createTextNode(translation.translatedText));
    return;
  }

  const translationNode = document.createElement('span');
  translationNode.classList.add('dictionary-translation');
  translationNode.innerText = translation.translatedText;
  textArea.appendChild(translationNode);

  for (const entity of translation.dictionary) {
    if (entity.partOfSpeech) {
      const partOfSpeechNode = document.createElement('div');
      partOfSpeechNode.classList.add('part-of-speech');
      partOfSpeechNode.innerText = entity.partOfSpeech;
      textArea.appendChild(partOfSpeechNode);
    }

    for (const term of entity.terms) {
      const termNode = document.createElement('div');
      termNode.classList.add('term');
      textArea.appendChild(termNode);

      const termWordNode = document.createElement('div');
      termWordNode.classList.add('term-word');
      termWordNode.innerText = term.word;
      termNode.appendChild(termWordNode);

      const termReverseNode = document.createElement('div');
      termReverseNode.classList.add('term-reverse');
      termNode.appendChild(termReverseNode);

      for (const reverse of term.reverseTranslation) {
        const termReverseWordNode = document.createElement('div');
        termReverseWordNode.classList.add('term-reverse-word');
        termReverseWordNode.innerText = reverse;
        termReverseWordNode.addEventListener(
          'click',
          async e => {
            if (_sourceTextArea.value !== e.target.innerText) {
              _sourceTextArea.value = e.target.innerText;
              await translateAsync();
            }
          },
          { passive: true },
        );
        termReverseNode.appendChild(termReverseWordNode);
      }
    }
  }
}

/**
 * @param {HTMLElement} textArea
 * @param {{
 *  code: string,
 *  message: string,
 * }} error
 */
function generateErrorHtml(textArea, error) {
  textArea.innerHTML = '';

  if (error.code) {
    const errorCodeNode = document.createElement('span');
    errorCodeNode.classList.add('error-code');
    errorCodeNode.innerText = error.code;
    textArea.appendChild(errorCodeNode);
  }

  let message;
  switch (error.code) {
    case 429:
      message = i18n.getMessage('errorTooManyRequests');
      break;
    case 414:
      message = i18n.getMessage('errorUriTooLong');
      break;
    default:
      message = error.message || i18n.getMessage('errorUnknown');
  }

  const errorMessageNode = document.createElement('span');
  errorMessageNode.classList.add('error-message');
  errorMessageNode.innerText = message;
  textArea.appendChild(errorMessageNode);
}

/**
 * @param {string} sourceLanguageCode
 * @param {string} targetLanguageCode
 * @returns {string}
 */
async function findBestTargetLanguageCodeAsync(sourceLanguageCode, targetLanguageCode) {
  let { languagePairs } = await storage.local.getAsync(['languagePairs']);
  for (const pair of languagePairs ?? []) {
    if (pair.sourceLanguageCode === sourceLanguageCode) {
      return pair.targetLanguageCode;
    }

    if (pair.targetLanguageCode === sourceLanguageCode) {
      return pair.sourceLanguageCode;
    }
  }

  return targetLanguageCode;
}

/**
 * @param {string} sourceLanguageCode
 * @param {string} targetLanguageCode
 */
async function storeLanguagePairAsync(sourceLanguageCode, targetLanguageCode) {
  let { languagePairs } = await storage.local.getAsync(['languagePairs']);
  languagePairs = [
    { sourceLanguageCode, targetLanguageCode },
    ...(languagePairs ?? []).filter(p => {
      return (
        p.sourceLanguageCode !== p.targetLanguageCode &&
        (p.sourceLanguageCode !== sourceLanguageCode || p.targetLanguageCode !== targetLanguageCode) &&
        (p.targetLanguageCode !== sourceLanguageCode || p.sourceLanguageCode !== targetLanguageCode)
      );
    }),
  ];
  await storage.local.setAsync({ languagePairs });
}

async function translateAsync() {
  const sourceText = _sourceTextArea.value;
  if (!sourceText) {
    await clearAsync();
    return;
  }

  try {
    let sourceLanguageCode = _langSourceSelect.value;
    let targetLanguageCode = _langTargetSelect.value;

    if (sourceLanguageCode === _languages.autoDetectLanguageCode) {
      const detection = await i18n.detectLanguageAsync(sourceText);
      if (detection.isReliable) {
        const detectedCode = detection.languages[0].language;
        if (detectedCode == targetLanguageCode) {
          targetLanguageCode = await findBestTargetLanguageCodeAsync(detectedCode, targetLanguageCode);
          _langTargetSelect.value = targetLanguageCode;
        }
      }
    }

    let translation = await _translator.translateAsync(
      sourceText,
      sourceLanguageCode,
      targetLanguageCode,
      _uiLanguageCode,
      { translation: true, dictionary: true },
    );

    if (sourceLanguageCode === _languages.autoDetectLanguageCode) {
      sourceLanguageCode = translation.sourceLanguageCode;
      await updateAutoOptionAsync(sourceLanguageCode);
    } else {
      await updateAutoOptionAsync('');
    }

    if (sourceLanguageCode === targetLanguageCode) {
      targetLanguageCode = await findBestTargetLanguageCodeAsync(sourceLanguageCode, targetLanguageCode);

      if (sourceLanguageCode !== targetLanguageCode) {
        _langTargetSelect.value = targetLanguageCode;
        await storeLanguagePairAsync(sourceLanguageCode, targetLanguageCode);
        translation = await _translator.translateAsync(
          sourceText,
          sourceLanguageCode,
          targetLanguageCode,
          _uiLanguageCode,
          { translation: true, dictionary: true },
        );
      }
    } else {
      await storeLanguagePairAsync(sourceLanguageCode, targetLanguageCode);
    }

    generateTranslationHtml(_targetTextArea, translation);
    await storage.local.setAsync({
      sourceText,
      translated: translation,
    });

    if (_reverseCheckbox.checked) {
      const reverse = await _translator.translateAsync(
        translation.translatedText,
        targetLanguageCode,
        sourceLanguageCode,
        _uiLanguageCode,
        { translation: true },
      );
      generateTranslationHtml(_reverseTextArea, reverse);
      await storage.local.setAsync({
        translatedReverse: reverse,
      });
    } else {
      _reverseTextArea.innerHTML = '';
      await storage.local.setAsync({
        translatedReverse: undefined,
      });
    }
  } catch (error) {
    generateErrorHtml(_targetTextArea, error);
    _reverseTextArea.innerHTML = '';
    await storage.local.setAsync({
      sourceText: '',
      translated: undefined,
      translatedReverse: undefined,
    });
  }
}

async function clearAsync() {
  _sourceTextArea.value = '';
  _targetTextArea.innerHTML = '';
  _reverseTextArea.innerHTML = '';
  await updateAutoOptionAsync('');
}

async function swapAsync() {
  let sourceLanguageCode = _langSourceSelect.value;
  let targetLanguageCode = _langTargetSelect.value;
  if (sourceLanguageCode === _languages.autoDetectLanguageCode) {
    const { detectedLanguageCode: lastDetectedLanguageCode } = await storage.local.getAsync(['detectedLanguageCode']);
    if (!lastDetectedLanguageCode) return;

    sourceLanguageCode = lastDetectedLanguageCode;
  }

  _langSourceSelect.value = targetLanguageCode;
  _langTargetSelect.value = sourceLanguageCode;
}

(async () => {
  const buttons = document.getElementsByTagName('button');
  for (const button of buttons) {
    button.addEventListener('click', createRipple, { passive: true });
  }

  window.addEventListener('keydown', handleFirstTab, { passive: true });
  function handleFirstTab(event) {
    if (event.code == 'Tab') {
      document.body.classList.add('focus-outline-visible');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }

  document.addEventListener(
    'keydown',
    async e => {
      if (e.altKey && e.code == 'KeyR') {
        const reverse = (_reverseCheckbox.checked = !_reverseCheckbox.checked);
        await storage.local.setAsync({ reverse });
        updateReverse(reverse);
        if (reverse) await translateAsync();
      }
    },
    { passive: true },
  );

  for (const translator of _translators) {
    _translatorSelect.add(new Option(translator.friendlyName, translator.uid));
  }

  if (_translators.length > 1) {
    _translatorSelect.removeAttribute('hidden');
  }

  const {
    translatorUid: lastTranslatorUid,
    reverse,
    sourceText: lastSourceText,
    selectedText: lastSelectedText,
    translated: lastTranslated,
    translatedReverse: lastTranslatedReverse,
    detectedLanguageCode: lastDetectedLanguageCode,
  } = await storage.local.getAsync([
    'translatorUid',
    'reverse',
    'sourceText',
    'selectedText',
    'translated',
    'translatedReverse',
    'detectedLanguageCode',
  ]);

  _reverseCheckbox.checked = reverse;
  updateReverse(reverse);

  await setTranslatorByUidAsync(lastTranslatorUid);

  if (lastSelectedText && lastSelectedText !== lastSourceText) {
    _sourceTextArea.value = lastSelectedText;
    if (lastSourceText) preventDataLose(lastSourceText);
    await translateAsync();
  } else if (lastSourceText) {
    _sourceTextArea.value = lastSourceText;
    await updateAutoOptionAsync(lastDetectedLanguageCode);
    if (lastTranslated && (!reverse || lastTranslatedReverse)) {
      generateTranslationHtml(_targetTextArea, lastTranslated);
      if (lastTranslatedReverse) {
        generateTranslationHtml(_reverseTextArea, lastTranslatedReverse);
      }
    } else {
      await translateAsync();
    }
  }
})();
