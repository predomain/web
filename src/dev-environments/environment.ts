export const environment = {
  production: false,
  development: true,
  deployed: false,
  test: true,
  local: false,
  chrome: false,
  defaultChain: 'goerli',
  baseUrl: 'https://localhost:4200',
  validChainIds: {
    '5': 'goerli',
    '1': 'homestead',
  },
  networks: {
    goerli: {
      networkId: 'goerli',
      networkName: 'Goerli Testnet',
      chainId: 5,
      providerKey: 'ALCHEMY_KEY',
      ensApp: 'https://app.ens.domains',
      ensMetadataAPI:
        'https://metadata.ens.domains/goerli/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/',
      ensGraphQLAPI:
        'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli',
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
