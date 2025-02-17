// SPDX-License-Identifier: Apache-2.0

import { Tooltip, Select } from '@chakra-ui/react';
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';
import { SharedFormInputField, SharedRemoveFieldsButton } from './ParamInputForm';
import { htsCryptoTransferParamFields } from '@/utils/contract-interactions/HTS/token-transfer/paramFieldConstant';

interface PageProps {
  mode: 'CRYPTO' | 'TOKEN';
  paramValue: any;
  masterTokenParam?: any;
  handleModifyRecords: any;
  setCryptoTransferParamValues?: any;
  handleTokenTransferInputOnChange?: any;
  handleCryptoTransferInputOnChange?: any;
}

const CryptoTransferInputFields = ({
  mode,
  paramValue,
  masterTokenParam,
  handleModifyRecords,
  setCryptoTransferParamValues,
  handleTokenTransferInputOnChange,
  handleCryptoTransferInputOnChange,
}: PageProps) => {
  return (
    <div key={paramValue.fieldKey} className="flex gap-6 items-center w-full">
      {/* account ID & amount */}
      {(['accountID', 'amount'] as ('accountID' | 'amount')[]).map((paramKey) => (
        <SharedFormInputField
          key={paramKey}
          param={htsCryptoTransferParamFields[paramKey].paramKey}
          paramValue={paramValue.fieldValue[paramKey]}
          paramKey={htsCryptoTransferParamFields[paramKey].paramKey}
          paramType={htsCryptoTransferParamFields[paramKey].inputType}
          paramSize={htsCryptoTransferParamFields[paramKey].inputSize}
          explanation={htsCryptoTransferParamFields[paramKey].explanation}
          paramClassName={htsCryptoTransferParamFields[paramKey].inputClassname}
          paramPlaceholder={htsCryptoTransferParamFields[paramKey].inputPlaceholder}
          paramFocusColor={htsCryptoTransferParamFields[paramKey].inputFocusBorderColor}
          handleInputOnChange={(e) => {
            if (mode === 'TOKEN') {
              handleTokenTransferInputOnChange(
                e,
                masterTokenParam.fieldKey,
                paramValue.fieldKey,
                'transfers',
                paramKey
              );
            } else {
              handleCryptoTransferInputOnChange(
                e,
                paramKey,
                paramValue.fieldKey,
                setCryptoTransferParamValues
              );
            }
          }}
        />
      ))}

      {/* isApproval A*/}
      <div>
        <Tooltip
          label={htsCryptoTransferParamFields.isApprovalA.explanation}
          placement="top"
          fontWeight={'medium'}
        >
          <Select
            _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
            className="w-[200px] hover:cursor-pointer rounded-md border-white/30"
            placeholder="Approval Status"
            onChange={(e) => {
              if (mode === 'TOKEN') {
                handleTokenTransferInputOnChange(
                  e,
                  masterTokenParam.fieldKey,
                  paramValue.fieldKey,
                  'transfers',
                  'isApprovalA'
                );
              } else {
                handleCryptoTransferInputOnChange(
                  e,
                  'isApprovalA',
                  paramValue.fieldKey,
                  setCryptoTransferParamValues
                );
              }
            }}
          >
            <option value={'false'}>FALSE</option>
            <option value={'true'}>TRUE</option>
          </Select>
        </Tooltip>
      </div>

      {/* delete key button */}
      <div className="w-fit flex items-center">
        <SharedRemoveFieldsButton
          fieldKey={paramValue.fieldKey}
          handleModifyTokenAddresses={handleModifyRecords}
        />
      </div>
    </div>
  );
};

export default CryptoTransferInputFields;
