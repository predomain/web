import { PagesEnum } from '../models/states/pages-interfaces';

export const generalConfigurations = {
  version: '0.1.0',
  defaultLanguage: 'en',
  defaultPage: PagesEnum.HOME,
  maximumDecimalInPrices: 8,
  maxAttemptsToCheckoutData: 3,
  sessionTimeout: 6000 * 15,
  maxRPCCallRetries: 3,
  timeUntilImageLoadErrors: 3000,
  timeToUpdateEthUSDRate: 5000,
  timeToUpdateCheckoutPipe: 3000,
  timeToUpdateRegistrationGasPrice: 5000,
  timeUntilCheckoutExpires: 3000,
  maxConfirmationsUntilTxFinal: 1,
  declarePaymentStatusUnkownUntilXFailedDataFetches: 5,
  gasLimitBuffer: 1,
  maxCheckoutRetryUntilRehydrateProcessId: 5,
  maxIpfsSubscriptionRetries: 5,
  maxDomainsToRegister: 50,
  maxYearsRegistration: 1000,
  maxTotalCostBuffer: 115,
  defaultCurrency: 'ETH',
  enableCustomRPC: true,
  docsLink: 'https://predomain.gitbook.io/predomain-docs/',
  blockscanLink: 'https://chat.blockscan.com/index?a=',
  trezorManifest: {
    email: 'predomain@skiff.com',
    appUrl: 'https://predomain.eth.limo',
  },
  appMeta: {
    description: 'Decentralised ENS Search, Registration, & Marketplace',
    url: 'https://predomain.eth.limo',
    icons: ['https://ecanvas.eth.limo/assets/logo.png'],
    name: 'Predomain.eth',
  },
  wallectConnectSupportedWallets: [
    'rainbow',
    'metamask',
    'argent',
    'trust',
    'trezor',
    'imtoken',
    'pillar',
    'coinbase',
  ],
};
