import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CategoryModel } from 'src/app/models/category';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';
import {
  CategoryAddOne,
  CategoryEffectsInit,
  CategoryErrorSet,
  CategoryRemoveAll,
  CategoryRemoveMany,
  CategoryRemoveOne,
  CategoryUpdate,
  CategoryUpsertMany,
  CategoryUpsertOne,
} from '../actions';
import { getCategorys, getCategoryState, selectCategory } from '../selectors';

@Injectable({
  providedIn: 'root',
})
export class CategoryFacadeService {
  categoryState$: Observable<CategoriesStateModel>;

  constructor(public store: Store<CategoriesStateModel>) {
    this.categoryState$ = this.store.pipe(select(getCategoryState));
  }

  startEffects() {
    this.store.dispatch(new CategoryEffectsInit());
  }

  addBookmark(category: CategoryModel) {
    this.store.dispatch(new CategoryAddOne(category));
  }

  removeBookmark(category: CategoryModel) {
    this.store.dispatch(new CategoryRemoveOne(category.id));
  }

  removeAllBookmarks() {
    this.store.dispatch(new CategoryRemoveAll());
  }

  removeBookmarks(categories: CategoryModel[]) {
    this.store.dispatch(new CategoryRemoveMany(categories.map((n) => n.id)));
  }

  upsertBookmark(category: CategoryModel) {
    this.store.dispatch(new CategoryUpsertOne(category));
  }

  upsertAllBookmark(categories: CategoryModel[]) {
    this.store.dispatch(new CategoryUpsertMany(categories));
  }

  updateBookmark(category: CategoryModel) {
    this.store.dispatch(new CategoryUpdate(category));
  }

  getBookmark(bookmarkId: number) {
    return this.store.pipe(select(selectCategory(bookmarkId)));
  }

  getBookmarks() {
    return this.store.pipe(select(getCategorys));
  }

  removeBookmarkStateError() {
    this.store.dispatch(new CategoryErrorSet(undefined));
  }
}
