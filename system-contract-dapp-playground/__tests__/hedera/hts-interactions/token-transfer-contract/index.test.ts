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
  transferCrypto,
  transferFungibleTokens,
  transferNonFungibleTokens,
  transferSingleToken,
  transferSingleTokenFrom,
} from '@/api/hedera/tokenTransfer-interactions';
import {
  IHederaTokenServiceTokenTransferList,
  IHederaTokenServiceTransferList,
} from '@/types/contract-interactions/HTS';
import { Contract } from 'ethers';

describe('TokenTransferContract test suite', () => {
  const responseCode = 22;
  const gasLimit = 1000000;
  const invalidSender = '0xabc';
  const senderA = '0xDd7fCb7c2ee96A79B1e201d25F5E43d6a0cED5e6';
  const senderB = '0x0851072d7bB726305032Eff23CB8fd22eB74c85B';
  const receiverA = '0x7a35433804d8Cd070d98d66C6E9b45c6C32C3CDD';
  const receiverB = '0x9de0881b3110aA8cAD1dF3182B1eB6F14d1608a2';
  const hederaTokenAddress = '0x00000000000000000000000000000000000084b7';
  const txHash = '0x63424020a69bf46a0669f46dd66addba741b9c02d37fab1686428f5209bc759d';

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
    cryptoTransferPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferTokensPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferNFTsPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferTokenPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferNFTPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferFromPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
    transferFromNFTPublic: jest.fn().mockResolvedValue(contractMockedResolvedValue),
  };

  describe('transferCrypto test suite', () => {
    // prepare transferList:IHederaTokenServiceTransferList param
    const transfers = [
      {
        accountID: senderA,
        amount: 369,
        isApproval: true,
      },
    ];
    const transferList: IHederaTokenServiceTransferList = {
      transfers,
    };

    // prepare tokenTransferList: IHederaTokenServiceTokenTransferList
    const nftTransfers = [
      {
        senderAccountID: senderA,
        receiverAccountID: receiverA,
        serialNumber: 3,
        isApproval: false,
      },
    ];
    const tokenTransferList: IHederaTokenServiceTokenTransferList[] = [
      {
        token: hederaTokenAddress,
        transfers,
        nftTransfers,
      },
    ];

    it('should execute transferCrypto then return a successful response code', async () => {
      const txRes = await transferCrypto(
        baseContract as unknown as Contract,
        transferList,
        tokenTransferList,
        gasLimit
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });
  });

  describe('transferFungibleTokens test suite', () => {
    it('should execute transferFungibleTokens then return a successful response code', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, senderB],
        [3, 6, 9]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferFungibleTokens with an invalid token address then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        '0xabc',
        [senderA, senderB],
        [3, 6, 9]
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferFungibleTokens with an invalid sender ID then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, '0xabc'],
        [3, 6, 9]
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferFungibleTokens with an invalid amount then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, senderB],
        [-3, 6, 9]
      );

      expect(txRes.err).toBe(`-3 is an invalid amount`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('transferNonFungibleTokens test suite', () => {
    it('should execute transferNonFungibleTokens then return a successful response code', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, senderB],
        [receiverA, receiverB],
        [3, 6, 9]
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferNonFungibleTokens with an invalid token address then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        '0xabc',
        [senderA, senderB],
        [receiverA, receiverB],
        [3, 6, 9]
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid sender ID then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, '0xabc'],
        [receiverA, receiverB],
        [3, 6, 9]
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid sender accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid receiver ID then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, senderB],
        [receiverA, '0xabc'],
        [3, 6, 9]
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid receiver accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid amount then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        hederaTokenAddress,
        [senderA, senderB],
        [receiverA, receiverB],
        [-3, 6, 9]
      );

      expect(txRes.err).toBe(`-3 is an invalid serial number`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('transferSingleToken test suite', () => {
    it('should execute transferSingleToken with API === "FUNGIBLE" then return a successful response code', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverA,
        369,
        gasLimit
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferSingleToken with API === "NON_FUNGIBLE" then return a successful response code', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'NON_FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverA,
        369,
        gasLimit
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferSingleToken with an invalid token address then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        '0xabc',
        senderA,
        receiverA,
        369,
        gasLimit
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid sender accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        '0xabc',
        receiverA,
        369,
        gasLimit
      );

      expect(txRes.err).toBe('Invalid sender address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid receiver accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        '0xabc',
        369,
        gasLimit
      );

      expect(txRes.err).toBe('Invalid receiver address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid quantity then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverB,
        -369,
        gasLimit
      );

      expect(txRes.err).toBe('Invalid quantity');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('transferSingleTokenFrom test suite', () => {
    it('should execute transferSingleTokenFrom with API === "FUNGIBLE" then return a successful response code', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverA,
        369
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferSingleTokenFrom with API === "NON_FUNGIBLE" then return a successful response code', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'NON_FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverA,
        369
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(txHash);
    });

    it('should execute transferSingleTokenFrom with an invalid token address then return an error', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        '0xabc',
        senderA,
        receiverA,
        369
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid sender accountID then return an error', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        '0xabc',
        receiverA,
        369
      );

      expect(txRes.err).toBe('Invalid sender address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid receiver accountID then return an error', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        '0xabc',
        369
      );

      expect(txRes.err).toBe('Invalid receiver address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid quantity then return an error', async () => {
      const txRes = await transferSingleTokenFrom(
        baseContract as unknown as Contract,
        'FUNGIBLE',
        hederaTokenAddress,
        senderA,
        receiverB,
        -369
      );

      expect(txRes.err).toBe('Invalid quantity');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });
});
