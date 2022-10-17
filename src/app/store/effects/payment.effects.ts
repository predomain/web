import { Injectable, NgZone } from '@angular/core';
import { select, Store } from '@ngrx/store';
import * as ethers from 'ethers';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  CurrencyExchangeService,
  CurrencyService,
  LedgerService,
  MiscUtilsService,
  PaymentEffectsService,
  PaymentErrorService,
  PaymentService,
  PaymentStorageService,
  TranslationService,
  TrezorService,
  UserService,
  WalletService,
} from '../../services';
import {
  PaymentErrorCodes,
  PaymentModel,
  PaymentStateModel,
  PaymentTypesEnum,
} from '../../models/states/payment-interfaces';
import { PagesFacadeService, UserFacadeService } from '../facades';
import { MetamaskService } from '../../services/metamask';
import {
  AddOnePayment,
  ArchiveAllPayment,
  CheckPaymentFulfilled,
  InitEffectsPayments,
  PaymentAddOne,
  PaymentArchiveAll,
  PaymentCancelled,
  PaymentCheckFulfilled,
  PaymentRemoveAll,
  PaymentRemoveOne,
  PaymentsEffectsInit,
  PaymentUpsertMany,
  PaymentUpsertOne,
  RemoveAllPayment,
  UpsertOnePayment,
} from '../actions';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { from, interval, of, Subject } from 'rxjs';
import {
  getCurrentNetworkChainId,
  getCurrentUser,
  getPayments,
} from '../selectors';
import { WalletTypesEnum } from 'src/app/models/states/wallet-interfaces';
import { BigNumber, utils } from 'ethers';
import { MatSnackBar } from '@angular/material/snack-bar';
import { generalConfigurations } from 'src/app/configurations';
import { WalletConnectService } from 'src/app/services/wallet-connect';
import { getTransactionByNonce } from 'find-replacement-tx';

const globalAny: any = global;

@Injectable()
export class PaymentEffects {
  staticPaymentTranslatedTexts;
  staticGenericTranslatedTexts;
  constructor(
    private actions$: Actions,
    protected paymentService: PaymentService,
    protected walletService: WalletService,
    protected userService: UserService,
    protected pagesFacade: PagesFacadeService,
    protected paymentErrorService: PaymentErrorService,
    protected userFacadeService: UserFacadeService,
    protected store: Store<PaymentStateModel>,
    protected translationService: TranslationService,
    protected currencyService: CurrencyService,
    protected currencyExchangeService: CurrencyExchangeService,
    protected metamaskService: MetamaskService,
    protected walletConnectService: WalletConnectService,
    protected trezorService: TrezorService,
    protected paymentStorageService: PaymentStorageService,
    protected ledgerService: LedgerService,
    protected miscUtils: MiscUtilsService,
    protected snackBar: MatSnackBar,
    protected paymentEffectsService: PaymentEffectsService,
    protected ngZone: NgZone
  ) {
    this.staticPaymentTranslatedTexts =
      this.translationService.getCacheableLanguagekeys('PAYMENT');
    this.staticGenericTranslatedTexts =
      this.translationService.getCacheableLanguagekeys('GENERIC');
  }

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentsEffectsInit>(InitEffectsPayments),
        filter((r) => {
          if (
            globalAny.canvasEffectsInitialised[InitEffectsPayments] === true
          ) {
            return false;
          }
          return true;
        }),
        switchMap((r) => {
          const payments = this.paymentStorageService.loadPayments();
          if (payments !== false) {
            this.store.dispatch(
              new PaymentUpsertMany(payments as any as PaymentModel[])
            );
          }
          if (payments === false || payments === null || payments.length <= 0) {
            return this.currencyExchangeService.getPrices();
          }
          for (const p of payments) {
            if (
              p.paymentHash !== null &&
              p.paymentHash !== '' &&
              p.paymentStatus === false
            ) {
              this.store.dispatch(new CheckPaymentFulfilled(p));
            }
          }
          globalAny.canvasEffectsInitialised[InitEffectsPayments] = true;
          return this.currencyExchangeService.getPrices();
        })
      ),
    { dispatch: false }
  );

  addPayment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentAddOne>(AddOnePayment),
        withLatestFrom(
          this.store.pipe(select(getPayments)),
          this.store.pipe(select(getCurrentUser)),
          this.store.pipe(select(getCurrentNetworkChainId))
        ),
        switchMap(([action, payments, user, chainId]: any[]) => {
          const provider = globalAny.canvasProvider;
          return this.paymentService.getGasPrice(provider).pipe(
            switchMap((gasPrice) => {
              return of([action, user, provider, chainId, gasPrice]);
            })
          );
        }),
        switchMap(([action, user, provider, chainId, gasPrice]: any[]) => {
          return this.paymentService
            .getWalletNonce(provider, user.walletAddress)
            .pipe(
              switchMap((nonce) => {
                return of([action, user, provider, chainId, gasPrice, nonce]);
              })
            );
        }),
        switchMap(
          ([action, user, provider, chainId, gasPrice, nonce]: any[]) => {
            const preparedTx = this.paymentService.prepareTransaction(
              chainId,
              nonce,
              action.payload.paymentMarketAddress,
              action.payload.paymentGasLimit,
              gasPrice.gasPrice,
              action.payload
            );
            this.snackBar.open(
              this.staticGenericTranslatedTexts.PENDING_TRANSACTION_CERATED,
              'close',
              {
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                duration: 5000,
              }
            );
            if (user.connectType === WalletTypesEnum.LEDGER) {
              const txToFilter = {
                ...preparedTx,
                gasLimit: preparedTx.gas,
                value:
                  preparedTx.value === '0'
                    ? '0x0'
                    : ethers.BigNumber.from(preparedTx.value).toHexString(),
              };
              delete txToFilter.gas;
              const txHex = utils.serializeTransaction(txToFilter);
              return this.ledgerService.signPayment(txHex).pipe(
                switchMap((signed: any) => {
                  const signedPacked = utils.serializeTransaction(txToFilter, {
                    v: BigNumber.from('0x' + signed.v).toNumber(),
                    r: '0x' + signed.r,
                    s: '0x' + signed.s,
                  });
                  return from(provider.sendTransaction(signedPacked));
                }),
                switchMap((r) => {
                  return of([action, (r as any).hash, nonce]);
                })
              );
            }
            if (user.connectType === WalletTypesEnum.WALLET_CONNECT) {
              const txToFilter = {
                ...preparedTx,
                from: user.walletAddress,
              };
              delete txToFilter.gasPrice;
              delete txToFilter.nonce;
              return this.walletConnectService.signPayment(txToFilter).pipe(
                switchMap((r) => {
                  return of([action, r, nonce]);
                })
              );
            }
            if (user.connectType === WalletTypesEnum.METAMASK) {
              const txToFilter = {
                ...preparedTx,
                from: user.walletAddress,
              };
              delete txToFilter.gasPrice;
              delete txToFilter.nonce;
              return this.metamaskService.signPayment([txToFilter]).pipe(
                switchMap((r) => {
                  return of([action, r, nonce]);
                })
              );
            }
            if (user.connectType === WalletTypesEnum.TREZOR) {
              return this.trezorService.signPayment(preparedTx).pipe(
                switchMap((signed: any) => {
                  return from(provider.sendTransaction(signed as string));
                }),
                switchMap((r) => {
                  return of([action, r, nonce]);
                })
              );
            }
          }
        ),
        switchMap(([action, hash, nonce]) => {
          if (hash === false) {
            this.store.dispatch(new PaymentRemoveOne(action.payload.id));
            this.snackBar.open(
              this.staticPaymentTranslatedTexts['PAYMENT_CANCELLED'],
              'close',
              {
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                duration: 15000,
              }
            );
            this.store.dispatch(new PaymentCancelled());
            this.store.dispatch(new PaymentRemoveOne(action.payload.id));
            return of(false);
          }
          this.store.dispatch(
            new PaymentUpsertOne({
              ...action.payload,
              paymentStatus: false,
              paymentHash: hash,
              paymentNonce: nonce,
            })
          );
          const paymentResolved = new Subject<boolean>();
          return this.pagesFacade.pageVisibility$.pipe(
            withLatestFrom(this.store.pipe(select(getPayments))),
            takeUntil(paymentResolved),
            map((pvp) => {
              const [pv, payments] = pvp;
              const payment = payments[action.payload.id];
              if (
                payment &&
                'paymentStatus' in payment &&
                payment.paymentStatus === true
              ) {
                paymentResolved.next(false);
                return;
              }
              if (pv === true) {
                this.store.dispatch(
                  new CheckPaymentFulfilled({
                    ...action.payload,
                    paymentHash: hash,
                    paymentNonce: nonce,
                  })
                );
              }
            })
          );
        })
      ),
    { dispatch: false }
  );

  upsertPayment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentUpsertOne>(UpsertOnePayment),
        withLatestFrom(this.store.pipe(select(getPayments))),
        switchMap(([a, paymentState]) => {
          const payments = paymentState as PaymentModel[];
          let payment;
          for (const p of payments) {
            if (p.id === a.payload.id) {
              payment = a.payload;
            }
          }
          return of(payments);
        }),
        map((p) => {
          return this.paymentStorageService.savePayments(p);
        })
      ),
    { dispatch: false }
  );

  archiveAllPayment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentArchiveAll>(ArchiveAllPayment),
        withLatestFrom(this.store.pipe(select(getPayments))),
        map(([action, payments]) => {
          this.paymentStorageService.savePayments(payments);
        })
      ),
    { dispatch: false }
  );

  removeAllPayment$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<PaymentRemoveAll>(RemoveAllPayment),
        map((action) => {
          this.paymentStorageService.removePayments();
        })
      ),
    { dispatch: false }
  );

  userCheckPaymentStatus$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<CheckPaymentFulfilled>(PaymentCheckFulfilled),
        mergeMap((action) => {
          const hasResolved = new Subject<boolean>();
          return interval(generalConfigurations.timeToUpdateCheckoutPipe).pipe(
            takeUntil(hasResolved),
            switchMap((i) => {
              const provider = globalAny.canvasProvider;
              if (provider === undefined) {
                return of(false);
              }
              return from(provider.getBlockNumber()).pipe(
                switchMap((blockNumber) => {
                  if (
                    blockNumber === null ||
                    blockNumber === false ||
                    blockNumber === undefined
                  ) {
                    throw false;
                  }
                  const searchTxFromBlock = (blockNumber as number) - 5;
                  const tx = {
                    from: action.payload.paymentPayer,
                    to: action.payload.paymentPayee,
                    nonce: action.payload.paymentNonce,
                  };
                  return from(
                    provider.getTransactionReceipt(action.payload.paymentHash)
                  ).pipe(
                    switchMap((foundTx) => {
                      if (foundTx === null || foundTx === false) {
                        return from(
                          getTransactionByNonce(
                            provider,
                            searchTxFromBlock,
                            tx.from,
                            tx.nonce
                          )
                        ).pipe(
                          switchMap((r) => {
                            if (r === null) {
                              return of(null);
                            }
                            return from(provider.getTransactionReceipt(r.hash));
                          })
                        );
                      }
                      return of(foundTx);
                    }),
                    catchError((e) => {
                      return of(null);
                    })
                  );
                }),
                map((r: any) => {
                  if (r === null || r === undefined) {
                    return;
                  }
                  if (r.status === 0) {
                    this.store.dispatch(
                      new PaymentUpsertOne({
                        id: action.payload.id,
                        paymentHash: action.payload.paymentHash,
                        paymentStatus: false,
                        paymentError: PaymentErrorCodes.PAYMENT_FAILURE,
                      })
                    );
                    hasResolved.next(false);
                    return;
                  }
                  if (
                    r.status === 1 &&
                    r.confirmations >=
                      generalConfigurations.maxConfirmationsUntilTxFinal
                  ) {
                    this.store.dispatch(
                      new PaymentUpsertOne({
                        id: action.payload.id,
                        paymentDate:
                          action.payload.paymentType === PaymentTypesEnum.COMMIT
                            ? new Date().getTime()
                            : action.payload.paymentDate,
                        paymentHash: action.payload.paymentHash,
                        paymentStatus: true,
                        paymentError: PaymentErrorCodes.NONE,
                      })
                    );
                    hasResolved.next(false);
                    return;
                  }
                })
              );
            })
          );
        })
      ),
    { dispatch: false }
  );
}
