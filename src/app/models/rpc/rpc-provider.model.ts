import { ValidRPCProvidersEnum } from './valid-rpc-providers.enum';

export interface RPCProviderModel {
  type: ValidRPCProvidersEnum;
  url?: string;
  id?: string;
  secret?: string;
}
