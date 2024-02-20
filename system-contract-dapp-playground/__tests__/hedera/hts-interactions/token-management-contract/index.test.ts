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
  manageTokenStatus,
  manageTokenRelation,
  manageTokenDeduction,
  manageTokenInfomation,
  manageTokenPermission,
} from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_CONTRACT_ID,
  MOCK_TOKEN_ADDRESS,
  MOCK_SIGNER_ADDRESS,
  MOCK_HEDERA_NETWORK,
} from '../../../utils/common/constants';

describe('TokenManagementContract test suite', () => {
  // mock states
  const responseCode = 22;
  const AUTO_RENEW_SECOND = 0;
  const NEW_AUTO_RENEW_PERIOD = 7999900;
  const accountAddress = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const MOCK_TOKEN_ADDRESSES = [
    '0x00000000000000000000000000000000000084b7',
    '0x00000000000000000000000000000000000084b8',
    '0x00000000000000000000000000000000000084b9',
  ];

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

  // mock inputKeys with ICommonKeyObject[] type
  const tokenKeys: ICommonKeyObject[] = [
    {
      keyType: 'ADMIN',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'KYC',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'FREEZE',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'WIPE',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'SUPPLY',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'FEE',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
    },
    {
      keyType: 'PAUSE',
      keyValueType: 'contractId',
      keyValue: MOCK_CONTRACT_ID,
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
      hash: MOCK_TX_HASH,
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_INFO',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        tokenInfo
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_INFO" then return error if tokenInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_INFO',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined
      );

      expect(txRes.err).toBe('Token information object is needed for UPDATE_INFO API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "UPDATE_EXPIRY" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_EXPIRY',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined,
        tokenExpiry
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_EXPIRY" then return error if expiryInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_EXPIRY',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_KEYS',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined,
        undefined,
        tokenKeys
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "UPDATE_KEYS" then return error if keysInfo is missing', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_KEYS',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Keys information object is needed for UPDATE_KEYS API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation then return an error if MOCK_TOKEN_ADDRESS is not valid success response code and a transaction hash', async () => {
      const txRes = await manageTokenInfomation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UPDATE_KEYS',
        '0xabc',
        MOCK_GAS_LIMIT,
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVED_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
        200
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "APPROVED_FUNGIBLE" then return an error if amountToApprove is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVED_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
        undefined
      );

      expect(txRes.err).toBe('A valid amount is needed for the APPROVED_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation with API === "APPROVED_NON_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVED_NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
        undefined,
        20
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "APPROVED_NON_FUNGIBLE" then return an error if serialNumber is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVED_NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SET_APPROVAL',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
        undefined,
        undefined,
        true
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenInfomation with API === "SET_APPROVAL" then return an error if approvedStatus is missing ', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SET_APPROVAL',
        MOCK_TOKEN_ADDRESS,
        accountAddress,
        MOCK_GAS_LIMIT,
        undefined,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Approved status is needed for SET_APPROVAL API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenInfomation then return error if MOCK_TOKEN_ADDRESS is invalid', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SET_APPROVAL',
        '0xabc',
        accountAddress,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
    it('should execute manageTokenInfomation then return error if targetApproveAddress is invalid', async () => {
      const txRes = await manageTokenPermission(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SET_APPROVAL',
        MOCK_TOKEN_ADDRESS,
        '0xabc',
        MOCK_GAS_LIMIT
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'PAUSE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenStatus with API === "UNPAUSE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenStatus(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UNPAUSE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenStatus then return error if MOCK_TOKEN_ADDRESS is invalid', async () => {
      const txRes = await manageTokenStatus(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'PAUSE',
        '0xabc',
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenRelation test suite', () => {
    it('should execute manageTokenRelation with API === "REVOKE_KYC" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'REVOKE_KYC',
        accountAddress,
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenRelation with API === "FREEZE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FREEZE',
        accountAddress,
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });
    it('should execute manageTokenRelation with API === "UNFREEZE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'UNFREEZE',
        accountAddress,
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });
    it('should execute manageTokenRelation with API === "DISSOCIATE_TOKEN" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DISSOCIATE_TOKEN',
        accountAddress,
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS,
        MOCK_TOKEN_ADDRESSES
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenRelation then return error if accountAddress is invalid', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'REVOKE_KYC',
        '0xabc',
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS
      );

      expect(txRes.err).toBe('Invalid account address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenRelation then return error if MOCK_TOKEN_ADDRESSES contains an invalid token address', async () => {
      const txRes = await manageTokenRelation(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'REVOKE_KYC',
        accountAddress,
        MOCK_GAS_LIMIT,
        MOCK_TOKEN_ADDRESS,
        [MOCK_TOKEN_ADDRESS, '0xabc']
      );

      expect(txRes.err).toBe('Invalid token addresses');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('manageTokenDeduction test suite', () => {
    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        accountAddress,
        120
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return an error if accountAddress is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Account address is needed for WIPE_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_FUNGIBLE" then return an error if amount is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        accountAddress
      );

      expect(txRes.err).toBe('Amount is needed for WIPE_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        accountAddress,
        undefined,
        [120]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return an error if accountAddress is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Account address is needed for WIPE_NON_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "WIPE_NON_FUNGIBLE" then return an error if serialNumber is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'WIPE_NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        accountAddress
      );

      expect(txRes.err).toBe('Serial number is needed for WIPE_NON_FUNGIBLE API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "BURN" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'BURN',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined,
        120,
        [120]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenDeduction with API === "BURN" then return an error if amount is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'BURN',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        accountAddress
      );

      expect(txRes.err).toBe('Amount/serial number is needed for BURN API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "BURN" then return an error if serialNumber is missing', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'BURN',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        undefined,
        undefined
      );

      expect(txRes.err).toBe('Amount/serial number is needed for BURN API');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction with API === "DELETE" then return a success response code and a transaction hash', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DELETE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute manageTokenDeduction then return error if MOCK_TOKEN_ADDRESS is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DELETE',
        '0xabc',
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction then return error if accountAddress is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DELETE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
        '0xabc'
      );

      expect(txRes.err).toBe('Invalid account address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute manageTokenDeduction then return error if amount is invalid', async () => {
      const txRes = await manageTokenDeduction(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DELETE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'DELETE',
        MOCK_TOKEN_ADDRESS,
        MOCK_GAS_LIMIT,
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
