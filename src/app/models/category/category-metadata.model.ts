import { SaleDiscoveredModel } from './sale-discovered.model';

export interface CategoryModel {
  id?: string;
  category?: string;
  ticker?: string;
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
  data_providers?: string[];
  alphabetical?: boolean;
  emojis?: boolean;
  max_length?: number;
  numeric?: boolean;
  pattern?: string;
  patterned?: boolean;
  special_characters?: boolean;
  version?: number;
  valid_names?: string[];
  prefix_offset?: number;
  suffix_offset?: number;
  filters?: any;
  optimised?: any;
  volume?: {
    daily_volume?: number;
    hourly_sales?: number;
    hourly_volume?: number;
    minutely_volume?: number;
    previous_daily_volume?: number;
    previous_hourly_sales?: number;
    previous_hourly_volume?: number;
    previous_minutely_volume?: number;
    sales?: SaleDiscoveredModel[];
    tracking_annually?: number;
    tracking_daily?: number;
    tracking_hourly?: number;
    tracking_minutely?: number;
    tracking_monthly?: number;
  };
}
