import { DomainTypeEnum } from './domain-type.enum';

export interface DomainMetadataModel {
  id?: string;
  labelName?: string;
  labelHash?: string;
  expiry?: string;
  isNotAvailable?: boolean;
  gracePeriodPercent?: number;
  registrationDate?: string;
  owner?: string;
  createdAt?: string;
  domainType?: DomainTypeEnum;
  events?: { blockNumber: number; transactionID: string }[];

  /**
   * Management variables
   */
  action?: any;
  moreInfo?: any;
  renew?: boolean;
  transfer?: boolean;
  detailExpanded?: boolean;
}
