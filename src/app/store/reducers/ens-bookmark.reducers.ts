import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';
import { ENSBookmarkStateModel } from '../../models/states/ens-bookmark-interfaces';
import {
  UpsertOneENSBookmark,
  UpsertManyENSBookmark,
  RemoveOneENSBookmark,
  RemoveManyENSBookmark,
  RemoveAllENSBookmark,
  SetENSBookmarkError,
  UpdateENSBookmark,
  AddOneENSBookmark,
} from '../actions';

export function selectENSBookmarkId(bookmark: ENSDomainMetadataModel): string {
  return bookmark.id;
}

export const ensBookmarkAdapter: EntityAdapter<ENSDomainMetadataModel> =
  createEntityAdapter<ENSDomainMetadataModel>({
    selectId: selectENSBookmarkId,
  });

export const initialENSBookmarkState: ENSBookmarkStateModel =
  ensBookmarkAdapter.getInitialState({
    error: undefined,
    loading: false,
  });

export function ENSBookmarkReducers(
  state: ENSBookmarkStateModel = initialENSBookmarkState,
  action: any
) {
  switch (action.type) {
    case UpsertOneENSBookmark:
    case UpdateENSBookmark: {
      const stateChange = ensBookmarkAdapter.upsertOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case AddOneENSBookmark: {
      const stateChange = ensBookmarkAdapter.addOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: true,
      };
    }

    case UpsertManyENSBookmark: {
      const stateChange = ensBookmarkAdapter.upsertMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveOneENSBookmark: {
      const stateChange = ensBookmarkAdapter.removeOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveManyENSBookmark: {
      const stateChange = ensBookmarkAdapter.removeMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveAllENSBookmark: {
      const stateChange = ensBookmarkAdapter.removeAll(state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case SetENSBookmarkError: {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

    case UpdateENSBookmark: {
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
