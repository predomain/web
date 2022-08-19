import { Action } from '@ngrx/store';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSBookmarkStoreErrorsEnum } from '../../models/error-enums';
export const AddOneENSBookmark = '[ENSBookmarkState] Add payment.';
export const UpdateENSBookmark = '[ENSBookmarkState] Update payment.';
export const UpsertOneENSBookmark = '[ENSBookmarkState] Upsert one payment.';
export const UpsertManyENSBookmark = '[ENSBookmarkState] Upsert many payment.';
export const GetOneENSBookmark = '[ENSBookmarkState] Get one payment.';
export const GetAllENSBookmark = '[ENSBookmarkState] Get all payment.';
export const RemoveOneENSBookmark = '[ENSBookmarkState] Remove one payment.';
export const RemoveManyENSBookmark = '[ENSBookmarkState] Remove many payment.';
export const RemoveAllENSBookmark = '[ENSBookmarkState] Remove all payment.';
export const SetENSBookmarkError = '[ENSBookmarkState] ENSBookmark error set.';

export class ENSBookmarkErrorSet implements Action {
  readonly type = SetENSBookmarkError;
  constructor(public payload: ENSBookmarkStoreErrorsEnum) {}
}

export class ENSBookmarkAddOne implements Action {
  readonly type = AddOneENSBookmark;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export class ENSBookmarkUpsertOne implements Action {
  readonly type = UpsertOneENSBookmark;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export class ENSBookmarkUpsertMany implements Action {
  readonly type = UpsertManyENSBookmark;
  constructor(public payload: ENSDomainMetadataModel[], public toSave = true) {}
}

export class ENSBookmarkGetOne implements Action {
  readonly type = GetOneENSBookmark;
  constructor(public payload: string) {}
}

export class ENSBookmarkGetAll implements Action {
  readonly type = GetAllENSBookmark;
  constructor(public payload: string) {}
}

export class ENSBookmarkRemoveOne implements Action {
  readonly type = RemoveOneENSBookmark;
  constructor(public payload: string, public toSave = true) {}
}

export class ENSBookmarkRemoveMany implements Action {
  readonly type = RemoveManyENSBookmark;
  constructor(public payload: string[], public toSave = true) {}
}

export class ENSBookmarkRemoveAll implements Action {
  readonly type = RemoveAllENSBookmark;
  constructor(public authenticationPin: string, public toSave = true) {}
}

export class ENSBookmarkUpdate implements Action {
  readonly type = UpdateENSBookmark;
  constructor(public payload: ENSDomainMetadataModel, public toSave = true) {}
}

export type ENSBookmarkActions =
  | ENSBookmarkAddOne
  | ENSBookmarkRemoveOne
  | ENSBookmarkRemoveMany
  | ENSBookmarkGetAll
  | ENSBookmarkGetOne
  | ENSBookmarkUpsertOne
  | ENSBookmarkUpsertMany
  | ENSBookmarkErrorSet
  | ENSBookmarkRemoveAll
  | ENSBookmarkUpdate;
