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

import { Contract, isAddress } from 'ethers';

/**
 * @dev get token information
 *
 * @notice execute name(), symbol(), totalSupply(), decimals()
 *
 * @param baseContract: Contract
 *
 * @param method: 'name' | 'symbol' | 'totalSupply' | 'decimals'
 *
 * @return Promise<IERCSmartContractResult>
 */
export const getERC20TokenInformation = async (
  baseContract: Contract,
  method: 'name' | 'symbol' | 'totalSupply' | 'decimals'
): Promise<IERCSmartContractResult> => {
  try {
    switch (method) {
      case 'name':
        return { name: await baseContract.name() };
      case 'symbol':
        return { symbol: await baseContract.symbol() };
      case 'totalSupply':
        return { totalSupply: (await baseContract.totalSupply()).toString() };
      case 'decimals':
        return { decimals: (await baseContract.decimals()).toString() };
    }
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev mints erc20 tokens
 *
 * @param baseContract: Contract
 *
 * @param recipientAddress: address
 *
 * @param tokenAmount: number
 *
 * @return Promise<IERCSmartContractResult>
 */
export const erc20Mint = async (
  baseContract: Contract,
  recipientAddress: string,
  tokenAmount: number
): Promise<IERCSmartContractResult> => {
  if (!isAddress(recipientAddress)) {
    return { err: 'Invalid recipient address' };
  } else if (tokenAmount <= 0) {
    return { err: 'Invalid token amount' };
  }

  try {
    const txReceipt = await (await baseContract.mint(recipientAddress, tokenAmount)).wait();
    return { mintRes: true, txHash: txReceipt.hash };
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev get token balance owned by `accountAddress`
 *
 * @param baseContract: Contract
 *
 * @param accountAddress: address
 *
 * @return Promise<IERCSmartContractResult>
 */
export const balanceOf = async (
  baseContract: Contract,
  accountAddress: string
): Promise<IERCSmartContractResult> => {
  if (!isAddress(accountAddress)) {
    return { err: 'Invalid account address' };
  }

  try {
    return { balanceOfRes: (await baseContract.balanceOf(accountAddress)).toString() };
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev handle executing APIs relate  to Token Permissions
 *
 * @dev approve() sets `amount` as the allowance of `spenderAddress` over the caller's tokens
 *
 * @dev increaseAllowance() atomically increases the allowance granted to spender by the caller.
 *
 * @dev decreaseAllowance() atomically decreases the allowance granted to spender by the caller.
 *
 * @dev allowance() returns the remaining number of tokens that `spenerAddress` will be allowed to spend on behalf of `ownerAddress`
 *
 * @param baseContract: Contract
 *
 * @param method: 'approve' | 'allowance' | 'increaseAllowance' | 'decreaseAllowance'
 *
 * @param spenderAddress?: address
 *
 * @param owner?: address
 *
 * @param amount?: number
 *
 * @return Promise<IERCSmartContractResult>
 */
export const handleErc20TokenPermissions = async (
  baseContract: Contract,
  method: 'approve' | 'allowance' | 'increaseAllowance' | 'decreaseAllowance',
  spenderAddress: string,
  ownerAddress?: string,
  amount?: number
): Promise<IERCSmartContractResult> => {
  // sanitize params
  if (ownerAddress && !isAddress(ownerAddress)) {
    return { err: 'Invalid owner address' };
  } else if (spenderAddress && !isAddress(spenderAddress)) {
    return { err: 'Invalid spender address' };
  }

  // executing logic
  try {
    switch (method) {
      case 'approve':
        const approveReceipt = await (await baseContract.approve(spenderAddress, amount)).wait();
        return { approveRes: true, txHash: approveReceipt.hash };
      case 'increaseAllowance':
        const increaseAllowanceReceipt = await (
          await baseContract.increaseAllowance(spenderAddress, amount)
        ).wait();
        return { increaseAllowanceRes: true, txHash: increaseAllowanceReceipt.hash };
      case 'decreaseAllowance':
        const decreaseAllowanceReceipt = await (
          await baseContract.decreaseAllowance(spenderAddress, amount)
        ).wait();
        return { decreaseAllowanceRes: true, txHash: decreaseAllowanceReceipt.hash };
      case 'allowance':
        const allowance = await baseContract.allowance(ownerAddress, spenderAddress);
        return { allowanceRes: allowance.toString() };
    }
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev handle executing APIs relate to Token Transfer
 *
 * @dev transfer() moves amount tokens from the caller’s account to `recipient`.
 *
 * @dev transferFrom() moves amount tokens from `tokenOwnerAddress` to `recipientAddress` using the allowance mechanism. `amount` is then deducted from the caller’s allowance.
 *
 * @param baseContract: Contract
 *
 * @param method: "transfer" | "transferFrom"
 *
 * @param recipientAddress: address
 *
 * @param amount: number
 *
 * @param tokenOwnerAddress?: address
 *
 * @return Promise<IERCSmartContractResult>
 */
export const erc20Transfers = async (
  baseContract: Contract,
  method: 'transfer' | 'transferFrom',
  recipientAddress: string,
  amount: number,
  tokenOwnerAddress?: string
): Promise<IERCSmartContractResult> => {
  if (method === 'transferFrom' && !isAddress(tokenOwnerAddress)) {
    return { err: 'Invalid token owner address' };
  } else if (!isAddress(recipientAddress)) {
    return { err: 'Invalid recipient address' };
  }

  try {
    switch (method) {
      case 'transfer':
        const transferReceipt = await (await baseContract.transfer(recipientAddress, amount)).wait();
        return { transferRes: true, txHash: transferReceipt.hash };
      case 'transferFrom':
        const transferFromReceipt = await (
          await baseContract.transferFrom(tokenOwnerAddress, recipientAddress, amount)
        ).wait();

        return { transferFromRes: true, txHash: transferFromReceipt.hash };
    }
  } catch (err) {
    console.error(err);
    return { err };
  }
};
