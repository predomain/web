import 'hammerjs';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';
import { AppModule } from './app/app.module';
import { BehaviorSubject } from 'rxjs';
import { BootController } from './boot-control';

declare global {
  interface Window {
    global: any;
    process: any;
    ethereumProvider: any;
    etherscanProvider: any;
  }
}
(window as any).global = window;
(window as any).process = window;
(window as any).process.browser = true;
(window as any).process.version = '';
(window as any).process.versions = { node: false };
(window as any).global.appIsPaused = new BehaviorSubject(false);

if (environment.production === true) {
  enableProdMode();
}

export function main(): any {
  return platformBrowserDynamic().bootstrapModule(AppModule);
}

let mainApp;
if (module['hot']) {
  module['hot'].accept();
}
const boot = BootController.getbootControl()
  .watchReboot()
  .subscribe(() => {
    if (mainApp) {
      if (window['ngRef']) {
        window['ngRef'].destroy();
      }
      window['ngRef'] = mainApp;
    }
    mainApp = main().catch((err) => console.error('Bootstrap error:', err));
  });
BootController.getbootControl().restart();
