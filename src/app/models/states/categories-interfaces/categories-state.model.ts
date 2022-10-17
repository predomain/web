import { EntityState } from '@ngrx/entity';
import {
  CategoriesRootModel,
  CategoryModel,
  CategoryRootVolumeModel,
} from '../../category';
import { CategoriesStoreErrorsEnum } from '../../error-enums';

export interface CategoriesStateModel extends EntityState<CategoryModel> {
  categoriesMetadata: CategoriesRootModel;
  categoriesRootVolumeData: CategoryRootVolumeModel;
  error: CategoriesStoreErrorsEnum;
  loading: boolean;
}
