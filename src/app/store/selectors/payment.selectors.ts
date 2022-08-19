import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  PaymentModel,
  PaymentTypesEnum,
  PaymentStateModel,
} from '../../models/states/payment-interfaces';

export const getPaymentStateFull =
  createFeatureSelector<PaymentStateModel>('PaymentState');

export const getPaymentState = createSelector(
  getPaymentStateFull,
  (state) => state
);

export const getEthUsdPrice = createSelector(
  getPaymentStateFull,
  (state) => state.ethUsdPrice
);

export const getPayments = createSelector(getPaymentStateFull, (state) =>
  Object.values(state.entities)
);

export const getPaymentIds = createSelector(
  getPaymentStateFull,
  (state) => state.ids
);

export const selectPayment = (id: number) =>
  createSelector(getPaymentStateFull, (state) => {
    if ((state.ids as number[]).indexOf(id) <= -1) {
      return undefined;
    }
    return state.entities[id] as PaymentModel;
  });

export const getPaymentStateError = createSelector(
  getPaymentStateFull,
  (state) => state.error
);

export const getPaymentStateLoading = createSelector(
  getPaymentStateFull,
  (state) => state.loading
);

export const getPendingPayments = createSelector(
  getPaymentStateFull,
  (state) => {
    const pendingPs: PaymentModel[] = [];
    const ps = Object.values(state.entities) as PaymentModel[];
    for (const p of ps) {
      if (p.paymentStatus === false) {
        pendingPs.push(p);
      }
    }
    if (pendingPs.length <= 0) {
      return null;
    }
    return pendingPs;
  }
);

export const getArchivedPayments = createSelector(
  getPaymentStateFull,
  (state) => {
    const archivedPs: PaymentModel[] = [];
    const ps = Object.values(state.entities) as PaymentModel[];
    for (const p of ps) {
      if (p.archived === true) {
        archivedPs.push(p);
      }
    }
    if (archivedPs.length <= 0) {
      return null;
    }
    return archivedPs;
  }
);

export const isPaymentDuplicate = (id: string) =>
  createSelector(getPaymentStateFull, (state) => {
    if (Object.keys(state.entities).indexOf(id) > -1) {
      return state.entities[id] as PaymentModel;
    }
    return false;
  });
