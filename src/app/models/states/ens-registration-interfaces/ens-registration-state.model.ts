import { EntityState } from '@ngrx/entity';
import { DomainMetadataModel } from '../../domains';
import { ENSRegistrationStoreErrorsEnum } from '../../error-enums';

export interface ENSRegistrationStateModel
  extends EntityState<DomainMetadataModel> {
  error: ENSRegistrationStoreErrorsEnum;
  loading: boolean;
}
