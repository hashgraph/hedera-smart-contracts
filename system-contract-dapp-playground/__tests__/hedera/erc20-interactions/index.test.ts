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
  balanceOf,
  erc20Mint,
  erc20Transfers,
  getERC20TokenInformation,
  handleErc20TokenPermissions,
} from '@/api/hedera/erc20-interactions';
import { Contract } from 'ethers';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../utils/common/constants';

describe('getERC20TokenInformation', () => {
  const expectedSymbol = 'TKN';
  const expectedDecimals = '18';
  const expectedName = 'TokenName';
  const expectedTotalSupply = '1000000';

  // Mock baseContract object
  const baseContract = {
    name: jest.fn().mockResolvedValue(expectedName),
    symbol: jest.fn().mockResolvedValue(expectedSymbol),
    totalSupply: jest.fn().mockResolvedValue(expectedTotalSupply),
    decimals: jest.fn().mockResolvedValue(expectedDecimals),
  };

  it('should execute name()', async () => {
    const res = await getERC20TokenInformation(baseContract as unknown as Contract, 'name');

    // assertion
    expect(res.err).toBeNull;
    expect(getERC20TokenInformation).toBeCalled;
    expect(res.name).toBe(expectedName);
  });

  it('should execute symbol()', async () => {
    const res = await getERC20TokenInformation(baseContract as unknown as Contract, 'symbol');

    // assertion
    expect(res.err).toBeNull;
    expect(getERC20TokenInformation).toBeCalled;
    expect(res.symbol).toBe(expectedSymbol);
  });
  it('should execute totalSupply()', async () => {
    const res = await getERC20TokenInformation(baseContract as unknown as Contract, 'totalSupply');

    // assertion
    expect(res.err).toBeNull;
    expect(getERC20TokenInformation).toBeCalled;
    expect(res.totalSupply).toBe(expectedTotalSupply);
  });
  it('should execute decimals()', async () => {
    const res = await getERC20TokenInformation(baseContract as unknown as Contract, 'decimals');

    // assertion
    expect(res.err).toBeNull;
    expect(getERC20TokenInformation).toBeCalled;
    expect(res.decimals).toBe(expectedDecimals);
  });
});

describe('erc20Mint', () => {
  // Mock baseContract object
  const baseContract = {
    mint: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        hash: MOCK_TX_HASH,
      }),
    }),
  };

  it('should execute erc20Mint', async () => {
    const res = await erc20Mint(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      120,
      MOCK_GAS_LIMIT
    );

    // assertion
    expect(res.err).toBeNull;
    expect(erc20Mint).toBeCalled;
    expect(res.mintRes).toBe(true);
    expect(res.txHash).toBe(MOCK_TX_HASH);
  });

  it('should failed with invalid recipient address', async () => {
    const res = await erc20Mint(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      '0xabc',
      120,
      MOCK_GAS_LIMIT
    );
    // assertion
    expect(res.err).toBe('Invalid recipient address');
    expect(erc20Mint).toBeCalled;
    expect(res.mintRes).toBeNull;
  });

  it('should failed with invalid token amount', async () => {
    const res = await erc20Mint(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      -120,
      MOCK_GAS_LIMIT
    );
    // assertion
    expect(res.err).toBe('Invalid token amount');
    expect(erc20Mint).toBeCalled;
    expect(res.mintRes).toBeNull;
  });
});

describe('balanceOf', () => {
  const baseContract = {
    balanceOf: jest.fn().mockResolvedValue('120'),
  };

  it('should execute balanceOf', async () => {
    const balanceOfRes = await balanceOf(
      baseContract as unknown as Contract,
      '0x7a575266b2020e262e9b1ad4eba3014d63630095'
    );

    // assertion
    expect(balanceOfRes.err).toBeNull;
    expect(balanceOfRes.balanceOfRes).toBe('120');
    expect(balanceOf).toBeCalled;
  });

  it('should fail with Invalid account address', async () => {
    const balanceOfRes = await balanceOf(baseContract as unknown as Contract, '0x3619');

    // assertion
    expect(balanceOfRes.err).toBe('Invalid account address');
    expect(balanceOfRes.balanceOfRes).toBeNull;
    expect(balanceOf).toBeCalled;
  });
});

describe('Token Permissions', () => {
  const mockedValue = jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue({
      hash: MOCK_TX_HASH,
    }),
  });

  const baseContract = {
    approve: mockedValue,
    increaseAllowance: mockedValue,
    decreaseAllowance: mockedValue,
    allowance: jest.fn().mockResolvedValue('120'),
  };

  it('should execute erc20Approve', async () => {
    const approveRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'approve',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(approveRes.err).toBeNull;
    expect(approveRes.txHash).toBe(MOCK_TX_HASH);
    expect(approveRes.approveRes).toBe(true);
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20Approve with Invalid spender address', async () => {
    const approveRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'approve',
      '0x3619',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(approveRes.err).toBe('Invalid spender address');
    expect(approveRes.approveRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should execute erc20IncreaseAllowance', async () => {
    const increaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'increaseAllowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(increaseAllowanceRes.err).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
    expect(increaseAllowanceRes.txHash).toBe(MOCK_TX_HASH);
    expect(increaseAllowanceRes.increaseAllowanceRes).toBe(true);
  });

  it('should fail erc20IncreaseAllowance with Invalid spender address', async () => {
    const increaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'increaseAllowance',
      '0x3619',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(increaseAllowanceRes.err).toBe('Invalid spender address');
    expect(increaseAllowanceRes.increaseAllowanceRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should execute erc20DecreaseAllowance', async () => {
    const decreaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'decreaseAllowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(decreaseAllowanceRes.err).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
    expect(decreaseAllowanceRes.txHash).toBe(MOCK_TX_HASH);
    expect(decreaseAllowanceRes.decreaseAllowanceRes).toBe(true);
  });

  it('should fail erc20DecreaseAllowance with Invalid spender address', async () => {
    const decreaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'decreaseAllowance',
      '0x3619',
      MOCK_GAS_LIMIT,
      '',
      120
    );

    // assertion
    expect(handleErc20TokenPermissions).toBeCalled;
    expect(decreaseAllowanceRes.err).toBe('Invalid spender address');
    expect(decreaseAllowanceRes.decreaseAllowanceRes).toBeNull;
  });

  it('should execute erc20Allowance', async () => {
    const allowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'allowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      MOCK_GAS_LIMIT,
      '0x7a575266b2020e262e9b1ad4eba3014d63630012'
    );

    // assertion
    expect(allowanceRes.err).toBeNull;
    expect(allowanceRes.allowanceRes).toBe('120');
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20Allowance with Invalid owner address', async () => {
    const allowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'allowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630012',
      MOCK_GAS_LIMIT,
      '0x3619'
    );

    // assertion
    expect(allowanceRes.err).toBe('Invalid owner address');
    expect(allowanceRes.allowanceRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20Allowance with Invalid spender address', async () => {
    const allowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'allowance',
      '0x3619',
      MOCK_GAS_LIMIT,
      '0x7a575266b2020e262e9b1ad4eba3014d63630012'
    );

    // assertion
    expect(allowanceRes.err).toBe('Invalid spender address');
    expect(allowanceRes.allowanceRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });
});

describe('Transfer', () => {
  const mockedValue = jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue({
      hash: MOCK_TX_HASH,
    }),
  });

  const baseContract = {
    transfer: mockedValue,
    transferFrom: mockedValue,
  };

  it('should execute erc20Transfer', async () => {
    const transferRes = await erc20Transfers(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'transfer',
      '0x7a575266b2020e262e9b1ad4eba3014d63630012',
      120,
      MOCK_GAS_LIMIT
    );

    // assertion
    expect(balanceOf).toBeCalled;
    expect(transferRes.err).toBeNull;
    expect(transferRes.txHash).toBe(MOCK_TX_HASH);
    expect(transferRes.transferRes).toBe(true);
  });

  it('should fail erc20Transfer with Invalid recipient address', async () => {
    const transferRes = await erc20Transfers(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'transfer',
      '0x112c',
      120,
      MOCK_GAS_LIMIT
    );

    // assertion
    expect(transferRes.err).toBe('Invalid recipient address');
    expect(transferRes.transferRes).toBeNull;
    expect(balanceOf).toBeCalled;
  });

  it('should execute erc20TransferFrom', async () => {
    const transferFromRes = await erc20Transfers(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'transferFrom',
      '0x7a575266b2020e262e9b1ad4eba3014d63630022',
      120,
      MOCK_GAS_LIMIT,
      '0x7a575266b2020e262e9b1ad4eba3014d63630012'
    );

    // assertion
    expect(balanceOf).toBeCalled;
    expect(transferFromRes.err).toBeNull;
    expect(transferFromRes.txHash).toBe(MOCK_TX_HASH);
    expect(transferFromRes.transferFromRes).toBe(true);
  });

  it('should fail erc20TransferFrom with Invalid token owner address', async () => {
    const transferFromRes = await erc20Transfers(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'transferFrom',
      '0x7a575266b2020e262e9b1ad4eba3014d63630012',
      MOCK_GAS_LIMIT,
      120,
      '0x112c'
    );

    // assertion
    expect(transferFromRes.err).toBe('Invalid token owner address');
    expect(transferFromRes.transferFromRes).toBeNull;
    expect(balanceOf).toBeCalled;
  });

  it('should fail erc20TransferFrom with Invalid recipient address', async () => {
    const transferFromRes = await erc20Transfers(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'transferFrom',
      '0x112c',
      120,
      MOCK_GAS_LIMIT,
      '0x7a575266b2020e262e9b1ad4eba3014d63630012'
    );

    // assertion
    expect(transferFromRes.err).toBe('Invalid recipient address');
    expect(transferFromRes.transferFromRes).toBeNull;
    expect(balanceOf).toBeCalled;
  });
});
