import { BigNumber } from 'ethers';
import { DomainMetadataModel } from '../../domains';

export interface ENSRegistrationCommitmentModel {
  name?: string;
  owner?: string;
  duration?: BigNumber;
  secret?: string;
  resolver?: string;
  data?: string[];
  reverseRecord?: boolean;
  fuses?: number;
  wrapperExpiry?: number;

  // Internal use, not included in contract interactions
  metadata?: DomainMetadataModel;
}

export interface ENSRegistrationCommmitmentRequestResultModel {
  commitments: string[];
  priceRanges: string[];
}
