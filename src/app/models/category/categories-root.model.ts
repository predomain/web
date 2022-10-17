export interface CategoriesRootModel {
  version: number;
  activeProviders: string[];
  rootDataProviders: string[];
  categories: string[];
  categoriesTitle: { ['category']: string };
  categoriesDescription: { ['category']: string };
  categoriesThumbnails: { ['category']: string };
}
