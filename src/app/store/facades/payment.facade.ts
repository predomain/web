import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import {
  PaymentModel,
  PaymentStateModel,
} from '../../models/states/payment-interfaces';
import {
  getEthUsdPrice,
  getPayments,
  getPaymentState,
  getPaymentStateError,
  getPaymentStateLoading,
  getPendingPayments,
  selectPayment,
} from '../selectors';
import {
  PaymentErrorSet,
  PaymentUpdate,
  PaymentUpsertOne,
  PaymentRemoveOne,
  PaymentRemoveMany,
  PaymentAddOne,
  ArchiveAllPayment,
  PaymentArchiveAll,
  PaymentETHUSDRatesSet,
  PaymentRemoveAll,
  PaymentsEffectsInit,
} from '../actions';
import { PaymentStoreErrorsEnum } from '../../models/error-enums';

@Injectable({
  providedIn: 'root',
})
export class PaymentFacadeService {
  paymentState$: Observable<PaymentStateModel>;
  pendingPayments$: Observable<PaymentModel[]>;
  approvablePayments$: Observable<PaymentModel[]>;
  paymentsStored$: Observable<PaymentModel[]>;
  paymentsStoreError$: Observable<PaymentStoreErrorsEnum>;
  paymentsStoreLoading$: Observable<boolean>;
  ethUsdPrice$: Observable<string>;

  constructor(protected store: Store<PaymentModel>) {
    this.paymentState$ = this.store.pipe(select(getPaymentState));
    this.pendingPayments$ = this.store.pipe(select(getPendingPayments));
    this.paymentsStoreError$ = this.store.pipe(select(getPaymentStateError));
    this.paymentsStoreLoading$ = this.store.pipe(
      select(getPaymentStateLoading)
    );
    this.ethUsdPrice$ = this.store.pipe(select(getEthUsdPrice));
  }

  startEffects() {
    this.store.dispatch(new PaymentsEffectsInit());
  }

  setEthUsdRate(usdRate: string) {
    this.store.dispatch(new PaymentETHUSDRatesSet(usdRate as string));
  }

  createPayment(payment: PaymentModel) {
    this.store.dispatch(new PaymentAddOne(payment));
  }

  removeAllPayment() {
    this.store.dispatch(new PaymentRemoveAll());
  }

  removePayment(payment: PaymentModel) {
    this.store.dispatch(new PaymentRemoveOne(payment.paymentSerial));
  }

  removePayments(payments: PaymentModel[]) {
    this.store.dispatch(
      new PaymentRemoveMany(payments.map((n) => n.paymentSerial))
    );
  }

  archiveAllPayment() {
    this.store.dispatch(new PaymentArchiveAll());
  }

  upsertPayment(payment: PaymentModel) {
    this.store.dispatch(new PaymentUpsertOne(payment));
  }

  updatePayment(payment: PaymentModel) {
    this.store.dispatch(new PaymentUpdate(payment));
  }

  getPayment(paymentId: number) {
    return this.store.pipe(select(selectPayment(paymentId)));
  }

  getPayments() {
    return this.store.pipe(select(getPayments));
  }

  removePaymentStateError() {
    this.store.dispatch(new PaymentErrorSet(undefined));
  }
}
