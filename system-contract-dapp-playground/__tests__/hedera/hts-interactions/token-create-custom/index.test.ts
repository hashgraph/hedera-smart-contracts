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
  mintHederaToken,
  grantTokenKYCToAccount,
  mintHederaTokenToAddress,
  createHederaFungibleToken,
  createHederaNonFungibleToken,
  associateHederaTokensToAccounts,
} from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_TOKEN_ADDRESS,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../../utils/common/constants';

describe('createHederaFungibleToken test suite', () => {
  // mock states
  const decimals = 8;
  const tokenSymbol = 'WHBAR';
  const returnedResult = true;
  const tokenName = 'WrappedHbar';
  const tokenMemo = 'Wrapped Hbar';
  const freezeDefaultStatus = false;
  const maxSupply = 30000000000; // 300 WHBAR
  const initialSupply = 900000000; // 9 WHBAR
  const metadata = ['Zeus', 'Athena', 'Apollo'];
  const msgValue = '20000000000000000000'; // 20 hbar
  const feeAmount = 1000; // 20 hbar
  const recipient = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const contractId = '0xbdcdf69052c9fc01e38377d05cc83c28ee43f24a';
  const feeTokenAddress = '0x00000000000000000000000000000000000006Ab';
  const associtingAccount = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const grantingKYCAccount = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const returnedTokenAddress = '0x00000000000000000000000000000000000000000000000000000000000084b7';

  const mockResolvedValue = {
    wait: jest.fn().mockResolvedValue({
      logs: [
        {
          fragment: {
            name: 'CreatedToken',
          },
          data: returnedTokenAddress,
        },
        {
          fragment: {
            name: 'ResponseCode',
          },
          data: '0x0016',
        },
      ],
      hash: MOCK_TX_HASH,
    }),
  };

  // mock baseContract object
  const baseContract = {
    mintTokenPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    grantTokenKycPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    associateTokenPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    associateTokensPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    mintTokenToAddressPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    createFungibleTokenPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    createNonFungibleTokenPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    mintNonFungibleTokenToAddressPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    createFungibleTokenWithCustomFeesPublic: jest.fn().mockResolvedValue(mockResolvedValue),
    createNonFungibleTokenWithCustomFeesPublic: jest.fn().mockResolvedValue(mockResolvedValue),
  };

  // mock inputKeys with ICommonKeyObject[] type
  const inputKeys: ICommonKeyObject[] = [
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

  describe('createHederaFungibleToken', () => {
    it('should execute createHederaFungibleToken then a token address and transaction hash', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should execute createFungibleTokenWithCustomFeesPublic then a token address and transaction hash', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue,
        feeTokenAddress,
        feeAmount
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should execute createHederaFungibleToken and return error if initialTotalSupply is invalid', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        -3,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('initial total supply cannot be negative');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if maxSupply is invalid', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        -3,
        decimals,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('max supply cannot be negative');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if decimals is invalid', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        -3,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('decimals cannot be negative');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if treasury address does not match public address standard', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        '0xabc',
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('invalid treasury address');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if fee token address does not match public address standard', async () => {
      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        contractId,
        inputKeys,
        msgValue,
        '0xabc'
      );

      expect(txRes.err).toBe('invalid fee token address');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if inputKeys is invalid ', async () => {
      const failedKeys: ICommonKeyObject[] = [
        {
          keyType: 'ADMIN',
          keyValueType: 'contractId',
          keyValue: '0xabc', // invalid
        },
        {
          keyType: 'KYC',
          keyValueType: 'contractId',
          keyValue: contractId,
        },
        {
          keyType: 'FREEZE',
          keyValueType: 'ECDSA_secp256k1',
          keyValue: '0x02bc', // invalid
        },
      ];

      const txRes = await createHederaFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        contractId,
        failedKeys,
        msgValue
      );

      expect(txRes.err.length).toBe(2);

      expect(txRes.err[0].keyType).toBe('ADMIN');
      expect(txRes.err[0].keyValueType).toBe('contractId');
      expect(txRes.err[0].keyValue).toBe('0xabc');
      expect(txRes.err[0].err).toBe('Invalid key value');

      expect(txRes.err[1].keyType).toBe('FREEZE');
      expect(txRes.err[1].keyValueType).toBe('ECDSA_secp256k1');
      expect(txRes.err[1].keyValue).toBe('0x02bc');
      expect(txRes.err[1].err).toBe('Invalid key value');

      expect(txRes.tokenAddress).toBeNull;
    });
  });

  describe('createHederaNonFungibleToken', () => {
    it('should execute createHederaNonFungibleToken then a token address and transaction hash', async () => {
      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should execute createFungibleTokenWithCustomFeesPublic then a token address and transaction hash', async () => {
      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        inputKeys,
        msgValue,
        feeTokenAddress,
        feeAmount
      );

      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
      expect(txRes.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
    });

    it('should execute createHederaNonFungibleToken and return error if maxSupply is invalid', async () => {
      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        -3,
        contractId,
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('max supply cannot be negative');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if treasury address does not match public address standard', async () => {
      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        '0xabc',
        inputKeys,
        msgValue
      );

      expect(txRes.err).toBe('invalid treasury address');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if fee token address does not match public address standard', async () => {
      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        inputKeys,
        msgValue,
        '0xabc'
      );

      expect(txRes.err).toBe('invalid fee token address');
      expect(txRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if inputKeys is invalid ', async () => {
      const failedKeys: ICommonKeyObject[] = [
        {
          keyType: 'ADMIN',
          keyValueType: 'contractId',
          keyValue: '0xabc', // invalid
        },
        {
          keyType: 'KYC',
          keyValueType: 'contractId',
          keyValue: contractId,
        },
        {
          keyType: 'FREEZE',
          keyValueType: 'ECDSA_secp256k1',
          keyValue: '0x02bc', // invalid
        },
      ];

      const txRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        failedKeys,
        msgValue
      );

      expect(txRes.err.length).toBe(2);

      expect(txRes.err[0].keyType).toBe('ADMIN');
      expect(txRes.err[0].keyValueType).toBe('contractId');
      expect(txRes.err[0].keyValue).toBe('0xabc');
      expect(txRes.err[0].err).toBe('Invalid key value');

      expect(txRes.err[1].keyType).toBe('FREEZE');
      expect(txRes.err[1].keyValueType).toBe('ECDSA_secp256k1');
      expect(txRes.err[1].keyValue).toBe('0x02bc');
      expect(txRes.err[1].err).toBe('Invalid key value');

      expect(txRes.tokenAddress).toBeNull;
    });
  });

  describe('mintHederaToken', () => {
    it('should execute mintTokenPublic to mint a FUNGIBLE token then return a transaction hash', async () => {
      const txRes = await mintHederaToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        1200,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(returnedResult);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute mintTokenPublic to mint a NON-FUNGIBLE token then return a transaction hash', async () => {
      const txRes = await mintHederaToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        0,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(returnedResult);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute mintTokenPublic to mint a Hedera token and return error when the hederaTokenAddress is invalid', async () => {
      const txRes = await mintHederaToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        '0xabc',
        1200,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('invalid Hedera token address');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });

    it('should execute mintTokenPublic to mint a FUNGIBLE token and return error when the amount to mint is a negative number', async () => {
      const txRes = await mintHederaToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        -1,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('amount to mint cannot be negative when minting a fungible token');
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute mintTokenPublic to mint a NON-FUNGIBLE token and return error when the amount to mint is a non-zero number', async () => {
      const txRes = await mintHederaToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        1,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('amount to mint must be 0 when minting a non-fungible token');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });
  });

  describe('mintHederaTokenToAddress', () => {
    it('should execute mintHederaTokenToAddress to mint a FUNGIBLE token and transfer it to the recipient then return a transaction hash', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        recipient,
        1200,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(returnedResult);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute mintHederaTokenToAddress to mint a NON-FUNGIBLE token and transfer it to the recipient then return a transaction hash', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        recipient,
        0,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(returnedResult);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute mintHederaTokenToAddress to mint a Hedera token and transfer it to the recipient then return error when the hederaTokenAddress is invalid', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        '0xabc',
        recipient,
        1200,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('invalid Hedera token address');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });

    it('should execute mintHederaTokenToAddress to mint a Hedera token and transfer it to the recipient then return error when the recipientAddress is invalid', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        '0xabc',
        1200,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('invalid recipient address');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });

    it('should execute mintHederaTokenToAddress to mint a FUNGIBLE token and transfer it to the recipient then return error when the amount to mint is a negative number', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        recipient,
        -1,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('amount to mint cannot be negative when minting a fungible token');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });

    it('should execute mintHederaTokenToAddress to mint a NON-FUNGIBLE token and transfer it to the recipient then return error when the amount to mint is a non-zero number', async () => {
      const txRes = await mintHederaTokenToAddress(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NON_FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        recipient,
        1,
        metadata,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('amount to mint must be 0 when minting a non-fungible token');
      expect(txRes.transactionHash).toBeNull;
      expect(txRes.result).toBeNull;
    });
  });

  describe('associateHederaTokensToAccounts', () => {
    it('should execute associateHederaTokensToAccounts to associate a token to an account then return a transaction hash', async () => {
      const txRes = await associateHederaTokensToAccounts(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        [MOCK_TOKEN_ADDRESS],
        associtingAccount,
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute associateHederaTokensToAccounts to associate a list of tokens to an account then return a transaction hash', async () => {
      const txRes = await associateHederaTokensToAccounts(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        [MOCK_TOKEN_ADDRESS, feeTokenAddress],
        associtingAccount,
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute associateHederaTokensToAccounts and return an error when the hederaTokenAddresses array is empty', async () => {
      const txRes = await associateHederaTokensToAccounts(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        [],
        associtingAccount,
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBe('must have at least one token address to associate');
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute associateHederaTokensToAccounts and return an error when the associtingAccountAddress is invalid', async () => {
      const txRes = await associateHederaTokensToAccounts(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        [MOCK_TOKEN_ADDRESS, feeTokenAddress],
        '0xabc',
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBe('associating account address is invalid');
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute associateHederaTokensToAccounts and return an error when the hederaTokenAddresses array contains invalid token addresses', async () => {
      const invalidTokenAddress = '0xaac';
      const txRes = await associateHederaTokensToAccounts(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        [MOCK_TOKEN_ADDRESS, invalidTokenAddress],
        associtingAccount,
        MOCK_GAS_LIMIT
      );

      expect((txRes.err as any).invalidTokens).toStrictEqual([invalidTokenAddress]);
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('grantTokenKYCToAccount', () => {
    it('should execute grantTokenKYCToAccount to associate a token KYC to an account then return a transaction hash', async () => {
      const txRes = await grantTokenKYCToAccount(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        grantingKYCAccount,
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBeNull;
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute grantTokenKYCToAccount to associate a token KYC to an account then return error when hederaTokenAddress is invalid', async () => {
      const txRes = await grantTokenKYCToAccount(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        '0xabc',
        grantingKYCAccount,
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBe('invalid Hedera token address');
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute grantTokenKYCToAccount to associate a token KYC to an account then return error when grantingKYCAccountAddress is invalid', async () => {
      const txRes = await grantTokenKYCToAccount(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        '0xabc',
        MOCK_GAS_LIMIT
      );
      expect(txRes.err).toBe('invalid associating account address');
      expect(txRes.transactionHash).toBeNull;
    });
  });
});
