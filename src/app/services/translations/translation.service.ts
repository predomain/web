import { Injectable } from '@angular/core';
import { generalConfigurations, validTranslations } from '../../configurations';
import { ValidLangEnum } from '../../models';

declare const navigator: any;

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  getTranslation(lang: ValidLangEnum) {
    if (
      lang in validTranslations === false ||
      validTranslations[lang] === undefined
    ) {
      return validTranslations.en;
    }
    return validTranslations[lang];
  }

  getLanguage() {
    const savedLanguage = this.loadLanguage();
    if (
      savedLanguage !== null &&
      savedLanguage !== '' &&
      savedLanguage !== undefined &&
      savedLanguage in validTranslations === true
    ) {
      return savedLanguage;
    } else if (navigator.language) {
      return navigator.language.split('-')[0];
    } else {
      return generalConfigurations.defaultLanguage;
    }
  }

  getLocale() {
    return navigator.language.length <= 2 ? 'en-US' : navigator.language;
  }

  getCacheableLanguagekeys(key: string) {
    const translation = this.getTranslation(this.getLanguage());
    return translation.default[key];
  }

  getText(key: string) {
    const translation = this.getTranslation(this.getLanguage());
    return translation.default[key];
  }

  loadLanguage() {
    return localStorage.getItem('canvas-language');
  }

  saveLanguage(language: string) {
    localStorage.setItem('canvas-language', language);
  }
}
