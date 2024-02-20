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
  erc721Mint,
  erc721OwnerOf,
  erc721TokenURI,
  erc721Transfers,
  erc721BalanceOf,
  erc721TokenApprove,
  erc721TokenApproval,
  getERC721TokenInformation,
} from '@/api/hedera/erc721-interactions';
import { Contract } from 'ethers';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../utils/common/constants';

describe('ERC721 test suite', () => {
  const tokenID = 369;
  const approvalStatus = true;
  const expectedSymbol = 'TKN';
  const expectedBalance = '120';
  const expectedName = 'TokenName';
  const expectedTokenURI = 'ipfs://bafyreih7a5ds4th3o';
  const recipient = '0x34810E139b451e0a4c67d5743E956Ac8990842A8';
  const tokenOwner = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';
  const spenderAddress = '0x05FbA803Be258049A27B820088bab1cAD2058871';
  const operatorAddress = '0x0851072d7bB726305032Eff23CB8fd22eB74c85B';

  const waitMockedObject = {
    wait: jest.fn().mockResolvedValue({
      hash: MOCK_TX_HASH,
    }),
  };

  // Mock baseContract object
  const baseContract = {
    name: jest.fn().mockResolvedValue(expectedName),
    symbol: jest.fn().mockResolvedValue(expectedSymbol),
    tokenURI: jest.fn().mockResolvedValue(expectedTokenURI),
    mint: jest.fn().mockResolvedValue(waitMockedObject),
    balanceOf: jest.fn().mockResolvedValue(expectedBalance),
    ownerOf: jest.fn().mockResolvedValue(tokenOwner),
    approve: jest.fn().mockResolvedValue(waitMockedObject),
    getApproved: jest.fn().mockResolvedValue(spenderAddress),
    setApprovalForAll: jest.fn().mockResolvedValue(waitMockedObject),
    isApprovedForAll: jest.fn().mockResolvedValue(approvalStatus),
    transferFrom: jest.fn().mockResolvedValue(waitMockedObject),
    ['safeTransferFrom(address,address,uint256,bytes)']: jest.fn().mockResolvedValue(waitMockedObject),
  };

  describe('getERC721TokenInformation', () => {
    it('should execute name()', async () => {
      const res = await getERC721TokenInformation(baseContract as unknown as Contract, 'name');

      // assertion
      expect(res.err).toBeNull;
      expect(res.name).toBe(expectedName);
      expect(getERC721TokenInformation).toBeCalled;
    });
    it('should execute symbol()', async () => {
      const res = await getERC721TokenInformation(baseContract as unknown as Contract, 'symbol');

      // assertion
      expect(res.err).toBeNull;
      expect(res.symbol).toBe(expectedSymbol);
      expect(getERC721TokenInformation).toBeCalled;
    });
  });

  describe('erc721TokenURI', () => {
    it('should execute erc721TokenURI()', async () => {
      const res = await erc721TokenURI(baseContract as unknown as Contract, tokenID);

      // assertion
      expect(res.err).toBeNull;
      expect(erc721TokenURI).toBeCalled;
      expect(res.tokenURI).toBe(expectedTokenURI);
    });

    it('should execute erc721TokenURI() and return an error if the tokenID is invalid', async () => {
      const res = await erc721TokenURI(baseContract as unknown as Contract, -3);

      // assertion
      expect(res.tokenURI).toBeNull;
      expect(erc721TokenURI).toBeCalled;
      expect(res.err).toBe('Invalid token amount');
    });
  });

  describe('erc721Mint', () => {
    it('should execute erc721Mint', async () => {
      const res = await erc721Mint(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        recipient,
        tokenID,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(erc721Mint).toBeCalled;
      expect(res.txHash).toBe(MOCK_TX_HASH);
    });

    it('should execute erc721Mint and return error if recipientAddress is invalid', async () => {
      const res = await erc721Mint(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        '0xabc',
        tokenID,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBe('Invalid recipient address');
      expect(erc721Mint).toBeCalled;
      expect(res.txHash).toBeNull;
    });

    it('should execute erc721Mint and return error if tokenID is invalid', async () => {
      const res = await erc721Mint(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        recipient,
        -3,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBe('Invalid token amount');
      expect(erc721Mint).toBeCalled;
      expect(res.txHash).toBeNull;
    });
  });

  describe('erc721BalanceOf', () => {
    it('should execute erc721BalanceOf', async () => {
      const res = await erc721BalanceOf(baseContract as unknown as Contract, tokenOwner);

      // assertion
      expect(res.err).toBeNull;
      expect(erc721BalanceOf).toBeCalled;
      expect(res.balanceOfRes).toBe(expectedBalance);
    });

    it('should execute erc721BalanceOf and return error if recipientAddress is invalid', async () => {
      const res = await erc721BalanceOf(baseContract as unknown as Contract, '0xabc');

      // assertion
      expect(res.err).toBe('Invalid account address');
      expect(erc721BalanceOf).toBeCalled;
      expect(res.txHash).toBeNull;
    });
  });

  describe('erc721OwnerOf', () => {
    it('should execute erc721OwnerOf', async () => {
      const res = await erc721OwnerOf(baseContract as unknown as Contract, tokenID);

      // assertion
      expect(res.err).toBeNull;
      expect(erc721OwnerOf).toBeCalled;
      expect(res.ownerOfRes).toBe(tokenOwner);
    });
  });

  describe('erc721TokenApprove', () => {
    it('should execute erc721TokenApprove with method === "APPROVE" and return a txHash', async () => {
      const res = await erc721TokenApprove(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVE',
        spenderAddress,
        tokenID,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(res.txHash).toBe(MOCK_TX_HASH);
      expect(erc721TokenApprove).toBeCalled;
    });

    it('should execute erc721TokenApprove with method === "GET_APPROVE" and return an approved account', async () => {
      const res = await erc721TokenApprove(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'GET_APPROVE',
        spenderAddress,
        tokenID,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(res.approvedAccountRes).toBe(spenderAddress);
      expect(erc721TokenApprove).toBeCalled;
    });

    it('should execute erc721TokenApprove and return an error if the spender address is invalid', async () => {
      const res = await erc721TokenApprove(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'APPROVE',
        '0xabc',
        tokenID,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNul;
      expect(erc721TokenApprove).toBeCalled;
      expect(res.approvedAccountRes).toBeNul;
      expect(res.err).toBe('Invalid account address');
    });
  });

  describe('erc721TokenApproval', () => {
    it('should execute erc721TokenApproval with method === "SET_APPROVAL" and return a txHash ', async () => {
      const res = await erc721TokenApproval(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SET_APPROVAL',
        tokenOwner,
        operatorAddress,
        approvalStatus,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(res.txHash).toBe(MOCK_TX_HASH);
      expect(erc721TokenApproval).toBeCalled;
    });

    it('should execute erc721TokenApproval with method === "IS_APPROVAL" and return the approval status', async () => {
      const res = await erc721TokenApproval(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_APPROVAL',
        tokenOwner,
        operatorAddress,
        approvalStatus,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(erc721TokenApproval).toBeCalled;
      expect(res.approvalStatusRes).toBe(approvalStatus);
    });

    it('should execute erc721TokenApproval and return error if tokenOwner is invalid', async () => {
      const res = await erc721TokenApproval(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_APPROVAL',
        '0xabc',
        operatorAddress,
        approvalStatus,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNull;
      expect(res.approvalStatusRes).toBeNull;
      expect(erc721TokenApproval).toBeCalled;
      expect(res.err).toBe('Invalid owner address');
    });

    it('should execute erc721TokenApproval and return error if operatorAddress is invalid', async () => {
      const res = await erc721TokenApproval(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'IS_APPROVAL',
        tokenOwner,
        '0xabc',
        approvalStatus,
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNull;
      expect(res.approvalStatusRes).toBeNull;
      expect(erc721TokenApproval).toBeCalled;
      expect(res.err).toBe('Invalid operator address');
    });
  });

  describe('erc721Transfers', () => {
    it('should execute erc721Transfers with method === "TRANSFER_FROM" and return a txHash ', async () => {
      const res = await erc721Transfers(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'TRANSFER_FROM',
        tokenOwner,
        recipient,
        tokenID,
        '',
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(res.txHash).toBe(MOCK_TX_HASH);
      expect(erc721Transfers).toBeCalled;
    });

    it('should execute erc721Transfers with method === "SAFE_TRANSFER_FROM" and return a txHash ', async () => {
      const res = await erc721Transfers(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SAFE_TRANSFER_FROM',
        tokenOwner,
        recipient,
        tokenID,
        '',
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.err).toBeNull;
      expect(res.txHash).toBe(MOCK_TX_HASH);
      expect(erc721Transfers).toBeCalled;
    });

    it('should execute erc721Transfers and return an error if senderAddress is invalid ', async () => {
      const res = await erc721Transfers(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SAFE_TRANSFER_FROM',
        '0xabc',
        recipient,
        tokenID,
        '',
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNull;
      expect(erc721Transfers).toBeCalled;
      expect(res.err).toBe('Invalid sender address');
    });

    it('should execute erc721Transfers and return an error if recipientAddress is invalid ', async () => {
      const res = await erc721Transfers(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SAFE_TRANSFER_FROM',
        tokenOwner,
        '0xabc',
        tokenID,
        '',
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNull;
      expect(erc721Transfers).toBeCalled;
      expect(res.err).toBe('Invalid recipient address');
    });

    it('should execute erc721Transfers and return an error if tokenID is invalid ', async () => {
      const res = await erc721Transfers(
        baseContract as unknown as Contract,
        MOCK_SIGNER_ADDRESS,
        MOCK_HEDERA_NETWORK,
        'SAFE_TRANSFER_FROM',
        tokenOwner,
        recipient,
        -3,
        '',
        MOCK_GAS_LIMIT
      );

      // assertion
      expect(res.txHash).toBeNull;
      expect(erc721Transfers).toBeCalled;
      expect(res.err).toBe('Invalid tokenId');
    });
  });
});
