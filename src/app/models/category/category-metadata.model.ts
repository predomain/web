export interface CategoryModel {
  category: string;
  ticker: string;
  profileTexts?: {
    email?: string;
    description?: string;
    keywords?: string;
    discord?: string;
    twitter?: string;
    telegram?: string;
    url?: string;
    reddit?: string;
    predomainBanner?: string;
  };
  data_providers: string[];
  valid_names: string[];
}
