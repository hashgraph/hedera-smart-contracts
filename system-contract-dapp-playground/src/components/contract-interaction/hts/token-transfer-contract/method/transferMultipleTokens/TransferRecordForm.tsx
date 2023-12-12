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
