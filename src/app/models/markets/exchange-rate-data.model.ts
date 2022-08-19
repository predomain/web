import { BigNumber } from "@ethersproject/bignumber";

export interface ExchangeRateDataModel {
  expectedRate: BigNumber;
  amountToReceive: BigNumber;
}
