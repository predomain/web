export interface ENSDomainMetadataModel {
  id?: string;
  labelName: string;
  labelHash?: string;
  expiry: string;
  isAvailable: boolean;
  gracePeriodPercent?: number;
  registrationDate?: string;
  owner?: string;
  createdAt?: string;
  events?: { blockNumber: number; transactionID: string }[];
}
