import { EntityState } from '@ngrx/entity';
import { PaymentStoreErrorsEnum } from '../../error-enums';
import { PaymentModel } from './payment.model';

export interface PaymentStateModel extends EntityState<PaymentModel> {
  error: PaymentStoreErrorsEnum;
  loading: boolean;
  ethUsdPrice: string;
}
