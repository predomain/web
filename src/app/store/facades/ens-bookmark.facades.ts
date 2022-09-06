import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import {
  ENSBookmarkAddOne,
  ENSBookmarkErrorSet,
  ENSBookmarkRemoveAll,
  ENSBookmarkRemoveMany,
  ENSBookmarkRemoveOne,
  ENSBookmarkUpdate,
  ENSBookmarkUpsertMany,
  ENSBookmarkUpsertOne,
} from '../actions';
import {
  getENSBookmarks,
  getENSBookmarkState,
  selectENSBookmark,
} from '../selectors';

@Injectable({
  providedIn: 'root',
})
export class ENSBookmarkFacadeService {
  getENSBookmarkState$: Observable<ENSBookmarkStateModel>;

  constructor(public store: Store<ENSBookmarkStateModel>) {
    this.getENSBookmarkState$ = this.store.pipe(select(getENSBookmarkState));
  }
  addBookmark(bookmark: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSBookmarkAddOne(bookmark));
  }

  removeBookmark(bookmark: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSBookmarkRemoveOne(bookmark.id));
  }

  removeAllBookmarks() {
    this.store.dispatch(new ENSBookmarkRemoveAll());
  }

  removeBookmarks(bookmark: ENSDomainMetadataModel[]) {
    this.store.dispatch(new ENSBookmarkRemoveMany(bookmark.map((n) => n.id)));
  }

  upsertBookmark(bookmark: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSBookmarkUpsertOne(bookmark));
  }

  upsertAllBookmark(bookmarks: ENSDomainMetadataModel[]) {
    this.store.dispatch(new ENSBookmarkUpsertMany(bookmarks));
  }

  updateBookmark(bookmark: ENSDomainMetadataModel) {
    this.store.dispatch(new ENSBookmarkUpdate(bookmark));
  }

  getBookmark(bookmarkId: number) {
    return this.store.pipe(select(selectENSBookmark(bookmarkId)));
  }

  getBookmarks() {
    return this.store.pipe(select(getENSBookmarks));
  }

  removeBookmarkStateError() {
    this.store.dispatch(new ENSBookmarkErrorSet(undefined));
  }
}
