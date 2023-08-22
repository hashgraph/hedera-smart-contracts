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

import { TransactionResult } from '@/types/contract-interactions/HTS';
import { useToast } from '@chakra-ui/react';
import { Contract } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { grantTokenKYCToAccount } from '@/api/hedera/tokenCreateCustom-interactions';
import { handleSanitizeHederaFormInputs, handleAPIErrors } from '../shared/sharedMethods';
import { htsGrantTokenKYCParamFields } from '@/utils/contract-interactions/HTS/constant';
import {
  SharedExecuteButton,
  SharedFormInputField,
  TransactionResultTable,
} from '../shared/sharedComponents';

interface PageProps {
  baseContract: Contract;
}

const GrantTokenKYC = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 10;
  const [isLoading, setIsLoading] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey = 'hedera_HTS_grant-kyc_results';
  const [tokenType, setTokenType] = useState<'FUNGIBLE' | 'NON_FUNGIBLE'>('FUNGIBLE');
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const [isKYCGrantingSuccessful, setIsKYCGrantingSuccessful] = useState(false);
  const grantKYCFields = ['hederaTokenAddress', 'grantingKYCAccountAddress'];
  const [paramValues, setParamValues] = useState<any>({
    hederaTokenAddress: '',
    grantingKYCAccountAddress: '',
  });

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageResult, err: storagedErr } = getArrayTypedValuesFromLocalStorage(
      transactionResultStorageKey
    );
    // handle err
    if (storagedErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve transaction results from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update states if storageResult is found
    if (storageResult) {
      setTransactionResults(storageResult as TransactionResult[]);

      // set the current page to the last page so it can show the latest transactions
      const maxPageNum = Math.ceil(storageResult.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [toaster]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = useMemo(() => {
    const startIndex = (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE;
    const endIndex = (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE + TRANSACTION_PAGE_SIZE;
    return transactionResults.slice(startIndex, endIndex);
  }, [currentTransactionPage, transactionResults]);

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
    // @logic if recipientAddress is set => mintHederaTokenToAddress()
    // @logic if recipientAddress is NOT set => mintHederaToken()
    const { transactionHash, err } = await grantTokenKYCToAccount(
      baseContract,
      hederaTokenAddress,
      grantingKYCAccountAddress
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        hederaTokenAddress,
        setTransactionResults,
        grantingKYCAccountAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'sucess',
          txHash: transactionHash as string,
          tokenAddress: hederaTokenAddress,
          grantingKYCAccountAddress,
        },
      ]);

      setIsKYCGrantingSuccessful(true);
    }
  };

  // @dev listen to change event on transactionResults state => load to localStorage
  useEffect(() => {
    if (transactionResults.length > 0) {
      localStorage.setItem(transactionResultStorageKey, JSON.stringify(transactionResults));
    }
  }, [transactionResults]);

  // toast successful
  useEffect(() => {
    if (isKYCGrantingSuccessful) {
      toaster({
        title: '🎉 Grant Token KYC successful 🎉',
        status: 'success',
        position: 'top',
      });

      // reset values
      setParamValues({
        hederaTokenAddress: '',
        grantingKYCAccountAddress: '',
      });
      setIsKYCGrantingSuccessful(false);
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [isKYCGrantingSuccessful, toaster]);

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Grant Token KYC form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* hederaTokenAddress & grantingKYCAccountAddress*/}
        {grantKYCFields.map((param) => {
          return (
            <div key={(htsGrantTokenKYCParamFields as any)[param].paramKey}>
              <SharedFormInputField
                paramKey={(htsGrantTokenKYCParamFields as any)[param].paramKey}
                explanation={(htsGrantTokenKYCParamFields as any)[param].explanation}
                paramValue={paramValues[param]}
                paramType={(htsGrantTokenKYCParamFields as any)[param].inputType}
                param={param}
                paramPlaceholder={(htsGrantTokenKYCParamFields as any)[param].inputPlaceholder}
                paramSize={(htsGrantTokenKYCParamFields as any)[param].inputSize}
                paramFocusColor={(htsGrantTokenKYCParamFields as any)[param].inputFocusBorderColor}
                paramClassName={(htsGrantTokenKYCParamFields as any)[param].inputClassname}
                handleInputOnChange={handleInputOnChange}
              />
            </div>
          );
        })}
        {/* Execute button */}
        <SharedExecuteButton
          isLoading={isLoading}
          buttonTitle={`Grant Token KYC`}
          handleCreatingFungibleToken={handleGrantTokenKYC}
        />
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="GrantKYC"
          hederaNetwork={hederaNetwork}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          transactionResults={transactionResults}
          paginatedTransactionResults={paginatedTransactionResults}
          setCurrentTransactionPage={setCurrentTransactionPage}
          setTransactionResults={setTransactionResults}
        />
      )}
    </div>
  );
};

export default GrantTokenKYC;
