// SPDX-License-Identifier: Apache-2.0

/**
 * @dev an interface for the results returned back from interacting with ERC20Mock & ERC721Mock smart contract
 */
interface IERCSmartContractResult {
  name?: string;
  symbol?: string;
  txHash?: string;
  decimals?: string;
  tokenURI?: string;
  mintRes?: boolean;
  ownerOfRes?: string;
  totalSupply?: string;
  balanceOfRes?: string;
  approveRes?: boolean;
  allowanceRes?: string;
  transferRes?: boolean;
  transferFromRes?: boolean;
  approvalStatusRes?: boolean;
  approvedAccountRes?: string;
  increaseAllowanceRes?: boolean;
  decreaseAllowanceRes?: boolean;
  err?: any;
}
