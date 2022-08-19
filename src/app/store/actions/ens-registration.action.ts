import { Action } from '@ngrx/store';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSRegistrationStoreErrorsEnum } from '../../models/error-enums';
export const AddOneENSRegistration = '[ENSRegistrationState] Add payment.';
export const UpdateENSRegistration = '[ENSRegistrationState] Update payment.';
export const UpsertOneENSRegistration =
  '[ENSRegistrationState] Upsert one payment.';
export const UpsertManyENSRegistration =
  '[ENSRegistrationState] Upsert many payment.';
export const GetOneENSRegistration = '[ENSRegistrationState] Get one payment.';
export const GetAllENSRegistration = '[ENSRegistrationState] Get all payment.';
export const RemoveOneENSRegistration =
  '[ENSRegistrationState] Remove one payment.';
export const RemoveManyENSRegistration =
  '[ENSRegistrationState] Remove many payment.';
export const RemoveAllENSRegistration =
  '[ENSRegistrationState] Remove all payment.';
export const SetENSRegistrationError =
  '[ENSRegistrationState] ENSRegistration error set.';

export class ENSRegistrationErrorSet implements Action {
  readonly type = SetENSRegistrationError;
  constructor(public payload: ENSRegistrationStoreErrorsEnum) {}
}

export class ENSRegistrationAddOne implements Action {
  readonly type = AddOneENSRegistration;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export class ENSRegistrationUpsertOne implements Action {
  readonly type = UpsertOneENSRegistration;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export class ENSRegistrationUpsertMany implements Action {
  readonly type = UpsertManyENSRegistration;
  constructor(public payload: ENSDomainMetadataModel[], public toSave = true) {}
}

export class ENSRegistrationGetOne implements Action {
  readonly type = GetOneENSRegistration;
  constructor(public payload: string) {}
}

export class ENSRegistrationGetAll implements Action {
  readonly type = GetAllENSRegistration;
  constructor(public payload: string) {}
}

export class ENSRegistrationRemoveOne implements Action {
  readonly type = RemoveOneENSRegistration;
  constructor(public payload: string, public toSave = true) {}
}

export class ENSRegistrationRemoveMany implements Action {
  readonly type = RemoveManyENSRegistration;
  constructor(public payload: string[], public toSave = true) {}
}

export class ENSRegistrationRemoveAll implements Action {
  readonly type = RemoveAllENSRegistration;
  constructor() {}
}

export class ENSRegistrationUpdate implements Action {
  readonly type = UpdateENSRegistration;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export type ENSRegistrationActions =
  | ENSRegistrationAddOne
  | ENSRegistrationRemoveOne
  | ENSRegistrationRemoveMany
  | ENSRegistrationGetAll
  | ENSRegistrationGetOne
  | ENSRegistrationUpsertOne
  | ENSRegistrationUpsertMany
  | ENSRegistrationErrorSet
  | ENSRegistrationRemoveAll
  | ENSRegistrationUpdate;
