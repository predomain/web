import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSBookmarkStateModel } from '../../models/states/ens-bookmark-interfaces';

export const getENSBookmarkStateFull =
  createFeatureSelector<ENSBookmarkStateModel>('ENSBookmarkState');

export const getENSBookmarkState = createSelector(
  getENSBookmarkStateFull,
  (state) => state
);

export const getENSBookmarks = createSelector(
  getENSBookmarkStateFull,
  (state) => Object.values(state.entities)
);

export const getENSBookmarkIds = createSelector(
  getENSBookmarkStateFull,
  (state) => state.ids
);

export const selectENSBookmark = (id: number) =>
  createSelector(getENSBookmarkStateFull, (state) => {
    if ((state.ids as number[]).indexOf(id) <= -1) {
      return undefined;
    }
    return state.entities[id] as ENSDomainMetadataModel;
  });

export const getENSBookmarkStateError = createSelector(
  getENSBookmarkStateFull,
  (state) => state.error
);

export const getENSBookmarkStateLoading = createSelector(
  getENSBookmarkStateFull,
  (state) => state.loading
);

export const isENSBookmarkDuplicate = (id: string) =>
  createSelector(getENSBookmarkStateFull, (state) => {
    if (Object.keys(state.entities).indexOf(id) > -1) {
      return state.entities[id] as ENSDomainMetadataModel;
    }
    return false;
  });
