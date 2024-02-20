/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

import { Contract } from 'ethers';
import {
  queryTokenValidity,
  queryTokenStatusInformation,
  queryTokenGeneralInfomation,
  queryTokenSpecificInfomation,
  queryTokenPermissionInformation,
} from '@/api/hedera/hts-interactions/tokenQuery-interactions';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_TOKEN_ADDRESS,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../../utils/common/constants';

// mock convertsArgsProxyToHTSTokenInfo
jest.mock('../../../../src/utils/contract-interactions/HTS/helpers.ts', () => {
  const actualModule = jest.requireActual('../../../../src/utils/contract-interactions/HTS/helpers.ts');

  return {
    ...actualModule,
    convertsArgsProxyToHTSTokenInfo: jest.fn().mockReturnValue('mockedEventReturnedValue'),
    convertsArgsProxyToHTSSpecificInfo: jest.fn().mockReturnValue('mockedEventReturnedValue'),
  };
});

describe('TokenQueryContract Test Suite', () => {
  // mock states
  const keyType = 1;
  const serialNumber = 36;
  const mockedEventReturnedValue = 'mockedEventReturnedValue';
  const ownerAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';
  const spenderAddress = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';

  // prepare contract mocked value
  const contractTokenInfoMockedResolvedValue = (eventName: string) => {
    return jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: eventName,
            },
            data: mockedEventReturnedValue,
            args: {
              tokenInfo: mockedEventReturnedValue,
            },
          },
        ],
        hash: MOCK_TX_HASH,
      }),
    });
  };
  const contractMockedResolvedValue = (eventName: string) => {
    return jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: eventName,
            },
            data: mockedEventReturnedValue,
            args: mockedEventReturnedValue,
          },
        ],
        hash: MOCK_TX_HASH,
      }),
    });
  };

  // mock baseContract object
  const baseContract = {
    isTokenPublic: contractMockedResolvedValue('IsToken'),
    isFrozenPublic: contractMockedResolvedValue('Frozen'),
    isKycPublic: contractMockedResolvedValue('KycGranted'),
    getTokenKeyPublic: contractMockedResolvedValue('TokenKey'),
    getTokenTypePublic: contractMockedResolvedValue('TokenType'),
    allowancePublic: contractMockedResolvedValue('AllowanceValue'),
    isApprovedForAllPublic: contractMockedResolvedValue('Approved'),
    getApprovedPublic: contractMockedResolvedValue('ApprovedAddress'),
    getTokenInfoPublic: contractTokenInfoMockedResolvedValue('TokenInfo'),
    getTokenCustomFeesPublic: contractMockedResolvedValue('TokenCustomFees'),
    getTokenExpiryInfoPublic: contractMockedResolvedValue('TokenExpiryInfo'),
    getTokenDefaultKycStatusPublic: contractMockedResolvedValue('TokenDefaultKycStatus'),
    getFungibleTokenInfoPublic: contractTokenInfoMockedResolvedValue('FungibleTokenInfo'),
    getNonFungibleTokenInfoPublic: contractTokenInfoMockedResolvedValue('NonFungibleTokenInfo'),
    getTokenDefaultFreezeStatusPublic: contractMockedResolvedValue('TokenDefaultFreezeStatus'),
  };

  describe('queryTokenValidity test suite', () => {
    it('should execute queryTokenValidity then return info value from event', async () => {
      const txRes = await queryTokenValidity(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.IsToken).toBe(mockedEventReturnedValue);
    });
  });

  describe('queryTokenGeneralInfomation test suite', () => {
    it('should execute queryTokenGeneralInfomation wit API === "TOKEN" then return info value from event', async () => {
      const txRes = await queryTokenGeneralInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'TOKEN',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenInfo).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenGeneralInfomation wit API === "FUNGIBLE" then return info value from event', async () => {
      const txRes = await queryTokenGeneralInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.FungibleTokenInfo).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenGeneralInfomation wit API === "NON_FUNFIBLE" then return info value from event', async () => {
      const txRes = await queryTokenGeneralInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NON_FUNFIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        serialNumber
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.NonFungibleTokenInfo).toBe(mockedEventReturnedValue);
    });
  });

  describe('queryTokenSpecificInfomation test suite', () => {
    it('should execute queryTokenSpecificInfomation wit API === "KYC_STATUS" then return info value from event', async () => {
      const txRes = await queryTokenSpecificInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DEFAULT_KYC_STATUS',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenDefaultKycStatus).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenSpecificInfomation wit API === "FREEZE_STATUS" then return info value from event', async () => {
      const txRes = await queryTokenSpecificInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DEFAULT_FREEZE_STATUS',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenDefaultFreezeStatus).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenSpecificInfomation wit API === "CUSTOM_FEES" then return info value from event', async () => {
      const txRes = await queryTokenSpecificInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'CUSTOM_FEES',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenCustomFees).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenSpecificInfomation wit API === "TOKEN_TYPE" then return info value from event', async () => {
      const txRes = await queryTokenSpecificInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'TOKEN_TYPE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenType).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenSpecificInfomation wit API === "TOKEN_KEYS" then return info value from event', async () => {
      const txRes = await queryTokenSpecificInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'TOKEN_KEYS',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        keyType as any
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.TokenKey).toBe(mockedEventReturnedValue);
    });
  });

  describe('queryTokenPermissionInformation test suite', () => {
    it('should execute queryTokenPermissionInformation wit API === "ALLOWANCE" then return info value from event', async () => {
      const txRes = await queryTokenPermissionInformation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'ALLOWANCE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        ownerAddress,
        spenderAddress
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.AllowanceValue).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenPermissionInformation wit API === "GET_APPROVED" then return info value from event', async () => {
      const txRes = await queryTokenPermissionInformation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'GET_APPROVED',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        ownerAddress,
        spenderAddress,
        serialNumber
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.ApprovedAddress).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenPermissionInformation wit API === "IS_APPROVAL" then return info value from event', async () => {
      const txRes = await queryTokenPermissionInformation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_APPROVAL',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        ownerAddress,
        spenderAddress,
        serialNumber
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.Approved).toBe(mockedEventReturnedValue);
    });
  });

  describe('queryTokenStatusInformation test suite', () => {
    it('should execute queryTokenStatusInformation wit API === "IS_KYC" then return info value from event', async () => {
      const txRes = await queryTokenStatusInformation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_KYC',
        MOCK_TOKEN_ADDRESS,
        ownerAddress,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.KycGranted).toBe(mockedEventReturnedValue);
    });

    it('should execute queryTokenStatusInformation wit API === "IS_FROZEN" then return info value from event', async () => {
      const txRes = await queryTokenStatusInformation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_FROZEN',
        MOCK_TOKEN_ADDRESS,
        ownerAddress,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.Frozen).toBe(mockedEventReturnedValue);
    });
  });
});
