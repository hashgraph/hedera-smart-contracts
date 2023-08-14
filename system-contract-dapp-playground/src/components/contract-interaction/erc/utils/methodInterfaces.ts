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

import { ethers } from 'ethers';

/**
 * @notice interface for methods from ERC20Mock contract
 */
export interface ERC20MockMethod extends ethers.BaseContract {
  name(): Promise<string>;
  symbol(): Promise<string>;
  totalSupply(): Promise<ethers.BigNumberish>;
  decimals(): Promise<ethers.BigNumberish>;
  mint(recipient: string, amount: number): Promise<ethers.ContractTransaction>;
  balanceOf(account: string): Promise<ethers.BigNumberish>;
  approve(spender: string, amount: ethers.BigNumberish): Promise<boolean>;
  allowance(owner: string, spender: string): Promise<ethers.BigNumberish>;
  increaseAllowance(spender: string, amount: ethers.BigNumberish): Promise<boolean>;
  decreaseAllowance(spender: string, amount: ethers.BigNumberish): Promise<boolean>;
  transfer(recipient: string, amount: ethers.BigNumberish): Promise<boolean>;
  transferFrom(sender: string, recipient: string, amount: ethers.BigNumberish): Promise<boolean>;
}
