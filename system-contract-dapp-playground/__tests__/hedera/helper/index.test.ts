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

import { constructIHederaTokenKey } from '@/utils/contract-interactions/HTS/helpers';
import {
  DEFAULT_IHTS_KEY_VALUE,
  KEY_TYPE_MAP,
} from '@/utils/contract-interactions/HTS/token-create-custom/constant';

describe('constructIHederaTokenKey test suite', () => {
  // mock contractId & compressedPubKey
  const contractId = '0xbdcdf69052c9fc01e38377d05cc83c28ee43f24a';
  const compressedPubKey = '0x02abd6f73537915169f0172a49b8521f0679482c6538f0cc063c27bd31f32db9c1';

  it('should construct a correct IHederaTokenService.TokenKey for all key types', () => {
    const keyValueType = 'contractId';

    const keyTypesArray: IHederaTokenServiceKeyType[] = [
      'ADMIN',
      'KYC',
      'FREEZE',
      'WIPE',
      'SUPPLY',
      'FEE',
      'PAUSE',
    ];

    keyTypesArray.forEach((keyType) => {
      const expectedHederaTokenKey = {
        keyType: KEY_TYPE_MAP[keyType],
        key: { ...DEFAULT_IHTS_KEY_VALUE, contractId },
      };

      const hederaTokenKey = constructIHederaTokenKey(keyType, keyValueType, contractId);

      expect(hederaTokenKey).toStrictEqual(expectedHederaTokenKey);
    });
  });

  it('should construct a correct IHederaTokenService.TokenKey for all key value types', () => {
    const keyValueTypsArray: IHederaTokenServiceKeyValueType[] = [
      'inheritAccountKey',
      'contractId',
      'ed25519',
      'ECDSA_secp256k1',
      'delegatableContractId',
    ];

    keyValueTypsArray.forEach((keyValueType) => {
      let expectedKeyValue, inputKeyValue;
      if (keyValueType === 'inheritAccountKey') {
        inputKeyValue = true;
        expectedKeyValue = true;
      } else if (keyValueType === 'contractId' || keyValueType === 'delegatableContractId') {
        inputKeyValue = contractId;
        expectedKeyValue = contractId;
      } else {
        inputKeyValue = compressedPubKey;
        expectedKeyValue = Buffer.from(compressedPubKey.replace('0x', ''), 'hex');
      }

      const expectedHederaTokenKey = {
        keyType: 1, // ADMIN
        key: { ...DEFAULT_IHTS_KEY_VALUE, [keyValueType]: expectedKeyValue },
      };
      const hederaTokenKey = constructIHederaTokenKey('ADMIN', keyValueType, inputKeyValue);

      expect(hederaTokenKey).toStrictEqual(expectedHederaTokenKey);
    });
  });

  it('should return NULL when construct a IHederaTokenService.TokenKey with address typed key that does not match standard public address', () => {
    const keyValueType: IHederaTokenServiceKeyValueType[] = ['contractId', 'delegatableContractId'];
    const invalidAddress = '0xabc';

    keyValueType.forEach((keyValueType) => {
      const hederaTokenKey = constructIHederaTokenKey('ADMIN', keyValueType, invalidAddress);
      expect(hederaTokenKey).toBe(null);
    });
  });

  it('should return NULL when construct a IHederaTokenService.TokenKey with compressed public key typed key that does not match standard compressed public key', () => {
    const keyValueType: IHederaTokenServiceKeyValueType[] = ['ed25519', 'ECDSA_secp256k1'];
    const invalidPubKey = '0xabc';

    keyValueType.forEach((keyValueType) => {
      const hederaTokenKey = constructIHederaTokenKey('ADMIN', keyValueType, invalidPubKey);
      expect(hederaTokenKey).toBe(null);
    });
  });
});
