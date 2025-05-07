/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { AxiosInstance } from 'axios';
import { ConfigService } from '../../../src/services/config';
import testConstants from '../utils/constants';
import { RegistryGenerator } from '../../../src/services/registryGenerator';
import { Helper } from '../../../src/utils/helper';
import constants from '../../../src/utils/constants';

describe('ConfigService', () => {
  let configService: ConfigService;
  const mockValidHederaNetwork = `testnet`;
  const mockValidMirrorNodeUrl = 'https://testnet.mirrornode.hedera.com';
  const mockContractId = testConstants.MOCK_MN_CONTRACTS[0].contract_id;
  const mockContractEvmAddress = testConstants.MOCK_MN_CONTRACTS[0].evm_address;
  const mockStartingPoint = `/api/v1/contracts?limit=100&order=asc&contract.id=gte:${mockContractId}`;
  const registryGenerator = new RegistryGenerator();

  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.HEDERA_NETWORK;
    delete process.env.STARTING_POINT;
    delete process.env.MIRROR_NODE_URL;

    jest.spyOn(Helper, 'buildAxiosClient').mockReturnValue({
      mirrorNodeRestClient: {
        get: jest
          .fn()
          .mockResolvedValue({ data: { contract_id: mockContractId } }),
      } as any,
      mirrorNodeWeb3Client: {} as jest.Mocked<AxiosInstance>,
    });
  });

  it('should get the correct configurations', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.MIRROR_NODE_URL_WEB3 = mockValidMirrorNodeUrl;
    const configService = new ConfigService();

    expect(configService.getNetwork()).toEqual(mockValidHederaNetwork);
    expect(configService.getMirrorNodeUrl()).toEqual(mockValidMirrorNodeUrl);
    expect(configService.getMirrorNodeUrlWeb3()).toEqual(
      mockValidMirrorNodeUrl
    );
  });

  it('should not throw error even if MIRROR_NODE_URL_WEB3 is not set', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    delete process.env.MIRROR_NODE_URL_WEB3;

    const configService = new ConfigService();

    expect(configService.getMirrorNodeUrlWeb3()).toEqual('');
  });

  it('should throw an error when HEDERA_NETWORK is not configured', () => {
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/HEDERA_NETWORK Is Not Properly Configured/);
  });

  it('should throw an error if HEDERA_NETWORK is invalid', () => {
    process.env.HEDERA_NETWORK = 'invalid_network';
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/HEDERA_NETWORK Is Not Properly Configured/);
  });

  it('should throw an error if MIRROR_NODE_URL is not configured', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/MIRROR_NODE_URL Is Not Properly Configured/);
  });

  it('should throw an error if MIRROR_NODE_URL is invalid', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = 'invalid_url';
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/MIRROR_NODE_URL Is Not Properly Configured/);
  });

  it('should not throw an error if MIRROR_NODE_URL is invalid when network is not one of the PRODUCTION_NETWORKS', () => {
    const localnode = 'local-node';
    expect(constants.PRODUCTION_NETWORKS.includes(localnode)).toBeFalsy;

    const invalid_url = 'invalid_url';
    process.env.HEDERA_NETWORK = localnode;
    process.env.MIRROR_NODE_URL = invalid_url;
    const configService = new ConfigService();
    expect(configService.getMirrorNodeUrl()).toEqual(invalid_url);
  });

  it('should not throw an error if HEDERA_NETWORK and MIRROR_NODE_URL are valid', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    configService = new ConfigService();
    expect(configService.getNetwork()).toBe(mockValidHederaNetwork);
  });

  it('should throw an error if STARTING_POINT is invalid', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.STARTING_POINT = 'invalid_starting_point';
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/STARTING_POINT Is Not Properly Configured/);
  });

  it('should resolve starting point from contract ID', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.STARTING_POINT = mockContractId;

    configService = new ConfigService();
    const startingPoint =
      await configService.resolveStartingPoint(registryGenerator);
    expect(startingPoint).toBe(mockStartingPoint);
  });

  it('should resolve starting point from EVM address', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.STARTING_POINT = mockContractEvmAddress;

    configService = new ConfigService();
    const startingPoint =
      await configService.resolveStartingPoint(registryGenerator);
    expect(startingPoint).toBe(mockStartingPoint);
  });

  it('should resolve starting point from get contracts list next pointer', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.STARTING_POINT = mockStartingPoint;

    configService = new ConfigService();
    const startingPoint =
      await configService.resolveStartingPoint(registryGenerator);

    expect(startingPoint).toBe(process.env.STARTING_POINT);
  });

  it('should resolve starting point from storage if available', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.STARTING_POINT = '';

    // Mock the retrieveNextPointer method to return a valid pointer
    const mockRetrieveNextPointer = jest
      .spyOn(registryGenerator, 'retrieveNextPointer')
      .mockResolvedValue(mockStartingPoint);

    configService = new ConfigService();
    const startingPoint =
      await configService.resolveStartingPoint(registryGenerator);

    expect(startingPoint).toBe(mockStartingPoint);
    expect(mockRetrieveNextPointer).toHaveBeenCalled();
  });
});
