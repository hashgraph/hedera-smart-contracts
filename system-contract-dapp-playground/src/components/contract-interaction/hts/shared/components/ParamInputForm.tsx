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
import Image from 'next/image';
import { AiOutlineMinus } from 'react-icons/ai';
import { Tooltip, Input } from '@chakra-ui/react';
import { HEDERA_BRANDING_COLORS, HEDERA_CHAKRA_INPUT_BOX_SIZES } from '@/utils/common/constants';

/** @dev shared form input component */
interface SharedFormInputFieldPageProps {
  param: string;
  paramKey: string;
  setFieldKey?: any;
  paramType: string;
  paramSize: string;
  paramValue: string;
  isDisable?: boolean;
  explanation: string;
  fieldKeyToSet?: string;
  paramClassName: string;
  paramFocusColor: string;
  paramPlaceholder: string;
  handleInputOnChange: (e: any, param: string, fieldKeyToSet?: string, setFieldKey?: any) => void;
}

export const SharedFormInputField = ({
  param,
  paramKey,
  paramType,
  isDisable,
  paramSize,
  paramValue,
  explanation,
  setFieldKey,
  fieldKeyToSet,
  paramClassName,
  paramFocusColor,
  paramPlaceholder,
  handleInputOnChange,
}: SharedFormInputFieldPageProps) => {
  return (
    <Tooltip key={paramKey} label={explanation} placement="top" fontWeight={'medium'}>
      <Input
        value={paramValue}
        disabled={isDisable}
        type={paramType}
        onChange={(e) => handleInputOnChange(e, param, fieldKeyToSet, setFieldKey)}
        placeholder={paramPlaceholder}
        size={paramSize}
        focusBorderColor={paramFocusColor}
        className={paramClassName}
      />
    </Tooltip>
  );
};

/** @dev shared form button component */
interface SharedFormButtonPageProps {
  switcher: boolean;
  explanation: string;
  buttonTitle: string;
  handleButtonOnClick: any;
}

export const SharedFormButton = ({
  switcher,
  explanation,
  buttonTitle,
  handleButtonOnClick,
}: SharedFormButtonPageProps) => {
  return (
    <Tooltip label={explanation} placement="top" fontWeight={'medium'}>
      <button
        onClick={handleButtonOnClick}
        className={`border w-full rounded-md py-1 text-lg transition duration-300 ${
          switcher
            ? ` border-hedera-purple text-hedera-purple`
            : `border-white/30 hover:text-white hover:border-white`
        }`}
      >
        <p>{buttonTitle}</p>
      </button>
    </Tooltip>
  );
};

/** @dev shared execute button component */
interface SharedExecuteButtonPageProps {
  isLoading: boolean;
  buttonTitle: string;
  explanation?: string;
  handleCreatingFungibleToken: () => Promise<void>;
}

export const SharedExecuteButton = ({
  isLoading,
  buttonTitle,
  explanation,
  handleCreatingFungibleToken,
}: SharedExecuteButtonPageProps) => {
  return (
    <Tooltip label={explanation} placement="top">
      <button
        onClick={handleCreatingFungibleToken}
        disabled={isLoading}
        className={`w-full border py-2 rounded-xl transition duration-300 ${
          isLoading
            ? 'cursor-not-allowed border-white/30 text-white/30'
            : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex gap-1 justify-center">
            Executing...
            <Image
              src={'/brandings/hedera-logomark.svg'}
              alt={'hedera-logomark'}
              width={15}
              height={15}
              className="animate-bounce"
            />
          </div>
        ) : (
          <>{buttonTitle}</>
        )}
      </button>
    </Tooltip>
  );
};

/** @dev shared remove fields button */
interface SharedRemoveFieldButtonPageProps {
  fieldKey: string;
  setFieldKey?: any;
  handleModifyTokenAddresses: any;
}
export const SharedRemoveFieldsButton = ({
  fieldKey,
  handleModifyTokenAddresses,
}: SharedRemoveFieldButtonPageProps) => {
  return (
    <Tooltip label="delete this record" placement="top">
      <button
        onClick={() => handleModifyTokenAddresses('REMOVE', fieldKey)}
        className={`border h-fit border-white/30 text-base px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
      >
        <AiOutlineMinus />
      </button>
    </Tooltip>
  );
};

/** @dev shared execute button with fee component */
interface SharedExecuteButtonWithFeePageProps {
  isLoading: boolean;
  paramValues: string;
  explanation: string;
  placeHolder: string;
  executeBtnTitle: string;
  feeType: 'SERVICE' | 'GAS';
  handleInvokingAPIMethod: () => Promise<void>;
  handleInputOnChange: (e: any, param: string) => void;
}

export const SharedExecuteButtonWithFee = ({
  feeType,
  isLoading,
  paramValues,
  explanation,
  placeHolder,
  executeBtnTitle,
  handleInputOnChange,
  handleInvokingAPIMethod,
}: SharedExecuteButtonWithFeePageProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-6">
        {/* Service Fee */}
        <div className="w-3/12">
          <SharedFormInputField
            param={'feeValue'}
            paramType={'number'}
            paramKey={'feeValue'}
            paramValue={paramValues}
            explanation={explanation}
            paramPlaceholder={placeHolder}
            handleInputOnChange={handleInputOnChange}
            paramClassName={'border-white/30 rounded-xl'}
            paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.large}
            paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          />
        </div>
        {/* Execute button */}
        <div className=" w-9/12">
          <SharedExecuteButton
            isLoading={isLoading}
            buttonTitle={executeBtnTitle}
            handleCreatingFungibleToken={handleInvokingAPIMethod}
          />
        </div>
      </div>
      {feeType === 'SERVICE' && (
        <p className="text-sm whitespace-normal">
          <span className="italic font-medium text-sm">*Important:</span> Varying configurations applied to
          the token will result in varying service fees. Be sure to utilize the{' '}
          <Link
            className="underline text-hedera-green font-medium whitespace-nowrap"
            href={'https://hedera.com/fees'}
            target="_blank"
          >
            Hedera service fee calculator
          </Link>{' '}
          for precise estimation of the applicable fee, as this fee is non-refundable.
        </p>
      )}
    </div>
  );
};
