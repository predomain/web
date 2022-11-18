import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { NavigatorFacadeService } from './navigator.facades';
import { NavigatorButtonsFacadeService } from './navigator-buttons.facades';
import {
  getCriticalErrorState,
  getCurrentErrorCode,
  getCurrentPageLoadState,
  getCurrentPageMode,
  getCurrentPagesState,
  getCurrentPageVisibility,
  getIpfsError,
  getIpfsState,
} from '../selectors';
import {
  PageGotoRoute,
  PagesNetworkOfflineStateInvoke,
  PagesNetworkStateSet,
  PagesNewPageStateSet,
  PagesShowLoadingProgressBarOnLoad,
  PagesHideLoadingProgressBarOnLoadFinished,
  PagesSetPageSlide,
  PagesSetChainCode,
  PagesSetIpfsError,
  PagesSetIpfsState,
  PagesSetCriticalError,
  PagesSetRPCProvider,
  PagesEffectsInit,
  PagesSetMode,
} from '../actions';
import {
  GotoPageRouteActionPayloadModel,
  PageModesEnum,
  PagesEnum,
  PagesStateModel,
} from '../../models/states/pages-interfaces';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { IpfsErrorsEnum } from 'src/app/models/error-enums';
import { IpfsStatesEnum } from 'src/app/models/ipfs';
import { RPCProviderModel } from 'src/app/models/rpc/rpc-provider.model';
import { GenericDialogComponent } from 'src/app/widgets/generic-dialog';

@Injectable({
  providedIn: 'root',
})
export class PagesFacadeService {
  pageMode$: Observable<PageModesEnum>;
  pagesState$: Observable<PagesStateModel>;
  pagesIpfsState$: Observable<IpfsStatesEnum>;
  pagesIpfsError$: Observable<IpfsErrorsEnum>;
  pageErrorCode$: Observable<string>;
  pageLoadingState$: Observable<boolean>;
  pageCritiaclError$: Observable<boolean>;
  pageVisibility$: Observable<boolean>;

  constructor(
    public router: Router,
    public store: Store<PagesStateModel>,
    public navigatorFacade: NavigatorFacadeService,
    public navigatorButtonFacade: NavigatorButtonsFacadeService,
    public dialog: MatDialog,
    public ngZone: NgZone
  ) {
    this.pageMode$ = this.store.pipe(select(getCurrentPageMode));
    this.pagesState$ = this.store.pipe(select(getCurrentPagesState));
    this.pageErrorCode$ = this.store.pipe(select(getCurrentErrorCode));
    this.pagesIpfsState$ = this.store.pipe(select(getIpfsState));
    this.pagesIpfsError$ = this.store.pipe(select(getIpfsError));
    this.pageLoadingState$ = this.store.pipe(select(getCurrentPageLoadState));
    this.pageCritiaclError$ = this.store.pipe(select(getCriticalErrorState));
    this.pageVisibility$ = this.store.pipe(select(getCurrentPageVisibility));
  }

  startEffects() {
    this.store.dispatch(new PagesEffectsInit());
  }

  showLoadingProgressBar() {
    document.getElementById('app-splash-container').style.display = 'flex';
    this.store.dispatch(new PagesShowLoadingProgressBarOnLoad());
  }

  showNotEnabledToolDialog() {
    this.dialog.open(GenericDialogComponent, {
      data: {
        titleText: 'HEADER.FEATURE_DISABLED',
        subText: 'LABELS.FEATURE_DISABLED',
      },
      panelClass: 'cos-generic-dialog',
    });
  }

  setPageMode(pageMode: PageModesEnum) {
    this.store.dispatch(new PagesSetMode(pageMode));
  }

  setPageCriticalError(errorOccured: boolean, redirect = true) {
    this.store.dispatch(new PagesSetCriticalError(errorOccured, redirect));
  }

  setRpcProvider(providerData: RPCProviderModel) {
    this.store.dispatch(new PagesSetRPCProvider(providerData));
  }

  setIpfsError(error: IpfsErrorsEnum) {
    this.store.dispatch(new PagesSetIpfsError(error));
  }

  setIpfsState(state: IpfsStatesEnum) {
    this.store.dispatch(new PagesSetIpfsState(state));
  }

  hideLoadingProgressBar() {
    document.getElementById('app-splash-container').style.display = 'none';
    this.store.dispatch(new PagesHideLoadingProgressBarOnLoadFinished());
  }

  newPagesState(pagesState: PagesStateModel) {
    this.store.dispatch(new PagesNewPageStateSet(pagesState));
    this.navigatorFacade.resetNavigatorState();
  }

  newNetworkState(networkState: PagesStateModel) {
    this.store.dispatch(new PagesNetworkStateSet(networkState));
  }

  setNetworkChainCode(chainCode: number, firstTimeSet = false) {
    this.store.dispatch(new PagesSetChainCode(chainCode, firstTimeSet));
  }

  setChainCodeByNetworkName(networkName: string, firstTimeSet = false) {
    const networkData = environment.networks[networkName];
    const chainCode = networkData.chainId;
    this.store.dispatch(new PagesSetChainCode(chainCode, firstTimeSet));
  }

  triggerNetworkOfflineDialog() {
    this.store.dispatch(new PagesNetworkOfflineStateInvoke());
  }

  setPageSlide(pageSlide: number) {
    this.store.dispatch(new PagesSetPageSlide(pageSlide));
  }

  gotoPageRoute(pageRoute: string, toPageId: PagesEnum) {
    this.store.dispatch(
      new PageGotoRoute({
        route: pageRoute,
        pageId: toPageId,
      } as GotoPageRouteActionPayloadModel)
    );
    this.navigatorFacade.resetNavigatorState();
    this.navigatorButtonFacade.resetNavigatorButtonState();
  }
}
