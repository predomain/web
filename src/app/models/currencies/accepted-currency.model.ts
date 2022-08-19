import { BigNumber } from '@ethersproject/bignumber';

export interface AcceptedCurrencyModel {
  currency: string;
  address: string;
  decimals: number;
  decimalRepresentation: string;
  balance?: BigNumber;
  marketPrice?: number;

  // INTERNAL USE ONLY
  /**
   * If true, the decimals displayed in the app will be more than 2 i.e. 0.00004 BTC or 0.000052 ETH
   */
  highValueAsset?: boolean;
}
