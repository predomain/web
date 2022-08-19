import { WalletTypesEnum } from '../wallet-interfaces';

export interface UserModel {
  connectSignature?: string;
  timestamp?: string;
  walletAddress?: string;
  originalConnectAddress?: string;
  deviceLanguage?: string;
  connectType?: WalletTypesEnum;
  ethName?: string;
}
