import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Actions,
  createEffect,
  ofType,
  ROOT_EFFECTS_INIT,
} from '@ngrx/effects';
import {
  Router,
  ActivatedRoute,
  NavigationStart,
  NavigationEnd,
  NavigationError,
} from '@angular/router';
import {
  GotoPageRoute,
  PageGotoRoute,
  PagesNetworkOfflineStateInvoke,
  PagesNetworkStateSet,
  PagesSetChainCode,
  PagesSetCriticalError,
  PagesSetVisibility,
  SetPageChainCode,
  SetPagesCriticalError,
  SetPagesNetworkState,
  SetPagesNetworkStateOffline,
  UserRemove,
} from '../actions';
import { getCurrentPagesState, getCurrentUser } from '../selectors';
import {
  NetworkStatusEnum,
  PagesStateModel,
} from '../../models/states/pages-interfaces';
import { BootController } from '../../../boot-control';
import { PagesFacadeService } from '../facades';
import { GenericDialogComponent } from '../../widgets/generic-dialog';
import { environment } from '../../../environments/environment';
import { UserService, UserSessionService } from '../../services';
import {
  catchError,
  delay,
  filter,
  map,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';

const globalAny: any = global;

@Injectable()
export class PagesEffects {
  constructor(
    protected actions$: Actions,
    protected route: Router,
    protected activatedRoute: ActivatedRoute,
    protected store: Store<PagesStateModel>,
    protected userSessionService: UserSessionService,
    protected pagesFacade: PagesFacadeService,
    protected userService: UserService,
    public dialog: MatDialog,
    public ngZone: NgZone
  ) {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          this.store.dispatch(new PagesSetVisibility(false));
        } else {
          this.store.dispatch(new PagesSetVisibility(true));
        }
      },
      false
    );
  }

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        switchMap((p) => {
          return this.route.events.pipe(
            takeUntil(
              this.ngZone.runOutsideAngular(() => {
                return BootController.getbootControl().watchReboot();
              })
            )
          );
        }),
        map((e: any) => {
          if (e instanceof NavigationStart) {
            if ((e as NavigationStart).url !== '/') {
              this.pagesFacade.showLoadingProgressBar();
            }
          }
          if (e instanceof NavigationEnd) {
            setTimeout(() => {
              this.pagesFacade.hideLoadingProgressBar();
            }, 1500);
          }
          if (e instanceof NavigationError) {
            setTimeout(() => {
              this.pagesFacade.hideLoadingProgressBar();
            }, 1500);
          }
          if (globalAny.canvasProvider === undefined) {
            const chainId =
              environment.networks[environment.defaultChain].chainId;
            this.createProvider(chainId);
          }
        })
      ),
    { dispatch: false }
  );

  networkStatus$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PagesNetworkStateSet>(SetPagesNetworkState),
        map((networkState) => {
          if (
            networkState.payload.networkStatus === NetworkStatusEnum.OFFLINE
          ) {
            this.store.dispatch(new PagesNetworkOfflineStateInvoke());
          }
        }),
        catchError((error) => {
          return of(false);
        })
      ),
    { dispatch: false }
  );

  networkStatusOffline$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PagesNetworkOfflineStateInvoke>(SetPagesNetworkStateOffline),
        withLatestFrom(this.store.pipe(select(getCurrentPagesState)) as any),
        map((networkAndPageState) => {
          const [network, pageState] = networkAndPageState;
          if (this.dialog.openDialogs.length > 0) {
            return;
          }
          return;
        }),
        catchError((error) => {
          return of(false);
        })
      ),
    { dispatch: false }
  );

  networkChangedId$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PagesSetChainCode>(SetPageChainCode),
        withLatestFrom(
          this.store.pipe(select(getCurrentPagesState)),
          this.store.pipe(select(getCurrentUser))
        ),
        delay(250),
        map((networkAndPageState) => {
          const [action, pageState, userData] = networkAndPageState;
          if (
            action.payload === undefined ||
            action.payload in environment.validChainIds === false ||
            action.payload !==
              environment.networks[environment.defaultChain].chainId
          ) {
            this.ngZone.run(() => {
              const dialogRef = this.dialog.open(GenericDialogComponent, {
                data: {
                  message: 'GENERIC.NETWORK_CHANGED_INCOMPATIBLE',
                },
                panelClass: 'cos-generic-dialog',
              });
            });
            this.store.dispatch(new UserRemove());
            return;
          }
          this.createProvider(action.payload);
          return;
        })
      ),
    { dispatch: false }
  );

  pageCriticalError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PagesSetCriticalError>(SetPagesCriticalError),
        filter((action) => action.redirect === true),
        map((action) => {
          this.route.navigateByUrl('not-found');
          return;
        }),
        catchError((error) => {
          return of(false);
        })
      ),
    { dispatch: false }
  );

  gotoPageRoute$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PageGotoRoute>(GotoPageRoute),
        map((route) => {
          if (route.payload.route !== 'not-found') {
            this.pagesFacade.setPageCriticalError(false, false);
          }
          this.route.navigateByUrl(route.payload.route);
          return;
        }),
        catchError((error) => {
          return of(false);
        })
      ),
    { dispatch: false }
  );

  createProvider(chainId: number) {
    const newProvider = this.userSessionService.getUserSessionProvider(chainId);
    globalAny.chainId = chainId;
    globalAny.canvasProvider = newProvider;
  }
}
