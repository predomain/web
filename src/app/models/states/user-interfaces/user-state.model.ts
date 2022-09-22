import { UserStoreErrorsEnum } from '../../error-enums';
import { UserStoreSuccessEnum } from '../../success-enums';
import { UserModel } from './user.model';
import LedgerEth from '@ledgerhq/hw-app-eth';

export interface UserStateModel {
  user: UserModel;
  loading: boolean;
  error: UserStoreErrorsEnum;
  success: UserStoreSuccessEnum;
}
