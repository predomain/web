import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { CategoryModel } from 'src/app/models/category';
import { CategoriesStateModel } from 'src/app/models/states/categories-interfaces';
import {
  UpsertOneCategory,
  UpsertManyCategory,
  RemoveOneCategory,
  RemoveManyCategory,
  RemoveAllCategory,
  SetCategoryError,
  UpdateCategory,
  AddOneCategory,
  SetCategoriesMetadata,
  SetCategoriesRootVolumeData,
} from '../actions';

export function selectCategoryId(category: CategoryModel): string {
  return category.id;
}

export const CategoryAdapter: EntityAdapter<CategoryModel> =
  createEntityAdapter<CategoryModel>({
    selectId: selectCategoryId,
  });

export const initialCategoryState: CategoriesStateModel =
  CategoryAdapter.getInitialState({
    categoriesMetadata: undefined,
    categoriesRootVolumeData: undefined,
    error: undefined,
    loading: false,
  });

export function CategoryReducers(
  state: CategoriesStateModel = initialCategoryState,
  action: any
) {
  switch (action.type) {
    case SetCategoriesRootVolumeData: {
      return {
        ...state,
        categoriesRootVolumeData: action.payload,
        loading: false,
      };
    }

    case SetCategoriesMetadata: {
      return {
        ...state,
        categoriesMetadata: action.payload,
        loading: false,
      };
    }

    case UpsertOneCategory:
    case UpdateCategory: {
      const stateChange = CategoryAdapter.upsertOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case AddOneCategory: {
      const stateChange = CategoryAdapter.addOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: true,
      };
    }

    case UpsertManyCategory: {
      const stateChange = CategoryAdapter.upsertMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveOneCategory: {
      const stateChange = CategoryAdapter.removeOne(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveManyCategory: {
      const stateChange = CategoryAdapter.removeMany(action.payload, state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case RemoveAllCategory: {
      const stateChange = CategoryAdapter.removeAll(state);
      return {
        ...state,
        ids: stateChange.ids,
        entities: stateChange.entities,
        error: undefined,
        loading: false,
      };
    }

    case SetCategoryError: {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

    case UpdateCategory: {
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
