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

/** @dev an interface for transaction results when interacting with smart contracts. */
export interface ITransactionResult {
  status: 'success' | 'fail';
  txHash: string;
  APICalled?: any;
  tokenInfo?: any;
  tokenID?: string;
  isToken?: boolean;
  readonly?: boolean;
  selected?: boolean;
  keyTypeCalled?: any;
  recordIndex?: number;
  tokenAddress?: string;
  mintedAmount?: string;
  initialAmount?: string;
  accountAddress?: string;
  transferAmount?: string;
  transactionType: string;
  convertedAmount?: string;
  receiverAddress?: string;
  pseudoRandomSeed?: string;
  tokenAddresses?: string[];
  transactionTimeStamp: number;
  sessionedContractAddress: string;
  transactionResultStorageKey: string;
  ercTokenInfo?: {
    name?: string;
    symbol?: string;
    decimals?: string;
    totalSupply?: string;
  };
  balanceOf?: {
    owner: string;
    balance: number;
  };
  allowances?: {
    owner: string;
    spender: string;
    amount: number;
  };
  tokenURI?: {
    tokenID: string;
    tokenURI: string;
  };
  ownerOf?: {
    tokenID: string;
    owner: string;
  };
  approves?: {
    tokenID: string;
    spender: string;
  };
  approval?: {
    owner: string;
    status: boolean;
    operator: string;
  };
}

/** @dev an interface for the results returned back from interacting with Hedera System Smart Contracts */
interface ISmartContractExecutionResult {
  Frozen?: any;
  IsToken?: any;
  Approved?: any;
  TokenType?: any;
  KycGranted?: any;
  result?: boolean;
  AllowanceValue?: any;
  ApprovedAddress?: any;
  tokenAddress?: string;
  convertedAmount?: number;
  transactionHash?: string;
  pseudoRandomSeed?: string;
  TokenDefaultKycStatus?: any;
  TokenDefaultFreezeStatus?: any;
  TokenInfo?: IHederaTokenServiceTokenInfo;
  TokenKey?: IHederaTokenServiceKeyValueType;
  TokenExpiryInfo?: IHederaTokenServiceExpiry;
  FungibleTokenInfo?: IHederaTokenServiceFungibleTokenInfo;
  NonFungibleTokenInfo?: IHederaTokenServiceNonFungibleTokenInfo;
  TokenCustomFees?: {
    fixedFees: IHederaTokenServiceFixedFee[];
    royaltyFees: IHederaTokenServiceRoyaltyFee[];
    fractionalFees: IHederaTokenServiceFractionalFee[];
  };
  err?: any;
}
