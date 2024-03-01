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
import { useState, useMemo, useEffect } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { manageTokenDeduction } from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsTokenDeductionParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  SharedFormButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'WIPE_FUNGIBLE' | 'WIPE_NON_FUNGIBLE' | 'BURN';

const ManageTokenDeduction = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('WIPE_FUNGIBLE');
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_MANAGE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-REDUCTION'];
  const initialParamValues = {
    amount: '',
    feeValue: '',
    serialNumbers: '',
    accountAddress: '',
    hederaTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: string }[] = [
    {
      API: 'WIPE_FUNGIBLE',
      apiSwitchTitle: 'Wipe Fungible',
      executeTitle: 'Wipe Fungible Token',
    },
    {
      API: 'WIPE_NON_FUNGIBLE',
      apiSwitchTitle: 'Wipe Non-Fungible',
      executeTitle: 'Wipe Non-Fungible Token',
    },
    { API: 'BURN', apiSwitchTitle: 'Burn Token', executeTitle: 'Burn Token' },
  ];

  const transactionTypeMap = {
    BURN: HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_BURN,
    WIPE_FUNGIBLE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_WIPE_TOKEN,
    WIPE_NON_FUNGIBLE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_WIPE_NFT,
  };

  const tokenCommonFields = useMemo(() => {
    if (APIMethods === 'WIPE_FUNGIBLE') {
      return ['hederaTokenAddress', 'accountAddress', 'amount'];
    } else if (APIMethods === 'WIPE_NON_FUNGIBLE') {
      return ['hederaTokenAddress', 'accountAddress', 'serialNumbers'];
    } else {
      return ['hederaTokenAddress', 'amount', 'serialNumbers'];
    }
  }, [APIMethods]);

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

  /** @dev handle invoking the API to interact with smart contract and update token reduction */
  const handleUpdateTokenDeduction = async (API: API_NAMES) => {
    // destructuring param values
    const { amount, serialNumbers, feeValue, accountAddress, hederaTokenAddress } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API,
      amount,
      accountAddress,
      hederaTokenAddress,
      serialNumber: serialNumbers,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method APIS
    const { result, transactionHash, err } = await manageTokenDeduction(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      hederaTokenAddress,
      Number(feeValue),
      accountAddress,
      amount,
      serialNumbers.split(',')
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        tokenAddress: hederaTokenAddress,
        transactionType: transactionTypeMap[API],
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
          tokenAddress: hederaTokenAddress,
          txHash: transactionHash as string,
          transactionType: transactionTypeMap[API],
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
        <div className="flex gap-3 w-full">
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

        {/* form fields */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsTokenDeductionParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenDeductionParamFields as any)[param].paramKey}
                paramType={(htsTokenDeductionParamFields as any)[param].inputType}
                paramSize={(htsTokenDeductionParamFields as any)[param].inputSize}
                explanation={(htsTokenDeductionParamFields as any)[param].explanation}
                paramClassName={(htsTokenDeductionParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenDeductionParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenDeductionParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
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
                  handleInvokingAPIMethod={() => handleUpdateTokenDeduction(APIButton.API)}
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

export default ManageTokenDeduction;
