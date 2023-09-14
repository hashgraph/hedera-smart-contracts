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
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../../shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../shared/hooks/useToastSuccessful';
import { HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { queryTokenStatusInformation } from '@/api/hedera/tokenQuery-interactions';
import { usePaginatedTxResults } from '../../../shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../shared/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../shared/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../shared/hooks/useUpdateLocalStorage';
import { htsQueryTokenStatusParamFields } from '@/utils/contract-interactions/HTS/token-query/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import { SharedExecuteButton, SharedFormInputField } from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'IS_KYC' | 'IS_FROZEN';
type EVENT_NAMES = 'KycGranted' | 'Frozen';

const QueryTokenStatusInfomation = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-QUERY']['TOKEN-STATUS-INFO'];
  const initialParamValues = {
    hederaTokenAddress: '',
    accountAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const tokenCommonFields = ['hederaTokenAddress', 'accountAddress'];
  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'IS_KYC',
      apiSwitchTitle: '',
      executeTitle: 'Query KYC Status',
    },
    {
      API: 'IS_FROZEN',
      apiSwitchTitle: '',
      executeTitle: 'Query Frozen Status',
    },
  ];
  const [isLoading, setIsLoading] = useState({
    kycLoading: false,
    frozenLoading: false,
  });

  // prepare events map
  const eventMaps: Record<API_NAMES, EVENT_NAMES> = {
    IS_KYC: 'KycGranted',
    IS_FROZEN: 'Frozen',
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
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResults);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and update token status */
  const handleQueryTokenStatusInfo = async (API: API_NAMES) => {
    // destructuring param values
    const { hederaTokenAddress, accountAddress } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'QueryTokenStatus',
      hederaTokenAddress,
      accountAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading((prev) => ({
      ...prev,
      kycLoading: API === 'IS_KYC',
      frozenLoading: API === 'IS_FROZEN',
    }));

    // invoking method API
    const tokenInfoResult = await queryTokenStatusInformation(
      baseContract,
      API,
      hederaTokenAddress,
      accountAddress
    );

    // turn is loading off
    setIsLoading((prev) => ({
      ...prev,
      kycLoading: API === 'IS_KYC' && false,
      frozenLoading: API === 'IS_FROZEN' && false,
    }));

    // handle err
    if (tokenInfoResult.err) {
      handleAPIErrors({
        toaster,
        APICalled: API,
        setTransactionResults,
        err: tokenInfoResult.err,
        accountAddress: paramValues.accountAddress,
        tokenAddress: paramValues.hederaTokenAddress,
        transactionHash: tokenInfoResult.transactionHash,
      });
      return;
    } else {
      // handle successful
      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          status: 'success',
          accountAddress: paramValues.accountAddress,
          tokenAddress: paramValues.hederaTokenAddress,
          txHash: tokenInfoResult.transactionHash as string,
          tokenInfo: Number(tokenInfoResult[eventMaps[API]]),
        },
      ]);

      // turn on successful
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
    toastTitle: 'Token query successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Query token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* hederaTokenAddress & targetApprovedAddress */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsQueryTokenStatusParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsQueryTokenStatusParamFields as any)[param].paramKey}
                paramType={(htsQueryTokenStatusParamFields as any)[param].inputType}
                paramSize={(htsQueryTokenStatusParamFields as any)[param].inputSize}
                explanation={(htsQueryTokenStatusParamFields as any)[param].explanation}
                paramClassName={(htsQueryTokenStatusParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsQueryTokenStatusParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsQueryTokenStatusParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        <div className="flex gap-12">
          {/* Execute buttons */}
          {APIButtonTitles.map((APIButton) => {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButton
                  isLoading={APIButton.API === 'IS_KYC' ? isLoading.kycLoading : isLoading.frozenLoading}
                  handleCreatingFungibleToken={() => handleQueryTokenStatusInfo(APIButton.API)}
                  buttonTitle={APIButton.executeTitle}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="QueryTokenStatus"
          hederaNetwork={hederaNetwork}
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

export default QueryTokenStatusInfomation;
