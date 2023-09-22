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

import { Select, Input } from '@chakra-ui/react';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
} from '@/utils/common/constants';
import { handleKeyValueTypeOnChange, handleUpdateKeyValue } from '../../../shared/methods/signingKeys';

interface PageProps {
  isSuccessful?: boolean;
  keys: ICommonKeyObject[];
  keyTypeArrays?: IHederaTokenServiceKeyType[];
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>;
  HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[];
}

const TokenKeysForm = ({
  keys,
  setKeys,
  isSuccessful,
  keyTypeArrays,
  HederaTokenKeyValueType,
}: PageProps) => {
  const [keyRefs] = useState<Record<IHederaTokenServiceKeyType, any>>({
    ADMIN: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    KYC: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    FREEZE: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    WIPE: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    SUPPLY: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    FEE: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
    PAUSE: {
      keyValueType: useRef<HTMLSelectElement>(null),
      keyValue: useRef<HTMLSelectElement>(null),
    },
  });

  // reset select option's values
  useEffect(() => {
    if (isSuccessful && keyTypeArrays) {
      keyTypeArrays.forEach((keyType) => {
        if (keyRefs[keyType].keyValueType.current)
          keyRefs[keyType].keyValueType.current.value = 'inheritAccountKey';
        if (keyRefs[keyType].keyValue.current) keyRefs[keyType].keyValue.current.value = '';
      });
    }
  }, [isSuccessful, keyRefs, keyTypeArrays]);

  return (
    <div className="flex flex-col gap-6">
      {/* Key wrapper */}
      {keys.map((key) => {
        return (
          <div key={key.keyType} className="flex gap-3 items-center">
            {/* Key Type & Key Value Type */}
            <div className="flex gap-3">
              <div className="w-[120px] rounded-md border border-white/30 pl-3 text-lg">
                <div className="pt-1">{key.keyType}</div>
              </div>

              <div>
                {/* Key Value type */}
                <Select
                  ref={keyRefs[key.keyType].keyValueType}
                  _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
                  className="w-[220px] hover:cursor-pointer rounded-md border-white/30"
                  onChange={(e) => {
                    handleKeyValueTypeOnChange(e, key, setKeys);
                  }}
                >
                  {HederaTokenKeyValueType.map((keyType) => {
                    return (
                      <option key={keyType} value={keyType}>
                        {convertCalmelCaseFunctionName(keyType)}
                      </option>
                    );
                  })}
                </Select>
              </div>
            </div>

            {/* Key value */}
            <div className="w-full">
              {key.keyValueType === 'inheritAccountKey' ? (
                <Select
                  ref={keyRefs[key.keyType].keyValue}
                  _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
                  className="hover:cursor-pointer rounded-md border-white/30"
                  placeholder="Select option"
                  onChange={(e) => handleUpdateKeyValue(e, key, setKeys)}
                >
                  <option value={'false'}>false</option>
                  <option value={'true'}>true</option>
                </Select>
              ) : (
                <Input
                  value={key.keyValue as string}
                  type={'text'}
                  onChange={(e) => handleUpdateKeyValue(e, key, setKeys)}
                  placeholder={
                    key.keyValueType === 'contractId' || key.keyValueType === 'delegatableContractId'
                      ? 'ID of a smart contract instance...'
                      : `${key.keyValueType.split('_')[0].toUpperCase()} compressed public key...`
                  }
                  size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
                  focusBorderColor={HEDERA_BRANDING_COLORS.purple}
                  className={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TokenKeysForm;
