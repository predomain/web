import { PagesEnum } from './pages.enum';
import { NetworkStatusEnum } from './network-status.enum';
import { IpfsErrorsEnum } from '../../error-enums';
import { IpfsStatesEnum } from '../../ipfs';

export interface PagesStateModel {
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
