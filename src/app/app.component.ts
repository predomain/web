import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  AfterViewInit,
  HostBinding,
  DoCheck,
} from '@angular/core';
import { MatTab } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { PagesFacadeService } from './store/facades/pages.facades';
import { NetworkStatusEnum } from './models/states/pages-interfaces/network-status.enum';
import { IconRegistryService, UserSessionService } from './services';
import { of } from 'rxjs';
import { PageModesEnum, PagesEnum } from './models/states/pages-interfaces';
import { generalConfigurations } from './configurations';

const globalAny: any = global;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, DoCheck, AfterViewInit {
  @HostBinding('class') className = '';
  @ViewChild('navigation', { static: true }) navigation: MatTab;
  lightMode = false;

  @HostListener('window:online', ['$event'])
  onNetworkOnline(target) {
    this.pagesFacade.newNetworkState({
      networkStatus: NetworkStatusEnum.ONLINE,
    });
  }

  @HostListener('window:offline', ['$event'])
  onNetworkOffline(target) {
    this.pagesFacade.newNetworkState({
      networkStatus: NetworkStatusEnum.OFFLINE,
    });
  }

  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected userSessionService: UserSessionService,
    protected iconsRegistryService: IconRegistryService,
    protected pagesFacade: PagesFacadeService
  ) {
    this.pagesFacade.startEffects();
  }

  ngOnInit() {
    const cId = this.userSessionService.getDefaultChainId();
    this.pagesFacade.setNetworkChainCode(cId, false);
    let routeArr = document.location.href.split('/');
    routeArr = routeArr.slice(4, routeArr.length);
    const url = document.location.href;
    let primaryDomain = this.getPrimaryDomain(url);
    if (primaryDomain !== false) {
      this.pagesFacade.setPageMode(PageModesEnum.PROFILE);
      this.pagesFacade.gotoPageRoute(
        'profile/' + primaryDomain + '.eth',
        PagesEnum.PROFILE
      );
      return;
    }
    this.pagesFacade.setPageMode(PageModesEnum.DEFAULT);
    if (routeArr.length <= 0 || routeArr === null || routeArr === undefined) {
      this.pagesFacade.gotoPageRoute('home', PagesEnum.HOME);
      return;
    }
    this.pagesFacade.gotoPageRoute(
      routeArr.join('/'),
      routeArr[0].toUpperCase() as any
    );
  }

  getPrimaryDomain(url: string) {
    let primaryDomain;
    const regTest = new RegExp('[0-9]:[0-9]');
    if (url.indexOf('//localhost') <= -1 && regTest.test(url) === false) {
      primaryDomain = url.split('https://')[1].split('.')[0];
    }
    if (
      primaryDomain !== undefined &&
      primaryDomain !== generalConfigurations.appName &&
      url.indexOf('https://' + generalConfigurations.appStagingName + '.eth') <=
        -1
    ) {
      return primaryDomain;
    }
    return false;
  }

  ngDoCheck(): void {
    const cdk = document.getElementsByClassName('cdk-overlay-container');
    if (cdk.length > 0 && this.lightMode === true) {
      cdk[0].classList.add('light-mode');
    }
  }

  ngAfterViewInit() {
    if (navigator.onLine === true) {
      this.pagesFacade.newNetworkState({
        networkStatus: NetworkStatusEnum.ONLINE,
      });
    } else {
      this.pagesFacade.newNetworkState({
        networkStatus: NetworkStatusEnum.OFFLINE,
      });
    }
  }

  getHeight() {
    return window.innerHeight + 'px';
  }

  get pageLoadingState() {
    if (this.pagesFacade === undefined) {
      return of(true);
    }
    return this.pagesFacade.pageLoadingState$;
  }
}
