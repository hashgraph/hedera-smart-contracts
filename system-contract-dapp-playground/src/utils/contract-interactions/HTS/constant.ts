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
 * @notice an object to map key type to the specific bit value
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L128C22-L128C22
 */
export const KEY_TYPE_MAP: Record<IHederaTokenServiceKeyType, IHederaTokenServiceKeyTypeBitValue> =
  {
    ADMIN: 1,
    KYC: 2,
    FREEZE: 4,
    WIPE: 8,
    SUPPLY: 16,
    FEE: 32,
    PAUSE: 64,
  };

/**
 * @notice an object of the keyValue's default values which conform to IHederaTokenService.KeyValue
 */
export const DEFAULT_IHTS_KEY_VALUE: IHederaTokenServiceKeyValue = {
  inheritAccountKey: false,
  contractId: ethers.ZeroAddress,
  ed25519: Buffer.from('', 'hex'),
  ECDSA_secp256k1: Buffer.from('', 'hex'),
  delegatableContractId: ethers.ZeroAddress,
};
