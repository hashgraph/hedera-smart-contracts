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
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { handleAPIErrors } from '../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../hooks/useToastSuccessful';
import { handleExchangeRate } from '@/api/hedera/exchange-rate-interactions';
import { TRANSACTION_PAGE_SIZE } from '../../hts/shared/states/commonStates';
import { usePaginatedTxResults } from '../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../hooks/useUpdateLocalStorage';
import { SharedExecuteButton, SharedFormInputField } from '../../hts/shared/components/ParamInputForm';
import useFilterTransactionsByContractAddress from '../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'CENT_TO_BAR' | 'BAR_TO_CENT';

const HederaExchangeRateMethods = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const initialParamValues = { amountToConvert: '', feeValue: '' };
  const [paramValues, setParamValues] = useState(initialParamValues);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.EXCHANGE_RATE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['EXCHANGE-RATE-RESULT']['EXCHANGE-RATE'];
  const [isLoading, setIsLoading] = useState({
    CENT_TO_BAR: false,
    BAR_TO_CENT: false,
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

  /** @dev handle invoking the API to interact with IHRC contract*/
  const handleExecuteExchangeRateAPIs = async (API: API_NAMES) => {
    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'ExchangeRate',
      amount: paramValues.amountToConvert,
    });

    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn isLoading on
    setIsLoading((prev) => ({ ...prev, [API]: true }));

    // invoke method APIS
    const { transactionHash, err, convertedAmount } = await handleExchangeRate(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      Number(paramValues.amountToConvert),
      Number(paramValues.feeValue)
    );

    // turn isLoading off
    setIsLoading((prev) => ({ ...prev, [API]: false }));

    // handle err
    if (err || !convertedAmount) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        initialAmount: paramValues.amountToConvert,
        sessionedContractAddress: currentContractAddress,
        transactionType:
          API === 'BAR_TO_CENT'
            ? HEDERA_COMMON_TRANSACTION_TYPE.HIP475_BAR_TO_CENT
            : HEDERA_COMMON_TRANSACTION_TYPE.HIP475_CENT_TO_BAR,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          APICalled: API,
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          initialAmount: paramValues.amountToConvert,
          convertedAmount: convertedAmount.toString(),
          sessionedContractAddress: currentContractAddress,
          transactionType:
            API === 'BAR_TO_CENT'
              ? HEDERA_COMMON_TRANSACTION_TYPE.HIP475_BAR_TO_CENT
              : HEDERA_COMMON_TRANSACTION_TYPE.HIP475_CENT_TO_BAR,
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
    toastTitle: 'Exchange successfully',
    resetParamValues: initialParamValues,
  });

  return (
    <div className="w-full mx-3 flex justify-center flex-col gap-20">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* Amount to convert */}
        <SharedFormInputField
          param={'amountToConvert'}
          handleInputOnChange={handleInputOnChange}
          paramValue={paramValues.amountToConvert}
          paramKey={'amountToConvert'}
          paramType={'number'}
          paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          explanation={`represents the amount to convert`}
          paramClassName={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
          paramPlaceholder={'Amount to convert...'}
          paramFocusColor={HEDERA_BRANDING_COLORS.violet}
        />

        {/* Execute button */}
        <div className="flex gap-6">
          <SharedExecuteButton
            isLoading={isLoading.BAR_TO_CENT}
            handleCreatingFungibleToken={() => handleExecuteExchangeRateAPIs('BAR_TO_CENT')}
            buttonTitle={'Tinybars to Tinycents'}
          />
          <div className="w-2/3">
            <SharedFormInputField
              param={'feeValue'}
              paramType={'number'}
              paramKey={'feeValue'}
              paramPlaceholder={'Gas limit...'}
              paramValue={paramValues.feeValue}
              handleInputOnChange={handleInputOnChange}
              explanation={'Optional gas limit for the transaction.'}
              paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.large}
              paramFocusColor={HEDERA_BRANDING_COLORS.violet}
              paramClassName={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
            />
          </div>
          <SharedExecuteButton
            isLoading={isLoading.CENT_TO_BAR}
            handleCreatingFungibleToken={() => handleExecuteExchangeRateAPIs('CENT_TO_BAR')}
            buttonTitle={'Tinycents To Tinybars'}
          />
        </div>
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="ExchangeRate"
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

export default HederaExchangeRateMethods;
