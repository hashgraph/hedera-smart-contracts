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
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Contract, isAddress } from 'ethers';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { manageTokenStatus } from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { SharedExecuteButton, SharedFormInputField } from '../../../shared/components/ParamInputForm';
import { htsTokenStatusParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'PAUSE' | 'UNPAUSE';

const ManageTokenStatus = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const initialParamValues = { hederaTokenAddress: '', feeValue: '' };
  const [paramValues, setParamValues] = useState(initialParamValues);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_MANAGE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-STATUS'];
  const [isLoading, setIsLoading] = useState({
    pauseLoading: false,
    unpauseLoading: false,
  });

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

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
      signerAddress,
      HEDERA_NETWORK,
      API,
      paramValues.hederaTokenAddress,
      Number(paramValues.feeValue)
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
        transactionResultStorageKey,
        tokenAddress: paramValues.hederaTokenAddress,
        sessionedContractAddress: currentContractAddress,
        transactionType:
          API === 'PAUSE'
            ? HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_PAUSE
            : HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_UNPAUSE,
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
          tokenAddress: paramValues.hederaTokenAddress,
          sessionedContractAddress: currentContractAddress,
          transactionType:
            API === 'PAUSE'
              ? HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_PAUSE
              : HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_UNPAUSE,
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
          <div key={'PAUSE'} className="w-full">
            <SharedExecuteButton
              isLoading={isLoading.pauseLoading}
              handleCreatingFungibleToken={() => handleUpdateTokenStatus('PAUSE')}
              buttonTitle={'Pause Token'}
            />
          </div>

          <SharedFormInputField
            param={'feeValue'}
            paramValue={paramValues.feeValue}
            handleInputOnChange={handleInputOnChange}
            paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.large}
            paramType={'number'}
            paramKey={'feeValue'}
            explanation={'Optional gas limit for the transaction.'}
            paramClassName={'border-white/30 rounded-xl'}
            paramPlaceholder={'Gas limit...'}
            paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          />

          <div key={'UNPAUSE'} className="w-full">
            <SharedExecuteButton
              isLoading={isLoading.unpauseLoading}
              handleCreatingFungibleToken={() => handleUpdateTokenStatus('UNPAUSE')}
              buttonTitle={'Unpause Token'}
            />
          </div>
        </div>
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

export default ManageTokenStatus;
