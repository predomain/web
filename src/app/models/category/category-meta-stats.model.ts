import { SaleDiscoveredModel } from './sale-discovered.model';

export interface CategoryMetaStatsModel {
  previousHourlySales: number;
  hourlySales: number;
  previousDailyVolume: number;
  dailyVolume: number;
  topSale: number;
  topBuyer: string;
  topBuyerEthName?: string;
  domainsCount: number;
  sales: SaleDiscoveredModel[];
}
