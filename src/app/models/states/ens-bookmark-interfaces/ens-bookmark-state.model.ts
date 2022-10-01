import { EntityState } from '@ngrx/entity';
import { DomainMetadataModel } from '../../domains';
import { ENSBookmarkStoreErrorsEnum } from '../../error-enums';

export interface ENSBookmarkStateModel
  extends EntityState<DomainMetadataModel> {
  error: ENSBookmarkStoreErrorsEnum;
  loading: boolean;
}
