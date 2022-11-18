export interface ThirdpartyMarketplaceModel {
  name: string;
  icon: string;
  url: string;
  fee: number;
  assetLinks: {
    ENS?: string;
  };
  assetLinksKey: {
    ENS?: string;
  };
  assetLinksKeyExtraInfo: {
    ENS?: string;
  };
  assetLinksProcessor: {
    ENS?: any;
  };
}
