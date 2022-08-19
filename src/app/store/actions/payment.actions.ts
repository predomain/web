import { Action } from '@ngrx/store';
import { PaymentStoreErrorsEnum } from '../../models/error-enums';
import { PaymentModel } from '../../models/states/payment-interfaces/payment.model';
export const PaymentCheckFulfilled =
  '[PaymentState] Payment checking status if fulfilled.';
export const PaymentTriggerStatusChecking =
  '[PaymentState] Payment checking status triggered.';
export const AddOnePayment = '[PaymentState] Add payment.';
export const UpdatePayment = '[PaymentState] Update payment.';
export const UpsertOnePayment = '[PaymentState] Upsert one payment.';
export const UpsertManyPayment = '[PaymentState] Upsert many payment.';
export const GetOnePayment = '[PaymentState] Get one payment.';
export const GetAllPayment = '[PaymentState] Get all payment.';
export const SetEthUSDRates = '[PaymentState] ETHUSD rate set.';
export const RemoveOnePayment = '[PaymentState] Remove one payment.';
export const RemoveManyPayment = '[PaymentState] Remove many payment.';
export const RemoveAllPayment = '[PaymentState] Remove all payment.';
export const ArchiveAllPayment = '[PaymentState] Archive all payment.';
export const SetPaymentError = '[PaymentState] Payment error set.';

export class PaymentArchiveAll implements Action {
  readonly type = ArchiveAllPayment;
  constructor() {}
}

export class PaymentETHUSDRatesSet implements Action {
  readonly type = SetEthUSDRates;
  constructor(public payload: string) {}
}

export class PaymentErrorSet implements Action {
  readonly type = SetPaymentError;
  constructor(public payload: PaymentStoreErrorsEnum) {}
}

export class PaymentAddOne implements Action {
  readonly type = AddOnePayment;
  constructor(public payload: PaymentModel) {}
}

export class PaymentUpsertOne implements Action {
  readonly type = UpsertOnePayment;
  constructor(public payload: PaymentModel) {}
}

export class PaymentUpsertMany implements Action {
  readonly type = UpsertManyPayment;
  constructor(public payload: PaymentModel[]) {}
}

export class PaymentGetOne implements Action {
  readonly type = GetOnePayment;
  constructor(public payload: string) {}
}

export class PaymentGetAll implements Action {
  readonly type = GetAllPayment;
  constructor(public payload: string) {}
}

export class PaymentRemoveOne implements Action {
  readonly type = RemoveOnePayment;
  constructor(public payload: string) {}
}

export class PaymentRemoveMany implements Action {
  readonly type = RemoveManyPayment;
  constructor(public payload: string[]) {}
}

export class PaymentRemoveAll implements Action {
  readonly type = RemoveAllPayment;
  constructor(public authenticationPin: string) {}
}

export class CheckPaymentFulfilled implements Action {
  readonly type = PaymentCheckFulfilled;
  constructor(public payload: PaymentModel) {}
}

export class PaymentUpdate implements Action {
  readonly type = UpdatePayment;
  constructor(public payload: PaymentModel) {}
}

export type PaymentActions =
  | PaymentAddOne
  | PaymentRemoveOne
  | PaymentRemoveMany
  | PaymentGetAll
  | PaymentGetOne
  | PaymentUpsertOne
  | PaymentUpsertMany
  | PaymentErrorSet
  | PaymentRemoveAll
  | PaymentETHUSDRatesSet
  | CheckPaymentFulfilled
  | PaymentUpdate
  | PaymentArchiveAll;
