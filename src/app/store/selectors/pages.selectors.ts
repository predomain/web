import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PagesStateModel } from '../../models/states/pages-interfaces';

export const getPagesState =
  createFeatureSelector<PagesStateModel>('PagesState');

export const getCurrentPagesState = createSelector(
  getPagesState,
  (state: PagesStateModel) => state
);

export const getCurrentNetworkState = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.networkStatus
);

export const getCurrentPageVisibility = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.pageVisibility
);

export const getCurrentNetworkChainId = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.networkChainCode
);

export const getCurrentPageLoadState = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.isPageLoading
);

export const getCriticalErrorState = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.criticalErrorOccured
);

export const getIpfsState = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.ipfsReady
);

export const getIpfsError = createSelector(
  getPagesState,
  (state: PagesStateModel) => state.ipfsError
);

export const getCurrentErrorCode = createSelector(
  getPagesState,
  (state: PagesStateModel) => {
    if ('errorCode' in state === false) {
      return undefined;
    }
    if (state.errorCode === undefined) {
      return undefined;
    }
    return state.errorCode;
  }
);
