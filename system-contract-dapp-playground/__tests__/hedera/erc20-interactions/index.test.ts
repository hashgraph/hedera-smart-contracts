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

import { getERC20TokenInformation } from '@/api/hedera/erc20-interactions';
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
