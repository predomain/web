import { Action } from '@ngrx/store';
import { CategoriesRootModel, CategoryModel } from 'src/app/models/category';
import { CategoriesStoreErrorsEnum } from 'src/app/models/error-enums';
export const InitEffectsCategory = '[CategoryState] Init effects category.';
export const SetCategoriesMetadata = '[CategoryState] Set category metadata.';
export const SetCategoriesRootVolumeData =
  '[CategoryState] Set category root volume data.';
export const AddOneCategory = '[CategoryState] Add category.';
export const UpdateCategory = '[CategoryState] Update category.';
export const UpsertOneCategory = '[CategoryState] Upsert one category.';
export const UpsertManyCategory = '[CategoryState] Upsert many category.';
export const GetOneCategory = '[CategoryState] Get one category.';
export const GetAllCategory = '[CategoryState] Get all category.';
export const RemoveOneCategory = '[CategoryState] Remove one category.';
export const RemoveManyCategory = '[CategoryState] Remove many category.';
export const RemoveAllCategory = '[CategoryState] Remove all category.';
export const SetCategoryError = '[CategoryState] Category error set.';

export class CategoryEffectsInit implements Action {
  readonly type = InitEffectsCategory;
  constructor() {}
}

export class CategoryMetadataSet implements Action {
  readonly type = SetCategoriesMetadata;
  constructor(public payload: CategoriesRootModel) {}
}

export class CategoryRootVolumeDataSet implements Action {
  readonly type = SetCategoriesRootVolumeData;
  constructor(public payload: CategoriesRootModel) {}
}

export class CategoryErrorSet implements Action {
  readonly type = SetCategoryError;
  constructor(public payload: CategoriesStoreErrorsEnum) {}
}

export class CategoryAddOne implements Action {
  readonly type = AddOneCategory;
  constructor(public payload: CategoryModel, public toSave = true) {}
}

export class CategoryUpsertOne implements Action {
  readonly type = UpsertOneCategory;
  constructor(public payload: CategoryModel, public toSave = true) {}
}

export class CategoryUpsertMany implements Action {
  readonly type = UpsertManyCategory;
  constructor(public payload: CategoryModel[], public toSave = true) {}
}

export class CategoryGetOne implements Action {
  readonly type = GetOneCategory;
  constructor(public payload: string) {}
}

export class CategoryGetAll implements Action {
  readonly type = GetAllCategory;
  constructor(public payload: string) {}
}

export class CategoryRemoveOne implements Action {
  readonly type = RemoveOneCategory;
  constructor(public payload: string, public toSave = true) {}
}

export class CategoryRemoveMany implements Action {
  readonly type = RemoveManyCategory;
  constructor(public payload: string[], public toSave = true) {}
}

export class CategoryRemoveAll implements Action {
  readonly type = RemoveAllCategory;
  constructor(public toSave = true) {}
}

export class CategoryUpdate implements Action {
  readonly type = UpdateCategory;
  constructor(public payload: CategoryModel, public toSave = true) {}
}

export type CategoryActions =
  | CategoryRootVolumeDataSet
  | CategoryMetadataSet
  | CategoryAddOne
  | CategoryRemoveOne
  | CategoryRemoveMany
  | CategoryGetAll
  | CategoryGetOne
  | CategoryUpsertOne
  | CategoryUpsertMany
  | CategoryErrorSet
  | CategoryRemoveAll
  | CategoryUpdate;
