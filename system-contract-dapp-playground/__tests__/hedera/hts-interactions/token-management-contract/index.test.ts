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

import {
  manageTokenStatus,
  manageTokenRelation,
  manageTokenDeduction,
  manageTokenInfomation,
  manageTokenPermission,
} from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import {
  CommonKeyObject,
  IHederaTokenServiceExpiry,
  IHederaTokenServiceHederaToken,
} from '@/types/contract-interactions/HTS';
import { Contract } from 'ethers';

describe('TokenManagementContract test suite', () => {
  // mock states
  const responseCode = 22;
  const AUTO_RENEW_SECOND = 0;
  const AUTO_RENEW_PERIOD = 8000000;
  const NEW_AUTO_RENEW_PERIOD = 7999900;
  const accountAddress = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const contractId = '0xDd7fCb7c2ee96A79B1e201d25F5E43d6a0cED5e6';
  const hederaTokenAddress = '0x00000000000000000000000000000000000084b7';
  const hederaTokenAddresses = [
    '0x00000000000000000000000000000000000084b7',
    '0x00000000000000000000000000000000000084b8',
    '0x00000000000000000000000000000000000084b9',
  ];
  const txHash = '0x63424020a69bf46a0669f46dd66addba741b9c02d37fab1686428f5209bc759d';

  const tokenExpiry: IHederaTokenServiceExpiry = {
    second: AUTO_RENEW_SECOND,
    autoRenewAccount: accountAddress,
    autoRenewPeriod: NEW_AUTO_RENEW_PERIOD,
  };

  const tokenInfo: IHederaTokenServiceHederaToken = {
    name: 'udpatedTokenInfo',
    symbol: 'UTI',
    treasury: accountAddress,
    memo: 'UUTI',
    tokenSupplyType: false,
    maxSupply: 3000,
    freezeDefault: false,
    tokenKeys: [],
    expiry: tokenExpiry,
  };

  // mock inputKeys with CommonKeyObject[] type
  const tokenKeys: CommonKeyObject[] = [
    {
      keyType: 'ADMIN',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'KYC',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'FREEZE',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'WIPE',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'SUPPLY',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'FEE',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
    {
      keyType: 'PAUSE',
      keyValueType: 'contractId',
      keyValue: contractId,
    },
  ];

  const contractMockedResolvedValue = {
    wait: jest.fn().mockResolvedValue({
      logs: [
        {
          fragment: {
            name: 'ResponseCode',
          },
          data: responseCode,
        },
      ],
      hash: txHash,
    }),
  };

  // mock baseContract object
  const baseContract = {
    updateTokenInfoPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    updateTokenExpiryInfoPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    updateTokenKeysPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    approvePublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    approveNFTPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    setApprovalForAllPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    pauseTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    unpauseTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    revokeTokenKycPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    freezeTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    unfreezeTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    dissociateTokensPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    dissociateTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    wipeTokenAccountPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    wipeTokenAccountNFTPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    burnTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    deleteTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
  };

  describe('manageTokenInfomation test suite', () => {
    it('should execute manageTokenInfomation with API === "UPDATE_INFO" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_INFO',
        hederaTokenAddress,
        tokenInfo
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_INFO" then return error if tokenInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_INFO',
        hederaTokenAddress,
        undefined
      );

      expect(txRes.err).toBe('Token information object is needed for UPDATE_INFO API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "UPDATE_EXPIRY" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_EXPIRY',
        hederaTokenAddress,
        undefined,
        tokenExpiry
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_EXPIRY" then return error if expiryInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_EXPIRY',
        hederaTokenAddress,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Expiry information object is needed for UPDATE_EXPIRY API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "UPDATE_KEYS" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_KEYS',
        hederaTokenAddress,
        undefined,
        undefined,
        tokenKeys
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_KEYS" then return error if keysInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_KEYS',
        hederaTokenAddress,
        undefined,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Keys information object is needed for UPDATE_KEYS API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation then return an error if hederaTokenAddress is not valid success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        'UPDATE_KEYS',
        '0xabc',
        undefined,
        undefined,
        tokenKeys
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenPermission test suite', () => {
    it('should execute manageTokenInfomation with API === "APPROVED_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'APPROVED_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        200
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "APPROVED_FUNGIBLE" then return an error if amountToApprove is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'APPROVED_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        undefined
      );

      expect(txRes.err).toBe('Amount to approve is needed for APPROVED_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "APPROVED_NON_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'APPROVED_NON_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        undefined,
        20
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "APPROVED_NON_FUNGIBLE" then return an error if serialNumber is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'APPROVED_NON_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Serial number is needed for APPROVED_NON_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "SET_APPROVAL" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'SET_APPROVAL',
        hederaTokenAddress,
        accountAddress,
        undefined,
        undefined,
        true
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenInfomation with API === "SET_APPROVAL" then return an error if approvedStatus is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'SET_APPROVAL',
        hederaTokenAddress,
        accountAddress,
        undefined,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Approved status is needed for SET_APPROVAL API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation then return error if hederaTokenAddress is invalid', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'SET_APPROVAL',
        '0xabc',
        accountAddress
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
    it('should execute manageTokenInfomation then return error if targetApproveAddress is invalid', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        'SET_APPROVAL',
        hederaTokenAddress,
        '0xabc'
      );

      expect(txRes.err).toBe('Invalid target approved address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenStatus test suite', () => {
    it('should execute manageTokenStatus with API === "PAUSE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenStatus(
        baseContract as unknown as Contract,
        'PAUSE',
        hederaTokenAddress
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenStatus with API === "UNPAUSE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenStatus(
        baseContract as unknown as Contract,
        'UNPAUSE',
        hederaTokenAddress
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenStatus then return error if hederaTokenAddress is invalid', async () => {
      const txRes = await manageTokenStatus(baseContract as unknown as Contract, 'PAUSE', '0xabc');

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenRelation test suite', () => {
    it('should execute manageTokenRelation with API === "REVOKE_KYC" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'REVOKE_KYC',
        accountAddress,
        hederaTokenAddresses
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenRelation with API === "FREEZE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'FREEZE',
        accountAddress,
        hederaTokenAddresses
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });
    it('should execute manageTokenRelation with API === "UNFREEZE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'UNFREEZE',
        accountAddress,
        hederaTokenAddresses
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });
    it('should execute manageTokenRelation with API === "DISSOCIATE_TOKEN" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'DISSOCIATE_TOKEN',
        accountAddress,
        hederaTokenAddresses
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenRelation then return error if accountAddress is invalid', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'REVOKE_KYC',
        '0xabc',
        hederaTokenAddresses
      );

      expect(txRes.err).toBe('Invalid account address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenRelation then return error if hederaTokenAddresses is an empty array', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'REVOKE_KYC',
        accountAddress,
        []
      );

      expect(txRes.err).toBe('Invalid token inputs');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenRelation then return error if hederaTokenAddresses contains an invalid token address', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        'REVOKE_KYC',
        accountAddress,
        [hederaTokenAddress, '0xabc']
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenDeduction test suite', () => {
    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        120
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return an error if accountAddress is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_FUNGIBLE',
        hederaTokenAddress
      );

      expect(txRes.err).toBe('Account address to wipe tokens from is needed for WIPE_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return an error if amount is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_FUNGIBLE',
        hederaTokenAddress,
        accountAddress
      );

      expect(txRes.err).toBe('Amount to wipe is needed for WIPE_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_NON_FUNGIBLE',
        hederaTokenAddress,
        accountAddress,
        undefined,
        [120]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return an error if accountAddress is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_NON_FUNGIBLE',
        hederaTokenAddress
      );

      expect(txRes.err).toBe(
        'Account address to wipe tokens from is needed for WIPE_NON_FUNGIBLE API'
      );
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return an error if serialNumber is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'WIPE_NON_FUNGIBLE',
        hederaTokenAddress,
        accountAddress
      );

      expect(txRes.err).toBe('Serial number to wipe is needed for WIPE_NON_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "BURN" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'BURN',
        hederaTokenAddress,
        undefined,
        120,
        [120]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenDeduction with API === "BURN" then return an error if amount is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'BURN',
        hederaTokenAddress,
        accountAddress
      );

      expect(txRes.err).toBe('Amount to burn is needed for BURN API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "BURN" then return an error if serialNumber is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'BURN',
        hederaTokenAddress,
        undefined,
        120
      );

      expect(txRes.err).toBe('Serial number to burn is needed for BURN API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "DELETE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'DELETE',
        hederaTokenAddress
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute manageTokenDeduction then return error if hederaTokenAddress is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'DELETE',
        '0xabc'
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction then return error if accountAddress is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'DELETE',
        hederaTokenAddress,
        '0xabc'
      );

      expect(txRes.err).toBe('Invalid account address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction then return error if amount is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'DELETE',
        hederaTokenAddress,
        accountAddress,
        -9
      );

      expect(txRes.err).toBe('Amount cannot be negative');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction then return error if accountAddress is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        'DELETE',
        hederaTokenAddress,
        accountAddress,
        120,
        [-9]
      );

      expect(txRes.err).toBe('Serial number cannot be negative');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });
});
