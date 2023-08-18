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
  getERC20TokenInformation,
  handleErc20TokenPermissions,
} from '@/api/hedera/erc20-interactions';
import { Contract } from 'ethers';

describe('getERC20TokenInformation', () => {
  const expectedName = 'TokenName';
  const expectedSymbol = 'TKN';
  const expectedTotalSupply = '1000000';
  const expectedDecimals = '18';

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
    mint: jest.fn(),
  };

  it('should execute erc20Mint', async () => {
    const res = await erc20Mint(
      baseContract as unknown as Contract,
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      120
    );

    // assertion
    expect(res.err).toBeNull;
    expect(erc20Mint).toBeCalled;
    expect(res.mintRes).toBe(true);
  });

  it('should failed with invalid recipient address', async () => {
    const res = await erc20Mint(baseContract as unknown as Contract, '0xabc', 120);
    // assertion
    expect(res.err).toBe('Invalid recipient address');
    expect(erc20Mint).toBeCalled;
    expect(res.mintRes).toBeNull;
  });

  it('should failed with invalid token amount', async () => {
    const res = await erc20Mint(
      baseContract as unknown as Contract,
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      -120
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
  const baseContract = {
    approve: jest.fn(),
    increaseAllowance: jest.fn(),
    decreaseAllowance: jest.fn(),
    decimals: jest.fn().mockResolvedValue(18),
    allowance: jest.fn().mockResolvedValue('120'),
  };

  it('should execute erc20Approve', async () => {
    const approveRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      'approve',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      '',
      120
    );

    // assertion
    expect(approveRes.err).toBeNull;
    expect(approveRes.approveRes).toBe(true);
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20Approve with Invalid spender address', async () => {
    const approveRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      'approve',
      '0x3619',
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
      'increaseAllowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      '',
      120
    );

    // assertion
    expect(increaseAllowanceRes.err).toBeNull;
    expect(increaseAllowanceRes.increaseAllowanceRes).toBe(true);
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20IncreaseAllowance with Invalid spender address', async () => {
    const increaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      'increaseAllowance',
      '0x3619',
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
      'decreaseAllowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
      '',
      120
    );

    // assertion
    expect(decreaseAllowanceRes.err).toBeNull;
    expect(decreaseAllowanceRes.decreaseAllowanceRes).toBe(true);
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should fail erc20DecreaseAllowance with Invalid spender address', async () => {
    const decreaseAllowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      'decreaseAllowance',
      '0x3619',
      '',
      120
    );

    // assertion
    expect(decreaseAllowanceRes.err).toBe('Invalid spender address');
    expect(decreaseAllowanceRes.decreaseAllowanceRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });

  it('should execute erc20Allowance', async () => {
    const allowanceRes = await handleErc20TokenPermissions(
      baseContract as unknown as Contract,
      'allowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630095',
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
      'allowance',
      '0x7a575266b2020e262e9b1ad4eba3014d63630012',
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
      'allowance',
      '0x3619',
      '0x7a575266b2020e262e9b1ad4eba3014d63630012'
    );

    // assertion
    expect(allowanceRes.err).toBe('Invalid spender address');
    expect(allowanceRes.allowanceRes).toBeNull;
    expect(handleErc20TokenPermissions).toBeCalled;
  });
});
