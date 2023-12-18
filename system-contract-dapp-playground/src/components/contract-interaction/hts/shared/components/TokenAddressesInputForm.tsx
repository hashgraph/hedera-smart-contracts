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

import { SharedFormInputField, SharedRemoveFieldsButton } from './ParamInputForm';
import { htsTokenAssociateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';

interface PageProps {
  handleInputOnChange: any;
  handleModifyTokenAddresses: any;
  tokenAddresses: {
    fieldKey: string;
    fieldValue: string;
  }[];
}

const TokenAddressesInputForm = ({
  tokenAddresses,
  handleInputOnChange,
  handleModifyTokenAddresses,
}: PageProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Add tokenAddresses */}
      <div className="flex flex-col gap-0">
        <button
          onClick={() => handleModifyTokenAddresses('ADD')}
          className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
        >
          Add more token address
        </button>
      </div>

      {/* tokenAddresses fields */}
      {tokenAddresses.map((field) => (
        <div key={field.fieldKey} className="flex gap-3 items-center">
          <SharedFormInputField
            param={'tokenAddresses'}
            paramValue={field.fieldValue}
            fieldKeyToSet={field.fieldKey}
            handleInputOnChange={handleInputOnChange}
            paramKey={(htsTokenAssociateParamFields as any)['tokenAddresses'].paramKey}
            paramType={(htsTokenAssociateParamFields as any)['tokenAddresses'].inputType}
            paramSize={(htsTokenAssociateParamFields as any)['tokenAddresses'].inputSize}
            explanation={(htsTokenAssociateParamFields as any)['tokenAddresses'].explanation}
            paramClassName={(htsTokenAssociateParamFields as any)['tokenAddresses'].inputClassname}
            paramPlaceholder={(htsTokenAssociateParamFields as any)['tokenAddresses'].inputPlaceholder}
            paramFocusColor={(htsTokenAssociateParamFields as any)['tokenAddresses'].inputFocusBorderColor}
          />
          {/* delete key button */}
          {tokenAddresses.length > 1 && (
            <SharedRemoveFieldsButton
              fieldKey={field.fieldKey}
              handleModifyTokenAddresses={handleModifyTokenAddresses}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TokenAddressesInputForm;
