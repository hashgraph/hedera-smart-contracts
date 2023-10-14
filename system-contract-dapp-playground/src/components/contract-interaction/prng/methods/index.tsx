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
import { useEffect, useState } from 'react';
import { handlePRGNAPI } from '@/api/hedera/prng-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../hts/shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../hts/shared/states/commonStates';
import { useToastSuccessful } from '../../hts/shared/hooks/useToastSuccessful';
import { HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { usePaginatedTxResults } from '../../hts/shared/hooks/usePaginatedTxResults';
import { SharedExecuteButtonWithFee } from '../../hts/shared/components/ParamInputForm';
import { TransactionResultTable } from '../../hts/shared/components/TransactionResultTable';
import { useUpdateTransactionResultsToLocalStorage } from '../../hts/shared/hooks/useUpdateLocalStorage';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../hts/shared/methods/handleRetrievingTransactionResultsFromLocalStorage';

interface PageProps {
  baseContract: Contract;
}

const HederaPRNGMethods = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const initialParamValues = { feeValue: '' };
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [gasLimit, setGasLimit] = useState(initialParamValues);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['PRNG-RESULT']['PSEUDO-RANDOM'];

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
  const handleInputOnChange = async (e: any, param: string) => {
    setGasLimit((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract*/
  const handleRetrievingPseudoRandomSeed = async () => {
    // sanitize params
    let sanitizeErr;
    if (Number(gasLimit.feeValue) < 0) {
      sanitizeErr = 'Gas limit cannot be negative';
    } else if (Number(gasLimit.feeValue) === 0) {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }

    if (sanitizeErr) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: sanitizeErr,
      });
      return;
    }

    // turn isLoading on
    setIsLoading(true);

    // invoke method API
    const { transactionHash, pseudoRandomSeed, err } = await handlePRGNAPI(
      baseContract,
      Number(gasLimit.feeValue)
    );

    // turn isLoading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionType: `PRNG`,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          transactionType: `PRNG`,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          pseudoRandomSeed,
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
    setIsSuccessful,
    transactionResults,
    setCurrentTransactionPage,
    setParamValues: setGasLimit,
    resetParamValues: initialParamValues,
    toastTitle: 'New Pseudo Random Seed successfully retrieved',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Create form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        <SharedExecuteButtonWithFee
          feeType={'GAS'}
          isLoading={isLoading}
          placeHolder={'Gas limit...'}
          paramValues={gasLimit.feeValue}
          handleInputOnChange={handleInputOnChange}
          executeBtnTitle={'Get Pseudo Random Seed'}
          explanation={'Gas limit for the transaction.'}
          handleInvokingAPIMethod={handleRetrievingPseudoRandomSeed}
        />
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="PRNG"
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

export default HederaPRNGMethods;
