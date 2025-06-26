'use strict';

export class ChromeTranslatorWrapper {
  get uid() {
    return `chrome+${this._originTranslator.uid}`;
  }

  get friendlyName() {
    return `Chrome with ${this._originTranslator.friendlyName}`;
  }

  get autoDetectLanguageCode() {
    return this._originTranslator.autoDetectLanguageCode;
  }

  /** @type {import('../types.js').Translator} */
  _originTranslator;

  /**
   * @param {import('../types.js').Translator} originTranslator
   */
  constructor(originTranslator) {
    this._originTranslator = originTranslator;
  }

  /** @type {import('../types.js').GetSupportedLanguagesAsyncFn} */
  async getSupportedLanguagesAsync(uiLanguageCode) {
    return await this._originTranslator.getSupportedLanguagesAsync(uiLanguageCode);
  }

  /** @type {import('../types.js').TranslateAsyncFn} */
  async translateAsync(sourceText, sourceLanguageCode, targetLanguageCode, uiLanguageCode, requests) {
    requests ??= { translation: true };

    let effectiveSourceLanguageCode = sourceLanguageCode;
    if (sourceLanguageCode === this._originTranslator.autoDetectLanguageCode) {
      const detector = await this._createLanguageDetectorAsync();
      if (detector) {
        const detections = await detector.detect(sourceText);
        // Skip und
        if (detections.length > 1) {
          effectiveSourceLanguageCode = detections[0].detectedLanguage;
        }
      }
    }

    let effectiveTranslatedText = '';
    if (requests.translation && effectiveSourceLanguageCode !== this._originTranslator.autoDetectLanguageCode) {
      const translator = await this._createTranslatorAsync(effectiveSourceLanguageCode, targetLanguageCode);
      if (translator) {
        effectiveTranslatedText = await translator.translate(sourceText);
      }
    }

    if (effectiveTranslatedText) {
      requests.translation = false;
    }

    if (
      requests.translation ||
      requests.alternateTranslations ||
      requests.transcription ||
      requests.dictionary ||
      requests.definitions ||
      requests.synonyms ||
      requests.examples
    ) {
      const originTranslation = await this._originTranslator.translateAsync(
        sourceText,
        effectiveSourceLanguageCode,
        targetLanguageCode,
        uiLanguageCode,
        requests,
      );

      if (effectiveSourceLanguageCode !== this._originTranslator.autoDetectLanguageCode) {
        originTranslation.sourceLanguageCode = effectiveSourceLanguageCode;
      }

      if (effectiveTranslatedText) {
        originTranslation.translatedText = effectiveTranslatedText;
      }

      return originTranslation;
    }

    return {
      translatedText: effectiveTranslatedText,
      sourceLanguageCode: effectiveSourceLanguageCode,
    };
  }

  async _createLanguageDetectorAsync() {
    if (!('LanguageDetector' in self)) return null;

    const availability = await LanguageDetector.availability();

    if (availability === 'unavailable') return null;
    if (availability === 'available') return await LanguageDetector.create();

    try {
      const detector = await LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', e => {
            console.log(`LanguageDetector downloaded ${e.loaded * 100}%`);
          });
        },
      });
      await detector.ready;
      return detector;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * @param {string} sourceLanguageCode
   * @param {string} targetLanguageCode
   */
  async _createTranslatorAsync(sourceLanguageCode, targetLanguageCode) {
    if (!('Translator' in self)) return null;

    const availability = await Translator.availability({
      sourceLanguage: sourceLanguageCode,
      targetLanguage: targetLanguageCode,
    });

    if (availability === 'unavailable') return null;
    if (availability === 'available')
      return await Translator.create({
        sourceLanguage: sourceLanguageCode,
        targetLanguage: targetLanguageCode,
      });

    try {
      const translator = await Translator.create({
        sourceLanguage: sourceLanguageCode,
        targetLanguage: targetLanguageCode,
        monitor(m) {
          m.addEventListener('downloadprogress', e => {
            console.log(`Translator ${sourceLanguageCode}:${targetLanguageCode} downloaded ${e.loaded * 100}%`);
          });
        },
      });
      await translator.ready;
      return translator;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
