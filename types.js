/**
 * @type {*}
 */
globalThis.chrome = {};

/**
 * @typedef Language
 * @property {string} code
 * @property {string} friendlyName
 */

/**
 * @typedef SupportedLanguages
 * @property {Array<Language>} sourceLanguages
 * @property {Array<Language>} targetLanguages
 */

/**
 * @typedef Translator
 * @property {string} uid
 * @property {string} friendlyName
 * @property {string} autoDetectLanguageCode
 * @property {GetSupportedLanguagesAsyncFn} getSupportedLanguagesAsync
 * @property {TranslateAsyncFn} translateAsync
 */

/**
 * @callback GetSupportedLanguagesAsyncFn
 * @param {string} uiLanguageCode
 * @return {Promise<SupportedLanguages>}
 */

/**
 * @typedef TranslateRequests
 * @property {boolean} [translation]
 * @property {boolean} [alternateTranslations]
 * @property {boolean} [transcription]
 * @property {boolean} [dictionary]
 * @property {boolean} [definitions]
 * @property {boolean} [synonyms]
 * @property {boolean} [examples]
 */

/**
 * @callback TranslateAsyncFn
 * @param {string} sourceText
 * @param {string} sourceLanguageCode
 * @param {string} targetLanguageCode
 * @param {string} uiLanguageCode
 * @param {TranslateRequests} [requests]
 * @return {Promise<{
 *  translatedText?: string,
 *  sourceLanguageCode: string,
 *  dictionary?: Array<{
 *    partOfSpeech: string,
 *    terms: Array<{
 *      word: string,
 *      reverseTranslation: Array<string>,
 *    }>
 *  }>
 * }>}
 */

export {};
