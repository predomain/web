import { AcceptedCurrencyModel } from '../../models/currencies';

export enum ContractAddressesTestnetEnum {
  ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  DAI = '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
  USDT = '0x13512979ADE267AB5100878E2e0f485B568328a4',
  WBTC = '0x3b92f58feD223E2cB1bCe4c286BD97e42f2A12EA',
}

export const contractChainlinkTestnet =
  '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e';
export const predomainHelperTestnet =
  '0x34c3f58058e2ad098ef437ee5ea1ff1fe2fe4214';

export const acceptedCurrenciesTestnet = [
  {
    currency: 'ETH',
    address: ContractAddressesTestnetEnum.ETH,
    decimals: 18,
    decimalRepresentation: '1000000000000000000',
    highValueAsset: true,
  },
  {
    currency: 'DAI',
    address: ContractAddressesTestnetEnum.DAI,
    decimals: 18,
    decimalRepresentation: '1000000000000000000',
    highValueAsset: false,
  } as AcceptedCurrencyModel,
  {
    currency: 'USDT',
    address: ContractAddressesTestnetEnum.USDT,
    decimals: 6,
    decimalRepresentation: '1000000',
    highValueAsset: false,
  } as AcceptedCurrencyModel,
  {
    currency: 'WBTC',
    address: ContractAddressesTestnetEnum.WBTC,
    decimals: 18,
    decimalRepresentation: '1000000000000000000',
    highValueAsset: true,
  } as AcceptedCurrencyModel,
] as AcceptedCurrencyModel[];
