export const environment = {
  production: false,
  development: true,
  deployed: false,
  test: true,
  local: false,
  chrome: false,
  defaultChain: 'ropsten',
  baseUrl: 'https://localhost:4200',
  validChainIds: {
    '3': 'ropsten',
    '1': 'homestead',
  },
  networks: {
    ropsten: {
      networkId: 'ropsten',
      networkName: 'Ropsten Testnet',
      chainId: 3,
      providerKey: 'ALCHEMY_KEY',
      ensApp: 'https://app.ens.domains',
      ensMetadataAPI:
        'https://metadata.ens.domains/ropsten/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/',
      ensGraphQLAPI:
        'https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten',
    },
    homestead: {
      networkId: 'homestead',
      networkName: 'Mainnet',
      chainId: 1,
      providerKey: 'ALCHEMY_KEY',
      ensApp: 'https://app.ens.domains',
      ensMetadataAPI:
        'https://metadata.ens.domains/mainnet/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/',
      ensGraphQLAPI: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
    },
  },
};
