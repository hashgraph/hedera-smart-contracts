// SPDX-License-Identifier: Apache-2.0

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
