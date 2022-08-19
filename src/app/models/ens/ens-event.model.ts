import { EnsEventsEnum } from './ens-events.enum';

export interface ENSEventModel {
  type?: EnsEventsEnum;
  from?: string;
  to?: string;
  value?: string;
  txHash?: string;
  date?: number;
}
