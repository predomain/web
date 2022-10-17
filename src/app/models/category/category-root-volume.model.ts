export interface CategoryRootVolumeModel {
  id: string;
  top_categories: {
    category: string;
    volume: number;
  }[];
  top_sales: {
    domain: string;
    price: string;
    timestamp: number;
  }[];
  recent_sales: {
    domain: string;
    price: string;
    timestamp: number;
  }[];
  categories_daily_volume: {
    category: string;
    volume: number;
  }[];
}
