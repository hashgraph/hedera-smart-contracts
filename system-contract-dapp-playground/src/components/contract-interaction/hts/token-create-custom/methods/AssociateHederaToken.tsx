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
import { handleAPIErrors, handleSanitizeHederaFormInputs } from '../shared/sharedMethods';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { associateHederaTokensToAccounts } from '@/api/hedera/tokenCreateCustom-interactions';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import {
  SharedExecuteButton,
  SharedFormInputField,
  TransactionResultTable,
} from '../shared/sharedComponents';
import { htsTokenAssociateParamFields } from '@/utils/contract-interactions/HTS/constant';

interface PageProps {
  baseContract: Contract;
}

const AssociateHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 10;
  const [isLoading, setIsLoading] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey = 'hedera_HTS_token-association_results';
  const [tokenType, setTokenType] = useState<'FUNGIBLE' | 'NON_FUNGIBLE'>('FUNGIBLE');
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const [isTokenAssociatinguccessful, setIsTokenAssociatingSuccessful] = useState(false);
  const tokenAssociateFields = ['tokenAddresses', 'associatingAddress'];
  const [paramValues, setParamValues] = useState<any>({
    tokenAddresses: '',
    associatingAddress: '',
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

  /** @dev handle invoking the API to interact with smart contract to associate tokens */
  const handleAssociateTokens = async () => {
    const { tokenAddresses, associatingAddress } = paramValues;

    // convert tokenAddresses into a string[]
    const tokenAddressesArray: string[] = Array.from(
      new Set(tokenAddresses.split(',').map((address: string) => address.trim()))
    );

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'Associate',
      tokenAddressesArray,
      associatingAddress,
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
    const { transactionHash, err } = await associateHederaTokensToAccounts(
      baseContract,
      tokenAddressesArray,
      associatingAddress
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
        associatingAddress,
        tokenAddressesToAssociate: tokenAddressesArray,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'sucess',
          txHash: transactionHash as string,
          associatingAddress,
          tokenAddressesToAssociate: tokenAddressesArray,
        },
      ]);

      setIsTokenAssociatingSuccessful(true);
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
    if (isTokenAssociatinguccessful) {
      toaster({
        title: '🎉 Token association successful 🎉',
        status: 'success',
        position: 'top',
      });

      // reset values
      setParamValues({
        tokenAddresses: '',
        associatingAddress: '',
      });
      setIsTokenAssociatingSuccessful(false);
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [isTokenAssociatinguccessful, toaster]);

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Association form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* tokenAddresses & associatingAccount*/}
        {tokenAssociateFields.map((param) => {
          return (
            <div key={(htsTokenAssociateParamFields as any)[param].paramKey}>
              <SharedFormInputField
                paramKey={(htsTokenAssociateParamFields as any)[param].paramKey}
                explanation={(htsTokenAssociateParamFields as any)[param].explanation}
                paramValue={paramValues[param]}
                paramType={(htsTokenAssociateParamFields as any)[param].inputType}
                param={param}
                paramPlaceholder={(htsTokenAssociateParamFields as any)[param].inputPlaceholder}
                paramSize={(htsTokenAssociateParamFields as any)[param].inputSize}
                paramFocusColor={(htsTokenAssociateParamFields as any)[param].inputFocusBorderColor}
                paramClassName={(htsTokenAssociateParamFields as any)[param].inputClassname}
                handleInputOnChange={handleInputOnChange}
              />
            </div>
          );
        })}

        {/* Execute button */}
        <SharedExecuteButton
          isLoading={isLoading}
          buttonTitle={`Associate Tokens`}
          handleCreatingFungibleToken={handleAssociateTokens}
        />
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="TokenAssociate"
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

export default AssociateHederaToken;
