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

import { Dispatch, SetStateAction } from 'react';
import { Tooltip, Select } from '@chakra-ui/react';
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';
import CryptoTransferInputFields from '../../../shared/components/CryptoTransferInputFields';
import { htsCryptoTransferParamFields } from '@/utils/contract-interactions/HTS/token-transfer/paramFieldConstant';
import {
  SharedFormInputField,
  SharedFormButton,
  SharedRemoveFieldsButton,
} from '../../../shared/components/ParamInputForm';
import {
  TokenTransferParam,
  generateInitialFungibleTokenTransferParamValues,
  generateInitialNonFungibleTokenTransferParamValues,
} from './helpers/generateInitialValues';

interface PapgeProps {
  handleModifyTransferRecords: any;
  handleTokenTransferInputOnChange: any;
  handleModifyMasterTokenTransferRecords: any;
  tokenTransferParamValues: TokenTransferParam[];
  setTokenTransferParamValues: Dispatch<SetStateAction<TokenTransferParam[]>>;
}

const TokenTransferForm = ({
  tokenTransferParamValues,
  setTokenTransferParamValues,
  handleModifyTransferRecords,
  handleTokenTransferInputOnChange,
  handleModifyMasterTokenTransferRecords,
}: PapgeProps) => {
  return (
    <div className="w-full flex flex-col gap-16">
      {/* Token Transfer */}
      <div>
        {/* title */}
        <div className="text-sm flex mb-3 items-center gap-3">
          <div className="w-full h-[1px] bg-hedera-green" />
          <div className="w-fit text-hedera-green">TOKEN TRANSFER</div>
          <div className="w-full h-[1px] bg-hedera-green" />
        </div>

        {/* Add more master token transfer records */}
        <button
          onClick={() => {
            handleModifyMasterTokenTransferRecords('ADD');
          }}
          className="w-full rounded border border-white/30 text-center text-sm mb-6 hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
        >
          Add more token transfer records
        </button>

        {/* TOKEN TRANSFER RECORDS */}
        <div className="flex flex-col gap-12">
          {tokenTransferParamValues.map((masterTokenParam, index) => (
            <div key={masterTokenParam.fieldKey} className="flex flex-col gap-6">
              <div className="flex gap-3 justify-between">
                <div className="w-full flex flex-col gap-6">
                  {tokenTransferParamValues.length > 1 && (
                    <div className="w-fit text-hedera-green text-sm -mb-3">{`RECORD #${index + 1}`}</div>
                  )}

                  {/* Hedera Token address */}
                  <div>
                    <SharedFormInputField
                      key={'hederaTokenAddress'}
                      param={htsCryptoTransferParamFields['hederaTokenAddress'].paramKey}
                      paramValue={masterTokenParam.fieldValue.token}
                      paramKey={htsCryptoTransferParamFields['hederaTokenAddress'].paramKey}
                      paramType={htsCryptoTransferParamFields['hederaTokenAddress'].inputType}
                      paramSize={htsCryptoTransferParamFields['hederaTokenAddress'].inputSize}
                      explanation={htsCryptoTransferParamFields['hederaTokenAddress'].explanation}
                      paramClassName={htsCryptoTransferParamFields['hederaTokenAddress'].inputClassname}
                      paramPlaceholder={htsCryptoTransferParamFields['hederaTokenAddress'].inputPlaceholder}
                      paramFocusColor={
                        htsCryptoTransferParamFields['hederaTokenAddress'].inputFocusBorderColor
                      }
                      handleInputOnChange={(e) =>
                        setTokenTransferParamValues((prev) =>
                          prev.map((param) => {
                            if (param.fieldKey === masterTokenParam.fieldKey) {
                              param.fieldValue.token = e.target.value;
                            }
                            return param;
                          })
                        )
                      }
                    />
                  </div>

                  {/* Token Type */}
                  <div className="w-full flex gap-3">
                    {/* FUNGILE */}
                    <SharedFormButton
                      switcher={masterTokenParam.fieldValue.tokenType === 'FUNGIBLE'}
                      buttonTitle={'Fungible'}
                      handleButtonOnClick={() =>
                        setTokenTransferParamValues((prev) =>
                          prev.map((param) => {
                            if (param.fieldKey === masterTokenParam.fieldKey) {
                              param.fieldValue.tokenType = 'FUNGIBLE';
                            }
                            return param;
                          })
                        )
                      }
                      explanation={''}
                    />

                    {/* NON_FUNGIBLE */}
                    <SharedFormButton
                      switcher={masterTokenParam.fieldValue.tokenType === 'NON_FUNGIBLE'}
                      buttonTitle={'Non-Fungible'}
                      handleButtonOnClick={() =>
                        setTokenTransferParamValues((prev) =>
                          prev.map((param) => {
                            if (param.fieldKey === masterTokenParam.fieldKey) {
                              param.fieldValue.tokenType = 'NON_FUNGIBLE';
                            }
                            return param;
                          })
                        )
                      }
                      explanation={''}
                    />
                  </div>

                  {/* Add more transfer pairs */}
                  <button
                    onClick={() => {
                      handleModifyTransferRecords(
                        'TOKEN',
                        'ADD',
                        setTokenTransferParamValues,
                        undefined,
                        masterTokenParam.fieldValue.tokenType === 'FUNGIBLE'
                          ? generateInitialFungibleTokenTransferParamValues()
                          : generateInitialNonFungibleTokenTransferParamValues(),
                        masterTokenParam.fieldValue.tokenType === 'FUNGIBLE' ? 'transfers' : 'nftTransfers',
                        masterTokenParam.fieldKey
                      );
                    }}
                    className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
                  >
                    Add more transfer pair
                  </button>

                  {/* accountID && amount && isApprovalA */}
                  {masterTokenParam.fieldValue.tokenType === 'FUNGIBLE' && (
                    <div className="flex flex-col gap-6 items-center w-full">
                      {/* {fungibleTokenTransferParamValues.map((paramValue) => ( */}
                      {masterTokenParam.fieldValue.transfers.map((paramValue) => (
                        <CryptoTransferInputFields
                          key={paramValue.fieldKey}
                          paramValue={paramValue}
                          handleTokenTransferInputOnChange={handleTokenTransferInputOnChange}
                          handleModifyRecords={() => {
                            handleModifyTransferRecords(
                              'TOKEN',
                              'REMOVE',
                              setTokenTransferParamValues,
                              paramValue.fieldKey,
                              undefined,
                              'transfers',
                              masterTokenParam.fieldKey
                            );
                          }}
                          masterTokenParam={masterTokenParam}
                          mode={'TOKEN'}
                        />
                      ))}
                    </div>
                  )}

                  {/* senderAccountID && receiverAccountID*/}
                  {masterTokenParam.fieldValue.tokenType === 'NON_FUNGIBLE' && (
                    <div className="flex flex-col gap-6 items-center w-full">
                      {masterTokenParam.fieldValue.nftTransfers.map((paramValue) => (
                        <div key={paramValue.fieldKey} className="flex gap-6 items-center w-full">
                          {(
                            ['senderAccountID', 'receiverAccountID', 'serialNumber'] as (
                              | 'senderAccountID'
                              | 'receiverAccountID'
                              | 'serialNumber'
                            )[]
                          ).map((paramKey) => (
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
                              handleInputOnChange={(e) =>
                                handleTokenTransferInputOnChange(
                                  e,
                                  masterTokenParam.fieldKey,
                                  paramValue.fieldKey,
                                  'nftTransfers',
                                  paramKey
                                )
                              }
                            />
                          ))}

                          {/* isApproval B*/}
                          <div>
                            <Tooltip
                              label={htsCryptoTransferParamFields.isApprovalB.explanation}
                              placement="top"
                              fontWeight={'medium'}
                            >
                              <Select
                                _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
                                className="w-[200px] hover:cursor-pointer rounded-md border-white/30"
                                placeholder="Approval Status"
                                onChange={(e) =>
                                  handleTokenTransferInputOnChange(
                                    e,
                                    masterTokenParam.fieldKey,
                                    paramValue.fieldKey,
                                    'nftTransfers',
                                    'isApprovalB'
                                  )
                                }
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
                              handleModifyTokenAddresses={() => {
                                handleModifyTransferRecords(
                                  'TOKEN',
                                  'REMOVE',
                                  setTokenTransferParamValues,
                                  paramValue.fieldKey,
                                  undefined,
                                  'nftTransfers',
                                  masterTokenParam.fieldKey
                                );
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* delete key button */}
                <div className="w-fit flex items-start">
                  <SharedRemoveFieldsButton
                    fieldKey={masterTokenParam.fieldKey}
                    handleModifyTokenAddresses={() => {
                      handleModifyMasterTokenTransferRecords('REMOVE', masterTokenParam.fieldKey);
                    }}
                  />
                </div>
              </div>
              <hr className="border-hedera-green w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenTransferForm;
