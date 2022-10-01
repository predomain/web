import { Action } from '@ngrx/store';
import { DomainMetadataModel } from 'src/app/models/domains';
import { ENSRegistrationStoreErrorsEnum } from '../../models/error-enums';
export const AddOneENSRegistration = '[ENSRegistrationState] Add registration.';
export const UpdateENSRegistration =
  '[ENSRegistrationState] Update registration.';
export const UpsertOneENSRegistration =
  '[ENSRegistrationState] Upsert one registration.';
export const UpsertManyENSRegistration =
  '[ENSRegistrationState] Upsert many registration.';
export const GetOneENSRegistration =
  '[ENSRegistrationState] Get one registration.';
export const GetAllENSRegistration =
  '[ENSRegistrationState] Get all registration.';
export const RemoveOneENSRegistration =
  '[ENSRegistrationState] Remove one registration.';
export const RemoveManyENSRegistration =
  '[ENSRegistrationState] Remove many registration.';
export const RemoveAllENSRegistration =
  '[ENSRegistrationState] Remove all registration.';
export const SetENSRegistrationError =
  '[ENSRegistrationState] ENSRegistration error set.';

export class ENSRegistrationErrorSet implements Action {
  readonly type = SetENSRegistrationError;
  constructor(public payload: ENSRegistrationStoreErrorsEnum) {}
}

export class ENSRegistrationAddOne implements Action {
  readonly type = AddOneENSRegistration;
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
}

export class ENSRegistrationUpsertOne implements Action {
  readonly type = UpsertOneENSRegistration;
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
}

export class ENSRegistrationUpsertMany implements Action {
  readonly type = UpsertManyENSRegistration;
  constructor(public payload: DomainMetadataModel[], public toSave = true) {}
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
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
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
