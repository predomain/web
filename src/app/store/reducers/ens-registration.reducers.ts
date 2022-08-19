import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSRegistrationStateModel } from '../../models/states/ens-registration-interfaces';
import {
  UpsertOneENSRegistration,
  UpsertManyENSRegistration,
  RemoveOneENSRegistration,
  RemoveManyENSRegistration,
  RemoveAllENSRegistration,
  SetENSRegistrationError,
  UpdateENSRegistration,
  AddOneENSRegistration,
} from '../actions';

export function selectENSRegistrationId(
  registration: ENSDomainMetadataModel
): string {
  return registration.id;
}

export const ensRegistrationAdapter: EntityAdapter<ENSDomainMetadataModel> =
  createEntityAdapter<ENSDomainMetadataModel>({
    selectId: selectENSRegistrationId,
  });

export const initialENSRegistrationState: ENSRegistrationStateModel =
  ensRegistrationAdapter.getInitialState({
    error: undefined,
    loading: false,
  });

export function ENSRegistrationReducers(
  state: ENSRegistrationStateModel = initialENSRegistrationState,
  action: any
) {
  switch (action.type) {
    case UpsertOneENSRegistration:
    case UpdateENSRegistration: {
      const stateChange = ensRegistrationAdapter.upsertOne(
        action.payload,
        state
      );
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case AddOneENSRegistration: {
      const stateChange = ensRegistrationAdapter.addOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: true,
      };
    }

    case UpsertManyENSRegistration: {
      const stateChange = ensRegistrationAdapter.upsertMany(
        action.payload,
        state
      );
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveOneENSRegistration: {
      const stateChange = ensRegistrationAdapter.removeOne(
        action.payload,
        state
      );
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveManyENSRegistration: {
      const stateChange = ensRegistrationAdapter.removeMany(
        action.payload,
        state
      );
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveAllENSRegistration: {
      const stateChange = ensRegistrationAdapter.removeAll(state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case SetENSRegistrationError: {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

    case UpdateENSRegistration: {
      return {
        ...state,
        error: undefined,
        loading: true,
      };
    }

    default:
      return state;
  }
}
