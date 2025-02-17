// SPDX-License-Identifier: Apache-2.0

import { SharedFormInputField, SharedRemoveFieldsButton } from '../../../shared/components/ParamInputForm';
import { htsMultiTokensTransferParamFields } from '@/utils/contract-interactions/HTS/token-transfer/paramFieldConstant';

interface PageProps {
  paramKeys: any;
  paramValue: any;
  paramValues: any;
  setParamValues: any;
  handleInputOnChange: any;
  handleModifyTransferRecords: any;
}

const TransferRecordForm = ({
  paramKeys,
  paramValue,
  paramValues,
  setParamValues,
  handleInputOnChange,
  handleModifyTransferRecords,
}: PageProps) => {
  return (
    <div key={paramValue.fieldKey} className="flex gap-6 items-center">
      {paramKeys.map((param: any) => {
        return (
          <SharedFormInputField
            key={param}
            param={param}
            handleInputOnChange={(e: any) =>
              handleInputOnChange(e, 'UNIQUE', param, paramValue.fieldKey, setParamValues)
            }
            paramValue={paramValue.fieldValue[param]}
            paramKey={(htsMultiTokensTransferParamFields as any)[param].paramKey}
            paramType={(htsMultiTokensTransferParamFields as any)[param].inputType}
            paramSize={(htsMultiTokensTransferParamFields as any)[param].inputSize}
            explanation={(htsMultiTokensTransferParamFields as any)[param].explanation}
            paramClassName={(htsMultiTokensTransferParamFields as any)[param].inputClassname}
            paramPlaceholder={(htsMultiTokensTransferParamFields as any)[param].inputPlaceholder}
            paramFocusColor={(htsMultiTokensTransferParamFields as any)[param].inputFocusBorderColor}
          />
        );
      })}

      {/* delete key button */}
      {paramValues.length > 1 && (
        <SharedRemoveFieldsButton
          fieldKey={paramValue.fieldKey}
          handleModifyTokenAddresses={() =>
            handleModifyTransferRecords('REMOVE', paramValues, setParamValues, paramValue.fieldKey)
          }
        />
      )}
    </div>
  );
};

export default TransferRecordForm;
