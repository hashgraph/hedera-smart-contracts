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
import { useState, useEffect } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { handleAPIErrors } from '../../shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../shared/states/commonStates';
import { useToastSuccessful } from '../../shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../shared/components/TransactionResultTable';
import { associateHederaTokensToAccounts } from '@/api/hedera/tokenCreateCustom-interactions';
import { handleSanitizeHederaFormInputs } from '../../shared/methods/handleSanitizeFormInputs';
import { SharedFormInputField, SharedExecuteButton } from '../../shared/components/ParamInputForm';
import { useUpdateTransactionResultsToLocalStorage } from '../../shared/hooks/useUpdateLocalStorage';
import { htsTokenAssociateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';

interface PageProps {
  baseContract: Contract;
}

const AssociateHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const tokenAssociateFields = ['tokenAddresses', 'associatingAddress'];
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey = 'HEDERA.HTS.TOKEN-CREATE.ASSOCIATE-TOKEN-RESULTS';
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const initialParamValues = {
    tokenAddresses: '',
    associatingAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    transactionResults
  );

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
        accountAddress: associatingAddress,
        tokenAddresses: tokenAddressesArray,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'sucess',
          txHash: transactionHash as string,
          accountAddress: associatingAddress,
          tokenAddresses: tokenAddressesArray,
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
      {/* Token Association form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* tokenAddresses & associatingAccount*/}
        {tokenAssociateFields.map((param) => {
          return (
            <div key={(htsTokenAssociateParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenAssociateParamFields as any)[param].paramKey}
                paramType={(htsTokenAssociateParamFields as any)[param].inputType}
                paramSize={(htsTokenAssociateParamFields as any)[param].inputSize}
                explanation={(htsTokenAssociateParamFields as any)[param].explanation}
                paramClassName={(htsTokenAssociateParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenAssociateParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenAssociateParamFields as any)[param].inputFocusBorderColor}
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

export default AssociateHederaToken;
