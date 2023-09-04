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

import { isAddress } from 'ethers';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { getWalletProvider } from '@/api/wallet';
import { handleIHRCAPIs } from '@/api/hedera/ihrc-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../hts/shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../hts/shared/states/commonStates';
import { useToastSuccessful } from '../../hts/shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../hts/shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../hts/shared/components/TransactionResultTable';
import { useUpdateTransactionResultsToLocalStorage } from '../../hts/shared/hooks/useUpdateLocalStorage';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../hts/shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedExecuteButton,
  SharedFormInputField,
} from '../../hts/shared/components/ParamInputForm';

interface PageProps {
  method: string;
  network: string;
}

type API_NAMES = 'ASSOCIATE' | 'DISSOCIATE';

const HederaIHRCMethods = ({ method, network }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState({
    ASSOCIATE: false,
    DISSOCIATE: false,
  });
  const [isSuccessful, setIsSuccessful] = useState(false);
  const transactionResultStorageKey = `HEDERA.IHRC.IHRC-RESULTS`;
  const initialParamValues = { hederaTokenAddress: '', feeValue: '' };
  const [paramValues, setParamValues] = useState(initialParamValues);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);

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
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    transactionResults
  );

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with IHRC contract*/
  const handleExecuteIHRCAPIs = async (API: API_NAMES) => {
    // sanitize params
    let sanitizeErr;
    if (!isAddress(paramValues.hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (paramValues.feeValue === '') {
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

    // prepare wallet signer
    const walletProvider = getWalletProvider();
    const walletSigner = await walletProvider!.walletProvider!.getSigner();

    // turn isLoading on
    setIsLoading((prev) => ({ ...prev, [API]: true }));

    // invoke method APIS
    const { transactionHash, err } = await handleIHRCAPIs(
      API,
      paramValues.hederaTokenAddress,
      walletSigner,
      Number(paramValues.feeValue)
    );

    // turn isLoading off
    setIsLoading((prev) => ({ ...prev, [API]: false }));

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionType: `HRC-${API}`,
        tokenAddress: paramValues.hederaTokenAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'sucess',
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          transactionType: `HRC-${API}`,
          tokenAddress: paramValues.hederaTokenAddress,
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
    <div className="w-full mx-3 flex justify-center flex-col gap-20 -mt-6">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* Hedera token address */}
        <SharedFormInputField
          param={'hederaTokenAddress'}
          handleInputOnChange={handleInputOnChange}
          paramValue={paramValues['hederaTokenAddress']}
          paramKey={'hederaTokenAddress'}
          paramType={'text'}
          paramSize={'md'}
          explanation={`represents the Hedera Token to ${method}`}
          paramClassName={'w-full border-white/30'}
          paramPlaceholder={'Token address...'}
          paramFocusColor={'#A98DF4'}
        />

        {/* Execute button */}
        <div className="flex gap-9">
          <SharedExecuteButton
            isLoading={isLoading.ASSOCIATE}
            handleCreatingFungibleToken={() => handleExecuteIHRCAPIs('ASSOCIATE')}
            buttonTitle={'Associate Token'}
          />
          <SharedFormInputField
            param={'feeValue'}
            paramValue={paramValues.feeValue}
            handleInputOnChange={handleInputOnChange}
            paramSize={'lg'}
            paramType={'number'}
            paramKey={'feeValue'}
            explanation={'Gas limit for the transaction'}
            paramClassName={'border-white/30 rounded-xl'}
            paramPlaceholder={'Gas limit...'}
            paramFocusColor={'#A98DF4'}
          />
          <SharedExecuteButton
            isLoading={isLoading.DISSOCIATE}
            handleCreatingFungibleToken={() => handleExecuteIHRCAPIs('DISSOCIATE')}
            buttonTitle={'Dissociate Token'}
          />
        </div>
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="TokenCreate"
          hederaNetwork={network}
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

export default HederaIHRCMethods;
