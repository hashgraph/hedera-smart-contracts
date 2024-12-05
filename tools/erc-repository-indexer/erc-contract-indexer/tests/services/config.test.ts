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

import axios from 'axios';
import { ConfigService } from '../../src/services/config';
import constants from '../utils/constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConfigService', () => {
  let configService: ConfigService;
  const mockValidHederaNetwork = `testnet`;
  const mockContractId = constants.MOCK_MN_CONTRACTS[0].contract_id;
  const mockContractEvmAddress = constants.MOCK_MN_CONTRACTS[0].evm_address;
  const mockStartingPoint = `/api/v1/contracts?limit=100&order=asc&contract.id=gt:${mockContractId}`;

  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.HEDERA_NETWORK;
    delete process.env.STARTING_POINT;
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

  it('should not throw an error if HEDERA_NETWORK is valid', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    configService = new ConfigService();
    expect(configService.getNetwork()).toBe(mockValidHederaNetwork);
  });

  it('should throw an error if STARTING_POINT is invalid', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.STARTING_POINT = 'invalid_starting_point';
    expect(() => {
      configService = new ConfigService();
    }).toThrow(/STARTING_POINT Is Not Properly Configured/);
  });

  it('should resolve starting point from contract ID', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.STARTING_POINT = mockContractId;

    configService = new ConfigService();
    const startingPoint = await configService.resolveStartingPoint();
    expect(startingPoint).toBe(mockStartingPoint);
  });

  it('should resolve starting point from EVM address', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.STARTING_POINT = mockContractEvmAddress;

    mockedAxios.get.mockResolvedValueOnce({
      data: { contract_id: mockContractId },
    }); // Second call succeeds

    configService = new ConfigService();
    const startingPoint = await configService.resolveStartingPoint();
    expect(startingPoint).toBe(mockStartingPoint);
  });
});
