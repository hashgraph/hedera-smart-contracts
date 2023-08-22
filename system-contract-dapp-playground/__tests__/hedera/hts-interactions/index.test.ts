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
  createHederaFungibleToken,
  createHederaNonFungibleToken,
} from '@/api/hedera/tokenCreateCustom-interactions';
import { Contract } from 'ethers';

describe('createHederaFungibleToken test suite', () => {
  // mock states
  const contractId = '0xbdcdf69052c9fc01e38377d05cc83c28ee43f24a';
  const tokenAddress = '0x00000000000000000000000000000000000084b7';
  const feeTokenAddress = '0x00000000000000000000000000000000000006Ab';
  const txHash = '0x63424020a69bf46a0669f46dd66addba741b9c02d37fab1686428f5209bc759d';
  const returnedTokenAddress = '0x00000000000000000000000000000000000000000000000000000000000084b7';
  const tokenName = 'WrappedHbar';
  const tokenSymbol = 'WHBAR';
  const tokenMemo = 'Wrapped Hbar';
  const initialSupply = 900000000; // 9 WHBAR
  const maxSupply = 30000000000; // 300 WHBAR
  const decimals = 8;
  const freezeDefaultStatus = false;
  const msgValue = '20000000000000000000'; // 20 hbar

  // mock baseContract object
  const baseContract = {
    createFungibleTokenPublic: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: 'CreatedToken',
            },
            data: returnedTokenAddress,
          },
        ],
        hash: txHash,
      }),
    }),
    createFungibleTokenWithCustomFeesPublic: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: 'CreatedToken',
            },
            data: returnedTokenAddress,
          },
        ],
        hash: txHash,
      }),
    }),
    createNonFungibleTokenPublic: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: 'CreatedToken',
            },
            data: returnedTokenAddress,
          },
        ],
        hash: txHash,
      }),
    }),
    createNonFungibleTokenWithCustomFeesPublic: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: 'CreatedToken',
            },
            data: returnedTokenAddress,
          },
        ],
        hash: txHash,
      }),
    }),
  };

  // mock inputKeys with CommonKeyObject[] type
  const inputKeys: CommonKeyObject[] = [
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
    it('should execute createHederaFungibleToken and return a token address', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBeNull;
      expect(tokenCreateRes.transactionHash).toBe(txHash);
      expect(tokenCreateRes.tokenAddress).toBe(tokenAddress);
    });

    it('should execute createFungibleTokenWithCustomFeesPublic and return a token address', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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
        feeTokenAddress
      );

      expect(tokenCreateRes.err).toBeNull;
      expect(tokenCreateRes.transactionHash).toBe(txHash);
      expect(tokenCreateRes.tokenAddress).toBe(tokenAddress);
    });

    it('should execute createHederaFungibleToken and return error if initialTotalSupply is invalid', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBe('initial total supply cannot be negative');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if maxSupply is invalid', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBe('max supply cannot be negative');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if decimals is invalid', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBe('decimals cannot be negative');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if treasury address does not match public address standard', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBe('invalid treasury address');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if fee token address does not match public address standard', async () => {
      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err).toBe('invalid fee token address');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaFungibleToken and return error if inputKeys is invalid ', async () => {
      const failedKeys: CommonKeyObject[] = [
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

      const tokenCreateRes = await createHederaFungibleToken(
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

      expect(tokenCreateRes.err.length).toBe(2);

      expect(tokenCreateRes.err[0].keyType).toBe('ADMIN');
      expect(tokenCreateRes.err[0].keyValueType).toBe('contractId');
      expect(tokenCreateRes.err[0].keyValue).toBe('0xabc');
      expect(tokenCreateRes.err[0].err).toBe('Invalid key value');

      expect(tokenCreateRes.err[1].keyType).toBe('FREEZE');
      expect(tokenCreateRes.err[1].keyValueType).toBe('ECDSA_secp256k1');
      expect(tokenCreateRes.err[1].keyValue).toBe('0x02bc');
      expect(tokenCreateRes.err[1].err).toBe('Invalid key value');

      expect(tokenCreateRes.tokenAddress).toBeNull;
    });
  });

  describe('createHederaNonFungibleToken', () => {
    it('should execute createHederaNonFungibleToken and return a token address', async () => {
      const tokenCreateRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        inputKeys,
        msgValue
      );

      expect(tokenCreateRes.err).toBeNull;
      expect(tokenCreateRes.transactionHash).toBe(txHash);
      expect(tokenCreateRes.tokenAddress).toBe(tokenAddress);
    });

    it('should execute createFungibleTokenWithCustomFeesPublic and return a token address', async () => {
      const tokenCreateRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        inputKeys,
        msgValue,
        feeTokenAddress
      );

      expect(tokenCreateRes.err).toBeNull;
      expect(tokenCreateRes.transactionHash).toBe(txHash);
      expect(tokenCreateRes.tokenAddress).toBe(tokenAddress);
    });

    it('should execute createHederaNonFungibleToken and return error if maxSupply is invalid', async () => {
      const tokenCreateRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        -3,
        contractId,
        inputKeys,
        msgValue
      );

      expect(tokenCreateRes.err).toBe('max supply cannot be negative');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if treasury address does not match public address standard', async () => {
      const tokenCreateRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        '0xabc',
        inputKeys,
        msgValue
      );

      expect(tokenCreateRes.err).toBe('invalid treasury address');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if fee token address does not match public address standard', async () => {
      const tokenCreateRes = await createHederaNonFungibleToken(
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

      expect(tokenCreateRes.err).toBe('invalid fee token address');
      expect(tokenCreateRes.tokenAddress).toBeNull;
    });

    it('should execute createHederaNonFungibleToken and return error if inputKeys is invalid ', async () => {
      const failedKeys: CommonKeyObject[] = [
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

      const tokenCreateRes = await createHederaNonFungibleToken(
        baseContract as unknown as Contract,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        contractId,
        failedKeys,
        msgValue
      );

      expect(tokenCreateRes.err.length).toBe(2);

      expect(tokenCreateRes.err[0].keyType).toBe('ADMIN');
      expect(tokenCreateRes.err[0].keyValueType).toBe('contractId');
      expect(tokenCreateRes.err[0].keyValue).toBe('0xabc');
      expect(tokenCreateRes.err[0].err).toBe('Invalid key value');

      expect(tokenCreateRes.err[1].keyType).toBe('FREEZE');
      expect(tokenCreateRes.err[1].keyValueType).toBe('ECDSA_secp256k1');
      expect(tokenCreateRes.err[1].keyValue).toBe('0x02bc');
      expect(tokenCreateRes.err[1].err).toBe('Invalid key value');

      expect(tokenCreateRes.tokenAddress).toBeNull;
    });
  });
});
