import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { ENSBookmarkStateModel } from 'src/app/models/states/ens-bookmark-interfaces';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import {
  AddOneENSBookmark,
  ENSBookmarkAddOne,
  ENSBookmarkEffectsInit,
  ENSBookmarkRemoveAll,
  ENSBookmarkRemoveOne,
  ENSBookmarkUpsertMany,
  ENSBookmarkUpsertOne,
  InitEffectsENSBookmark,
  RemoveAllENSBookmark,
  RemoveOneENSBookmark,
  UpsertManyENSBookmark,
  UpsertOneENSBookmark,
} from '../actions';
import { getENSBookmarks } from '../selectors';

const globalAny: any = global;

@Injectable()
export class ENSBookmarkEffects {
  constructor(
    private actions$: Actions,
    protected bookMarkService: BookmarksServiceService,
    public store: Store<ENSBookmarkStateModel>
  ) {}

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkEffectsInit>(InitEffectsENSBookmark),
        filter((r) => {
          if (
            globalAny.canvasEffectsInitialised === undefined ||
            globalAny.canvasEffectsInitialised[InitEffectsENSBookmark] === true
          ) {
            return false;
          }
          return true;
        }),
        map((p) => {
          const bookmarks = this.bookMarkService.loadBookmarksAndFeed();
          for (const b of Object.keys(bookmarks)) {
            this.store.dispatch(
              new ENSBookmarkAddOne(
                {
                  id: bookmarks[b].labelName,
                  ...bookmarks[b],
                },
                false
              )
            );
          }
          globalAny.canvasEffectsInitialised[InitEffectsENSBookmark] = true;
        })
      ),
    {
      dispatch: false,
    }
  );

  addOneBookmark$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkAddOne>(AddOneENSBookmark),
        filter((action) => action.toSave === true),
        map((action) => {
          this.bookMarkService.saveBookmark(action.payload);
        })
      ),

    { dispatch: false }
  );

  removeAllBookmarks$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkRemoveAll>(RemoveAllENSBookmark),
        filter((action) => action.toSave === true),
        withLatestFrom(this.store.pipe(select(getENSBookmarks))),
        map((state) => {
          const [action, bookmarks] = state;
          this.bookMarkService.removeAllBookmarks();
        })
      ),

    { dispatch: false }
  );

  removeOneBookmark$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkRemoveOne>(RemoveOneENSBookmark),
        filter((action) => action.toSave === true),
        withLatestFrom(this.store.pipe(select(getENSBookmarks))),
        map((state) => {
          const [action, bookmarks] = state;
          this.bookMarkService.removeBookmark(bookmarks, action.payload);
        })
      ),

    { dispatch: false }
  );

  upsertOneBookmark$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkUpsertOne>(UpsertOneENSBookmark),
        filter((action) => action.toSave === true),
        map((action) => {
          this.bookMarkService.saveBookmark(action.payload);
        })
      ),

    { dispatch: false }
  );

  upsertManyBookmark$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ENSBookmarkUpsertMany>(UpsertManyENSBookmark),
        filter((action) => action.toSave === true),
        map((action) => {
          this.bookMarkService.saveAllBookmark(action.payload);
        })
      ),

    { dispatch: false }
  );
}
