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

/** @dev an interface for the results returned back from interacting with Hedera TokenCreateCustom smart contract */
interface TokenCreateCustomSmartContractResult {
  tokenAddress?: string;
  transactionHash?: string;
  mintedTokenEventData?: string;
  transferTokenEventData?: string;
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
