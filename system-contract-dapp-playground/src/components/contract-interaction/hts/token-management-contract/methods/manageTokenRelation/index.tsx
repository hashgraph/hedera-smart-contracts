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

import Cookies from 'js-cookie';
import { Contract } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import TokenAddressesInputForm from '../../../shared/components/TokenAddressesInputForm';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { manageTokenRelation } from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsTokenRelationParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  SharedFormButton,
  SharedExecuteButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'REVOKE_KYC' | 'FREEZE' | 'UNFREEZE' | 'DISSOCIATE_TOKEN';

const ManageTokenRelation = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('REVOKE_KYC');
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_MANAGE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-RELATION'];
  const [isFreezeLoading, setIsFreezeLoading] = useState({
    freezeLoading: false,
    unfreezeLoading: false,
  });
  const tokenCommonFields = useMemo(() => {
    if (APIMethods === 'DISSOCIATE_TOKEN') {
      return ['accountAddress'];
    } else {
      return ['hederaTokenAddress', 'accountAddress'];
    }
  }, [APIMethods]);

  const initialParamValues = {
    feeValue: '',
    accountAddress: '',
    hederaTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const initialTokenAddressesValues = { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' };
  const [hederaTokenAddresses, setHederaTokenAddresses] = useState<
    { fieldKey: string; fieldValue: string }[]
  >([initialTokenAddressesValues]);

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'REVOKE_KYC',
      apiSwitchTitle: 'Revoke Token KYC',
      executeTitle: 'Revoke Token KYC',
    },
    {
      API: 'FREEZE',
      apiSwitchTitle: 'Freeze Status',
      executeTitle: {
        freeze: 'Freeze Token',
        unfreeze: 'Unfreeze Token',
      },
    },
    {
      API: 'DISSOCIATE_TOKEN',
      apiSwitchTitle: 'Token Dissociation',
      executeTitle: 'Dissociate Token',
    },
  ];

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  const transactionTypeMap = {
    FREEZE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_FREEZE_TOKEN,
    REVOKE_KYC: HEDERA_COMMON_TRANSACTION_TYPE.HTS_REVOKE_KYC,
    UNFREEZE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_UNFREEZE_TOKEN,
    DISSOCIATE_TOKEN: HEDERA_COMMON_TRANSACTION_TYPE.HTS_DISSOCIATE_TOKEN,
  };

  /** @dev handle adding metadata */
  const handleModifyTokenAddresses = (type: 'ADD' | 'REMOVE', removingFieldKey?: string) => {
    switch (type) {
      case 'ADD':
        setHederaTokenAddresses((prev) => [
          ...prev,
          { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' },
        ]);
        break;
      case 'REMOVE':
        if (hederaTokenAddresses.length > 1) {
          setHederaTokenAddresses((prev) => prev.filter((field) => field.fieldKey !== removingFieldKey));
        }
    }
  };

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string, fieldKey?: string) => {
    if (param === 'tokenAddresses') {
      setHederaTokenAddresses((prev) =>
        prev.map((field) => {
          if (field.fieldKey === fieldKey) {
            field.fieldValue = e.target.value;
          }
          return field;
        })
      );
    }
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and update token relation */
  const handleUpdateTokenRelation = async (API: API_NAMES) => {
    // convert hederaTokenAddresses into a string[]
    const tokenAddresses = hederaTokenAddresses.map((field) => field.fieldValue.trim());
    // sanitize params
    let sanitizeErr;
    if (API === 'DISSOCIATE_TOKEN') {
      sanitizeErr = handleSanitizeHederaFormInputs({
        API: 'Associate',
        associatingAddress: paramValues.accountAddress,
        tokenAddresses,
      });
    } else {
      sanitizeErr = handleSanitizeHederaFormInputs({
        API: 'UpdateTokenRelation',
        hederaTokenAddress: paramValues.hederaTokenAddress,
        accountAddress: paramValues.accountAddress,
      });
    }
    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }
    // turn isLoading on
    setIsFreezeLoading({
      freezeLoading: API === 'FREEZE',
      unfreezeLoading: API === 'UNFREEZE',
    });
    setIsLoading(true);

    // invoke method API
    const { result, transactionHash, err } = await manageTokenRelation(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      paramValues.accountAddress,
      Number(paramValues.feeValue),
      paramValues.hederaTokenAddress,
      API === 'DISSOCIATE_TOKEN' ? tokenAddresses : undefined
    );

    // turn isLoading off
    setIsFreezeLoading({
      freezeLoading: API === 'FREEZE' && false,
      unfreezeLoading: API === 'UNFREEZE' && false,
    });
    setIsLoading(false);

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        transactionType: transactionTypeMap[API],
        tokenAddress: paramValues.hederaTokenAddress,
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          transactionType: transactionTypeMap[API],
          tokenAddress: paramValues.hederaTokenAddress,
          sessionedContractAddress: currentContractAddress,
        },
      ]);

      setIsSuccessful(true);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev toast successful */
  useToastSuccessful({
    toaster,
    isSuccessful,
    setParamValues,
    setIsSuccessful,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token update successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* API methods */}
        <div className="w-full flex gap-3">
          {APIButtonTitles.map((APIButton) => (
            <div key={APIButton.API} className="w-full">
              <SharedFormButton
                switcher={APIMethods === APIButton.API}
                buttonTitle={APIButton.apiSwitchTitle}
                handleButtonOnClick={() => setAPIMethods(APIButton.API)}
                explanation={''}
              />
            </div>
          ))}
        </div>

        {/* hederaTokenAddress & targetApprovedAddress */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsTokenRelationParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenRelationParamFields as any)[param].paramKey}
                paramType={(htsTokenRelationParamFields as any)[param].inputType}
                paramSize={(htsTokenRelationParamFields as any)[param].inputSize}
                explanation={(htsTokenRelationParamFields as any)[param].explanation}
                paramClassName={(htsTokenRelationParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenRelationParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenRelationParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* Token addresses */}
        {APIMethods === 'DISSOCIATE_TOKEN' && (
          <TokenAddressesInputForm
            tokenAddresses={hederaTokenAddresses}
            handleInputOnChange={handleInputOnChange}
            handleModifyTokenAddresses={handleModifyTokenAddresses}
          />
        )}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === 'FREEZE' && APIButton.API === 'FREEZE') {
            return (
              <div key={APIButton.API} className="flex gap-9">
                <SharedExecuteButton
                  isLoading={isFreezeLoading.freezeLoading}
                  handleCreatingFungibleToken={() => handleUpdateTokenRelation('FREEZE')}
                  buttonTitle={APIButton.executeTitle.freeze}
                />
                <SharedFormInputField
                  param={'feeValue'}
                  paramType={'number'}
                  paramKey={'feeValue'}
                  paramValue={paramValues.feeValue}
                  paramPlaceholder={'Gas limit...'}
                  handleInputOnChange={handleInputOnChange}
                  explanation={'Optional gas limit for the transaction.'}
                  paramClassName={'border-white/30 rounded-xl'}
                  paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.large}
                  paramFocusColor={HEDERA_BRANDING_COLORS.purple}
                />
                <SharedExecuteButton
                  isLoading={isFreezeLoading.unfreezeLoading}
                  handleCreatingFungibleToken={() => handleUpdateTokenRelation('UNFREEZE')}
                  buttonTitle={APIButton.executeTitle.unfreeze}
                />
              </div>
            );
          } else if (APIMethods === APIButton.API) {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButtonWithFee
                  isLoading={isLoading}
                  feeType={'GAS'}
                  paramValues={paramValues.feeValue}
                  placeHolder={'Gas limit...'}
                  executeBtnTitle={APIButton.executeTitle}
                  handleInputOnChange={handleInputOnChange}
                  explanation={'Optional gas limit for the transaction.'}
                  handleInvokingAPIMethod={() => handleUpdateTokenRelation(APIButton.API)}
                />
              </div>
            );
          }
        })}
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="TokenCreate"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default ManageTokenRelation;
