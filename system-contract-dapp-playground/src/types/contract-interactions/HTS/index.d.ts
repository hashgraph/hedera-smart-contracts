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

/** @dev the type for HTS transaction results */
export type TransactionResult = {
  status: 'sucess' | 'fail';
  txHash: string;
  APICalled?: any;
  isToken?: boolean;
  keyTypeCalled?: any;
  tokenAddress?: string;
  accountAddress?: string;
  tokenAddresses?: string[];
  tokenInfo?:
    | IHederaTokenServiceTokenInfo
    | IHederaTokenServiceFungibleTokenInfo
    | IHederaTokenServiceNonFungibleTokenInfo;
};

/** @dev an interface for the results returned back from interacting with Hedera TokenCreateCustom smart contract */
interface TokenCreateCustomSmartContractResult {
  tokenAddress?: string;
  transactionHash?: string;
  mintedTokenEventData?: string;
  transferTokenEventData?: string;
  err?: any;
}

/** @dev an interface for the results returned back from interacting with Hedera TokenManagement smart contract */
interface TokenManagementSmartContractResult {
  transactionHash?: string;
  result?: boolean;
  err?: any;
}

/** @dev an interface for the results returned back from interacting with Hedera TokenQeury smart contract */
interface TokenQuerySmartContractResult {
  Frozen?: any;
  IsToken?: any;
  Approved?: any;
  TokenKey?: any;
  TokenType?: any;
  KycGranted?: any;
  AllowanceValue?: any;
  ApprovedAddress?: any;
  TokenCustomFees?: any;
  TokenExpiryInfo?: any;
  transactionHash?: string;
  TokenDefaultKycStatus?: any;
  TokenDefaultFreezeStatus?: any;
  TokenInfo?: IHederaTokenServiceTokenInfo;
  FungibleTokenInfo?: IHederaTokenServiceFungibleTokenInfo;
  NonFungibleTokenInfo?: IHederaTokenServiceNonFungibleTokenInfo;
  err?: any;
}

/**
 * @dev a type for the IHederaTokenService.TokenKey.keyType
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L128
 */
type IHederaTokenServiceKeyType = 'ADMIN' | 'KYC' | 'FREEZE' | 'WIPE' | 'SUPPLY' | 'FEE' | 'PAUSE';

/**
 * @dev a type representing the correct bit value for IHederaTokenService.TokenKey.keyType
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L128
 */
type IHederaTokenServiceKeyTypeBitValue = 1 | 2 | 4 | 8 | 16 | 32 | 64;

/**
 * @dev a type for the key value type of the IHederaTokenService.KeyValue
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L92
 */
type IHederaTokenServiceKeyValueType =
  | 'inheritAccountKey'
  | 'contractId'
  | 'ed25519'
  | 'ECDSA_secp256k1'
  | 'delegatableContractId';

/**
 * @dev an interface for keyInput
 *
 * @param keyType: IHederaTokenServiceKeyType;
 *
 * @param keyValueType: IHederaTokenServiceKeyValueType;
 *
 * @param keyValue: string | boolean;
 *
 * @param err?: any
 */
interface CommonKeyObject {
  keyType: IHederaTokenServiceKeyType;
  keyValueType: IHederaTokenServiceKeyValueType;
  keyValue: string | boolean;
  err?: any;
}

/**
 * @dev an interface that adheres to the `IHederaTokenService.KeyValue` type.
 *
 * @param inheritAccountKey: boolean
 *
 * @param contractId: string<address>
 *
 * @param ed25519: Buffer
 *
 * @param ECDSA_secp256k1: Buffer
 *
 * @param delegatableContractId: string<address>
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L92
 */
interface IHederaTokenServiceKeyValue {
  inheritAccountKey: boolean;
  contractId: string;
  ed25519: Buffer;
  ECDSA_secp256k1: Buffer;
  delegatableContractId: string;
}

/**
 * @dev an interface that adheres to the `IHederaTokenService.TokenKey`
 *
 * @param keyType: IHederaTokenServiceKeyTypeBitValue
 *
 * @param key: IHederaTokenServiceKeyValue
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L116
 */
interface IHederaTokenServiceTokenKey {
  keyType: IHederaTokenServiceKeyTypeBitValue;
  key: IHederaTokenServiceKeyValue;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.Expiry
 *
 * @param second: number
 *
 * @param autoRenewAccount: string
 *
 * @param autoRenewPeriod: number
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L69
 */
interface IHederaTokenServiceExpiry {
  second: number;
  autoRenewAccount: string;
  autoRenewPeriod: number;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.HederaToken
 *
 * @param name: string
 *
 * @param symbol: string
 *
 * @param treasury: string
 *
 * @param memo: string
 *
 * @param tokenSupplyType: boolean
 *
 * @param maxSupply: number
 *
 * @param freezeDefault: boolean
 *
 * @param tokenKeys: IHederaTokenServiceTokenKey[]
 *
 * @param expiry: IHederaTokenServiceExpiry
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L136
 */
interface IHederaTokenServiceHederaToken {
  name: string;
  symbol: string;
  treasury: string;
  memo: string;
  tokenSupplyType: boolean;
  maxSupply: number;
  freezeDefault: boolean;
  tokenKeys: IHederaTokenServiceTokenKey[];
  expiry: IHederaTokenServiceExpiry;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.FixedFee
 *
 * @param amount: number;
 *
 * @param tokenId: string;
 *
 * @param useHbarsForPayment: boolean;
 *
 * @param  useCurrentTokenForPayment: boolean;
 *
 * @param feeCollector: string;
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L236
 */
interface IHederaTokenServiceFixedFee {
  amount: number;
  tokenId: string;
  useHbarsForPayment: boolean;
  useCurrentTokenForPayment: boolean;
  feeCollector: string;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.FractionalFee
 *
 * @param numerator: number;
 *
 * @param denominator: number;
 *
 * @param minimumAmount: number;
 *
 * @param maximumAmount: number;
 *
 * @param netOfTransfers: boolean;
 *
 * @param feeCollector: string;
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L256
 */
interface IHederaTokenServiceFractionalFee {
  numerator: number;
  denominator: number;
  minimumAmount: number;
  maximumAmount: number;
  netOfTransfers: boolean;
  feeCollector: string;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.RoyaltyFee
 *
 * @param numerator: number;
 *
 * @param denominator: number;
 *
 * @param amount?: number;
 *
 * @param tokenId?: string;
 *
 * @param useHbarsForPayment: boolean;
 *
 * @param feeCollector: string;
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L279
 */
interface IHederaTokenServiceRoyaltyFee {
  numerator: number;
  denominator: number;
  amount?: number;
  tokenId?: string;
  useHbarsForPayment: boolean;
  feeCollector: string;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.TokenInfo
 *
 * @param token: IHederaTokenServiceHederaToken;
 *
 * @param totalSupply: number;
 *
 * @param deleted: boolean;
 *
 * @param defaultKycStatus: boolean;
 *
 * @param pauseStatus: boolean;
 *
 * @Param fixedFees: FixedFee[];
 *
 * @param fraztiofractionalFees: FractionalFee[];
 *
 * @param royaltyFees: RoyaltyFee[];
 *
 * @param ledgerId: string;
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L173
 */
interface IHederaTokenServiceTokenInfo {
  token: IHederaTokenServiceHederaToken;
  totalSupply: number;
  deleted: boolean;
  defaultKycStatus: boolean;
  pauseStatus: boolean;
  fixedFees: IHederaTokenServiceFixedFee[];
  fractionalFees: IHederaTokenServiceFractionalFee[];
  royaltyFees: IHederaTokenServiceRoyaltyFee[];
  ledgerId: string;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.FungibleTokenInfo
 *
 * @param tokenInfo: IHederaTokenServiceTokenInfo;
 *
 * @param decimals: number;
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L203
 */
interface IHederaTokenServiceFungibleTokenInfo {
  tokenInfo: IHederaTokenServiceTokenInfo;
  decimals: number;
}

/**
 * @dev an interface that adheres to the IHederaTokenService.NonFungibleTokenInfo
 *
 * @param tokenInfo: IHederaTokenServiceTokenInfo;
 *
 * @param serialNumber: number;
 *
 * @param ownerId: string;
 *
 * @param creationTime: number;
 *
 * @param metadata: Uint8Array
 *
 * @param spenderId: string
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L212
 */
interface IHederaTokenServiceNonFungibleTokenInfo {
  tokenInfo: IHederaTokenServiceTokenInfo;
  serialNumber: number;
  ownerId: string;
  creationTime: number;
  metadata: Uint8Array;
  spenderId: string;
}
