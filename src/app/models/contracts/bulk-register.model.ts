export const BulkRegisterABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'name',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'duration',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'secret',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'resolver',
            type: 'address',
          },
          {
            internalType: 'bytes[]',
            name: 'data',
            type: 'bytes[]',
          },
          {
            internalType: 'bool',
            name: 'reverseRecord',
            type: 'bool',
          },
          {
            internalType: 'uint32',
            name: 'fuses',
            type: 'uint32',
          },
          {
            internalType: 'uint64',
            name: 'wrapperExpiry',
            type: 'uint64',
          },
        ],
        internalType: 'struct ENSCommitment.Commitment[]',
        name: 'commitments',
        type: 'tuple[]',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'withConfigs',
        type: 'bool',
      },
    ],
    name: 'createCommitmentsForRegistration',
    outputs: [
      {
        internalType: 'bytes32[]',
        name: '',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'bytes32[]',
        name: 'commitments',
        type: 'bytes32[]',
      },
    ],
    name: 'requestRegistration',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string[]',
        name: 'names',
        type: 'string[]',
      },
      {
        internalType: 'uint256[]',
        name: 'priceRanges',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: 'nameLengths',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secret',
        type: 'bytes32',
      },
    ],
    name: 'completeRegistration',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
];
