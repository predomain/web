import { of } from 'rxjs';
import { Injectable, NgZone } from '@angular/core';
import {
  Actions,
  ofType,
  ROOT_EFFECTS_INIT,
  createEffect,
} from '@ngrx/effects';
import { map, switchMap, catchError, delay } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import {
  TranslationService,
  TrezorService,
  UserService,
  UserSessionService,
} from '../../services';
import {
  RegisterUser,
  RemoveUser,
  UserAdd,
  UserErrorSet,
  UserRegister,
  UserRemove,
} from '../actions';
import { UserModel } from '../../models/states/user-interfaces';
import { UserStoreErrorsEnum } from '../../models/error-enums';
import { MatDialog } from '@angular/material/dialog';
import { WalletTypesEnum } from '../../models/states/wallet-interfaces';
import { MetamaskService } from '../../services/metamask/metamask.service';
import { LedgerService } from '../../services/ledger/ledger.service';
import { GenericDialogComponent } from '../../widgets/generic-dialog';

const globalAny: any = global;

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    public route: Router,
    public userService: UserService,
    public translationService: TranslationService,
    public userSessionService: UserSessionService,
    public metamaskService: MetamaskService,
    public trezorService: TrezorService,
    public ledgerService: LedgerService,
    public store: Store<UserModel>,
    public ngZone: NgZone,
    public dialog: MatDialog
  ) {}

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        map((r) => {
          const timeNow = new Date().getTime();
          const userSessionStored = this.userSessionService.loadUserSession();
          if (userSessionStored === undefined || userSessionStored === null) {
            return;
          }
          const userData = JSON.parse(userSessionStored) as UserModel;
          const defaultChainId = this.userSessionService.getDefaultChainId();
          if (userData.connectType === WalletTypesEnum.METAMASK) {
            this.metamaskService.chainChangedDetectionDaemon();
          }
          if (
            userData.connectType === WalletTypesEnum.METAMASK &&
            this.metamaskService.getChainId() != defaultChainId
          ) {
            const dialogRef = this.dialog.open(GenericDialogComponent, {
              data: {
                message: 'GENERIC.NETWORK_CHANGED_INCOMPATIBLE',
              },
              panelClass: 'cos-generic-dialog',
            });
            this.store.dispatch(new UserRemove());
            return;
          }
          this.store.dispatch(
            new UserAdd(JSON.parse(userSessionStored as string))
          );
        })
      ),
    { dispatch: false }
  );

  userRemove$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<UserRemove>(RemoveUser),
        map((action) => {
          this.userSessionService.quitUserSession();
        })
      ),
    { dispatch: false }
  );

  userRegister$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<UserRegister>(RegisterUser),
        delay(1000),
        switchMap((action) => {
          const timeNow = new Date().getTime();
          const defaultChainId = this.userSessionService.getDefaultChainId();
          if (
            action.payload.walletType === WalletTypesEnum.METAMASK &&
            this.metamaskService.getChainId() != defaultChainId
          ) {
            this.store.dispatch(new UserRemove());
            return of(false);
          }
          switch (action.payload.walletType) {
            case WalletTypesEnum.WALLET_CONNECT:
              {
                return of([
                  timeNow,
                  action.payload.address,
                  action.payload.walletType,
                ]);
              }
              break;
            case WalletTypesEnum.METAMASK:
              {
                return this.metamaskService.connect(timeNow).pipe(
                  switchMap((r: any) => {
                    if (r === false) {
                      return of(false);
                    }
                    return of([timeNow, r, action.payload.walletType]);
                  })
                );
              }
              break;
            case WalletTypesEnum.TREZOR:
              {
                return this.trezorService.connect(timeNow).pipe(
                  switchMap((r: any) => {
                    if (r === false) {
                      return of(false);
                    }
                    return of([timeNow, r, action.payload.walletType]);
                  })
                );
              }
              break;
            case WalletTypesEnum.LEDGER:
              {
                return this.ledgerService.connect(timeNow).pipe(
                  switchMap((r: any) => {
                    if (r === false) {
                      return of(false);
                    }
                    return of([timeNow, r, action.payload.walletType]);
                  })
                );
              }
              break;
          }
        }),
        map((r: any) => {
          if (r === false) {
            this.store.dispatch(
              new UserErrorSet(UserStoreErrorsEnum.CONNECT_ERROR)
            );
            return;
          }
          const [timestamp, address, walletType] = r;
          const userSession = {
            connectSignature: undefined,
            timestamp: timestamp,
            walletAddress: address,
            originalConnectAddress: address,
            deviceLanguage: navigator.language || 'en-US',
            connectType: walletType,
          } as UserModel;
          globalAny.chainAccount = userSession;
          this.store.dispatch(new UserAdd(userSession));
          if (walletType === WalletTypesEnum.METAMASK) {
            this.metamaskService.chainChangedDetectionDaemon();
          }
          this.userSessionService.saveUserSession(userSession);
          return;
        }),
        catchError((error) => {
          return of(false);
        })
      ),
    { dispatch: false }
  );
}
