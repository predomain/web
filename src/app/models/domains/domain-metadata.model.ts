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
