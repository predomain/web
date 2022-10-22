import { Component, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { PagesEnum } from '../../models/states/pages-interfaces';
import { PagesFacadeService } from '../../store/facades';
import { BootController } from '../../../boot-control';
import { generalConfigurations } from 'src/app/configurations';

@Component({
  selector: 'app-bootstrap',
  templateUrl: './bootstrap.component.html',
  styleUrls: ['./bootstrap.component.scss'],
})
export class BootstrapComponent implements OnDestroy, AfterViewInit {
  constructor(
    protected pagesFacade: PagesFacadeService,
    protected ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    let primaryDomain;
    if (document.location.href.indexOf('https://localhost') <= -1) {
      primaryDomain = document.location.href.split('https://')[1].split('.')[0];
    }
    if (
      primaryDomain !== generalConfigurations.appName &&
      document.location.href.indexOf(
        'https://' + generalConfigurations.appStagingName + '.eth'
      ) <= -1
    ) {
      this.pagesFacade.gotoPageRoute(
        'profile/#/' + primaryDomain,
        PagesEnum.PROFILE
      );
      return;
    }
    this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
  }

  resetBootstrap() {
    this.ngZone.runOutsideAngular(() => {
      console.log('App restarted.');
      BootController.getbootControl().restart();
    });
  }

  ngOnDestroy() {}
}
