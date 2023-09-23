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
