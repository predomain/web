import { WalletTypesEnum } from '../wallet-interfaces';

export interface UserRegistrationModel {
  walletType?: WalletTypesEnum;
  address?: string;
}
