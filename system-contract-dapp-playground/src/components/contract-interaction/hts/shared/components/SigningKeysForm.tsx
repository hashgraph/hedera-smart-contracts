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

import Link from 'next/link';
import { AiOutlineMinus } from 'react-icons/ai';
import { Dispatch, SetStateAction } from 'react';
import { Tooltip, Select, Input } from '@chakra-ui/react';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
} from '@/utils/common/constants';
import {
  handleUpdateKeyValue,
  handleKeyTypeOnChange,
  handleAddingOrRemovingKeys,
  handleKeyValueTypeOnChange,
} from '../methods/signingKeys';

/** @dev shared component presenting signing keys*/
interface SigningKeyPageProps {
  buttonTitle: string;
  keys: ICommonKeyObject[];
  chosenKeys: Set<IHederaTokenServiceKeyType>;
  keyTypesToShow: Set<IHederaTokenServiceKeyType>;
  HederaTokenKeyTypes: IHederaTokenServiceKeyType[];
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>;
  HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[];
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
}

export const SharedSigningKeysComponent = ({
  keys,
  setKeys,
  chosenKeys,
  buttonTitle,
  setChosenKeys,
  keyTypesToShow,
  setKeyTypesToShow,
  HederaTokenKeyTypes,
  HederaTokenKeyValueType,
}: SigningKeyPageProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-6">
        {/* Add more key */}
        <div className="flex flex-col gap-0">
          {keys.length < 7 && (
            <Tooltip label={keys.length !== 0 && 'Add more keys'} placement="top" fontWeight={'medium'}>
              <button
                onClick={() =>
                  handleAddingOrRemovingKeys(
                    'ADD',
                    chosenKeys,
                    HederaTokenKeyTypes,
                    setKeys,
                    setChosenKeys,
                    setKeyTypesToShow
                  )
                }
                className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
              >
                {keys.length === 0 ? buttonTitle : '+'}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Key wrapper */}
        {keys.map((key) => (
          <div key={key.keyType} className="flex gap-3 items-center">
            {/* Key Type & Key Value Type */}
            <div className="flex gap-3">
              {/* Key type */}
              <Select
                _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
                placeholder={key.keyType}
                className="w-[120px] hover:cursor-pointer rounded-md border-white/30"
                onChange={(e) => handleKeyTypeOnChange(e, key, setKeys, setChosenKeys, setKeyTypesToShow)}
              >
                {Array.from(keyTypesToShow).map((keyType) => {
                  return (
                    <option key={keyType} value={keyType}>
                      {keyType}
                    </option>
                  );
                })}
              </Select>

              {/* Key Value type */}
              <Select
                _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
                className="w-[220px] hover:cursor-pointer rounded-md border-white/30"
                onChange={(e) => handleKeyValueTypeOnChange(e, key, setKeys)}
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

            {/* Key value */}
            <div className="w-full">
              {key.keyValueType === 'inheritAccountKey' ? (
                <Select
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

            {/* delete key button */}
            <Tooltip label="delete this record" placement="top">
              <button
                onClick={() =>
                  handleAddingOrRemovingKeys(
                    'REMOVE',
                    chosenKeys,
                    HederaTokenKeyTypes,
                    setKeys,
                    setChosenKeys,
                    setKeyTypesToShow,
                    key.keyType
                  )
                }
                className={`border h-fit border-white/30 text-base px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
              >
                <AiOutlineMinus />
              </button>
            </Tooltip>
          </div>
        ))}
      </div>

      {/* tip link */}
      {keys.length > 0 && (
        <small className="text-sm">
          For comprehensive details about keys, please visit{' '}
          <Link
            href={
              'https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L116'
            }
            target="_blank"
            className="text-hedera-purple underline font-medium"
          >
            this resource.
          </Link>
        </small>
      )}
    </div>
  );
};
