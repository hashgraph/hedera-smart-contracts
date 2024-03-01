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
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { grantTokenKYCToAccount } from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { SharedFormInputField, SharedExecuteButtonWithFee } from '../../../shared/components/ParamInputForm';
import { htsGrantTokenKYCParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const GrantTokenKYC = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const grantKYCFields = ['hederaTokenAddress', 'grantingKYCAccountAddress'];
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_CREATE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-CREATE']['TOKEN-KYC'];
  const initialParamValues = {
    feeValue: '',
    hederaTokenAddress: '',
    grantingKYCAccountAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

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

  /** @dev handle invoking the API to interact with smart contract to grant token KYC to accounts */
  const handleGrantTokenKYC = async () => {
    const { hederaTokenAddress, grantingKYCAccountAddress } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'GrantKYC',
      hederaTokenAddress,
      grantingKYCAccountAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method API
    const { transactionHash, err } = await grantTokenKYCToAccount(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      hederaTokenAddress,
      grantingKYCAccountAddress,
      Number(paramValues.feeValue)
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        tokenAddress: hederaTokenAddress,
        accountAddress: grantingKYCAccountAddress,
        sessionedContractAddress: currentContractAddress,
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_GRANT_KYC,
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
          accountAddress: grantingKYCAccountAddress,
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_GRANT_KYC,
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
    toastTitle: 'Token association successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Grant Token KYC form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* hederaTokenAddress & grantingKYCAccountAddress*/}
        {grantKYCFields.map((param) => {
          return (
            <div key={(htsGrantTokenKYCParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsGrantTokenKYCParamFields as any)[param].paramKey}
                paramType={(htsGrantTokenKYCParamFields as any)[param].inputType}
                paramSize={(htsGrantTokenKYCParamFields as any)[param].inputSize}
                explanation={(htsGrantTokenKYCParamFields as any)[param].explanation}
                paramClassName={(htsGrantTokenKYCParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsGrantTokenKYCParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsGrantTokenKYCParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}
        {/* Execute button */}
        <SharedExecuteButtonWithFee
          isLoading={isLoading}
          feeType={'GAS'}
          paramValues={paramValues.feeValue}
          placeHolder={'Gas limit...'}
          executeBtnTitle={'Grant Token KYC'}
          handleInputOnChange={handleInputOnChange}
          explanation={'Optional gas limit for the transaction.'}
          handleInvokingAPIMethod={() => handleGrantTokenKYC()}
        />
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="GrantKYC"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          setTransactionResults={setTransactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default GrantTokenKYC;
