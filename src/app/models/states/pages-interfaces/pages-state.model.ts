import { PagesEnum } from './pages.enum';
import { NetworkStatusEnum } from './network-status.enum';
import { IpfsErrorsEnum } from '../../error-enums';
import { IpfsStatesEnum } from '../../ipfs';
import { RPCProviderModel } from '../../rpc/rpc-provider.model';

export interface PagesStateModel {
  optionalProvider?: RPCProviderModel;
  pageVisibility?: boolean;
  criticalErrorOccured?: boolean;
  currentPageId?: PagesEnum;
  currentPageSlide?: number;
  networkStatus?: NetworkStatusEnum;
  networkChainCode?: number;
  errorCode?: string;
  ipfsError?: IpfsErrorsEnum;
  ipfsReady?: IpfsStatesEnum;
  isPageLoading?: boolean;
}
