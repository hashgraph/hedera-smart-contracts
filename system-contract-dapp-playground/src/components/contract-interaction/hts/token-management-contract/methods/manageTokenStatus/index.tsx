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
import { Contract, isAddress } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../../shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../shared/hooks/useToastSuccessful';
import { manageTokenStatus } from '@/api/hedera/tokenManagement-interactions';
import { HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { usePaginatedTxResults } from '../../../shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../shared/components/TransactionResultTable';
import { useUpdateTransactionResultsToLocalStorage } from '../../../shared/hooks/useUpdateLocalStorage';
import { htsTokenStatusParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import { SharedExecuteButton, SharedFormInputField } from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'PAUSE' | 'UNPAUSE';

const ManageTokenStatus = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const initialParamValues = { hederaTokenAddress: '' };
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [paramValues, setParamValues] = useState(initialParamValues);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-STATUS'];
  const [isLoading, setIsLoading] = useState({
    pauseLoading: false,
    unpauseLoading: false,
  });
  const APIButtonTitles: { API: API_NAMES; executeTitle: string }[] = [
    {
      API: 'PAUSE',
      executeTitle: 'Pause Token',
    },
    {
      API: 'UNPAUSE',
      executeTitle: 'Unpause Token',
    },
  ];

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
  const handleUpdateTokenStatus = async (API: 'PAUSE' | 'UNPAUSE') => {
    // sanitize params
    if (!isAddress(paramValues.hederaTokenAddress)) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: 'Invalid token address',
      });
      return;
    }

    // turn isLoading on
    setIsLoading({
      pauseLoading: API === 'PAUSE',
      unpauseLoading: API === 'UNPAUSE',
    });

    // invoke method APIS
    const { result, transactionHash, err } = await manageTokenStatus(
      baseContract,
      API,
      paramValues.hederaTokenAddress
    );

    // turn isLoading off
    setIsLoading({
      pauseLoading: API === 'PAUSE' && false,
      unpauseLoading: API === 'UNPAUSE' && false,
    });

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        tokenAddress: paramValues.hederaTokenAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          tokenAddress: paramValues.hederaTokenAddress,
          txHash: transactionHash as string,
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
        {/* Hedera token address */}
        <SharedFormInputField
          param={'hederaTokenAddress'}
          handleInputOnChange={handleInputOnChange}
          paramValue={paramValues['hederaTokenAddress']}
          paramKey={(htsTokenStatusParamFields as any)['hederaTokenAddress'].paramKey}
          paramType={(htsTokenStatusParamFields as any)['hederaTokenAddress'].inputType}
          paramSize={(htsTokenStatusParamFields as any)['hederaTokenAddress'].inputSize}
          explanation={(htsTokenStatusParamFields as any)['hederaTokenAddress'].explanation}
          paramClassName={(htsTokenStatusParamFields as any)['hederaTokenAddress'].inputClassname}
          paramPlaceholder={(htsTokenStatusParamFields as any)['hederaTokenAddress'].inputPlaceholder}
          paramFocusColor={(htsTokenStatusParamFields as any)['hederaTokenAddress'].inputFocusBorderColor}
        />

        {/* Execute button */}
        <div className="flex gap-9">
          {/* Execute buttons */}
          {APIButtonTitles.map((APIButton) => {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButton
                  isLoading={APIButton.API === 'PAUSE' ? isLoading.pauseLoading : isLoading.unpauseLoading}
                  handleCreatingFungibleToken={() => handleUpdateTokenStatus(APIButton.API)}
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
          API="TokenCreate"
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

export default ManageTokenStatus;
