import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { MatTab } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { PagesFacadeService } from './store/facades/pages.facades';
import { NetworkStatusEnum } from './models/states/pages-interfaces/network-status.enum';
import { IconRegistryService, UserSessionService } from './services';
import { of } from 'rxjs';

const globalAny: any = global;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navigation', { static: true }) navigation: MatTab;

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
    protected userSessionService: UserSessionService,
    protected iconsRegistryService: IconRegistryService,
    protected pagesFacade: PagesFacadeService
  ) {}

  ngOnInit() {
    const cId = this.userSessionService.getDefaultChainId();
    this.iconsRegistryService.perloadCustomIcons();
    this.pagesFacade.setNetworkChainCode(cId, false);
  }

  ngOnDestroy() {}

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
