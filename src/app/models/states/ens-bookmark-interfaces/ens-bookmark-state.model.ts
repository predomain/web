import { EntityState } from '@ngrx/entity';
import { ENSDomainMetadataModel } from '../../canvas';
import { ENSBookmarkStoreErrorsEnum } from '../../error-enums';

export interface ENSBookmarkStateModel
  extends EntityState<ENSDomainMetadataModel> {
  error: ENSBookmarkStoreErrorsEnum;
  loading: boolean;
}
