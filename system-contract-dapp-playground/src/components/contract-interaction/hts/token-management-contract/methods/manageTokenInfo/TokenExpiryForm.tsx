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

import { SharedFormInputField } from '../../../shared/components/ParamInputForm';
import { htsUpdateTokenExpiryParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';

interface PageProps {
  paramValues: any;
  tokenInfoFields: string[];
  handleInputOnChange: (e: any, param: string) => void;
}

const TokenExpiryForm = ({ paramValues, tokenInfoFields, handleInputOnChange }: PageProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* hederaTokenAddress & second & autoRenewAccount && autoRenewPeriod */}
      {tokenInfoFields.map((param) => {
        return (
          <div className="w-full" key={(htsUpdateTokenExpiryParamFields as any)[param].paramKey}>
            <SharedFormInputField
              param={param}
              paramValue={paramValues[param]}
              handleInputOnChange={handleInputOnChange}
              paramKey={(htsUpdateTokenExpiryParamFields as any)[param].paramKey}
              paramType={(htsUpdateTokenExpiryParamFields as any)[param].inputType}
              paramSize={(htsUpdateTokenExpiryParamFields as any)[param].inputSize}
              explanation={(htsUpdateTokenExpiryParamFields as any)[param].explanation}
              paramClassName={(htsUpdateTokenExpiryParamFields as any)[param].inputClassname}
              paramPlaceholder={(htsUpdateTokenExpiryParamFields as any)[param].inputPlaceholder}
              paramFocusColor={(htsUpdateTokenExpiryParamFields as any)[param].inputFocusBorderColor}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TokenExpiryForm;
