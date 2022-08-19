import { BigNumber } from 'ethers';

export interface PaymentModel {
  id: string;
  paymentMarketAddress?: string;
  paymentExchangeRate?: string;
  paymentPayer?: string;
  paymentCurrency?: string;
  paymentPayerSignatures?: string[];
  paymentExpiry?: number;
  paymentPayee?: string;
  paymentSerial?: string;
  paymentDate?: number;
  paymentNonce?: number;
  paymentAbstractBytesSlot?: string;
  paymentType?: number;
  paymentTotal?: string;
  paymentStatus?: boolean;
  paymentError?: number;
  paymentHash?: string;
  paymentFee?: string;
  paymentGasLimit?: BigNumber;
  paymentRawRecord?: any;
  paymentPayerEthName?: string;
  paymentPriceRanges?: BigNumber[];
  archived?: boolean;
}
