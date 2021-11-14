'use strict';

class I18n {
  /**
   * @param {string} messageName
   * @param {Array<string>?} substitutions
   * @returns {string}
   */
  getMessage(messageName, substitutions) {
    return chrome.i18n.getMessage(messageName, substitutions);
  }

  /**
   * @returns {string}
   */
  getUILanguage() {
    return chrome.i18n.getUILanguage();
  }

  /**
   * @returns {Promise<Array<string>>}
   */
  getAcceptLanguagesAsync() {
    return new Promise((resolve, reject) => {
      chrome.i18n.getAcceptLanguages(languages => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(languages);
      });
    });
  }

  /**
   * @param {string} text
   * @returns {Promise<{
   *  isReliable: boolean,
   *  languages: Array<{
   *    language: string,
   *  }>,
   * }>}
   */
  detectLanguageAsync(text) {
    return new Promise((resolve, reject) => {
      chrome.i18n.detectLanguage(text, result => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(result);
      });
    });
  }
}

export const i18n = new I18n();
