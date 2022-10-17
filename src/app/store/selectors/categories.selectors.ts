import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DomainMetadataModel } from 'src/app/models/domains';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';

export const getCategoryStateFull =
  createFeatureSelector<CategoriesStateModel>('CategoriesState');

export const getCategoryState = createSelector(
  getCategoryStateFull,
  (state) => state
);

export const getCategorys = createSelector(getCategoryStateFull, (state) =>
  Object.values(state.entities)
);

export const getCategoryIds = createSelector(
  getCategoryStateFull,
  (state) => state.ids
);

export const selectCategory = (id: number) =>
  createSelector(getCategoryStateFull, (state) => {
    if ((state.ids as number[]).indexOf(id) <= -1) {
      return undefined;
    }
    return state.entities[id] as DomainMetadataModel;
  });

export const getCategoryStateError = createSelector(
  getCategoryStateFull,
  (state) => state.error
);

export const getCategoryStateLoading = createSelector(
  getCategoryStateFull,
  (state) => state.loading
);

export const isCategoryDuplicate = (id: string) =>
  createSelector(getCategoryStateFull, (state) => {
    if (Object.keys(state.entities).indexOf(id) > -1) {
      return state.entities[id] as DomainMetadataModel;
    }
    return false;
  });
