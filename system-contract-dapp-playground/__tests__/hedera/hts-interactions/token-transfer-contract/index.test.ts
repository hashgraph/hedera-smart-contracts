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
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_RESPONSE_CODE,
  MOCK_TOKEN_ADDRESS,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../../utils/common/constants';
import {
  transferCrypto,
  transferSingleToken,
  transferFungibleTokens,
  transferNonFungibleTokens,
} from '@/api/hedera/hts-interactions/tokenTransfer-interactions';

describe('TokenTransferContract test suite', () => {
  const quantity = 369;
  const invalidSender = '0xabc';
  const nonFungibleAmounts = [3, 6, 9];
  const fungibleAmounts = [-18, 3, 6, 9];
  const senderA = '0xDd7fCb7c2ee96A79B1e201d25F5E43d6a0cED5e6';
  const senderB = '0x0851072d7bB726305032Eff23CB8fd22eB74c85B';
  const receiverA = '0x7a35433804d8Cd070d98d66C6E9b45c6C32C3CDD';
  const receiverB = '0x9de0881b3110aA8cAD1dF3182B1eB6F14d1608a2';

  const contractMockedResolvedValue = {
    wait: jest.fn().mockResolvedValue({
      logs: [
        {
          fragment: {
            name: 'ResponseCode',
          },
          data: MOCK_RESPONSE_CODE,
        },
      ],
      hash: MOCK_TX_HASH,
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
        token: MOCK_TOKEN_ADDRESS,
        transfers,
        nftTransfers,
      },
    ];

    it('should execute transferCrypto then return a successful response code', async () => {
      const txRes = await transferCrypto(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        transferList,
        tokenTransferList,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });
  });

  describe('transferFungibleTokens test suite', () => {
    it('should execute transferFungibleTokens then return a successful response code', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, senderB],
        fungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferFungibleTokens with an invalid token address then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        '0xabc',
        [senderA, senderB],
        fungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferFungibleTokens with an invalid sender ID then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, '0xabc'],
        fungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferFungibleTokens with an invalid amount then return an error', async () => {
      const txRes = await transferFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, senderB],
        [-9, -3, 6],
        MOCK_GAS_LIMIT
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, senderB],
        [receiverA, receiverB],
        nonFungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferNonFungibleTokens with an invalid token address then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        '0xabc',
        [senderA, senderB],
        [receiverA, receiverB],
        nonFungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid sender ID then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, '0xabc'],
        [receiverA, receiverB],
        nonFungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid sender accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid receiver ID then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, senderB],
        [receiverA, '0xabc'],
        nonFungibleAmounts,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe(`${invalidSender} is an invalid receiver accountID`);
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferNonFungibleTokens with an invalid amount then return an error', async () => {
      const txRes = await transferNonFungibleTokens(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        MOCK_TOKEN_ADDRESS,
        [senderA, senderB],
        [receiverA, receiverB],
        [-3, 6, 9],
        MOCK_GAS_LIMIT
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
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferSingleToken with API === "NFT" then return a successful response code', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NFT',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferSingleToken with an invalid token address then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        '0xabc',
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid sender accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        '0xabc',
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid sender address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid receiver accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        senderA,
        '0xabc',
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid receiver address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleToken with an invalid quantity then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverB,
        quantity * -1,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid quantity');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });

  describe('transferSingleTokenFrom test suite', () => {
    it('should execute transferSingleTokenFrom with API === "FUNGIBLE" then return a successful response code', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE_FROM',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferSingleTokenFrom with API === "NFT_FROM" then return a successful response code', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'NFT_FROM',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBeNull;
      expect(txRes.result).toBe(true);
      expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    });

    it('should execute transferSingleTokenFrom with an invalid token address then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE_FROM',
        '0xabc',
        senderA,
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid token address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid sender accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE_FROM',
        MOCK_TOKEN_ADDRESS,
        '0xabc',
        receiverA,
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid sender address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid receiver accountID then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE_FROM',
        MOCK_TOKEN_ADDRESS,
        senderA,
        '0xabc',
        quantity,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid receiver address');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });

    it('should execute transferSingleTokenFrom with an invalid quantity then return an error', async () => {
      const txRes = await transferSingleToken(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'FUNGIBLE_FROM',
        MOCK_TOKEN_ADDRESS,
        senderA,
        receiverB,
        quantity * -1,
        MOCK_GAS_LIMIT
      );

      expect(txRes.err).toBe('Invalid quantity');
      expect(txRes.result).toBeNull;
      expect(txRes.transactionHash).toBeNull;
    });
  });
});
