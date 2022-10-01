import { Action } from '@ngrx/store';
import { DomainMetadataModel } from 'src/app/models/domains';
import { ENSBookmarkStoreErrorsEnum } from '../../models/error-enums';
export const AddOneENSBookmark = '[ENSBookmarkState] Add bookmark.';
export const UpdateENSBookmark = '[ENSBookmarkState] Update bookmark.';
export const UpsertOneENSBookmark = '[ENSBookmarkState] Upsert one bookmark.';
export const UpsertManyENSBookmark = '[ENSBookmarkState] Upsert many bookmark.';
export const GetOneENSBookmark = '[ENSBookmarkState] Get one bookmark.';
export const GetAllENSBookmark = '[ENSBookmarkState] Get all bookmark.';
export const RemoveOneENSBookmark = '[ENSBookmarkState] Remove one bookmark.';
export const RemoveManyENSBookmark = '[ENSBookmarkState] Remove many bookmark.';
export const RemoveAllENSBookmark = '[ENSBookmarkState] Remove all bookmark.';
export const SetENSBookmarkError = '[ENSBookmarkState] ENSBookmark error set.';

export class ENSBookmarkErrorSet implements Action {
  readonly type = SetENSBookmarkError;
  constructor(public payload: ENSBookmarkStoreErrorsEnum) {}
}

export class ENSBookmarkAddOne implements Action {
  readonly type = AddOneENSBookmark;
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
}

export class ENSBookmarkUpsertOne implements Action {
  readonly type = UpsertOneENSBookmark;
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
}

export class ENSBookmarkUpsertMany implements Action {
  readonly type = UpsertManyENSBookmark;
  constructor(public payload: DomainMetadataModel[], public toSave = true) {}
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
  constructor(public toSave = true) {}
}

export class ENSBookmarkUpdate implements Action {
  readonly type = UpdateENSBookmark;
  constructor(public payload: DomainMetadataModel, public toSave = true) {}
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
