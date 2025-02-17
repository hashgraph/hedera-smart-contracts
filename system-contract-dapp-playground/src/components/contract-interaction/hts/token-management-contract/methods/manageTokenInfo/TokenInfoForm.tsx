// SPDX-License-Identifier: Apache-2.0

import { SharedFormInputField, SharedFormButton } from '../../../shared/components/ParamInputForm';
import { htsTokenCreateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { htsUpdateTokenInfoParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';

interface PageProps {
  paramValues: any;
  tokenInfoFields: string[][];
  setParamValues: (value: any) => void;
  handleInputOnChange: (e: any, param: string) => void;
}

const TokenInfoForm = ({ paramValues, setParamValues, tokenInfoFields, handleInputOnChange }: PageProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* name & symbol & memo*/}
      <div className="flex gap-3">
        {(tokenInfoFields as string[][])[0].map((param) => {
          return (
            <div className="w-full" key={(htsUpdateTokenInfoParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsUpdateTokenInfoParamFields as any)[param].paramKey}
                paramType={(htsUpdateTokenInfoParamFields as any)[param].inputType}
                paramSize={(htsUpdateTokenInfoParamFields as any)[param].inputSize}
                explanation={(htsUpdateTokenInfoParamFields as any)[param].explanation}
                paramClassName={(htsUpdateTokenInfoParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsUpdateTokenInfoParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsUpdateTokenInfoParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}
      </div>

      {/* Token supply type */}
      <div className="w-full flex gap-3">
        {/* infinite */}
        <SharedFormButton
          switcher={!paramValues.tokenSupplyType}
          buttonTitle={'Supply Type - INFINITE'}
          handleButtonOnClick={() => {
            setParamValues((prev: any) => ({ ...prev, tokenSupplyType: false }));
          }}
          explanation={(htsUpdateTokenInfoParamFields as any)['tokenSupplyType'].explanation.infinite}
        />

        {/* finite */}
        <SharedFormButton
          switcher={paramValues.tokenSupplyType}
          buttonTitle={'Supply Type - FINITE'}
          handleButtonOnClick={() => {
            setParamValues((prev: any) => ({ ...prev, tokenSupplyType: true }));
          }}
          explanation={(htsUpdateTokenInfoParamFields as any)['tokenSupplyType'].explanation.finite}
        />
      </div>

      {/* treasury & maxSupply */}
      {tokenInfoFields[1].map((param) => {
        return (
          <div className="w-full" key={(htsUpdateTokenInfoParamFields as any)[param].paramKey}>
            <SharedFormInputField
              param={param}
              paramValue={paramValues[param]}
              handleInputOnChange={handleInputOnChange}
              paramKey={(htsUpdateTokenInfoParamFields as any)[param].paramKey}
              paramType={(htsUpdateTokenInfoParamFields as any)[param].inputType}
              paramSize={(htsUpdateTokenInfoParamFields as any)[param].inputSize}
              explanation={(htsUpdateTokenInfoParamFields as any)[param].explanation}
              paramClassName={(htsUpdateTokenInfoParamFields as any)[param].inputClassname}
              paramPlaceholder={(htsUpdateTokenInfoParamFields as any)[param].inputPlaceholder}
              paramFocusColor={(htsUpdateTokenInfoParamFields as any)[param].inputFocusBorderColor}
            />
          </div>
        );
      })}

      {/* freeze status */}
      <div className="w-full flex gap-3">
        {/* false */}
        <SharedFormButton
          switcher={!paramValues.isDefaultFreeze}
          buttonTitle={'Freeze Status - false'}
          explanation={(htsTokenCreateParamFields as any)['freezeStatus'].explanation.off}
          handleButtonOnClick={() => {
            setParamValues((prev: any) => ({ ...prev, isDefaultFreeze: false }));
          }}
        />

        {/* true */}
        <SharedFormButton
          switcher={paramValues.isDefaultFreeze}
          buttonTitle={'Freeze Status - true'}
          explanation={(htsTokenCreateParamFields as any)['freezeStatus'].explanation.on}
          handleButtonOnClick={() => {
            setParamValues((prev: any) => ({ ...prev, isDefaultFreeze: true }));
          }}
        />
      </div>
    </div>
  );
};

export default TokenInfoForm;
