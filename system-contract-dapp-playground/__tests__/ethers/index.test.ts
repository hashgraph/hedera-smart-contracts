// SPDX-License-Identifier: Apache-2.0

import { Contract, ethers } from 'ethers';
import { HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';

// Mock the ethers.Contract constructor
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    Contract: jest.fn().mockImplementation(() => ({
      name: jest.fn().mockResolvedValue('Hedera'),
    })),
  };
});

describe('Contract tests', () => {
  beforeEach(() => {
    (Contract as jest.Mock).mockClear();
  });

  it('should create an instance of ethers.Contract and interact with deployed contract', async () => {
    const contractAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const contractABI = HEDERA_SMART_CONTRACTS_ASSETS.ERC_20.contractABI;

    const contract = new Contract(contractAddress, contractABI);
    const name = await contract.name();

    expect(name).toBe('Hedera');
  });

  it('should not create an instance of ethers.ContractFactory to interact with deployed contract', async () => {
    const contractABI = HEDERA_SMART_CONTRACTS_ASSETS.ERC_20.contractABI;
    const contractBytecode = HEDERA_SMART_CONTRACTS_ASSETS.ERC_20.contractBytecode;

    const factory = new ethers.ContractFactory(contractABI, contractBytecode);

    try {
      await (factory as any).name();
    } catch (error: any) {
      expect(error.toString()).toBe('TypeError: factory.name is not a function');
    }
  });
});
