import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of, Subject, timer } from 'rxjs';
import {
  delayWhen,
  filter,
  map,
  retryWhen,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { generalConfigurations } from 'src/app/configurations';
import { CategoriesRootModel } from 'src/app/models/category';
import { ResponseModel } from 'src/app/models/http';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';
import { BookmarksServiceService } from 'src/app/services/bookmarks';
import { CategoriesDataService } from 'src/app/services/categories-data';
import { EnsService } from 'src/app/services/ens';
import {
  AddOneCategory,
  CategoryAddOne,
  CategoryEffectsInit,
  CategoryMetadataSet,
  CategoryRemoveAll,
  CategoryRemoveOne,
  CategoryRootVolumeDataSet,
  CategoryUpsertMany,
  CategoryUpsertOne,
  InitEffectsCategory,
  RemoveAllCategory,
  RemoveOneCategory,
  UpsertManyCategory,
  UpsertOneCategory,
} from '../actions';
import { getCategorys } from '../selectors';

const globalAny: any = global;

@Injectable()
export class CategoryEffects {
  activeProviders;
  categoryMetdata;

  constructor(
    private actions$: Actions,
    protected bookMarkService: BookmarksServiceService,
    protected ensService: EnsService,
    protected httpClient: HttpClient,
    protected categoriesDataService: CategoriesDataService,
    public store: Store<CategoriesStateModel>
  ) {}

  init$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<CategoryEffectsInit>(InitEffectsCategory),
        filter((r) => {
          if (
            globalAny.canvasEffectsInitialised[InitEffectsCategory] === true
          ) {
            return false;
          }
          return true;
        }),
        switchMap((p) => {
          const provider = globalAny.canvasProvider;
          const hasRootCategoryDataBeenResolved = new Subject<boolean>();
          if (generalConfigurations.categoriesUseFallback === true) {
            return this.categoriesDataService
              .getCategoriesRootFallbackData()
              .pipe(
                switchMap((r) => {
                  if (r === false || r === null) {
                    throw false;
                  }
                  const categoryMetdata = r as CategoriesRootModel;
                  hasRootCategoryDataBeenResolved.next(false);
                  return of(categoryMetdata);
                })
              );
          }
          return this.ensService
            .getDomainContentHash(
              provider,
              generalConfigurations.categoriesDomain
            )
            .pipe(
              takeUntil(hasRootCategoryDataBeenResolved),
              switchMap((c) => {
                return this.httpClient.get(c as any);
              }),
              switchMap((r) => {
                if (r === false || r === null) {
                  throw false;
                }
                const categoryMetdata = r as CategoriesRootModel;
                hasRootCategoryDataBeenResolved.next(false);
                return of(categoryMetdata);
              }),
              retryWhen((error) =>
                error.pipe(
                  delayWhen((e) => {
                    return timer(
                      generalConfigurations.timeToUpdateCheckoutPipe
                    );
                  })
                )
              )
            );
        }),
        switchMap((categoryMetdataRaw) => {
          const categoriesRootProviders = categoryMetdataRaw.rootDataProviders;
          this.categoryMetdata = categoryMetdataRaw;
          this.store.dispatch(new CategoryMetadataSet(categoryMetdataRaw));
          return this.categoriesDataService.pingCategoriesDataProviders(
            categoriesRootProviders
          );
        }),
        switchMap((r) => {
          this.activeProviders = r.filter((p) => p !== false);
          const providerChosen = this.activeProviders[0] as any;
          globalAny.canvasEffectsInitialised[InitEffectsCategory] = true;
          this.store.dispatch(
            new CategoryMetadataSet({
              ...this.categoryMetdata,
              activeProviders: this.activeProviders.map((r) => r.provider),
            })
          );
          return this.categoriesDataService.getCategoriesRootVolumeData(
            providerChosen.provider
          );
        }),
        map((r) => {
          const categoryRootVolumeData = (r as ResponseModel).result;
          this.store.dispatch(
            new CategoryRootVolumeDataSet(categoryRootVolumeData as any)
          );
        })
      ),
    {
      dispatch: false,
    }
  );

  addOneBookmark$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<CategoryAddOne>(AddOneCategory),
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
        ofType<CategoryRemoveAll>(RemoveAllCategory),
        filter((action) => action.toSave === true),
        withLatestFrom(this.store.pipe(select(getCategorys))),
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
        ofType<CategoryRemoveOne>(RemoveOneCategory),
        filter((action) => action.toSave === true),
        withLatestFrom(this.store.pipe(select(getCategorys))),
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
        ofType<CategoryUpsertOne>(UpsertOneCategory),
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
        ofType<CategoryUpsertMany>(UpsertManyCategory),
        filter((action) => action.toSave === true),
        map((action) => {
          this.bookMarkService.saveAllBookmark(action.payload);
        })
      ),

    { dispatch: false }
  );
}
