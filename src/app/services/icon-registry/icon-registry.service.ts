import { Injectable } from '@angular/core';
import { icons, imageToPreload } from 'src/app/configurations';

@Injectable({
  providedIn: 'root',
})
export class IconRegistryService {
  constructor() {}

  injectCustomIcons() {
    return icons;
  }

  perloadCustomIcons() {
    const ic = this.injectCustomIcons();
    for (const i of Object.keys(ic).map((ici) => ic[ici])) {
      const ii = new Image();
      ii.src = i;
    }
    const icc = imageToPreload;
    for (const i of Object.keys(ic).map((ici) => ic[ici])) {
      const ii = new Image();
      ii.src = i;
    }
  }
}
