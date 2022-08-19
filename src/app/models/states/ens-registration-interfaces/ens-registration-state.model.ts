import { EntityState } from '@ngrx/entity';
import { ENSDomainMetadataModel } from '../../canvas';
import { ENSRegistrationStoreErrorsEnum } from '../../error-enums';

export interface ENSRegistrationStateModel
  extends EntityState<ENSDomainMetadataModel> {
  error: ENSRegistrationStoreErrorsEnum;
  loading: boolean;
}
