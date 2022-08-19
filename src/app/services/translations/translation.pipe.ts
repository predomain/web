import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
})
export class TranslationPipe implements PipeTransform {
  constructor(public translationService: TranslationService) {}
  transform(value: any): any {
    if (!value || value === undefined || value.length <= 0) {
      return null;
    }
    const language = this.translationService.getLanguage();
    const translations = this.translationService.getTranslation(language);
    const keysSplit = value.split('.');
    if (value.indexOf('.') <= -1 && value in translations.default) {
      return translations.default[value];
    }
    let currentKey;
    for (const key of keysSplit) {
      if (!currentKey) {
        if (key in translations.default === false) {
          return value;
        }
        currentKey = translations.default[key];
      } else {
        if (key in currentKey === false) {
          return value;
        }
        currentKey = currentKey[key];
      }
    }
    return currentKey;
  }
}
