import { BigNumber } from 'ethers';
import { ENSDomainMetadataModel } from '../../canvas';

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
  metadata?: ENSDomainMetadataModel;
}

export interface ENSRegistrationCommmitmentRequestResultModel {
  commitments: string[];
  priceRanges: BigNumber[];
}
