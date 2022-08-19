import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSRegistrationStateModel } from '../../models/states/ens-registration-interfaces';

export const getENSRegistrationStateFull =
  createFeatureSelector<ENSRegistrationStateModel>('ENSRegistrationState');

export const getENSRegistrationState = createSelector(
  getENSRegistrationStateFull,
  (state) => state
);

export const getENSRegistrations = createSelector(
  getENSRegistrationStateFull,
  (state) => Object.values(state.entities)
);

export const getENSRegistrationIds = createSelector(
  getENSRegistrationStateFull,
  (state) => state.ids
);

export const selectENSRegistration = (id: number) =>
  createSelector(getENSRegistrationStateFull, (state) => {
    if ((state.ids as number[]).indexOf(id) <= -1) {
      return undefined;
    }
    return state.entities[id] as ENSDomainMetadataModel;
  });

export const getENSRegistrationStateError = createSelector(
  getENSRegistrationStateFull,
  (state) => state.error
);

export const getENSRegistrationStateLoading = createSelector(
  getENSRegistrationStateFull,
  (state) => state.loading
);

export const isENSRegistrationDuplicate = (id: string) =>
  createSelector(getENSRegistrationStateFull, (state) => {
    if (Object.keys(state.entities).indexOf(id) > -1) {
      return state.entities[id] as ENSDomainMetadataModel;
    }
    return false;
  });
