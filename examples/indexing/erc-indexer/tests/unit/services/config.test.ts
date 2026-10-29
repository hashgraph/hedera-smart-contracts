// SPDX-License-Identifier: Apache-2.0

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
  it('should return default value for detectionOnly, false, if ENABLE_DETECTION_ONLY is not set', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    delete process.env.ENABLE_DETECTION_ONLY;

    const configService = new ConfigService();
    expect(configService.getDetectionOnly()).toEqual(false);
  });

  it('should return preconfigured value for detectionOnly if ENABLE_DETECTION_ONLY is provided', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.ENABLE_DETECTION_ONLY = 'true';

    const configService = new ConfigService();
    expect(configService.getDetectionOnly()).toEqual(true);
  });

  it('should return false for detectionOnly when ENABLE_DETECTION_ONLY is not explicitly set to true', () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    process.env.ENABLE_DETECTION_ONLY = 'not a boolean value';

    const configService = new ConfigService();
    expect(configService.getDetectionOnly()).toEqual(false);
  });

  it('should return default value, 100, if SCAN_CONTRACT_LIMIT is undefined', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;
    delete process.env.SCAN_CONTRACT_LIMIT;

    const configService = new ConfigService();

    expect(configService.getScanContractLimit()).toEqual(100);
  });

  it('should return dynamic SCAN_CONTRACT_LIMIT value', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;

    const expectedLimit = 36;
    process.env.SCAN_CONTRACT_LIMIT = expectedLimit.toString();

    const configService = new ConfigService();

    expect(configService.getScanContractLimit()).toEqual(expectedLimit);
  });

  it('should throw an error if SCAN_CONTRACT_LIMIT is set to invalid values', async () => {
    process.env.HEDERA_NETWORK = mockValidHederaNetwork;
    process.env.MIRROR_NODE_URL = mockValidMirrorNodeUrl;

    const invalidLimits = ['-3', '369', 'not a number'];
    invalidLimits.forEach((limit) => {
      process.env.SCAN_CONTRACT_LIMIT = limit;

      expect(() => {
        configService = new ConfigService();
      }).toThrow(/SCAN_CONTRACT_LIMIT Is Not Properly Configured/);
    });
  });
});
