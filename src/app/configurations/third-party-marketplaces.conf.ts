import { ethers } from 'ethers';
import { ThirdpartyMarketplaceModel } from '../models/marketplace';

export const thirdPartyMarketplacesConfigurations = [
  {
    name: 'OpenSea',
    icon: 'opensea.png',
    url: 'https://opensea.io',
    fee: 2.5,
    assetLinks: {
      ENS: 'assets/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    },
    assetLinksKey: {
      ENS: 'labelHash',
    },
    assetLinksKeyExtraInfo: {
      ENS: '',
    },
    assetLinksProcessor: {
      ENS: (a) => ethers.BigNumber.from(a).toString(),
    },
  },
  {
    name: 'LooksRare',
    icon: 'looksrare.png',
    url: 'https://looksrare.org',
    fee: 2,
    assetLinks: {
      ENS: 'collections/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    },
    assetLinksKey: {
      ENS: 'labelHash',
    },
    assetLinksKeyExtraInfo: {
      ENS: '',
    },
    assetLinksProcessor: {
      ENS: (a) => ethers.BigNumber.from(a).toString(),
    },
  },
  {
    name: 'X2Y2',
    icon: 'x2y2.png',
    url: 'https://x2y2.io',
    fee: 0.5,
    assetLinks: {
      ENS: 'eth/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    },
    assetLinksKey: {
      ENS: 'labelHash',
    },
    assetLinksKeyExtraInfo: {
      ENS: '',
    },
    assetLinksProcessor: {
      ENS: (a) => ethers.BigNumber.from(a).toString(),
    },
  },
  {
    name: 'Kodex',
    icon: 'kodex.png',
    url: 'https://beta.kodex.io',
    fee: 1,
    assetLinks: {
      ENS: 'domain/',
    },
    assetLinksKey: {
      ENS: 'labelName',
    },
    assetLinksKeyExtraInfo: {
      ENS: '.eth',
    },
    assetLinksProcessor: {
      ENS: (a) => a,
    },
  },
  {
    name: 'ENS.Vision',
    icon: 'ensvision.png',
    url: 'https://ens.vision',
    fee: 1.5,
    assetLinks: {
      ENS: 'name/',
    },
    assetLinksKey: {
      ENS: 'labelName',
    },
    assetLinksKeyExtraInfo: {
      ENS: '',
    },
    assetLinksProcessor: {
      ENS: (a) => a,
    },
  },
  {
    name: 'Domainplug',
    icon: 'domainplug.png',
    url: 'https://beta.domainplug.io',
    fee: 1,
    assetLinks: {
      ENS: 'domain/',
    },
    assetLinksKey: {
      ENS: 'labelHash',
    },
    assetLinksKeyExtraInfo: {
      ENS: '',
    },
    assetLinksProcessor: {
      ENS: (a) => ethers.BigNumber.from(a).toString(),
    },
  },
] as ThirdpartyMarketplaceModel[];
