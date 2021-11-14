'use strict';

export class GoogleTranslator {
  _clientName = 'gtx';
  _baseUrl = 'https://translate.googleapis.com/translate_a';

  get uid() {
    return 'google';
  }

  get friendlyName() {
    return 'Google Translate';
  }

  /**
   * @param {string} uiLanguageCode
   * @return {Promise<{
   *  sourceLanguages: Array<{code, friendlyName}>,
   *  targetLanguages: Array<{code, friendlyName}>,
   *  autoDetectLanguageCode: string,
   * }>}
   */
  async getSupportedLanguagesAsync(uiLanguageCode) {
    let url = `${this._baseUrl}/l`;
    url += `?client=${this._clientName}`;
    url += `&hl=${uiLanguageCode}`;

    const toTitleCase = name => name[0].toUpperCase() + name.substr(1).toLowerCase();

    const json = await this._getAsync(url);
    return {
      sourceLanguages: Object.entries(json.sl).map(([k, v]) => ({
        code: k,
        friendlyName: toTitleCase(v),
      })),
      targetLanguages: Object.entries(json.tl).map(([k, v]) => ({
        code: k,
        friendlyName: toTitleCase(v),
      })),
      autoDetectLanguageCode: 'auto',
    };
  }

  /**
   * @param {string} sourceText
   * @param {string} sourceLanguageCode
   * @param {string} targetLanguageCode
   * @param {string} uiLanguageCodeCode
   * @param {{
   *  translation: boolean,
   *  alternateTranslations: boolean,
   *  transcription: boolean,
   *  dictionary: boolean,
   *  definitions: boolean,
   *  synonyms: boolean,
   *  examples: boolean,
   * }} requests
   * @return {Promise<{
   *  translatedText: string,
   *  sourceLanguageCode: string,
   *  dictionary: Array<{
   *    partOfSpeech: string,
   *    terms: Array<{
   *      word: string,
   *      reverseTranslation: Array<string>,
   *    }>
   *  }>
   * }>}
   */
  async translateAsync(sourceText, sourceLanguageCode, targetLanguageCode, uiLanguageCode, requests) {
    let url = `${this._baseUrl}/single`;
    url += `?client=${this._clientName}`;
    url += `&hl=${uiLanguageCode}`;
    url += '&dj=1';
    url += `&sl=${sourceLanguageCode}`;
    url += `&tl=${targetLanguageCode}`;
    url += `&q=${encodeURIComponent(sourceText)}`;

    requests ??= { translation: true };
    if (requests.translation) url += '&dt=t'; // translation of source text
    if (requests.alternateTranslations) url += '&dt=at'; // alternate translations
    if (requests.transcription) url += '&dt=rm'; // transcription / transliteration of source and translated texts
    if (requests.dictionary) url += '&dt=bd'; // dictionary, in case source text is one word (you get translations with articles, reverse translations, etc.)
    if (requests.definitions) url += '&dt=md'; // definitions of source text, if it's one word
    if (requests.synonyms) url += '&dt=ss'; // synonyms of source text, if it's one word
    if (requests.examples) url += '&dt=ex'; // examples

    const json = await this._getAsync(url);
    return {
      translatedText: json.sentences.reduce((acc, cur) => acc + cur.trans, ''),
      sourceLanguageCode: json.src,
      dictionary: json.dict?.map(d => ({
        partOfSpeech: d.pos,
        terms: d.entry.map(e => ({
          word: e.word,
          reverseTranslation: e.reverse_translation,
        })),
      })),
    };
  }

  async _getAsync(url) {
    let response = await fetch(url, {
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw {
        code: response.status,
        message: response.statusText,
      };
    }

    return await response.json();
  }
}
